"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { PostCard } from "./PostCard";
import { CreatePostModal } from "./CreatePostModal";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface SocialUser {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    vendor: {
        businessName: string;
        logo: string | null;
    } | null;
}

export interface SocialPostType {
    id: string;
    userId: string;
    content: string | null;
    images: string[];
    createdAt: string;
    user: SocialUser;
    likes: { userId: string }[];
    savedBy?: { userId: string }[];
    _count: { comments: number };
}

export function Feed() {
    const { isAuthenticated, user } = useAuthStore();
    const [posts, setPosts] = useState<SocialPostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchPosts = async (pageNum = 1, append = false) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/social?page=${pageNum}&limit=10`);
            const data = await res.json();

            if (data.success) {
                if (append) {
                    setPosts(prev => [...prev, ...data.data.posts]);
                } else {
                    setPosts(data.data.posts);
                }
                setHasMore(data.data.pagination.page < data.data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePostCreated = (newPost: SocialPostType) => {
        setPosts([newPost, ...posts]);
    };

    const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
        if (firstName && lastName) return `${firstName[0]}${lastName[0]}`;
        if (email) return email.substring(0, 2).toUpperCase();
        return "U";
    };

    return (
        <div className="space-y-6">
            {/* Create Post Header */}
            <div className="bg-white dark:bg-slate-950 border-2 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <Avatar key={(user as any)?.avatar || "no-avatar"}>
                    <AvatarImage src={(user as any)?.avatar || undefined} alt={user?.firstName || "User"} />
                    <AvatarFallback>{user ? getInitials(user.firstName, user.lastName, user.email) : "G"}</AvatarFallback>
                </Avatar>
                <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground rounded-full bg-slate-50 dark:bg-slate-900 border-none hover:bg-slate-100 hover:text-foreground"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    {isAuthenticated ? "What's on your mind?" : "Log in to post..."}
                </Button>
            </div>

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handlePostCreated}
            />

            {/* Feed */}
            <div className="space-y-6">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>

            {loading && (
                <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {!loading && hasMore && (
                <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={() => { setPage(p => p + 1); fetchPosts(page + 1, true); }}>
                        Load More
                    </Button>
                </div>
            )}

            {!loading && posts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No posts yet. Be the first to share something!
                </div>
            )}
        </div>
    );
}
