import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, shipments, procurement, freight, customs, costs,
  documents, tasks, suppliers, emailTemplates, knowledge,
  auditLog, settings, companies, plants, departments
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
    const key = d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` : "unknown";
    if (!monthMap[key]) monthMap[key] = { shipments: 0, cost: 0 };
    monthMap[key].shipments += 1;
    monthMap[key].cost += cost;
  };
  allShipments.forEach(s => addRow(s.createdAt || s.eta || s.etd));
  allCosts.forEach(c => addRow((c as any).createdAt, Number((c as any).totalCost || (c as any).freightCost || 0)));
  const sorted = Object.entries(monthMap).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6);
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
