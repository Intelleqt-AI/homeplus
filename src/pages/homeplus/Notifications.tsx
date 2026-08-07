import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, BellOff, Mail, CheckCircle, Wrench, Star,
  Trash2, CheckCheck, SlidersHorizontal, AlertTriangle, Unlock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { fetchData, deleteData, postData } from '@/lib/Api';
import apiClient from '@/lib/apiClient';
import { toast } from '@/lib/toast';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Notification {
  id: string;
  type: string; // backend: new_quote | job_completed | job_status | bid_accepted | bid_rejected | new_review
  title: string;
  body: string;
  is_read: boolean;
  job_id: string | null;
  bid_id?: string | null;
  created_at: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

type TypeEntry = {
  Icon: React.ElementType;
  iconCls: string;
  badgeCls: string;
  label: string;
  cta?: string;
};

// Covers every type the backend can emit; unknown types fall back safely (no crash).
const TYPE_CONFIG: Record<string, TypeEntry> = {
  new_quote:     { Icon: Mail,        iconCls: 'text-blue-600 bg-blue-50',     badgeCls: 'bg-blue-100 text-blue-700',     label: 'New quote',    cta: 'View quotes' },
  lead_purchased:{ Icon: Unlock,      iconCls: 'text-indigo-600 bg-indigo-50', badgeCls: 'bg-indigo-100 text-indigo-700', label: 'Lead unlocked', cta: 'View quotes' },
  job_completed: { Icon: CheckCircle, iconCls: 'text-emerald-600 bg-emerald-50', badgeCls: 'bg-green-100 text-green-700',  label: 'Job complete', cta: 'Rate tradesperson' },
  job_status:    { Icon: Wrench,      iconCls: 'text-[#6B6B6B] bg-[#F5F5F0]',  badgeCls: 'bg-gray-100 text-gray-600',     label: 'Update',       cta: 'View job' },
  bid_accepted:  { Icon: CheckCircle, iconCls: 'text-emerald-600 bg-emerald-50', badgeCls: 'bg-green-100 text-green-700',  label: 'Accepted',     cta: 'View job' },
  bid_rejected:  { Icon: Bell,        iconCls: 'text-[#6B6B6B] bg-[#F5F5F0]',  badgeCls: 'bg-gray-100 text-gray-600',     label: 'Update',       cta: 'View job' },
  new_review:    { Icon: Star,        iconCls: 'text-amber-600 bg-amber-50',   badgeCls: 'bg-yellow-100 text-yellow-800', label: 'Review' },
};
const FALLBACK: TypeEntry = { Icon: Bell, iconCls: 'text-[#6B6B6B] bg-[#F5F5F0]', badgeCls: 'bg-gray-100 text-gray-600', label: 'Update' };

const cfgFor = (n: Notification): TypeEntry => TYPE_CONFIG[n.type] ?? FALLBACK;
// Every homeowner notification type is job-related → deep-link to job-leads when there's a job.
const targetFor = (n: Notification): string | null => (cfgFor(n).cta && n.job_id ? '/dashboard/job-leads' : null);

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [clearing, setClearing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<NotificationsResponse>({
    queryKey: ['ho-notifications'],
    queryFn: () => fetchData<NotificationsResponse>('/api/v1/notifications/').then(r => (r as { data?: NotificationsResponse })?.data ?? r),
  });

  const notifications = data?.notifications ?? [];
  const total = notifications.length;
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const visible = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ho-notifications'] });

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/v1/notifications/${id}/read/`),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => postData({ url: '/api/v1/notifications/read-all/' }),
    onSuccess: () => { invalidate(); toast.success('All caught up'); },
    onError: () => toast.error('Could not mark all as read'),
  });

  const deleteNotif = useMutation({
    mutationFn: (id: string) => deleteData({ url: `/api/v1/notifications/${id}/` }),
    onSuccess: invalidate,
    onError: () => toast.error('Could not remove notification'),
  });

  const openNotif = (n: Notification) => {
    if (!n.is_read) markRead.mutate(n.id);
    const target = targetFor(n);
    if (target) navigate(target);
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete all notifications? This cannot be undone.')) return;
    setClearing(true);
    try {
      await Promise.all(notifications.map(n => deleteData({ url: `/api/v1/notifications/${n.id}/` })));
      toast.success('All notifications cleared');
    } catch {
      toast.error('Could not clear all notifications');
    } finally {
      setClearing(false);
      invalidate();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* ── PageHeader ─────────────────────────────────────── */}
        <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Notifications</p>
            <h1 className="text-[26px] font-bold tracking-tight text-[#1A1A1A] mt-1 leading-none">Stay up to date</h1>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/dashboard/settings?tab=notifications"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E8E8E3] bg-white text-sm font-medium text-[#4A4A4A] hover:bg-[#F5F5F0] transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Preferences
            </Link>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1A1A1A] text-white text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-60"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* ── Filter tabs ────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-[#F5F5F0] p-1 rounded-full">
            {([['all', `All ${total}`], ['unread', `Unread ${unreadCount}`]] as [typeof filter, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 ${
                  filter === key ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#8B8B8B] hover:text-[#4A4A4A]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {total > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="text-xs text-[#9B9B9B] hover:text-red-500 transition-colors flex items-center gap-1 disabled:opacity-60"
            >
              <Trash2 className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        {/* ── List ───────────────────────────────────────────── */}
        <div className="bg-white rounded-[18px] border border-[#E8E8E3] overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-[#F5F5F0]">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-4 p-5 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F0] shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-[#F5F5F0] rounded w-1/3" />
                    <div className="h-3 bg-[#F5F5F0] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="bg-red-50 p-5 rounded-full mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-sm font-medium text-[#1A1A1A]">Couldn't load notifications</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Something went wrong fetching your updates.</p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 rounded-full bg-[#1A1A1A] text-white text-xs font-medium hover:bg-[#333] transition-colors"
              >
                Try again
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="bg-[#F5F5F0] p-5 rounded-full mb-4">
                <BellOff className="w-7 h-7 text-[#6B6B6B]" />
              </div>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {filter === 'unread' ? 'No unread notifications' : 'All caught up'}
              </p>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {filter === 'unread' ? "You're all read up." : 'Updates about quotes, jobs and reminders will appear here.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F5F5F0]">
              {visible.map(n => {
                const cfg = cfgFor(n);
                const { Icon } = cfg;
                const target = targetFor(n);
                return (
                  <div
                    key={n.id}
                    onClick={() => openNotif(n)}
                    className={`flex items-start gap-4 p-5 cursor-pointer hover:bg-[#FAFAF7] transition-colors group relative ${
                      !n.is_read ? 'bg-[#FFFBEB]' : ''
                    }`}
                  >
                    {!n.is_read && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cfg.iconCls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                        <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-[#1A1A1A]' : 'font-medium text-[#4A4A4A]'}`}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.badgeCls}`}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-[#9B9B9B] whitespace-nowrap">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      {n.body && <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">{n.body}</p>}
                      {target && cfg.cta && (
                        <button
                          onClick={e => { e.stopPropagation(); openNotif(n); }}
                          className="mt-1.5 text-xs font-medium text-[#1A1A1A] underline underline-offset-2 hover:no-underline"
                        >
                          {cfg.cta} →
                        </button>
                      )}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-[#E8E8E3] shrink-0 -mt-0.5"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#9B9B9B] hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
