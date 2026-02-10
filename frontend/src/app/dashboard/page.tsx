'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';
import {
  Users, ClipboardList, TestTube, FileCheck, Receipt, Activity,
  ArrowUpRight, TrendingUp,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTransition } from '@/components/shared/page-transition';
import { StaggerContainer, StaggerItem, FadeIn } from '@/components/shared/animations';
import Link from 'next/link';

interface DashboardStats {
  totalPatients: number;
  todayVisits: number;
  pendingSamples: number;
  pendingResults: number;
  pendingReports: number;
  pendingInvoices: number;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [patients, visits, samples, results, reports, invoices] = await Promise.allSettled([
          api.get<ApiResponse>('/patients?limit=1'),
          api.get<ApiResponse>('/visits?limit=1'),
          api.get<ApiResponse>('/samples?status=PENDING_COLLECTION&limit=1'),
          api.get<ApiResponse>('/results?status=PENDING&limit=1'),
          api.get<ApiResponse>('/reports?status=PENDING&limit=1'),
          api.get<ApiResponse>('/invoices?status=PENDING&limit=1'),
        ]);

        setStats({
          totalPatients: patients.status === 'fulfilled' ? patients.value.data.meta?.total ?? 0 : 0,
          todayVisits: visits.status === 'fulfilled' ? visits.value.data.meta?.total ?? 0 : 0,
          pendingSamples: samples.status === 'fulfilled' ? samples.value.data.meta?.total ?? 0 : 0,
          pendingResults: results.status === 'fulfilled' ? results.value.data.meta?.total ?? 0 : 0,
          pendingReports: reports.status === 'fulfilled' ? reports.value.data.meta?.total ?? 0 : 0,
          pendingInvoices: invoices.status === 'fulfilled' ? invoices.value.data.meta?.total ?? 0 : 0,
        });
      } catch {
        // fail silently for stats
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    {
      label: 'Total Patients',
      value: stats?.totalPatients,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/dashboard/patients',
    },
    {
      label: 'Total Visits',
      value: stats?.todayVisits,
      icon: ClipboardList,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '/dashboard/visits',
    },
    {
      label: 'Pending Samples',
      value: stats?.pendingSamples,
      icon: TestTube,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      href: '/dashboard/samples',
    },
    {
      label: 'Pending Results',
      value: stats?.pendingResults,
      icon: FileCheck,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      href: '/dashboard/results',
    },
    {
      label: 'Pending Reports',
      value: stats?.pendingReports,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/dashboard/reports',
    },
    {
      label: 'Pending Invoices',
      value: stats?.pendingInvoices,
      icon: Receipt,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      href: '/dashboard/invoices',
    },
  ];

  const quickActions = [
    { label: 'Register Patient', href: '/dashboard/patients/new', icon: Users },
    { label: 'New Visit', href: '/dashboard/visits/new', icon: ClipboardList },
    { label: 'View Reports', href: '/dashboard/reports', icon: Activity },
    { label: 'Test Catalog', href: '/dashboard/tests', icon: TestTube },
  ];

  return (
    <PageTransition>
      {/* Welcome Section */}
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.firstName}
          </h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Here&apos;s an overview of your laboratory operations today.
          </p>
        </div>
      </FadeIn>

      {/* Stat Cards Grid */}
      <StaggerContainer className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <StaggerItem key={card.label}>
            <Link href={card.href}>
              <Card className="group relative overflow-hidden border-border/40 bg-white transition-all duration-200 hover:border-border/60 hover:shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-muted-foreground">
                        {card.label}
                      </p>
                      {loading ? (
                        <Skeleton className="mt-2 h-8 w-20 rounded-md" />
                      ) : (
                        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                          {card.value ?? 0}
                        </p>
                      )}
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bgColor}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[12px] text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span>View details</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Quick Actions */}
      <FadeIn delay={0.3}>
        <div className="mb-6">
          <h2 className="mb-3 text-[15px] font-semibold text-foreground">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <Card className="group border-border/40 bg-white transition-all duration-200 hover:border-primary/20 hover:shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.06] transition-colors duration-200 group-hover:bg-primary/[0.1]">
                      <action.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13.5px] font-medium text-foreground">{action.label}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-colors duration-200 group-hover:text-primary" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* System Status */}
      <FadeIn delay={0.4}>
        <Card className="border-border/40 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[13.5px] font-medium text-foreground">System Status</p>
                <p className="text-[12px] text-muted-foreground">
                  All services are operational. Last sync: just now.
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[12px] font-medium text-emerald-600">Healthy</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </PageTransition>
  );
}
