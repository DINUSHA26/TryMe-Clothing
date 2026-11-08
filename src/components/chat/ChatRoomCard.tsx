'use client';

import { cn } from '@/lib/utils';
import { ChatRoom } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { ChatUserAvatar } from './ChatUserAvatar';
import { Package, ShieldCheck, Store, User as UserIcon } from 'lucide-react';

interface ChatRoomCardProps {
  room: ChatRoom;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Modern Chat Room Card Component
 * Displays conversation card with real user/vendor avatars & TryMe branding
 */
export function ChatRoomCard({ room, isSelected, onClick }: ChatRoomCardProps) {
  const { user } = useAuthStore();
  const productName = room.orderItem?.productSnapshot?.name || 'Order Item';
  const variantName = room.orderItem?.variantSnapshot?.name;
  
  // Resolve participant info based on active viewer role
  const isVendor = user?.role === 'VENDOR' || user?.role === 'ADS_SELLER';
  const isAdmin = user?.role === 'ADMIN';

  let participantName = '';
  let participantRole = 'CUSTOMER';
  let participantAvatar: string | null = null;

  if (isAdmin) {
    participantName = `${room.vendor?.businessName || 'Vendor'} ↔ ${room.customer?.firstName || 'Customer'}`;
    participantRole = 'ADMIN';
    participantAvatar = room.vendor?.logo || null;
  } else if (isVendor) {
    participantName = `${room.customer?.firstName || ''} ${room.customer?.lastName || ''}`.trim() || 'Customer';
    participantRole = 'CUSTOMER';
    participantAvatar = room.customer?.avatar || null;
  } else {
    participantName = room.vendor?.businessName || 'Store Vendor';
    participantRole = 'VENDOR';
    participantAvatar = room.vendor?.logo || room.vendor?.user?.avatar || null;
  }

  // Format last message time
  let lastMessageTime = '';
  try {
    const rawTime = room.lastMessage?.createdAt || room.createdAt;
    if (rawTime) {
      lastMessageTime = formatDistanceToNow(new Date(rawTime), { addSuffix: false });
    }
  } catch (e) {
    lastMessageTime = 'now';
  }

  // Format last message text / attachment indicator
  let lastMessageSnippet = 'No messages yet';
  if (room.lastMessage?.content) {
    const raw = room.lastMessage.content;
    if (raw.startsWith('{"type":"attachment"')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.fileType === 'image') {
          lastMessageSnippet = parsed.caption ? `📷 ${parsed.caption}` : '📷 Photo';
        } else if (parsed.fileType === 'pdf') {
          lastMessageSnippet = `📄 ${parsed.name || 'PDF Document'}`;
        } else if (parsed.fileType === 'excel') {
          lastMessageSnippet = `📊 ${parsed.name || 'Spreadsheet'}`;
        } else {
          lastMessageSnippet = `📎 ${parsed.name || 'File'}`;
        }
      } catch {
        lastMessageSnippet = '📎 Attachment';
      }
    } else {
      lastMessageSnippet = raw;
    }
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full min-w-0 p-3 rounded-xl text-left transition-all relative border border-transparent',
        'hover:bg-slate-100/80 dark:hover:bg-slate-800/60',
        isSelected
          ? 'bg-orange-50/90 dark:bg-orange-950/25 border-orange-200 dark:border-orange-900/50 shadow-xs'
          : 'bg-transparent'
      )}
    >
      {/* Active Left Indicator Bar */}
      {isSelected && (
        <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-[#FF6600] to-amber-500 rounded-r-full" />
      )}

      <div className="flex gap-3 min-w-0 w-full items-start pl-1">
        {/* Avatar with real profile image */}
        <ChatUserAvatar
          role={participantRole}
          name={participantName}
          imageSrc={participantAvatar}
          size="md"
          showRoleBadge={true}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and time */}
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <h3
              className={cn(
                'font-semibold text-sm truncate',
                isSelected ? 'text-[#ea580c] dark:text-orange-400' : 'text-foreground'
              )}
            >
              {participantName}
            </h3>
            <span className="text-[11px] text-muted-foreground flex-shrink-0 font-medium">
              {lastMessageTime}
            </span>
          </div>

          {/* Order info badge */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/70 text-[10px] font-medium text-foreground/80 flex-shrink-0">
              <Package className="w-2.5 h-2.5 text-[#FF6600]" />
              #{room.orderItem?.order?.orderNumber || 'Order'}
            </span>
            <span className="truncate text-[11px]">
              {productName}
              {variantName ? ` · ${variantName}` : ''}
            </span>
          </div>

          {/* Last message preview */}
          <div className="flex items-center justify-between gap-2 mt-1">
            <p
              className={cn(
                'text-xs truncate flex-1 leading-snug',
                room.unreadCount > 0
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground/85'
              )}
            >
              {lastMessageSnippet}
            </p>

            {/* Unread badge */}
            {room.unreadCount > 0 && (
              <span className="flex-shrink-0 min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-gradient-to-r from-[#FF6600] to-amber-500 text-white text-[10px] font-bold shadow-xs">
                {room.unreadCount > 99 ? '99+' : room.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
