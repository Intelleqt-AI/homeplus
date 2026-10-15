import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, BellOff, Mail, CheckCircle, Wrench, Star, MessageSquare, Check, FileCheck, ShieldCheck,
  Trash2, CheckCheck, SlidersHorizontal, AlertTriangle, Unlock, RefreshCw, Building2, Leaf,
} from 'lucide-react';
import { differenceInCalendarDays, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { fetchData, deleteData, postData } from '@/lib/Api';
import apiClient from '@/lib/apiClient';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useActiveProperty } from '@/hooks/useActiveProperty';

interface Notification {
  id: string;
  type: string; // backend TYPE_CHOICES in apps/notifications/models.py
  title: string;
  body: string;
  is_read: boolean;
  job_id: string | null;
  bid_id?: string | null;
  created_at: string;
  /** The job exists but has no property — such notifications show under every property. */
  job_unassigned?: boolean;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  /** Unread notifications that only show under the user's other properties. */
  unread_elsewhere?: number;
}

type Category = 'quotes' | 'messages' | 'jobs' | 'other';
type Filter = 'all' | 'unread' | Exclude<Category, 'other'>;

type TypeEntry = {
  Icon: React.ElementType;
  iconCls: string;
  badgeCls: string;
  label: string;
  category: Category;
  cta?: string;
};

// Covers every type the backend can emit; unknown types fall back safely (no crash).
const TYPE_CONFIG: Record<string, TypeEntry> = {
  new_quote:         { Icon: Mail,          iconCls: 'text-blue-600 bg-blue-50',       badgeCls: 'bg-blue-100 text-blue-700',     label: 'New quote',     category: 'quotes',   cta: 'View quotes' },
  quote_updated:     { Icon: RefreshCw,     iconCls: 'text-amber-600 bg-amber-50',     badgeCls: 'bg-amber-100 text-amber-800',   label: 'Quote updated', category: 'quotes',   cta: 'View quotes' },
  lead_purchased:    { Icon: Unlock,        iconCls: 'text-indigo-600 bg-indigo-50',   badgeCls: 'bg-indigo-100 text-indigo-700', label: 'Lead unlocked', category: 'quotes',   cta: 'View quotes' },
  new_message:       { Icon: MessageSquare, iconCls: 'text-sky-600 bg-sky-50',         badgeCls: 'bg-sky-100 text-sky-700',       label: 'Message',       category: 'messages', cta: 'Open chat' },
  job_completed:     { Icon: CheckCircle,   iconCls: 'text-emerald-600 bg-emerald-50', badgeCls: 'bg-green-100 text-green-700',   label: 'Job complete',  category: 'jobs',     cta: 'Rate tradesperson' },
  job_status:        { Icon: Wrench,        iconCls: 'text-muted-foreground bg-muted', badgeCls: 'bg-muted text-muted-foreground', label: 'Job update',   category: 'jobs',     cta: 'View job' },
  bid_accepted:      { Icon: CheckCircle,   iconCls: 'text-emerald-600 bg-emerald-50', badgeCls: 'bg-green-100 text-green-700',   label: 'Accepted',      category: 'jobs',     cta: 'View job' },
  bid_rejected:      { Icon: Bell,          iconCls: 'text-muted-foreground bg-muted', badgeCls: 'bg-muted text-muted-foreground', label: 'Declined',     category: 'jobs',     cta: 'View job' },
  new_review:        { Icon: Star,          iconCls: 'text-amber-600 bg-amber-50',     badgeCls: 'bg-yellow-100 text-yellow-800', label: 'Review',        category: 'jobs' },
  payment_success:   { Icon: CheckCircle,   iconCls: 'text-emerald-600 bg-emerald-50', badgeCls: 'bg-green-100 text-green-700',   label: 'Payment',       category: 'other' },
  payment_failed:    { Icon: AlertTriangle, iconCls: 'text-red-600 bg-red-50',         badgeCls: 'bg-red-100 text-red-700',       label: 'Payment failed', category: 'other' },
  document_reviewed: { Icon: FileCheck,     iconCls: 'text-emerald-600 bg-emerald-50', badgeCls: 'bg-green-100 text-green-700',   label: 'Document',      category: 'other' },
  epc_update:        { Icon: Leaf,          iconCls: 'text-emerald-600 bg-emerald-50', badgeCls: 'bg-green-100 text-green-700',   label: 'EPC',           category: 'other',    cta: 'View EPC' },
  account_verified:  { Icon: ShieldCheck,   iconCls: 'text-blue-600 bg-blue-50',       badgeCls: 'bg-blue-100 text-blue-700',     label: 'Account',       category: 'other' },
  certificate_upload: { Icon: FileCheck,    iconCls: 'text-amber-600 bg-amber-50',     badgeCls: 'bg-amber-100 text-amber-800',   label: 'Certificate',   category: 'jobs',     cta: 'Upload certificate' },
  prs_update:        { Icon: ShieldCheck,   iconCls: 'text-amber-600 bg-amber-50',     badgeCls: 'bg-amber-100 text-amber-800',   label: 'Rental register', category: 'other', cta: 'Open register' },
};
const FALLBACK: TypeEntry = { Icon: Bell, iconCls: 'text-muted-foreground bg-muted', badgeCls: 'bg-muted text-muted-foreground', label: 'Update', category: 'other' };

