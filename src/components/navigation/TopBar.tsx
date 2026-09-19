"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Bell, Search, Menu, User, Settings, LogOut, Trash2 } from "lucide-react";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { MobileDrawer } from "./MobileDrawer";
import { getCurrentUserProfile, type UserProfileData } from "@/lib/actions/profile";
import { logout } from "@/app/login/actions";
import { cn } from "@/lib/utils";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Rakshi Coco",
  "/dashboard/farms": "Farm Network",
  "/dashboard/farms/new": "New Farm",
  "/dashboard/purchases": "Procurement",
  "/dashboard/purchases/new": "New Purchase",
  "/dashboard/cutting": "Cutting Operations",
  "/dashboard/cutting/new": "New Cutting Batch",
  "/dashboard/transport": "Logistics & Transport",
  "/dashboard/transport/new": "New Transport",
  "/dashboard/grouping": "Grouping Batches",
  "/dashboard/grouping/new": "New Grouping Batch",
  "/dashboard/processing": "Processing",
  "/dashboard/processing/new": "New Processing Batch",
  "/dashboard/stock": "Godown Inventory",
  "/dashboard/sales": "Sales Orders",
  "/dashboard/sales/new": "New Sale Order",
  "/dashboard/dispatch": "Dispatch Management",
  "/dashboard/dispatch/new": "New Dispatch",
  "/dashboard/buyers": "Buyer Directory",
  "/dashboard/buyers/new": "New Buyer",
  "/dashboard/bills": "Billing & Invoices",
  "/dashboard/bills/new": "New Commercial Bill",
  "/dashboard/buyer-payments": "Buyer Collections",
  "/dashboard/farm-payments": "Farm Disbursements",
  "/dashboard/farm-payments/new": "Disburse Farm Payment",
  "/dashboard/labour-payments": "Labour Wages",
  "/dashboard/labour-payments/new": "Pay Labour Wage",
  "/dashboard/expenses": "Operational Expenses",
  "/dashboard/expenses/new": "Record Expense",
  "/dashboard/pnl": "Profit & Loss",
  "/dashboard/cash-flow": "Cash Flow",
  "/dashboard/receivables": "Receivables Ledger",
  "/dashboard/payables": "Payables Ledger",
  "/dashboard/workers": "Worker Directory",
  "/dashboard/workers/new": "Add Worker",
  "/dashboard/teams": "Harvester Teams",
  "/dashboard/teams/new": "Add Harvester Team",
  "/dashboard/farm-followups": "Field Follow-ups",
  "/dashboard/notifications": "Notifications",
  "/dashboard/audit-log": "Audit Trails",
  "/dashboard/recycle-bin": "Recycle Bin",
  "/dashboard/settings": "System Settings",
  "/dashboard/settings/account": "Account Settings",
  "/dashboard/settings/business": "Business Configuration",
  "/dashboard/reports": "Operational Reports",
  "/dashboard/ai": "Rakshi AI Assistant",
};

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const isRootDashboard = pathname === "/dashboard";
  const title = ROUTE_TITLES[pathname] || "Rakshi Coco";

  useEffect(() => {
    getCurrentUserProfile()
      .then((p) => setProfile(p))
      .catch(() => {});
  }, [pathname]);

  // Close avatar menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "RC";

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 pt-safe">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto">
          {/* Left: Back button + Logo + Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            {!isRootDashboard && (
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-9 h-9 -ml-1 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all shrink-0"
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

            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight truncate">
                {title}
              </span>
              {!isRootDashboard && (
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Rakshi Coco ERP
                </span>
              )}
            </div>
          </div>

          {/* Right: Search + Notifications + Avatar + Menu */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Global Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all"
              aria-label="Global Search"
              title="Search ERP (Ctrl+K)"
            >
              <Search size={18} />
            </button>

            {/* Notifications Link */}
            <Link
              href="/dashboard/notifications"
              className="relative flex items-center justify-center w-9 h-9 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </Link>

            {/* Avatar Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-primary/10 text-primary font-bold text-xs border border-primary/20 hover:ring-2 hover:ring-primary/30 active:scale-95 transition-all"
                aria-label="User profile menu"
              >
                {profile?.signedAvatarUrl ? (
                  <Image
                    src={profile.signedAvatarUrl}
                    alt={profile.full_name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </button>

              {/* Avatar Menu Popover */}
              {avatarMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {profile?.full_name || "Admin"}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{profile?.email}</p>
                  </div>

                  <Link
                    href="/dashboard/settings/account"
                    onClick={() => setAvatarMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <User size={14} className="text-slate-400" />
                    <span>Account</span>
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    onClick={() => setAvatarMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Settings size={14} className="text-slate-400" />
                    <span>Settings</span>
                  </Link>

                  <Link
                    href="/dashboard/recycle-bin"
                    onClick={() => setAvatarMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Trash2 size={14} className="text-slate-400" />
                    <span>Recycle Bin</span>
                  </Link>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <form action={logout}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                    >
                      <LogOut size={14} />
                      <span>Log out</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Menu Button (opens MobileDrawer) */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all"
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Mobile Drawer */}
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
