'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Test } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TEST_CATEGORY_LABELS, SAMPLE_TYPE_LABELS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { FlaskConical } from 'lucide-react';
import { PageTransition } from '@/components/shared/page-transition';
import { FadeIn } from '@/components/shared/animations';

export default function TestsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['tests', page, category],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (category && category !== 'ALL') params.set('category', category);
      const { data } = await api.get<ApiResponse<Test[]>>(`/tests?${params}`);
      return data;
    },
  });

  const columns: Column<Test>[] = [
    {
      header: 'Code',
      cell: (row) => <span className="font-mono text-[13px] text-primary/80">{row.code}</span>,
    },
    {
      header: 'Test Name',
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          {row.description && <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-1">{row.description}</p>}
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (row) => (
        <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[12px] font-medium text-muted-foreground">
          {TEST_CATEGORY_LABELS[row.category]}
        </span>
      ),
    },
    {
      header: 'Sample Type',
      cell: (row) => <span className="text-muted-foreground">{SAMPLE_TYPE_LABELS[row.sampleType]}</span>,
    },
    {
      header: 'Price',
      cell: (row) => <span className="font-medium text-foreground">{'\u20B9'}{Number(row.price).toFixed(0)}</span>,
      className: 'text-right',
    },
    {
      header: 'TAT',
      cell: (row) => <span className="text-[13px] text-muted-foreground">{row.turnaroundTime}</span>,
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.isActive ? 'default' : 'secondary'} className="text-[11px]">
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <PageTransition>
      <PageHeader
        title="Test Catalog"
        description="Manage diagnostic tests and pricing"
        action={{ label: 'New Test', href: '/dashboard/tests/new', icon: <FlaskConical className="h-4 w-4" /> }}
      />

      <FadeIn delay={0.05}>
        <div className="mb-5 flex items-center gap-3">
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-52 rounded-lg border-border/50 bg-white text-[13.5px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {Object.entries(TEST_CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FadeIn>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/dashboard/tests/${row.id}`)}
        emptyMessage="No tests found"
        emptyDescription="Add your first diagnostic test to begin building the catalog."
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
