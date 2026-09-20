"use client";

import { useState } from "react";
import { Plus, X, ShoppingCart, Leaf, FileText, CreditCard, Truck, PackagePlus } from "lucide-react";
import Link from "next/link";

const quickActions = [
  { label: "New Purchase", href: "/dashboard/purchases/new", icon: PackagePlus, color: "bg-emerald-600" },
  { label: "New Farm", href: "/dashboard/farms/new", icon: Leaf, color: "bg-teal-600" },
  { label: "New Sale", href: "/dashboard/sales/new", icon: ShoppingCart, color: "bg-blue-600" },
  { label: "Create Bill", href: "/dashboard/bills/new", icon: FileText, color: "bg-amber-600" },
  { label: "Payment", href: "/dashboard/buyer-payments/new", icon: CreditCard, color: "bg-purple-600" },
  { label: "Transport", href: "/dashboard/transport/new", icon: Truck, color: "bg-slate-600" },
];

export function QuickAccessFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-5 z-50 flex flex-col-reverse items-end gap-3">
        {/* Speed-dial action items */}
        {open &&
          quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 group animate-in slide-in-from-bottom-2 fade-in"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
              >
                {/* Label pill */}
                <span className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-md border border-slate-200/80 dark:border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {action.label}
                </span>
                <span className="text-[11px] font-semibold bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-full shadow-sm border border-slate-200/60 dark:border-slate-700 whitespace-nowrap group-hover:hidden">
                  {action.label}
                </span>
                {/* Icon circle */}
                <div
                  className={`w-11 h-11 rounded-full ${action.color} text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform`}
                >
                  <Icon size={18} />
                </div>
              </Link>
            );
          })}

        {/* Main FAB */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 ${
            open
              ? "bg-slate-700 text-white rotate-45"
              : "bg-emerald-600 text-white hover:bg-emerald-500"
          }`}
          aria-label={open ? "Close quick actions" : "Quick actions"}
        >
          {open ? <X size={22} /> : <Plus size={26} strokeWidth={2.5} />}
        </button>
      </div>
    </>
  );
}
