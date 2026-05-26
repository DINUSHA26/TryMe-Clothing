"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { SocialPostType } from "@/components/social/Feed";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AdminSocialModerationPage() {
    const [posts, setPosts] = useState<SocialPostType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch("/api/social?limit=50");
            const data = await res.json();
            if (data.success) {
                setPosts(data.data.posts);
            }
        } catch {
            toast.error("Failed to fetch posts");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            // Typically we'd use DELETE method, let's pretend we have a DELETE endpoint at /api/social/[postId]
            const res = await fetch(`/api/social/${postId}`, { method: "DELETE" });
            const data = await res.json();

            if (data.success) {
                setPosts((prev) => prev.filter((p) => p.id !== postId));
                toast.success("Post deleted successfully");
            } else {
                toast.error("Failed to delete post");
            }
        } catch {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Social Moderation</h1>
                <p className="text-muted-foreground">Review and moderate community posts.</p>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-950">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Images</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
                            </TableRow>
                        ) : posts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                                    No posts to moderate
                                </TableCell>
                            </TableRow>
                        ) : (
                            posts.map((post) => (
                                <TableRow key={post.id}>
                                    <TableCell className="font-medium">
                                        {post.user.vendor?.businessName || `${post.user.firstName || "User"} ${post.user.lastName || ""}`.trim()}
                                        <br />
                                        <span className="text-xs text-muted-foreground">{post.user.email}</span>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate">
                                        {post.content || <span className="text-muted-foreground italic">No text content</span>}
                                    </TableCell>
                                    <TableCell>
                                        {post.images.length > 0 ? (
                                            <Badge variant="secondary">{post.images.length} images</Badge>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-muted-foreground">{post.likes.length} likes, {post._count.comments} comments</span>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(post.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDelete(post.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
