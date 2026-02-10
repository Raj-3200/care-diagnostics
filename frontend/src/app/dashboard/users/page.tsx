'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import type { ApiResponse, User } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLE_LABELS } from '@/lib/constants';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, UserPlus, ShieldCheck, ShieldOff } from 'lucide-react';
import { PageTransition } from '@/components/shared/page-transition';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'RECEPTIONIST', phone: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<User[]>>(`/users?page=${page}&limit=20`);
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      await api.patch(`/users/${userId}`, { isActive: !isActive });
    },
    onSuccess: () => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleCreate = async () => {
    setLoading(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v));
      await api.post('/users', payload);
      toast.success('User created successfully');
      setCreateOpen(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'RECEPTIONIST', phone: '' });
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'User',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.06] text-[12px] font-semibold text-primary">
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-foreground">{row.firstName} {row.lastName}</p>
            <p className="text-[12px] text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (row) => (
        <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[12px] font-medium text-muted-foreground">
          {ROLE_LABELS[row.role]}
        </span>
      ),
    },
    {
      header: 'Phone',
      cell: (row) => <span className="text-muted-foreground">{row.phone || '\u2014'}</span>,
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.isActive ? 'default' : 'secondary'} className="text-[11px]">
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Last Login',
      cell: (row) => (
        <span className="text-[13px] text-muted-foreground">
          {row.lastLoginAt ? format(new Date(row.lastLoginAt), 'dd MMM yyyy, hh:mm a') : 'Never'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleActive.mutate({ userId: row.id, isActive: row.isActive })}
            disabled={toggleActive.isPending}
            className={`h-8 gap-1.5 rounded-lg text-[12px] ${
              row.isActive
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {row.isActive ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <PageHeader
        title="Users"
        description="Manage system users and access"
        action={{ label: 'New User', onClick: () => setCreateOpen(true), icon: <UserPlus className="h-4 w-4" /> }}
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="No users found"
        emptyDescription="Create users to give your team access to the system."
        pagination={{
          page,
          totalPages: data?.meta?.totalPages ?? 1,
          total: data?.meta?.total,
          onPageChange: setPage,
        }}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg">Create User</DialogTitle>
            <p className="text-[13px] text-muted-foreground">Add a new team member to the system.</p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[13px]">First Name *</Label>
                <Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} className="h-10 rounded-lg border-border/60 text-[14px]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Last Name *</Label>
                <Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} className="h-10 rounded-lg border-border/60 text-[14px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="h-10 rounded-lg border-border/60 text-[14px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Password *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="h-10 rounded-lg border-border/60 text-[14px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Role *</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger className="h-10 rounded-lg border-border/60 text-[14px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="h-10 rounded-lg border-border/60 text-[14px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-lg">Cancel</Button>
            <Button onClick={handleCreate} disabled={loading} className="rounded-lg">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
