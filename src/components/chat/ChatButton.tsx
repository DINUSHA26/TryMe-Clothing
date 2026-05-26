'use client';

import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatButtonProps {
  className?: string;
}

/**
 * Global Chat Button
 * Displays total unread count and opens the chat dialog
 */
export function ChatButton({ className }: ChatButtonProps) {
  const { openChat, rooms, isConnected } = useChatStore();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  // Calculate total unread messages across all rooms
  const totalUnread = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', className)}
      onClick={() => openChat()}
      aria-label="Open messages"
    >
      <MessageCircle className={cn('h-5 w-5', isConnected ? 'text-foreground' : 'text-muted-foreground')} />
      
      {/* Unread badge */}
      {totalUnread > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {totalUnread > 99 ? '99+' : totalUnread}
        </span>
      )}
      
      {/* Connection status indicator (subtle) */}
      {!isConnected && (
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-destructive border-2 border-background" />
      )}
    </Button>
  );
}
