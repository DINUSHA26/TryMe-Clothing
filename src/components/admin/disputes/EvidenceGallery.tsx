'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface EvidenceGalleryProps {
  evidence: string[];
}

export function EvidenceGallery({ evidence }: EvidenceGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!evidence || evidence.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No evidence provided
      </div>
    );
  }

  const openImage = (index: number) => {
    setSelectedIndex(index);
  };

  const closeImage = () => {
    setSelectedIndex(null);
  };

  const nextImage = () => {
    if (selectedIndex !== null && selectedIndex < evidence.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const prevImage = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {evidence.map((url, index) => (
          <button
            key={index}
            onClick={() => openImage(index)}
            className="relative group aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
          >
            <img
              src={url}
              alt={`Evidence ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-white" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => closeImage()}>
        <DialogContent className="max-w-5xl h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              Evidence {selectedIndex !== null ? selectedIndex + 1 : 0} of{' '}
              {evidence.length}
            </DialogTitle>
            <DialogDescription>
              Dispute evidence image viewer
            </DialogDescription>
          </DialogHeader>

          {selectedIndex !== null && (
            <div className="flex-1 flex items-center justify-center p-6 relative">
              {/* Image */}
              <img
                src={evidence[selectedIndex]}
                alt={`Evidence ${selectedIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />

              {/* Navigation */}
              {evidence.length > 1 && (
                <>
                  {selectedIndex > 0 && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute left-4 top-1/2 -translate-y-1/2"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  {selectedIndex < evidence.length - 1 && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Footer with thumbnails */}
          {evidence.length > 1 && (
            <div className="p-6 pt-0 border-t">
              <div className="flex gap-2 overflow-x-auto">
                {evidence.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-colors ${
                      selectedIndex === index
                        ? 'border-primary'
                        : 'border-transparent hover:border-muted-foreground'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
