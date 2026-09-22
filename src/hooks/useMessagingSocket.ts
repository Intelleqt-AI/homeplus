import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { BASE_URL } from '@/lib/apiClient';
import { CONVERSATIONS_URL, getMessagesUrl } from '@/lib/messaging';

const MAX_BACKOFF_MS = 30000;
// Consecutive attempts that closed without ever opening — e.g. every handshake
// getting rejected (403) because the session is invalid. Capped so a stale/
// invalid auth state can't retry forever; resets to 0 on any successful open,
// so a real mid-session drop keeps reconnecting exactly as before.
const MAX_FAILED_ATTEMPTS = 5;

function buildWsUrl(): string {
  const httpBase = BASE_URL || window.location.origin;
  return `${httpBase.replace(/^http/, 'ws')}/ws/messaging/`;
}

/**
 * Real-time "wake up now" signal for chat. On any inbound event this just
 * invalidates the exact same React Query keys the app's own mutations
 * already invalidate — no new data model, no rendering path other than the
 * existing REST fetch + existing components. If the socket is down, the
 * app is exactly as reliable as before this hook existed: `ChatPanel`'s own
 * 8s/20s polling is the fallback, unchanged.
 */
export function useMessagingSocket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const closedByUsRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failedAttemptsRef = useRef(0);

  useEffect(() => {
    if (!user) return undefined;
    closedByUsRef.current = false;

    const connect = () => {
      const ws = new WebSocket(buildWsUrl());
      socketRef.current = ws;

      ws.onopen = () => {
        backoffRef.current = 1000;
        failedAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        let msg: { type?: string; payload?: Record<string, unknown> };
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        const type = msg?.type;
        const payload = msg?.payload ?? {};

        if (type === 'message.new' || type === 'message.edited' || type === 'message.deleted') {
          const conversationId = payload.conversation_id as string | undefined;
          if (conversationId) {
            queryClient.invalidateQueries({ queryKey: [getMessagesUrl(conversationId)] });
          }
          queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_URL] });
        } else if (type === 'conversation.updated') {
          queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_URL] });
          const conversationId = (payload.conversation as { id?: string } | undefined)?.id;
          if (conversationId) {
            queryClient.invalidateQueries({ queryKey: [getMessagesUrl(conversationId)] });
          }
        }
      };

      ws.onclose = () => {
        if (closedByUsRef.current) return;
        failedAttemptsRef.current += 1;
        if (failedAttemptsRef.current > MAX_FAILED_ATTEMPTS) return;
        reconnectTimerRef.current = setTimeout(connect, backoffRef.current);
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      closedByUsRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [user, queryClient]);
}
