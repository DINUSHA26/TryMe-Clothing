"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SocialUser } from "./Feed";
import { useRouter } from "next/navigation";

interface CommentType {
    id: string;
    content: string;
    createdAt: string;
    user: SocialUser;
}

interface CommentSectionProps {
    postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();

    const [comments, setComments] = useState<CommentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await fetch(`/api/social/${postId}/comments`);
                const data = await res.json();
                if (data.success) {
                    setComments(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch comments", error);
            } finally {
                setLoading(false);
            }
        };
        fetchComments();
    }, [postId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error("Please login to comment");
            const returnUrl = encodeURIComponent(`/social?post=${postId}`);
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }
        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            const res = await fetch(`/api/social/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment }),
            });
            const data = await res.json();
            if (data.success) {
                setComments((prev) => [data.data, ...prev]);
                setNewComment("");
            } else {
                toast.error(data.error || "Failed to add comment");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
        if (firstName && lastName) return `${firstName[0]}${lastName[0]}`;
        if (email) return email.substring(0, 2).toUpperCase();
        return "U";
    };

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="pt-4 space-y-4 border-t">
            {/* Comment Input */}
            <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                        {user ? getInitials(user.firstName, user.lastName, user.email) : "G"}
                    </AvatarFallback>
                </Avatar>
                <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
                    <Input
                        value={newComment}
                        onFocus={() => {
                            if (!isAuthenticated) {
                                toast.error("Please login to comment");
                                const returnUrl = encodeURIComponent(`/social?post=${postId}`);
                                router.push(`/login?returnUrl=${returnUrl}`);
                            }
                        }}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={isAuthenticated ? "Write a comment..." : "Login to comment..."}
                        className="rounded-full bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-1"
                    />
                    <Button type="submit" size="sm" className="rounded-full px-4" disabled={!newComment.trim() || submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                    </Button>
                </form>
            </div>

            {/* Comments List */}
            <div className="space-y-4 pt-2 max-h-64 overflow-y-auto pr-2">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                                {getInitials(comment.user.firstName, comment.user.lastName, comment.user.email)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl py-2 px-3 inline-block">
                                <span className="font-semibold text-sm mr-2 block text-foreground">
                                    {comment.user.vendor?.businessName || `${comment.user.firstName || "User"} ${comment.user.lastName || ""}`.trim()}
                                </span>
                                <span className="text-sm text-foreground">{comment.content}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 ml-2">
                                {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
                {comments.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground pt-2">No comments yet.</p>
                )}
            </div>
        </div>
    );
}
