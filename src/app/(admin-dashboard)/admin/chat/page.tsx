"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AdminChatViewer } from "@/components/admin/chat/AdminChatViewer";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AdminChatPage() {
  const searchParams = useSearchParams();
  const flagged = searchParams.get("flagged") === "true";
  const { toast } = useToast();

  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({ totalRooms: 0, flaggedRooms: 0, activeRooms: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchChatRooms = async () => {
    setIsLoading(true);
    try {
      const url = `/api/admin/chat/rooms${flagged ? "?flagged=true" : ""}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to load chat rooms",
        });
        return;
      }

      setRooms(data.rooms || []);
      setStats(data.stats || { totalRooms: 0, flaggedRooms: 0, activeRooms: 0 });
    } catch (error) {
      console.error("Error loading chat rooms:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [flagged]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chat Oversight</h1>
        <p className="text-muted-foreground mt-1">
          Oversight and support for all customer-vendor conversations
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
            <p className="text-sm">Loading chat rooms...</p>
          </div>
        </div>
      ) : (
        <AdminChatViewer
          rooms={rooms}
          stats={stats}
          showFlagged={flagged}
        />
      )}
    </div>
  );
}
