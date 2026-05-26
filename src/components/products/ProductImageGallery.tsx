"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  activeImageUrl?: string | null;
}

export function ProductImageGallery({
  images: propImages,
  productName,
  activeImageUrl,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  // Combine prop images with active variant image if it's not already present
  const images = useMemo(() => {
    if (!activeImageUrl || propImages.includes(activeImageUrl)) {
      return propImages;
    }
    // If variant image is new, prepend it to the gallery list
    return [activeImageUrl, ...propImages];
  }, [propImages, activeImageUrl]);

  // Sync selected index when activeImageUrl changes
  useEffect(() => {
    if (activeImageUrl) {
      const index = images.indexOf(activeImageUrl);
      if (index !== -1) {
        setSelectedImage(index);
      }
    }
  }, [activeImageUrl, images]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  const handlePrevious = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border group shadow-sm">
        {/* We use two images to create a crossfade effect */}
        {images.map((image, index) => (
          <div
            key={image + index}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              selectedImage === index ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            <Image
              src={image}
              alt={`${productName} - Image ${index + 1}`}
              fill
              className="object-cover transition-transform [transition-duration:2000ms] group-hover:scale-110"
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ))}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <div className="z-20">
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all rounded-full h-10 w-10 md:h-12 md:w-12 shadow-md hover:bg-white hover:scale-110"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all rounded-full h-10 w-10 md:h-12 md:w-12 shadow-md hover:bg-white hover:scale-110"
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </div>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20 z-20">
            {selectedImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
          {images.map((image, index) => (
            <button
              key={image + index}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                ? "border-primary ring-2 ring-primary/20"
                : "border-transparent hover:border-muted-foreground/30 opacity-70 hover:opacity-100"
                }`}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
