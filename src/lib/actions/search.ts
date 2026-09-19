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
  const perTableLimit = 5;

  try {
    const [
      { data: farms },
      { data: buyers },
      { data: purchases },
      { data: salesOrders },
      { data: bills },
      { data: dispatches },
      { data: transport },
      { data: cuttingBatches },
      { data: groupingBatches },
      { data: teams },
      { data: workers },
      { data: payments },
      { data: expenses },
      { data: stockMovements },
    ] = await Promise.all([
      supabase.from("farms").select("id, name, village, phone").or(`name.ilike.${pattern},village.ilike.${pattern},phone.ilike.${pattern},id.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("buyers").select("id, name, phone, address").or(`name.ilike.${pattern},phone.ilike.${pattern},address.ilike.${pattern},id.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("purchases").select("id, farm_id, status, expected_quantity, rate, created_at").or(`id.ilike.${pattern},status.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("sales_orders").select("id, buyer_id, status, quantity, rate, total_amount, date").or(`id.ilike.${pattern},status.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("bills").select("id, entity_type, entity_id, description, status, amount, date").or(`id.ilike.${pattern},description.ilike.${pattern},status.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("dispatches").select("id, sales_order_id, vehicle_number, driver_name, status, date").or(`id.ilike.${pattern},vehicle_number.ilike.${pattern},driver_name.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("transport_trips").select("id, vehicle_number, driver_name, status, date").or(`id.ilike.${pattern},vehicle_number.ilike.${pattern},driver_name.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("cutting_batches").select("id, purchase_id, status, date").or(`id.ilike.${pattern},status.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("grouping_batches").select("id, status, date, destination_godown").or(`id.ilike.${pattern},status.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("teams").select("id, name, leader_name, phone").or(`name.ilike.${pattern},leader_name.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("workers").select("id, name, phone, role").or(`name.ilike.${pattern},phone.ilike.${pattern},role.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("payments").select("id, entity_type, entity_id, amount, date, payment_method, reference").or(`id.ilike.${pattern},reference.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("expenses").select("id, category, description, amount, date").or(`category.ilike.${pattern},description.ilike.${pattern}`).limit(perTableLimit),
      supabase.from("stock_movements").select("id, godown_id, product_type, qty, to_state, notes").or(`product_type.ilike.${pattern},notes.ilike.${pattern}`).limit(perTableLimit),
    ]);

    const results: SearchResultItem[] = [];

    // Format Farms
    (farms || []).forEach((f: any) => {
      results.push({
        id: f.id,
        type: "Farm",
        title: f.name,
        subtitle: f.village ? `Village: ${f.village}` : undefined,
        badge: "FARM",
        href: `/dashboard/farms/${f.id}`,
      });
    });

    // Format Buyers
    (buyers || []).forEach((b: any) => {
      results.push({
        id: b.id,
        type: "Buyer",
        title: b.name,
        subtitle: b.phone ? `Ph: ${b.phone}` : b.address,
        badge: "BUYER",
        href: `/dashboard/buyers/${b.id}`,
      });
    });

    // Format Purchases
    (purchases || []).forEach((p: any) => {
      results.push({
        id: p.id,
        type: "Purchase",
        title: `Purchase PO: ${p.id}`,
        subtitle: `${Number(p.expected_quantity || 0).toLocaleString()} nuts`,
        badge: p.status,
        href: `/dashboard/purchases/${p.id}`,
      });
    });

    // Format Sales Orders
    (salesOrders || []).forEach((so: any) => {
      results.push({
        id: so.id,
        type: "Sales Order",
        title: `Sales Order: ${so.id}`,
        subtitle: `${Number(so.quantity || 0).toLocaleString()} nuts`,
        badge: so.status,
        amount: so.total_amount ? `₹${Number(so.total_amount).toLocaleString()}` : undefined,
        href: `/dashboard/sales/${so.id}`,
        date: so.date,
      });
    });

    // Format Bills / Invoices
    (bills || []).forEach((b: any) => {
      results.push({
        id: b.id,
        type: "Bill / Invoice",
        title: `Bill: ${b.id}`,
        subtitle: b.description || `${b.entity_type} bill`,
        badge: b.status,
        amount: b.amount ? `₹${Number(b.amount).toLocaleString()}` : undefined,
        href: `/dashboard/bills/${b.id}`,
        date: b.date,
      });
    });

    // Format Dispatches
    (dispatches || []).forEach((d: any) => {
      results.push({
        id: d.id,
        type: "Dispatch",
        title: `Dispatch: ${d.id}`,
        subtitle: `Vehicle: ${d.vehicle_number || "Pending"} • SO: ${d.sales_order_id}`,
        badge: d.status,
        href: `/dashboard/dispatch/${d.id}`,
        date: d.date,
      });
    });

    // Format Transport
    (transport || []).forEach((t: any) => {
      results.push({
        id: t.id,
        type: "Transport",
        title: `Trip: ${t.id}`,
        subtitle: `Vehicle: ${t.vehicle_number || "Unassigned"}`,
        badge: t.status,
        href: `/dashboard/transport/${t.id}`,
        date: t.date,
      });
    });

    // Format Cutting
    (cuttingBatches || []).forEach((cb: any) => {
      results.push({
        id: cb.id,
        type: "Cutting Batch",
        title: `Cutting: ${cb.id}`,
        subtitle: `PO: ${cb.purchase_id}`,
        badge: cb.status,
        href: `/dashboard/cutting/${cb.id}`,
        date: cb.date,
      });
    });

    // Format Grouping
    (groupingBatches || []).forEach((gb: any) => {
      results.push({
        id: gb.id,
        type: "Grouping Batch",
        title: `Grouping: ${gb.id}`,
        subtitle: gb.destination_godown || "Godown",
        badge: gb.status,
        href: `/dashboard/grouping/${gb.id}`,
        date: gb.date,
      });
    });

    // Format Teams
    (teams || []).forEach((t: any) => {
      results.push({
        id: t.id,
        type: "Team",
        title: t.name,
        subtitle: t.leader_name ? `Mestri: ${t.leader_name}` : undefined,
        badge: "TEAM",
        href: `/dashboard/teams/${t.id}`,
      });
    });

    // Format Workers
    (workers || []).forEach((w: any) => {
      results.push({
        id: w.id,
        type: "Worker",
        title: w.name,
        subtitle: w.role || w.phone,
        badge: "WORKER",
        href: `/dashboard/workers/${w.id}`,
      });
    });

    // Format Payments
    (payments || []).forEach((p: any) => {
      const href = p.entity_type === "BUYER" ? "/dashboard/buyer-payments" :
                   p.entity_type === "FARM" ? "/dashboard/farm-payments" : "/dashboard/labour-payments";
      results.push({
        id: p.id,
        type: "Payment",
        title: `Payment: ${p.id.slice(0, 8)}`,
        subtitle: `${p.entity_type} payment via ${p.payment_method || "CASH"}`,
        badge: p.entity_type,
        amount: p.amount ? `₹${Number(p.amount).toLocaleString()}` : undefined,
        href,
        date: p.date,
      });
    });

    // Format Expenses
    (expenses || []).forEach((e: any) => {
      results.push({
        id: e.id,
        type: "Expense",
        title: e.description || e.category,
        subtitle: `Category: ${e.category}`,
        badge: "EXPENSE",
        amount: e.amount ? `₹${Number(e.amount).toLocaleString()}` : undefined,
        href: "/dashboard/expenses",
        date: e.date,
      });
    });

    // Format Stock Movements
    (stockMovements || []).forEach((sm: any) => {
      results.push({
        id: sm.id,
        type: "Stock Movement",
        title: `Stock: ${sm.product_type} (${sm.qty} nuts)`,
        subtitle: `State: ${sm.to_state} • Godown: ${sm.godown_id || "Main"}`,
        badge: sm.to_state || "STOCK",
        href: `/dashboard/stock/${sm.id}`,
      });
    });

    return results.slice(0, limit);
  } catch (err: any) {
    console.error("Global search error:", err);
    return [];
  }
}
