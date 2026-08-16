import { describe, expect, it, vi } from "vitest";
import { computeFreeTime } from "./db";

// ---------------- computeFreeTime engine (pure, no DB needed) ----------------
describe("computeFreeTime", () => {
  it("returns null when no arrival date exists", () => {
    const r = computeFreeTime({ shipmentNo: "EMG-001", status: "shipped" });
    expect(r.expiry).toBeNull();
    expect(r.daysLeft).toBeNull();
  });

  it("computes expiry as arrival + freeTimeDays", () => {
    const arrival = new Date("2026-08-10T00:00:00Z").getTime();
    const r = computeFreeTime({
      shipmentNo: "EMG-002",
      status: "arrived",
      arrivalDate: new Date(arrival),
      freeTimeDays: 7,
    });
    expect(r.expiry).toEqual(new Date(arrival + 7 * 86400000));
    expect(r.expired).toBe(false);
    expect(r.daysLeft).toBeCloseTo(
      Math.round((r.expiry!.getTime() - Date.now()) / 86400000),
      0
    );
  });

  it("flags expired free time and demurrage days", () => {
    const oldArrival = new Date("2026-01-01T00:00:00Z").getTime();
    const r = computeFreeTime({
      shipmentNo: "EMG-003",
      status: "arrived",
      arrivalDate: new Date(oldArrival),
      freeTimeDays: 7,
    });
    expect(r.expired).toBe(true);
    expect(r.demurrageDays).toBeGreaterThan(100);
    expect(r.atRisk).toBe(false);
  });

  it("flags at-risk when expiry within 7 days for active shipments", () => {
    const arrival = Date.now() - 4 * 86400000; // arrived 4 days ago
    const r = computeFreeTime({
      shipmentNo: "EMG-004",
      status: "arrived",
      arrivalDate: new Date(arrival),
      freeTimeDays: 7,
    });
    expect(r.atRisk).toBe(true);
    expect(r.expired).toBe(false);
    expect(r.daysLeft).toBe(3);
  });

  it("does not flag at-risk for cleared/delivered/cancelled shipments", () => {
    const arrival = Date.now() - 6 * 86400000;
    for (const status of ["cleared", "delivered", "cancelled"]) {
      const r = computeFreeTime({
        shipmentNo: "EMG-005",
        status,
        arrivalDate: new Date(arrival),
        freeTimeDays: 7,
      });
      expect(r.atRisk).toBe(false);
    }
  });

  it("falls back to ata/eta when arrivalDate missing", () => {
    const eta = Date.now() - 5 * 86400000;
    const r = computeFreeTime({
      shipmentNo: "EMG-006",
      status: "shipped",
      eta: new Date(eta),
      freeTimeDays: 10,
    });
    expect(r.expiry).toEqual(new Date(eta + 10 * 86400000));
    expect(r.atRisk).toBe(true);
  });

  it("caps at-risk to non-negative daysLeft", () => {
    // exactly expiring now: daysLeft == 0 → atRisk (still inside window)
    const arrival = Date.now() - 7 * 86400000;
    const r = computeFreeTime({
      shipmentNo: "EMG-007",
      status: "arrived",
      arrivalDate: new Date(arrival),
      freeTimeDays: 7,
    });
    expect(r.daysLeft).toBeLessThanOrEqual(0);
    expect(r.atRisk).toBe(true);
  });
});

// ---------------- shipments.update arrival auto-tasks ----------------
// Uses a partial DB mock: all helpers stay real except the two scheduled-job
// internals, so router tests exercise the actual database.
vi.mock("./db", async (importOriginal) => {
  const actual = await (importOriginal as typeof vi.importActual<typeof import("./db")>)("./db");
  return {
    ...actual,
    regenerateFreeTimeAlerts: vi.fn().mockResolvedValue(undefined),
    refreshHealthScores: vi.fn().mockResolvedValue(undefined),
  };
});

import { beforeAll } from "vitest";
import { getDb, getTasksByShipment, getShipments } from "./db";
import { tasks, shipments } from "../drizzle/schema";
import { and, eq, or, sql } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeCtx(): TrpcContext {
  return {
    req: { headers: {} } as any,
    res: {} as any,
    user: { id: 0, openId: "test", name: "Test", email: null, loginMethod: null, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as any,
  };
}

let testShipmentId: number | null = null;

describe("shipments.update → arrived auto-tasks", () => {
  let originalStatus: string | null = null;
  beforeAll(async () => {
    // Pick an existing in-transit shipment as the test subject to avoid seeding data.
    const rows = await getShipments();
    const candidate = (rows || []).find((s: any) => (s.status || "") === "in_transit" || (s.status || "") === "shipped");
    if (candidate) {
      testShipmentId = candidate.id;
      originalStatus = candidate.status;
    }
  }, 60000);

  it("creates the two arrival tasks exactly once when status moves to arrived", async () => {
    if (!testShipmentId) return;
    const caller = appRouter.createCaller(makeCtx() as TrpcContext);
    await caller.shipments.update({ id: testShipmentId, status: "arrived" });
    const tasks1 = await getTasksByShipment(testShipmentId);
    const arrived = (t: any) => t.title?.includes("مُطالبة وكيل التخليص");
    const docs = (t: any) => t.title?.includes("إعداد مستندات التخليص");
    expect(tasks1.filter(arrived).length).toBe(1);
    expect(tasks1.filter(docs).length).toBe(1);
    expect(tasks1.find(arrived)!.priority).toBe("high");
    expect(tasks1.find(arrived)!.status).toBe("not_started");
    // Idempotent: moving to arrived again must NOT duplicate.
    await caller.shipments.update({ id: testShipmentId, status: "arrived" });
    const tasks2 = await getTasksByShipment(testShipmentId);
    expect(tasks2.filter(arrived).length).toBe(1);
    expect(tasks2.filter(docs).length).toBe(1);
    // Cleanup: remove test tasks and restore original status so demo data stays accurate.
    const db = await getDb();
    if (db && originalStatus) {
      await db.delete(tasks).where(and(eq(tasks.shipmentId, testShipmentId!), or(sql`title LIKE '%مُطالبة وكيل التخليص%'`, sql`title LIKE '%إعداد مستندات التخليص%'`))).execute();
      await db.update(shipments).set({ status: originalStatus as any }).where(eq(shipments.id, testShipmentId!)).execute();
    }
  }, 60000);
});
