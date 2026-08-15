import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, shipments, procurement, freight, customs, costs,
  documents, tasks, suppliers, emailTemplates, knowledge,
  auditLog, settings, companies, plants, departments,
  bankLc, docCheck, alertLog
} from "../drizzle/schema";
import { InsertUser } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Functions ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach(field => {
      const v = user[field];
      if (v === undefined) return;
      values[field] = v ?? null;
      updateSet[field] = v ?? null;
    });
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Dashboard ============
export async function getDashboardStats() {
  const db = await getDb(); if (!db) return { activeShipments: 0, totalCosts: 0, pendingTasks: 0, delayed: 0, totalShipments: 0, clearedShipments: 0 };
  const shipmentsResult = await db.select().from(shipments).execute();
  const tasksResult = await db.select().from(tasks).where(sql`status IN ('not_started','in_progress','on_hold')`).execute();
  const costsResult = await db.select().from(costs).execute();
  const delayedShipments = shipmentsResult.filter(s => s.status === 'delayed');
  const totalCosts = costsResult.reduce((sum, c) => sum + (c.totalCost || c.freightCost || 0), 0);
  const activeShipments = shipmentsResult.filter(s => !['delivered', 'cancelled'].includes(s.status || 'draft')).length;
  return {
    activeShipments,
    totalCosts,
    pendingTasks: tasksResult.length,
    delayed: delayedShipments.length,
    totalShipments: shipmentsResult.length,
    clearedShipments: shipmentsResult.filter(s => ['cleared', 'delivered'].includes(s.status || '')).length,
  };
}

export async function getDashboardChartData() {
  const db = await getDb(); if (!db) return { monthly: [], monthlyCosts: [] };
  const allShipments = await db.select().from(shipments).execute();
  const allCosts = await db.select().from(costs).execute();
  const monthMap: Record<string, { shipments: number; cost: number }> = {};
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const addRow = (d: Date | null | undefined, cost = 0) => {
    const dd = d instanceof Date && !Number.isNaN(d.getTime()) ? d : new Date(d as any);
    const key = dd && !Number.isNaN(dd.getTime()) ? `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}` : "unknown";
    if (!monthMap[key]) monthMap[key] = { shipments: 0, cost: 0 };
    monthMap[key].shipments += 1;
    monthMap[key].cost += cost;
  };
  // Prefer eta (planned arrival) then etd, then arrivalDate, then creation date
  allShipments.forEach(s => addRow((s as any).eta || (s as any).etd || (s as any).arrivalDate || s.createdAt));
  const costMap: Record<string, number> = {};
  allCosts.forEach(c => {
    const key = (c as any).createdAt ? `${(c as any).createdAt.getFullYear()}-${String((c as any).createdAt.getMonth()+1).padStart(2,'0')}` : "unknown";
    costMap[key] = (costMap[key] || 0) + Number((c as any).totalCost || (c as any).freightCost || 0);
  });
  Object.entries(costMap).forEach(([k, v]) => {
    const [y, m] = k.split('-');
    const key = k === "unknown" ? "unknown" : `${y}-${m}`;
    if (!monthMap[key]) monthMap[key] = { shipments: 0, cost: 0 };
    monthMap[key].cost += v;
  });
  const sorted = Object.entries(monthMap).filter(([k]) => k && k.includes('-')).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6);
  // Shipments without dates are excluded from monthly chart (not double-counted)
  const monthly = sorted.map(([k,v]) => {
    const [,m] = k.split('-');
    return { month: monthNames[parseInt(m,10)-1], shipments: v.shipments, cost: Math.round(v.cost*100)/100 };
  });
  return { monthly };
}

