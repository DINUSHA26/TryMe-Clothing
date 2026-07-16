"use client";

import { useState } from "react";
import { detectBadWord } from "@/lib/content-moderation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ImagePlus, X, Loader2, Tag, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SocialPostType } from "./Feed";
import { compressImage } from "@/lib/utils/image";

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (post: SocialPostType) => void;
    editPost?: SocialPostType;
}

export function CreatePostModal({ isOpen, onClose, onSuccess, editPost }: CreatePostModalProps) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();

    const [content, setContent] = useState(editPost?.content || "");
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>(editPost?.images || []);
    const [loading, setLoading] = useState(false);
    const [productTag, setProductTag] = useState(editPost?.productTag || "");
    const [existingImages, setExistingImages] = useState<string[]>(editPost?.images || []);

    // Bad word state
    const [hasBadWord, setHasBadWord] = useState(false);
    const [badWordFound, setBadWordFound] = useState<string | null>(null);

    // Moderation popup state
    const [moderationPopup, setModerationPopup] = useState<{
        visible: boolean;
        type: "badword" | "image" | null;
        message: string;
    }>({ visible: false, type: null, message: "" });

    const showModerationPopup = (type: "badword" | "image", message: string) => {
        setModerationPopup({ visible: true, type, message });
    };

    const dismissModerationPopup = () => {
        setModerationPopup({ visible: false, type: null, message: "" });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setImages(prev => [...prev, ...filesArray]);
            const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        }
    };

    const removeImage = (index: number) => {
        const urlToRemove = previewUrls[index];
        if (existingImages.includes(urlToRemove)) {
            setExistingImages(prev => prev.filter(url => url !== urlToRemove));
        } else {
            const fileIndex = index - existingImages.length;
            if (fileIndex >= 0) {
                setImages(prev => prev.filter((_, i) => i !== fileIndex));
            }
        }
        setPreviewUrls(prev => {
            if (!existingImages.includes(urlToRemove)) URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const uploadImages = async (): Promise<string[]> => {
        const uploadedUrls: string[] = [];
        for (const image of images) {
            const compressedFile = await compressImage(image);
            const formData = new FormData();
            formData.append("file", compressedFile);
            formData.append("folder", "social");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success && data.data?.url) {
                uploadedUrls.push(data.data.url);
            } else {
                throw new Error("Failed to upload an image");
            }
        }
        return uploadedUrls;
    };

    const handleSubmit = async () => {
        if (!isAuthenticated) {
            toast.error("Please login to post");
            router.push("/login?redirect=/social");
            onClose();
            return;
        }

        if (!content.trim() && images.length === 0) {
            toast.error("Post cannot be empty");
            return;
        }

        // Client-side bad word check before submitting
        if (hasBadWord) {
            showModerationPopup(
                "badword",
                `Your post contains inappropriate language${badWordFound ? ` ("${badWordFound}")` : ""}. Please remove it before posting.`
            );
            return;
        }

        try {
            setLoading(true);
            let imageUrls: string[] = [];
            if (images.length > 0) {
                imageUrls = await uploadImages();
            }

            const url = editPost ? `/api/social/${editPost.id}` : "/api/social";
            const method = editPost ? "PUT" : "POST";
            const finalImages = editPost ? [...existingImages, ...imageUrls] : imageUrls;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, images: finalImages, productTag }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(editPost ? "Post updated!" : "Posted successfully!");
                onSuccess(data.data);
                setContent("");
                setImages([]);
                setPreviewUrls([]);
                setProductTag("");
                onClose();
            } else if (res.status === 422) {
                // Content moderation block — show popup
                const isImageBlock =
                    data.error?.toLowerCase().includes("image") ||
                    data.error?.toLowerCase().includes("explicit") ||
                    data.error?.toLowerCase().includes("nude");
                showModerationPopup(
                    isImageBlock ? "image" : "badword",
                    data.error || "This content violates our community guidelines."
                );
            } else {
                toast.error(data.error || "Failed to create post");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2rem]">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="text-center text-xl font-bold">{editPost ? "Edit Post" : "Create Post"}</DialogTitle>
                </DialogHeader>

                {/* ── Moderation Popup Overlay ─────────────────────────────── */}
                {moderationPopup.visible && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[2rem] p-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
                            {/* Icon */}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                                moderationPopup.type === "image"
                                    ? "bg-red-100 dark:bg-red-950/50"
                                    : "bg-orange-100 dark:bg-orange-950/50"
                            }`}>
                                <ShieldAlert className={`h-8 w-8 ${
                                    moderationPopup.type === "image"
                                        ? "text-red-500"
                                        : "text-orange-500"
                                }`} />
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-black text-foreground mb-1">
                                {moderationPopup.type === "image"
                                    ? "Inappropriate Image Detected"
                                    : "Inappropriate Language Detected"}
                            </h3>

                            {/* Subtitle */}
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                Community Guidelines Violation
                            </p>

                            {/* Message */}
                            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                                {moderationPopup.message}
                            </p>

                            {/* Info box */}
                            <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-5 text-left">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    🚫 Nude, sexually explicit, violent, or otherwise harmful content is <strong>strictly prohibited</strong> on TryMe. Repeated violations may result in account suspension.
                                </p>
                            </div>

                            {/* Button */}
                            <Button
                                className="w-full rounded-xl font-bold"
                                onClick={dismissModerationPopup}
                            >
                                Got it, I'll fix it
                            </Button>
                        </div>
                    </div>
                )}

                {!isAuthenticated ? (
                    <div className="p-8 text-center space-y-4">
                        <p className="text-muted-foreground">You must be logged in to create a post.</p>
                        <Button onClick={() => router.push("/login?redirect=/social")}>Go to Login</Button>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                            <Textarea
                                placeholder="What's on your mind?"
                                className={`resize-none border-none focus-visible:ring-0 text-lg min-h-[120px] p-0 ${
                                    hasBadWord ? "text-red-500" : ""
                                }`}
                                value={content}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setContent(val);
                                    const found = detectBadWord(val);
                                    setHasBadWord(!!found);
                                    setBadWordFound(found);
                                }}
                            />

                            {previewUrls.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto rounded-xl p-2 border">
                                    {previewUrls.map((url, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                                            <Image src={url} alt="Preview" fill className="object-cover" />
                                            <button
                                                onClick={() => removeImage(i)}
                                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2 border rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="flex items-center gap-2 text-[#FF6600]">
                                    <Tag className="h-4 w-4" />
                                    <label className="text-xs font-bold uppercase tracking-wider">Tag a Product</label>
                                </div>
                                <Input
                                    placeholder="Enter Product URL or SKU"
                                    className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-[#FF6600] text-sm"
                                    value={productTag}
                                    onChange={(e) => setProductTag(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center justify-between border rounded-xl p-3">
                                <span className="font-semibold text-sm">Add to your post</span>
                                <div className="flex gap-2">
                                    <label className="cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-green-500">
                                        <ImagePlus className="h-6 w-6" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-4 border-t">
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || (!content.trim() && previewUrls.length === 0) || hasBadWord}
                                className="w-full rounded-xl font-bold"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {editPost ? "Update Post" : "Post"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
