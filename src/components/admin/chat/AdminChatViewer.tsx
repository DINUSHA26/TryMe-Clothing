'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { MessageSquare, AlertTriangle, Users, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminChatRoom } from './AdminChatRoom';

interface ChatRoomSummary {
  id: string;
  orderItemId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  hasBlockedContent: boolean;
  lastMessage: {
    id: string;
    content: string;
    hasBlockedContent: boolean;
    createdAt: string;
  } | null;
  customer: { firstName: string; lastName: string; email: string };
  vendor: { businessName: string; email: string };
  order: { orderNumber: string; status: string; createdAt: string };
  product: { name: string; variant: any };
}

interface Stats {
  totalRooms: number;
  flaggedRooms: number;
  activeRooms: number;
}

interface AdminChatViewerProps {
  rooms: ChatRoomSummary[];
  stats: Stats;
  showFlagged: boolean;
}

export function AdminChatViewer({ rooms, stats, showFlagged }: AdminChatViewerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  function toggleFilter() {
    router.push(showFlagged ? pathname : `${pathname}?flagged=true`);
  }

  function toggleRoom(id: string) {
    setExpandedRoomId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500 shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">Total Rooms</p>
            <p className="text-2xl font-bold">{stats.totalRooms}</p>
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-green-500 shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">Active Rooms</p>
            <p className="text-2xl font-bold">{stats.activeRooms}</p>
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">Flagged Rooms</p>
            <p className="text-2xl font-bold">{stats.flaggedRooms}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Button
          variant={showFlagged ? 'default' : 'outline'}
          size="sm"
          onClick={toggleFilter}
          className="gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          {showFlagged ? 'Showing Flagged Only' : 'Show Flagged Only'}
        </Button>
        {showFlagged && (
          <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
            Clear filter
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {rooms.length} room{rooms.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Room List */}
      {rooms.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No chat rooms found</p>
          <p className="text-sm mt-1">
            {showFlagged ? 'No rooms have flagged messages.' : 'Chat rooms are created automatically when orders are paid.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div key={room.id} className="border rounded-lg overflow-hidden">
              {/* Room Header Row */}
              <button
                className="w-full px-4 py-3 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
                onClick={() => toggleRoom(room.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{room.order.orderNumber}</span>
                    <Badge variant="outline" className="text-xs">
                      {room.order.status.replace(/_/g, ' ')}
                    </Badge>
                    {room.hasBlockedContent && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Flagged
                      </Badge>
                    )}
                    {!room.isActive && (
                      <Badge variant="secondary" className="text-xs">Closed</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
                    <span>
                      {room.customer.firstName} {room.customer.lastName} ↔ {room.vendor.businessName}
                    </span>
                    <span className="truncate max-w-[240px]">{room.product.name}</span>
                  </div>
                  {room.lastMessage && (
                    <p className="mt-1 text-xs text-muted-foreground truncate max-w-lg">
                      Last: "{room.lastMessage.content}" · {format(new Date(room.lastMessage.createdAt), 'MMM d, HH:mm')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">{room.messageCount} msg{room.messageCount !== 1 ? 's' : ''}</span>
                  {expandedRoomId === room.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded: Full Message Thread */}
              {expandedRoomId === room.id && (
                <div className="border-t">
                  <AdminChatRoom
                    roomId={room.id}
                    customer={room.customer}
                    vendor={room.vendor}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
