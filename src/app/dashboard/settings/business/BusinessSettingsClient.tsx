"use client";

import { useState, useTransition } from "react";
import { updateAppSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  initialSettings: {
    company_name: string;
    gstin?: string;
    contact_email?: string;
    contact_phone?: string;
    expected_harvest_interval_days?: number;
  };
}

export function BusinessSettingsClient({ initialSettings }: Props) {
  const [form, setForm] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    startTransition(async () => {
      try {
        await updateAppSettings({
          company_name: form.company_name,
          gstin: form.gstin || undefined,
          contact_email: form.contact_email || undefined,
          contact_phone: form.contact_phone || undefined,
          expected_harvest_interval_days: Number(form.expected_harvest_interval_days) || 40,
        });
        setStatus({ type: "success", text: "Business settings saved successfully" });
      } catch (err: any) {
        setStatus({ type: "error", text: err.message || "Failed to update business settings" });
      }
    });
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 max-w-xl">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
          Enterprise Profile
        </CardTitle>
        <CardDescription className="text-xs">
          Legal business entity and harvest interval configuration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
              status.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            }`}
          >
            {status.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{status.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Company Legal Name</Label>
            <Input
              type="text"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              required
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">GSTIN Identification Number</Label>
            <Input
              type="text"
              value={form.gstin || ""}
              onChange={(e) => setForm({ ...form, gstin: e.target.value })}
              placeholder="33AAAAA0000A1Z5"
              className="h-10 text-sm font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Official Contact Email</Label>
              <Input
                type="email"
                value={form.contact_email || ""}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="accounts@rakshicoco.com"
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Support Phone</Label>
              <Input
                type="tel"
                value={form.contact_phone || ""}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="h-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Default Harvest Interval (Days)</Label>
            <Input
              type="number"
              value={form.expected_harvest_interval_days || 40}
              onChange={(e) => setForm({ ...form, expected_harvest_interval_days: Number(e.target.value) })}
              min={15}
              max={90}
              className="h-10 text-sm"
            />
            <p className="text-[11px] text-slate-400">Used for automated farm harvest follow-up scheduling.</p>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto min-h-[42px] bg-primary hover:bg-primary/90 text-xs font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Business Details"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
