'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useState } from 'react';
import { useWebSocket } from './websocket';

function WebSocketInit() {
  useWebSocket();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketInit />
      {children}
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          className: 'shadow-lg border-border/50',
        }}
      />
    </QueryClientProvider>
  );
}
