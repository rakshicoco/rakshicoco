# RAKSHI COCO ERP — BUILD 24 ROUTE AND FEATURE AUDIT

**Date**: September 19, 2026  
**Auditor**: Antigravity Autonomous Agent  
**Target Environment**: Production (`https://rakshicoco.vercel.app`)  
**Android App Package**: `com.rakshicoco.erp`

---

## 1. Executive Summary & Root Cause of 404 Errors

The user-reported **404 "This page could not be found"** error has been diagnosed systematically:
1. **Direct Route Missing for New Actions**: Multiple UI list pages render a "Create ..." or "New ..." action button pointing to routes that did not exist on the filesystem (`/dashboard/bills/new`, `/dashboard/expenses/new`, `/dashboard/farm-payments/new`, `/dashboard/cutting/new`, `/dashboard/grouping/new`, `/dashboard/processing/new`, `/dashboard/teams/new`, `/dashboard/workers/new`, `/dashboard/dispatch/new`, `/dashboard/labour-payments/new`).
2. **Dynamic Route Collision**: In particular, clicking "Create Bill" at `/dashboard/bills/new` was routed by Next.js to `/dashboard/bills/[id]` with `params.id = 'new'`. The page query `supabase.from('bills').select('*').eq('id', 'new').single()` returned `null`, triggering `notFound()`, producing an explicit Next.js 404 error page.
3. **Database Backend State**: Crucially, the underlying database tables (`bills`, `expenses`, `payments`, `cutting_batches`, `grouping_batches`, `teams`, `workers`, `dispatches`, etc.) and server actions in `src/lib/actions/` **already exist and are functional**. The breakdown was strictly in missing UI route page handlers and selectors.

---

## 2. Inventory of Existing Routes Under `src/app`

A complete recursive scan of `src/app` reveals 38 active page routes:

| Route Path | Type | Purpose / Description |
|---|---|---|
| `/` | Redirect | Redirects to `/dashboard` or `/login` |
| `/login` | Auth | Mobile phone / email authentication |
| `/dashboard` | Dashboard | Operations overview, working capital, live KPIs |
| `/dashboard/audit-log` | System | Audit trail viewer |
| `/dashboard/bills` | Finance | Bills & commercial invoices list |
| `/dashboard/bills/[id]` | Finance | Bill invoice detail view |
| `/dashboard/buyer-payments` | Finance | Payments received from buyers |
| `/dashboard/buyer-payments/new` | Finance | Record buyer collection form |
| `/dashboard/buyers` | Sales | Directory of active coconut buyers |
| `/dashboard/buyers/new` | Sales | Onboard new buyer form |
| `/dashboard/cash-flow` | Finance | Cash flow statement |
| `/dashboard/cutting` | Operations | Coconut cutting batch list |
| `/dashboard/dispatch` | Sales/Logistics | Dispatches to buyers list |
| `/dashboard/expenses` | Finance | Operational expenses list |
| `/dashboard/farm-followups` | Operations | Farm harvest scheduling follow-ups |
| `/dashboard/farm-payments` | Finance | Disbursements made to coconut farmers |
| `/dashboard/farms` | Operations | Coconut groves & farm directory |
| `/dashboard/farms/[id]` | Operations | Farm grove detail & yield history |
| `/dashboard/farms/new` | Operations | Add new farm form |
| `/dashboard/grouping` | Operations | Coconut grouping & sorting batches |
| `/dashboard/labour-payments` | Operations | Labour wages & payout list |
| `/dashboard/notifications` | System | Notification feed |
| `/dashboard/payables` | Finance | Outstanding farmer & labour liabilities |
| `/dashboard/pnl` | Finance | Profit & loss statement |
| `/dashboard/processing` | Operations | Dehusking & copra processing batches |
| `/dashboard/purchases` | Operations | Purchase orders & harvest procurement |
| `/dashboard/purchases/[id]` | Operations | Purchase order detail & reconciliation |
| `/dashboard/purchases/new` | Operations | Schedule new coconut harvest purchase |
| `/dashboard/receivables` | Finance | Outstanding buyer receivables ledger |
| `/dashboard/reports` | System | Operational & executive reports |
| `/dashboard/sales` | Sales | Sales orders list |
| `/dashboard/sales/new` | Sales | Create sales order form |
| `/dashboard/settings` | System | System preferences & credentials |
| `/dashboard/stock` | Operations | Godown inventory & coconut stock movements |
| `/dashboard/teams` | Operations | Harvester teams directory |
| `/dashboard/transport` | Logistics | Inbound/outbound transport trips list |
| `/dashboard/transport/new` | Logistics | Log new transport trip form |
| `/dashboard/workers` | Operations | Worker directory |

---

## 3. Navigation Hrefs & Broken Link Audit

Scanning every `href` in all components and pages revealed the following broken link targets:

