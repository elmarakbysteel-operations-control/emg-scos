import { readFile } from 'node:fs/promises';
import { getDb } from '../server/db.ts';
import { shipments, procurement, freight, customs, costs, auditLog } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import { validateShipmentImport } from '../shared/shipmentImportValidation.ts';

const payload = JSON.parse(await readFile('/home/ubuntu/shipment_import_payload.json', 'utf8'));
const validation = validateShipmentImport(payload.shipments ?? []);
if (!validation.valid) {
  const preview = validation.errors.slice(0, 8).map((error) => `${error.shipmentNo || `row ${error.row}`} ${error.field}: ${error.message}`).join('; ');
  throw new Error(`Shipment import validation failed (${validation.errors.length} errors): ${preview}`);
}
const db = await getDb();
if (!db) throw new Error('Database connection unavailable');

const shipmentFields = [
  'poNumber', 'supplierName', 'material', 'incoterm', 'originCountry', 'originPort',
  'destinationCountry', 'destinationPort', 'transportMode', 'shippingLine', 'containerNo',
  'containerType', 'blAwbNumber', 'etd', 'eta', 'ata', 'status', 'owner', 'priority',
  'cargoValue', 'currency', 'weight', 'volume', 'healthScore', 'freeTimeDays',
  'arrivalDate', 'freeTimeExpiry', 'remarks',
];

const timestampFields = new Set([
  'etd', 'eta', 'ata', 'arrivalDate', 'freeTimeExpiry', 'requestedDeliveryDate',
  'expectedDeliveryDate', 'actualDeliveryDate', 'poDate', 'rfqDate', 'quotationDate',
  'inspectionDate', 'releaseDate',
]);

function dbValue(key, value) {
  if (value == null || value === '') return null;
  if (timestampFields.has(key)) return new Date(value);
  return value;
}

function pick(source, fields) {
  return Object.fromEntries(fields.map((key) => [key, dbValue(key, source[key])]));
}

function normalizeRecord(source) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, dbValue(key, value)]));
}

async function findShipment(tx, shipmentNo) {
  const matches = await tx.select().from(shipments).where(eq(shipments.shipmentNo, shipmentNo)).limit(2);
  if (matches.length > 1) throw new Error(`Existing duplicate shipmentNo detected: ${shipmentNo}`);
  return matches[0];
}

async function resolveUniquePoNumber(tx, sourcePo, shipmentId, shipmentNo, existingPoNumber) {
  if (!sourcePo) return sourcePo;
  const conflict = await tx.select({ id: procurement.id, shipmentId: procurement.shipmentId })
    .from(procurement).where(eq(procurement.poNumber, sourcePo)).limit(1);
  if (!conflict.length || conflict[0].shipmentId === shipmentId) return sourcePo;

  // Preserve a previously assigned tranche key during reruns; otherwise create a deterministic one.
  let candidate = existingPoNumber && existingPoNumber !== sourcePo
    ? existingPoNumber
    : `${sourcePo}-${shipmentNo.replace(/[^A-Za-z0-9]+/g, '-').slice(-24)}`.slice(0, 100);
  let sequence = 2;
  while (true) {
    const candidateMatch = await tx.select({ id: procurement.id, shipmentId: procurement.shipmentId })
      .from(procurement).where(eq(procurement.poNumber, candidate)).limit(1);
    if (!candidateMatch.length || candidateMatch[0].shipmentId === shipmentId) return candidate;
    const suffix = `-${sequence++}`;
    candidate = `${candidate.slice(0, 100 - suffix.length)}${suffix}`;
  }
}

async function upsertProcurement(tx, shipmentId, source, isNewShipment, shipmentNo) {
  const base = { ...normalizeRecord(source), shipmentId };
  if (!isNewShipment) delete base.approvalStatus; // preserve existing approval workflow when source has no procurement approval field
  const matches = await tx.select({ id: procurement.id, poNumber: procurement.poNumber })
    .from(procurement).where(eq(procurement.shipmentId, shipmentId)).limit(2);
  if (matches.length > 1) throw new Error(`Multiple procurement rows detected for shipment id ${shipmentId}`);
  const existingPoNumber = matches[0]?.poNumber || null;
  const resolvedPoNumber = await resolveUniquePoNumber(tx, base.poNumber, shipmentId, shipmentNo, existingPoNumber);
  if (resolvedPoNumber && resolvedPoNumber !== base.poNumber) {
    const originalPo = base.poNumber;
    base.poNumber = resolvedPoNumber;
    base.remarks = `${base.remarks || ''} | Source PO number: ${originalPo}; unique procurement tranche key: ${resolvedPoNumber}.`;
  }
  if (matches.length === 1) {
    await tx.update(procurement).set(base).where(eq(procurement.id, matches[0].id));
    return 'updated';
  }

  await tx.insert(procurement).values(base);
  return 'created';
}

