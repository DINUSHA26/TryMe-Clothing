'use client';

import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Loader2 } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';

interface ChatWindowProps {
  roomId: string;
}

/**
 * Chat Window Component
 * Main chat area with header, messages, and input
 */
export function ChatWindow({ roomId }: ChatWindowProps) {
  const room = useChatStore((state) => state.rooms.find((r) => r.id === roomId));
  const isLoadingRooms = useChatStore((state) => state.isLoadingRooms);

  if (!room) {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-2">
        {isLoadingRooms ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading chat rooms...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Connecting to chat room...</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <ChatHeader room={room} />

      {/* Messages */}
      <MessageList roomId={roomId} />

      {/* Input */}
      <MessageInput roomId={roomId} />
    </div>
  );
}
