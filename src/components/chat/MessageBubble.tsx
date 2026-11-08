'use client';

import { cn } from '@/lib/utils';
import { ChatMessage, ChatRoom } from '@/stores/chatStore';
import { format } from 'date-fns';
import { ChatUserAvatar } from './ChatUserAvatar';
import {
  ShieldCheck,
  Store,
  User as UserIcon,
  Package,
  AlertTriangle,
  Check,
  CheckCheck,
  FileText,
  FileSpreadsheet,
  File,
  Download,
  ExternalLink,
  Eye,
} from 'lucide-react';

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

  // Check if message is a rich attachment (Image, PDF, Excel, Document)
  let attachment: {
    type: string;
    fileType: 'image' | 'pdf' | 'excel' | 'file';
    url: string;
    name: string;
    size?: number;
    caption?: string;
  } | null = null;

  if (message.content.startsWith('{"type":"attachment"')) {
    try {
      const parsed = JSON.parse(message.content);
      if (parsed.type === 'attachment' && parsed.url) {
        attachment = parsed;
      }
    } catch {}
  }

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
            {/* Rich Attachment or Order Inquiry or Text */}
            {attachment ? (
              <div className="space-y-2 py-0.5 max-w-[280px] sm:max-w-[340px]">
                {/* 1. Image Attachment */}
                {attachment.fileType === 'image' && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10 group cursor-pointer bg-black/5"
                  >
                    <img
                      src={attachment.url}
                      alt={attachment.name || 'Shared image'}
                      className="w-full max-h-[260px] object-cover transition-transform group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[1px]">
                      <Eye className="w-4 h-4" />
                      <span>View Full Image</span>
                    </div>
                  </a>
                )}

                {/* 2. PDF Attachment */}
                {attachment.fileType === 'pdf' && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left group',
                      isOwn
                        ? 'bg-white/15 hover:bg-white/25 border-white/25 text-white'
                        : 'bg-muted/60 hover:bg-muted border-border text-foreground'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate group-hover:underline">
                        {attachment.name || 'Document.pdf'}
                      </p>
                      <p className={cn('text-[10px] mt-0.5', isOwn ? 'text-white/75' : 'text-muted-foreground')}>
                        {attachment.size
                          ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB · PDF`
                          : 'PDF Document'}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'p-1.5 rounded-lg shrink-0',
                        isOwn ? 'bg-white/20 text-white' : 'bg-background border text-foreground'
                      )}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </a>
                )}

                {/* 3. Excel Spreadsheet Attachment */}
                {attachment.fileType === 'excel' && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.name}
                    className={cn(
                      'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left group',
                      isOwn
                        ? 'bg-white/15 hover:bg-white/25 border-white/25 text-white'
                        : 'bg-muted/60 hover:bg-muted border-border text-foreground'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate group-hover:underline">
                        {attachment.name || 'Spreadsheet.xlsx'}
                      </p>
                      <p className={cn('text-[10px] mt-0.5', isOwn ? 'text-white/75' : 'text-muted-foreground')}>
                        {attachment.size
                          ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB · Excel`
                          : 'Excel Spreadsheet'}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'p-1.5 rounded-lg shrink-0',
                        isOwn ? 'bg-white/20 text-white' : 'bg-background border text-foreground'
                      )}
                    >
                      <Download className="w-4 h-4" />
                    </div>
                  </a>
                )}

                {/* 4. Other File Attachment */}
                {attachment.fileType === 'file' && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.name}
                    className={cn(
                      'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left group',
                      isOwn
                        ? 'bg-white/15 hover:bg-white/25 border-white/25 text-white'
                        : 'bg-muted/60 hover:bg-muted border-border text-foreground'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                      <File className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate group-hover:underline">
                        {attachment.name || 'Attachment'}
                      </p>
                      <p className={cn('text-[10px] mt-0.5', isOwn ? 'text-white/75' : 'text-muted-foreground')}>
                        {attachment.size
                          ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB · File`
                          : 'Attached File'}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'p-1.5 rounded-lg shrink-0',
                        isOwn ? 'bg-white/20 text-white' : 'bg-background border text-foreground'
                      )}
                    >
                      <Download className="w-4 h-4" />
                    </div>
                  </a>
                )}

                {/* Optional Caption */}
                {attachment.caption && (
                  <p
                    className={cn(
                      'text-sm whitespace-pre-wrap break-words leading-relaxed select-text font-normal pt-0.5',
                      isOwn ? 'text-white' : 'text-foreground'
                    )}
                  >
                    {attachment.caption}
                  </p>
                )}
              </div>
            ) : isOrderInquiry ? (
              <div className="space-y-1.5 py-0.5">
                <div
                  className={cn(
                    'flex items-center gap-1.5 font-bold text-xs pb-1 border-b',
                    isOwn
                      ? 'border-white/20 text-white'
                      : 'border-border/60 text-[#ea580c] dark:text-orange-400'
                  )}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Order Inquiry</span>
                </div>
                <p
                  className={cn(
                    'text-xs leading-relaxed whitespace-pre-wrap',
                    isOwn ? 'text-white/95' : 'text-foreground/90'
                  )}
                >
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
                    <span className="animate-pulse tracking-tighter text-white/70 font-bold">···</span>
                  ) : message.isRead ? (
                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] dark:text-[#53bdeb] stroke-[2.4] drop-shadow-xs" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-white/75 dark:text-white/70 stroke-[2]" />
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
