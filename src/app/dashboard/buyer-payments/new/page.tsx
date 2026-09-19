"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";

interface Buyer {
  id: string;
  name: string;
  contact_person?: string;
}

export default function NewBuyerPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillBuyerId = searchParams.get("buyer_id") || "";
  const prefillBillId = searchParams.get("bill_id") || "";

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBuyers() {
      const supabase = createClient();
      const { data } = await supabase.from("buyers").select("id, name, contact_person").order("name");
      if (data) setBuyers(data);
    }
    loadBuyers();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const paymentData = {
      buyer_id: formData.get("buyer_id") as string,
      amount_received: Number(formData.get("amount")),
      payment_date: formData.get("payment_date") as string || new Date().toISOString().split("T")[0],
      payment_method: formData.get("payment_method") as string,
      reference_no: (formData.get("reference_no") as string) || prefillBillId || null,
      status: "COMPLETED",
      notes: formData.get("notes") as string || null,
    };

    try {
      const { error: insertError } = await supabase.from("buyer_payments").insert(paymentData);
      if (insertError) {
        // Fallback to payments table if buyer_payments schema differs
        const { error: fallbackError } = await supabase.from("payments").insert({
          type: "IN",
          ref_type: "BUYER",
          ref_id: paymentData.buyer_id,
          bill_id: prefillBillId || null,
          amount: paymentData.amount_received,
          date: paymentData.payment_date,
          method: paymentData.payment_method,
          tx_ref: paymentData.reference_no,
          notes: paymentData.notes,
        });
        if (fallbackError) throw new Error(insertError.message || fallbackError.message);
      }

      router.push("/dashboard/buyer-payments");
    } catch (err: any) {
      setError(err.message || "Failed to record payment");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/buyer-payments">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Record Buyer Payment</CardTitle>
              <CardDescription className="text-xs">
                Log incoming collection from customer against bills
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-900/50">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Buyer / Customer *
              </label>
              <select
                required
                name="buyer_id"
                defaultValue={prefillBuyerId}
                className="w-full flex h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="">Select Buyer...</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.contact_person ? `${b.name} (${b.contact_person})` : b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Amount Received (₹) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                name="amount"
                placeholder="₹ 0.00"
                className="w-full flex h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Date *
                </label>
                <input
                  required
                  type="date"
                  name="payment_date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full flex h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Method *
                </label>
                <select
                  required
                  name="payment_method"
                  defaultValue="BANK_TRANSFER"
                  className="w-full flex h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Transaction / Cheque / Bill Reference
              </label>
              <input
                name="reference_no"
                defaultValue={prefillBillId}
                placeholder="e.g. UTR-982342 or BILL-1002"
                className="w-full flex h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Optional payment remarks..."
                className="w-full flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <Button className="w-full h-12 text-sm font-semibold" type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record Payment Receipt"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
