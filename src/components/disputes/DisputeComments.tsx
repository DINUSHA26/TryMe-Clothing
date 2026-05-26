'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DisputeCommentWithUser, DisputeStatus } from '@/types/dispute';
import { Loader2, Send, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';

interface DisputeCommentsProps {
  disputeId: string;
  comments: DisputeCommentWithUser[];
  disputeStatus: DisputeStatus;
  canComment: boolean;
}

export function DisputeComments({
  disputeId,
  comments,
  disputeStatus,
  canComment,
}: DisputeCommentsProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newComment.trim().length === 0) {
      setError('Comment cannot be empty');
      return;
    }

    if (newComment.length > 1000) {
      setError('Comment must not exceed 1000 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/disputes/${disputeId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          isInternal: isInternalComment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add comment');
      }

      // Clear form and refresh
      setNewComment('');
      setIsInternalComment(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comments List */}
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-lg border ${
                  comment.isAdmin
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {comment.user.firstName || comment.user.email}
                    </span>
                    {comment.isAdmin && (
                      <Badge
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {comment.isInternal && (
                      <Badge
                        variant="destructive"
                        className="bg-amber-600 hover:bg-amber-700 text-white border-none ml-2"
                      >
                        Internal Note
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment Form */}
        {canComment ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                maxLength={1000}
                disabled={loading}
              />
              
              {user?.role === 'ADMIN' && (
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="isInternalComment"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isInternalComment" className="text-sm font-medium text-amber-600 dark:text-amber-400 cursor-pointer">
                    Mark as Internal Note (Admin-only, hidden from customer)
                  </label>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {newComment.length}/1000 characters
                </p>
                <Button type="submit" disabled={loading || newComment.trim().length === 0}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Comment
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </form>
        ) : (
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Comments are disabled for resolved disputes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
