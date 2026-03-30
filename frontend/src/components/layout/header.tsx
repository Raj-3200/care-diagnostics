'use client';

import { useState } from 'react';
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
import { LogOut, Menu, Bell, Search, Command } from 'lucide-react';
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
    // Skip UUID-like segments – show "Details" instead
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
  };

  // Check exact match first
  if (map[pathname]) return map[pathname];

  // Check detail pages
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
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';

  return (
    <>
      <CommandPalette />
      <header className="flex h-16 items-center justify-between border-b border-border/50 bg-white px-4 lg:px-6">
        {/* Left: Mobile menu + Breadcrumb */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <MobileSidebar />
            </SheetContent>
          </Sheet>

          <div className="hidden lg:flex lg:flex-col lg:gap-0.5">
            {/* Breadcrumb */}
            {breadcrumbs.length > 1 && (
              <nav
                className="flex items-center gap-1 text-[12px] text-muted-foreground"
                aria-label="Breadcrumb"
              >
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
            <h1 className="text-[15px] font-semibold tracking-tight text-foreground">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Search trigger */}
          <button
            onClick={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                ctrlKey: true,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
            className="hidden items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted/50 sm:flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd className="ml-4 rounded border border-border/50 bg-white px-1 py-0.5 font-mono text-[10px] font-medium">
              Ctrl+K
            </kbd>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground sm:hidden"
            onClick={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                ctrlKey: true,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
          >
            <Search className="h-4 w-4" />
          </Button>

          <NotificationBell />

          <div className="ml-1.5 h-6 w-px bg-border/60" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2.5 px-2 hover:bg-muted/60">
                <Avatar className="h-8 w-8 border border-border/50">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-[13px] font-medium leading-none text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-none text-muted-foreground">
                    {user?.role ? ROLE_LABELS[user.role] : ''}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
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
