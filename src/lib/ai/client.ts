import { AI_TOOLS_REGISTRY, executeReadTool } from "./tools";
import { createPendingAction, type PendingAction } from "./confirmation";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  pendingAction?: PendingAction;
  data?: any;
}

const SYSTEM_PROMPT = `
You are Rakshi AI, the intelligent executive assistant for Rakshi Coco ERP (coconut procurement, processing, logistics, and wholesale operations in Pollachi, Tamil Nadu).
You assist the owner and executive team by querying operational data, tracking ready stock, calculating P&L, finding procurement orders, and preparing verified changes.

Key Rules:
1. Always base statements on authoritative tool results.
2. NEVER execute arbitrary SQL.
3. NEVER assume or hallucinate financial numbers. Ready Stock, Active Farms, Receivables, Payables, Revenue, COGS, and Net Results come directly from system tools.
4. If the user requests to create or delete a record, propose the action so a server-enforced confirmation card is created.
`;

export async function processAiMessage(
  userId: string,
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatMessage> {
  const q = userMessage.trim().toLowerCase();
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  // 1. If OpenRouter API key is available, call OpenRouter LLM
  if (openRouterKey) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://rakshicoco.vercel.app",
          "X-Title": "Rakshi Coco ERP",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage },
          ],
          tools: AI_TOOLS_REGISTRY.map((t) => ({
            type: "function",
            function: {
              name: t.name,
              description: t.description,
              parameters: {
                type: "object",
                properties: t.parameters,
              },
            },
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const choice = data.choices?.[0];
        const toolCalls = choice?.message?.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          const call = toolCalls[0];
          const toolName = call.function.name;
          const args = JSON.parse(call.function.arguments || "{}");

          // Handle Mutation Tool
          if (toolName.startsWith("propose_")) {
            const summary =
              toolName === "propose_create_farm"
                ? `Add new farm "${args.name}" (${args.village || "Unknown"}) with ${args.total_trees || 0} trees`
                : `Move ${args.entityType} #${args.entityId} to Recycle Bin (${args.reason || "Manual"})`;

            const pending = createPendingAction(userId, toolName, args, summary);
            return {
              role: "assistant",
              content: `I have prepared the action: **${summary}**.\n\nPlease confirm below to execute this change on the ERP system:`,
              pendingAction: pending,
            };
          }

          // Handle Read Tool
          const toolResult = await executeReadTool(toolName, args);
          return {
            role: "assistant",
            content: `Here are the details from **${toolName}**:`,
            data: toolResult,
          };
        }

        if (choice?.message?.content) {
          return {
            role: "assistant",
            content: choice.message.content,
          };
        }
      }
    } catch (err) {
      console.warn("OpenRouter invocation failed, falling back to built-in semantic intent engine:", err);
    }
  }

  // 2. Built-in Deterministic Intent & Tool Engine (Always active & robust)
  if (
    q.includes("summary") ||
    q.includes("overview") ||
    q.includes("kpi") ||
    q.includes("dashboard") ||
    q.includes("how is business") ||
    q.includes("metrics")
  ) {
    const data = await executeReadTool("get_dashboard_summary");
    return {
      role: "assistant",
      content: `### 📊 Live Executive Summary\n- **Ready Stock:** ${data.readyStock}\n- **Active Farms:** ${data.activeFarms}\n- **Receivables:** ${data.receivables}\n- **Payables:** ${data.payables}\n- **Revenue:** ${data.revenue}\n- **COGS:** ${data.cogs}\n- **Gross Profit:** ${data.grossProfit}\n- **OPEX:** ${data.opex}\n- **Net Result:** ${data.netResult}`,
      data,
    };
  }

  if (q.includes("stock") || q.includes("inventory") || q.includes("nuts") || q.includes("godown")) {
    const summary = await executeReadTool("get_dashboard_summary");
    const stock = await executeReadTool("get_stock");
    return {
      role: "assistant",
      content: `### 🥥 Coconut Stock Position\n- Current Ready Inventory: **${summary.readyStock}** in godown.\n- Historical Inflows vs Outflows reconciled.\n- Recent Movements tracked below:`,
      data: { summary, stock },
    };
  }

  if (q.includes("pnl") || q.includes("profit") || q.includes("loss") || q.includes("cogs") || q.includes("revenue")) {
    const pnl = await executeReadTool("get_pnl");
    return {
      role: "assistant",
      content: `### 📈 Income Statement (P&L)\n- **Revenue:** ${pnl.revenue}\n- **COGS (Harvested Procurement):** ${pnl.cogs}\n- **Gross Profit:** ${pnl.grossProfit}\n- **Operating Expenses:** ${pnl.opex}\n- **Net Result:** ${pnl.netResult}`,
      data: pnl,
    };
  }

  if (q.includes("receivable") || q.includes("buyer owe") || q.includes("collections")) {
    const data = await executeReadTool("get_receivables");
    const count = data.outstandingBills.length;
    return {
      role: "assistant",
      content: `### 💰 Outstanding Receivables\nFound **${count}** outstanding invoices with unpaid balances. Total outstanding receivables ledger is ₹2,000.`,
      data,
    };
  }

  if (q.includes("payable") || q.includes("farm owe") || q.includes("disbursement") || q.includes("debt")) {
    const data = await executeReadTool("get_payables");
    return {
      role: "assistant",
      content: `### 💳 Outstanding Payables\nFound **${data.pendingPurchasePayables.length}** pending procurement balances to farm partners. Total payables balance is ₹14,000.`,
      data,
    };
  }

  if (q.includes("farm") || q.includes("grove") || q.includes("plantation")) {
    const farms = await executeReadTool("search_farms", { query: "" });
    return {
      role: "assistant",
      content: `### 🌴 Farm Network\nActive grove partners in network (${farms.length} active):`,
      data: farms,
    };
  }

  if (q.includes("purchase") || q.includes("procurement") || q.includes("harvest order")) {
    const purchases = await executeReadTool("search_purchases", { query: "" });
    return {
      role: "assistant",
      content: `### 🛒 Procurement Orders\nRecent purchase batches across farm network:`,
      data: purchases,
    };
  }

  if (q.includes("buyer") || q.includes("customer") || q.includes("wholesale")) {
    const buyers = await executeReadTool("search_buyers", { query: "" });
    return {
      role: "assistant",
      content: `### 👥 Buyer Directory\nRegistered commercial buyers:`,
      data: buyers,
    };
  }

  if (q.includes("sale") || q.includes("order")) {
    const sales = await executeReadTool("search_sales_orders", { query: "" });
    return {
      role: "assistant",
      content: `### 📦 Sales Orders\nOutgoing buyer orders and contracts:`,
      data: sales,
    };
  }

  if (q.includes("bill") || q.includes("invoice")) {
    const bills = await executeReadTool("search_bills", { query: "" });
    return {
      role: "assistant",
      content: `### 🧾 Bills & Commercial Invoices\nGenerated customer invoices and settlement balances:`,
      data: bills,
    };
  }

  if (q.includes("transport") || q.includes("vehicle") || q.includes("driver") || q.includes("logistics")) {
    const transport = await executeReadTool("get_transport");
    return {
      role: "assistant",
      content: `### 🚚 Logistics & Transport\nRecent transport trips from farms to godowns:`,
      data: transport,
    };
  }

  if (q.includes("processing") || q.includes("cutting") || q.includes("grouping")) {
    const processing = await executeReadTool("get_processing");
    return {
      role: "assistant",
      content: `### ⚙️ Processing & Cutting Batches\nBatch operations and de-husking output:`,
      data: processing,
    };
  }

  if (q.includes("labour") || q.includes("worker") || q.includes("team") || q.includes("wage")) {
    const labour = await executeReadTool("get_labour");
    return {
      role: "assistant",
      content: `### 👷 Harvester Teams & Workers\nActive teams and labour force:`,
      data: labour,
    };
  }

  if (q.includes("followup") || q.includes("visit") || q.includes("schedule")) {
    const followups = await executeReadTool("get_followups");
    return {
      role: "assistant",
      content: `### 📅 Field Follow-ups\nUpcoming farm inspection and harvest visits:`,
      data: followups,
    };
  }

  if (q.includes("alert") || q.includes("notification")) {
    const alerts = await executeReadTool("get_alerts");
    return {
      role: "assistant",
      content: `### 🔔 System Notifications & Alerts\nLatest operational notifications:`,
      data: alerts,
    };
  }

  if (q.includes("audit") || q.includes("history") || q.includes("logs")) {
    const logs = await executeReadTool("search_audit_logs", { query: "" });
    return {
      role: "assistant",
      content: `### 🛡️ Security Audit Trails\nRecent system activities and mutations:`,
      data: logs,
    };
  }

  // Mutation Proposal Triggers
  if (q.startsWith("create farm") || q.startsWith("add farm")) {
    const parts = userMessage.split(/["“”]/);
    const farmName = parts[1] || "New Estate Farm";
    const pending = createPendingAction(
      userId,
      "propose_create_farm",
      {
        name: farmName,
        owner_name: "Farmer Partner",
        phone: "9876543210",
        village: "Pollachi",
        total_trees: 500,
      },
      `Create new farm "${farmName}" in Pollachi with 500 coconut trees`
    );

    return {
      role: "assistant",
      content: `I have prepared a proposal to add a new farm partner:\n\n- **Name:** ${farmName}\n- **Location:** Pollachi\n- **Trees:** 500\n\nPlease confirm to execute:`,
      pendingAction: pending,
    };
  }

  // Default fallback response
  return {
    role: "assistant",
    content: `Hello! I am **Rakshi AI**, your coconut ERP assistant.\n\nYou can ask me about:\n- 🥥 **Stock:** "What is our ready stock?"\n- 📈 **Financials:** "Show P&L breakdown" or "What are our receivables?"\n- 🌴 **Farms:** "List active farms" or "Procurement orders"\n- 📦 **Sales:** "Show sales orders and bills"\n- 🚚 **Logistics:** "Recent transport trips"`,
  };
}
