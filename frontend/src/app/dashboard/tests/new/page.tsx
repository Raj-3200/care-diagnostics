'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { getErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TEST_CATEGORY_LABELS, SAMPLE_TYPE_LABELS } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2, FlaskConical, FileText } from 'lucide-react';
import { PageTransition } from '@/components/shared/page-transition';
import { FadeIn } from '@/components/shared/animations';

export default function NewTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    sampleType: '',
    price: '',
    turnaroundTime: '',
    department: '',
    instructions: '',
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const price = parseFloat(form.price);
      if (isNaN(price) || price < 0) {
        toast.error('Please enter a valid price');
        setLoading(false);
        return;
      }
      const payload = {
        ...Object.fromEntries(Object.entries(form).filter(([, v]) => v)),
        price,
      };
      await api.post('/tests', payload);
      toast.success('Test created successfully');
      router.push('/dashboard/tests');
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
      <PageHeader title="Create New Test" backHref="/dashboard/tests" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Details */}
        <FadeIn delay={0.05}>
          <Card className="rounded-xl border-border/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <FlaskConical className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">Test Details</h3>
                  <p className="text-[12px] text-muted-foreground">
                    Basic information about the diagnostic test
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className={labelClass}>Test Code *</Label>
                  <Input
                    className={inputClass}
                    placeholder="e.g., CBC001"
                    value={form.code}
                    onChange={(e) => update('code', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Test Name *</Label>
                  <Input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="e.g., Complete Blood Count"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => update('category', v)}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEST_CATEGORY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Sample Type *</Label>
                  <Select value={form.sampleType} onValueChange={(v) => update('sampleType', v)}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Select sample type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SAMPLE_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Price (₹) *</Label>
                  <Input
                    className={inputClass}
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => update('price', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Turnaround Time *</Label>
                  <Input
                    className={inputClass}
                    placeholder="e.g., 24 hours"
                    value={form.turnaroundTime}
                    onChange={(e) => update('turnaroundTime', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Department</Label>
                  <Input
                    className={inputClass}
                    value={form.department}
                    onChange={(e) => update('department', e.target.value)}
                    placeholder="e.g., Hematology"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Description & Instructions */}
        <FadeIn delay={0.1}>
          <Card className="rounded-xl border-border/40 shadow-sm">
            <CardContent className="pt-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">
                    Description & Instructions
                  </h3>
                  <p className="text-[12px] text-muted-foreground">
                    Additional details and patient preparation guidelines
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={labelClass}>Description</Label>
                  <Textarea
                    className="min-h-[80px] rounded-lg border-border/60 text-[14px]"
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="Brief description of the test..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Patient Instructions</Label>
                  <Textarea
                    className="min-h-[80px] rounded-lg border-border/60 text-[14px]"
                    placeholder="e.g., Fasting for 12 hours required"
                    value={form.instructions}
                    onChange={(e) => update('instructions', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.15}>
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
              Create Test
            </Button>
          </div>
        </FadeIn>
      </form>
    </PageTransition>
  );
}
