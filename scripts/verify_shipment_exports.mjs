import { mkdir, writeFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getDb } from "../server/db.ts";
import { shipments } from "../drizzle/schema.ts";

const outputDir = "/home/ubuntu/shipment_export_verification";
await mkdir(outputDir, { recursive: true });
const db = await getDb();
if (!db) throw new Error("Database connection unavailable");
const rows = await db.select().from(shipments).orderBy(shipments.shipmentNo).execute();
const columns = [
  { header: "Shipment No.", key: "shipmentNo", getValue: (row) => row.shipmentNo ?? "" },
  { header: "Supplier", key: "supplierName", getValue: (row) => row.supplierName ?? "" },
  { header: "Status", key: "status", getValue: (row) => row.status ?? "" },
  { header: "Transport", key: "transportMode", getValue: (row) => row.transportMode ?? "" },
  { header: "Currency", key: "currency", getValue: (row) => row.currency ?? "" },
  { header: "Cargo Value", key: "cargoValue", getValue: (row) => Number(row.cargoValue ?? 0) },
  { header: "Free Time Days", key: "freeTimeDays", getValue: (row) => Number(row.freeTimeDays ?? 0) },
  { header: "Free Time Expiry", key: "freeTimeExpiry", getValue: (row) => row.freeTimeExpiry ? new Date(row.freeTimeExpiry).toISOString().slice(0, 10) : "" },
];

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet("Shipments");
worksheet.columns = columns.map((column) => ({ header: column.header, key: column.key, width: 22 }));
for (const row of rows) worksheet.addRow(Object.fromEntries(columns.map((column) => [column.key, column.getValue(row)])));
const xlsxPath = `${outputDir}/Shipment_Register_imported.xlsx`;
await workbook.xlsx.writeFile(xlsxPath);

const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
doc.setFontSize(16);
doc.text("Shipment Register Report", 14, 16);
doc.setFontSize(9);
doc.text(`Rows: ${rows.length}`, 14, 23);
autoTable(doc, {
  startY: 28,
  head: [columns.map((column) => column.header)],
  body: rows.map((row) => columns.map((column) => String(column.getValue(row)))),
  styles: { fontSize: 8, cellPadding: 2 },
  headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: "bold" },
  showHead: "everyPage",
});
const pdfPath = `${outputDir}/Shipment_Register_imported.pdf`;
await writeFile(pdfPath, Buffer.from(doc.output("arraybuffer")));
console.log(JSON.stringify({ outputDir, rows: rows.length, firstShipment: rows[0]?.shipmentNo, lastShipment: rows.at(-1)?.shipmentNo, xlsxPath, pdfPath }, null, 2));
process.exit(0);
