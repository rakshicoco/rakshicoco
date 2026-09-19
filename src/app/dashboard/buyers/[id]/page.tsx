import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Phone, MapPin, FileText, ShoppingCart, IndianRupee } from "lucide-react";

export default async function BuyerDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const [
    { data: buyer, error: buyerErr },
    { data: orders },
    { data: bills }
  ] = await Promise.all([
    supabase.from("buyers").select("*").eq("id", params.id).single(),
    supabase.from("sales_orders").select("*").eq("buyer_id", params.id).order("created_at", { ascending: false }),
    supabase.from("bills").select("*").eq("entity_id", params.id).order("created_at", { ascending: false })
  ]);

  if (buyerErr || !buyer) {
    notFound();
  }

  const totalSales = (orders || []).reduce((acc: number, o: any) => acc + Number(o.total_amount || 0), 0);
  const outstandingReceivable = (bills || []).reduce((acc: number, b: any) => acc + Number(b.balance_due || 0), 0);

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/buyers"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{buyer.name}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Active Buyer
            </span>
          </h1>
          <p className="text-xs text-slate-500">Buyer profile & purchase portfolio</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-slate-400 block mb-0.5">Contact Person</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {buyer.contact_person || "Direct Contact"}
            </span>
            {buyer.phone && (
              <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                <Phone size={11} /> {buyer.phone}
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Outstanding Dues</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              ₹{outstandingReceivable.toLocaleString()}
            </span>
          </div>

          {buyer.gstin && (
            <div>
              <span className="text-slate-400 block mb-0.5">GSTIN</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {buyer.gstin}
              </span>
            </div>
          )}

          {buyer.address && (
            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">Address</span>
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <MapPin size={12} className="shrink-0 text-slate-400" />
                {buyer.address}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Orders */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Recent Sales Orders ({(orders || []).length})
        </h3>
        {(orders || []).length === 0 ? (
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
            No sales orders placed yet.
          </div>
        ) : (
          orders!.map((o: any) => (
            <Link key={o.id} href={`/dashboard/sales/${o.id}`} className="block">
              <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-primary/50 transition-all">
                <div>
                  <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{o.id}</div>
                  <div className="text-slate-500 mt-0.5">{Number(o.quantity || 0).toLocaleString()} nuts • {o.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-slate-100">₹{Number(o.total_amount || 0).toLocaleString()}</div>
                  <span className="text-[10px] font-bold text-primary">{o.status}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