export async function getDashboardRecentActivities(limit = 6) {
  const db = await getDb(); if (!db) return [];
  const allShipments = await db.select().from(shipments).orderBy(desc(shipments.createdAt)).limit(20).execute();
  const statusLabels: Record<string,string> = {
    draft:"إنشاء شحنة جديدة", confirmed:"تأكيد شحنة", in_transit:"شحنة في الطريق", arrived:"وصول الشحنة",
    customs:"بدء التخليص الجمركي", cleared:"اكتمال التخليص الجمركي", delivered:"تسليم الشحنة", delayed:"تنبيه تأخير",
    cancelled:"إلغاء شحنة"
  };
  return allShipments.slice(0, limit).map(s => ({
    label: statusLabels[s.status||'draft']||s.status,
    detail: `${s.shipmentNo} — ${s.material || 'مادة'}`,
    createdAt: s.createdAt,
    status: s.status,
  }));
}

export async function getDashboardStatusBreakdown() {
  const db = await getDb(); if (!db) return [];
  const all = await db.select().from(shipments).execute();
  const map: Record<string, number> = {};
  all.forEach(s => { const k = s.status || 'draft'; map[k] = (map[k]||0)+1; });
  return Object.entries(map).map(([status, count]) => ({ status, count }));
}

export async function getDashboardClearanceOverview() {
  const db = await getDb(); if (!db) return { total: 0, pending_acid: 0, acid_issued: 0, under_inspection: 0, released: 0, cleared: 0 };
  const all = await db.select().from(customs).execute();
  const out: any = { total: all.length, pending_acid:0, acid_issued:0, under_inspection:0, released:0, cleared:0 };
  all.forEach(c => { const k = c.status as string; if (k in out) out[k]++; });
  return out;
}

// ============ Shipments ============
export async function getShipments() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(shipments).orderBy(desc(shipments.createdAt)).execute();
}
export async function getShipmentById(id: number) {
  const db = await getDb(); if (!db) return null;
  const r = await db.select().from(shipments).where(eq(shipments.id, id)).limit(1).execute();
  return r[0] || null;
}
export async function createShipment(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(shipments).values({ shipmentNo: data.shipmentNo, ...data }).$returningId().execute();
  return r[0];
}
export async function updateShipment(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(shipments).set(data).where(eq(shipments.id, id)).execute();
  return { id };
}
export async function deleteShipment(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(shipments).where(eq(shipments.id, id)).execute();
  return { id };
}

// ============ Procurement ============
export async function getProcurement() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(procurement).orderBy(desc(procurement.createdAt)).execute();
}
export async function createProcurement(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(procurement).values(data).$returningId().execute();
  return r[0];
}
export async function updateProcurement(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(procurement).set(data).where(eq(procurement.id, id)).execute();
  return { id };
}
export async function deleteProcurement(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(procurement).where(eq(procurement.id, id)).execute();
  return { id };
}

// ============ Freight ============
export async function getFreight() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(freight).orderBy(desc(freight.createdAt)).execute();
}
export async function createFreight(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(freight).values(data).$returningId().execute();
  return r[0];
}
export async function updateFreight(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(freight).set(data).where(eq(freight.id, id)).execute();
  return { id };
}
export async function deleteFreight(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(freight).where(eq(freight.id, id)).execute();
  return { id };
}

// ============ Customs ============
export async function getCustoms() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(customs).orderBy(desc(customs.createdAt)).execute();
}
export async function createCustoms(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(customs).values(data).$returningId().execute();
  return r[0];
}
export async function updateCustoms(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(customs).set(data).where(eq(customs.id, id)).execute();
  return { id };
}
export async function deleteCustoms(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(customs).where(eq(customs.id, id)).execute();
  return { id };
}

// ============ Costs ============
export async function getCosts() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(costs).orderBy(desc(costs.createdAt)).execute();
}
export async function createCost(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const total = (data.freightCost||0)+(data.insuranceCost||0)+(data.customsCost||0)+(data.transportationCost||0)+(data.storageCost||0)+(data.demurrageCost||0)+(data.detentionCost||0)+(data.handlingCost||0)+(data.otherCharges||0);
  const r = await db.insert(costs).values({ ...data, totalCost: total, landedCost: total + (data.cargoValue||0) }).$returningId().execute();
  return r[0];
}
export async function updateCost(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const total = (data.freightCost||0)+(data.insuranceCost||0)+(data.customsCost||0)+(data.transportationCost||0)+(data.storageCost||0)+(data.demurrageCost||0)+(data.detentionCost||0)+(data.handlingCost||0)+(data.otherCharges||0);
  await db.update(costs).set({ ...data, totalCost: total, landedCost: total + (data.cargoValue||0) }).where(eq(costs.id, id)).execute();
  return { id };
}

