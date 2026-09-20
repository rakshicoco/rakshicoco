"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Bot, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { ChatMessage } from "@/lib/ai/client";
import type { PendingAction } from "@/lib/ai/confirmation";

export default function AiDashboardPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome to **Rakshi AI Executive Command**.\n\nI have complete authorized visibility into your coconut procurement network, inventory, logistics, receivables, and profit & loss.\n\nWhat would you like to analyze or execute?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

      if (!res.ok) throw new Error("Failed to get response");
      const botMsg: ChatMessage = await res.json();
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to AI service. Please retry." },
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
      if (!res.ok) throw new Error(data.error || "Action execution failed");

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
        { role: "assistant", content: `⚠️ Execution failed: ${err.message}` },
      ]);
    } finally {
      setActionLoading(null);
    }
  };

  const quickPills = [
    "Ready Stock & Godown Movement",
    "Comprehensive P&L Statement",
    "Outstanding Receivables",
    "Active Farms Directory",
    "Recent Procurement Batches",
    "Commercial Invoices & Bills",
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto" style={{ height: 'calc(100dvh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Rakshi AI Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authorized ERP executive tool layer with zero arbitrary SQL and server-enforced confirmations.
          </p>
        </div>
      </div>

      {/* Suggestion Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
        {quickPills.map((pill) => (
          <button
            key={pill}
            onClick={() => handleSend(pill)}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary transition-all shrink-0 active:scale-95 shadow-2xs"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <CardContent className="flex-1 scroll-container p-4 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div key={idx} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={18} />
                  </div>
                )}

                <div className={`space-y-2 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? "bg-primary text-white rounded-tr-xs"
                        : "bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-tl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.content}</div>

                    {m.pendingAction && (
                      <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 shadow-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
                          <AlertTriangle size={15} />
                          <span>Server Confirmation Required</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {m.pendingAction.summary}
                        </p>
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmAction(m.pendingAction!, "confirm")}
                            disabled={actionLoading === m.pendingAction.id}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          >
                            {actionLoading === m.pendingAction.id ? (
                              <Loader2 size={13} className="animate-spin mr-1" />
                            ) : null}
                            Confirm & Execute
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConfirmAction(m.pendingAction!, "cancel")}
                            disabled={actionLoading === m.pendingAction.id}
                            className="h-8 text-xs font-semibold"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-1">
              <Loader2 size={15} className="animate-spin text-primary" />
              <span>Querying ERP database modules...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question or operational request..."
              disabled={loading}
              className="flex-1 h-11 text-sm rounded-xl"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-11 px-4 rounded-xl bg-primary hover:bg-primary/90 shrink-0 font-semibold"
            >
              <Send size={16} className="mr-2" /> Ask AI
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
