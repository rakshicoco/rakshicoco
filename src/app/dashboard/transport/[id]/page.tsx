import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, Calendar, User, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { receiveTransportTrip } from "@/lib/actions/transport";

export default async function TransportTripDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: trip, error } = await supabase
    .from("transport_trips")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !trip) {
    notFound();
  }

  const isReceived = trip.status === "RECEIVED";

  async function handleReceive(formData: FormData) {
    "use server";
    const received_quantity = Number(formData.get("received_quantity"));
    const damaged_quantity = Number(formData.get("damaged_quantity") || 0);

    await receiveTransportTrip(params.id, {
      received_quantity,
      damaged_quantity,
    });
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/transport"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="font-mono">{trip.id}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isReceived ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            }`}>
              {trip.status}
            </span>
          </h1>
          <p className="text-xs text-slate-500">Inbound coconut transport logistics</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Vehicle</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
              {trip.vehicle_number || "Not assigned"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Driver</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {trip.driver_name || "Unassigned"} {trip.driver_phone ? `(${trip.driver_phone})` : ""}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Date</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" />
              {trip.date ? new Date(trip.date).toLocaleDateString() : "-"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Freight Cost</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              ₹{Number(trip.freight_amount || 0).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Expected / Loaded</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {Number(trip.expected_quantity || 0).toLocaleString()} nuts
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Received Qty</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {Number(trip.received_quantity || 0).toLocaleString()} nuts
            </span>
          </div>
        </div>

        {!isReceived && (
          <form action={handleReceive} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Receive Shipment at Godown
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">Received (Nuts)</label>
                <input
                  required
                  type="number"
                  inputMode="numeric"
                  name="received_quantity"
                  defaultValue={trip.expected_quantity}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">Transit Damage (Nuts)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="damaged_quantity"
                  defaultValue={0}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
            <Button type="submit" className="w-full min-h-[44px] font-bold bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 size={16} className="mr-1.5" />
              Mark as Received
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
