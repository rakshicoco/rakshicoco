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
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-slate-200 dark:bg-slate-900 dark:border-slate-800 pb-safe">
        <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Check if active. Dashboard is exact, others prefix
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "inline-flex flex-col items-center justify-center px-5 hover:bg-slate-50 dark:hover:bg-slate-800 group",
                  isActive ? "text-primary" : "text-slate-500 dark:text-slate-400"
                )}
              >
                <Icon size={24} className={cn("mb-1", isActive && "text-primary")} />
                <span className="text-[10px] sm:text-xs">{item.name}</span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setDrawerOpen(true)}
            type="button"
            className="inline-flex flex-col items-center justify-center px-5 hover:bg-slate-50 dark:hover:bg-slate-800 group text-slate-500 dark:text-slate-400"
          >
            <Menu size={24} className="mb-1" />
            <span className="text-[10px] sm:text-xs">More</span>
          </button>
        </div>
      </div>
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
