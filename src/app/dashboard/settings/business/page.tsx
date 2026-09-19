import { createAdminClient } from "@/lib/supabase/server";
import { BusinessSettingsClient } from "./BusinessSettingsClient";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("app_settings")
    .select("company_name, gstin, contact_email, contact_phone, expected_harvest_interval_days")
    .eq("id", "DEFAULT")
    .maybeSingle();

  const defaultSettings = {
    company_name: settings?.company_name || "Rakshi Coco",
    gstin: settings?.gstin || "",
    contact_email: settings?.contact_email || "",
    contact_phone: settings?.contact_phone || "",
    expected_harvest_interval_days: settings?.expected_harvest_interval_days || 40,
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Business Configuration
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Legal enterprise parameters, tax identifiers, and harvest scheduling defaults.
            </p>
          </div>
        </div>
      </div>

      <BusinessSettingsClient initialSettings={defaultSettings} />
    </div>
  );
}
