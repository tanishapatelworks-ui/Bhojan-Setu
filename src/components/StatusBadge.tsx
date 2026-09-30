import { STATUS_META } from '@/lib/constants';
import type { DonationStatus } from '@/types';

export function StatusBadge({ status }: { status: DonationStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`badge ${meta.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`} />
      {meta.label}
    </span>
  );
}
