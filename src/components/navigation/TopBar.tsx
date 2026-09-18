"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

// Route title mapping for intuitive header display
const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Rakshi Coco",
  "/dashboard/farms": "Farm Network",
  "/dashboard/farms/new": "New Farm",
  "/dashboard/purchases": "Procurement",
  "/dashboard/purchases/new": "New Purchase",
  "/dashboard/cutting": "Cutting Operations",
  "/dashboard/transport": "Logistics & Transport",
  "/dashboard/transport/new": "New Transport",
  "/dashboard/grouping": "Grouping Batches",
  "/dashboard/processing": "Processing",
  "/dashboard/stock": "Godown Inventory",
  "/dashboard/sales": "Sales Orders",
  "/dashboard/sales/new": "New Sale Order",
  "/dashboard/dispatch": "Dispatch Management",
  "/dashboard/buyers": "Buyer Directory",
  "/dashboard/buyers/new": "New Buyer",
  "/dashboard/bills": "Billing & Invoices",
  "/dashboard/buyer-payments": "Buyer Collections",
  "/dashboard/farm-payments": "Farm Disbursements",
  "/dashboard/labour-payments": "Labour Wages",
  "/dashboard/expenses": "Operational Expenses",
  "/dashboard/pnl": "Profit & Loss",
  "/dashboard/cash-flow": "Cash Flow",
  "/dashboard/receivables": "Receivables Ledger",
  "/dashboard/payables": "Payables Ledger",
  "/dashboard/workers": "Worker Directory",
  "/dashboard/teams": "Harvester Teams",
  "/dashboard/farm-followups": "Field Follow-ups",
  "/dashboard/notifications": "Notifications",
  "/dashboard/audit-log": "Audit Trails",
  "/dashboard/settings": "System Settings",
  "/dashboard/reports": "Operational Reports",
};

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();

  const isRootDashboard = pathname === "/dashboard";
  const title = ROUTE_TITLES[pathname] || "Rakshi Coco";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 pt-safe">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto">
        {/* Left: Back button or Brand Logo */}
        <div className="flex items-center gap-2.5">
          {!isRootDashboard && (
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-9 h-9 -ml-1 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="stroke-[2.5]" />
            </button>
          )}

          <div className="relative w-9 h-9 rounded-xl bg-white p-1 shadow-xs border border-slate-200/80 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
            <Image
              src="/logo.png"
              alt="Rakshi Coco"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>

          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              {title}
            </span>
            {!isRootDashboard && (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Rakshi Coco ERP
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick actions (Notifications & Status badge) */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/dashboard/notifications"
            className="relative flex items-center justify-center w-9 h-9 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {/* Unread dot */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full ring-2 ring-white dark:ring-slate-900" />
          </Link>

          <Link
            href="/dashboard/settings"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20 active:scale-95 transition-all"
          >
            RC
          </Link>
        </div>
      </div>
    </header>
  );
}
