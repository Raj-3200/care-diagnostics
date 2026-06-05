'use client';

import { useAuthStore } from '@/lib/auth-store';
import { ROLE_LABELS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { MobileSidebar } from './mobile-sidebar';
import { LogOut, Menu, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CommandPalette } from '@/components/shared/command-palette';
import { NotificationBell } from '@/components/shared/notification-bell';

// Generate breadcrumbs from pathname
function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const isId = /^[0-9a-f-]{36}$/i.test(segment) || /^c[a-z0-9]{20,}$/i.test(segment);
    const label = isId
      ? 'Details'
      : segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href: currentPath });
  }
  return crumbs;
}

// Map paths to page titles
function usePageTitle() {
  const pathname = usePathname();
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/patients': 'Patients',
    '/dashboard/patients/new': 'New Patient',
    '/dashboard/visits': 'Visits',
    '/dashboard/visits/new': 'New Visit',
    '/dashboard/tests': 'Test Catalog',
    '/dashboard/tests/new': 'New Test',
    '/dashboard/test-orders': 'Test Orders',
    '/dashboard/samples': 'Samples',
    '/dashboard/results': 'Results',
    '/dashboard/reports': 'Reports',
    '/dashboard/invoices': 'Invoices',
    '/dashboard/users': 'Users',
    '/dashboard/clients': 'Clients',
    '/dashboard/my-reports': 'My Reports',
    '/dashboard/my-patients': 'My Patients',
    '/dashboard/test-requests': 'Test Requests',
  };
  if (map[pathname]) return map[pathname];
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length >= 3) {
    const base = `/${segments[0]}/${segments[1]}`;
    if (map[base]) return `${map[base]} — Details`;
  }
  return 'Dashboard';
}

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const breadcrumbs = useBreadcrumbs();
  const pageTitle = usePageTitle();
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';

  return (
    <>
      <CommandPalette />
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-card px-3 sm:h-16 sm:px-4 lg:px-6">

        {/* Left: Mobile menu + Title */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <MobileSidebar />
            </SheetContent>
          </Sheet>

          {/* Breadcrumb + Title (desktop) */}
          <div className="hidden min-w-0 lg:flex lg:flex-col lg:gap-0.5">
            {breadcrumbs.length > 1 && (
              <nav className="flex items-center gap-1 text-[12px] text-muted-foreground" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.href} className="flex items-center gap-1">
                    {i > 0 && <span className="text-muted-foreground/40">/</span>}
                    {i === breadcrumbs.length - 1 ? (
                      <span className="font-medium text-foreground/70">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="transition-colors hover:text-foreground">
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            )}
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
              {pageTitle}
            </h1>
          </div>

          {/* Page title (mobile only) */}
          <h1 className="truncate text-[14px] font-semibold tracking-tight text-foreground lg:hidden">
            {pageTitle}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Search trigger — hidden on tiny screens */}
          <button
            onClick={() => {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
            }}
            className="hidden items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted/40 sm:flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="ml-1 hidden rounded border border-border/50 bg-background px-1 py-0.5 font-mono text-[10px] font-medium md:inline">
              Ctrl+K
            </kbd>
          </button>

          {/* Search icon only (mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground sm:hidden"
            onClick={() => {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
            }}
          >
            <Search className="h-4 w-4" />
          </Button>

          <NotificationBell />

          <div className="mx-1 h-5 w-px bg-border/60" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-8 items-center gap-2 px-1.5 hover:bg-muted/60 sm:px-2">
                <Avatar className="h-7 w-7 border border-border/50">
                  <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-[12px] font-medium leading-none text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">
                    {user?.role ? ROLE_LABELS[user.role] : ''}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
