'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useChatStore } from '@/stores/chatStore';
import { ChatRoomList } from './ChatRoomList';
import { ChatWindow } from './ChatWindow';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * Main Chat Dialog Component
 * Root component for the chat system
 */
export function ChatDialog() {
  const { isOpen, selectedRoomId, closeChat } =
    useChatStore();
  const isMobile = useMediaQuery('(max-width: 1024px)');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeChat()}>
      <DialogContent className="w-[95vw] sm:w-full max-w-5xl h-[80vh] p-0 gap-0">
        <DialogTitle className="sr-only">Messaging</DialogTitle>
        <DialogDescription className="sr-only">
          Real-time chat between customers and vendors regarding orders.
        </DialogDescription>
        <div className="flex w-full h-full overflow-hidden">
          {/* Mobile: Show room list OR chat window */}
          {isMobile ? (
            selectedRoomId ? (
              <ChatWindow roomId={selectedRoomId} />
            ) : (
              <ChatRoomList />
            )
          ) : (
            // Desktop: Side-by-side layout
            <>
              {/* Sidebar: Room list */}
              <div className="w-80 border-r flex-shrink-0">
                <ChatRoomList />
              </div>

              {/* Main: Chat window */}
              <div className="flex-1 min-w-0">
                {selectedRoomId ? (
                  <ChatWindow roomId={selectedRoomId} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Select a conversation to start chatting</p>
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
