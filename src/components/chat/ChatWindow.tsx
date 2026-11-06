'use client';

import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatStore } from '@/stores/chatStore';

interface ChatWindowProps {
  roomId: string;
}

/**
 * Modern Chat Window Component
 * Main chat container featuring header, message list, and input area
 */
export function ChatWindow({ roomId }: ChatWindowProps) {
  const room = useChatStore((state) => state.rooms.find((r) => r.id === roomId));
  const isLoadingRooms = useChatStore((state) => state.isLoadingRooms);

  if (!room) {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-3 p-6 select-none bg-background">
        <div className="w-10 h-10 rounded-full border-2 border-orange-200 border-t-[#FF6600] animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">
          {isLoadingRooms ? 'Loading conversations...' : 'Connecting to chat...'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <ChatHeader room={room} />

      {/* Messages */}
      <MessageList roomId={roomId} />

      {/* Input */}
      <MessageInput roomId={roomId} />
    </div>
  );
}
