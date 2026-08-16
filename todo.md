# EMG-SCOS Professional Edition v1.0 - Final Enhancement TODO

## Phase 1: Visual Enhancements
- [x] Professional index.css theme (corporate blue, elegant fonts)
- [x] index.html with Google Fonts (Cairo + Inter)
- [x] Add status color coding badges across all pages
- [x] Professional table styling with hover effects and status colors

## Phase 2: Demo Data
- [x] Add demo suppliers
- [x] Add demo shipments with realistic data
- [x] Add demo procurement orders
- [x] Add demo freight bookings
- [x] Add demo customs records
- [x] Add demo costs
- [x] Add demo tasks

## Phase 3: Page Improvements
- [x] Shipment Register - full professional table with color-coded status badges
- [x] Procurement - professional layout with status badges
- [x] Supplier Management - card layout with contact info
- [x] Freight Management - booking tracking with color codes
- [x] Customs Management - ACID/UCR tracking with status
- [x] Cost Control - expense breakdown view
- [x] Documents Center - document type icons and expiry alerts
- [x] Task Manager - priority and due date alerts
- [x] Reports Center - export functionality
- [x] KPI Dashboard - interactive charts
- [x] Master Data - tabbed interface
- [x] Email Templates - professional preview
- [x] Knowledge Center - comprehensive customs info
- [x] Forms Library - categorized forms with download
- [x] Settings - notification toggles
- [x] Audit Log - color-coded actions
- [x] About System - comprehensive info

## Phase 4: Verification
- [x] Screenshot all pages to verify
- [x] Fix any remaining errors (0 TypeScript errors)

## Phase 5: Deliver
- [x] Save checkpoint
- [x] Deliver to user

## Phase 6: Final Data & Dashboard Fixes (Session 3)
- [x] Insert 30 real shipment records (from pasted_content.txt) into DB with related customs/procurement/tasks/freight/costs rows
- [x] Fix schema mismatches (landedCost, updatedAt, orderIndex columns)
- [x] Executive Dashboard (Home): live KPIs from DB (23 active, $176,311 total, 7 cleared, 23 pending), real monthly charts, real status breakdown, NAFEZA/ACID stages, recent activities
- [x] KPI Dashboard: correct On-Time (100%, no delayed), Customs Clearance 23% (7/30), Active Shipments 23, donut status chart with labels
- [x] Operations Dashboard: status-aware arrivals/upcoming/overdue logic
- [x] Reports Center: released/cleared count 7/30, avg clearance computed from arrival->release dates
- [x] Verify API endpoints (shipments/customs/tasks/costs/suppliers.list return 30/30/30/30/10)
- [x] Visual check of all 19 pages

## Phase 7: Professional Features Upgrade (Session 4)
### Backend / Schema
- [x] documents table (documents.* with upload/list/delete via shipmentDocs router: upload (S3), list, delete)
- [x] bank_lc table (LC/TT tracking per shipment: bank, type, amount, status, dates)
- [x] document_check table (draft discrepancy review: invoice/BL/COO/packing vs customs fields)
- [x] API endpoints: shipmentDocs.upload/list/delete, bankLc.*, docCheck.*, alerts.*, tools.freeTimeOverview
- [x] Free time / demurrage helper: calc freeTimeExpiry from arrival + freeDays, demurrage cost estimator
- [x] Excel/PDF export helpers (client: exceljs + jspdf-autotable) with seed of 30 arrivalDate/freeTimeDays, 8 LCs ($297,249), ~24 doc checks, 9 demo documents

### Frontend
- [x] Free Time Alerts page (/alerts): expiry countdown, at-risk shipments, demurrage estimator
- [x] Shipment documents upload & per-shipment docs in Documents Center (S3 upload)
- [x] Bank & LC tracking page (/bank-lc)
- [x] Document Discrepancy Checker page (/doc-check)
- [x] Expanded Knowledge Center: full Incoterms 2020 + NAFEZA/ACID/UCR + import/export procedures
- [x] Excel/PDF export buttons in Reports + Shipment Register
- [x] Notifications bell in dashboard layout (free time + LC alerts)
- [x] Navigation updates for new pages
- [x] Fixed chartData (month guard, no null months, animated charts disabled)

