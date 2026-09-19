import { createAdminClient } from "@/lib/supabase/server";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  isMutation?: boolean;
}

export const AI_TOOLS_REGISTRY: ToolDefinition[] = [
  {
    name: "get_dashboard_summary",
    description: "Get key high-level operational and financial KPIs (Ready Stock, Active Farms, Receivables, Payables, Revenue, COGS, Net Result)",
    parameters: {},
  },
  {
    name: "get_stock",
    description: "Get current godown inventory, ready stock, and active coconut stock movements",
    parameters: {},
  },
  {
    name: "get_pnl",
    description: "Get Profit & Loss breakdown: Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses (OPEX), and Net Result",
    parameters: {},
  },
  {
    name: "get_receivables",
    description: "Get outstanding buyer receivables ledger and pending invoice balances",
    parameters: {},
  },
  {
    name: "get_payables",
    description: "Get outstanding payables for coconut purchases and vendor obligations",
    parameters: {},
  },
  {
    name: "search_farms",
    description: "Search farms by name, owner, or village",
    parameters: { query: { type: "string", description: "Search query" } },
  },
  {
    name: "get_farm",
    description: "Get details of a specific farm by its ID",
    parameters: { id: { type: "string", description: "Farm ID" } },
  },
  {
    name: "search_purchases",
    description: "Search coconut purchase procurement orders",
    parameters: { query: { type: "string", description: "PO number or status" } },
  },
  {
    name: "get_purchase",
    description: "Get specific purchase order details by ID",
    parameters: { id: { type: "string", description: "Purchase ID" } },
  },
  {
    name: "search_buyers",
    description: "Search buyers and wholesale clients",
    parameters: { query: { type: "string", description: "Buyer name or phone" } },
  },
  {
    name: "get_buyer",
    description: "Get specific buyer details by ID",
    parameters: { id: { type: "string", description: "Buyer ID" } },
  },
  {
    name: "search_sales_orders",
    description: "Search sales orders by ID or status",
    parameters: { query: { type: "string", description: "Order ID or status" } },
  },
  {
    name: "get_sales_order",
    description: "Get sales order details by ID",
    parameters: { id: { type: "string", description: "Sales order ID" } },
  },
  {
    name: "get_transport",
    description: "Get transport trips and logistics movements between farms and godowns",
    parameters: {},
  },
  {
    name: "get_processing",
    description: "Get coconut cutting and processing batches",
    parameters: {},
  },
  {
    name: "get_labour",
    description: "Get harvesting teams, workers, and wage disbursement summary",
    parameters: {},
  },
  {
    name: "get_expenses",
    description: "Get operational expenses list and categories",
    parameters: {},
  },
  {
    name: "search_bills",
    description: "Search commercial bills and invoices",
    parameters: { query: { type: "string", description: "Bill ID or buyer name" } },
  },
  {
    name: "get_bill",
    description: "Get commercial bill details by ID",
    parameters: { id: { type: "string", description: "Bill ID" } },
  },
  {
    name: "get_followups",
    description: "Get pending field harvest follow-ups and scheduled visits",
    parameters: {},
  },
  {
    name: "get_alerts",
    description: "Get system notifications and operational alerts",
    parameters: {},
  },
  {
    name: "search_audit_logs",
    description: "Search immutable audit log history",
    parameters: { query: { type: "string", description: "Action or entity" } },
  },
  // MUTATION TOOLS (Requires Server Confirmation)
  {
    name: "propose_create_farm",
    description: "Propose adding a new farm to the network. Requires user confirmation.",
    parameters: {
      name: { type: "string", description: "Farm name" },
      owner_name: { type: "string", description: "Owner full name" },
      phone: { type: "string", description: "Phone number" },
      village: { type: "string", description: "Village/location" },
      total_trees: { type: "number", description: "Total coconut trees" },
    },
    isMutation: true,
  },
  {
    name: "propose_move_to_trash",
    description: "Propose moving a master or operational record to the Recycle Bin. Requires user confirmation.",
    parameters: {
      entityType: { type: "string", description: "Entity type (e.g. FARM, PURCHASE, BUYER)" },
      entityId: { type: "string", description: "Entity ID" },
      reason: { type: "string", description: "Reason for deletion" },
    },
    isMutation: true,
  },
];

