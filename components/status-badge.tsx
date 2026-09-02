import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'Approved (simulated)' || status === 'Ready' || status === 'Eligible'
      ? 'bg-[#edf7f1] text-[#246c50]'
      : status === 'Submitted' || status === 'Changes requested' || status === 'Revalidation required' || status === 'Mandatory'
        ? 'bg-[#fff0e2] text-[#91450f]'
        : status === 'Rejected' || status === 'Stale' || status === 'Quarantined' || status === 'Overdue' || status === 'Planning blocked'
          ? 'bg-[#fff0ef] text-[#9d403d]'
          : 'bg-[#e8f2f4] text-[#075f69]';

  return <Badge className={cn('rounded-md', tone)}>{status}</Badge>;
}
