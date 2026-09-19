"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Compass, ShoppingCart, Landmark, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileDrawer } from "./MobileDrawer";
import { useState } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        <div className="grid h-16 max-w-lg md:max-w-xl grid-cols-5 mx-auto px-2">
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
                    "flex items-center justify-center w-12 h-7 rounded-full mb-0.5 transition-colors",
                    isActive ? "bg-primary/15 text-primary font-semibold dark:bg-primary/25" : "text-slate-500"
                  )}
                >
                  <Icon size={20} className={cn("transition-transform", isActive && "scale-110 stroke-[2.3]")} />
                </div>
                <span className={cn(
                  "text-[11px] tracking-tight leading-none",
                  isActive ? "font-bold text-primary" : "font-medium"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setDrawerOpen(true)}
            type="button"
            className="inline-flex flex-col items-center justify-center py-1 transition-transform duration-75 active:scale-95 group text-slate-500 dark:text-slate-400 hover:text-slate-700 touch-manipulation"
            aria-label="Open full menu"
          >
            <div className="flex items-center justify-center w-12 h-7 rounded-full mb-0.5 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
              <Menu size={20} />
            </div>
            <span className="text-[11px] font-medium tracking-tight leading-none">More</span>
          </button>
        </div>
      </nav>

      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
