import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Dashboard
  dashboard: router({
    stats: publicProcedure.query(async () => db.getDashboardStats()),
    chartData: publicProcedure.query(async () => db.getDashboardChartData()),
    recentActivities: publicProcedure.query(async () => db.getDashboardRecentActivities()),
    statusBreakdown: publicProcedure.query(async () => db.getDashboardStatusBreakdown()),
    clearanceOverview: publicProcedure.query(async () => db.getDashboardClearanceOverview()),
  }),

  // Shipments
  shipments: router({
    list: publicProcedure.query(async () => db.getShipments()),
    get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getShipmentById(input.id)),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createShipment(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await db.updateShipment(id, data);
      // Auto-create arrival tasks: when a shipment successfully moves to "arrived",
      // seed the standard customs-preparation tasks (broker notification + customs docs
      // preparation) if they do not already exist for this shipment.
      if (data.status === "arrived") {
        try {
          const existing = await db.getTasksByShipment(id);
          const titles = ["مُطالبة وكيل التخليص بمبدأ البيان الجمركي", "إعداد مستندات التخليص (Invoice / BL / COO)"];
          for (const t of titles) {
            if (!existing.some((e: any) => (e.title || "").includes(t))) {
              await db.createTask({ shipmentId: id, title: t, description: "مهمة تلقائية: أنشئت عند وصول الشحنة", priority: "high", status: "not_started", dueDate: new Date(Date.now() + 3 * 86400000) });
            }
          }
        } catch (e) { console.error("[auto-tasks]", e); }
      }
      return result;
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteShipment(input.id)),
  }),

  // Procurement
  procurement: router({
    list: publicProcedure.query(async () => db.getProcurement()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createProcurement(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateProcurement(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteProcurement(input.id)),
  }),

  // Freight
  freight: router({
    list: publicProcedure.query(async () => db.getFreight()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createFreight(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateFreight(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteFreight(input.id)),
  }),

  // Customs
  customs: router({
    list: publicProcedure.query(async () => db.getCustoms()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createCustoms(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateCustoms(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteCustoms(input.id)),
  }),

  // Costs
  costs: router({
    list: publicProcedure.query(async () => db.getCosts()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createCost(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateCost(id, data); }),
  }),

  // Documents
  documents: router({
    list: publicProcedure.query(async () => db.getDocuments()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createDocument(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateDocument(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteDocument(input.id)),
  }),

  // Tasks
  tasks: router({
    list: publicProcedure.query(async () => db.getTasks()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createTask(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateTask(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteTask(input.id)),
  }),

  // Suppliers
  suppliers: router({
    list: publicProcedure.query(async () => db.getSuppliers()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createSupplier(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateSupplier(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteSupplier(input.id)),
  }),

  // Email Templates
  emailTemplates: router({
    list: publicProcedure.query(async () => db.getEmailTemplates()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createEmailTemplate(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateEmailTemplate(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteEmailTemplate(input.id)),
  }),

  // Knowledge
  knowledge: router({
    list: publicProcedure.query(async () => db.getKnowledge()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createKnowledge(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateKnowledge(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteKnowledge(input.id)),
  }),

  // Audit Log
  auditLog: router({
    list: publicProcedure.query(async () => db.getAuditLog()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createAuditLog(input)),
  }),

  // Settings
  settings: router({
    list: publicProcedure.query(async () => db.getSettings()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createSetting(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateSetting(id, data); }),
  }),

  // Master Data - Companies
  companies: router({
    list: publicProcedure.query(async () => db.getCompanies()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createCompany(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateCompany(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteCompany(input.id)),
  }),

  // Master Data - Plants
  plants: router({
    list: publicProcedure.query(async () => db.getPlants()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createPlant(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updatePlant(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deletePlant(input.id)),
  }),

  // Master Data - Departments
  departments: router({
    list: publicProcedure.query(async () => db.getDepartments()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createDepartment(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateDepartment(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteDepartment(input.id)),
  }),

  // Bank / LC Tracking
  bankLc: router({
    list: publicProcedure.query(async () => db.getBankLc()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createBankLc(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateBankLc(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteBankLc(input.id)),
  }),

  // Document Discrepancy Checker
  docCheck: router({
    list: publicProcedure.query(async () => db.getDocChecks()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createDocCheck(input)),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateDocCheck(id, data); }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteDocCheck(input.id)),
  }),

  // Alerts
  alerts: router({
    list: publicProcedure.query(async () => db.getAlerts()),
    regenerate: publicProcedure.mutation(async () => { await db.regenerateFreeTimeAlerts(); return { success: true }; }),
    markRead: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.markAlertRead(input.id)),
  }),

  // Free Time & Knowledge Tools
  tools: router({
    freeTimeOverview: publicProcedure.query(async () => {
      const all = await db.getShipments();
      return all.map(s => ({ ...s, freeTime: db.computeFreeTime(s) }));
    }),
    seedKnowledge: publicProcedure.mutation(async () => { await db.seedExpandedKnowledge(); return { success: true }; }),
  }),

  // Document Upload (S3)
  shipmentDocs: router({
    upload: publicProcedure.input(z.object({ fileName: z.string(), mimeType: z.string(), base64: z.string(), shipmentId: z.number(), docType: z.string().optional() })).mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.fileName.includes(".") ? input.fileName.split(".").pop() : "bin";
      const safeName = (input.fileName || "file").trim().replace(/[^A-Za-z0-9._-]/g, "_").replace(/_+/g, "_").slice(-120);
      const key = `shipment-docs/${input.shipmentId}/${Date.now()}-${safeName}`;
      const { storagePut } = await import("./storage");
      const { url } = await storagePut(key, buffer, input.mimeType || "application/octet-stream");
      const rec = await db.createDocument({ shipmentId: input.shipmentId, docType: input.docType || "other", fileName: input.fileName, fileUrl: url, uploadDate: new Date(), version: "1.0", status: "uploaded" });
      return { id: (rec as any).id, url };
    }),
    list: publicProcedure.input(z.object({ shipmentId: z.number() })).query(async ({ input }) => db.getDocumentsByShipment(input.shipmentId)),
    extract: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.updateDocument(input.id, { extractionStatus: "running" });
      try {
        const result = await db.extractWithLLM(input.id);
        return { success: true, ...result };
      } catch (err: any) {
        await db.updateDocument(input.id, { extractionStatus: "failed" });
        throw new Error(err?.message || "AI extraction failed");
      }
    }),
    applyExtraction: publicProcedure.input(z.object({ id: z.number(), fields: z.array(z.object({ fieldName: z.string(), value: z.string(), confidence: z.number().optional() })) })).mutation(async ({ input }) => db.applyExtraction(input.id, input.fields)),
  }),
});

export type AppRouter = typeof appRouter;
