"use client";

import { Plus, Map, ShoppingCart, Scissors, TrendingUp, CreditCard, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function QuickActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { name: "New Farm", href: "/dashboard/farms/new", icon: Map, color: "bg-emerald-500" },
    { name: "New Purchase", href: "/dashboard/purchases/new", icon: ShoppingCart, color: "bg-blue-500" },
    { name: "New Sale", href: "/dashboard/sales/new", icon: TrendingUp, color: "bg-indigo-500" },
    { name: "New Payment", href: "/dashboard/buyer-payments/new", icon: CreditCard, color: "bg-purple-500" },
    { name: "New Transport", href: "/dashboard/transport/new", icon: Truck, color: "bg-orange-500" },
  ];

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end">
      {/* Action Menu (opens upwards) */}
      <div 
        className={cn(
          "flex flex-col-reverse items-end space-y-reverse space-y-3 mb-4 transition-all duration-200 origin-bottom",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <div key={action.name} className="flex items-center gap-3">
              <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg shadow-sm text-sm font-medium border border-slate-100 dark:border-slate-700">
                {action.name}
              </span>
              <Link
                href={action.href}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95",
                  action.color
                )}
                onClick={() => setIsOpen(false)}
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
          "flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95",
          isOpen && "rotate-45 bg-slate-700"
        )}
      >
        <Plus size={28} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/40 backdrop-blur-sm z-[-1]" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
