"use client";

import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { validateImage } from "@/lib/utils/image";

interface ImageUploadResult {
  url: string;
  altText?: string;
  position: number;
}

interface ImageUploaderProps {
  onImagesUploaded: (images: ImageUploadResult[]) => void;
  currentImageCount: number;
  maxImages?: number;
}

export function ImageUploader({
  onImagesUploaded,
  currentImageCount,
  maxImages = 10,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check total count
    if (currentImageCount + files.length > maxImages) {
      toast({
        variant: "destructive",
        title: "Too Many Images",
        description: `Maximum ${maxImages} images allowed. You can add ${maxImages - currentImageCount} more.`,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const uploadedImages: ImageUploadResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate image
        const error = await validateImage(file);
        if (error) {
          toast({
            variant: "destructive",
            title: `Invalid Image: ${file.name}`,
            description: error,
          });
          continue;
        }

        setUploadProgress({ current: i + 1, total: files.length });

        // Upload to server
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          toast({
            variant: "destructive",
            title: `Upload Failed: ${file.name}`,
            description: result.error || "Failed to upload image",
          });
          continue;
        }

        uploadedImages.push({
          url: result.data.url,
          altText: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          position: currentImageCount + uploadedImages.length,
        });
      }

      if (uploadedImages.length > 0) {
        onImagesUploaded(uploadedImages);
        toast({
          title: "Success",
          description: `${uploadedImages.length} image${uploadedImages.length > 1 ? "s" : ""} uploaded successfully`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during upload",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const remainingSlots = maxImages - currentImageCount;

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={isUploading || remainingSlots <= 0}
        className="hidden"
        id="image-upload"
      />

      <label htmlFor="image-upload">
        <div
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isUploading || remainingSlots <= 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-accent"
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 mb-2 text-primary animate-spin" />
                {uploadProgress && (
                  <p className="text-sm text-muted-foreground">
                    Uploading {uploadProgress.current} of {uploadProgress.total}
                    ...
                  </p>
                )}
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload images
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or WEBP (max 5MB each)
                </p>
                {remainingSlots > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {remainingSlots} slot{remainingSlots > 1 ? "s" : ""}{" "}
                    remaining
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </label>
    </div>
  );
}
