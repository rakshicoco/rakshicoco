import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, Building2, Trash2, Shield, Bell, Activity, ArrowRight, Lock } from "lucide-react";

export default function SettingsPage() {
  const sections = [
    {
      title: "Account & Profile",
      description: "Personal identity, profile avatar photo (private storage), contact phone",
      href: "/dashboard/settings/account",
      icon: UserCheck,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Business Configuration",
      description: "Company legal name, GSTIN, official contacts, harvest cycle defaults",
      href: "/dashboard/settings/business",
      icon: Building2,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Recycle Bin",
      description: "90-day retention for Master, Operational, and Financial records with dependency checks",
      href: "/dashboard/recycle-bin",
      icon: Trash2,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
    },
    {
      title: "Notifications & Alerts",
      description: "System alerts, harvest follow-up reminders, and overdue payment notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      title: "Audit Trails",
      description: "Immutable security logging for system mutations, deletions, and restorations",
      href: "/dashboard/audit-log",
      icon: Activity,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          System Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage identity, company details, retention policies, and security trails.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link key={sec.href} href={sec.href} prefetch={true} className="group">
              <Card className="h-full border-slate-200 dark:border-slate-800 hover:border-primary/40 dark:hover:border-primary/40 transition-all hover:shadow-md">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className={`p-3 rounded-2xl shrink-0 ${sec.color}`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                        {sec.title}
                      </h3>
                      <ArrowRight size={16} className="text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {sec.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
