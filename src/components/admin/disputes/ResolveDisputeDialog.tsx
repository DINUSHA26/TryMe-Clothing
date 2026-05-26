'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ResolutionType,
  RESOLUTION_TYPE_LABELS,
  DisputeRefundCalculation,
} from '@/types/dispute';
import { Loader2, AlertTriangle, DollarSign } from 'lucide-react';

interface ResolveDisputeDialogProps {
  disputeId: string;
  orderTotal: number;
  refundCalculation: DisputeRefundCalculation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialResolutionType?: ResolutionType;
}

export function ResolveDisputeDialog({
  disputeId,
  orderTotal,
  refundCalculation,
  open,
  onOpenChange,
  initialResolutionType,
}: ResolveDisputeDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resolutionType, setResolutionType] = useState<ResolutionType | ''>(initialResolutionType || '');
  const [adminNotes, setAdminNotes] = useState('');
  const [customRefund, setCustomRefund] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setResolutionType(initialResolutionType || '');
      setAdminNotes('');
      setCustomRefund('');
      setError('');
    }
  }, [open, initialResolutionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resolutionType) {
      setError('Please select a resolution type');
      return;
    }

    if (adminNotes.trim().length < 10) {
      setError('Admin notes must be at least 10 characters');
      return;
    }

    // Validate custom refund if provided
    if (customRefund && resolutionType === ResolutionType.CUSTOMER_FAVOR) {
      const refundAmount = parseFloat(customRefund);
      if (isNaN(refundAmount) || refundAmount <= 0) {
        setError('Invalid refund amount');
        return;
      }
      if (refundAmount > orderTotal) {
        setError(`Refund amount cannot exceed order total (Rs. ${orderTotal.toFixed(2)})`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload: any = {
        resolutionType,
        adminNotes: adminNotes.trim(),
      };

      // Add custom refund amount if provided
      if (customRefund && resolutionType === ResolutionType.CUSTOMER_FAVOR) {
        payload.refundAmount = parseFloat(customRefund);
      }

      const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve dispute');
      }

      // Success - refresh and close
      router.refresh();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resolve Dispute</DialogTitle>
          <DialogDescription>
            Choose how to resolve this dispute. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resolution Type */}
          <div className="space-y-2">
            <Label htmlFor="resolutionType">
              Resolution Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={resolutionType}
              onValueChange={(value) => setResolutionType(value as ResolutionType)}
            >
              <SelectTrigger id="resolutionType">
                <SelectValue placeholder="Select resolution type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RESOLUTION_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refund Calculation Preview (Customer Favor) */}
          {resolutionType === ResolutionType.CUSTOMER_FAVOR && refundCalculation && (
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Default Refund Breakdown:</p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Order Total:</span>
                      <span className="font-medium">
                        Rs. {refundCalculation.orderTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Commission:</span>
                      <span className="font-medium">
                        Rs. {refundCalculation.platformCommission.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-semibold mb-2">Vendor Refunds:</p>
                    {refundCalculation.vendorRefunds.map((vr, index) => (
                      <div key={index} className="text-sm space-y-1 mb-2">
                        <p className="font-medium">{vr.vendorName}:</p>
                        <div className="pl-4 space-y-1">
                          <div className="flex justify-between">
                            <span>Refund Amount:</span>
                            <span>Rs. {vr.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Order Handling Fee (Retained):</span>
                            <span>Rs. {vr.commissionReversed.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Custom Refund Amount */}
          {resolutionType === ResolutionType.CUSTOMER_FAVOR && (
            <div className="space-y-2">
              <Label htmlFor="customRefund">
                Custom Refund Amount (Optional)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Rs.</span>
                <Input
                  id="customRefund"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={orderTotal}
                  placeholder={`Max: ${orderTotal.toFixed(2)}`}
                  value={customRefund}
                  onChange={(e) => setCustomRefund(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Leave empty to refund the full order amount. Enter a value for partial refund.
              </p>
            </div>
          )}

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">
              Admin Notes <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="adminNotes"
              placeholder="Explain your decision (minimum 10 characters)..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={6}
              maxLength={1000}
              required
            />
            <p className="text-sm text-muted-foreground">
              {adminNotes.length}/1000 characters
              {adminNotes.length < 10 && adminNotes.length > 0 && (
                <span className="text-orange-500 ml-2">
                  (Minimum 10 characters required)
                </span>
              )}
            </p>
          </div>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action is permanent and cannot be undone.
              {resolutionType === ResolutionType.CUSTOMER_FAVOR && (
                <span>
                  {' '}
                  Wallet refunds will be processed automatically.
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !resolutionType || adminNotes.length < 10}
              variant={resolutionType === ResolutionType.CUSTOMER_FAVOR ? 'destructive' : 'default'}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Resolve Dispute'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
