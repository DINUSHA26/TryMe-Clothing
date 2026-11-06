'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useChatStore } from '@/stores/chatStore';
import { ChatRoomList } from './ChatRoomList';
import { ChatWindow } from './ChatWindow';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Modern Chat Dialog Component
 * Root component for TryMe real-time messaging system
 */
export function ChatDialog() {
  const { isOpen, selectedRoomId, closeChat } = useChatStore();
  const isMobile = useMediaQuery('(max-width: 1024px)');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeChat()}>
      <DialogContent className="w-[96vw] sm:w-[92vw] max-w-5xl h-[86vh] p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl rounded-2xl sm:rounded-3xl bg-background">
        <DialogTitle className="sr-only">TryMe Messaging</DialogTitle>
        <DialogDescription className="sr-only">
          Real-time messaging between customers, store vendors, and TryMe staff.
        </DialogDescription>

        {/* Top subtle brand accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF6600] via-amber-500 to-[#ea580c] flex-shrink-0" />

        <div className="flex w-full h-[calc(100%-4px)] overflow-hidden">
          {/* Mobile: Toggle between room list and chat window */}
          {isMobile ? (
            selectedRoomId ? (
              <ChatWindow roomId={selectedRoomId} />
            ) : (
              <ChatRoomList />
            )
          ) : (
            // Desktop: Side-by-side layout
            <>
              {/* Sidebar: Conversation list */}
              <div className="w-80 md:w-88 border-r flex-shrink-0 bg-card/40">
                <ChatRoomList />
              </div>

              {/* Main: Active chat window */}
              <div className="flex-1 min-w-0 bg-background flex flex-col">
                {selectedRoomId ? (
                  <ChatWindow roomId={selectedRoomId} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none bg-slate-50/30 dark:bg-slate-950/20">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-100 to-amber-100 dark:from-orange-950/40 dark:to-amber-950/30 text-[#FF6600] flex items-center justify-center mb-4 shadow-sm border border-orange-200/50 dark:border-orange-800/40">
                      <MessageSquare className="w-8 h-8 stroke-[1.8]" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-1.5">
                      Your TryMe Messages
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed mb-4">
                      Select any order inquiry from the sidebar to view messages, track shipments, or chat with vendors directly.
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-[11px] font-medium text-muted-foreground border">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#FF6600]" />
                      Protected by TryMe SafePay & Dispute Resolution
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
