import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, double, decimal } from "drizzle-orm/mysql-core";

// Core user table
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Companies
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 50 }),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Plants
export const plants = mysqlTable("plants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  companyId: int("companyId").default(0),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Departments
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  companyId: int("companyId").default(0),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Shipments
export const shipments = mysqlTable("shipments", {
  id: int("id").autoincrement().primaryKey(),
  shipmentNo: varchar("shipmentNo", { length: 50 }).notNull(),
  companyId: int("companyId").default(0),
  plantId: int("plantId").default(0),
  supplierName: varchar("supplierName", { length: 200 }),
  poNumber: varchar("poNumber", { length: 100 }),
  material: varchar("material", { length: 300 }),
  incoterm: varchar("incoterm", { length: 50 }),
  originCountry: varchar("originCountry", { length: 100 }),
  originPort: varchar("originPort", { length: 100 }),
  destinationCountry: varchar("destinationCountry", { length: 100 }),
  destinationPort: varchar("destinationPort", { length: 100 }),
  transportMode: mysqlEnum("transportMode", ["sea", "air", "land", "rail"]),
  forwarderName: varchar("forwarderName", { length: 200 }),
  shippingLine: varchar("shippingLine", { length: 200 }),
  bookingRef: varchar("bookingRef", { length: 100 }),
  containerNo: varchar("containerNo", { length: 100 }),
  containerType: varchar("containerType", { length: 50 }),
  blAwbNumber: varchar("blAwbNumber", { length: 100 }),
  etd: timestamp("etd"),
  eta: timestamp("eta"),
  ata: timestamp("ata"),
  status: mysqlEnum("status", ["draft", "confirmed", "in_transit", "arrived", "customs", "cleared", "delivered", "cancelled", "delayed"]).default("draft"),
  owner: varchar("owner", { length: 100 }),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  cargoValue: double("cargoValue"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  weight: double("weight"),
  volume: double("volume"),
  healthScore: int("healthScore").default(100),
  freeTimeDays: int("freeTimeDays").default(0),
  arrivalDate: timestamp("arrivalDate"),
  freeTimeExpiry: timestamp("freeTimeExpiry"),
  remarks: text("remarks"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Procurement
export const procurement = mysqlTable("procurement", {
  id: int("id").autoincrement().primaryKey(),
  prNumber: varchar("prNumber", { length: 100 }),
  poNumber: varchar("poNumber", { length: 100 }),
  supplierId: int("supplierId"),
  supplierName: varchar("supplierName", { length: 200 }),
  material: varchar("material", { length: 300 }),
  quantity: double("quantity"),
  unit: varchar("unit", { length: 50 }),
  unitPrice: double("unitPrice"),
  totalValue: double("totalValue"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  requestedDeliveryDate: timestamp("requestedDeliveryDate"),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  actualDeliveryDate: timestamp("actualDeliveryDate"),
  status: mysqlEnum("status", ["rfq_sent", "quotation_received", "under_review", "approved", "po_issued", "shipped", "received", "rejected"]).default("rfq_sent"),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending"),
  rfqDate: timestamp("rfqDate"),
  quotationDate: timestamp("quotationDate"),
  poDate: timestamp("poDate"),
  shipmentId: int("shipmentId"),
  remarks: text("remarks"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Freight
export const freight = mysqlTable("freight", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId"),
  bookingRef: varchar("bookingRef", { length: 100 }),
  shippingLine: varchar("shippingLine", { length: 200 }),
  forwarderName: varchar("forwarderName", { length: 200 }),
  airline: varchar("airline", { length: 200 }),
  containerType: varchar("containerType", { length: 50 }),
  containerNo: varchar("containerNo", { length: 100 }),
  originPort: varchar("originPort", { length: 100 }),
  destinationPort: varchar("destinationPort", { length: 100 }),
  transitTime: int("transitTime"),
  freightCost: double("freightCost"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  blNumber: varchar("blNumber", { length: 100 }),
  etd: timestamp("etd"),
  eta: timestamp("eta"),
  status: mysqlEnum("status", ["quotation", "booked", "in_transit", "arrived", "delayed"]).default("booked"),
  delayDays: int("delayDays").default(0),
  remarks: text("remarks"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Customs
export const customs = mysqlTable("customs", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId"),
  acidNumber: varchar("acidNumber", { length: 50 }),
  ucrNumber: varchar("ucrNumber", { length: 100 }),
  declarationNumber: varchar("declarationNumber", { length: 100 }),
  broker: varchar("broker", { length: 200 }),
  arrivalDate: timestamp("arrivalDate"),
  inspectionDate: timestamp("inspectionDate"),
  releaseDate: timestamp("releaseDate"),
  clearanceTime: int("clearanceTime"),
  status: mysqlEnum("status", ["pending_acid", "acid_issued", "arrived", "under_inspection", "released", "cleared"]).default("pending_acid"),
  remarks: text("remarks"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Costs
export const costs = mysqlTable("costs", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId"),
  freightCost: double("freightCost").default(0),
  insuranceCost: double("insuranceCost").default(0),
  customsCost: double("customsCost").default(0),
  transportationCost: double("transportationCost").default(0),
  storageCost: double("storageCost").default(0),
  demurrageCost: double("demurrageCost").default(0),
  detentionCost: double("detentionCost").default(0),
  handlingCost: double("handlingCost").default(0),
  otherCharges: double("otherCharges").default(0),
  budget: double("budget").default(0),
  currency: varchar("currency", { length: 10 }).default("USD"),
  totalCost: double("totalCost").default(0),
  landedCost: double("landedCost").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Documents
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId"),
  docType: mysqlEnum("docType", ["commercial_invoice", "packing_list", "certificate_of_origin", "bill_of_lading", "air_waybill", "insurance", "msds", "coa", "inspection_cert", "other"]).default("commercial_invoice"),
  fileName: varchar("fileName", { length: 300 }),
  fileUrl: text("fileUrl"),
  uploadDate: timestamp("uploadDate"),
  version: varchar("version", { length: 20 }).default("1.0"),
  status: mysqlEnum("status", ["pending", "uploaded", "verified", "rejected", "missing"]).default("pending"),
  expiryDate: timestamp("expiryDate"),
  remarks: text("remarks"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Tasks
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  owner: varchar("owner", { length: 200 }),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "on_hold", "cancelled"]).default("not_started"),
  progress: int("progress").default(0),
  completionDate: timestamp("completionDate"),
  shipmentId: int("shipmentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Suppliers
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 50 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  contactPerson: varchar("contactPerson", { length: 200 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  rating: int("rating").default(0),
  performance: mysqlEnum("performance", ["excellent", "good", "average", "poor"]).default("average"),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Email Templates
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  category: varchar("category", { length: 100 }),
  subject: text("subject"),
  body: text("body"),
  active: mysqlEnum("active", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Knowledge Center
export const knowledge = mysqlTable("knowledge", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  category: varchar("category", { length: 100 }),
  content: text("content").notNull(),
  orderIndex: int("orderIndex").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Bank / LC tracking
export const bankLc = mysqlTable("bank_lc", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull(),
  bankName: varchar("bankName", { length: 200 }),
  paymentType: mysqlEnum("paymentType", ["lc", "lc_at_sight", "lc_90days", "lc_120days", "tt", "cash_against_documents"]).default("lc"),
  lcNumber: varchar("lcNumber", { length: 100 }),
  amount: double("amount").default(0),
  currency: varchar("currency", { length: 10 }).default("USD"),
  status: mysqlEnum("status", ["pending_application", "submitted_to_bank", "issued", "amendment", "documents_presented", "accepted", "paid", "closed", "rejected"]).default("pending_application"),
  applicationDate: timestamp("applicationDate"),
  issuanceDate: timestamp("issuanceDate"),
  expiryDate: timestamp("expiryDate"),
  documentsArrivalDate: timestamp("documentsArrivalDate"),
  paymentDate: timestamp("paymentDate"),
  remarks: text("remarks"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Document discrepancy checker (drafts review)
export const docCheck = mysqlTable("doc_check", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull(),
  docName: varchar("docName", { length: 200 }),
  docType: mysqlEnum("docType", ["commercial_invoice", "bill_of_lading", "certificate_of_origin", "packing_list"]).default("commercial_invoice"),
  fieldName: varchar("fieldName", { length: 200 }),
  expectedValue: text("expectedValue"),
  actualValue: text("actualValue"),
  matches: mysqlEnum("matches", ["match", "mismatch", "missing", "pending_review"]).default("pending_review"),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  resolved: mysqlEnum("resolved", ["yes", "no"]).default("no"),
  remarks: text("remarks"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Alert log for free time / LC / expiry alerts
export const alertLog = mysqlTable("alert_log", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId"),
  alertType: mysqlEnum("alertType", ["free_time_expiry", "demurrage_risk", "lc_expiry", "eta_overdue", "document_missing", "info"]).default("info"),
  title: varchar("title", { length: 300 }).notNull(),
  message: text("message"),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  read: mysqlEnum("read", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Audit Log
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 200 }).notNull(),
  module: varchar("module", { length: 100 }),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Settings
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }),
  key: varchar("key", { length: 200 }).notNull(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
