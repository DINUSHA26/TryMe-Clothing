"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SocialPostType } from "./Feed";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreHorizontal, Flag, Bookmark, ChevronLeft, ChevronRight, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommentSection } from "./CommentSection";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PostGalleryModalProps {
    post: SocialPostType;
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
    isLiked: boolean;
    likesCount: number;
    handleLike: () => void;
    handleShare: () => void;
    handleReport: () => void;
    isSaved: boolean;
    handleSave: () => void;
}

export function PostGalleryModal({
    post,
    initialIndex,
    isOpen,
    onClose,
    isLiked,
    likesCount,
    handleLike,
    handleShare,
    handleReport,
    isSaved,
    handleSave
}: PostGalleryModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
        if (firstName && lastName) return `${firstName[0]}${lastName[0]}`;
        if (email) return email.substring(0, 2).toUpperCase();
        return "U";
    };

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : post.images.length - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < post.images.length - 1 ? prev + 1 : 0));
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] w-full h-[90vh] p-0 overflow-hidden flex md:flex-row flex-col rounded-xl bg-black border-none gap-0">
                <DialogTitle className="sr-only">Image Gallery</DialogTitle>

                <button onClick={onClose} className="absolute top-4 left-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 md:hidden">
                    <X className="h-5 w-5" />
                </button>

                {/* Left Side: Image Gallery */}
                <div className="flex-1 relative flex items-center justify-center bg-black min-h-[300px] md:h-full">
                    <button onClick={onClose} className="absolute top-4 left-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 hidden md:block">
                        <X className="h-5 w-5" />
                    </button>

                    <div className="relative w-full h-full">
                        <Image
                            src={post.images[currentIndex]}
                            alt="Post image"
                            fill
                            className="object-contain"
                        />
                    </div>

                    {post.images.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevious}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        </>
                    )}
                </div>

                {/* Right Side: Post Details & Comments */}
                <div className="w-full md:w-[400px] bg-white dark:bg-slate-950 flex flex-col h-full md:flex-shrink-0 border-l">
                    <div className="p-4 flex flex-row items-center space-x-3 border-b">
                        <Avatar className="h-10 w-10 border shadow-sm">
                            {post.user.vendor?.logo && <AvatarImage src={post.user.vendor.logo} />}
                            <AvatarFallback>{getInitials(post.user.firstName, post.user.lastName, post.user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">
                                {post.user.vendor?.businessName || `${post.user.firstName || "User"} ${post.user.lastName || ""}`.trim()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(post.createdAt).toLocaleDateString(undefined, {
                                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                                })}
                            </p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -mr-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={handleSave}>
                                    <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-primary text-primary" : ""}`} />
                                    {isSaved ? "Unsave Post" : "Save Post"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleShare}>
                                    <Share2 className="h-4 w-4 mr-2" /> Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleReport}>
                                    <Flag className="h-4 w-4 mr-2" /> Report Post
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <ScrollArea className="flex-1 flex flex-col">
                        <div className="p-4">
                            {post.content && (
                                <p className="text-sm whitespace-pre-wrap leading-relaxed mb-4">{post.content}</p>
                            )}

                            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-4">
                                <span>{likesCount > 0 ? `${likesCount} likes` : ""}</span>
                                <span>{post._count.comments > 0 ? `${post._count.comments} comments` : "0 comments"}</span>
                            </div>

                            <div className="flex w-full border-y py-1">
                                <Button
                                    variant="ghost"
                                    className={`flex-1 rounded-xl text-muted-foreground font-semibold ${isLiked ? "text-primary" : ""}`}
                                    onClick={handleLike}
                                >
                                    <Heart className={`h-5 w-5 mr-2 ${isLiked ? "fill-primary" : ""}`} />
                                    Like
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="flex-1 rounded-xl text-muted-foreground font-semibold"
                                    onClick={() => {
                                        const input = document.querySelector('input[placeholder*="comment"]') as HTMLInputElement;
                                        if (input) input.focus();
                                    }}
                                >
                                    <MessageCircle className="h-5 w-5 mr-2" />
                                    Comment
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="flex-1 rounded-xl text-muted-foreground font-semibold"
                                    onClick={handleShare}
                                >
                                    <Share2 className="h-5 w-5 mr-2" />
                                    Share
                                </Button>
                            </div>

                            <CommentSection postId={post.id} />
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
