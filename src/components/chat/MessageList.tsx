'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { MessageBubble } from './MessageBubble';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  roomId: string;
}

/**
 * Message List Component
 * Displays all messages in a chat room with auto-scroll
 */
export function MessageList({ roomId }: MessageListProps) {
  const { messages, isLoadingMessages, isTyping, rooms } = useChatStore();
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const roomMessages = messages[roomId] || [];
  const room = rooms.find((r) => r.id === roomId);
  const isLoading = isLoadingMessages[roomId];
  const isTypingInRoom = isTyping[roomId];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [roomMessages.length]);

  if (isLoading && roomMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (roomMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground mb-2">No messages yet</p>
        <p className="text-sm text-muted-foreground">Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 w-full">
      <div className="py-4 space-y-4">
        {roomMessages.map((message) => (
          <MessageBubble
            key={message.id || message.tempId}
            message={message}
            isOwn={message.senderId === user?.id}
            room={room}
          />
        ))}

        {/* Typing indicator */}
        {isTypingInRoom && (
          <div className="flex gap-2 items-center text-sm text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>Typing...</span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={scrollRef} />
      </div>
    </div>
  );
}
