'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import type { ApiResponse, Patient } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';
import { PageTransition } from '@/components/shared/page-transition';

export default function MyPatientsPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '' as string,
    phone: '',
    email: '',
    bloodGroup: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['my-patients', page],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Patient[]>>(
        `/clients/me/patients?page=${page}&limit=20`,
      );
      return data;
    },
  });

  const handleCreate = async () => {
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        phone: form.phone,
      };
      if (form.email) payload.email = form.email;
      if (form.bloodGroup) payload.bloodGroup = form.bloodGroup;

      await api.post('/patients', payload);
      toast.success('Patient registered successfully');
      setCreateOpen(false);
      setForm({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        bloodGroup: '',
      });
      qc.invalidateQueries({ queryKey: ['my-patients'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Patient>[] = [
    {
      header: 'Patient',
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
            <p className="text-[12px] text-muted-foreground">{row.mrn}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Gender',
      cell: (row) => <span className="text-[13px] text-muted-foreground">{row.gender}</span>,
    },
    {
      header: 'Phone',
      cell: (row) => <span className="text-[13px] text-muted-foreground">{row.phone}</span>,
    },
    {
      header: 'Date of Birth',
      cell: (row) => (
        <span className="text-[13px] text-muted-foreground">
          {format(new Date(row.dateOfBirth), 'dd MMM yyyy')}
        </span>
      ),
    },
    {
      header: 'Blood Group',
      cell: (row) => (
        <span className="text-[13px] text-muted-foreground">{row.bloodGroup || '\u2014'}</span>
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
        title="My Patients"
        description="Register and manage patients from your organization"
        action={{
          label: 'Register Patient',
          onClick: () => setCreateOpen(true),
          icon: <UserPlus className="h-4 w-4" />,
        }}
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="No patients yet"
        emptyDescription="Register your first patient to get started."
        pagination={{
          page,
          totalPages: data?.meta?.totalPages ?? 1,
          total: data?.meta?.total,
          onPageChange: setPage,
        }}
      />

      {/* Register Patient Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-lg">Register Patient</DialogTitle>
            <p className="text-[13px] text-muted-foreground">
              Add a new patient. They will be linked to your organization automatically.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">First Name *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  className="h-10 rounded-lg border-border/60 text-[14px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Last Name *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  className="h-10 rounded-lg border-border/60 text-[14px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Date of Birth *</Label>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  className="h-10 rounded-lg border-border/60 text-[14px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Gender *</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}
                >
                  <SelectTrigger className="h-10 rounded-lg border-border/60 text-[14px]">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Phone (10 digits) *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="9876543210"
                  className="h-10 rounded-lg border-border/60 text-[14px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="h-10 rounded-lg border-border/60 text-[14px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Blood Group</Label>
              <Select
                value={form.bloodGroup}
                onValueChange={(v) => setForm((p) => ({ ...p, bloodGroup: v }))}
              >
                <SelectTrigger className="h-10 rounded-lg border-border/60 text-[14px]">
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                loading ||
                !form.firstName ||
                !form.lastName ||
                !form.dateOfBirth ||
                !form.gender ||
                !form.phone
              }
              className="rounded-lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
