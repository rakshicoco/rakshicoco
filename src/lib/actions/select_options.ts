"use server";

import { createClient } from "@/lib/supabase/server";
import { type SearchableOption } from "@/components/ui/SearchableSelect";

export interface ExtendedFarmOption extends SearchableOption {
  total_trees?: number;
  expected_yield?: number;
  last_harvest_date?: string;
  village?: string;
}

export interface ExtendedBuyerOption extends SearchableOption {
  phone?: string;
  address?: string;
  gstin?: string;
  contact_person?: string;
}

export async function getFarmsForSelect(): Promise<ExtendedFarmOption[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("farms")
      .select("id, name, owner_name, village, phone, total_trees, expected_yield, actual_harvest_date, active")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching farms for select:", error);
      return [];
    }

    return (data || []).map((f: any) => {
      const displayName = f.name
        ? `${f.name}${f.owner_name ? ` (${f.owner_name})` : ""}`
        : f.owner_name || f.id;

      const sublabelParts = [
        f.village ? `Village: ${f.village}` : null,
        f.phone ? `Ph: ${f.phone}` : null,
      ].filter(Boolean);

      return {
        value: f.id,
        label: displayName,
        sublabel: sublabelParts.length > 0 ? sublabelParts.join(" • ") : undefined,
        badge: "FARM",
        total_trees: f.total_trees,
        expected_yield: f.expected_yield,
        last_harvest_date: f.actual_harvest_date,
        village: f.village,
      };
    });
  } catch (err) {
    console.error("getFarmsForSelect error:", err);
    return [];
  }
}

export async function getBuyersForSelect(): Promise<ExtendedBuyerOption[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("buyers")
      .select("id, name, phone, address, gst, city, state, active")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching buyers for select:", error);
      return [];
    }

    return (data || []).map((b: any) => {
      const location = [b.city, b.state].filter(Boolean).join(", ") || b.address;
      const sublabelParts = [
        b.phone ? `Ph: ${b.phone}` : null,
        location,
      ].filter(Boolean);

      return {
        value: b.id,
        label: b.name,
        sublabel: sublabelParts.length > 0 ? sublabelParts.join(" • ") : undefined,
        badge: "BUYER",
        phone: b.phone,
        address: b.address,
        gstin: b.gst,
      };
    });
  } catch (err) {
    console.error("getBuyersForSelect error:", err);
    return [];
  }
}

export async function getTeamsForSelect(): Promise<SearchableOption[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, workload, active")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching teams for select:", error);
      return [];
    }

    return (data || []).map((t: any) => ({
      value: t.id,
      label: t.name,
      sublabel: t.workload || "Harvester Team",
      badge: "TEAM",
    }));
  } catch (err) {
    console.error("getTeamsForSelect error:", err);
    return [];
  }
}

export async function getVendorsForSelect(): Promise<SearchableOption[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("expenses")
      .select("vendor, category")
      .not("vendor", "is", null);

    const standardVendors: SearchableOption[] = [
      { value: "VENDOR-GENERAL", label: "General Operational Vendor", sublabel: "Supplies & Services", badge: "VENDOR" },
      { value: "VENDOR-DIESEL", label: "Diesel / Fuel Station", sublabel: "Fuel & Power", badge: "VENDOR" },
      { value: "VENDOR-PACKAGING", label: "Packaging Supplies", sublabel: "Sacks & Twine", badge: "VENDOR" },
      { value: "VENDOR-TRANSPORT", label: "Transport & Logistics Vendor", sublabel: "Freight Services", badge: "VENDOR" },
      { value: "VENDOR-AGRO", label: "Agro / Fertilizer Supplier", sublabel: "Farm Inputs", badge: "VENDOR" },
    ];

    const seen = new Set<string>();
    standardVendors.forEach((v) => seen.add(v.label.toLowerCase()));

    const dynamicVendors: SearchableOption[] = [];
    (data || []).forEach((e: any) => {
      const vName = (e.vendor || "").trim();
      if (vName && !seen.has(vName.toLowerCase())) {
        seen.add(vName.toLowerCase());
        dynamicVendors.push({
          value: vName,
          label: vName,
          sublabel: `Vendor (${e.category || "General"})`,
          badge: "VENDOR",
        });
      }
    });

    return [...dynamicVendors, ...standardVendors];
  } catch (err) {
    console.error("getVendorsForSelect error:", err);
    return [
      { value: "VENDOR-GENERAL", label: "General Operational Vendor", badge: "VENDOR" },
      { value: "VENDOR-DIESEL", label: "Diesel / Fuel Station", badge: "VENDOR" },
      { value: "VENDOR-PACKAGING", label: "Packaging Supplies", badge: "VENDOR" },
    ];
  }
}

export async function getPurchasesForSelect(): Promise<SearchableOption[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("purchases")
      .select("id, farm_id, expected_qty, purchase_date, farms(name, owner_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching purchases for select:", error);
      return [];
    }

    return (data || []).map((p: any) => {
      const farmName = (p.farms as any)?.name || (p.farms as any)?.owner_name || "Farm";
      return {
        value: p.id,
        label: `${p.id} — ${farmName}`,
        sublabel: `Expected: ${Number(p.expected_qty || 0).toLocaleString()} nuts${p.purchase_date ? ` • ${p.purchase_date}` : ""}`,
        badge: "PO",
      };
    });
  } catch (err) {
    console.error("getPurchasesForSelect error:", err);
    return [];
  }
}

export async function getWorkersForSelect(): Promise<SearchableOption[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workers")
      .select("id, name, phone, role, team_id, active")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching workers for select:", error);
      return [];
    }

    return (data || []).map((w: any) => ({
      value: w.id,
      label: w.name,
      sublabel: [w.role, w.phone ? `Ph: ${w.phone}` : null].filter(Boolean).join(" • "),
      badge: "WORKER",
    }));
  } catch (err) {
    console.error("getWorkersForSelect error:", err);
    return [];
  }
}

export async function getSalesOrdersForSelect(): Promise<SearchableOption[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sales_orders")
      .select("id, buyer_id, qty, total, date, buyers(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales orders for select:", error);
      return [];
    }

    return (data || []).map((so: any) => {
      const buyerName = (so.buyers as any)?.name || "Buyer";
      return {
        value: so.id,
        label: `${so.id} — ${buyerName}`,
        sublabel: `${Number(so.qty || 0).toLocaleString()} nuts • ₹${Number(so.total || 0).toLocaleString()}`,
        badge: "SO",
      };
    });
  } catch (err) {
    console.error("getSalesOrdersForSelect error:", err);
    return [];
  }
}

export async function getCuttingBatchesForSelect(): Promise<SearchableOption[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cutting_batches")
      .select("id, purchase_id, actual_qty, expected_qty, date")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cutting batches for select:", error);
      return [];
    }

    return (data || []).map((b: any) => ({
      value: b.id,
      label: `${b.id} — PO: ${b.purchase_id || "Direct"}`,
      sublabel: `Harvested: ${Number(b.actual_qty || b.expected_qty || 0).toLocaleString()} nuts${b.date ? ` • ${b.date}` : ""}`,
      badge: "CUTTING",
    }));
  } catch (err) {
    console.error("getCuttingBatchesForSelect error:", err);
    return [];
  }
}
