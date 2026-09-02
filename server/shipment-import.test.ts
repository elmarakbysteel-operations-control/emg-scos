import { describe, expect, it } from "vitest";
import {
  normalizeCurrencyCode,
  validateShipmentImport,
} from "../shared/shipmentImportValidation";

describe("shipment import validation", () => {
  it("accepts the normalized workbook contract", () => {
    const result = validateShipmentImport([
      {
        shipmentNo: "MKS-1000002678-SH1",
        status: "arrived",
        priority: "high",
        transportMode: "sea",
        currency: "USD",
        cargoValue: 103211,
        weight: 143400,
        volume: 108,
        freeTimeDays: 20,
        arrivalDate: "2026-08-16 00:00:00",
        freeTimeExpiry: "2026-09-05 00:00:00",
      },
      {
        shipmentNo: "MKS-1000002476",
        status: "confirmed",
        priority: "high",
        transportMode: "sea",
        currency: "EUR",
        cargoValue: 186017,
        freeTimeDays: 0,
      },
    ]);

    expect(result.valid).toBe(true);
    expect(result.duplicateShipmentNos).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("detects duplicates and rejects invalid operational values", () => {
    const result = validateShipmentImport([
      {
        shipmentNo: "DUP-001",
        status: "moving",
        priority: "critical",
        transportMode: "ocean",
        currency: "EURO",
        cargoValue: -1,
        freeTimeDays: 2.5,
        arrivalDate: "not-a-date",
        freeTimeExpiry: "2026-01-01",
      },
      { shipmentNo: "DUP-001", status: "arrived" },
    ]);

    expect(result.valid).toBe(false);
    expect(result.duplicateShipmentNos).toEqual(["DUP-001"]);
    expect(result.errors.some((error) => error.field === "status")).toBe(true);
    expect(result.errors.some((error) => error.field === "currency")).toBe(true);
    expect(result.errors.some((error) => error.field === "freeTimeDays")).toBe(true);
    expect(result.errors.some((error) => error.field === "arrivalDate")).toBe(true);
  });

  it("rejects a Free Time expiry that predates arrival", () => {
    const result = validateShipmentImport([
      {
        shipmentNo: "FT-001",
        status: "arrived",
        arrivalDate: "2026-08-16T00:00:00Z",
        freeTimeExpiry: "2026-08-15T00:00:00Z",
      },
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({ field: "freeTimeExpiry" }));
  });

  it("normalizes valid currency codes and safely falls back for malformed cells", () => {
    expect(normalizeCurrencyCode(" usd ")).toBe("USD");
    expect(normalizeCurrencyCode("eur")).toBe("EUR");
    expect(normalizeCurrencyCode("Notes", "EUR")).toBe("EUR");
    expect(normalizeCurrencyCode(undefined)).toBe("USD");
  });
});