// ============ Documents ============
export async function getDocuments() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(documents).orderBy(desc(documents.createdAt)).execute();
}
export async function getDocumentsByShipment(shipmentId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(documents).where(eq(documents.shipmentId, shipmentId)).orderBy(desc(documents.createdAt)).execute();
}
export async function createDocument(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(documents).values(data).$returningId().execute();
  return r[0];
}
export async function updateDocument(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(documents).set(data).where(eq(documents.id, id)).execute();
  return { id };
}
export async function deleteDocument(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(documents).where(eq(documents.id, id)).execute();
  return { id };
}

// ============ Tasks ============
export async function getTasks() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(tasks).orderBy(desc(tasks.createdAt)).execute();
}
export async function createTask(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(tasks).values(data).$returningId().execute();
  return r[0];
}
export async function updateTask(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(tasks).set(data).where(eq(tasks.id, id)).execute();
  return { id };
}
export async function deleteTask(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(tasks).where(eq(tasks.id, id)).execute();
  return { id };
}

// ============ Suppliers ============
export async function getSuppliers() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(suppliers).orderBy(desc(suppliers.createdAt)).execute();
}
export async function createSupplier(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(suppliers).values(data).$returningId().execute();
  return r[0];
}
export async function updateSupplier(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(suppliers).set(data).where(eq(suppliers.id, id)).execute();
  return { id };
}
export async function deleteSupplier(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(suppliers).where(eq(suppliers.id, id)).execute();
  return { id };
}

// ============ Email Templates ============
export async function getEmailTemplates() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(emailTemplates).execute();
}
export async function createEmailTemplate(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(emailTemplates).values(data).$returningId().execute();
  return r[0];
}
export async function updateEmailTemplate(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(emailTemplates).set(data).where(eq(emailTemplates.id, id)).execute();
  return { id };
}
export async function deleteEmailTemplate(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id)).execute();
  return { id };
}

// ============ Knowledge ============
export async function getKnowledge() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(knowledge).orderBy(knowledge.orderIndex).execute();
}
export async function createKnowledge(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(knowledge).values(data).$returningId().execute();
  return r[0];
}
export async function updateKnowledge(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(knowledge).set(data).where(eq(knowledge.id, id)).execute();
  return { id };
}
export async function deleteKnowledge(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(knowledge).where(eq(knowledge.id, id)).execute();
  return { id };
}

// ============ Audit Log ============
export async function getAuditLog() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(500).execute();
}
export async function createAuditLog(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.insert(auditLog).values(data).execute();
  return data;
}

// ============ Settings ============
export async function getSettings() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(settings).execute();
}
export async function updateSetting(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(settings).set(data).where(eq(settings.id, id)).execute();
  return { id };
}
export async function createSetting(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(settings).values(data).$returningId().execute();
  return r[0];
}

// ============ Master Data ============
export async function getCompanies() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(companies).execute();
}
export async function createCompany(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(companies).values(data).$returningId().execute();
  return r[0];
}
export async function updateCompany(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(companies).set(data).where(eq(companies.id, id)).execute();
  return { id };
}
export async function deleteCompany(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(companies).where(eq(companies.id, id)).execute();
  return { id };
}

export async function getPlants() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(plants).execute();
}
export async function createPlant(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(plants).values(data).$returningId().execute();
  return r[0];
}
export async function updatePlant(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(plants).set(data).where(eq(plants.id, id)).execute();
  return { id };
}
export async function deletePlant(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(plants).where(eq(plants.id, id)).execute();
  return { id };
}

export async function getDepartments() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(departments).execute();
}
export async function createDepartment(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(departments).values(data).$returningId().execute();
  return r[0];
}
export async function updateDepartment(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(departments).set(data).where(eq(departments.id, id)).execute();
  return { id };
}
export async function deleteDepartment(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(departments).where(eq(departments.id, id)).execute();
  return { id };
}

