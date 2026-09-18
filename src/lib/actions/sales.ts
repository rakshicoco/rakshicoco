"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const BuyerSchema = z.object({
  name: z.string().min(2),
  contact_person: z.string().optional(),
  phone: z.string().min(10),
  gstin: z.string().optional(),
  address: z.string().optional(),
});

export async function createBuyer(data: z.infer<typeof BuyerSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "SALES"]);
  const validated = BuyerSchema.parse(data);

  const { data: buyer, error } = await supabase
    .from("buyers")
    .insert({ ...validated, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "BUYER", buyer.id, { created: buyer });
  revalidatePath("/dashboard/buyers");
  return buyer;
}

const SalesOrderSchema = z.object({
  buyer_id: z.string().uuid(),
  date: z.string(),
  product_type: z.string().default("COCONUT"),
  quantity: z.number().int().positive(),
  rate: z.number().positive(),
  delivery_address: z.string().optional(),
});

export async function createSalesOrder(data: z.infer<typeof SalesOrderSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "SALES"]);
  const validated = SalesOrderSchema.parse(data);

  // In production, this should be an RPC to ensure stock reservation atomicity
  // 1. Check stock availability
  // 2. Insert sales order
  // 3. Update stock (Reserved)

  const { data: order, error } = await supabase
    .from("sales_orders")
    .insert({
      ...validated,
      status: "DRAFT",
      total_amount: validated.quantity * validated.rate,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "SALES_ORDER", order.id, { created: order });
  revalidatePath("/dashboard/sales");
  return order;
}

export async function confirmSalesOrder(orderId: string) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "SALES"]);

  // Need RPC to atomically reserve stock
  const { error } = await supabase
    .from("sales_orders")
    .update({ status: "CONFIRMED" })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CONFIRM", "SALES_ORDER", orderId, {});
  revalidatePath("/dashboard/sales");
  revalidatePath(`/dashboard/sales/${orderId}`);
}

const DispatchSchema = z.object({
  sales_order_id: z.string().uuid(),
  date: z.string(),
  vehicle_number: z.string().min(4),
  driver_name: z.string().optional(),
  driver_phone: z.string().optional(),
  loaded_quantity: z.number().int().positive(),
});

export async function createDispatch(data: z.infer<typeof DispatchSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "SALES"]);
  const validated = DispatchSchema.parse(data);

  const { data: dispatch, error } = await supabase
    .from("dispatches")
    .insert({
      ...validated,
      status: "IN_TRANSIT",
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("sales_orders")
    .update({ status: "DISPATCHED" })
    .eq("id", validated.sales_order_id);

  await logAudit(supabase, user.id, "CREATE", "DISPATCH", dispatch.id, { created: dispatch });
  revalidatePath("/dashboard/dispatch");
  revalidatePath(`/dashboard/sales/${validated.sales_order_id}`);
  return dispatch;
}
