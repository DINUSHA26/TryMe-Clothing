'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShieldCheck, ShieldAlert, Store, User as UserIcon, Package, X } from 'lucide-react';
import { ChatRoom, useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ChatUserAvatar } from './ChatUserAvatar';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  room: ChatRoom;
}

/**
 * Modern Chat Header Component
 * Displays participant profile image, online indicator, verified badges, and order context
 */
export function ChatHeader({ room }: ChatHeaderProps) {
  const { selectRoom, closeChat, isConnected } = useChatStore();
  const { user } = useAuthStore();
  const isMobile = useMediaQuery('(max-width: 1024px)');

  // Determine viewer role
  const isVendor = user?.role === 'VENDOR' || user?.role === 'ADS_SELLER';
  const isAdmin = user?.role === 'ADMIN';

  // Resolve participant details
  let participantName = '';
  let participantRole = 'CUSTOMER';
  let participantAvatar: string | null = null;
  let roleBadgeLabel = 'Customer';

  if (isAdmin) {
    participantName = `${room.vendor?.businessName || 'Vendor'} ↔ ${room.customer?.firstName || 'Customer'}`;
    participantRole = 'ADMIN';
    participantAvatar = room.vendor?.logo || null;
    roleBadgeLabel = 'Supervised by Admin';
  } else if (isVendor) {
    participantName = `${room.customer?.firstName || ''} ${room.customer?.lastName || ''}`.trim() || 'Customer';
    participantRole = 'CUSTOMER';
    participantAvatar = room.customer?.avatar || null;
    roleBadgeLabel = 'Customer';
  } else {
    participantName = room.vendor?.businessName || 'Store Vendor';
    participantRole = 'VENDOR';
    participantAvatar = room.vendor?.logo || room.vendor?.user?.avatar || null;
    roleBadgeLabel = 'Verified Vendor';
  }

  const productName = room.orderItem?.productSnapshot?.name || 'Order Item';
  const variantName = room.orderItem?.variantSnapshot?.name;
  const orderNumber = room.orderItem?.order?.orderNumber || 'Order';
  const orderStatus = room.orderItem?.order?.status || 'PAYMENT_CONFIRMED';

  // Resolve product thumbnail
  const productSnapshot = room.orderItem?.productSnapshot;
  let productThumbnail: string | null = null;
  if (productSnapshot) {
    if (Array.isArray(productSnapshot.images) && productSnapshot.images.length > 0) {
      const first = productSnapshot.images[0];
      productThumbnail = typeof first === 'string' ? first : first?.url || null;
    } else if (typeof productSnapshot.image === 'string') {
      productThumbnail = productSnapshot.image;
    }
  }

  return (
    <div className="border-b bg-background/95 backdrop-blur-md px-3.5 py-2.5 sm:px-4 sm:py-3 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Participant profile & status */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Back button (mobile only) */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground flex-shrink-0"
              onClick={() => selectRoom('')}
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Participant Real Avatar */}
          <ChatUserAvatar
            role={participantRole}
            name={participantName}
            imageSrc={participantAvatar}
            size="md"
            showOnline={true}
            isOnline={isConnected}
          />

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {participantName}
              </h3>

              {/* Role badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none',
                  isAdmin
                    ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
                    : participantRole === 'VENDOR'
                    ? 'bg-orange-100 dark:bg-orange-950/50 text-[#ea580c] dark:text-orange-300'
                    : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                )}
              >
                {participantRole === 'VENDOR' ? (
                  <Store className="w-2.5 h-2.5" />
                ) : isAdmin ? (
                  <ShieldCheck className="w-2.5 h-2.5" />
                ) : (
                  <UserIcon className="w-2.5 h-2.5" />
                )}
                {roleBadgeLabel}
              </span>

              {/* Online status */}
              {isConnected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              )}
            </div>

            {/* Context order line */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                <Package className="w-3 h-3 text-[#FF6600]" />
                #{orderNumber}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="truncate max-w-[200px] sm:max-w-[320px]">
                {productName}
                {variantName && ` (${variantName})`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Order thumbnail & close dialog button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {productThumbnail && (
            <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg border bg-muted/30">
              <img
                src={productThumbnail}
                alt={productName}
                className="w-7 h-7 rounded-md object-cover border border-border/50"
              />
              <div className="text-right text-[10px]">
                <p className="font-semibold text-foreground max-w-[100px] truncate">{productName}</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium">Ready to ship</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
            onClick={closeChat}
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Security Banner Pill */}
      <div className="mt-2 flex items-center justify-between bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 rounded-md px-2.5 py-1 text-[11px] text-amber-800 dark:text-amber-300">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span>
            TryMe Buyer & Seller Protection active · Contact numbers & email addresses are masked.
          </span>
        </div>
      </div>
    </div>
  );
}
