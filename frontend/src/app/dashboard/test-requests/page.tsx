'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import type { ApiResponse, Patient, Test, Visit } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Loader2,
  ClipboardPlus,
  Search,
  Check,
  FlaskConical,
  User,
  Clock,
  IndianRupee,
  ChevronRight,
} from 'lucide-react';
import { PageTransition } from '@/components/shared/page-transition';
import { FadeIn } from '@/components/shared/animations';
import { StaggerContainer, StaggerItem } from '@/components/shared/animations';

const VISIT_STATUS_COLORS: Record<string, string> = {
  REGISTERED: 'bg-blue-100 text-blue-800',
  SAMPLES_COLLECTED: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function TestRequestsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [notes, setNotes] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch client's patients
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['my-patients-all'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Patient[]>>('/clients/me/patients?limit=100');
      return data;
    },
  });

  // Fetch test catalog
  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['tests-catalog', testSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ isActive: 'true', limit: '100' });
      if (testSearch) params.set('searchTerm', testSearch);
      const { data } = await api.get<ApiResponse<Test[]>>(`/tests?${params}`);
      return data;
    },
  });

  // Fetch client's recent visits (to show status)
  const { data: visitsData, isLoading: visitsLoading } = useQuery({
    queryKey: ['my-visits'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Visit[]>>('/visits?limit=20');
      return data;
    },
  });

  const patients = patientsData?.data ?? [];
  const tests = testsData?.data ?? [];
  const visits = visitsData?.data ?? [];

  const toggleTest = (test: Test) => {
    setSelectedTests((prev) =>
      prev.find((t) => t.id === test.id) ? prev.filter((t) => t.id !== test.id) : [...prev, test],
    );
  };

  const totalPrice = selectedTests.reduce((sum, t) => sum + Number(t.price), 0);

  const handleSubmit = async () => {
    if (!selectedPatient || selectedTests.length === 0) return;
    setSubmitting(true);
    try {
      // Step 1: Create a visit
      const visitRes = await api.post<ApiResponse<Visit>>('/visits', {
        patientId: selectedPatient.id,
        notes: notes || undefined,
      });
      const visit = visitRes.data.data;

      // Step 2: Create test orders in bulk
      await api.post('/test-orders/bulk', {
        visitId: visit.id,
        testIds: selectedTests.map((t) => t.id),
      });

      toast.success('Test request submitted successfully!');
      setCreateOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['my-visits'] });
      qc.invalidateQueries({ queryKey: ['my-patients'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedPatient(null);
    setSelectedTests([]);
    setNotes('');
    setTestSearch('');
  };

  // Filter visits to only client's patients
  const patientIds = new Set(patients.map((p) => p.id));
  const clientVisits = visits.filter((v) => v.patient && patientIds.has(v.patientId));

  return (
    <PageTransition>
      <PageHeader
        title="Test Requests"
        description="Submit test requests for your patients and track their status"
        action={{
          label: 'New Test Request',
          onClick: () => {
            resetForm();
            setCreateOpen(true);
          },
          icon: <ClipboardPlus className="h-4 w-4" />,
        }}
      />

      {/* Recent Test Requests */}
      {visitsLoading || patientsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clientVisits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <ClipboardPlus className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="mt-4 text-[15px] font-semibold text-foreground">No test requests yet</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Submit your first test request for a patient.
          </p>
          <Button
            className="mt-4 rounded-lg"
            onClick={() => {
              resetForm();
              setCreateOpen(true);
            }}
          >
            <ClipboardPlus className="mr-2 h-4 w-4" />
            New Test Request
          </Button>
        </div>
      ) : (
        <StaggerContainer className="space-y-3">
          {clientVisits.map((visit) => (
            <StaggerItem key={visit.id}>
              <Card className="border-border/40 transition-all hover:border-border/60 hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/[0.06]">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-foreground">
                          {visit.patient?.firstName} {visit.patient?.lastName}
                          <span className="ml-2 text-[12px] text-muted-foreground">
                            {visit.visitNumber}
                          </span>
                        </p>
                        <div className="mt-0.5 flex items-center gap-3 text-[12px] text-muted-foreground">
                          <span>{format(new Date(visit.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                          {visit.testOrders && <span>{visit.testOrders.length} test(s)</span>}
                        </div>
                      </div>
                    </div>
                    <Badge className={`text-[11px] ${VISIT_STATUS_COLORS[visit.status] || ''}`}>
                      {visit.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {visit.testOrders && visit.testOrders.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {visit.testOrders.map((to) => (
                        <span
                          key={to.id}
                          className="rounded-md bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {to.test?.name || to.testId}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Create Test Request Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setCreateOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {step === 1 && 'Step 1: Select Patient'}
              {step === 2 && 'Step 2: Select Tests'}
              {step === 3 && 'Step 3: Review & Submit'}
            </DialogTitle>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    s <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2">
            {/* Step 1: Select Patient */}
            {step === 1 && (
              <div className="space-y-2">
                {patientsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : patients.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[13px] text-muted-foreground">
                      No patients found. Register a patient first from the My Patients page.
                    </p>
                  </div>
                ) : (
                  patients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                        selectedPatient?.id === patient.id
                          ? 'border-primary bg-primary/[0.04]'
                          : 'border-border/40 hover:border-border/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/[0.06] text-[12px] font-semibold text-primary">
                          {patient.firstName[0]}
                          {patient.lastName[0]}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-foreground">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {patient.mrn} · {patient.gender} · {patient.phone}
                          </p>
                        </div>
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Step 2: Select Tests */}
            {step === 2 && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    placeholder="Search tests (e.g. CBC, Blood Sugar...)"
                    className="h-10 rounded-lg border-border/60 pl-9 text-[14px]"
                  />
                </div>
                {selectedTests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 rounded-lg bg-primary/[0.04] p-2.5">
                    {selectedTests.map((t) => (
                      <Badge
                        key={t.id}
                        variant="secondary"
                        className="cursor-pointer gap-1 text-[11px]"
                        onClick={() => toggleTest(t)}
                      >
                        {t.name} ✕
                      </Badge>
                    ))}
                    <span className="ml-auto text-[12px] font-medium text-primary">
                      ₹{totalPrice.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="max-h-[300px] space-y-2 overflow-y-auto">
                  {testsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : tests.length === 0 ? (
                    <p className="py-8 text-center text-[13px] text-muted-foreground">
                      No tests found.
                    </p>
                  ) : (
                    tests.map((test) => {
                      const isSelected = selectedTests.some((t) => t.id === test.id);
                      return (
                        <div
                          key={test.id}
                          onClick={() => toggleTest(test)}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/[0.04]'
                              : 'border-border/40 hover:border-border/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.06]">
                              <FlaskConical className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-foreground">
                                {test.name}
                                <span className="ml-1.5 text-[11px] text-muted-foreground">
                                  ({test.code})
                                </span>
                              </p>
                              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span>{test.category}</span>
                                <span>·</span>
                                <span className="flex items-center gap-0.5">
                                  <Clock className="h-3 w-3" />
                                  {test.turnaroundTime}
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-0.5">
                                  <IndianRupee className="h-3 w-3" />
                                  {Number(test.price).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border/40 p-4">
                  <p className="text-[11px] font-medium uppercase text-muted-foreground/60">
                    Patient
                  </p>
                  <p className="mt-1 text-[14px] font-medium text-foreground">
                    {selectedPatient?.firstName} {selectedPatient?.lastName}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {selectedPatient?.mrn} · {selectedPatient?.phone}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 p-4">
                  <p className="text-[11px] font-medium uppercase text-muted-foreground/60">
                    Tests ({selectedTests.length})
                  </p>
                  <div className="mt-2 space-y-2">
                    {selectedTests.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-[13px]">
                        <span className="text-foreground">{t.name}</span>
                        <span className="text-muted-foreground">
                          ₹{Number(t.price).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-border/40 pt-2 flex items-center justify-between text-[14px] font-semibold">
                      <span>Total</span>
                      <span>₹{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions or notes..."
                    className="min-h-[80px] rounded-lg border-border/60 text-[14px]"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="rounded-lg"
              >
                Back
              </Button>
            )}
            {step === 1 && (
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedPatient}
                className="rounded-lg gap-1.5"
              >
                Next: Select Tests
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === 2 && (
              <Button
                onClick={() => setStep(3)}
                disabled={selectedTests.length === 0}
                className="rounded-lg gap-1.5"
              >
                Next: Review
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleSubmit} disabled={submitting} className="rounded-lg">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Test Request
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
