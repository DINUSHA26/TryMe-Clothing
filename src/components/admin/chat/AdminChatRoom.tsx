'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Loader2, FileText, FileSpreadsheet, File, ExternalLink, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderId: string;
  content: string;
  hasBlockedContent: boolean;
  isRead: boolean;
  createdAt: string;
  sender: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface AdminChatRoomProps {
  roomId: string;
  customer: { firstName: string; lastName: string; email: string };
  vendor: { businessName: string; email: string };
}

export function AdminChatRoom({ roomId, customer, vendor }: AdminChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/admin/chat/rooms/${roomId}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to load messages');
        setMessages(data.room.messages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMessages();
  }, [roomId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading messages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center text-sm text-destructive">
        Failed to load messages: {error}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No messages in this room yet.
      </div>
    );
  }

  // Determine alignment and colors
  function getMessageStyles(msg: Message) {
    if (msg.sender.role === 'ADMIN') {
      return {
        alignment: 'items-center mx-auto',
        bubble: 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100',
        label: 'System Admin'
      };
    }
    if (msg.sender.email === customer.email) {
      return {
        alignment: 'items-start',
        bubble: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100',
        label: `${msg.sender.firstName} ${msg.sender.lastName} (Customer)`
      };
    }
    return {
      alignment: 'items-end ml-auto',
      bubble: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100',
      label: `${msg.sender.firstName} ${msg.sender.lastName} (Vendor)`
    };
  }

  return (
    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto bg-muted/20">
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pb-2 border-b uppercase tracking-wider">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Customer
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Vendor
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          Admin
        </span>
      </div>

      {messages.map((msg) => {
        const styles = getMessageStyles(msg);
        let attachment: { type: string; fileType?: string; url: string; name?: string; size?: number; caption?: string } | null = null;
        if (msg.content && msg.content.trim().startsWith('{') && msg.content.includes('"type":"attachment"')) {
          try {
            const parsed = JSON.parse(msg.content);
            if (parsed.type === 'attachment') {
              attachment = parsed;
            }
          } catch {
            // plain text
          }
        }

        return (
          <div
            key={msg.id}
            className={cn('flex flex-col max-w-[80%]', styles.alignment)}
          >
            <span className="text-[10px] font-medium text-muted-foreground mb-1">
              {styles.label} · {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
            </span>
            <div
              className={cn(
                'px-3 py-2 rounded-lg text-sm shadow-sm',
                styles.bubble,
                msg.hasBlockedContent && 'ring-2 ring-destructive/50'
              )}
            >
              {attachment ? (
                <div className="space-y-2">
                  {attachment.fileType === 'image' && (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-md border border-white/20 hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name || 'Image'}
                        className="max-h-60 max-w-full object-cover rounded"
                      />
                    </a>
                  )}

                  {attachment.fileType === 'pdf' && (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-colors"
                    >
                      <FileText className="w-6 h-6 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">{attachment.name || 'Document.pdf'}</div>
                        {attachment.size && (
                          <div className="text-[10px] opacity-75">{(attachment.size / 1024).toFixed(1)} KB</div>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 shrink-0 opacity-70" />
                    </a>
                  )}

                  {attachment.fileType === 'excel' && (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-2.5 p-2 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors"
                    >
                      <FileSpreadsheet className="w-6 h-6 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">{attachment.name || 'Spreadsheet.xlsx'}</div>
                        {attachment.size && (
                          <div className="text-[10px] opacity-75">{(attachment.size / 1024).toFixed(1)} KB</div>
                        )}
                      </div>
                      <Download className="w-4 h-4 shrink-0 opacity-70" />
                    </a>
                  )}

                  {attachment.fileType === 'file' && (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-2.5 p-2 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors"
                    >
                      <File className="w-6 h-6 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">{attachment.name || 'File'}</div>
                        {attachment.size && (
                          <div className="text-[10px] opacity-75">{(attachment.size / 1024).toFixed(1)} KB</div>
                        )}
                      </div>
                      <Download className="w-4 h-4 shrink-0 opacity-70" />
                    </a>
                  )}

                  {attachment.caption && (
                    <p className="text-xs break-words">{attachment.caption}</p>
                  )}
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.hasBlockedContent && (
              <Badge variant="destructive" className="mt-1 text-[10px] gap-1 h-4 uppercase">
                <AlertTriangle className="w-2.5 h-2.5" />
                Filtered
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
