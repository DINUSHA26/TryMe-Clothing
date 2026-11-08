'use client';

import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  Paperclip,
  X,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { validateMessageContent } from '@/lib/utils/contactFilter';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MessageInputProps {
  roomId: string;
}

const quickChips = [
  '👍 Thank you!',
  '📦 Order status update?',
  '🚚 When will it dispatch?',
  '✨ Please confirm details',
];

interface SelectedAttachment {
  file: File;
  previewUrl?: string;
  type: 'image' | 'pdf' | 'excel' | 'file';
}

function detectFileType(file: File): 'image' | 'pdf' | 'excel' | 'file' {
  const name = (file.name || '').toLowerCase();
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    file.type.includes('spreadsheet') ||
    file.type.includes('excel') ||
    file.type === 'text/csv' ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    name.endsWith('.csv')
  ) {
    return 'excel';
  }
  return 'file';
}

/**
 * Modern Message Input Component
 * Styled with TryMe brand orange, quick replies, file/image/PDF/Excel attachments, and shortcuts
 */
export function MessageInput({ roomId }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState<SelectedAttachment | null>(null);

  const { sendMessage, sendTyping } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (15MB max)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File is too large. Maximum file size is 15MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const type = detectFileType(file);
    let previewUrl: string | undefined;
    if (type === 'image') {
      previewUrl = URL.createObjectURL(file);
    }

    setAttachment({ file, previewUrl, type });
    if (fileInputRef.current) fileInputRef.current.value = '';
    textareaRef.current?.focus();
  };

  const handleRemoveAttachment = () => {
    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
    setAttachment(null);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const type = detectFileType(file);
          const previewUrl = type === 'image' ? URL.createObjectURL(file) : undefined;
          setAttachment({ file, previewUrl, type });
          break;
        }
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const messageText = (textToSend ?? content).trim();

    if (!messageText && !attachment) {
      return;
    }

    // Validate content against contact info sharing
    if (messageText) {
      const validationError = validateMessageContent(messageText);
      if (validationError) {
        setWarning(validationError);
        return;
      }
    }

    setIsSending(true);
    try {
      if (attachment) {
        // 1. Upload attachment to Cloudinary via /api/upload
        const formData = new FormData();
        formData.append('file', attachment.file);
        formData.append('folder', 'chat');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadData.success || !uploadData.data?.url) {
          toast.error(uploadData.error || 'Failed to upload attachment. Please try again.');
          setIsSending(false);
          return;
        }

        // 2. Format structured attachment message payload
        const attachmentPayload = {
          type: 'attachment',
          fileType: attachment.type,
          url: uploadData.data.url,
          name: attachment.file.name,
          size: attachment.file.size,
          caption: messageText || undefined,
        };

        await sendMessage(roomId, JSON.stringify(attachmentPayload));
        handleRemoveAttachment();
      } else {
        // Plain text message
        await sendMessage(roomId, messageText);
      }

      setContent('');
      setWarning(null);

      // Re-focus input
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
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
            className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/30 text-foreground/80 hover:text-[#ea580c] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Attachment Preview Card */}
      {attachment && (
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/60 dark:bg-orange-950/20 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            {attachment.type === 'image' && attachment.previewUrl ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border shrink-0 bg-black/5">
                <img
                  src={attachment.previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : attachment.type === 'pdf' ? (
              <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
            ) : attachment.type === 'excel' ? (
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                <FileIcon className="w-5 h-5 text-blue-600" />
              </div>
            )}

            <div className="min-w-0">
              <p className="font-bold text-foreground text-xs truncate max-w-[220px] sm:max-w-[320px]">
                {attachment.file.name}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {(attachment.file.size / 1024 / 1024).toFixed(2)} MB · Ready to send with message
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemoveAttachment}
            disabled={isSending}
            className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Warning alert */}
      {warning && (
        <Alert variant="destructive" className="py-2 px-3 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <AlertDescription className="text-xs">{warning}</AlertDescription>
        </Alert>
      )}

      {/* Input row */}
      <div className="flex gap-2 items-end">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx"
          onChange={handleFileSelect}
        />

        {/* Attachment Paperclip Button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          title="Attach Image, PDF, or Excel Spreadsheet"
          className={cn(
            'flex-shrink-0 h-[52px] w-[52px] rounded-xl border-muted-foreground/20 hover:border-[#FF6600] hover:text-[#FF6600] transition-all cursor-pointer',
            attachment && 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-[#ea580c]'
          )}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Textarea */}
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              attachment
                ? 'Add an optional caption for this file... (Enter to send)'
                : 'Type your message or attach a file... (Shift + Enter for new line)'
            }
            disabled={isSending}
            className="resize-none min-h-[52px] max-h-[120px] text-xs sm:text-sm py-2.5 px-3 rounded-xl bg-muted/30 focus-visible:ring-1 focus-visible:ring-[#FF6600] border-muted-foreground/20 leading-relaxed"
            rows={1}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={() => handleSend()}
          disabled={(!content.trim() && !attachment) || isSending || isOverLimit}
          size="icon"
          className="flex-shrink-0 h-[52px] w-[52px] rounded-xl bg-gradient-to-r from-[#FF6600] to-[#ea580c] hover:opacity-95 text-white shadow-md shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer"
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
        <span className="hidden sm:inline">
          Attach Photos, PDFs, Excel sheets · Press Enter to send
        </span>
        <span className="sm:hidden">Attach &amp; send files</span>
        <span className={cn('font-mono font-medium', isOverLimit && 'text-destructive font-bold')}>
          {charCount} / {maxChars}
        </span>
      </div>
    </div>
  );
}
