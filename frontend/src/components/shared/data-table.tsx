'use client';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { FadeIn } from './animations';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    total?: number;
  };
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  pagination,
  onRowClick,
  emptyMessage = 'No records found',
  emptyDescription = 'Try adjusting your search or filters to find what you\'re looking for.',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border/50 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className="h-11 bg-[#F8FAFC] text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="border-border/30">
                {columns.map((_, j) => (
                  <TableCell key={j} className="py-3.5">
                    <Skeleton className="h-4 w-full max-w-[180px] rounded-md" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <FadeIn delay={0.1}>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className={`h-11 bg-[#F8FAFC] text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/70 ${col.className || ''}`}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                      <Inbox className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-[14px] font-medium text-foreground/70">
                      {emptyMessage}
                    </p>
                    <p className="max-w-[300px] text-[13px] text-muted-foreground">
                      {emptyDescription}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={i}
                  className={`border-border/30 transition-colors duration-100 ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-[#F8FAFC]'
                      : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, j) => (
                    <TableCell
                      key={j}
                      className={`py-3 text-[13.5px] ${col.className || ''}`}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                          ? String((row as Record<string, unknown>)[col.accessorKey as string] ?? '')
                          : ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">
            {pagination.total !== undefined && (
              <><span className="font-medium text-foreground">{pagination.total}</span> total records</>
            )}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="h-8 w-8 rounded-lg border-border/50 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-8 items-center gap-1 rounded-lg border border-border/50 bg-white px-3">
              <span className="text-[13px] font-medium">{pagination.page}</span>
              <span className="text-[13px] text-muted-foreground">of</span>
              <span className="text-[13px] font-medium">{pagination.totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="h-8 w-8 rounded-lg border-border/50 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </FadeIn>
  );
}
