"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Loader2, CheckCircle2, AlertTriangle, ArrowRight, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@/lib/ai/client";
import type { PendingAction } from "@/lib/ai/confirmation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiChatPanel({ open, onOpenChange }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am **Rakshi AI**, your coconut ERP assistant. I can query real-time ready stock, calculate P&L, search farms, and prepare operations.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!open) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages.slice(-6) }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const botMsg: ChatMessage = await res.json();
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered an error connecting to the ERP engine. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (action: PendingAction, decision: "confirm" | "cancel") => {
    setActionLoading(action.id);
    try {
      const res = await fetch("/api/ai/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: action.id, decision }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Action execution failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            decision === "confirm"
              ? `✅ **Action Confirmed and Executed:**\n${data.message}`
              : "❌ Action was cancelled.",
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Execution failed: ${err.message}`,
        },
      ]);
    } finally {
      setActionLoading(null);
    }
  };

  const quickChips = [
    "Ready Stock",
    "P&L Statement",
    "Pending Receivables",
    "Active Farms",
    "Recent Purchases",
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Slide-over Panel — chat-panel-safe uses 100dvh so keyboard shrinks it, not pushes header off */}
      <div className="relative z-50 flex w-full max-w-md flex-col bg-white dark:bg-slate-900 shadow-2xl chat-panel-safe pt-safe pb-safe animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Rakshi AI
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                  Assistant
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">Enterprise Coconut ERP Intelligence</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              disabled={loading}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary active:scale-95 transition-all shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 scroll-container p-4 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div key={idx} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot size={15} />
                  </div>
                )}

                <div className={`space-y-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? "bg-primary text-white rounded-tr-xs"
                        : "bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-tl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.content}</div>

                    {/* Render Pending Action Confirmation Card */}
                    {m.pendingAction && (
                      <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 shadow-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                          <AlertTriangle size={13} />
                          <span>Confirmation Required</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {m.pendingAction.summary}
                        </p>
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmAction(m.pendingAction!, "confirm")}
                            disabled={actionLoading === m.pendingAction.id}
                            className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex-1"
                          >
                            {actionLoading === m.pendingAction.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              "Confirm & Execute"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConfirmAction(m.pendingAction!, "cancel")}
                            disabled={actionLoading === m.pendingAction.id}
                            className="h-7 text-[11px] font-semibold"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={15} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-1">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span>Rakshi AI is querying ERP data...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Rakshi AI..."
              disabled={loading}
              className="flex-1 h-10 text-xs rounded-xl"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-10 w-10 rounded-xl p-0 bg-primary hover:bg-primary/90 shrink-0"
              aria-label="Send"
            >
              <Send size={16} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
