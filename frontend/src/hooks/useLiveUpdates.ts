import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { env } from '@/config/env';
import { tokenStorage } from '@/services/token-storage';

/** Server events that mean lead data (pipeline cards, counts, dashboard) changed. */
const LEAD_EVENTS = ['lead:status-changed', 'lead:updated', 'message:received'];

/** Socket server origin: same as the API (an absolute VITE_API_BASE_URL), else this page's origin. */
const socketOrigin = () => (/^https?:\/\//.test(env.apiBaseUrl) ? new URL(env.apiBaseUrl).origin : undefined);

/**
 * Listens for live server events and refreshes lead queries, so a card the AI agents move
 * jumps columns straight away instead of on the next 20s poll (which stays as a backup).
 */
export function useLiveUpdates() {
  const qc = useQueryClient();

  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) return;
    const socket = io(socketOrigin() ?? '', { auth: { token }, transports: ['websocket', 'polling'] });
    let pending: ReturnType<typeof setTimeout> | undefined;
    // Agents often fire several events per lead in a row; refresh once per burst.
    const refresh = () => {
      clearTimeout(pending);
      pending = setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ['leads'] });
        void qc.invalidateQueries({ queryKey: ['dashboard'] });
      }, 300);
    };
    LEAD_EVENTS.forEach((e) => socket.on(e, refresh));
    return () => {
      clearTimeout(pending);
      socket.disconnect();
    };
  }, [qc]);
}