const cfgFor = (n: Notification): TypeEntry => TYPE_CONFIG[n.type] ?? FALLBACK;

// Message notifications are "<Sender>: <preview>" (apps/messaging/views.py).
const splitMessage = (n: Notification) => {
  const i = n.body.indexOf(': ');
  return i > 0 ? { sender: n.body.slice(0, i), preview: n.body.slice(i + 2) } : { sender: '', preview: n.body };
};

const targetFor = (n: Notification): string | null => {
  if (n.type === 'new_message') {
    if (!n.job_id) return '/dashboard/messages';
    const { sender } = splitMessage(n);
    return `/dashboard/messages?job=${n.job_id}${sender ? `&from=${encodeURIComponent(sender)}` : ''}`;
  }
  if (n.type === 'epc_update') return '/dashboard/energy';
  if (n.type === 'certificate_upload') return n.job_id ? `/dashboard/job-leads?job=${n.job_id}&upload=1` : '/dashboard/job-leads';
  if (n.type === 'prs_update') return '/dashboard/rental-register';
  return cfgFor(n).cta && n.job_id ? '/dashboard/job-leads' : null;
};

const sectionFor = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (differenceInCalendarDays(new Date(), d) <= 7) return 'This week';
  return 'Earlier';
};

// One rendered row: a single notification, or several messages from the same
// sender about the same job collapsed together. `lead` is the newest member.
type Row = { key: string; lead: Notification; items: Notification[] };

const groupItems = (list: Notification[]): Row[] => {
  const rows: Row[] = [];
  const byThread = new Map<string, Row>();
  for (const n of list) {
    if (n.type === 'new_message') {
      const threadKey = `${n.job_id ?? ''}|${splitMessage(n).sender}`;
      const existing = byThread.get(threadKey);
      if (existing) {
        existing.items.push(n);
        continue;
      }
      const row = { key: n.id, lead: n, items: [n] };
      byThread.set(threadKey, row);
      rows.push(row);
    } else {
      rows.push({ key: n.id, lead: n, items: [n] });
    }
  }
  return rows;
};

