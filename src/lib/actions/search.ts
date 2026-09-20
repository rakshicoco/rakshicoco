"use server";

import { createClient } from "@/lib/supabase/server";

export interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  badge?: string;
  href: string;
  date?: string;
  amount?: string;
}

export async function searchGlobal(query: string, limit = 20): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const supabase = await createClient();
  const pattern = `%${q}%`;
  const perTableLimit = 6;
  const results: SearchResultItem[] = [];

  // Execute queries in parallel with individual error resilience
  await Promise.allSettled([
    // 1. Farms (active only, search name, owner_name, village, phone, id)
    (async () => {
      try {
        const { data } = await supabase
          .from("farms")
          .select("id, name, owner_name, village, phone, active")
          .eq("active", true)
          .or(`name.ilike.${pattern},owner_name.ilike.${pattern},village.ilike.${pattern},phone.ilike.${pattern},id.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((f: any) => {
          results.push({
            id: f.id,
            type: "Farm",
            title: f.name || f.owner_name || f.id,
            subtitle: [f.owner_name && f.owner_name !== f.name ? `Owner: ${f.owner_name}` : null, f.village ? `Village: ${f.village}` : null, f.phone ? `Ph: ${f.phone}` : null].filter(Boolean).join(" • "),
            badge: "FARM",
            href: `/dashboard/farms/${f.id}`,
          });
        });
      } catch (err) {
        console.error("Search farms error:", err);
      }
    })(),

    // 2. Buyers
    (async () => {
      try {
        const { data } = await supabase
          .from("buyers")
          .select("id, name, phone, address")
          .or(`name.ilike.${pattern},phone.ilike.${pattern},address.ilike.${pattern},id.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((b: any) => {
          results.push({
            id: b.id,
            type: "Buyer",
            title: b.name,
            subtitle: b.phone ? `Ph: ${b.phone}` : b.address,
            badge: "BUYER",
            href: `/dashboard/buyers/${b.id}`,
          });
        });
      } catch (err) {
        console.error("Search buyers error:", err);
      }
    })(),

    // 3. Teams (Harvester teams)
    (async () => {
      try {
        const { data } = await supabase
          .from("teams")
          .select("id, name, workload")
          .or(`name.ilike.${pattern},id.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((t: any) => {
          results.push({
            id: t.id,
            type: "Team",
            title: t.name,
            subtitle: t.workload || "Harvester Team",
            badge: "TEAM",
            href: `/dashboard/teams/${t.id}`,
          });
        });
      } catch (err) {
        console.error("Search teams error:", err);
      }
    })(),

    // 4. Vendors (from expenses table vendor field)
    (async () => {
      try {
        const { data } = await supabase
          .from("expenses")
          .select("vendor, category")
          .not("vendor", "is", null)
          .ilike("vendor", pattern)
          .limit(perTableLimit);

        const seen = new Set<string>();
        (data || []).forEach((e: any) => {
          if (e.vendor && !seen.has(e.vendor.toLowerCase())) {
            seen.add(e.vendor.toLowerCase());
            results.push({
              id: `vendor-${e.vendor}`,
              type: "Vendor",
              title: e.vendor,
              subtitle: `Category: ${e.category || "Supplier"}`,
              badge: "VENDOR",
              href: `/dashboard/expenses`,
            });
          }
        });
      } catch (err) {
        console.error("Search vendors error:", err);
      }
    })(),

    // 5. Workers
    (async () => {
      try {
        const { data } = await supabase
          .from("workers")
          .select("id, name, phone, role")
          .or(`name.ilike.${pattern},phone.ilike.${pattern},role.ilike.${pattern},id.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((w: any) => {
          results.push({
            id: w.id,
            type: "Worker",
            title: w.name,
            subtitle: [w.role, w.phone ? `Ph: ${w.phone}` : null].filter(Boolean).join(" • "),
            badge: "WORKER",
            href: `/dashboard/workers/${w.id}`,
          });
        });
      } catch (err) {
        console.error("Search workers error:", err);
      }
    })(),

    // 6. Purchases
    (async () => {
      try {
        const { data } = await supabase
          .from("purchases")
          .select("id, farm_id, status, expected_qty, rate, purchase_date")
          .or(`id.ilike.${pattern},status.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((p: any) => {
          results.push({
            id: p.id,
            type: "Purchase",
            title: `Purchase PO: ${p.id}`,
            subtitle: `${Number(p.expected_qty || 0).toLocaleString()} nuts`,
            badge: p.status,
            href: `/dashboard/purchases/${p.id}`,
            date: p.purchase_date,
          });
        });
      } catch (err) {
        console.error("Search purchases error:", err);
      }
    })(),

    // 7. Sales Orders
    (async () => {
      try {
        const { data } = await supabase
          .from("sales_orders")
          .select("id, buyer_id, status, qty, rate, total, date")
          .or(`id.ilike.${pattern},status.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((so: any) => {
          results.push({
            id: so.id,
            type: "Sales Order",
            title: `Sales Order: ${so.id}`,
            subtitle: `${Number(so.qty || 0).toLocaleString()} nuts`,
            badge: so.status,
            amount: so.total ? `₹${Number(so.total).toLocaleString()}` : undefined,
            href: `/dashboard/sales/${so.id}`,
            date: so.date,
          });
        });
      } catch (err) {
        console.error("Search sales_orders error:", err);
      }
    })(),

    // 8. Bills / Invoices (exclude VOIDED)
    (async () => {
      try {
        const { data } = await supabase
          .from("bills")
          .select("id, entity_type, entity_id, notes, status, amount, issue_date")
          .neq("status", "VOIDED")
          .or(`id.ilike.${pattern},notes.ilike.${pattern},status.ilike.${pattern},entity_type.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((b: any) => {
          results.push({
            id: b.id,
            type: "Bill / Invoice",
            title: `Bill: ${b.id}`,
            subtitle: b.notes || `${b.entity_type} bill`,
            badge: b.status,
            amount: b.amount ? `₹${Number(b.amount).toLocaleString()}` : undefined,
            href: `/dashboard/bills/${b.id}`,
            date: b.issue_date,
          });
        });
      } catch (err) {
        console.error("Search bills error:", err);
      }
    })(),

    // 9. Dispatches
    (async () => {
      try {
        const { data } = await supabase
          .from("dispatches")
          .select("id, sales_order_id, vehicle, status, dispatch_date")
          .or(`id.ilike.${pattern},vehicle.ilike.${pattern},status.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((d: any) => {
          results.push({
            id: d.id,
            type: "Dispatch",
            title: `Dispatch: ${d.id}`,
            subtitle: `Vehicle: ${d.vehicle || "Pending"} • SO: ${d.sales_order_id || "-"}`,
            badge: d.status,
            href: `/dashboard/dispatch/${d.id}`,
            date: d.dispatch_date,
          });
        });
      } catch (err) {
        console.error("Search dispatches error:", err);
      }
    })(),

    // 10. Transport Trips
    (async () => {
      try {
        const { data } = await supabase
          .from("transport_trips")
          .select("id, vehicle, status, loading_date")
          .or(`id.ilike.${pattern},vehicle.ilike.${pattern},status.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((t: any) => {
          results.push({
            id: t.id,
            type: "Transport",
            title: `Trip: ${t.id}`,
            subtitle: `Vehicle: ${t.vehicle || "Unassigned"}`,
            badge: t.status,
            href: `/dashboard/transport/${t.id}`,
            date: t.loading_date,
          });
        });
      } catch (err) {
        console.error("Search transport error:", err);
      }
    })(),

    // 11. Cutting Batches
    (async () => {
      try {
        const { data } = await supabase
          .from("cutting_batches")
          .select("id, purchase_id, status, date")
          .or(`id.ilike.${pattern},status.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((cb: any) => {
          results.push({
            id: cb.id,
            type: "Cutting Batch",
            title: `Cutting: ${cb.id}`,
            subtitle: `PO: ${cb.purchase_id || "-"}`,
            badge: cb.status,
            href: `/dashboard/cutting/${cb.id}`,
            date: cb.date,
          });
        });
      } catch (err) {
        console.error("Search cutting error:", err);
      }
    })(),

    // 12. Grouping Batches
    (async () => {
      try {
        const { data } = await supabase
          .from("grouping_batches")
          .select("id, status, date")
          .or(`id.ilike.${pattern},status.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((gb: any) => {
          results.push({
            id: gb.id,
            type: "Grouping Batch",
            title: `Grouping: ${gb.id}`,
            subtitle: `Status: ${gb.status}`,
            badge: gb.status,
            href: `/dashboard/grouping/${gb.id}`,
            date: gb.date,
          });
        });
      } catch (err) {
        console.error("Search grouping error:", err);
      }
    })(),

    // 13. Payments
    (async () => {
      try {
        const { data } = await supabase
          .from("payments")
          .select("id, type, ref_type, ref_id, amount, date, method, tx_ref")
          .or(`id.ilike.${pattern},tx_ref.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((p: any) => {
          results.push({
            id: p.id,
            type: "Payment",
            title: `Payment: ${p.id.slice(0, 8)}`,
            subtitle: `${p.type} payment via ${p.method || "CASH"}`,
            badge: p.type,
            amount: p.amount ? `₹${Number(p.amount).toLocaleString()}` : undefined,
            href: "/dashboard/bills",
            date: p.date,
          });
        });
      } catch (err) {
        console.error("Search payments error:", err);
      }
    })(),

    // 14. Expenses
    (async () => {
      try {
        const { data } = await supabase
          .from("expenses")
          .select("id, category, vendor, notes, amount, date")
          .or(`category.ilike.${pattern},vendor.ilike.${pattern},notes.ilike.${pattern}`)
          .limit(perTableLimit);

        (data || []).forEach((e: any) => {
          results.push({
            id: e.id,
            type: "Expense",
            title: e.vendor || e.notes || e.category,
            subtitle: `Category: ${e.category}${e.vendor ? ` • ${e.vendor}` : ""}`,
            badge: "EXPENSE",
            amount: e.amount ? `₹${Number(e.amount).toLocaleString()}` : undefined,
            href: "/dashboard/expenses",
            date: e.date,
          });
        });
      } catch (err) {
        console.error("Search expenses error:", err);
      }
    })(),
  ]);

  return results.slice(0, limit);
}
