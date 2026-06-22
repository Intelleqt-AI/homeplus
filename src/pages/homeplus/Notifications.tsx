import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Briefcase, CheckCheck, CheckCircle, Trash2, SlidersHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { fetchData, deleteData, postData } from '@/lib/Api';
import apiClient from '@/lib/apiClient';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Notification {
  id: string;
  type: 'new_quote' | 'job_completed' | 'job_status' | 'task_reminder' | 'compliance';
  title: string;
  body: string;
  is_read: boolean;
  job_id: string | null;
  created_at: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

const typeConfig = {
  new_quote: { icon: Briefcase, iconCls: 'text-blue-600 bg-blue-50', label: 'New Quote', badgeCls: 'bg-blue-100 text-blue-700' },
  job_completed: { icon: CheckCircle, iconCls: 'text-emerald-600 bg-emerald-50', label: 'Job Update', badgeCls: 'bg-green-100 text-green-700' },
  job_status: { icon: Bell, iconCls: 'text-[#6B6B6B] bg-[#F5F5F0]', label: 'Update', badgeCls: 'bg-gray-100 text-gray-600' },
  task_reminder: { icon: Bell, iconCls: 'text-yellow-600 bg-yellow-50', label: 'Reminder', badgeCls: 'bg-yellow-100 text-yellow-700' },
  compliance: { icon: CheckCircle, iconCls: 'text-red-600 bg-red-50', label: 'Compliance', badgeCls: 'bg-red-100 text-red-700' },
};

function getNotifAction(n: Notification): { label: string; path: string } | null {
  if (n.type === 'new_quote' && n.job_id) return { label: 'View Quotes', path: '/dashboard/job-leads' };
  if (n.type === 'job_completed' && n.job_id) return { label: 'Rate Tradesman', path: '/dashboard/job-leads' };
  if (n.type === 'task_reminder') return { label: 'View Task', path: '/dashboard/calendar' };
  if (n.type === 'compliance') return { label: 'Get Quotes', path: '/dashboard/job-leads' };
  return null;
}

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['ho-notifications'],
    queryFn: () => fetchData<any>('/api/v1/notifications/').then(r => r?.data ?? r),
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header card — matches Settings/JobLeads pattern */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[#6B6B6B] text-sm mb-0.5">Stay up to date</p>
                <h1 className="text-[#1A1A1A] text-2xl font-semibold">Notifications</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard/settings?tab=notifications"
                className="flex items-center gap-1.5 text-xs font-medium text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors px-3 py-1.5 bg-[#F5F5F0] rounded-full border border-[#E8E8E3] hover:bg-[#E8E8E3]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Preferences
              </Link>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors px-3 py-1.5 bg-[#F5F5F0] rounded-full border border-[#E8E8E3] hover:bg-[#E8E8E3]"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Notification list */}
        <div className="bg-white rounded-[20px] border border-[#E8E8E3] overflow-hidden">
          {isLoading ? (
            <div className="space-y-px">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 p-5 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F0] shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-[#F5F5F0] rounded w-1/3" />
                    <div className="h-3 bg-[#F5F5F0] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="bg-[#F5F5F0] p-5 rounded-full mb-4">
                <BellOff className="w-7 h-7 text-[#6B6B6B]" />
              </div>
              <p className="text-sm font-medium text-[#1A1A1A]">All caught up</p>
              <p className="text-xs text-[#6B6B6B] mt-1">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F5F5F0]">
              {notifications.map(n => {
                const cfg = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.job_status;
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.is_read) markRead.mutate(n.id); }}
                    className={`flex items-start gap-4 p-5 cursor-pointer hover:bg-[#F5F5F0] transition-colors group relative ${
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
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-[#1A1A1A]' : 'font-medium text-[#4A4A4A]'}`}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          {cfg.badgeCls && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.badgeCls}`}>
                              {cfg.label}
                            </span>
                          )}
                          <span className="text-[10px] text-[#9B9B9B]">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">{n.body}</p>
                      {(() => {
                        const action = getNotifAction(n);
                        return action ? (
                          <button
                            onClick={e => { e.stopPropagation(); if (!n.is_read) markRead.mutate(n.id); navigate(action.path); }}
                            className="mt-1.5 text-xs font-medium text-[#1A1A1A] underline underline-offset-2 hover:no-underline"
                          >
                            {action.label} →
                          </button>
                        ) : null;
                      })()}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-[#E8E8E3] shrink-0 -mt-0.5"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#9B9B9B] hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={() => { if (window.confirm('Delete all notifications?')) notifications.forEach(n => deleteNotif.mutate(n.id)); }}
              className="text-xs text-[#9B9B9B] hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Clear all
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
