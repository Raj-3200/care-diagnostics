'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import type { ApiResponse, Patient, Visit } from '@/types';
import {
  Search,
  Users,
  ClipboardList,
  FlaskConical,
  TestTube,
  FileCheck,
  FileOutput,
  Receipt,
  Shield,
  LayoutDashboard,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  type: 'page' | 'patient' | 'visit';
  label: string;
  description?: string;
  href: string;
  icon: React.ReactNode;
}

const PAGES: SearchResult[] = [
  {
    type: 'page',
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    type: 'page',
    label: 'Patients',
    description: 'View all patients',
    href: '/dashboard/patients',
    icon: <Users className="h-4 w-4" />,
  },
  {
    type: 'page',
    label: 'Register Patient',
    description: 'Create new patient',
    href: '/dashboard/patients/new',
    icon: <Users className="h-4 w-4" />,
  },
  {
    type: 'page',
    label: 'Visits',
    description: 'View all visits',
    href: '/dashboard/visits',
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    type: 'page',
    label: 'New Visit',
    description: 'Create a new visit',
    href: '/dashboard/visits/new',
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    type: 'page',
    label: 'Test Catalog',
    description: 'Browse tests',
    href: '/dashboard/tests',
    icon: <FlaskConical className="h-4 w-4" />,
  },
  {
    type: 'page',
    label: 'Test Orders',
    description: 'View test orders',
    href: '/dashboard/test-orders',
    icon: <FlaskConical className="h-4 w-4" />,
  },
  {
    type: 'page',
    label: 'Samples',
    description: 'Track samples',
    href: '/dashboard/samples',
    icon: <TestTube className="h-4 w-4" />,
  },
  {
    type: 'page',
    label: 'Results',
    description: 'Manage results',
    href: '/dashboard/results',
    icon: <FileCheck className="h-4 w-4" />,
  },
  {
    type: 'page',
    label: 'Reports',
    description: 'View reports',
    href: '/dashboard/reports',
    icon: <FileOutput className="h-4 w-4" />,
  },
  {
    type: 'page',
    label: 'Invoices',
    description: 'Billing & invoices',
    href: '/dashboard/invoices',
    icon: <Receipt className="h-4 w-4" />,
  },
  {
    type: 'page',
    label: 'Users',
    description: 'Manage users',
    href: '/dashboard/users',
    icon: <Shield className="h-4 w-4" />,
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Ctrl+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const search = useCallback(async (q: string) => {
    const lower = q.toLowerCase().trim();
    if (!lower) {
      setResults(PAGES.slice(0, 6));
      setSearching(false);
      return;
    }

    // Filter pages
    const pageResults = PAGES.filter(
      (p) => p.label.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower),
    );

    setResults(pageResults);
    setSelectedIndex(0);

    // Search patients & visits from API if query >= 2 chars
    if (lower.length >= 2) {
      setSearching(true);
      try {
        const [patientsRes, visitsRes] = await Promise.allSettled([
          api.get<ApiResponse<Patient[]>>(`/patients?searchTerm=${encodeURIComponent(q)}&limit=5`),
          api.get<ApiResponse<Visit[]>>(`/visits?limit=5`),
        ]);

        const apiResults: SearchResult[] = [];

        if (patientsRes.status === 'fulfilled' && patientsRes.value.data.data) {
          for (const p of patientsRes.value.data.data) {
            apiResults.push({
              type: 'patient',
              label: `${p.firstName} ${p.lastName}`,
              description: `MRN: ${p.mrn} · ${p.phone || ''}`,
              href: `/dashboard/patients/${p.id}`,
              icon: <Users className="h-4 w-4" />,
            });
          }
        }

        if (visitsRes.status === 'fulfilled' && visitsRes.value.data.data) {
          for (const v of visitsRes.value.data.data) {
            if (
              v.visitNumber?.toLowerCase().includes(lower) ||
              v.patient?.firstName?.toLowerCase().includes(lower) ||
              v.patient?.lastName?.toLowerCase().includes(lower)
            ) {
              apiResults.push({
                type: 'visit',
                label: `Visit ${v.visitNumber}`,
                description: v.patient ? `${v.patient.firstName} ${v.patient.lastName}` : '',
                href: `/dashboard/visits/${v.id}`,
                icon: <ClipboardList className="h-4 w-4" />,
              });
            }
          }
        }

        setResults((prev) => [...prev, ...apiResults]);
      } catch {
        // Silently fail
      } finally {
        setSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => search(query), 200);
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, open, search]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      search('');
    }
  }, [open, search]);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    router.push(result.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  }

  const groupedResults = {
    pages: results.filter((r) => r.type === 'page'),
    patients: results.filter((r) => r.type === 'patient'),
    visits: results.filter((r) => r.type === 'visit'),
  };

  let globalIndex = -1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[20%] translate-y-0 overflow-hidden rounded-xl border-border/50 p-0 shadow-2xl sm:max-w-[520px]"
        showCloseButton={false}
      >
        <div className="flex items-center border-b border-border/40 px-4">
          <Search className="h-4 w-4 text-muted-foreground/60" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, patients, visits..."
            className="h-12 border-0 bg-transparent text-[14px] shadow-none focus-visible:ring-0"
            autoFocus
          />
          {searching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />}
          <kbd className="ml-2 hidden rounded-md border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-2">
          {results.length === 0 && !searching && query && (
            <div className="py-8 text-center text-[13px] text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {groupedResults.pages.length > 0 && (
            <div className="mb-1">
              <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Pages
              </p>
              {groupedResults.pages.map((result) => {
                globalIndex++;
                const idx = globalIndex;
                return (
                  <button
                    key={result.href}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      selectedIndex === idx
                        ? 'bg-primary/[0.08] text-primary'
                        : 'text-foreground hover:bg-muted/50',
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                      {result.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium">{result.label}</p>
                      {result.description && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                  </button>
                );
              })}
            </div>
          )}

          {groupedResults.patients.length > 0 && (
            <div className="mb-1">
              <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Patients
              </p>
              {groupedResults.patients.map((result) => {
                globalIndex++;
                const idx = globalIndex;
                return (
                  <button
                    key={result.href}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      selectedIndex === idx
                        ? 'bg-primary/[0.08] text-primary'
                        : 'text-foreground hover:bg-muted/50',
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      {result.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium">{result.label}</p>
                      {result.description && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                  </button>
                );
              })}
            </div>
          )}

          {groupedResults.visits.length > 0 && (
            <div className="mb-1">
              <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Visits
              </p>
              {groupedResults.visits.map((result) => {
                globalIndex++;
                const idx = globalIndex;
                return (
                  <button
                    key={result.href}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      selectedIndex === idx
                        ? 'bg-primary/[0.08] text-primary'
                        : 'text-foreground hover:bg-muted/50',
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      {result.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium">{result.label}</p>
                      {result.description && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-4 py-2">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border/40 bg-white px-1 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>{' '}
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border/40 bg-white px-1 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>{' '}
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border/40 bg-white px-1 py-0.5 font-mono text-[10px]">
                esc
              </kbd>{' '}
              close
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
