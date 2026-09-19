"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, Settings, Users, Truck, Factory, Archive, UsersRound, UserSquare, CreditCard, Send, Activity, TrendingUp, CalendarClock, Bell, Landmark, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in" 
        onClick={() => onOpenChange(false)} 
      />

      {/* Drawer Panel */}
      <div className="relative z-50 flex w-[85%] max-w-[320px] flex-col bg-white dark:bg-slate-900 shadow-2xl pt-safe pb-safe animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-white p-1 shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="Rakshi Coco"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">Rakshi Coco</h2>
              <p className="text-[11px] text-slate-500">Navigation & Modules</p>
            </div>
          </div>
          <button 
            onClick={() => onOpenChange(false)} 
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Operations */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Operations</h4>
            <div className="grid grid-cols-2 gap-2">
              <DrawerLink href="/dashboard/cutting" icon={<Settings size={16} />} label="Cutting" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/grouping" icon={<Users size={16} />} label="Grouping" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/transport" icon={<Truck size={16} />} label="Transport" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/processing" icon={<Factory size={16} />} label="Processing" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/stock" icon={<Archive size={16} />} label="Stock" onClick={() => onOpenChange(false)} />
            </div>
          </div>

          {/* Labour */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Labour</h4>
            <div className="grid grid-cols-2 gap-2">
              <DrawerLink href="/dashboard/teams" icon={<UsersRound size={16} />} label="Teams" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/workers" icon={<UserSquare size={16} />} label="Workers" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/labour-payments" icon={<CreditCard size={16} />} label="Wages" onClick={() => onOpenChange(false)} />
            </div>
          </div>

          {/* Sales & Dispatch */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sales</h4>
            <div className="grid grid-cols-2 gap-2">
              <DrawerLink href="/dashboard/buyers" icon={<UserSquare size={16} />} label="Buyers" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/dispatch" icon={<Send size={16} />} label="Dispatch" onClick={() => onOpenChange(false)} />
            </div>
          </div>
          
          {/* Finance */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Finance</h4>
            <div className="grid grid-cols-2 gap-2">
              <DrawerLink href="/dashboard/receivables" icon={<Activity size={16} />} label="Receivables" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/payables" icon={<Landmark size={16} />} label="Payables" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/expenses" icon={<TrendingUp size={16} />} label="Expenses" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/pnl" icon={<TrendingUp size={16} />} label="P & L" onClick={() => onOpenChange(false)} />
            </div>
          </div>

          {/* Settings & System */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">System & Tools</h4>
            <div className="grid grid-cols-2 gap-2">
              <DrawerLink href="/dashboard/ai" icon={<Activity size={16} />} label="Rakshi AI" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/recycle-bin" icon={<Archive size={16} />} label="Recycle Bin" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/farm-followups" icon={<CalendarClock size={16} />} label="Follow-ups" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/notifications" icon={<Bell size={16} />} label="Alerts" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/audit-log" icon={<Activity size={16} />} label="Audit Log" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/settings" icon={<Settings size={16} />} label="Settings" onClick={() => onOpenChange(false)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <form action={logout}>
            <Button 
              variant="outline" 
              className="w-full justify-center text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-950/30 active:scale-95 transition-all text-sm font-semibold h-11" 
              type="submit"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function DrawerLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link 
      href={href} 
      prefetch={true}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3 text-xs font-semibold rounded-xl border border-slate-200/70 bg-slate-50/80 text-slate-700 hover:text-primary hover:border-primary/30 hover:bg-primary/5 active:scale-95 duration-75 touch-manipulation dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 dark:hover:text-white transition-all shadow-xs"
    >
      <span className="mb-1.5 text-slate-500 dark:text-slate-400 group-hover:text-primary">{icon}</span>
      <span className="truncate max-w-full">{label}</span>
    </Link>
  );
}
