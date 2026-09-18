"use client";

import Link from "next/link";
import { LogOut, Settings, Users, Truck, Factory, Archive, UsersRound, UserSquare, CreditCard, Send, Activity, TrendingUp, CalendarClock, Bell, Landmark, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 flex w-[300px] flex-col overflow-y-auto bg-white dark:bg-slate-900 pb-20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary">Rakshi Coco</h2>
            <p className="text-sm text-slate-500">More Modules & Settings</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-2"><X size={20} /></button>
        </div>
        
        <div className="py-4 space-y-6">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operations</h4>
            <div className="grid grid-cols-2 gap-2">
              <DrawerLink href="/dashboard/cutting" icon={<Settings size={16} />} label="Cutting" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/grouping" icon={<Users size={16} />} label="Grouping" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/transport" icon={<Truck size={16} />} label="Transport" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/processing" icon={<Factory size={16} />} label="Processing" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/stock" icon={<Archive size={16} />} label="Stock" onClick={() => onOpenChange(false)} />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Labour</h4>
            <div className="grid grid-cols-2 gap-2">
              <DrawerLink href="/dashboard/teams" icon={<UsersRound size={16} />} label="Teams" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/workers" icon={<UserSquare size={16} />} label="Workers" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/labour-payments" icon={<CreditCard size={16} />} label="Payments" onClick={() => onOpenChange(false)} />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sales</h4>
            <div className="grid grid-cols-2 gap-2">
              <DrawerLink href="/dashboard/buyers" icon={<UserSquare size={16} />} label="Buyers" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/dispatch" icon={<Send size={16} />} label="Dispatch" onClick={() => onOpenChange(false)} />
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Finance</h4>
            <div className="grid grid-cols-2 gap-2">
              <DrawerLink href="/dashboard/receivables" icon={<Activity size={16} />} label="Receivables" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/payables" icon={<Landmark size={16} />} label="Payables" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/expenses" icon={<TrendingUp size={16} />} label="Expenses" onClick={() => onOpenChange(false)} />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports & Config</h4>
            <div className="grid grid-cols-2 gap-2">
              <DrawerLink href="/dashboard/farm-follow-ups" icon={<CalendarClock size={16} />} label="Follow-ups" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/notifications" icon={<Bell size={16} />} label="Notifications" onClick={() => onOpenChange(false)} />
              <DrawerLink href="/dashboard/settings" icon={<Settings size={16} />} label="Settings" onClick={() => onOpenChange(false)} />
            </div>
          </div>

          <div className="pt-4 border-t">
            <form action={logout}>
              <Button variant="outline" className="w-full justify-start text-slate-600" type="submit">
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function DrawerLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3 text-sm font-medium rounded-xl border border-slate-100 bg-slate-50 text-slate-700 hover:text-primary hover:border-primary/20 hover:bg-primary/5 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors"
    >
      <span className="mb-2 text-slate-500">{icon}</span>
      {label}
    </Link>
  );
}
