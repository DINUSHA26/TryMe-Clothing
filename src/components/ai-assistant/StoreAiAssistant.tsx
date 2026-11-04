"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  RotateCcw,
  ExternalLink,
  PhoneCall,
  Minimize2,
} from "lucide-react";

interface ActionItem {
  type: string;
  slug?: string;
  id?: string;
  title?: string;
  phone?: string;
  text?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  actions?: ActionItem[];
  timestamp: string;
}

interface StoreAiAssistantProps {
  contextType: "VENDOR" | "ADS_SELLER" | "PRODUCT" | "AD" | "STANDALONE_SITE";
  contextId: string;
  storeName?: string;
  productTitle?: string;
}

export default function StoreAiAssistant({
  contextType,
  contextId,
  storeName = "Store",
  productTitle,
}: StoreAiAssistantProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnreadNotice, setHasUnreadNotice] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("toggle-store-ai", handleToggle);
    window.addEventListener("open-store-ai", handleOpen);
    return () => {
      window.removeEventListener("toggle-store-ai", handleToggle);
      window.removeEventListener("open-store-ai", handleOpen);
    };
  }, []);

  const initialGreeting = productTitle
    ? `Hello! 👋 I'm your AI Shopping Assistant for **${storeName}**.\n\nYou're viewing **"${productTitle}"**. You can ask me anything about its price, specifications, stock, or delivery in English, සිංහල, Singlish, or தமிழ்!`
    : `Hello! 👋 Welcome to **${storeName}**.\n\nI'm your official AI Store Assistant. Ask me anything about our products, prices, stock availability, or location in English, සිංහල, Singlish, or தமிழ்!`;

  useEffect(() => {
    if (mounted && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "model",
          content: initialGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [mounted, storeName, productTitle]);

  useEffect(() => {
    if (isOpen) {
      setHasUnreadNotice(false);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages, isLoading]);

  if (!mounted) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const historyForApi = newMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/ai-assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          contextType,
          contextId,
          chatHistory: historyForApi.slice(-6),
        }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "model",
          content: data.reply,
          actions: data.actions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `ai-err-${Date.now()}`,
          role: "model",
          content:
            data.error ||
            "Sorry, I couldn't reach the store assistant right now. Please check your internet or try asking again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: "model",
          content: "Sorry, connection error. Please try again or contact the seller directly.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "model",
        content: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const quickQuestions = [
    "What are your top products / items?",
    "Do you deliver? Delivery details?",
    "Can I contact you on WhatsApp?",
    "Are there any discounts available?",
  ];

  return (
    <>
      {/* ── Floating AI Trigger Button (Top Right Corner) ── */}
      {!isOpen && (
        <div style={{ position: "fixed", top: "80px", right: "20px", zIndex: 99999 }} className="flex items-center gap-2.5 pointer-events-auto">
          {/* Welcome Tooltip / Chip when closed */}
          {hasUnreadNotice && (
            <div
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900 border border-orange-500/40 hover:border-orange-500 text-slate-800 dark:text-slate-100 px-3.5 py-2 rounded-2xl shadow-xl cursor-pointer hover:shadow-2xl transition-all"
            >
              <Sparkles className="w-4 h-4 text-orange-500 shrink-0 animate-pulse" />
              <div className="text-xs font-bold leading-tight">
                <span className="text-orange-600 dark:text-orange-400">Ask Store AI</span>
                <span className="block text-[10px] text-slate-400 font-normal">
                  සිංහල • Singlish • English
                </span>
              </div>
            </div>
          )}

          {/* Floating Bubble Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Store AI Assistant"
            className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-2xl hover:scale-105 hover:shadow-orange-500/50 ring-4 ring-orange-500/25 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-25" />
            <Bot className="w-7 h-7 relative z-10" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </button>
        </div>
      )}

      {/* ── Slide-down Interactive Chat Dialog Window (Top Right Corner) ── */}
      {isOpen && (
        <div style={{ position: "fixed", top: "80px", right: "16px", zIndex: 99999 }} className="w-[calc(100vw-32px)] sm:w-[420px] max-h-[calc(100vh-100px)] h-[82vh] sm:h-[600px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm truncate max-w-[190px]">
                    {storeName}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-[10px] font-bold tracking-wider text-emerald-100 flex items-center gap-1 border border-emerald-300/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-orange-100 font-medium truncate">
                  Instant Store Assistant • 24/7
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleResetChat}
                title="Clear and restart chat"
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Multilingual Support Banner */}
          <div className="px-3.5 py-1.5 bg-orange-50 dark:bg-slate-800/80 border-b border-orange-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Supports:
              </span>
              <span className="truncate text-orange-600 dark:text-orange-400 font-bold">
                සිංහල • Singlish • English • தமிழ்
              </span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-br-xs"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Actionable CTA Buttons inside AI Bubble */}
                    {!isUser && msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-col gap-1.5">
                        {msg.actions.map((act, idx) => {
                          if (act.type === "VIEW_PRODUCT" && act.slug) {
                            return (
                              <Link
                                key={idx}
                                href={`/products/${act.slug}`}
                                className="inline-flex items-center justify-between gap-2 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-bold text-xs rounded-xl border border-orange-200 dark:border-orange-800/60 transition-all"
                              >
                                <span className="truncate">
                                  View Product: {act.title || act.slug}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              </Link>
                            );
                          }

                          if (act.type === "VIEW_AD" && act.id) {
                            return (
                              <Link
                                key={idx}
                                href={`/marketplace/${act.id}`}
                                className="inline-flex items-center justify-between gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-800/60 transition-all"
                              >
                                <span className="truncate">
                                  View Classified: {act.title || "Ad details"}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              </Link>
                            );
                          }

                          if (act.type === "WHATSAPP" && act.phone) {
                            const cleanPhone = act.phone.replace(/[^0-9]/g, "");
                            const preText = encodeURIComponent(
                              act.text || `Hello ${storeName}, I have a question from TryMe.lk`
                            );
                            return (
                              <a
                                key={idx}
                                href={`https://wa.me/${cleanPhone}?text=${preText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-between gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800/60 transition-all"
                              >
                                <span className="truncate">Order / Chat on WhatsApp</span>
                                <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                              </a>
                            );
                          }

                          return null;
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Typing Loader Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-orange-600">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" />
                  <span className="text-xs text-slate-400 font-medium pl-1.5">
                    Answering...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {messages.length <= 3 && !isLoading && (
            <div className="px-3.5 py-2 bg-slate-100/70 dark:bg-slate-900/70 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Box Footer */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask in Sinhala, Singlish, English, or Tamil..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="w-10 h-10 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 shadow-md shadow-orange-600/30 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-1.5 font-medium">
              TryMe Store AI • Real-time answers based on store inventory
            </p>
          </div>
        </div>
      )}
    </>
  );
}
