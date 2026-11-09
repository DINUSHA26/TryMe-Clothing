"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Copy,
  Check,
  Send,
  Loader2,
  Facebook,
  Instagram,
  RefreshCw,
  Tag,
  Truck,
  Languages,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export interface MarketingItemData {
  type: "PRODUCT" | "SERVICE" | "AD";
  id: string;
  name: string;
  price?: number | string | null;
  category?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  specifications?: any;
  location?: string | null;
}

interface AiSocialPostModalProps {
  item: MarketingItemData;
  triggerButton?: React.ReactNode;
}

export function AiSocialPostModal({ item, triggerButton }: AiSocialPostModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"facebook" | "instagram">("facebook");
  const [facebookPost, setFacebookPost] = useState("");
  const [instagramPost, setInstagramPost] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "model"; text: string }>>([]);

  const handleOpenModal = (open: boolean) => {
    setIsOpen(open);
    if (open && !facebookPost && !isLoading) {
      generatePosts();
    }
  };

  const generatePosts = async (customInstruction?: string) => {
    setIsLoading(true);
    setHasCopied(false);

    try {
      const instructionToSend = customInstruction || inputPrompt.trim();

      const newHistory = [...chatHistory];
      if (instructionToSend) {
        newHistory.push({ role: "user", text: instructionToSend });
      }

      const res = await fetch("/api/ai/marketing-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item,
          instruction: instructionToSend || undefined,
          history: chatHistory,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to generate posts");
      }

      const { facebookPost: fb, instagramPost: ig, reply } = json.data;
      setFacebookPost(fb || "");
      setInstagramPost(ig || "");
      setAiReply(reply || "Here are your high-converting social media posts!");

      if (reply) {
        newHistory.push({ role: "model", text: reply });
      }
      setChatHistory(newHistory);
      setInputPrompt("");
    } catch (err: any) {
      toast.error("Generation Failed", {
        description: err.message || "Could not generate marketing post",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, platformName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    toast.success(`${platformName} Post Copied!`, {
      description: "Ready to paste directly into your social media page or app.",
    });
    setTimeout(() => setHasCopied(false), 2500);
  };

  const quickPills = [
    { label: "10% Discount", icon: Tag, prompt: "Add an attractive 10% special discount to the offer with urgency!" },
    { label: "Free Delivery", icon: Truck, prompt: "Highlight Free Islandwide Cash on Delivery across Sri Lanka." },
    { label: "Singlish Style", icon: Languages, prompt: "Rewrite the post in friendly Sri Lankan Singlish (English + Sinhala mix) that connects with local buyers." },
    { label: "Short & Punchy", icon: Zap, prompt: "Make it a short, punchy 3-line viral ad with powerful Call to Action." },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenModal}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 hover:from-purple-500/20 hover:to-amber-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            AI Social Posts
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-purple-50 via-pink-50/50 to-amber-50/30 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-600 text-white shadow-sm shadow-purple-600/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  AI Social Post Studio
                  <Badge variant="secondary" className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                    Gemini Marketing AI
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Generate, chat & refine viral Facebook and Instagram posts in seconds
                </p>
              </div>
            </div>
          </div>

          {/* Item Preview Strip */}
          <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-gray-200/70 dark:border-slate-700/70 shadow-2xs">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-12 h-12 object-cover rounded-lg shrink-0 border border-gray-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-slate-700 flex items-center justify-center text-purple-600 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {item.name}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px] py-0 h-4 border-gray-300">
                  {item.type}
                </Badge>
                {item.price && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Rs. {Number(item.price).toLocaleString("en-LK")}
                  </span>
                )}
                {item.category && (
                  <span className="text-xs text-gray-500 dark:text-slate-400 truncate">
                    • {item.category}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generatePosts()}
              disabled={isLoading}
              className="h-8 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              title="Regenerate fresh copy"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Regen
            </Button>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* AI Reply Bubble if present */}
          {aiReply && (
            <div className="text-xs p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 border border-purple-200/60 dark:border-purple-800/60 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>{aiReply}</span>
            </div>
          )}

          {/* Platform Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "facebook" | "instagram")}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-2">
              <TabsList className="bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger
                  value="facebook"
                  className="gap-1.5 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg"
                >
                  <Facebook className="w-3.5 h-3.5" />
                  Facebook Post
                </TabsTrigger>
                <TabsTrigger
                  value="instagram"
                  className="gap-1.5 text-xs data-[state=active]:bg-pink-600 data-[state=active]:text-white rounded-lg"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  Instagram Caption
                </TabsTrigger>
              </TabsList>

              {/* 1-Click Copy Button */}
              <Button
                size="sm"
                onClick={() =>
                  handleCopy(
                    activeTab === "facebook" ? facebookPost : instagramPost,
                    activeTab === "facebook" ? "Facebook" : "Instagram"
                  )
                }
                disabled={isLoading || !(activeTab === "facebook" ? facebookPost : instagramPost)}
                className={`gap-1.5 text-xs font-bold transition-all shadow-sm ${
                  hasCopied
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                }`}
              >
                {hasCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Post
                  </>
                )}
              </Button>
            </div>

            {/* Facebook Content Card */}
            <TabsContent value="facebook" className="mt-0">
              <div className="relative rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-950 p-4 min-h-[180px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-44 text-gray-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs">Crafting high-converting Facebook post...</span>
                  </div>
                ) : facebookPost ? (
                  <pre className="text-xs font-sans whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed select-text">
                    {facebookPost}
                  </pre>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-12">
                    Click generate to create your Facebook post
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Instagram Content Card */}
            <TabsContent value="instagram" className="mt-0">
              <div className="relative rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-950 p-4 min-h-[180px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-44 text-gray-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
                    <span className="text-xs">Generating viral Instagram caption & hashtags...</span>
                  </div>
                ) : instagramPost ? (
                  <pre className="text-xs font-sans whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed select-text">
                    {instagramPost}
                  </pre>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-12">
                    Click generate to create your Instagram caption
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Refine Pills */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1.5">
              Quick Enhancements:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickPills.map((pill, i) => {
                const IconComp = pill.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isLoading}
                    onClick={() => generatePosts(pill.prompt)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-purple-950 text-gray-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 transition-colors border border-gray-200 dark:border-slate-700"
                  >
                    <IconComp className="w-3 h-3 text-purple-600" />
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat / Refine Input Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputPrompt.trim() && !isLoading) {
                generatePosts();
              }
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask AI: e.g. 'Add buy 1 get 1 offer', 'Make it Singlish'..."
              disabled={isLoading}
              className="text-xs h-9 bg-white dark:bg-slate-850 rounded-xl"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !inputPrompt.trim()}
              className="h-9 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Refine</span>
                </>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
