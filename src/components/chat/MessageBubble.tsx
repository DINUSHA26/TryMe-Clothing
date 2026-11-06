'use client';

import { cn } from '@/lib/utils';
import { ChatMessage, ChatRoom } from '@/stores/chatStore';
import { format } from 'date-fns';
import { ChatUserAvatar } from './ChatUserAvatar';
import { ShieldCheck, Store, User as UserIcon, Package, AlertTriangle, Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn?: boolean;
  room?: ChatRoom;
}

/**
 * Modern Message Bubble Component
 * Real avatars for Customer, Vendor/Ads Seller, and Admin with TryMe branding
 */
export function MessageBubble({ message, isOwn = false, room }: MessageBubbleProps) {
  const isTempMessage = !!message.tempId && message.id.startsWith('temp_');
  const senderRole = message.sender?.role || 'CUSTOMER';
  const isAdmin = senderRole === 'ADMIN';
  const isVendor = senderRole === 'VENDOR' || senderRole === 'ADS_SELLER';

  // Resolve display name and avatar
  let displayName = '';
  let avatarImageSrc: string | null = null;
  let roleLabel = '';

  if (isOwn) {
    displayName = 'You';
    avatarImageSrc = message.sender?.avatar || null;
  } else if (isAdmin) {
    displayName = 'TryMe Official Support';
    avatarImageSrc = message.sender?.avatar || '/icon.png';
    roleLabel = 'TryMe Admin';
  } else if (isVendor) {
    displayName =
      message.sender?.vendor?.businessName ||
      room?.vendor?.businessName ||
      `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim() ||
      'Store Vendor';
    avatarImageSrc =
      message.sender?.avatar ||
      message.sender?.vendor?.logo ||
      room?.vendor?.logo ||
      room?.vendor?.user?.avatar ||
      null;
    roleLabel = 'Store Owner';
  } else {
    displayName =
      `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim() ||
      `${room?.customer?.firstName || ''} ${room?.customer?.lastName || ''}`.trim() ||
      'Customer';
    avatarImageSrc = message.sender?.avatar || room?.customer?.avatar || null;
    roleLabel = 'Customer';
  }

  // Format message timestamp
  let formattedTime = '';
  try {
    formattedTime = format(new Date(message.createdAt), 'p');
  } catch (e) {
    formattedTime = '';
  }

  // Check if message is an automated Order Inquiry header
  const isOrderInquiry = message.content.startsWith('Inquiry regarding Order #');

  return (
    <div className={cn('flex flex-col gap-1 mb-3.5', isOwn ? 'items-end' : 'items-start')}>
      <div className={cn('flex items-end gap-2.5 max-w-[88%] sm:max-w-[78%]', isOwn && 'flex-row-reverse')}>
        {/* Avatar - for other participants */}
        {!isOwn && (
          <div className="flex-shrink-0 self-end mb-1">
            <ChatUserAvatar
              role={senderRole}
              name={displayName}
              imageSrc={avatarImageSrc}
              size="sm"
              showRoleBadge={false}
            />
          </div>
        )}

        {/* Message container */}
        <div className="flex flex-col gap-1 min-w-0">
          {/* Sender role and name label for other participants */}
          {!isOwn && (
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-[11px] font-bold text-foreground truncate max-w-[200px]">
                {displayName}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-semibold tracking-wide',
                  isAdmin
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                    : isVendor
                    ? 'bg-orange-100 dark:bg-orange-950/60 text-[#ea580c] dark:text-orange-300'
                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                )}
              >
                {isAdmin ? (
                  <ShieldCheck className="w-2.5 h-2.5" />
                ) : isVendor ? (
                  <Store className="w-2.5 h-2.5" />
                ) : (
                  <UserIcon className="w-2.5 h-2.5" />
                )}
                {roleLabel}
              </span>
            </div>
          )}

          {/* Bubble */}
          <div
            className={cn(
              'relative rounded-2xl px-4 py-2.5 shadow-xs transition-all duration-150',
              isOwn
                ? 'bg-gradient-to-r from-[#FF6600] to-[#ea580c] text-white rounded-tr-xs shadow-orange-500/10'
                : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-foreground rounded-tl-xs',
              isTempMessage && 'opacity-70 scale-[0.99]'
            )}
          >
            {/* Rich Order Inquiry Card rendering */}
            {isOrderInquiry ? (
              <div className="space-y-1.5 py-0.5">
                <div className={cn(
                  'flex items-center gap-1.5 font-bold text-xs pb-1 border-b',
                  isOwn ? 'border-white/20 text-white' : 'border-border/60 text-[#ea580c] dark:text-orange-400'
                )}>
                  <Package className="w-3.5 h-3.5" />
                  <span>Order Inquiry</span>
                </div>
                <p className={cn('text-xs leading-relaxed whitespace-pre-wrap', isOwn ? 'text-white/95' : 'text-foreground/90')}>
                  {message.content}
                </p>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed select-text font-normal">
                {message.content}
              </p>
            )}

            {/* Blocked content / Filtered notice */}
            {message.hasBlockedContent && (
              <div className={cn(
                'mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold border',
                isOwn
                  ? 'bg-black/20 text-white/90 border-white/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
              )}>
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>Contact info was automatically hidden for safety</span>
              </div>
            )}

            {/* In-bubble timestamp and read receipts */}
            <div
              className={cn(
                'flex items-center justify-end gap-1 mt-1 text-[10px] font-medium select-none',
                isOwn ? 'text-white/80' : 'text-muted-foreground'
              )}
            >
              <span>{formattedTime}</span>

              {/* Status ticks for own messages */}
              {isOwn && (
                <span className="inline-flex items-center ml-0.5">
                  {isTempMessage ? (
                    <span className="animate-pulse tracking-tighter">···</span>
                  ) : message.isRead ? (
                    <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-white/80" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