export async function executeReadTool(toolName: string, args: Record<string, any> = {}) {
  const admin = createAdminClient();

  switch (toolName) {
    case "get_dashboard_summary": {
      const [
        { data: farms },
        { data: stockInflows },
        { data: stockOutflows },
        { data: bills },
        { data: purchases },
        { data: sales },
        { data: cutting },
        { data: trips },
        { data: expenses },
      ] = await Promise.all([
        admin.from("farms").select("id").eq("active", true),
        admin.from("stock_movements").select("qty").eq("to_state", "READY"),
        admin.from("dispatches").select("loaded_quantity"),
        admin.from("bills").select("balance_due").gt("balance_due", 0),
        admin.from("purchases").select("rate, actual_quantity, balance, status"),
        admin.from("sales_orders").select("total_amount, quantity, rate").neq("status", "CANCELLED"),
        admin.from("cutting_batches").select("actual_output_nuts, rate_per_nut").neq("status", "CANCELLED"),
        admin.from("transport_trips").select("freight_amount").neq("status", "CANCELLED"),
        admin.from("expenses").select("amount"),
      ]);

      const activeFarmsCount = farms?.length || 0;
      const totalIn = (stockInflows || []).reduce((acc: number, r: any) => acc + (Number(r.qty) || 0), 0);
      const totalOut = (stockOutflows || []).reduce((acc: number, r: any) => acc + (Number(r.loaded_quantity) || 0), 0);
      const readyStock = Math.max(0, totalIn - totalOut);

      const receivables = (bills || []).reduce((acc: number, b: any) => acc + (Number(b.balance_due) || 0), 0);
      const payables = (purchases || []).reduce((acc: number, p: any) => acc + (Number(p.balance) || 0), 0);
      const revenue = (sales || []).reduce((acc: number, s: any) => acc + Number(s.total_amount || (s.quantity * s.rate) || 0), 0);

      // COGS for confirmed procurement per unit sold
      const totalDispatchedQty = (sales || []).reduce((acc, s: any) => acc + Number(s.quantity || 0), 0);
      const confirmedPurchases = (purchases || []).filter((p) => ["CONFIRMED", "COMPLETED", "HARVESTED"].includes((p.status || "").toUpperCase()));
      const totalPurchasedNuts = confirmedPurchases.reduce((acc, p) => acc + Number(p.actual_quantity || 0), 0);
      const totalPurchaseSpend = confirmedPurchases.reduce((acc, p) => acc + Number((p.actual_quantity || 0) * (p.rate || 0)), 0);
      const avgPurchaseRate = totalPurchasedNuts > 0 ? (totalPurchaseSpend / totalPurchasedNuts) : 20;
      const cogs = totalDispatchedQty * avgPurchaseRate;

      const grossProfit = revenue - cogs;
      const totalLabour = (cutting || []).reduce((acc, c: any) => acc + Number((c.actual_output_nuts || 0) * (c.rate_per_nut || 0)), 0);
      const totalFreight = (trips || []).reduce((acc, t: any) => acc + Number(t.freight_amount || 0), 0);
      const directExpenses = (expenses || []).reduce((acc, e: any) => acc + Number(e.amount || 0), 0);
      const opex = totalLabour + totalFreight + directExpenses;
      const netResult = grossProfit - opex;

      return {
        readyStock: `${readyStock} nuts`,
        activeFarms: activeFarmsCount,
        receivables: `₹${receivables.toLocaleString("en-IN")}`,
        payables: `₹${payables.toLocaleString("en-IN")}`,
        revenue: `₹${revenue.toLocaleString("en-IN")}`,
        cogs: `₹${cogs.toLocaleString("en-IN")}`,
        grossProfit: `₹${grossProfit.toLocaleString("en-IN")}`,
        opex: `₹${opex.toLocaleString("en-IN")}`,
        netResult: `₹${netResult.toLocaleString("en-IN")}`,
      };
    }

    case "get_stock": {
      const [{ data: movements }, { data: dispatches }] = await Promise.all([
        admin.from("stock_movements").select("id, product_type, qty, from_state, to_state, notes, created_at").order("created_at", { ascending: false }).limit(10),
        admin.from("dispatches").select("id, loaded_quantity, vehicle_number, status, date").order("created_at", { ascending: false }).limit(10),
      ]);
      return { movements: movements || [], recentDispatches: dispatches || [] };
    }

    case "get_pnl": {
      const [
        { data: sales },
        { data: purchases },
        { data: cutting },
        { data: trips },
        { data: expenses },
      ] = await Promise.all([
        admin.from("sales_orders").select("total_amount, quantity, rate").neq("status", "CANCELLED"),
        admin.from("purchases").select("actual_quantity, rate, status"),
        admin.from("cutting_batches").select("actual_output_nuts, rate_per_nut").neq("status", "CANCELLED"),
        admin.from("transport_trips").select("freight_amount").neq("status", "CANCELLED"),
        admin.from("expenses").select("category, amount, description, date"),
      ]);

      const revenue = (sales || []).reduce((acc, s: any) => acc + Number(s.total_amount || (s.quantity * s.rate) || 0), 0);
      const totalDispatchedQty = (sales || []).reduce((acc, s: any) => acc + Number(s.quantity || 0), 0);
      const confirmedPurchases = (purchases || []).filter((p) => ["CONFIRMED", "COMPLETED", "HARVESTED"].includes((p.status || "").toUpperCase()));
      const totalPurchasedNuts = confirmedPurchases.reduce((acc, p) => acc + Number(p.actual_quantity || 0), 0);
      const totalPurchaseSpend = confirmedPurchases.reduce((acc, p) => acc + Number((p.actual_quantity || 0) * (p.rate || 0)), 0);
      const avgPurchaseRate = totalPurchasedNuts > 0 ? (totalPurchaseSpend / totalPurchasedNuts) : 20;
      const cogs = totalDispatchedQty * avgPurchaseRate;

      const grossProfit = revenue - cogs;
      const totalLabour = (cutting || []).reduce((acc, c: any) => acc + Number((c.actual_output_nuts || 0) * (c.rate_per_nut || 0)), 0);
      const totalFreight = (trips || []).reduce((acc, t: any) => acc + Number(t.freight_amount || 0), 0);
      const directExpenses = (expenses || []).reduce((acc, e: any) => acc + Number(e.amount || 0), 0);
      const opex = totalLabour + totalFreight + directExpenses;
      const net = grossProfit - opex;

      return {
        revenue: `₹${revenue.toLocaleString("en-IN")}`,
        cogs: `₹${cogs.toLocaleString("en-IN")}`,
        grossProfit: `₹${grossProfit.toLocaleString("en-IN")}`,
        opex: `₹${opex.toLocaleString("en-IN")}`,
        netResult: `₹${net.toLocaleString("en-IN")}`,
        recentExpenses: (expenses || []).slice(0, 5),
      };
    }

    case "get_receivables": {
      const { data: bills } = await admin
        .from("bills")
        .select("id, entity_type, entity_id, amount, balance_due, due_date, status")
        .gt("balance_due", 0)
        .order("due_date", { ascending: true });
      return { outstandingBills: bills || [] };
    }

    case "get_payables": {
      const { data: purchases } = await admin
        .from("purchases")
        .select("id, farm_id, rate, expected_quantity, balance, status")
        .gt("balance", 0)
        .order("created_at", { ascending: false });
      return { pendingPurchasePayables: purchases || [] };
    }

    case "search_farms": {
      const pattern = `%${args.query || ""}%`;
      const { data } = await admin
        .from("farms")
        .select("id, name, owner_name, village, phone, active, total_trees, expected_next_harvest")
        .or(`name.ilike.${pattern},owner_name.ilike.${pattern},village.ilike.${pattern}`)
        .limit(10);
      return data || [];
    }

    case "get_farm": {
      const { data } = await admin.from("farms").select("*").eq("id", args.id).maybeSingle();
      return data || { error: "Farm not found" };
    }

    case "search_purchases": {
      const pattern = `%${args.query || ""}%`;
      const { data } = await admin
        .from("purchases")
        .select("id, farm_id, expected_date, expected_quantity, actual_quantity, rate, balance, status")
        .or(`id.ilike.${pattern},status.ilike.${pattern}`)
        .limit(10);
      return data || [];
    }

    case "get_purchase": {
      const { data } = await admin.from("purchases").select("*").eq("id", args.id).maybeSingle();
      return data || { error: "Purchase order not found" };
    }

    case "search_buyers": {
      const pattern = `%${args.query || ""}%`;
      const { data } = await admin
        .from("buyers")
        .select("id, name, contact_person, phone, gstin, address")
        .or(`name.ilike.${pattern},phone.ilike.${pattern}`)
        .limit(10);
      return data || [];
    }

    case "get_buyer": {
      const { data } = await admin.from("buyers").select("*").eq("id", args.id).maybeSingle();
      return data || { error: "Buyer not found" };
    }

    case "search_sales_orders": {
      const pattern = `%${args.query || ""}%`;
      const { data } = await admin
        .from("sales_orders")
        .select("id, buyer_id, product_type, quantity, rate, total_amount, status, date")
        .or(`id.ilike.${pattern},status.ilike.${pattern}`)
        .limit(10);
      return data || [];
    }

    case "get_sales_order": {
      const { data } = await admin.from("sales_orders").select("*").eq("id", args.id).maybeSingle();
      return data || { error: "Sales order not found" };
    }

    case "get_transport": {
      const { data } = await admin
        .from("transport_trips")
        .select("id, vehicle_number, driver_name, driver_phone, expected_quantity, received_quantity, status, date")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    }

    case "get_processing": {
      const [{ data: cutting }, { data: grouping }] = await Promise.all([
        admin.from("cutting_batches").select("id, purchase_id, expected_output_nuts, actual_output_nuts, rejection_count, status, date").limit(10),
        admin.from("grouping_batches").select("id, status, date, destination_godown").limit(10),
      ]);
      return { cuttingBatches: cutting || [], groupingBatches: grouping || [] };
    }

    case "get_labour": {
      const [{ data: teams }, { data: workers }] = await Promise.all([
        admin.from("teams").select("id, name, leader_name, phone, active").limit(10),
        admin.from("workers").select("id, name, phone, role, status").limit(10),
      ]);
      return { teams: teams || [], workers: workers || [] };
    }

    case "get_expenses": {
      const { data } = await admin.from("expenses").select("*").order("date", { ascending: false }).limit(15);
      return data || [];
    }

    case "search_bills": {
      const pattern = `%${args.query || ""}%`;
      const { data } = await admin
        .from("bills")
        .select("id, entity_type, entity_id, amount, date, due_date, status, balance_due")
        .or(`id.ilike.${pattern},description.ilike.${pattern}`)
        .limit(10);
      return data || [];
    }

    case "get_bill": {
      const { data } = await admin.from("bills").select("*").eq("id", args.id).maybeSingle();
      return data || { error: "Bill not found" };
    }

    case "get_followups": {
      const { data } = await admin
        .from("farm_followups")
        .select("id, farm_id, date, next_follow_up, notes, status")
        .order("date", { ascending: false })
        .limit(10);
      return data || [];
    }

    case "get_alerts": {
      const { data } = await admin.from("notifications").select("*").order("created_at", { ascending: false }).limit(10);
      return data || [];
    }

    case "search_audit_logs": {
      const pattern = `%${args.query || ""}%`;
      const { data } = await admin
        .from("audit_logs")
        .select("audit_id, action, entity_type, entity_id, timestamp")
        .or(`action.ilike.${pattern},entity_type.ilike.${pattern}`)
        .order("timestamp", { ascending: false })
        .limit(15);
      return data || [];
    }

    default:
      throw new Error(`Unrecognized read tool: ${toolName}`);
  }
}
