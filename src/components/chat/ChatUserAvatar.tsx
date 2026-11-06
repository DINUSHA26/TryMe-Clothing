'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ShieldCheck, Store, User as UserIcon, Sparkles } from 'lucide-react';

interface ChatUserAvatarProps {
  role?: string;
  name?: string;
  imageSrc?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showOnline?: boolean;
  isOnline?: boolean;
  showRoleBadge?: boolean;
  className?: string;
}

const sizeConfig = {
  xs: {
    container: 'h-6 w-6 text-[10px]',
    badge: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5',
    badgeIcon: 'h-1.5 w-1.5',
    online: 'h-1.5 w-1.5 -bottom-0.5 -right-0.5',
  },
  sm: {
    container: 'h-8 w-8 text-xs',
    badge: 'h-3.5 w-3.5 -bottom-0.5 -right-0.5',
    badgeIcon: 'h-2 w-2',
    online: 'h-2 w-2 -bottom-0.5 -right-0.5',
  },
  md: {
    container: 'h-10 w-10 text-sm',
    badge: 'h-4 w-4 -bottom-1 -right-1',
    badgeIcon: 'h-2.5 w-2.5',
    online: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5',
  },
  lg: {
    container: 'h-12 w-12 text-base',
    badge: 'h-4.5 w-4.5 -bottom-1 -right-1',
    badgeIcon: 'h-3 w-3',
    online: 'h-3 w-3 -bottom-0.5 -right-0.5',
  },
  xl: {
    container: 'h-14 w-14 text-lg',
    badge: 'h-5 w-5 -bottom-1 -right-1',
    badgeIcon: 'h-3.5 w-3.5',
    online: 'h-3.5 w-3.5 bottom-0 right-0',
  },
};

export function ChatUserAvatar({
  role = 'CUSTOMER',
  name = 'User',
  imageSrc,
  size = 'md',
  showOnline = false,
  isOnline = false,
  showRoleBadge = false,
  className,
}: ChatUserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const cfg = sizeConfig[size] || sizeConfig.md;
  const initial = (name?.trim()?.charAt(0) || (role === 'ADMIN' ? 'A' : 'U')).toUpperCase();

  const isAdmin = role === 'ADMIN';
  const isVendor = role === 'VENDOR' || role === 'ADS_SELLER';

  // For Admin with no custom image, use official TryMe logo icon
  const effectiveImage = isAdmin && !imageSrc ? '/icon.png' : imageSrc;
  const canRenderImage = !hasError && !!effectiveImage;

  // Background styling when showing initials or fallback
  const fallbackBg = isAdmin
    ? 'bg-gradient-to-tr from-[#FF6600] to-amber-500 text-white shadow-sm ring-1 ring-orange-500/30'
    : isVendor
    ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-[#FF6600] text-white shadow-sm ring-1 ring-orange-400/20'
    : 'bg-gradient-to-tr from-sky-500 via-indigo-500 to-violet-600 text-white shadow-sm';

  return (
    <div className={cn('relative inline-flex flex-shrink-0 select-none', cfg.container, className)}>
      <div
        className={cn(
          'relative w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold tracking-tight border border-border/40 shadow-sm transition-transform',
          canRenderImage ? 'bg-muted/40' : fallbackBg
        )}
      >
        {canRenderImage ? (
          <img
            src={effectiveImage}
            alt={name}
            className="w-full h-full object-cover rounded-full"
            onError={() => setHasError(true)}
            loading="lazy"
          />
        ) : isAdmin ? (
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-tr from-[#FF6600] to-amber-500 text-white">
            <ShieldCheck className="w-1/2 h-1/2 stroke-[2.5]" />
          </div>
        ) : (
          <span className="leading-none drop-shadow-xs">{initial}</span>
        )}
      </div>

      {/* Online indicator */}
      {showOnline && (
        <span
          className={cn(
            'absolute rounded-full ring-2 ring-background z-10 transition-colors',
            cfg.online,
            isOnline
              ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
              : 'bg-slate-300 dark:bg-slate-600'
          )}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}

      {/* Role mini badge */}
      {showRoleBadge && !showOnline && (
        <span
          className={cn(
            'absolute rounded-full flex items-center justify-center ring-2 ring-background z-10 shadow-xs',
            cfg.badge,
            isAdmin
              ? 'bg-[#FF6600] text-white'
              : isVendor
              ? 'bg-amber-500 text-white'
              : 'bg-indigo-600 text-white'
          )}
          title={isAdmin ? 'TryMe Official Admin' : isVendor ? 'Verified Seller' : 'Customer'}
        >
          {isAdmin ? (
            <ShieldCheck className={cfg.badgeIcon} />
          ) : isVendor ? (
            <Store className={cfg.badgeIcon} />
          ) : (
            <UserIcon className={cfg.badgeIcon} />
          )}
        </span>
      )}
    </div>
  );
}