async function upsertFreight(tx, shipmentId, source) {
  const base = { ...normalizeRecord(source), shipmentId };
  const matches = await tx.select({ id: freight.id }).from(freight).where(eq(freight.shipmentId, shipmentId)).limit(2);
  if (matches.length > 1) throw new Error(`Multiple freight rows detected for shipment id ${shipmentId}`);
  if (matches.length === 1) {
    await tx.update(freight).set(base).where(eq(freight.id, matches[0].id));
    return 'updated';
  }
  await tx.insert(freight).values(base);
  return 'created';
}

async function upsertCustoms(tx, shipmentId, source) {
  const base = { ...normalizeRecord(source), shipmentId };
  const matches = await tx.select({ id: customs.id }).from(customs).where(eq(customs.shipmentId, shipmentId)).limit(2);
  if (matches.length > 1) throw new Error(`Multiple customs rows detected for shipment id ${shipmentId}`);
  if (matches.length === 1) {
    await tx.update(customs).set(base).where(eq(customs.id, matches[0].id));
    return 'updated';
  }
  await tx.insert(customs).values(base);
  return 'created';
}

async function upsertCost(tx, shipmentId, source) {
  if (!source) return 'skipped';
  const base = { ...normalizeRecord(source), shipmentId };
  delete base.sourceInvoiceValue;
  const matches = await tx.select({ id: costs.id }).from(costs).where(eq(costs.shipmentId, shipmentId)).limit(2);
  if (matches.length > 1) throw new Error(`Multiple cost rows detected for shipment id ${shipmentId}`);
  if (matches.length === 1) {
    await tx.update(costs).set(base).where(eq(costs.id, matches[0].id));
    return 'updated';
  }
  await tx.insert(costs).values(base);
  return 'created';
}

const result = {
  sourceFile: payload.sourceFile,
  sourceRows: payload.counts.shipments,
  createdShipments: [],
  updatedShipments: [],
  procurement: { created: 0, updated: 0 },
  freight: { created: 0, updated: 0 },
  customs: { created: 0, updated: 0 },
  costs: { created: 0, updated: 0, skipped: 0 },
};

await db.transaction(async (tx) => {
  for (const source of payload.shipments) {
    const existing = await findShipment(tx, source.shipmentNo);
    const core = pick(source, shipmentFields);
    let shipmentId;
    if (existing) {
      await tx.update(shipments).set(core).where(eq(shipments.id, existing.id));
      shipmentId = existing.id;
      result.updatedShipments.push(source.shipmentNo);
    } else {
      const inserted = await tx.insert(shipments).values({
        shipmentNo: source.shipmentNo,
        companyId: null,
        plantId: null,
        ...core,
      });
      shipmentId = Number(inserted[0].insertId);
      result.createdShipments.push(source.shipmentNo);
    }

    const procurementResult = await upsertProcurement(tx, shipmentId, source.procurement, !existing, source.shipmentNo);
    if (procurementResult !== 'skipped') result.procurement[procurementResult] += 1;
    const freightResult = await upsertFreight(tx, shipmentId, source.freight);
    result.freight[freightResult] += 1;
    const customsResult = await upsertCustoms(tx, shipmentId, source.customs);
    result.customs[customsResult] += 1;
    const costResult = await upsertCost(tx, shipmentId, source.cost);
    result.costs[costResult] += 1;
  }

  await tx.insert(auditLog).values({
    userId: null,
    action: 'workbook_import',
    module: 'shipments',
    details: JSON.stringify({
      sourceFile: payload.sourceFile,
      sourceRows: payload.counts.shipments,
      createdShipments: result.createdShipments.length,
      updatedShipments: result.updatedShipments.length,
      relatedRecords: {
        procurement: result.procurement,
        freight: result.freight,
        customs: result.customs,
        costs: result.costs,
      },
      policy: 'Idempotent by shipmentNo; existing organizational ownership and procurement approval preserved; no document binaries fabricated.',
    }),
  });
});

console.log(JSON.stringify({
  ...result,
  createdShipments: result.createdShipments.length,
  updatedShipments: result.updatedShipments.length,
}, null, 2));

// Drizzle/mysql2 keeps a pool open; this one-time import is complete once the transaction and audit row are committed.
process.exit(0);
