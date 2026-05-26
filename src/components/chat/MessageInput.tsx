'use client';

import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { validateMessageContent } from '@/lib/utils/contactFilter';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  roomId: string;
}

/**
 * Message Input Component
 * Input field for sending messages with validation
 */
export function MessageInput({ roomId }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { sendMessage, sendTyping } = useChatStore();

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (value: string) => {
    setContent(value);

    // Clear warning if content becomes valid
    if (warning) {
      const validationError = validateMessageContent(value);
      if (!validationError) {
        setWarning(null);
      }
    }

    // Trigger typing indicator
    sendTyping(roomId);
  };

  const handleSend = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    // Validate content
    const validationError = validateMessageContent(trimmedContent);
    if (validationError) {
      setWarning(validationError);
      return;
    }

    // Send message
    setIsSending(true);
    try {
      await sendMessage(roomId, trimmedContent);

      // Clear input on success
      setContent('');
      setWarning(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = content.length;
  const maxChars = 2000;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="border-t p-4 space-y-2">
      {/* Warning alert */}
      {warning && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}

      {/* Input area */}
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Shift+Enter for new line)"
          disabled={isSending}
          className="resize-none min-h-[60px] max-h-[120px]"
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isSending || isOverLimit}
          size="icon"
          className="flex-shrink-0 h-[60px] w-[60px]"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Character count */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span className={cn(isOverLimit && 'text-destructive')}>
          {charCount} / {maxChars}
        </span>
      </div>
    </div>
  );
}
