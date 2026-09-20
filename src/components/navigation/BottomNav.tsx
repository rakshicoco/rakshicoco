"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Compass, ShoppingCart, Landmark, Menu } from "lucide-react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileDrawer } from "./MobileDrawer";
import { AiChatPanel } from "@/components/ai/AiChatPanel";
import { useState } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Operations", href: "/dashboard/farms", icon: Compass },
    { name: "Sales", href: "/dashboard/sales", icon: ShoppingCart },
    { name: "Finance", href: "/dashboard/bills", icon: Landmark },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 pb-safe transition-all"
        role="navigation"
        aria-label="Bottom Navigation"
      >
        <div className="grid h-16 max-w-lg md:max-w-xl grid-cols-6 mx-auto px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={cn(
                  "inline-flex flex-col items-center justify-center py-1 transition-transform duration-75 active:scale-95 group relative touch-manipulation",
                  isActive ? "text-primary" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                )}
              >
                {/* Active Indicator Pill */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-7 rounded-full mb-0.5 transition-colors",
                    isActive ? "bg-primary/15 text-primary font-semibold dark:bg-primary/25" : "text-slate-500"
                  )}
                >
                  <Icon size={19} className={cn("transition-transform", isActive && "scale-110 stroke-[2.3]")} />
                </div>
                <span className={cn(
                  "text-[10px] tracking-tight leading-none",
                  isActive ? "font-bold text-primary" : "font-medium"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Rakshi AI Tab */}
          <button
            onClick={() => setAiOpen(true)}
            type="button"
            className="inline-flex flex-col items-center justify-center py-1 transition-transform duration-75 active:scale-95 group touch-manipulation text-emerald-600 dark:text-emerald-500"
            aria-label="Open Rakshi AI"
          >
            <div className="relative flex items-center justify-center w-10 h-7 rounded-full mb-0.5 bg-emerald-50 dark:bg-emerald-950/40 group-active:bg-emerald-100 transition-colors">
              <Sparkles size={17} className="fill-emerald-500/30" />
              {/* Subtle live pulse dot */}
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-[10px] font-bold tracking-tight leading-none">AI</span>
          </button>

          {/* More / Sandwich */}
          <button
            onClick={() => setDrawerOpen(true)}
            type="button"
            className="inline-flex flex-col items-center justify-center py-1 transition-transform duration-75 active:scale-95 group text-slate-500 dark:text-slate-400 hover:text-slate-700 touch-manipulation"
            aria-label="Open full menu"
          >
            <div className="flex items-center justify-center w-10 h-7 rounded-full mb-0.5 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
              <Menu size={19} />
            </div>
            <span className="text-[10px] font-medium tracking-tight leading-none">More</span>
          </button>
        </div>
      </nav>

      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <AiChatPanel open={aiOpen} onOpenChange={setAiOpen} />
    </>
  );
}
