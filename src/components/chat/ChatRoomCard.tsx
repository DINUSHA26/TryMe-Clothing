'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChatRoom } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';

interface ChatRoomCardProps {
  room: ChatRoom;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Chat Room Card Component
 * Displays individual chat room in the list
 */
export function ChatRoomCard({ room, isSelected, onClick }: ChatRoomCardProps) {
  const { user } = useAuthStore();
  const productName = room.orderItem.productSnapshot?.name || 'Product';
  const variantName = room.orderItem.variantSnapshot?.name;
  
  // Resolve participant name: if user is vendor, show customer name; if user is customer, show vendor name
  const isVendor = user?.role === 'VENDOR';
  const participantName = isVendor 
    ? `${room.customer?.firstName || ''} ${room.customer?.lastName || ''}`.trim() || 'Customer'
    : room.vendor.businessName || 'Vendor';
    
  const participantInitial = (participantName?.charAt(0) || 'U').toUpperCase();

  // Format last message time
  const lastMessageTime = room.lastMessage
    ? formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: true })
    : formatDistanceToNow(new Date(room.createdAt), { addSuffix: true });

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full min-w-0 p-3 rounded-lg text-left transition-colors',
        'hover:bg-muted/50',
        isSelected && 'bg-muted'
      )}
    >
      <div className="flex gap-3 min-w-0 w-full">
        {/* Avatar */}
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarFallback>{participantInitial}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and time */}
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h3 className="font-medium text-sm truncate">{participantName}</h3>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {lastMessageTime}
            </span>
          </div>

          {/* Product info */}
          <p className="text-xs text-muted-foreground truncate mb-1">
            Order #{room.orderItem.order.orderNumber} · {productName}
            {variantName && ` - ${variantName}`}
          </p>

          {/* Last message */}
          {room.lastMessage && (
            <p className="text-sm text-muted-foreground truncate">
              {room.lastMessage.content}
            </p>
          )}

          {/* Unread badge */}
          {room.unreadCount > 0 && (
            <Badge variant="default" className="mt-2">
              {room.unreadCount} unread
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
