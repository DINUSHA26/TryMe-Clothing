'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { MessageBubble } from './MessageBubble';
import { MessageSquare, Sparkles } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface MessageListProps {
  roomId: string;
}

/**
 * Modern Message List Component
 * Featuring auto-scroll, date dividers, typing animation, and polished TryMe styling
 */
export function MessageList({ roomId }: MessageListProps) {
  const { messages, isLoadingMessages, isTyping, rooms, sendMessage, loadMessages, markAsRead, sendHeartbeat } = useChatStore();
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const roomMessages = messages[roomId] || [];
  const room = rooms.find((r) => r.id === roomId);
  const isLoading = isLoadingMessages[roomId];
  const isTypingInRoom = isTyping[roomId];

  // Active sync loop: poll messages and heartbeat while in this chat room
  useEffect(() => {
    // Initial fetch
    loadMessages(roomId, 0, false);
    sendHeartbeat();

    // Poll messages every 3.5s so double ticks and incoming messages update in real-time
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadMessages(roomId, 0, true);
    }, 3500);

    // Heartbeat every 25s to keep active user's presence online
    const heartbeatInterval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        sendHeartbeat();
      }
    }, 25000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
    };
  }, [roomId, loadMessages, sendHeartbeat]);

  // Automatically mark incoming messages as read when viewed
  const hasUnreadIncoming = useMemo(() => {
    return roomMessages.some(
      (m) => m.senderId !== user?.id && !m.isRead && !m.id.startsWith('temp_')
    );
  }, [roomMessages, user?.id]);

  useEffect(() => {
    if (hasUnreadIncoming) {
      markAsRead(roomId);
    }
  }, [roomId, hasUnreadIncoming, markAsRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [roomMessages.length, isTypingInRoom]);

  // Group messages by date
  const messagesWithDateDividers = useMemo(() => {
    const items: Array<{ type: 'date'; label: string; key: string } | { type: 'message'; message: any }> = [];
    let lastDateStr = '';

    roomMessages.forEach((msg) => {
      try {
        const msgDate = new Date(msg.createdAt);
        let dateLabel = '';

        if (isToday(msgDate)) {
          dateLabel = 'Today';
        } else if (isYesterday(msgDate)) {
          dateLabel = 'Yesterday';
        } else {
          dateLabel = format(msgDate, 'MMMM d, yyyy');
        }

        if (dateLabel !== lastDateStr) {
          items.push({ type: 'date', label: dateLabel, key: `date-${dateLabel}-${msg.id}` });
          lastDateStr = dateLabel;
        }
      } catch (e) {
        // Ignore date parsing errors
      }

      items.push({ type: 'message', message: msg });
    });

    return items;
  }, [roomMessages]);

  if (isLoading && roomMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6">
        <div className="w-8 h-8 rounded-full border-2 border-orange-200 border-t-[#FF6600] animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">Loading chat history...</p>
      </div>
    );
  }

  if (roomMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-[#FF6600] flex items-center justify-center mb-3 shadow-xs">
          <MessageSquare className="w-7 h-7 stroke-[1.8]" />
        </div>
        <h3 className="font-bold text-base text-foreground mb-1">Start the Conversation</h3>
        <p className="text-xs text-muted-foreground max-w-[280px] mb-4">
          Chat directly regarding Order #{room?.orderItem?.order?.orderNumber || ''}. Questions about size, delivery, or custom requests can be sent below.
        </p>
        
        {/* Quick starter chips */}
        <div className="flex flex-wrap gap-1.5 justify-center max-w-[340px]">
          {['Hi! When will my order be dispatched?', 'Is this item ready for shipping?', 'Can I change my delivery address?'].map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(roomId, prompt)}
              className="text-[11px] px-2.5 py-1.5 rounded-full border bg-muted/40 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/30 text-foreground transition-all active:scale-95 text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 sm:px-5 w-full bg-slate-50/40 dark:bg-slate-950/20">
      <div className="py-4 space-y-1">
        {messagesWithDateDividers.map((item) => {
          if (item.type === 'date') {
            return (
              <div key={item.key} className="flex items-center justify-center my-3 select-none">
                <span className="px-3 py-0.5 rounded-full bg-muted/80 border text-[10px] font-semibold text-muted-foreground shadow-2xs">
                  {item.label}
                </span>
              </div>
            );
          }

          const message = item.message;
          return (
            <MessageBubble
              key={message.id || message.tempId}
              message={message}
              isOwn={message.senderId === user?.id}
              room={room}
            />
          );
        })}

        {/* Typing indicator */}
        {isTypingInRoom && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2 py-1 select-none">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border rounded-full px-2.5 py-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6600] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6600] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6600] animate-bounce" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">Typing a message...</span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={scrollRef} className="h-1" />
      </div>
    </div>
  );
}
