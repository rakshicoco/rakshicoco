"use server";

import { z } from "zod";
import { requireRole, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

const TransportSchema = z.object({
  source_type: z.enum(["FARM", "GODOWN"]),
  source_id: z.string().uuid(),
  destination_type: z.enum(["GODOWN", "BUYER"]),
  destination_id: z.string().uuid(),
  vehicle_number: z.string().min(4),
  driver_name: z.string().optional(),
  driver_phone: z.string().optional(),
  expected_quantity: z.number().int().positive(),
  freight_amount: z.number().min(0).default(0),
  date: z.string(),
});

export async function createTransportTrip(data: z.infer<typeof TransportSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);
  const validated = TransportSchema.parse(data);

  const { data: transport, error } = await supabase
    .from("transport_trips")
    .insert({ ...validated, status: "IN_TRANSIT", created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "CREATE", "TRANSPORT", transport.id, { created: transport });
  revalidatePath("/dashboard/transport");
  return transport;
}

const ReceiveTransportSchema = z.object({
  received_quantity: z.number().int().positive(),
  damaged_quantity: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

export async function receiveTransportTrip(tripId: string, data: z.infer<typeof ReceiveTransportSchema>) {
  const { supabase, user } = await requireRole(["ADMIN", "MANAGER", "OPERATOR"]);
  const validated = ReceiveTransportSchema.parse(data);

  // In production, RPC to update stock atomically
  const { error } = await supabase
    .from("transport_trips")
    .update({ ...validated, status: "DELIVERED" })
    .eq("id", tripId);

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "RECEIVE", "TRANSPORT", tripId, { ...validated });
  revalidatePath("/dashboard/transport");
  revalidatePath("/dashboard/stock");
}
