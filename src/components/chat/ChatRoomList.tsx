'use client';

import { useEffect, useState, useMemo } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { ChatRoomCard } from './ChatRoomCard';
import { Loader2, MessageSquare, Search, Sparkles, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Modern Chat Room List Component
 * Featuring instant search filter, unread counters, and TryMe styled UI
 */
export function ChatRoomList() {
  const { rooms, isLoadingRooms, selectedRoomId, loadRooms, selectRoom } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  // Load rooms on mount
  useEffect(() => {
    if (rooms.length === 0 && !isLoadingRooms) {
      loadRooms();
    }
  }, []);

  const totalUnreadCount = useMemo(() => {
    return rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);
  }, [rooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Filter by unread
      if (filterMode === 'unread' && (!room.unreadCount || room.unreadCount === 0)) {
        return false;
      }

      // Filter by search query
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const customerName = `${room.customer?.firstName || ''} ${room.customer?.lastName || ''}`.toLowerCase();
      const vendorName = (room.vendor?.businessName || '').toLowerCase();
      const orderNumber = (room.orderItem?.order?.orderNumber || '').toLowerCase();
      const productName = (room.orderItem?.productSnapshot?.name || '').toLowerCase();
      const lastMessage = (room.lastMessage?.content || '').toLowerCase();

      return (
        customerName.includes(q) ||
        vendorName.includes(q) ||
        orderNumber.includes(q) ||
        productName.includes(q) ||
        lastMessage.includes(q)
      );
    });
  }, [rooms, searchQuery, filterMode]);

  if (isLoadingRooms && rooms.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-orange-200 border-t-[#FF6600] animate-spin" />
        </div>
        <p className="text-xs text-muted-foreground font-medium">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-card/60 select-none">
      {/* Header */}
      <div className="p-3.5 pb-2 border-b space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-foreground tracking-tight">Messages</h2>
            {totalUnreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#FF6600] text-white text-[10px] font-bold shadow-xs">
                {totalUnreadCount} new
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {rooms.length} {rooms.length === 1 ? 'chat' : 'chats'}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, sellers..."
            className="pl-8 h-8 text-xs bg-muted/40 border-muted focus-visible:ring-1 focus-visible:ring-[#FF6600]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            onClick={() => setFilterMode('all')}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
              filterMode === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-muted-foreground hover:bg-muted/60'
            )}
          >
            All chats ({rooms.length})
          </button>
          <button
            onClick={() => setFilterMode('unread')}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1',
              filterMode === 'unread'
                ? 'bg-[#FF6600] text-white'
                : 'text-muted-foreground hover:bg-muted/60'
            )}
          >
            Unread
            {totalUnreadCount > 0 && (
              <span className={cn(
                'ml-0.5 px-1 rounded-full text-[9px]',
                filterMode === 'unread' ? 'bg-white/30 text-white' : 'bg-[#FF6600] text-white'
              )}>
                {totalUnreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full divide-y divide-border/20">
        {filteredRooms.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-[#FF6600] flex items-center justify-center mb-3 shadow-xs">
              <MessageSquare className="w-6 h-6 stroke-[1.8]" />
            </div>
            {searchQuery ? (
              <>
                <p className="font-semibold text-sm text-foreground mb-1">No matching chats</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Couldn't find anything for "{searchQuery}". Try a different keyword or order number.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-[#FF6600]"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </Button>
              </>
            ) : filterMode === 'unread' ? (
              <>
                <p className="font-semibold text-sm text-foreground mb-1">All caught up!</p>
                <p className="text-xs text-muted-foreground">You have no unread messages right now.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-[#FF6600]"
                  onClick={() => setFilterMode('all')}
                >
                  View all chats
                </Button>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm text-foreground mb-1">No active conversations</p>
                <p className="text-xs text-muted-foreground max-w-[220px]">
                  When you make or receive an order, you can chat with customers or vendors here directly.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1 w-full">
            {filteredRooms.map((room) => (
              <ChatRoomCard
                key={room.id}
                room={room}
                isSelected={selectedRoomId === room.id}
                onClick={() => selectRoom(room.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
