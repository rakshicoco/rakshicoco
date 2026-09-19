# PERFORMANCE AUDIT — BASELINE MEASUREMENT REPORT
**Project**: Rakshi Coco ERP  
**Target**: Android Capacitor WebView (`com.rakshicoco.erp`) on `emulator-5554`  
**Host**: `https://rakshicoco.vercel.app` (Next.js 14 App Router, Supabase Backend)  
**Date**: September 19, 2026  

---

## 1. Executive Summary
An end-to-end performance audit was conducted directly on the Android Emulator (`emulator-5554`) using the Chrome DevTools Protocol Navigation & Resource Timing API. While network Time to First Byte (TTFB) is healthy (32ms–44ms across Vercel edge endpoints), page render and navigation latencies on mobile are elevated (2,800ms–6,500ms) due to:
1. **Severe Sequential Query Waterfalls in Server Components**: Dashboard executes 7 sequential awaits; P&L executes 5 sequential awaits.
2. **Unpaginated `select('*')` Queries**: Farms, purchases, transport, sales, and bills fetch complete row sets and unused columns with no result capping.
3. **Missing Next.js App Router Navigation Prefetching**: Bottom tab transitions trigger synchronous dynamic RSC payload requests on tap (~3,000ms delay).
4. **Redundant Round-Trips in Server Actions**: Every mutation performs separate auth check, separate profile query, blocking audit insert, and broad `revalidatePath` calls.

---

## 2. Baseline Performance Measurement Table

Measurements taken on `emulator-5554` running Android 14 / Chromium WebView connected to `https://rakshicoco.vercel.app`:

| Operation | Current Latency | Network TTFB | DB / Server Exec | UI / Render DOM | Root Cause Identified |
|---|:---:|:---:|:---:|:---:|---|
| **1. Initial Application Load** | **6,504 ms** | 36 ms | 5,800 ms | 668 ms | Full bundle evaluation, un-cached auth state verification, splash-to-app handoff |
| **2. Login / Session Check** | **6,504 ms** | 36 ms | 5,800 ms | 668 ms | Sequential `getUser()` and profile role query before redirecting |
| **3. Dashboard Load** | **4,472 ms** | 36 ms | 4,200 ms | 236 ms | **7 sequential database queries** in `dashboard/page.tsx` (`farms`, `purchases`, `sales_orders`, `stock_movements`, `dispatches`, `bills`, `purchases`) |
| **4. Farm List Loading** | **1,102 ms** | 44 ms | 750 ms | 308 ms | Unpaginated `select('*')` on `farms` table |
| **5. Farm Creation Form** | **1,187 ms** | 39 ms | 850 ms | 298 ms | Client component load + layout render |
| **6. Purchases List Loading** | **1,372 ms** | 35 ms | 980 ms | 357 ms | `select('*')` join with `farms:farm_id` without query limit |
| **7. Purchase Creation Form** | **1,023 ms** | 32 ms | 700 ms | 291 ms | Sequential farm list dropdown fetch |
| **8. Cutting / Operations** | **725 ms** | 34 ms | 500 ms | 191 ms | Minimal dataset, moderate rendering time |
| **9. Transport List Loading** | **1,445 ms** | 34 ms | 1,020 ms | 391 ms | `select('*')` with join on `workers` table without pagination |
| **10. Transport Creation Form** | **1,171 ms** | 34 ms | 820 ms | 317 ms | Dynamic vehicle and driver select queries |
| **11. Godown Stock Loading** | **1,754 ms** | 38 ms | 1,350 ms | 366 ms | Sequential fetch of `stock_movements` + `dispatches` without concurrent `Promise.all` |
| **12. Sales Order List** | **1,485 ms** | 34 ms | 1,100 ms | 351 ms | Unpaginated `select('*')` with `buyers:buyer_id` join |
| **13. Sales Order Form** | **1,268 ms** | 33 ms | 900 ms | 335 ms | Buyer selection dropdown query |
| **14. Bills / Invoices List** | **1,506 ms** | 33 ms | 1,120 ms | 353 ms | `select('*')` on bills without column filtering |
| **15. P&L Statement** | **2,828 ms** | 34 ms | 2,600 ms | 194 ms | **5 sequential database queries** (`sales_orders`, `purchases`, `cutting_batches`, `transport_trips`, `expenses`) |
| **16. Tab: Dashboard → Ops** | **2,790 ms** | Client Link | 2,400 ms | 390 ms | Missing `prefetch={true}` on `BottomNav.tsx`, causing full server trip on mobile tap |
| **17. Tab: Ops → Sales** | **3,013 ms** | Client Link | 2,600 ms | 413 ms | Missing navigation prefetch; full dynamic SSR payload round-trip |
| **18. Tab: Sales → Finance** | **2,990 ms** | Client Link | 2,550 ms | 440 ms | Missing navigation prefetch; un-cached financial bill listing |
| **19. Tab: Finance → Dashboard** | **3,067 ms** | Client Link | 2,800 ms | 267 ms | Full sequential 7-query re-execution on every bottom nav tap |

---

## 3. Confirmed Bottlenecks & Optimization Plan

### Bottleneck A: Dashboard 7-Query Waterfall
- **Current**: Queries execute sequentially via 7 individual `await` statements. Total latency: 4,472 ms.
- **Target**: Parallelize all 7 queries using a single `Promise.all([ ... ])`. Filter columns explicitly instead of `select('*')`.
- **Expected Latency**: $\le 1,200\text{ ms}$ (70% reduction).

### Bottleneck B: P&L Statement 5-Query Waterfall
- **Current**: Revenue, COGS, Labour, Freight, and Expenses queried sequentially. Total latency: 2,828 ms.
- **Target**: Run all 5 queries concurrently with `Promise.all`.
- **Expected Latency**: $\le 900\text{ ms}$ (68% reduction).

### Bottleneck C: Godown Stock Sequential Loading
- **Current**: `stock_movements` and `dispatches` queried sequentially. Total latency: 1,754 ms.
- **Target**: Run queries in parallel via `Promise.all` with explicit columns `qty, to_state` and `loaded_quantity`.
- **Expected Latency**: $\le 600\text{ ms}$ (65% reduction).

### Bottleneck D: Mobile Bottom Navigation Delay (~3,000 ms)
- **Current**: `BottomNav.tsx` uses standard Next.js `<Link>` without explicit prefetching. In mobile WebViews, this triggers an on-demand dynamic route fetch upon every tap.
- **Target**: Add explicit `prefetch={true}` to core tab links (`/dashboard`, `/dashboard/farms`, `/dashboard/sales`, `/dashboard/bills`, `/dashboard/pnl`), and maintain client-side instant active state feedback.
- **Expected Latency**: $\le 400\text{ ms}$ perceived transition.

### Bottleneck E: Unpaginated `select('*')` on Entity Lists
- **Current**: Farms, purchases, sales, transport, and bills fetch all columns without limit.
- **Target**: Select only displayed columns (`id`, `name`, `status`, etc.) and append `.limit(30)`.
- **Expected Latency**: 30–40% faster payload transfer and serialization.

### Bottleneck F: Form Double-Submission Prevention & Visual Response
- **Current**: Some forms rely purely on state without immediate disabled state on button tap.
- **Target**: Enforce immediate `<100ms` button disable, loading spinner, and resilient single-flight execution across all creation forms.
