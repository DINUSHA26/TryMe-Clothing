'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResolveDisputeDialog } from './ResolveDisputeDialog';
import { ResolutionType, DisputeRefundCalculation } from '@/types/dispute';
import { Scale, RefreshCw } from 'lucide-react';

interface ResolveDisputeActionBlockProps {
  disputeId: string;
  orderTotal: number;
  refundCalculation: DisputeRefundCalculation | null;
}

export function ResolveDisputeActionBlock({
  disputeId,
  orderTotal,
  refundCalculation,
}: ResolveDisputeActionBlockProps) {
  const [open, setOpen] = useState(false);
  const [initialType, setInitialType] = useState<ResolutionType>(ResolutionType.CUSTOMER_FAVOR);

  const handleOpen = (type: ResolutionType) => {
    setInitialType(type);
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <Button
        onClick={() => handleOpen(ResolutionType.CUSTOMER_FAVOR)}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 font-medium"
      >
        <RefreshCw className="h-4 w-4" />
        Approve Refund (Customer Favor)
      </Button>
      <Button
        onClick={() => handleOpen(ResolutionType.VENDOR_FAVOR)}
        variant="destructive"
        className="w-full flex items-center justify-center gap-2 font-medium"
      >
        <Scale className="h-4 w-4" />
        Reject Claim (Vendor Favor)
      </Button>

      <ResolveDisputeDialog
        disputeId={disputeId}
        orderTotal={orderTotal}
        refundCalculation={refundCalculation}
        open={open}
        onOpenChange={setOpen}
        initialResolutionType={initialType}
      />
    </div>
  );
}
