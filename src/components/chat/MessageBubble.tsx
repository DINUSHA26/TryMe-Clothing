'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChatMessage, ChatRoom } from '@/stores/chatStore';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn?: boolean; // Is this message from the current user?
  room?: ChatRoom;
}

/**
 * Message Bubble Component
 * Displays an individual chat message
 */
export function MessageBubble({ message, isOwn = false, room }: MessageBubbleProps) {
  const isTempMessage = !!message.tempId && message.id.startsWith('temp_');

  // Resolve display name and initial
  let displayName = '';
  let senderInitial = 'U';

  if (isOwn) {
    displayName = 'You';
    senderInitial = (message.sender?.firstName?.charAt(0) || 'Y').toUpperCase();
  } else if (room) {
    // If not own message, check if we're a vendor or customer viewing the room
    const senderRole = message.sender?.role;

    if (senderRole === 'ADMIN') {
      displayName = 'System Admin';
      senderInitial = 'A';
    } else if (senderRole === 'VENDOR') {
      displayName = room.vendor.businessName;
      senderInitial = (displayName?.charAt(0) || 'V').toUpperCase();
    } else {
      displayName = `${room.customer?.firstName || ''} ${room.customer?.lastName || ''}`.trim() || 'Customer';
      senderInitial = (room.customer?.firstName?.charAt(0) || 'C').toUpperCase();
    }
  } else {
    displayName = `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim() || 'Unknown User';
    senderInitial = (message.sender?.firstName?.charAt(0) || 'U').toUpperCase();
  }

  return (
    <div className={cn('flex flex-col gap-1 mb-4', isOwn ? 'items-end' : 'items-start')}>
      <div className={cn('flex items-end gap-2 max-w-[85%]', isOwn && 'flex-row-reverse')}>
        {/* Avatar - Only for others */}
        {!isOwn && (
          <Avatar className="h-8 w-8 flex-shrink-0 border shadow-sm">
            <AvatarFallback className="bg-muted text-[10px]">
              {senderInitial}
            </AvatarFallback>
          </Avatar>
        )}
        
        {/* Message content */}
        <div className="flex flex-col gap-0.5">
          {/* Sender name - Only for others in group-like view (not needed here but good for clarity) */}
          {!isOwn && (
            <p className="text-[10px] font-semibold text-primary ml-1 mb-0.5 uppercase tracking-wider">
              {displayName}
            </p>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              'relative rounded-2xl px-4 py-2 shadow-sm transition-all duration-200',
              isOwn
                ? 'bg-primary text-primary-foreground rounded-tr-none'
                : 'bg-card text-card-foreground border rounded-tl-none',
              isTempMessage && 'opacity-60 translate-y-0.5'
            )}
          >
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>

            {/* Blocked content warning */}
            {message.hasBlockedContent && (
              <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-destructive/10 rounded-lg border border-destructive/20">
                <span className="text-[10px] font-bold text-destructive uppercase">Filtered</span>
              </div>
            )}

            {/* In-bubble timestamp and status for 'You' */}
            <div className={cn(
                'flex items-center justify-end gap-1 mt-1 text-[10px]',
                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
                <span>{format(new Date(message.createdAt), 'p')}</span>
                {isOwn && !isTempMessage && (
                    <div className="flex -space-x-1">
                        <svg 
                            className={cn("w-3.5 h-3.5 fill-current", message.isRead ? "text-blue-400" : "text-current")} 
                            viewBox="0 0 24 24"
                        >
                            <path d="M22.3,6.3l-12,12l-5.6-5.6l1.4-1.4l4.2,4.2l10.6-10.6L22.3,6.3z M18.1,6.3l-7.8,7.8L9,12.7l-1.4,1.4l1.7,1.7l10.2-10.2 L18.1,6.3z"/>
                        </svg>
                    </div>
                )}
                {isTempMessage && (
                    <span className="animate-pulse">···</span>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