// ============ Bank / LC ============
export async function getBankLc() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(bankLc).orderBy(desc(bankLc.createdAt)).execute();
}
export async function createBankLc(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(bankLc).values(data).$returningId().execute();
  return r[0];
}
export async function updateBankLc(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(bankLc).set(data).where(eq(bankLc.id, id)).execute();
  return { id };
}
export async function deleteBankLc(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(bankLc).where(eq(bankLc.id, id)).execute();
  return { id };
}

// ============ Document Discrepancy Checker ============
export async function getDocChecks() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(docCheck).orderBy(desc(docCheck.createdAt)).execute();
}
export async function createDocCheck(data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(docCheck).values(data).$returningId().execute();
  return r[0];
}
export async function updateDocCheck(id: number, data: any) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(docCheck).set(data).where(eq(docCheck.id, id)).execute();
  return { id };
}
export async function deleteDocCheck(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(docCheck).where(eq(docCheck.id, id)).execute();
  return { id };
}

// ============ Alerts ============
export async function getAlerts(limit = 50) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(alertLog).orderBy(desc(alertLog.createdAt)).limit(limit).execute();
}
export async function createAlert(data: any) {
  const db = await getDb(); if (!db) return null;
  try {
    const r = await db.insert(alertLog).values(data).$returningId().execute();
    return r[0];
  } catch (e) { console.error("[Alerts] failed", e); return null; }
}
export async function markAlertRead(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(alertLog).set({ read: "yes" }).where(eq(alertLog.id, id)).execute();
  return { id };
}

// ============ Free Time Engine ============
// Computes free time expiry and demurrage exposure from arrivalDate (or ATA/ETA) + freeTimeDays
export function computeFreeTime(s: any) {
  const arrival = s.arrivalDate || s.ata || s.eta;
  if (!arrival) return { expiry: null, daysLeft: null, demurrageDays: null, atRisk: false, expired: false };
  const arrivalMs = new Date(arrival).getTime();
  const days = Math.max(0, Number(s.freeTimeDays || 0));
  const expiryMs = arrivalMs + days * 86400000;
  const now = Date.now();
  const daysLeft = Math.round((expiryMs - now) / 86400000);
  const expired = now > expiryMs;
  const demurrageDays = expired ? Math.ceil((now - expiryMs) / 86400000) : 0;
  // at-risk: expiry within 7 days and shipment not yet cleared/delivered
  const atRisk = !expired && daysLeft >= 0 && daysLeft <= 7 && !["cleared", "delivered", "cancelled"].includes(s.status || "");
  return { expiry: new Date(expiryMs), daysLeft, demurrageDays, atRisk, expired };
}

export async function regenerateFreeTimeAlerts() {
  const db = await getDb(); if (!db) return;
  const all = await db.select().from(shipments).execute();
  const now = Date.now();
  for (const s of all) {
    const f = computeFreeTime(s);
    if (!f.expiry) continue;
    const baseTitle = `Free Time: ${s.shipmentNo}`;
    if (f.expired && !["cleared", "delivered", "cancelled"].includes(s.status || "")) {
      await createAlert({ shipmentId: s.id, alertType: "demurrage_risk", severity: "critical", title: `${baseTitle} — Free Time Expired`, message: `السماح المجاني انتهى قبل ${f.demurrageDays} يوم. يُنصح بالتواصل مع الخط الملاحي فورًا لطلب تمديد أو إيقاف احتساب Demurrage.` });
    } else if (f.atRisk) {
      await createAlert({ shipmentId: s.id, alertType: "free_time_expiry", severity: "high", title: `${baseTitle} — Free Time ينتهي خلال ${f.daysLeft} يوم`, message: `السماح المجاني ينتهي في ${new Date(f.expiry).toLocaleDateString()}. يرجى الإسراع بإجراءات التخليص.` });
    }
  }
  // LC expiry alerts
  const lcRows = await db.select().from(bankLc).execute();
  for (const lc of lcRows) {
    if (lc.expiryDate && !["paid", "closed"].includes(lc.status || "")) {
      const diff = new Date(lc.expiryDate).getTime() - now;
      if (diff <= 7 * 86400000 && diff > 0) {
        await createAlert({ shipmentId: lc.shipmentId, alertType: "lc_expiry", severity: "high", title: `LC/TT ينتهي: ${lc.lcNumber || lc.bankName || "شحنة " + lc.shipmentId}`, message: `الاعتماد/التحويل المصرفي ينتهي خلال ${Math.ceil(diff / 86400000)} يوم — يرجى مراجعة البنك.` });
      } else if (diff <= 0) {
        await createAlert({ shipmentId: lc.shipmentId, alertType: "lc_expiry", severity: "critical", title: `انتهى الاعتماد: ${lc.lcNumber || lc.bankName}`, message: `تاريخ صلاحية الاعتماد/التحويل قد مر — يرجى التمديد فورًا.` });
      }
    }
  }
}

