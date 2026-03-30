'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth-store';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

/**
 * Hook to manage WebSocket connection lifecycle.
 * Connects when user is authenticated, disconnects on logout.
 * Auto-invalidates React Query caches when domain events arrive.
 */
export function useWebSocket() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const handleDomainEvent = useCallback(
    (event: {
      type: string;
      entity: string;
      entityId: string;
      payload: Record<string, unknown>;
    }) => {
      // Invalidate relevant queries based on event entity
      const entity = event.entity?.toLowerCase();
      if (entity) {
        queryClient.invalidateQueries({ queryKey: [entity + 's'] });
        queryClient.invalidateQueries({ queryKey: [entity, event.entityId] });
      }

      // Also invalidate visits for cascading updates
      if (['sample', 'result', 'report'].includes(entity)) {
        queryClient.invalidateQueries({ queryKey: ['visits'] });
      }
    },
    [queryClient],
  );

  const handleNotification = useCallback(
    (notification: { title: string; message: string; type: string }) => {
      // Show real-time toast notification
      const toastFn =
        notification.type === 'error'
          ? toast.error
          : notification.type === 'warning'
            ? toast.warning
            : notification.type === 'success'
              ? toast.success
              : toast.info;
      toastFn(notification.title, { description: notification.message });

      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    [queryClient],
  );

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        socket = null;
      }
      return;
    }

    // Connect with credentials (cookies are sent)
    const s = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      console.log('[WS] Connected');
    });

    s.on('domain-event', handleDomainEvent);
    s.on('notification', handleNotification);

    // Role-specific queue updates
    s.on('queue-update', (data: { queue: string; count: number }) => {
      queryClient.invalidateQueries({ queryKey: [data.queue] });
    });

    s.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
    });

    socketRef.current = s;
    socket = s;

    return () => {
      s.disconnect();
      socketRef.current = null;
      socket = null;
    };
  }, [isAuthenticated, user, handleDomainEvent, handleNotification, queryClient]);

  return socketRef.current;
}
