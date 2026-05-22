import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2, BellOff, Briefcase, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fetchData, deleteData, postData } from '@/lib/Api';
import apiClient from '@/lib/apiClient';

interface Notification {
  id: string;
  type: 'new_quote' | 'job_completed' | 'job_status';
  title: string;
  body: string;
  is_read: boolean;
  job_id: string | null;
  bid_id: string | null;
  created_at: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

const typeConfig = {
  new_quote: { icon: Briefcase, iconCls: 'text-blue-600 bg-blue-50', dotCls: 'bg-blue-500' },
  job_completed: { icon: CheckCircle, iconCls: 'text-emerald-600 bg-emerald-50', dotCls: 'bg-emerald-500' },
  job_status: { icon: Briefcase, iconCls: 'text-slate-600 bg-slate-50', dotCls: 'bg-slate-500' },
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery<NotificationsResponse>({
    queryKey: ['ho-notifications'],
    queryFn: () =>
      fetchData<any>('/api/v1/notifications/').then(r => r?.data ?? r),
    refetchInterval: 5 * 60 * 1000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/v1/notifications/${id}/read/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ho-notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => postData({ url: '/api/v1/notifications/read-all/' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ho-notifications'] }),
  });

  const deleteNotif = useMutation({
    mutationFn: (id: string) => deleteData({ url: `/api/v1/notifications/${id}/` }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ho-notifications'] }),
  });

  useLayoutEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + window.scrollY + 8, right: window.innerWidth - rect.right });
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(t) &&
        panelRef.current && !panelRef.current.contains(t)
      ) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const panel = open ? (
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: panelPos.top, right: panelPos.right, zIndex: 9999 }}
      className="w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-slate-700" />
          <span className="font-semibold text-slate-900 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors font-medium"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
        {notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-100 p-4 rounded-full mb-3">
              <BellOff className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">All caught up</p>
            <p className="text-xs text-slate-400 mt-1">No notifications yet.</p>
          </div>
        ) : (
          notifications.map(n => {
            const cfg = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.job_status;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                onClick={() => { if (!n.is_read) markRead.mutate(n.id); }}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group relative ${!n.is_read ? 'bg-primary/[0.03]' : ''}`}
              >
                {!n.is_read && (
                  <span className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${cfg.dotCls}`} />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.iconCls}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 transition-colors" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => { if (window.confirm('Delete all notifications?')) notifications.forEach(n => deleteNotif.mutate(n.id)); }}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Clear all
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(v => !v)}
        className={`relative p-2 rounded-full transition-colors ${open ? 'bg-[#F5F5F0]' : 'hover:bg-[#F5F5F0]'}`}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-[#4A4A4A]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {createPortal(panel, document.body)}
    </>
  );
};

export default NotificationBell;
