'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import type { ApiResponse, Test } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TEST_CATEGORY_LABELS, SAMPLE_TYPE_LABELS } from '@/lib/constants';
import { toast } from 'sonner';
import { FlaskConical, FileText, ShieldCheck, ShieldOff, Loader2, IndianRupee, Clock, Building2, Droplets } from 'lucide-react';
import { PageTransition } from '@/components/shared/page-transition';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animations';

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: test, isLoading } = useQuery({
    queryKey: ['test', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Test>>(`/tests/${id}`);
      return data.data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async () => {
      await api.patch(`/tests/${id}`, { isActive: !test?.isActive });
    },
    onSuccess: () => {
      toast.success(`Test ${test?.isActive ? 'deactivated' : 'activated'}`);
      qc.invalidateQueries({ queryKey: ['test', id] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!test) return <p className="py-12 text-center text-muted-foreground">Test not found.</p>;

  return (
    <PageTransition>
      <PageHeader title={test.name} description={test.code} backHref="/dashboard/tests" />

      {/* Header card */}
      <FadeIn>
        <div className="mb-6 flex items-center justify-between rounded-xl border border-border/40 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.08]">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-semibold">{test.name}</h2>
                <Badge variant={test.isActive ? 'default' : 'secondary'} className="text-[11px]">{test.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="mt-0.5 font-mono text-[13px] text-muted-foreground">{test.code}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleActive.mutate()}
            disabled={toggleActive.isPending}
            className={`h-9 gap-1.5 rounded-lg text-[12.5px] ${
              test.isActive
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {toggleActive.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : test.isActive ? (
              <ShieldOff className="h-3.5 w-3.5" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            {test.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </FadeIn>

      {/* Stat pills */}
      <FadeIn delay={0.05}>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill icon={<IndianRupee className="h-3.5 w-3.5" />} label="Price" value={`₹${Number(test.price).toFixed(0)}`} />
          <StatPill icon={<Clock className="h-3.5 w-3.5" />} label="TAT" value={test.turnaroundTime} />
          <StatPill icon={<Droplets className="h-3.5 w-3.5" />} label="Sample" value={SAMPLE_TYPE_LABELS[test.sampleType]} />
          <StatPill icon={<Building2 className="h-3.5 w-3.5" />} label="Department" value={test.department || '—'} />
        </div>
      </FadeIn>

      <StaggerContainer className="grid gap-6 lg:grid-cols-2">
        {/* Test Details */}
        <StaggerItem>
          <Card className="rounded-xl border-border/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <FlaskConical className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-[13.5px] font-semibold">Test Details</h3>
              </div>
              <div className="space-y-3 text-[13px]">
                <InfoRow label="Category" value={TEST_CATEGORY_LABELS[test.category]} />
                <InfoRow label="Sample Type" value={SAMPLE_TYPE_LABELS[test.sampleType]} />
                <InfoRow label="Price" value={`₹${Number(test.price).toFixed(2)}`} />
                <InfoRow label="Turnaround Time" value={test.turnaroundTime} />
                <InfoRow label="Department" value={test.department || '—'} />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Additional Info */}
        <StaggerItem>
          <Card className="rounded-xl border-border/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-[13.5px] font-semibold">Additional Info</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[12px] font-medium text-muted-foreground">Description</span>
                  <p className="mt-1 text-[13px] text-foreground">{test.description || 'No description provided.'}</p>
                </div>
                <div className="border-t border-border/40 pt-4">
                  <span className="text-[12px] font-medium text-muted-foreground">Patient Instructions</span>
                  <p className="mt-1 text-[13px] text-foreground">{test.instructions || 'No special instructions.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-white p-3 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06] text-primary">
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-[13px] font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
