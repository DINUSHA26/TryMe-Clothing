'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface MessageVendorButtonProps {
  orderItemId: string;
  vendorName: string;
  orderNumber?: string;
  items?: string[]; // Names of items for this vendor
}

export function MessageVendorButton({ 
  orderItemId, 
  vendorName,
  orderNumber,
  items 
}: MessageVendorButtonProps) {
  const { openChat, sendMessage } = useChatStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleMessageVendor = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderItemId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to open chat');
      }

      await openChat(data.roomId);

      // If Super Admin (or Admin), send an automated context header
      if (user?.role === 'ADMIN' && orderNumber) {
        const itemNames = items?.join(', ') || 'order items';
        const contextMessage = `Inquiry regarding Order #${orderNumber} - Items: ${itemNames}`;
        
        // Wait a small bit to ensure subscription is active
        setTimeout(() => {
          sendMessage(data.roomId, contextMessage);
        }, 500);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error(error.message || 'Failed to contact vendor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMessageVendor}
      className="gap-2"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      {user?.role === 'ADMIN' ? 'Inquiry' : `Message ${vendorName}`}
    </Button>
  );
}
