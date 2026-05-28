'use client';

import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/stores/chatStore';
import { ChatRoomCard } from './ChatRoomCard';
import { Loader2 } from 'lucide-react';

/**
 * Chat Room List Component
 * Displays list of user's chat rooms
 */
export function ChatRoomList() {
  const { rooms, isLoadingRooms, selectedRoomId, loadRooms, selectRoom } = useChatStore();

  // Load rooms on mount
  useEffect(() => {
    if (rooms.length === 0 && !isLoadingRooms) {
      loadRooms();
    }
  }, []);

  if (isLoadingRooms) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground mb-2">No active chats</p>
        <p className="text-sm text-muted-foreground">
          Chat will be available after login & make order
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Messages</h2>
        <p className="text-sm text-muted-foreground">{rooms.length} conversation(s)</p>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="p-2 w-full">
          {rooms.map((room) => (
            <ChatRoomCard
              key={room.id}
              room={room}
              isSelected={selectedRoomId === room.id}
              onClick={() => selectRoom(room.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
