import "dotenv/config";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1) Derive arrivalDate from customs.arrivalDate or shipments.ata/eta where available,
//    and set sensible freeTimeDays based on shipment status.
const [customsRows] = await conn.query(
  "SELECT shipmentId, arrivalDate FROM customs WHERE arrivalDate IS NOT NULL"
);
for (const c of customsRows) {
  await conn.query(
    "UPDATE shipments SET arrivalDate = ? WHERE id = ? AND arrivalDate IS NULL",
    [c.arrivalDate, c.shipmentId]
  );
}

// For arrived/customs/cleared/delivered shipments without arrivalDate, use eta or now-30d.
const [missing] = await conn.query(
  "SELECT id, status, eta, ata, arrivalDate FROM shipments WHERE arrivalDate IS NULL AND status IN ('arrived','customs','cleared','delivered')"
);
for (const m of missing) {
  const d = m.ata || m.eta || new Date(Date.now() - 30 * 86400000);
  await conn.query("UPDATE shipments SET arrivalDate = ? WHERE id = ?", [d, m.id]);
}

// 2) Assign freeTimeDays: 14 for sea arrived/in-clearance, 7 for cleared (already used), 10 default active.
const [all] = await conn.query("SELECT id, status FROM shipments");
for (const s of all) {
  let days = 10;
  if (["arrived", "customs", "delayed", "in_transit"].includes(s.status)) days = 14;
  else if (["cleared", "delivered"].includes(s.status)) days = 14;
  else if (s.status === "draft" || s.status === "confirmed") days = 0;
  await conn.query("UPDATE shipments SET freeTimeDays = ? WHERE id = ?", [days, s.id]);
}