const EMPTY_COPY: Record<Filter, [string, string]> = {
  all: ['All caught up', 'Updates about quotes, jobs and messages will appear here.'],
  unread: ['No unread notifications', "You're all read up."],
  quotes: ['No quote updates yet', 'New quotes and unlocked leads will show up here.'],
  messages: ['No message notifications', 'When a tradesperson messages you, it shows up here.'],
  jobs: ['No job updates yet', 'Progress on your jobs and reviews will show up here.'],
};

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [clearing, setClearing] = useState(false);
  const { activePropertyId } = useActiveProperty();
  const propertyQs = activePropertyId ? `?property=${activePropertyId}` : '';

  const { data, isLoading, isError, refetch } = useQuery<NotificationsResponse>({
    queryKey: ['ho-notifications', activePropertyId],
    queryFn: () =>
      fetchData<NotificationsResponse>(`/api/v1/notifications/${propertyQs}`).then(
        r => (r as { data?: NotificationsResponse })?.data ?? r,
      ),
  });
  const unreadElsewhere = data?.unread_elsewhere ?? 0;

  const notifications = useMemo(() => data?.notifications ?? [], [data]);
  const total = notifications.length;
  const unread = notifications.filter(n => !n.is_read);
  const unreadCount = unread.length;

  const countIn = (list: Notification[], c: Category) => list.filter(n => cfgFor(n).category === c).length;

  const visible = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.is_read);
    return notifications.filter(n => cfgFor(n).category === filter);
  }, [notifications, filter]);

  const sections = useMemo(() => {
    const order: string[] = [];
    const buckets = new Map<string, Notification[]>();
    for (const n of visible) {
      const s = sectionFor(n.created_at);
      if (!buckets.has(s)) { buckets.set(s, []); order.push(s); }
      buckets.get(s)!.push(n);
    }
    return order.map(title => ({ title, rows: groupItems(buckets.get(title)!) }));
  }, [visible]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ho-notifications'] });

  const markIdsRead = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await Promise.all(ids.map(id => apiClient.patch(`/api/v1/notifications/${id}/read/`)));
    } catch {
      toast.error('Could not mark as read');
    } finally {
      invalidate();
    }
  };

  const deleteIds = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => deleteData({ url: `/api/v1/notifications/${id}/` })));
    } catch {
      toast.error('Could not remove notification');
    } finally {
      invalidate();
    }
  };

  const markAllRead = useMutation({
    mutationFn: () => postData({ url: `/api/v1/notifications/read-all/${propertyQs}` }),
    onSuccess: () => { invalidate(); toast.success('All caught up'); },
    onError: () => toast.error('Could not mark all as read'),
  });

  const unreadIds = (row: Row) => row.items.filter(n => !n.is_read).map(n => n.id);

  const openRow = (row: Row) => {
    void markIdsRead(unreadIds(row));
    const target = targetFor(row.lead);
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

  const tiles: { key: Filter; label: string; value: number }[] = [
    { key: 'unread', label: 'Unread', value: unreadCount },
    { key: 'quotes', label: 'New quotes', value: countIn(unread, 'quotes') },
    { key: 'messages', label: 'New messages', value: countIn(unread, 'messages') },
    { key: 'jobs', label: 'Job updates', value: countIn(unread, 'jobs') },
  ];

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: total },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'quotes', label: 'Quotes', count: countIn(notifications, 'quotes') },
    { key: 'messages', label: 'Messages', count: countIn(notifications, 'messages') },
    { key: 'jobs', label: 'Jobs', count: countIn(notifications, 'jobs') },
  ];

  const [emptyTitle, emptySub] = EMPTY_COPY[filter];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* ── PageHeader ─────────────────────────────────────── */}
        <div className="bg-card rounded-[18px] border border-border p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Notifications</p>
              <h1 className="text-[22px] xs:text-[26px] font-bold tracking-tight text-foreground mt-1 leading-tight">Stay up to date</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? 'Loading…' : `${unreadCount} unread · ${total} total`}
                {!isLoading && unreadElsewhere > 0 && (
                  <span className="text-amber-600">
                    {` · ${unreadElsewhere} unread in your other ${unreadElsewhere === 1 ? 'property' : 'properties'}`}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                to="/dashboard/settings?tab=notifications"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Preferences
              </Link>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-5">
            {tiles.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={cn(
                  'rounded-[14px] bg-muted p-3 sm:p-4 text-left transition-colors hover:bg-border/60',
                  filter === t.key && 'ring-2 ring-accent',
                )}
              >
                <p className="text-xs text-muted-foreground truncate">{t.label}</p>
                <p className={cn('text-xl sm:text-2xl font-semibold mt-1 leading-none', t.value > 0 ? 'text-amber-600' : 'text-foreground')}>
                  {t.value}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Filter chips ───────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1 bg-muted p-1 rounded-full overflow-x-auto min-w-0">
            {chips.map(c => (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200',
                  filter === c.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {c.label}
                <span className={cn('text-[11px] tabular-nums', filter === c.key ? 'text-muted-foreground' : 'opacity-70')}>{c.count}</span>
              </button>
            ))}
          </div>
          {total > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="shrink-0 text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 disabled:opacity-60"
            >
              <Trash2 className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        {/* ── List ───────────────────────────────────────────── */}
        {isLoading ? (
          <div className="bg-card rounded-[18px] border border-border divide-y divide-border">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4 p-5 animate-pulse">
                <div className="w-10 h-10 rounded-[12px] bg-muted shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-card rounded-[18px] border border-border py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="bg-red-50 p-5 rounded-full mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm font-medium text-foreground">Couldn't load notifications</p>
            <p className="text-xs text-muted-foreground mt-1">Something went wrong fetching your updates.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : sections.length === 0 ? (
          <div className="bg-card rounded-[18px] border border-border py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="bg-muted p-5 rounded-full mb-4">
              <BellOff className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
            <p className="text-xs text-muted-foreground mt-1">{emptySub}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {sections.map(section => (
              <section key={section.title}>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2 px-1">
                  {section.title}
                </h2>
                <div className="bg-card rounded-[18px] border border-border overflow-hidden divide-y divide-border">
                  {section.rows.map(row => (
                    <NotificationRow
                      key={row.key}
                      row={row}
                      onOpen={() => openRow(row)}
                      onMarkRead={() => markIdsRead(unreadIds(row))}
                      onDelete={() => deleteIds(row.items.map(n => n.id))}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const HOVER_REVEAL =
  'opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100';

function NotificationRow({ row, onOpen, onMarkRead, onDelete }: {
  row: Row;
  onOpen: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const { lead, items } = row;
  const cfg = cfgFor(lead);
  const { Icon } = cfg;
  const isUnread = items.some(n => !n.is_read);
  const isMessage = lead.type === 'new_message';
  const { sender, preview } = isMessage ? splitMessage(lead) : { sender: '', preview: lead.body };
  const title = isMessage && sender ? sender : lead.title;
  const target = targetFor(lead);

  return (
    <div
      onClick={onOpen}
      className="group relative flex items-start gap-3 sm:gap-4 px-4 py-4 sm:px-5 cursor-pointer transition-colors hover:bg-muted/40"
    >
      {isUnread && <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-accent" aria-hidden />}
      <div className={cn('w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0', cfg.iconCls)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <p className={cn('text-sm leading-snug min-w-0 [overflow-wrap:anywhere]', isUnread ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground')}>
              {title}
            </p>
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap', cfg.badgeCls)}>
              {items.length > 1 ? `${items.length} messages` : cfg.label}
            </span>
            {lead.job_unassigned && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-medium text-[#B45309]">
                <Building2 className="h-3 w-3" strokeWidth={1.75} />
                No property
              </span>
            )}
          </div>
          <span className="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground whitespace-nowrap mt-0.5">
            {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="Unread" />}
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </span>
        </div>
        {preview && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2 [overflow-wrap:anywhere] max-w-3xl">{preview}</p>
        )}
        {target && cfg.cta && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onOpen(); }}
            className="mt-2.5 inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
          >
            {cfg.cta} →
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0 -mr-1">
        {isUnread && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onMarkRead(); }}
            className={cn('p-1.5 rounded-full hover:bg-muted transition-opacity', HOVER_REVEAL)}
            aria-label="Mark as read"
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className={cn('p-1.5 rounded-full hover:bg-muted transition-opacity', HOVER_REVEAL)}
          aria-label={items.length > 1 ? `Delete ${items.length} notifications` : 'Delete notification'}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500 transition-colors" />
        </button>
      </div>
    </div>
  );
}

export default NotificationsPage;