| Broken Href Target | Source File & Component | Cause Classification |
|---|---|---|
| `/dashboard/bills/new` | `src/app/dashboard/bills/page.tsx` | ROUTE MISSING (Falls through to `bills/[id]` where id='new' => 404) |
| `/dashboard/expenses/new` | `src/app/dashboard/expenses/page.tsx` | ROUTE MISSING |
| `/dashboard/farm-payments/new` | `src/app/dashboard/farm-payments/page.tsx`, `payables/page.tsx` | ROUTE MISSING |
| `/dashboard/cutting/new` | `src/app/dashboard/cutting/page.tsx` | ROUTE MISSING |
| `/dashboard/grouping/new` | `src/app/dashboard/grouping/page.tsx` | ROUTE MISSING |
| `/dashboard/processing/new` | `src/app/dashboard/processing/page.tsx` | ROUTE MISSING |
| `/dashboard/dispatch/new` | `src/app/dashboard/dispatch/page.tsx` | ROUTE MISSING |
| `/dashboard/teams/new` | `src/app/dashboard/teams/page.tsx` | ROUTE MISSING |
| `/dashboard/workers/new` | `src/app/dashboard/workers/page.tsx` | ROUTE MISSING |
| `/dashboard/labour-payments/new` | `src/app/dashboard/labour-payments/page.tsx` | ROUTE MISSING |
| `/dashboard/sales/[id]` | `src/app/dashboard/dispatch/page.tsx`, `bills/page.tsx`, `buyer-payments/page.tsx` | ROUTE MISSING |
| `/dashboard/dispatch/[id]` | `src/app/dashboard/bills/page.tsx`, `dispatch/page.tsx` | ROUTE MISSING |
| `/dashboard/farms/[id]/edit` | Contract requirement | ROUTE MISSING |
| `/dashboard/purchases/[id]/edit` | Contract requirement | ROUTE MISSING |
| `/dashboard/recycle-bin` | Contract requirement | ROUTE MISSING |
| `/dashboard/settings/account` | Contract requirement | ROUTE MISSING |
| `/dashboard/settings/business` | Contract requirement | ROUTE MISSING |

---

## 4. Server Actions Currently Implemented

All core server actions in `src/lib/actions/` have been audited:

| Module File | Exported Actions | Authentication & Security |
|---|---|---|
| `farm.ts` | `createFarm`, `updateFarm`, `archiveFarm` | `requireRole(["ADMIN", "MANAGER"])`, `logAudit` |
| `purchase.ts` | `createPurchase`, `completeHarvest`, `changePurchaseStatus` | `requireRole(["ADMIN", "MANAGER", "OPERATOR"])`, `logAudit` |
| `processing.ts` | `createCuttingBatch`, `completeCuttingBatch`, `createGroupingBatch` | `requireRole(["ADMIN", "MANAGER", "OPERATOR"])`, `logAudit` |
| `sales.ts` | `createBuyer`, `createSalesOrder`, `confirmSalesOrder`, `createDispatch` | `requireRole(["ADMIN", "SALES", "MANAGER"])`, `logAudit` |
| `teams.ts` | `createTeam`, `updateTeam` | `requireRole(["ADMIN", "MANAGER"])`, `logAudit` |
| `workers.ts` | `createWorker`, `updateWorker` | `requireRole(["ADMIN", "MANAGER"])`, `logAudit` |
| `finance.ts` | `createPayment`, `createBill` | `requireRole(["ADMIN", "FINANCE", "MANAGER"])`, `logAudit` |
| `transport.ts` | `createTransportTrip`, `receiveTransportTrip` | `requireRole(["ADMIN", "LOGISTICS", "OPERATOR", "MANAGER"])`, `logAudit` |
| `stock.ts` | `createStockMovement` | `requireRole(["ADMIN", "MANAGER", "OPERATOR"])`, `logAudit` |
| `expenses.ts` | `createExpense` | `requireRole(["ADMIN", "FINANCE", "MANAGER"])`, `logAudit` |
| `notifications.ts` | `createNotification`, `markNotificationRead` | `requireRole(["ADMIN", "MANAGER", ...])` |
| `farm_followups.ts` | `createFarmFollowUp`, `completeFarmFollowUp` | `requireRole(["ADMIN", "MANAGER"])`, `logAudit` |
| `settings.ts` | `updateAppSettings` | `requireRole(["ADMIN"])`, `logAudit` |

---

## 5. Supabase Database Schema, Tables & Objects

Active PostgREST verification confirms:

