'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { getErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, User, MapPin, Phone } from 'lucide-react';
import { PageTransition } from '@/components/shared/page-transition';
import { FadeIn } from '@/components/shared/animations';

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: '' as string,
    phone: '', email: '', address: '', city: '', state: '', pincode: '',
    bloodGroup: '', emergencyContactName: '', emergencyContactPhone: '',
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v));
      await api.post('/patients', payload);
      toast.success('Patient registered successfully');
      router.push('/dashboard/patients');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'h-10 rounded-lg border-border/60 text-[14px] focus-visible:ring-primary/20';
  const selectClass = 'h-10 rounded-lg border-border/60 text-[14px]';
  const labelClass = 'text-[13px] font-medium text-foreground/80';

  return (
    <PageTransition>
      <PageHeader title="Register New Patient" backHref="/dashboard/patients" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <FadeIn delay={0.05}>
          <Card className="rounded-xl border-border/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">Personal Information</h3>
                  <p className="text-[12px] text-muted-foreground">Basic patient demographics</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className={labelClass}>First Name *</Label>
                  <Input className={inputClass} value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Enter first name" required />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Last Name *</Label>
                  <Input className={inputClass} value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Enter last name" required />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Date of Birth *</Label>
                  <Input className={inputClass} type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Gender *</Label>
                  <Select value={form.gender} onValueChange={(v) => update('gender', v)}>
                    <SelectTrigger className={selectClass}><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Phone *</Label>
                  <Input className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" required />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Email</Label>
                  <Input className={inputClass} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="patient@example.com" />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Blood Group</Label>
                  <Select value={form.bloodGroup} onValueChange={(v) => update('bloodGroup', v)}>
                    <SelectTrigger className={selectClass}><SelectValue placeholder="Select blood group" /></SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Address */}
        <FadeIn delay={0.1}>
          <Card className="rounded-xl border-border/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">Address</h3>
                  <p className="text-[12px] text-muted-foreground">Patient residence details</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={labelClass}>Street Address</Label>
                  <Textarea className="min-h-[80px] rounded-lg border-border/60 text-[14px]" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="House no., street, area" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className={labelClass}>City</Label>
                    <Input className={inputClass} value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="City" />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>State</Label>
                    <Input className={inputClass} value={form.state} onChange={(e) => update('state', e.target.value)} placeholder="State" />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Pincode</Label>
                    <Input className={inputClass} value={form.pincode} onChange={(e) => update('pincode', e.target.value)} placeholder="6-digit pincode" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Emergency Contact */}
        <FadeIn delay={0.15}>
          <Card className="rounded-xl border-border/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/[0.06]">
                  <Phone className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">Emergency Contact</h3>
                  <p className="text-[12px] text-muted-foreground">Person to contact in case of emergency</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className={labelClass}>Contact Name</Label>
                  <Input className={inputClass} value={form.emergencyContactName} onChange={(e) => update('emergencyContactName', e.target.value)} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Contact Phone</Label>
                  <Input className={inputClass} value={form.emergencyContactPhone} onChange={(e) => update('emergencyContactPhone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="flex justify-end gap-3 pb-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-lg">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-lg shadow-sm">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Patient
            </Button>
          </div>
        </FadeIn>
      </form>
    </PageTransition>
  );
}
