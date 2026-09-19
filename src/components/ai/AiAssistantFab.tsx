"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AiChatPanel } from "./AiChatPanel";

export function AiAssistantFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40">
        <button
          onClick={() => setOpen(true)}
          className="group relative flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-all"
          aria-label="Open Rakshi AI Assistant"
          title="Open Rakshi AI Assistant"
        >
          {/* Subtle pulse ring */}
          <span className="absolute -inset-0.5 rounded-full bg-emerald-400/40 opacity-75 animate-ping group-hover:opacity-100" />

          <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
            <Sparkles size={14} className="text-white fill-white/50 animate-pulse" />
          </div>

          <span className="relative tracking-tight font-semibold">Rakshi AI</span>
        </button>
      </div>

      <AiChatPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
