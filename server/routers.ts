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
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateShipment(id, data); }),
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
});

export type AppRouter = typeof appRouter;
