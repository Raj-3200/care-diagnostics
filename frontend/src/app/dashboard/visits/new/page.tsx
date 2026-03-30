'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import type { ApiResponse, Patient, Test } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TEST_CATEGORY_LABELS } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2, Search, UserCheck, FlaskConical, StickyNote, X } from 'lucide-react';
import { PageTransition } from '@/components/shared/page-transition';
import { FadeIn } from '@/components/shared/animations';

export default function NewVisitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetPatientId = searchParams.get('patientId');

  const [loading, setLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(presetPatientId || '');
  const [notes, setNotes] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [testSearch, setTestSearch] = useState('');
  const [testCategory, setTestCategory] = useState<string>('ALL');

  const { data: patients } = useQuery({
    queryKey: ['patient-search', patientSearch],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Patient[]>>(
        `/patients?search=${patientSearch}&limit=10`,
      );
      return data.data;
    },
    enabled: patientSearch.length >= 2 && !selectedPatientId,
  });

  const { data: selectedPatient } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Patient>>(`/patients/${selectedPatientId}`);
      return data.data;
    },
    enabled: !!selectedPatientId,
  });

  const { data: tests } = useQuery({
    queryKey: ['tests-all'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Test[]>>('/tests?limit=100');
      return data.data;
    },
  });

  const toggleTest = (testId: string) => {
    setSelectedTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient');
      return;
    }
    if (selectedTests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<ApiResponse<{ id: string }>>('/visits', {
        patientId: selectedPatientId,
        notes: notes || undefined,
      });
      const visitId = data.data.id;

      await api.post(`/test-orders/bulk`, {
        visitId,
        testIds: selectedTests,
      });

      toast.success('Visit created with test orders');
      router.push(`/dashboard/visits/${visitId}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const totalPrice =
    tests
      ?.filter((t) => selectedTests.includes(t.id))
      .reduce((sum, t) => sum + Number(t.price), 0) ?? 0;

  const filteredTests = useMemo(() => {
    if (!tests) return [];
    return tests.filter((t) => {
      const matchesSearch =
        !testSearch ||
        t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.code.toLowerCase().includes(testSearch.toLowerCase());
      const matchesCategory = testCategory === 'ALL' || t.category === testCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tests, testSearch, testCategory]);

  return (
    <PageTransition>
      <PageHeader title="Create New Visit" backHref="/dashboard/visits" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <FadeIn delay={0.05}>
          <Card className="rounded-xl border-border/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <UserCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">Select Patient</h3>
                  <p className="text-[12px] text-muted-foreground">
                    Search and select the patient for this visit
                  </p>
                </div>
              </div>

              {selectedPatient ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/[0.08] text-[13px] font-semibold text-primary">
                      {selectedPatient.firstName[0]}
                      {selectedPatient.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        MRN: {selectedPatient.mrn} &bull; {selectedPatient.phone}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPatientId('');
                      setPatientSearch('');
                    }}
                    className="h-8 gap-1.5 rounded-lg text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search patient by name, MRN, or phone..."
                      className="h-10 rounded-lg border-border/60 pl-9 text-[14px]"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {patients && patients.length > 0 && (
                    <div className="rounded-lg border border-border/60 overflow-hidden">
                      {patients.map((p) => (
                        <div
                          key={p.id}
                          className="flex cursor-pointer items-center gap-3 border-b border-border/40 p-3 last:border-0 transition-colors hover:bg-muted/40"
                          onClick={() => setSelectedPatientId(p.id)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.06] text-[11px] font-semibold text-primary">
                            {p.firstName[0]}
                            {p.lastName[0]}
                          </div>
                          <div>
                            <p className="text-[13.5px] font-medium">
                              {p.firstName} {p.lastName}
                            </p>
                            <p className="text-[12px] text-muted-foreground">
                              MRN: {p.mrn} &bull; {p.phone}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Test Selection */}
        <FadeIn delay={0.1}>
          <Card className="rounded-xl border-border/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                    <FlaskConical className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground">Select Tests</h3>
                    <p className="text-[12px] text-muted-foreground">
                      Choose diagnostic tests to order
                    </p>
                  </div>
                </div>
                {selectedTests.length > 0 && (
                  <div className="rounded-lg bg-primary/[0.06] px-3 py-1.5">
                    <span className="text-[13px] font-semibold text-primary">
                      {selectedTests.length} selected &bull; ₹{totalPrice.toFixed(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search tests by name or code..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    className="pl-9 text-[13px]"
                  />
                </div>
                <Select value={testCategory} onValueChange={setTestCategory}>
                  <SelectTrigger className="w-full sm:w-[180px] text-[13px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {Object.entries(TEST_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
                {filteredTests.length > 0 ? (
                  filteredTests.map((test) => {
                    const selected = selectedTests.includes(test.id);
                    return (
                      <label
                        key={test.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                          selected
                            ? 'border-primary/30 bg-primary/[0.03] ring-1 ring-primary/10'
                            : 'border-border/50 hover:border-border hover:bg-muted/30'
                        }`}
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleTest(test.id)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium leading-tight">{test.name}</p>
                          <p className="mt-0.5 text-[12px] text-muted-foreground">
                            <span className="font-mono">{test.code}</span> &bull; ₹
                            {Number(test.price).toFixed(0)}
                          </p>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="col-span-full py-8 text-center text-[13px] text-muted-foreground">
                    {tests ? 'No tests match your search' : 'Loading tests...'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Notes */}
        <FadeIn delay={0.15}>
          <Card className="rounded-xl border-border/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <StickyNote className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">Clinical Notes</h3>
                  <p className="text-[12px] text-muted-foreground">Optional notes for this visit</p>
                </div>
              </div>
              <Textarea
                placeholder="Add clinical notes, symptoms, or special instructions..."
                className="min-h-[100px] rounded-lg border-border/60 text-[14px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="flex justify-end gap-3 pb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-lg shadow-sm">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Visit & Order Tests
            </Button>
          </div>
        </FadeIn>
      </form>
    </PageTransition>
  );
}
