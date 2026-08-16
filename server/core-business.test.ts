import { describe, expect, it } from "vitest";
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
