"use client";

import { Plus, Map, ShoppingCart, TrendingUp, CreditCard, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function QuickActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { name: "New Farm", href: "/dashboard/farms/new", icon: Map, color: "bg-emerald-600 shadow-emerald-600/30" },
    { name: "New Purchase", href: "/dashboard/purchases/new", icon: ShoppingCart, color: "bg-blue-600 shadow-blue-600/30" },
    { name: "New Sale", href: "/dashboard/sales/new", icon: TrendingUp, color: "bg-teal-600 shadow-teal-600/30" },
    { name: "New Payment", href: "/dashboard/buyer-payments/new", icon: CreditCard, color: "bg-purple-600 shadow-purple-600/30" },
    { name: "New Transport", href: "/dashboard/transport/new", icon: Truck, color: "bg-amber-600 shadow-amber-600/30" },
  ];

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-4 z-40 flex flex-col items-end pointer-events-auto">
      {/* Action Menu (opens upwards) */}
      <div 
        className={cn(
          "flex flex-col-reverse items-end space-y-reverse space-y-3 mb-3 transition-all duration-200 origin-bottom",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-8 pointer-events-none"
        )}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div key={action.name} className="flex items-center gap-3">
              <span className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md text-slate-800 dark:text-slate-100 px-3 py-1.5 rounded-full shadow-md text-xs font-semibold border border-slate-200/80 dark:border-slate-700">
                {action.name}
              </span>
              <Link
                href={action.href}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg transition-transform active:scale-90 hover:scale-105",
                  action.color
                )}
                onClick={() => setIsOpen(false)}
                aria-label={action.name}
              >
                <Icon size={20} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-all duration-200 active:scale-90 hover:scale-105",
          isOpen && "rotate-45 bg-slate-800 dark:bg-slate-700 shadow-slate-800/30"
        )}
        aria-label="Quick Actions"
      >
        <Plus size={26} className="stroke-[2.5]" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 dark:bg-slate-950/60 backdrop-blur-xs z-[-1]" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
