"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const PaymentSchema = z.object({
  entity_type: z.enum(["BUYER", "FARM", "TEAM", "WORKER", "VENDOR"]),
  entity_id: z.string().uuid(),
  amount: z.number().positive(),
  date: z.string(),
  payment_method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(["IN", "OUT"]),
});

export async function createPayment(data: z.infer<typeof PaymentSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "FINANCE"]);
  const validated = PaymentSchema.parse(data);

  // 1. Insert payment
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({ ...validated, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // 2. Automate FIFO balance settlement against open invoices / bills
  if (validated.type === "IN" && validated.entity_type === "BUYER") {
    const { data: openBills } = await supabase
      .from("bills")
      .select("id, amount, balance_due, status")
      .eq("entity_id", validated.entity_id)
      .gt("balance_due", 0)
      .order("created_at", { ascending: true });

    let remaining = validated.amount;
    for (const bill of openBills || []) {
      if (remaining <= 0) break;
      const currentDue = Number(bill.balance_due || 0);
      const deduction = Math.min(remaining, currentDue);
      const newDue = currentDue - deduction;
      const newStatus = newDue <= 0 ? "PAID" : "PARTIAL";

      await supabase
        .from("bills")
        .update({ balance_due: newDue, status: newStatus })
        .eq("id", bill.id);

      remaining -= deduction;
    }
  } else if (validated.type === "OUT" && validated.entity_type === "FARM") {
    const { data: openPurchases } = await supabase
      .from("purchases")
      .select("id, balance")
      .eq("farm_id", validated.entity_id)
      .gt("balance", 0)
      .order("created_at", { ascending: true });

    let remaining = validated.amount;
    for (const p of openPurchases || []) {
      if (remaining <= 0) break;
      const currentDue = Number(p.balance || 0);
      const deduction = Math.min(remaining, currentDue);
      const newDue = currentDue - deduction;

      await supabase
        .from("purchases")
        .update({ balance: newDue })
        .eq("id", p.id);

      remaining -= deduction;
    }
  }

  await logAudit(supabase, user.id, "CREATE", "PAYMENT", payment.id, { created: payment });
  
  // Revalidate relevant paths
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bills");
  revalidatePath("/dashboard/receivables");
  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/${validated.entity_type.toLowerCase()}s`);
  return payment;
}

const BillSchema = z.object({
  entity_type: z.enum(["BUYER", "FARM", "TEAM", "VENDOR"]),
  entity_id: z.string().uuid(),
  amount: z.number().positive(),
  date: z.string(),
  due_date: z.string().optional(),
  description: z.string(),
});

export async function createBill(data: z.infer<typeof BillSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "FINANCE"]);
  const validated = BillSchema.parse(data);

  const { data: bill, error } = await supabase
    .from("bills")
    .insert({ ...validated, status: "UNPAID", balance_due: validated.amount, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "BILL", bill.id, { created: bill });
  revalidatePath("/dashboard/bills");
  revalidatePath("/dashboard/receivables");
  return bill;
}
