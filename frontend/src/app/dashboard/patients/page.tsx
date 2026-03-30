'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Patient } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Input } from '@/components/ui/input';
import { GENDER_LABELS } from '@/lib/constants';
import { format } from 'date-fns';
import { Search, UserPlus, X } from 'lucide-react';
import { PageTransition } from '@/components/shared/page-transition';
import { FadeIn } from '@/components/shared/animations';
import { Button } from '@/components/ui/button';

export default function PatientsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounce search
  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const { data } = await api.get<ApiResponse<Patient[]>>(`/patients?${params}`);
      return data;
    },
  });

  const columns: Column<Patient>[] = [
    { header: 'MRN', accessorKey: 'mrn', className: 'font-mono text-[13px] text-primary/80' },
    {
      header: 'Patient Name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.06] text-[12px] font-semibold text-primary">
            {row.firstName[0]}
            {row.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-[12px] text-muted-foreground">{row.email || row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Gender',
      cell: (row) => <span className="text-muted-foreground">{GENDER_LABELS[row.gender]}</span>,
    },
    {
      header: 'Date of Birth',
      cell: (row) => (
        <span className="text-muted-foreground">
          {format(new Date(row.dateOfBirth), 'dd MMM yyyy')}
        </span>
      ),
    },
    {
      header: 'Phone',
      cell: (row) => (
        <span className="font-mono text-[13px] text-muted-foreground">{row.phone}</span>
      ),
    },
    {
      header: 'Registered',
      cell: (row) => (
        <span className="text-[13px] text-muted-foreground">
          {format(new Date(row.createdAt), 'dd MMM yyyy')}
        </span>
      ),
    },
  ];

  return (
    <PageTransition>
      <PageHeader
        title="Patients"
        description="Manage patient records and registration"
        action={{
          label: 'New Patient',
          href: '/dashboard/patients/new',
          icon: <UserPlus className="h-4 w-4" />,
        }}
      />

      <FadeIn delay={0.05}>
        <div className="mb-5 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              placeholder="Search by name, MRN, phone..."
              className="h-10 rounded-lg border-border/50 bg-white pl-9 pr-9 text-[13.5px] placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {data?.meta?.total !== undefined && (
            <span className="text-[12px] text-muted-foreground">
              {data.meta.total} patient{data.meta.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </FadeIn>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/dashboard/patients/${row.id}`)}
        emptyMessage="No patients found"
        emptyDescription="Register your first patient to get started with the system."
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