// 3) Demo bank_lc records linked to some shipments.
const [sampleShipments] = await conn.query(
  "SELECT id, shipmentNo, cargoValue FROM shipments WHERE status IN ('arrived','customs','in_transit','delayed') LIMIT 8"
);
const banks = ["Bank of Egypt", "National Bank of Egypt", "Banque Misr", "Commercial International Bank"];
const payTypes = ["lc", "lc_at_sight", "lc_90days", "tt"];
let i = 0;
for (const s of sampleShipments) {
  const amt = (s.cargoValue || 5000) * (0.9 + i % 3) ;
  const statusCycle = ["issued", "documents_presented", "submitted_to_bank", "pending_application", "accepted", "paid", "issued", "amendment"];
  const st = statusCycle[i % statusCycle.length];
  const appDate = new Date(Date.now() - (45 - i * 4) * 86400000);
  const issueDate = new Date(appDate.getTime() + 7 * 86400000);
  const expiryDate = new Date(Date.now() + (20 + i * 5) * 86400000);
  await conn.query(
    `INSERT INTO bank_lc (shipmentId, bankName, paymentType, lcNumber, amount, currency, status, applicationDate, issuanceDate, expiryDate)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [s.id, banks[i % 4], payTypes[i % 4], `LC-${s.shipmentNo}`, Math.round(amt), "USD", st, appDate, issueDate, expiryDate]
  );
  i++;
}

// 4) Demo doc_check records with some mismatches (realistic discrepancies).
const [checkShipments] = await conn.query(
  "SELECT id, shipmentNo FROM shipments WHERE status IN ('arrived','customs') LIMIT 4"
);
const checks = [
  ["commercial_invoice", "Description", "مطابق", "مطابق", "match", "low"],
  ["commercial_invoice", "Total Value", "متوقع", "مطابق", "match", "low"],
  ["bill_of_lading", "ACID Number", "4088888888888888888", "مطابق", "match", "low"],
  ["certificate_of_origin", "HS Code", "7208.51", "7208.52", "mismatch", "high"],
  ["bill_of_lading", "Consignee Name", "ALMARAKBY Group", "ALMARAKBY STEEL", "mismatch", "medium"],
  ["packing_list", "Total Weight", "25000 kg", "25000 kg", "match", "low"],
  ["commercial_invoice", "Incoterm", "CIF Alexandria", "CIF Alexandria Old Port", "mismatch", "medium"],
  ["certificate_of_origin", "Country of Origin", "Austria", "مفقود", "missing", "critical"],
];
let j = 0;
for (const s of checkShipments) {
  for (const ch of checks) {
    await conn.query(
      `INSERT INTO doc_check (shipmentId, docName, docType, fieldName, expectedValue, actualValue, matches, severity)
       VALUES (?,?,?,?,?,?,?,?)`,
      [s.id, `${ch[0].replace("_", " ").toUpperCase()} - ${s.shipmentNo}`, ch[0], ch[1], ch[2], ch[3], ch[4], ch[5]]
    );
    j++;
  }
}

// 5) Generate alerts now that data exists.
const [shipments] = await conn.query("SELECT * FROM shipments");
const now = Date.now();
for (const s of shipments) {
  const arrival = s.arrivalDate || s.ata || s.eta;
  if (!arrival) continue;
  const days = Math.max(0, Number(s.freeTimeDays || 0));
  const expiryMs = new Date(arrival).getTime() + days * 86400000;
  const daysLeft = Math.round((expiryMs - now) / 86400000);
  const expired = now > expiryMs;
  const demurrageDays = expired ? Math.ceil((now - expiryMs) / 86400000) : 0;
  const atRisk = !expired && daysLeft >= 0 && daysLeft <= 7 && !["cleared", "delivered", "cancelled"].includes(s.status || "");
  if (expired && !["cleared", "delivered", "cancelled"].includes(s.status || "")) {
    await conn.query(
      `INSERT INTO alert_log (shipmentId, alertType, severity, title, message) VALUES (?,?,?,?,?)`,
      [s.id, "demurrage_risk", "critical", `Free Time: ${s.shipmentNo} — انتهى`, `السماح المجاني انتهى قبل ${demurrageDays} يوم. يُرجى التواصل مع الخط الملاحي فورًا.`]
    );
  } else if (atRisk) {
    const expDate = new Date(expiryMs).toLocaleDateString();
    await conn.query(
      `INSERT INTO alert_log (shipmentId, alertType, severity, title, message) VALUES (?,?,?,?,?)`,
      [s.id, "free_time_expiry", "high", `Free Time: ${s.shipmentNo} — ينتهي خلال ${daysLeft} يوم`, `السماح المجاني ينتهي في ${expDate}. يرجى الإسراع بالتخليص.`]
    );
  }
}
const [lcRows] = await conn.query("SELECT * FROM bank_lc");
for (const lc of lcRows) {
  if (!lc.expiryDate || ["paid", "closed"].includes(lc.status || "")) continue;
  const diff = new Date(lc.expiryDate).getTime() - now;
  if (diff <= 7 * 86400000 && diff > 0) {
    await conn.query(
      `INSERT INTO alert_log (shipmentId, alertType, severity, title, message) VALUES (?,?,?,?,?)`,
      [lc.shipmentId, "lc_expiry", "high", `اعتماد ينتهي: ${lc.lcNumber}`, `ينتهي خلال ${Math.ceil(diff / 86400000)} يوم — يُرجى مراجعة البنك.`]
    );
  } else if (diff <= 0) {
    await conn.query(
      `INSERT INTO alert_log (shipmentId, alertType, severity, title, message) VALUES (?,?,?,?,?)`,
      [lc.shipmentId, "lc_expiry", "critical", `اعتماد منتهي: ${lc.lcNumber}`, `تاريخ الصلاحية قد مر — يُرجى التمديد فورًا.`]
    );
  }
}

const [alertCount] = await conn.query("SELECT COUNT(*) AS c FROM alert_log");
console.log("Seeded. alert_log rows:", alertCount[0].c);
await conn.end();
process.exit(0);
