'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Visit } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VISIT_STATUS_LABELS, VISIT_STATUS_COLORS } from '@/lib/constants';
import { format } from 'date-fns';
import { ClipboardPlus } from 'lucide-react';
import { PageTransition } from '@/components/shared/page-transition';
import { FadeIn } from '@/components/shared/animations';

export default function VisitsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['visits', page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status && status !== 'ALL') params.set('status', status);
      const { data } = await api.get<ApiResponse<Visit[]>>(`/visits?${params}`);
      return data;
    },
  });

  const columns: Column<Visit>[] = [
    {
      header: 'Visit #',
      cell: (row) => (
        <span className="font-mono text-[13px] text-primary/80">{row.visitNumber}</span>
      ),
    },
    {
      header: 'Patient',
      cell: (row) => {
        if (!row.patient) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.06] text-[12px] font-semibold text-primary">
              {row.patient.firstName[0]}
              {row.patient.lastName[0]}
            </div>
            <div>
              <p className="font-medium text-foreground">
                {row.patient.firstName} {row.patient.lastName}
              </p>
              <p className="font-mono text-[12px] text-muted-foreground">{row.patient.mrn}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell: (row) => (
        <StatusBadge
          status={row.status}
          colorMap={VISIT_STATUS_COLORS}
          labelMap={VISIT_STATUS_LABELS}
        />
      ),
    },
    {
      header: 'Tests Ordered',
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.testOrders?.length ?? 0} {(row.testOrders?.length ?? 0) === 1 ? 'test' : 'tests'}
        </span>
      ),
    },
    {
      header: 'Date',
      cell: (row) => (
        <span className="text-[13px] text-muted-foreground">
          {format(new Date(row.createdAt), 'dd MMM yyyy, hh:mm a')}
        </span>
      ),
    },
  ];

  return (
    <PageTransition>
      <PageHeader
        title="Visits"
        description="Manage patient visits and diagnostic orders"
        action={{
          label: 'New Visit',
          href: '/dashboard/visits/new',
          icon: <ClipboardPlus className="h-4 w-4" />,
        }}
      />

      <FadeIn delay={0.05}>
        <div className="mb-5 flex items-center gap-3">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-52 rounded-lg border-border/50 bg-white text-[13.5px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.entries(VISIT_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data?.meta?.total !== undefined && (
            <span className="text-[12px] text-muted-foreground">
              {data.meta.total} visit{data.meta.total !== 1 ? 's' : ''}
              {status !== 'ALL' &&
                ` · ${VISIT_STATUS_LABELS[status as keyof typeof VISIT_STATUS_LABELS]}`}
            </span>
          )}
        </div>
      </FadeIn>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/dashboard/visits/${row.id}`)}
        emptyMessage="No visits found"
        emptyDescription="Create a new visit to begin the diagnostic process for a patient."
        pagination={{
          page,
          totalPages: data?.meta?.totalPages ?? 1,
          total: data?.meta?.total,
          onPageChange: setPage,
        }}
      />
    </PageTransition>
  );
}
