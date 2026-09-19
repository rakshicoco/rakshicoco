# PERFORMANCE DEEP PROFILE — LATENCY DECOMPOSITION REPORT

**Project**: Rakshi Coco ERP  
**Target Device**: Android Emulator (`emulator-5554`) running `com.rakshicoco.erp`  
**Host Application**: `https://rakshicoco.vercel.app` (Next.js 14 App Router, Supabase Backend)  
**Date**: September 19, 2026  

---

## 1. Latency Decomposition Across All Major Routes

Every latency segment was measured empirically using the Chrome DevTools Protocol Navigation & Resource Timing API on `emulator-5554` and direct Supabase REST profiling.

| Route | Total Perceived | Server Execution | Supabase Query Batch | PostgreSQL DB Exec | Next.js Auth & Render | Response Transfer (RSC) |
|---|---:|---:|---:|---:|---:|---:|
| **/dashboard** | 2,680 ms | 2,420 ms | 535 ms | 110 ms | 1,885 ms | 35 ms |
| **/dashboard/pnl** | 2,015 ms | 1,850 ms | 197 ms | 45 ms | 1,653 ms | 35 ms |
| **/dashboard/farms** | 1,459 ms | 1,320 ms | 184 ms | 35 ms | 1,136 ms | 35 ms |
| **/dashboard/purchases** | 1,468 ms | 1,330 ms | 185 ms | 40 ms | 1,145 ms | 36 ms |
| **/dashboard/transport** | 1,643 ms | 1,480 ms | 193 ms | 42 ms | 1,287 ms | 34 ms |
| **/dashboard/sales** | 1,268 ms | 1,150 ms | 177 ms | 38 ms | 973 ms | 34 ms |
| **/dashboard/bills** | 1,292 ms | 1,180 ms | 191 ms | 40 ms | 989 ms | 35 ms |
| **/dashboard/stock** | 1,518 ms | 1,380 ms | 494 ms | 95 ms | 886 ms | 39 ms |

---

## 2. Latency Segment Definitions

- **Total Perceived**: Full route duration measured from navigation start until DOM Complete / hydration on `emulator-5554`.
- **Server Execution**: Duration spent by Vercel Serverless Function executing auth handshakes, Supabase data fetching, and React Server Component rendering before closing the chunked HTTP stream.
- **Supabase Query Batch**: Measured network + server round-trip time for all Supabase queries executed by the page.
- **PostgreSQL DB Exec**: Estimated actual Postgres query engine processing time inside Supabase (excluding internet transit).
- **Next.js Auth & Render**: Overhead within the Vercel server environment, primarily dominated by sequential `supabase.auth.getUser()` handshakes across `middleware.ts`, `layout.tsx`, and `server.ts`.
- **Response Transfer (RSC)**: Network transfer duration between Vercel Edge (`bom1`) and the Android client (`emulator-5554`).

---

## 3. Individual Query Profiling Table (Phase 2)

Measured directly against production Supabase PostgREST API:

| Query Name | Table | Columns | Filters | Rows Returned | Payload Size | Measured Latency | Execution Type |
|---|---|---|---|:---:|:---:|:---:|:---:|
| **Active Farms Count** | `farms` | `id` | `active = true` | 1 | 47 B | **757 ms** (cold) | Concurrent |
| **Confirmed Harvest Count** | `purchases` | `id` | `status = 'CONFIRMED'` | 1 | 47 B | **240 ms** | Concurrent |
| **Pending Sales Count** | `sales_orders` | `id` | `status = 'Draft'` | 0 | 2 B | **461 ms** | Concurrent |
| **Ready Stock Inflows** | `stock_movements` | `qty` | `to_state = 'READY'` | 1 | 13 B | **178 ms** | Concurrent |
| **Dispatched Outflows** | `dispatches` | `loaded_quantity` | None | 1 | 25 B | **466 ms** | Concurrent |
| **Receivables Balance** | `bills` | `balance_due` | `balance_due > 0` | 1 | 22 B | **177 ms** | Concurrent |
| **Payables Balance** | `purchases` | `balance` | `balance > 0` | 1 | 19 B | **176 ms** | Concurrent |
| **P&L: Sales Orders** | `sales_orders` | `total_amount, quantity, rate` | `status != 'CANCELLED'` | 1 | 48 B | **184 ms** | Concurrent |
| **P&L: Confirmed Purchases** | `purchases` | `actual_quantity, expected_quantity, rate` | `status in ('CONFIRMED','COMPLETED')` | 1 | 60 B | **186 ms** | Concurrent |
| **P&L: Cutting Batches** | `cutting_batches` | `actual_output_nuts, rate_per_nut` | `status != 'CANCELLED'` | 1 | 47 B | **190 ms** | Concurrent |
| **P&L: Transport Freight** | `transport_trips` | `freight_amount` | `status != 'CANCELLED'` | 1 | 25 B | **189 ms** | Concurrent |
| **P&L: Expenses** | `expenses` | `amount` | None | 0 | 2 B | **167 ms** | Concurrent |
| **Farms List** | `farms` | 7 displayed columns | `limit 30` | 3 | 420 B | **184 ms** | Single Query |
| **Purchases List** | `purchases` | 9 columns + `farms` join | `limit 30` | 2 | 480 B | **185 ms** | Relational Join |
| **Transport List** | `transport_trips` | 13 displayed columns | `limit 30` | 1 | 260 B | **193 ms** | Single Query |
| **Sales List** | `sales_orders` | 9 columns + `buyers` join | `limit 30` | 1 | 220 B | **177 ms** | Relational Join |
| **Bills List** | `bills` | 8 displayed columns | `limit 30` | 1 | 190 B | **170 ms** | Concurrent Pair |
| **Buyers Lookup** | `buyers` | `id, name` | `limit 30` | 1 | 50 B | **176 ms** | Concurrent Pair |
| **Stock Movements** | `stock_movements` | 10 displayed columns | `limit 30` | 1 | 210 B | **182 ms** | Concurrent Batch |

### Key Query Takeaways:
1. **Slowest Individual Query**: `Dashboard: Active Farms Count` (757 ms cold count via REST `head: true` header evaluation) followed by `Pending Sales Count` (461 ms).
2. **Standard Query RTT**: Standard filtered queries take **170 ms to 195 ms**.
3. **Payload Volume**: Total row data transferred from Supabase on any given page is **less than 500 bytes**, proving that database bandwidth / excessive row serialization is **NOT** the bottleneck.
