'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step {
  label: string;
  status: string;
  description?: string;
}

interface WorkflowStepperProps {
  steps: Step[];
  currentStatus: string;
  className?: string;
}

export function WorkflowStepper({ steps, currentStatus, className }: WorkflowStepperProps) {
  const currentIndex = steps.findIndex((s) => s.status === currentStatus);

  return (
    <div className={cn('flex items-center gap-0', className)}>
      {steps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isCancelled = currentStatus === 'CANCELLED';

        return (
          <div key={step.status} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08, duration: 0.2 }}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-[12px] font-semibold transition-all duration-300',
                  isCompleted && 'border-emerald-500 bg-emerald-500 text-white',
                  isCurrent &&
                    !isCancelled &&
                    'border-primary bg-primary text-white shadow-md shadow-primary/20',
                  isCurrent && isCancelled && 'border-red-500 bg-red-500 text-white',
                  !isCompleted &&
                    !isCurrent &&
                    'border-border/60 bg-white text-muted-foreground/50',
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
              </motion.div>
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 + 0.1, duration: 0.2 }}
                className={cn(
                  'text-center text-[11px] font-medium leading-tight max-w-[80px]',
                  isCompleted && 'text-emerald-600',
                  isCurrent && !isCancelled && 'text-primary',
                  isCurrent && isCancelled && 'text-red-600',
                  !isCompleted && !isCurrent && 'text-muted-foreground/50',
                )}
              >
                {step.label}
              </motion.span>
            </div>
            {i < steps.length - 1 && (
              <div className="relative mx-1 mb-5 h-[2px] flex-1">
                <div className="absolute inset-0 rounded-full bg-border/40" />
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ delay: i * 0.08 + 0.15, duration: 0.3, ease: 'easeOut' }}
                  className="absolute inset-0 origin-left rounded-full bg-emerald-500"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