// ============ Knowledge Seed (expanded) ============
export async function seedExpandedKnowledge() {
  const db = await getDb(); if (!db) return;
  const existing = await db.select().from(knowledge).execute();
  if (existing.length > 8) return; // already seeded
  const rows = [
    { title: "Incoterms 2020 — مجموعة كاملة", category: "Incoterms", orderIndex: 10, content: "EXW (Ex Works): الاستلام من مصنع المورد، المشتري يتحمل كل التكاليف والمخاطر. FCA (Free Carrier): التسليم للناقل في نقطة محددة. FAS (Free Alongside Ship): بجانب السفينة. FOB (Free On Board): على متن السفينة — المورد يتحمل حتى الشحن. CFR (Cost and Freight): تكلفة الشحن حتى ميناء الوصول. CIF (Cost, Insurance & Freight): مثل CFR + تأمين. CPT / CIP: مثل CFR/CIF لباقي وسائل النقل. DAP (Delivered at Place): التسليم في مكان محدد بدون تخليص. DPU (Delivered at Place Unloaded): التسليم بعد التفريغ. DDP (Delivered Duty Paid): التسليم شامل الجمارك — المورد يتحمل كل شيء. القاعدة الذهبية: في الاستيراد المصري يفضل CIF/FOB حسب العقد؛ DDP نادر في الاستيراد التجاري." },
    { title: "طرق الدفع الدولية — LC vs TT", category: "Banking", orderIndex: 11, content: "LC (اعتماد مستندي): الأكثر أمانًا للمستورد — البنك يفرج عن الدفع فقط بعد تقديم مستندات مطابقة لشروط الاعتماد. LC at sight: الدفع عند المطابقة الفورية. LC 90/120 days: دفع آجل مع رسوم قبول. TT (تحويل بنكي): T/T 30% مقدم + 70% ضد نسخة البوليصة، أو 100% بعد التفتيش. CAD (Cash Against Documents): استلام المستندات مقابل الدفع عبر البنك. اختيار الطريقة يؤثر على التكلفة والسيولة والمخاطر — LC يكلف رسوم فتح وتعديل (0.5%–1.5% من القيمة) لكنه يحمي المستورد من عدم الشحن." },
    { title: "تناقض المستندات (Discrepancy) — كيف تمنع إيقاف الشهادة 46", category: "Customs", orderIndex: 12, content: "التناقض المستندي يحدث عندما تختلف البيانات بين الفاتورة التجارية وبوليصة الشحن وشهادة المنشأ وقائمة التعبئة عن البيان الجمركي. أسباب الإيقاف الشائعة: (1) اختلاف وصف البضاعة أو كود HS بين الفاتورة والبوليصة، (2) اختلاف الوزن أو الكميات، (3) رقم ACID غير مذكور على البوليصة، (4) اختلاف اسم المورّد أو العنوان، (5) اختلاف القيمة. الوقاية: مراجعة مسودات جميع المستندات قبل الشحن، مطابقة رقم ACID وUCR، مطابقة الأوزان والكميات بالوحدات نفسها، التأكد من أن HS Code موحد في كل المستندات، وطلب Draft B/L من الخط الملاحي قبل إصدار البوليصة النهائية." },
    { title: "الغرامات: Demurrage & Detention & Storage", category: "Customs", orderIndex: 13, content: "Demurrage: غرامة يومية يحددها الخط الملاحي على الحاوية داخل الميناء بعد انتهاء السماح المجاني (عادة 7–14 يومًا بحريًا). Detention: غرامة على الحاوية خارج الميناء بعد انتهاء السماح. Storage/Port Storage: غرامة الميناء على التخزين — تُحسب يوميًا وقد تتضاعف. الوقاية: متابعة Free Time Expiry يوميًا، طلب تمديد السماح المجاني قبل الوصول إذا كان التخليص متأخرًا، الإسراع في تقديم البيان الجمركي عبر نافذة فور الوصول، واستخراج البضاعة فور الإفراج. قواعد الحساب: اليوم الأول يبدأ من تاريخ وصول vessel berthing أو خروج الحاوية، والعطلات الرسمية تُحتسب حسب شروط الخط." },
    { title: "نافذة (NAFEZA) وACI — الدليل التشغيلي", category: "Customs", orderIndex: 14, content: "نافذة هي النافذة الموحدة للدولة للعمليات الجمركية. قبل شحن أي شحنة بحرية يجب: (1) تسجيل المستورد في نافذة، (2) تقديم طلب ACI عبر منصة CargoX للحصول على رقم ACID المكون من 19 رقمًا، (3) إلزام المورد برفع المستندات (الفاتورة، البوليصة، شهادة المنشأ) على CargoX، (4) التأكد من ذكر رقم ACID على البوليصة. بعد الوصول: تقديم البيان الجمركي خلال 14 يومًا، دفع الرسوم، الفحص (إن وجد)، ثم الإفراج. الشحنات الجوية لها نظام ACI خاص عبر البوليصة. بدون ACID لا يمكن تسجيل البيان ولا الإفراج — الشحنة تبقى محتجزة في الميناء وتتراكم غرامات التخزين." },
    { title: "HS Code — التصنيف الجمركي للمعادن والصلب", category: "Customs", orderIndex: 15, content: "كود النظام المنسق (HS Code) يحدد نسبة الرسوم الجمركية وضريبة القيمة المضافة والإعفاءات. أمثلة شائعة: 7208 (ألواح صلب مسطحة), 7204 (خردة صلب), 2522 (جير حي), 6901-6903 (مواد حرارية: طوب, عجائن, رمال كروميت), 7326 (مصنوعات صلب أخرى). ملاحظات مصرية: خامات الصلب الأساسية غالبًا معفاة أو برسوم مخفضة لدعم الصناعة، بينما المصنوعات برسوم أعلى. يجب مطابقة HS Code بين شهادة المنشأ والبيان الجمركي والفاتورة، والاحتفاظ بدفتر وصف تفصيلي للبضاعة (Chemical Composition) لتسهيل الفحص." },
    { title: "تعليمات الشحن للموردين — ما يجب طلبه قبل الشحن", category: "Procedures", orderIndex: 16, content: "قبل إصدار أي تعليمات شحن للمورد: (1) تأكيد رقم ACID وإلزام المورد بذكره على البوليصة، (2) طلب 3 بوالص أصلية + 3 نسخ (3/3 Original B/L)، (3) تحديد Notify Party (بيانات شركة التخليص)، (4) تأكيد ميناء الوصول وموعد الشحن الأحدث، (5) طلب Draft BL قبل الإصدار لمراجعته، (6) التأكد من مطابقة وصف البضاعة والأوزان، (7) طلب شهادة منشأ معتمدة من الغرفة التجارية، (8) تحديد Incoterm بوضوح. هذه القائمة تمنع 90% من مشاكل التناقض المستندي." },
  ];
  for (const r of rows) {
    try { await db.insert(knowledge).values(r).execute(); } catch (e) { console.error("[Knowledge seed]", e); }
  }
}
