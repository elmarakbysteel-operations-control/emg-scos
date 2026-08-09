import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
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
  }),

  // Shipments
  shipments: router({
    list: publicProcedure.query(async () => db.getShipments()),
    get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getShipmentById(input.id)),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createShipment(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateShipment(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteShipment(input.id)),
  }),

  // Procurement
  procurement: router({
    list: publicProcedure.query(async () => db.getProcurement()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createProcurement(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateProcurement(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteProcurement(input.id)),
  }),

  // Freight
  freight: router({
    list: publicProcedure.query(async () => db.getFreight()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createFreight(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateFreight(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteFreight(input.id)),
  }),

  // Customs
  customs: router({
    list: publicProcedure.query(async () => db.getCustoms()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createCustoms(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateCustoms(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteCustoms(input.id)),
  }),

  // Costs
  costs: router({
    list: publicProcedure.query(async () => db.getCosts()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createCost(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateCost(id, data); }),
  }),

  // Documents
  documents: router({
    list: publicProcedure.query(async () => db.getDocuments()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createDocument(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateDocument(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteDocument(input.id)),
  }),

  // Tasks
  tasks: router({
    list: publicProcedure.query(async () => db.getTasks()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createTask(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateTask(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteTask(input.id)),
  }),

  // Suppliers
  suppliers: router({
    list: publicProcedure.query(async () => db.getSuppliers()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createSupplier(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateSupplier(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteSupplier(input.id)),
  }),

  // Email Templates
  emailTemplates: router({
    list: publicProcedure.query(async () => db.getEmailTemplates()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createEmailTemplate(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateEmailTemplate(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteEmailTemplate(input.id)),
  }),

  // Knowledge
  knowledge: router({
    list: publicProcedure.query(async () => db.getKnowledge()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createKnowledge(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateKnowledge(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteKnowledge(input.id)),
  }),

  // Audit Log
  auditLog: router({
    list: publicProcedure.query(async () => db.getAuditLog()),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => db.createAuditLog(input)),
  }),

  // Settings
  settings: router({
    list: publicProcedure.query(async () => db.getSettings()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createSetting(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateSetting(id, data); }),
  }),

  // Master Data - Companies
  companies: router({
    list: publicProcedure.query(async () => db.getCompanies()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createCompany(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateCompany(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteCompany(input.id)),
  }),

  // Master Data - Plants
  plants: router({
    list: publicProcedure.query(async () => db.getPlants()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createPlant(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updatePlant(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deletePlant(input.id)),
  }),

  // Master Data - Departments
  departments: router({
    list: publicProcedure.query(async () => db.getDepartments()),
    create: protectedProcedure.input(z.any()).mutation(async ({ input }) => db.createDepartment(input)),
    update: protectedProcedure.input(z.any()).mutation(async ({ input }) => { const { id, ...data } = input; return db.updateDepartment(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteDepartment(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