### Verification
- [x] TypeScript 0 errors + vitest pass (1/1 tests passed)
- [x] Screenshot verification of all new pages (/alerts /bank-lc /doc-check /documents /reports /knowledge)
- [x] Checkpoint + deliver (v1.1 checkpoint f1484bfa saved and published)

### Verification (done)
- [x] Checkpoint + deliver

## Phase 8: AI Document Data Extraction (Session 5)
- [x] documents.extractionStatus + extractedData columns (migration applied)
- [x] extractWithLLM: server-side PDF text extraction (pdftotext + pdf-parse fallback), images via vision API, gemini-3.1-pro-preview structured JSON
- [x] shipmentDocs.applyExtraction: maps 25+ fields to real DB columns (shipments/freight/customs), first-wins per target
- [x] File upload filename sanitization (fixed CloudFront 403 on space-containing keys)
- [x] Frontend: AI extraction column/badges + review dialog with confidence % in Documents Center
- [x] E2E verified (doc 60001 → 24 fields extracted, applied to shipment 30001 correctly)
- [x] TypeScript 0 errors + vitest pass + screenshots
- [x] Checkpoint + deliver (pending)

## Phase 9: System Enhancements (Session 6) — Auto-monitoring & Quality

### Scheduled Automation
- [x] Heartbeat handler /api/scheduled/daily-free-time-refresh: recomputes freeTimeExpiry + generates alert_log entries daily
- [x] Register project-level cron via manus-heartbeat CLI (daily, task_uid A6mm3rEmgX4upV4zjmygHW)
- [x] HealthScore auto-update: shipments past freeTime expiry or delayed lower score

### Data Quality & Automation
- [x] Auto-create default tasks when shipment moves to "arrived" status (broker notification + customs docs prep, high priority, not_started, 3-day due; idempotent; cleanup after test; covered by vitest: 15/15 passing)
- [x] Free Time consistency: single computeFreeTime engine on server; expiry now persisted to shipments.freeTimeExpiry by daily job (verified 17/17), used in Alerts + Register + export
- [x] Demo shipment 30001 cleanup: deleted dangling shipment/docs 1-2, reset extractionStatus on test docs 30008/60001

### Testing
- [x] Vitest: shipments API read/write round-trip, freeTime calc unit tests, export helpers smoke tests (core-business.test.ts)
- [x] Vitest: scheduled handler 403/ok/retry-safe + router surface vs real DB (scheduled.test.ts, 14/14 passing)

### Frontend Polish
- [x] Export button per-page consistency: Excel+PDF buttons added to Procurement, Freight Management, Customs Management; Free Time Expiry column + export in Shipment Register (single computeFreeTime engine)
- [x] Loading skeletons on KPI cards: enhanced pulse-shaped skeletons in Home.tsx + full skeleton grid while isLoading in KpiDashboard.tsx

### Verification & Deliver
- [x] Final verification: tsc OK, 15/15 vitest passing, screenshots verified (KPI fixed, Register 30 rows + Free Time column, exports on Procurement/Freight/Customs), cron job confirmed enabled (daily 06:00 UTC)

### Custom Notifications (v1.3)
- [x] notification_settings table in drizzle/schema.ts + SQL migration applied (per-event push toggle)
- [x] sendSmartNotifications helper in server/db.ts (notifyOwner digest, enabled-flag check, 60-min lookback dedupe) + pushEventNotification
- [x] Wire sendSmartNotifications into daily scheduled handler after alert regeneration (returns notifications result)
- [x] notifications tRPC router (settings / updateSetting / test / sendDigest) + appRouter
- [x] Settings page UI: live per-event toggles (7 event types, Arabic/English labels) + test-notification + send-pending-digest buttons
- [x] Event hooks: pushEventNotification(shipment_arrived) on status→arrived; pushEventNotification(discrepancy_found) on docCheck mismatch/missing create
- [x] Vitest: notification settings seed/toggle + per-alert dedupe + disabled-event blocking (18/18 passing)
- [x] Real dedupe: alert_log.notified flag (migration applied) — repeated runs never resend the same digest
- [x] Final verification: tsc 0 errors, 19/19 vitest passing, /settings screenshot verified with all 7 event toggles
