import { Badge } from '@/components/ui/badge';
import {
  DisputeStatus,
  DISPUTE_STATUS_LABELS,
  DISPUTE_STATUS_COLORS,
} from '@/types/dispute';

interface DisputeStatusBadgeProps {
  status: DisputeStatus;
  className?: string;
}

export function DisputeStatusBadge({
  status,
  className,
}: DisputeStatusBadgeProps) {
  return (
    <Badge variant={DISPUTE_STATUS_COLORS[status]} className={className}>
      {DISPUTE_STATUS_LABELS[status]}
    </Badge>
  );
}
