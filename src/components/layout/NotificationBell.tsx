import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Bell, BellOff, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { deleteData, postData } from '@/lib/Api';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { useBellNotifications } from '@/hooks/useBellNotifications';
import { cfgFor, groupItems, splitMessage, targetFor, type NotificationRow } from '@/lib/notifications';

/** Rows the dropdown shows before pointing at the full page. */
const PREVIEW_ROWS = 8;
const PANEL_WIDTH = 384;

/**
 * The bell at the top of the sidebar (and in the mobile top bar): a quick look at the
 * latest notifications. The full list, filters and bulk actions stay on the
 * Notifications page, linked from the panel's footer. Icons, click targets and the
 * cached list are shared with that page (lib/notifications).
 */
const NotificationBell = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, propertyId } = useBellNotifications();
  const notifications = useMemo(() => data?.notifications ?? [], [data]);
  const unreadCount = data?.unread_count ?? 0;
  const rows = useMemo(() => groupItems(notifications), [notifications]);
  const shown = rows.slice(0, PREVIEW_ROWS);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ho-notifications'] });

  const markRead = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => apiClient.patch(`/api/v1/notifications/${id}/read/`))),
    onSettled: invalidate,
  });
  const markAllRead = useMutation({
    mutationFn: () => postData({ url: `/api/v1/notifications/read-all/${propertyId ? `?property=${propertyId}` : ''}` }),
    onSettled: invalidate,
  });
  const remove = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => deleteData({ url: `/api/v1/notifications/${id}/` }))),
    onSettled: invalidate,
  });

  // Opening a row reads every notification it stands for (a message thread can be
  // several) and goes where the page would go.
  const openRow = (row: NotificationRow) => {
    const unread = row.items.filter(n => !n.is_read).map(n => n.id);
    if (unread.length) markRead.mutate(unread);
    const target = targetFor(row.lead);
    if (target) {
      setOpen(false);
      navigate(target);
    }
  };

  // Anchor the panel under the bell: from its left edge when there is room (the
  // sidebar), else pulled in from the right edge of the screen (the mobile top bar).
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.min(PANEL_WIDTH, window.innerWidth - 16);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      setPanelPos({ top: rect.bottom + 8, left });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  // Close on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const panel = open ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      style={{ position: 'fixed', top: panelPos.top, left: panelPos.left, zIndex: 9999 }}
      className="w-[calc(100vw-1rem)] max-w-96 bg-card text-foreground rounded-2xl shadow-2xl border border-border overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[min(420px,60dvh)] overflow-y-auto divide-y divide-border">
        {shown.length === 0 ? (
          <div className="py-10 px-6 flex flex-col items-center justify-center text-center">
            <div className="bg-muted p-3.5 rounded-full mb-3">
              <BellOff className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">All caught up</p>
            <p className="text-xs text-muted-foreground mt-1">Updates about quotes, jobs and messages will appear here.</p>
          </div>
        ) : (
          shown.map(row => {
            const n = row.lead;
            const cfg = cfgFor(n);
            const Icon = cfg.Icon;
            const unread = row.items.some(i => !i.is_read);
            const isMessage = n.type === 'new_message';
            const { sender, preview } = splitMessage(n);
            const title = isMessage && sender ? sender : n.title;
            const body = isMessage
              ? (row.items.length > 1 ? `${row.items.length} messages · ${preview}` : preview)
              : n.body;
            return (
              <div
                key={row.key}
                className={cn('group relative flex items-start gap-2 px-4 py-3 transition-colors hover:bg-muted/60', unread && 'bg-accent/[0.06]')}
              >
                {unread && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent" />}
                <button type="button" onClick={() => openRow(row)} className="flex flex-1 min-w-0 items-start gap-3 text-left">
                  <span className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', cfg.iconCls)}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={cn('block text-sm leading-snug', unread ? 'font-semibold' : 'font-medium text-foreground/80')}>
                      {title}
                    </span>
                    {body && (
                      <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{body}</span>
                    )}
                    <span className="block text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Remove notification"
                  onClick={() => remove.mutate(row.items.map(i => i.id))}
                  className="opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <Link
        to="/dashboard/notifications"
        onClick={() => setOpen(false)}
        className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-border bg-muted/40 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
      >
        View all notifications
        {rows.length > PREVIEW_ROWS && <span className="font-medium text-muted-foreground">({rows.length})</span>}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'relative p-2 rounded-full transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          open && 'bg-sidebar-accent text-sidebar-accent-foreground',
        )}
      >
        <Bell className="w-5 h-5" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none ring-2 ring-sidebar">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {createPortal(panel, document.body)}
    </>
  );
};

export default NotificationBell;
