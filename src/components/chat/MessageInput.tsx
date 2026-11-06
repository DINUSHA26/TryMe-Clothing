'use client';

import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Loader2, AlertCircle, Sparkles, Smile } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { validateMessageContent } from '@/lib/utils/contactFilter';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  roomId: string;
}

const quickChips = [
  '👍 Thank you!',
  '📦 Order status update?',
  '🚚 When will it dispatch?',
  '✨ Please confirm details',
];

/**
 * Modern Message Input Component
 * Styled with TryMe brand orange, quick replies, validation, and smooth keyboard shortcuts
 */
export function MessageInput({ roomId }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { sendMessage, sendTyping } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSend = async (textToSend?: string) => {
    const messageText = (textToSend ?? content).trim();

    if (!messageText) {
      return;
    }

    // Validate content against contact info sharing
    const validationError = validateMessageContent(messageText);
    if (validationError) {
      setWarning(validationError);
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(roomId, messageText);
      setContent('');
      setWarning(null);

      // Re-focus input
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
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

  const handleChipClick = (chip: string) => {
    handleSend(chip);
  };

  const charCount = content.length;
  const maxChars = 2000;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="border-t bg-background/95 backdrop-blur-sm p-3 sm:p-4 space-y-2.5">
      {/* Quick response chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 select-none">
        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 pl-0.5 flex-shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-[#FF6600]" />
          Quick:
        </span>
        {quickChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChipClick(chip)}
            disabled={isSending}
            className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/30 text-foreground/80 hover:text-[#ea580c] transition-all active:scale-95 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Warning alert */}
      {warning && (
        <Alert variant="destructive" className="py-2 px-3 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <AlertDescription className="text-xs">{warning}</AlertDescription>
        </Alert>
      )}

      {/* Input row */}
      <div className="flex gap-2 items-end">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift + Enter for new line)"
            disabled={isSending}
            className="resize-none min-h-[52px] max-h-[120px] text-xs sm:text-sm py-2.5 px-3 rounded-xl bg-muted/30 focus-visible:ring-1 focus-visible:ring-[#FF6600] border-muted-foreground/20 leading-relaxed"
            rows={1}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={() => handleSend()}
          disabled={!content.trim() || isSending || isOverLimit}
          size="icon"
          className="flex-shrink-0 h-[52px] w-[52px] rounded-xl bg-gradient-to-r from-[#FF6600] to-[#ea580c] hover:opacity-95 text-white shadow-md shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
          aria-label="Send message"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5 stroke-[2.2]" />
          )}
        </Button>
      </div>

      {/* Character count & tip footer */}
      <div className="flex justify-between items-center text-[11px] text-muted-foreground select-none px-0.5">
        <span className="hidden sm:inline">Press Enter to send · Shift+Enter for new line</span>
        <span className="sm:hidden">Press send button to submit</span>
        <span className={cn('font-mono font-medium', isOverLimit && 'text-destructive font-bold')}>
          {charCount} / {maxChars}
        </span>
      </div>
    </div>
  );
}
