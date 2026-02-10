'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Patient, Visit } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { GENDER_LABELS, VISIT_STATUS_LABELS, VISIT_STATUS_COLORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { User, MapPin, Phone, CalendarPlus, ChevronRight } from 'lucide-react';
import { PageTransition } from '@/components/shared/page-transition';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animations';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Patient>>(`/patients/${id}`);
      return data.data;
    },
  });

  const { data: visits } = useQuery({
    queryKey: ['patient-visits', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Visit[]>>(`/visits?patientId=${id}&limit=50`);
      return data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!patient) return <p className="py-12 text-center text-muted-foreground">Patient not found.</p>;

  return (
    <PageTransition>
      <PageHeader
        title={`${patient.firstName} ${patient.lastName}`}
        description={`MRN: ${patient.mrn}`}
        backHref="/dashboard/patients"
      />

      {/* Patient Avatar Header */}
      <FadeIn>
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-border/40 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/[0.08] text-lg font-bold text-primary">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{patient.firstName} {patient.lastName}</h2>
            <p className="text-[13px] text-muted-foreground">
              {GENDER_LABELS[patient.gender]} &bull; {format(new Date(patient.dateOfBirth), 'dd MMM yyyy')} &bull; {patient.phone}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push(`/dashboard/visits/new?patientId=${id}`)}
            className="rounded-lg shadow-sm"
          >
            <CalendarPlus className="mr-1.5 h-4 w-4" />
            New Visit
          </Button>
        </div>
      </FadeIn>

      <StaggerContainer className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <StaggerItem>
          <Card className="rounded-xl border-border/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-[13.5px] font-semibold">Personal Information</h3>
              </div>
              <div className="space-y-3">
                <InfoRow label="Gender" value={GENDER_LABELS[patient.gender]} />
                <InfoRow label="Date of Birth" value={format(new Date(patient.dateOfBirth), 'dd MMM yyyy')} />
                <InfoRow label="Phone" value={patient.phone} />
                <InfoRow label="Email" value={patient.email || '—'} />
                <InfoRow label="Blood Group" value={patient.bloodGroup || '—'} />
                <InfoRow label="Registered" value={format(new Date(patient.createdAt), 'dd MMM yyyy')} />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Address & Emergency */}
        <StaggerItem>
          <Card className="rounded-xl border-border/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-[13.5px] font-semibold">Address & Emergency</h3>
              </div>
              <div className="space-y-3">
                <InfoRow label="Address" value={[patient.address, patient.city, patient.state, patient.pincode].filter(Boolean).join(', ') || '—'} />
                <div className="my-3 border-t border-border/40" />
                <div className="mb-2 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-destructive/60" />
                  <span className="text-[12px] font-medium text-destructive/80">Emergency Contact</span>
                </div>
                <InfoRow label="Name" value={patient.emergencyContactName || '—'} />
                <InfoRow label="Phone" value={patient.emergencyContactPhone || '—'} />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Visit History */}
      <FadeIn delay={0.15}>
        <Card className="mt-6 rounded-xl border-border/40 shadow-sm">
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <CalendarPlus className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-[13.5px] font-semibold">Visit History</h3>
                {visits && visits.length > 0 && (
                  <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{visits.length}</span>
                )}
              </div>
            </div>
            {!visits || visits.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[13px] text-muted-foreground">No visits recorded yet.</p>
                <Button variant="outline" size="sm" className="mt-3 rounded-lg" onClick={() => router.push(`/dashboard/visits/new?patientId=${id}`)}>
                  Create First Visit
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {visits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-border/40 p-3.5 transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/dashboard/visits/${visit.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-mono text-[13px] font-medium text-foreground">{visit.visitNumber}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {format(new Date(visit.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <StatusBadge status={visit.status} colorMap={VISIT_STATUS_COLORS} labelMap={VISIT_STATUS_LABELS} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </PageTransition>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
