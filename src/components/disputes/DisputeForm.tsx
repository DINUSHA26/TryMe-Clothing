'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import {
  DisputeReason,
  DISPUTE_REASON_LABELS,
  MAX_DISPUTE_EVIDENCE_IMAGES,
} from '@/types/dispute';
import { compressImage } from '@/lib/utils/image';

interface DisputeFormProps {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItemId?: string;
}

export function DisputeForm({
  orderId,
  orderNumber,
  open,
  onOpenChange,
  orderItemId,
}: DisputeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [reason, setReason] = useState<DisputeReason | ''>('');
  const [description, setDescription] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (evidenceUrls.length + files.length > MAX_DISPUTE_EVIDENCE_IMAGES) {
      setError(
        `Maximum ${MAX_DISPUTE_EVIDENCE_IMAGES} images allowed. You can upload ${MAX_DISPUTE_EVIDENCE_IMAGES - evidenceUrls.length} more.`
      );
      return;
    }

    setUploadingImages(true);
    setError('');

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed');
          continue;
        }

        // Compress image first
        const compressedFile = await compressImage(file);

        // Validate file size (max 5MB)
        if (compressedFile.size > 5 * 1024 * 1024) {
          setError('Image size must be less than 5MB');
          continue;
        }

        // Upload to Cloudinary via API
        const formData = new FormData();
        formData.append('file', compressedFile);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        if (!data.success || !data.data?.url) {
          throw new Error(data.error || 'Failed to upload image');
        }
        uploadedUrls.push(data.data.url);
      }

      setEvidenceUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      setError('Failed to upload images. Please try again.');
      console.error('Image upload error:', err);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason) {
      setError('Please select a reason for the dispute');
      return;
    }

    if (description.length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          orderItemId,
          reason,
          description,
          evidence: evidenceUrls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create dispute');
      }

      // Success - redirect to disputes page
      router.push('/orders?tab=disputes');
      router.refresh();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Open Dispute</DialogTitle>
          <DialogDescription>
            Order #{orderNumber} - Please provide details about your issue
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Select value={reason} onValueChange={(value) => setReason(value as DisputeReason)}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DISPUTE_REASON_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Please describe the issue in detail (minimum 20 characters)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              maxLength={1000}
              required
            />
            <p className="text-sm text-muted-foreground">
              {description.length}/1000 characters
              {description.length < 20 && description.length > 0 && (
                <span className="text-orange-500 ml-2">
                  (Minimum 20 characters required)
                </span>
              )}
            </p>
          </div>

          {/* Evidence Upload */}
          <div className="space-y-2">
            <Label>Evidence (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Upload up to {MAX_DISPUTE_EVIDENCE_IMAGES} images to support your
              dispute (Max 5MB per image)
            </p>

            {/* Upload Button */}
            {evidenceUrls.length < MAX_DISPUTE_EVIDENCE_IMAGES && (
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                  className="hidden"
                  id="evidence-upload"
                />
                <Label
                  htmlFor="evidence-upload"
                  className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-accent transition-colors"
                >
                  {uploadingImages ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>Click to upload images</span>
                    </>
                  )}
                </Label>
              </div>
            )}

            {/* Image Previews */}
            {evidenceUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {evidenceUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> Once submitted, an admin will review your
              dispute. You can track the progress and communicate through
              comments.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !reason || description.length < 20}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Dispute'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
