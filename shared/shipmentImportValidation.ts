export const SHIPMENT_STATUSES = [
  "draft",
  "confirmed",
  "in_transit",
  "arrived",
  "customs",
  "cleared",
  "delivered",
  "cancelled",
  "delayed",
] as const;

export const SHIPMENT_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const TRANSPORT_MODES = ["sea", "air", "land", "rail"] as const;

export type ShipmentImportCandidate = {
  shipmentNo?: unknown;
  status?: unknown;
  priority?: unknown;
  transportMode?: unknown;
  currency?: unknown;
  cargoValue?: unknown;
  weight?: unknown;
  volume?: unknown;
  freeTimeDays?: unknown;
  arrivalDate?: unknown;
  freeTimeExpiry?: unknown;
};

export type ShipmentImportValidation = {
  valid: boolean;
  duplicateShipmentNos: string[];
  errors: Array<{ row: number; shipmentNo: string; field: string; message: string }>;
};

const ISO_CURRENCY = /^[A-Z]{3}$/;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeCurrencyCode(value: unknown, fallback = "USD"): string {
  const candidate = String(value ?? "").trim().toUpperCase();
  return ISO_CURRENCY.test(candidate) ? candidate : fallback;
}

export function validateShipmentImport(
  rows: ShipmentImportCandidate[],
): ShipmentImportValidation {
  const errors: ShipmentImportValidation["errors"] = [];
  const counts = new Map<string, number>();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const shipmentNo = String(row.shipmentNo ?? "").trim();
    if (!shipmentNo) {
      errors.push({ row: rowNumber, shipmentNo: "", field: "shipmentNo", message: "Shipment number is required" });
    } else {
      counts.set(shipmentNo, (counts.get(shipmentNo) ?? 0) + 1);
    }

    if (row.status != null && !SHIPMENT_STATUSES.includes(row.status as (typeof SHIPMENT_STATUSES)[number])) {
      errors.push({ row: rowNumber, shipmentNo, field: "status", message: `Unsupported shipment status: ${String(row.status)}` });
    }
    if (row.priority != null && !SHIPMENT_PRIORITIES.includes(row.priority as (typeof SHIPMENT_PRIORITIES)[number])) {
      errors.push({ row: rowNumber, shipmentNo, field: "priority", message: `Unsupported priority: ${String(row.priority)}` });
    }
    if (row.transportMode != null && !TRANSPORT_MODES.includes(row.transportMode as (typeof TRANSPORT_MODES)[number])) {
      errors.push({ row: rowNumber, shipmentNo, field: "transportMode", message: `Unsupported transport mode: ${String(row.transportMode)}` });
    }

    if (row.currency != null && !ISO_CURRENCY.test(String(row.currency).trim().toUpperCase())) {
      errors.push({ row: rowNumber, shipmentNo, field: "currency", message: "Currency must be a three-letter ISO code" });
    }

    for (const field of ["cargoValue", "weight", "volume"] as const) {
      const value = row[field];
      if (value != null && value !== "" && !isFiniteNumber(value)) {
        errors.push({ row: rowNumber, shipmentNo, field, message: "Value must be a finite number" });
      }
      if (isFiniteNumber(value) && value < 0) {
        errors.push({ row: rowNumber, shipmentNo, field, message: "Value cannot be negative" });
      }
    }

    if (row.freeTimeDays != null && row.freeTimeDays !== "") {
      if (!isFiniteNumber(row.freeTimeDays) || !Number.isInteger(row.freeTimeDays) || row.freeTimeDays < 0) {
        errors.push({ row: rowNumber, shipmentNo, field: "freeTimeDays", message: "Free Time days must be a non-negative integer" });
      }
    }

    const arrivalDate = parseDate(row.arrivalDate);
    if (row.arrivalDate != null && row.arrivalDate !== "" && !arrivalDate) {
      errors.push({ row: rowNumber, shipmentNo, field: "arrivalDate", message: "Invalid arrival date" });
    }
    const expiry = parseDate(row.freeTimeExpiry);
    if (row.freeTimeExpiry != null && row.freeTimeExpiry !== "" && !expiry) {
      errors.push({ row: rowNumber, shipmentNo, field: "freeTimeExpiry", message: "Invalid Free Time expiry date" });
    }
    if (arrivalDate && expiry && expiry.getTime() < arrivalDate.getTime()) {
      errors.push({ row: rowNumber, shipmentNo, field: "freeTimeExpiry", message: "Free Time expiry cannot precede arrival date" });
    }
  });

  const duplicateShipmentNos = Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([shipmentNo]) => shipmentNo)
    .sort();

  duplicateShipmentNos.forEach((shipmentNo) => {
    errors.push({ row: 0, shipmentNo, field: "shipmentNo", message: "Duplicate shipment number in import payload" });
  });

  return { valid: errors.length === 0, duplicateShipmentNos, errors };
}
