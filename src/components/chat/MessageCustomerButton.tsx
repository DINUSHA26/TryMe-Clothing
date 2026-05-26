'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { toast } from 'sonner';

interface MessageCustomerButtonProps {
  orderItemId: string;
}

export function MessageCustomerButton({ orderItemId }: MessageCustomerButtonProps) {
  const { openChat } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleMessageCustomer = async () => {
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

      openChat(data.roomId);
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error(error.message || 'Failed to contact customer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMessageCustomer}
      className="gap-2"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      Message Customer
    </Button>
  );
}
