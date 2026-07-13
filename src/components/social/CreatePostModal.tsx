"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ImagePlus, X, Loader2, Tag } from "lucide-react";
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
}

export function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();

    const [content, setContent] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [productTag, setProductTag] = useState("");

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setImages(prev => [...prev, ...filesArray]);

            const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            URL.revokeObjectURL(prev[index]);
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

        try {
            setLoading(true);
            let imageUrls: string[] = [];
            if (images.length > 0) {
                imageUrls = await uploadImages();
            }

            const res = await fetch("/api/social", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, images: imageUrls, productTag }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Posted successfully!");
                onSuccess(data.data);
                setContent("");
                setImages([]);
                setPreviewUrls([]);
                setProductTag("");
                onClose();
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
                    <DialogTitle className="text-center text-xl font-bold">Create Post</DialogTitle>
                </DialogHeader>

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
                                className="resize-none border-none focus-visible:ring-0 text-lg min-h-[120px] p-0"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
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
                                disabled={loading || (!content.trim() && images.length === 0)}
                                className="w-full rounded-xl font-bold"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Post
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
