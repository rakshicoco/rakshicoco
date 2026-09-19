import { getCurrentUserProfile } from "@/lib/actions/profile";
import { AccountSettingsClient } from "./AccountSettingsClient";
import { UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const profile = await getCurrentUserProfile();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <UserCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Account Settings
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your personal identity, avatar image, and contact information.
            </p>
          </div>
        </div>
      </div>

      <AccountSettingsClient initialProfile={profile} />
    </div>
  );
}