| Table | Status | Key Columns |
|---|---|---|
| `profiles` | Active (1 row) | `id, role, full_name, email, phone, status, created_at, updated_at` |
| `farms` | Active (3 rows, 2 active, 1 archived) | `id, name, owner_name, phone, village, total_trees, expected_yield, notes, last_harvest_date, expected_next_harvest, active, created_by, created_at` |
| `farm_followups` | Active (1 row) | `id, farm_id, date, notes, status, next_follow_up, created_by, created_at` |
| `purchases` | Active (2 rows) | `id, farm_id, expected_date, expected_quantity, rate, advance_amount, notes, status, harvest_date, actual_quantity, balance, created_by, created_at` |
| `teams` | Active (0 rows) | `id, name, active, workload, created_at, updated_at` |
| `workers` | Active (0 rows) | `id, name, phone, role, team_id, active, created_at, updated_at` |
| `cutting_batches` | Active (1 row) | `id, purchase_id, team_id, date, expected_output_nuts, rate_per_nut, actual_output_nuts, rejection_count, grouping_batch_id, status, created_by, created_at` |
| `grouping_batches` | Active (0 rows) | `id, purchase_id, cutting_batch_id, qty_input, qty_grouped, damaged, rejected, ready_qty, team_id, rate, labour_amount, paid, balance, status, date, created_at, updated_at` |
| `buyers` | Active (1 row) | `id, name, contact_person, phone, gstin, address, created_by, created_at` |
| `sales_orders` | Active (1 row) | `id, buyer_id, date, product_type, quantity, rate, total_amount, delivery_address, status, created_by, created_at` |
| `transport_trips` | Active (1 row) | `id, source_type, source_id, destination_type, destination_id, vehicle_number, driver_name, driver_phone, expected_quantity, received_quantity, damaged_quantity, freight_amount, date, notes, status, created_by, created_at` |
| `dispatches` | Active (1 row) | `id, sales_order_id, date, vehicle_number, driver_name, driver_phone, loaded_quantity, status, created_by, created_at` |
| `stock_movements` | Active (1 row) | `id, godown_id, product_type, qty, from_state, to_state, reference_type, reference_id, notes, created_by, created_at` |
| `bills` | Active (1 row) | `id, entity_type, entity_id, amount, date, due_date, description, status, balance_due, created_by, created_at` |
| `payments` | Active (1 row) | `id, entity_type, entity_id, amount, date, payment_method, reference, notes, type, created_by, created_at` |
| `expenses` | Active (0 rows) | `id, category, ref_type, ref_id, amount, date, vendor, bill_id, paid, notes, created_at, updated_at` |
| `audit_logs` | Active (2 rows) | `audit_id, user_id, action, entity_type, entity_id, details, timestamp` |
| `notifications` | Active (0 rows) | `id, user_id, title, message, type, link, read, created_at` |
| `app_settings` | Active (1 row) | `id, company_name, gstin, contact_email, contact_phone, expected_harvest_interval_days, updated_by, updated_at` |

**Missing Objects Identified**:
1. `processing_batches`: UI refers to processing batches, currently falls back to `grouping_batches`. Table should be created or mapped cleanly.
2. `storage.buckets`: No `avatars` bucket currently configured in Supabase Storage.
3. Soft-delete columns (`deleted_at`, `deleted_by`, `delete_reason`, `scheduled_delete_at`): Not yet present on entities.
4. `avatar_url` on `profiles`: Not yet present.

---

## 6. Existing Security, RLS & Role Access

1. **Row Level Security (RLS)**:
   - Migration `0003_complete_fix.sql` enables RLS across all operational tables with `"allow_all_auth_%s"` for authenticated users.
   - Unauthenticated requests are blocked at both Next.js middleware level (`redirect('/login')`) and Supabase RLS level.
2. **Server Action Authorization**:
   - `requireRole(["ADMIN", ...])` validates user role against `profiles.role` using server-side admin client before any mutation runs.
   - Client-side role escalation is prevented because role checks occur strictly server-side.
3. **Secret Protection**:
   - `SUPABASE_SERVICE_ROLE_KEY` is present only in `.env.local` on the server and is never sent to the client bundle.
   - `OPENROUTER_API_KEY` is kept server-only.

---

## 7. Search & Filter State

- List pages currently render visual `<Input type="search" />` elements that are unbound (no state, no query parameter, no database filtering).
- There is no central `GlobalSearch` component.
- All list pages will be upgraded with debounced, server-side search querying proper database columns (`name`, `id`, `phone`, `village`, etc.).

---

## 8. Mobile Navigation & FAB State

- **Current Floating Button**: `<QuickActionButton />` renders a large `+` floating action button at bottom-right which opens 5 shortcuts (`New Farm`, `New Purchase`, `New Sale`, `New Payment`, `New Transport`).
- **Build 24 Requirement**:
  - Remove the floating menu from bottom-right.
  - Add top-right hamburger/menu button to `TopBar` that triggers `MobileDrawer`.
  - Dedicate bottom-right floating position to the **Rakshi AI Assistant FAB** (🤖 / AI icon), expanding to "Rakshi AI" and opening the AI Assistant panel.
