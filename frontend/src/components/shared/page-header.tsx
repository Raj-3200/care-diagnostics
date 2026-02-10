'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { FadeIn } from './animations';

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  action?: { label: string; href?: string; onClick?: () => void; icon?: React.ReactNode };
  children?: React.ReactNode;
}

export function PageHeader({ title, description, backHref, action, children }: PageHeaderProps) {
  const router = useRouter();

  return (
    <FadeIn>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {backHref && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(backHref)}
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 text-[14px] text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {children}
          {action && (
            <Button
              onClick={action.href ? () => router.push(action.href!) : action.onClick}
              className="h-9 gap-2 rounded-lg px-4 text-[13px] font-medium shadow-sm"
            >
              {action.icon || <Plus className="h-4 w-4" />}
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </FadeIn>
  );
}
