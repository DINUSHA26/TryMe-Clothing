"use client";

import { useState, useEffect } from "react";
import { SocialPostType } from "./Feed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, MoreHorizontal, Flag, Bookmark, Share2, Copy, ShoppingBag, Tag } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CommentSection } from "./CommentSection";
import { PostGalleryModal } from "./PostGalleryModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function PostCard({ post }: { post: SocialPostType }) {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isLiked, setIsLiked] = useState(user ? post.likes.some(l => l.userId === user.id) : false);
    const [likesCount, setLikesCount] = useState(post.likes.length);
    const [showComments, setShowComments] = useState(searchParams.get("post") === post.id);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(
        user && post.savedBy ? post.savedBy.some(s => s.userId === user.id) : false
    );
    const [isExpanded, setIsExpanded] = useState(false);
    const isLongText = post.content ? (post.content.length > 200 || post.content.split("\n").length > 4) : false;

    useEffect(() => {
        if (user && post.savedBy) {
            setIsSaved(post.savedBy.some(s => s.userId === user.id));
        } else {
            setIsSaved(false);
        }
    }, [user, post.savedBy]);

    const openGallery = (index: number) => {
        setGalleryIndex(index);
        setGalleryOpen(true);
    };

    const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
        if (firstName && lastName) return `${firstName[0]}${lastName[0]}`;
        if (email) return email.substring(0, 2).toUpperCase();
        return "U";
    };

    const handleLike = async () => {
        if (!isAuthenticated) {
            toast.error("Please login to like this post");
            const returnUrl = encodeURIComponent(`/social?post=${post.id}`);
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }

        // Optimistic UI update
        const previousState = isLiked;
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            const res = await fetch(`/api/social/${post.id}/like`, { method: "POST" });
            const data = await res.json();
            if (!data.success) {
                // Revert on error
                setIsLiked(previousState);
                setLikesCount(prev => previousState ? prev + 1 : prev - 1);
                toast.error("Failed to update like");
            }
        } catch {
            setIsLiked(previousState);
            setLikesCount(prev => previousState ? prev + 1 : prev - 1);
        }
    };

    const handleSave = async () => {
        if (!isAuthenticated) {
            toast.error("Please login to save this post");
            const returnUrl = encodeURIComponent(`/social?post=${post.id}`);
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }

        const previousState = isSaved;
        setIsSaved(!isSaved);

        try {
            const res = await fetch(`/api/social/${post.id}/save`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                toast.success(data.saved ? "Post saved to bookmarks!" : "Post removed from bookmarks.");
                setIsSaved(data.saved);
            } else {
                setIsSaved(previousState);
                toast.error("Failed to save post");
            }
        } catch {
            setIsSaved(previousState);
            toast.error("Failed to save post");
        }
    };

    const copyToClipboardAction = async (text: string) => {
        try {
            let copied = false;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                copied = true;
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "-9999px";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                copied = document.execCommand("copy");
                document.body.removeChild(textArea);
            }

            if (copied) {
                toast.success("Link copied to clipboard!");
                return true;
            } else {
                toast.error("Failed to copy link");
                return false;
            }
        } catch {
            toast.error("Failed to copy link");
            return false;
        }
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/social?post=${post.id}`;
        const shareTitle = `Post by ${post.user.vendor?.businessName || `${post.user.firstName || "User"} ${post.user.lastName || ""}`.trim()}`;
        const shareText = post.content || "Check out this post on PrimeWear!";

        const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const isWindows = typeof navigator !== "undefined" && (
            /Windows/i.test(navigator.userAgent) || 
            /Win32|Win64|Windows/i.test(navigator.platform || "") ||
            (typeof (navigator as any).userAgentData?.platform === "string" && /Windows/i.test((navigator as any).userAgentData.platform))
        );

        if (isMobile && navigator.share && !isWindows) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                toast.success("Shared successfully!");
            } catch (error: any) {
                if (error.name !== "AbortError") {
                    toast.error("Failed to share post");
                }
            }
        } else {
            // Open the beautiful premium desktop share dialog!
            setShareDialogOpen(true);
        }
    };

    const handleReport = () => {
        if (!isAuthenticated) {
            const returnUrl = encodeURIComponent(`/social?post=${post.id}`);
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }
        toast.success("Post reported. Our team will review it.");
    };

    const renderImages = () => {
        if (!post.images || post.images.length === 0) return null;

        if (post.images.length === 1) {
            return (
                <div
                    className="w-full rounded-xl overflow-hidden mt-3 border cursor-pointer hover:opacity-95 transition bg-slate-50 dark:bg-slate-900/50"
                    onClick={() => openGallery(0)}
                >
                    <img 
                        src={post.images[0]} 
                        alt="Post image" 
                        className="w-full h-auto max-h-[500px] md:max-h-[420px] object-contain mx-auto" 
                    />
                </div>
            );
        }

        if (post.images.length === 2) {
            return (
                <div className="grid grid-cols-2 gap-1 mt-3 rounded-xl overflow-hidden border">
                    {post.images.map((img, i) => (
                        <div
                            key={i}
                            className="relative aspect-square cursor-pointer hover:opacity-95 transition"
                            onClick={() => openGallery(i)}
                        >
                            <Image src={img} alt="Post image" fill className="object-cover" />
                        </div>
                    ))}
                </div>
            );
        }

        // 3 or more images
        return (
            <div className="grid grid-cols-2 gap-1 mt-3 rounded-xl overflow-hidden border">
                <div
                    className="relative aspect-square cursor-pointer hover:opacity-95 transition"
                    onClick={() => openGallery(0)}
                >
                    <Image src={post.images[0]} alt="Post image" fill className="object-cover" />
                </div>
                <div className="grid grid-rows-2 gap-1 relative">
                    <div
                        className="relative w-full h-full cursor-pointer hover:opacity-95 transition"
                        onClick={() => openGallery(1)}
                    >
                        <Image src={post.images[1]} alt="Post image" fill className="object-cover" />
                    </div>
                    <div
                        className="relative w-full h-full cursor-pointer hover:opacity-95 transition"
                        onClick={() => openGallery(2)}
                    >
                        <Image src={post.images[2]} alt="Post image" fill className="object-cover" />
                        {post.images.length > 3 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-2xl">
                                +{post.images.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card id={`post-${post.id}`} className="rounded-2xl shadow-sm border-2 overflow-hidden">
            <CardHeader className="p-4 flex flex-row items-start space-y-0 gap-3 pb-2">
                <Avatar className="h-10 w-10 border shadow-sm">
                    {post.user.vendor?.logo && <AvatarImage src={post.user.vendor.logo} />}
                    <AvatarFallback>{getInitials(post.user.firstName, post.user.lastName, post.user.email)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                        {post.user.vendor?.businessName || `${post.user.firstName || "User"} ${post.user.lastName || ""}`.trim()}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
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
            </CardHeader>

            <CardContent className="p-4 pt-1">
                {post.content && (
                    <div className="mb-2">
                        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${!isExpanded && isLongText ? "line-clamp-4" : ""}`}>
                            {post.content}
                        </p>
                        {isLongText && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-sm font-semibold text-muted-foreground hover:text-primary mt-1 transition-colors"
                            >
                                {isExpanded ? "Show less" : "Read more"}
                            </button>
                        )}
                    </div>
                )}
                {renderImages()}

                {post.productSlug && (
                    <div className="mt-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-[#FF6600]">
                                <Tag className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-foreground">Tagged Product</p>
                                <p className="text-[10px] text-muted-foreground">Available on TryMe Store</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 px-4 shadow-sm transition active:scale-95"
                            onClick={() => router.push(`/products/${post.productSlug}`)}
                        >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Shop Now
                        </Button>
                    </div>
                )}
            </CardContent>

            <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>{likesCount > 0 ? `${likesCount} likes` : ""}</span>
                <span>{post._count.comments > 0 ? `${post._count.comments} comments` : (showComments ? "0 comments" : "")}</span>
            </div>

            <CardFooter className="p-2 border-t flex flex-col gap-2">
                <div className="flex w-full justify-between gap-1">
                    <Button
                        variant="ghost"
                        className={`flex-1 rounded-xl text-muted-foreground font-semibold px-1 sm:px-4 text-xs sm:text-sm ${isLiked ? "text-red-500 hover:text-red-600" : ""}`}
                        onClick={handleLike}
                    >
                        <Heart className={`h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                        <span className="truncate">Like</span>
                    </Button>
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-xl text-muted-foreground font-semibold px-1 sm:px-4 text-xs sm:text-sm"
                        onClick={() => {
                            if (!isAuthenticated) {
                                toast.error("Please login to comment");
                                const returnUrl = encodeURIComponent(`/social?post=${post.id}`);
                                router.push(`/login?returnUrl=${returnUrl}`);
                                return;
                            }
                            setShowComments(!showComments);
                        }}
                    >
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        <span className="truncate">Comment</span>
                    </Button>
                    <Button
                        variant="ghost"
                        className={`flex-1 rounded-xl text-muted-foreground font-semibold px-1 sm:px-4 text-xs sm:text-sm ${isSaved ? "text-primary font-bold" : ""}`}
                        onClick={handleSave}
                    >
                        <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 ${isSaved ? "fill-primary" : ""}`} />
                        <span className="truncate">{isSaved ? "Saved" : "Save"}</span>
                    </Button>
                    <Button
                        variant="ghost"
                        className="flex-1 rounded-xl text-muted-foreground font-semibold px-1 sm:px-4 text-xs sm:text-sm"
                        onClick={handleShare}
                    >
                        <Share2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        <span className="truncate">Share</span>
                    </Button>
                </div>

                {showComments && (
                    <div className="w-full px-2 pb-2">
                        <CommentSection postId={post.id} />
                    </div>
                )}
            </CardFooter>

            <PostGalleryModal
                post={post}
                isOpen={galleryOpen}
                onClose={() => setGalleryOpen(false)}
                initialIndex={galleryIndex}
                isLiked={isLiked}
                likesCount={likesCount}
                handleLike={handleLike}
                handleShare={handleShare}
                handleReport={handleReport}
                isSaved={isSaved}
                handleSave={handleSave}
            />

            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Share Post</DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                            Share this post with your friends on social media or copy the direct link.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-5 py-4">
                        {/* Direct Share Buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this post: ${window.location.origin}/social?post=${post.id}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-medium transition active:scale-95 cursor-pointer"
                            >
                                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45h.007c5.442 0 9.873-4.43 9.876-9.874.002-2.637-1.019-5.116-2.877-6.974-1.859-1.859-4.336-2.88-6.97-2.881-5.452 0-9.885 4.432-9.888 9.878-.002 1.637.432 3.238 1.258 4.654L1.758 22.3l4.889-1.146zm11.75-5.975c-.327-.164-1.93-.953-2.229-1.062-.299-.109-.517-.164-.734.164-.218.327-.844 1.062-1.035 1.28-.19.218-.38.245-.707.081-1.558-.778-2.673-1.336-3.73-3.15-.28-.48.28-.445.8-.148.163.09.327.245.435.463.109.218.164.408.081.572-.081.164-.326.654-.544.871-.218.218-.435.163-.762 0-1.06-.525-1.93-1.077-2.637-2.29-.163-.28-.027-.43.11-.567.126-.123.28-.327.42-.49.14-.163.19-.28.28-.464.09-.18.045-.34-.022-.504-.068-.164-.517-1.252-.707-1.708-.186-.447-.37-.387-.517-.394-.134-.007-.289-.008-.444-.008-.156 0-.408.058-.621.288-.213.23-.812.793-.812 1.934 0 1.14.83 2.247.946 2.404.116.157 1.633 2.493 3.956 3.493.553.238.984.38 1.32.487.556.177 1.06.15 1.46.091.445-.067 1.93-.789 2.2-1.513.272-.724.272-1.344.19-1.472-.08-.129-.299-.19-.626-.354z" />
                                </svg>
                                <span className="text-xs font-semibold">WhatsApp</span>
                            </a>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/social?post=${post.id}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium transition active:scale-95 cursor-pointer"
                            >
                                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                <span className="text-xs font-semibold">Facebook</span>
                            </a>
                            <a
                                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/social?post=${post.id}`)}&text=${encodeURIComponent(`Check out this post!`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-medium transition active:scale-95 cursor-pointer"
                            >
                                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                <span className="text-xs font-semibold">Twitter / X</span>
                            </a>
                        </div>

                        {/* Copy Link Input Field */}
                        <div className="flex items-center gap-2 mt-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    readOnly
                                    value={`${window.location.origin}/social?post=${post.id}`}
                                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 pr-10 focus:outline-none select-all text-slate-600 dark:text-slate-300"
                                />
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl flex items-center gap-1.5 px-3 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                                onClick={() => copyToClipboardAction(`${window.location.origin}/social?post=${post.id}`)}
                            >
                                <Copy className="h-4 w-4" />
                                Copy
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
