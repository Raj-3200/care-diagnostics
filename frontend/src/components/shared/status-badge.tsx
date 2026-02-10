'use client';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  colorMap: Record<string, string>;
  labelMap: Record<string, string>;
}

export function StatusBadge({ status, colorMap, labelMap }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium leading-5',
        colorMap[status] || 'bg-gray-50 text-gray-600',
      )}
    >
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        getStatusDotColor(status),
      )} />
      {labelMap[status] || status}
    </span>
  );
}

function getStatusDotColor(status: string): string {
  const dotColors: Record<string, string> = {
    // Visit
    REGISTERED: 'bg-blue-500',
    SAMPLES_COLLECTED: 'bg-yellow-500',
    IN_PROGRESS: 'bg-purple-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-red-400',
    // Sample
    PENDING_COLLECTION: 'bg-gray-400',
    COLLECTED: 'bg-blue-500',
    IN_LAB: 'bg-purple-500',
    PROCESSED: 'bg-green-500',
    REJECTED: 'bg-red-400',
    // Result
    PENDING: 'bg-gray-400',
    ENTERED: 'bg-blue-500',
    VERIFIED: 'bg-green-500',
    // Report
    GENERATED: 'bg-blue-500',
    APPROVED: 'bg-green-500',
    DISPATCHED: 'bg-purple-500',
    // Invoice
    PARTIAL: 'bg-yellow-500',
    PAID: 'bg-green-500',
    REFUNDED: 'bg-orange-400',
  };
  return dotColors[status] || 'bg-gray-400';
}
