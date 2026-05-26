"use client";

import { useState } from "react";
import { X, GripVertical } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductImage {
  id?: string;
  url: string;
  altText?: string;
  position: number;
}

interface ImageGalleryProps {
  images: ProductImage[];
  onReorder: (images: ProductImage[]) => void;
  onDelete: (index: number) => void;
  minImages?: number;
}

export function ImageGallery({
  images,
  onReorder,
  onDelete,
  minImages = 1,
}: ImageGalleryProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];

    // Remove from old position
    newImages.splice(draggedIndex, 1);
    // Insert at new position
    newImages.splice(index, 0, draggedImage);

    // Update positions
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      position: idx,
    }));

    setDraggedIndex(index);
    onReorder(reorderedImages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDelete = (index: number) => {
    if (images.length <= minImages) {
      return; // Prevent deletion if at minimum
    }
    onDelete(index);
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No images uploaded yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <div
          key={image.id || index}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`relative group rounded-lg border-2 overflow-hidden transition-all cursor-move ${
            draggedIndex === index
              ? "border-primary opacity-50"
              : "border-border hover:border-primary"
          }`}
        >
          {/* Drag Handle */}
          <div className="absolute top-2 left-2 z-10 bg-background/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Position Badge */}
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className="text-xs">
              {index + 1}
            </Badge>
          </div>

          {/* Delete Button */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleDelete(index)}
            disabled={images.length <= minImages}
          >
            <X className="w-3 h-3" />
          </Button>

          {/* Image */}
          <div className="relative aspect-square w-full">
            <Image
              src={image.url}
              alt={image.altText || `Product image ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          </div>

          {/* Alt Text */}
          {image.altText && (
            <div className="p-2 bg-muted text-xs truncate">
              {image.altText}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
