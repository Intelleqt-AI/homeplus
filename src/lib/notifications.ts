import type { ElementType } from 'react';
import {
  AlertTriangle, Bell, CheckCircle, FileCheck, Leaf, Mail, MessageSquare, RefreshCw, ShieldCheck, Star, Unlock, Wrench,
} from 'lucide-react';
import { fetchData } from '@/lib/Api';

// Shared by the Notifications page and the sidebar bell, so both show the same
// icons, open the same place on click, and read the same cached list.

export interface HomeNotification {
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

export interface NotificationsResponse {
  notifications: HomeNotification[];
  unread_count: number;
  /** Unread notifications that only show under the user's other properties. */
  unread_elsewhere?: number;
}

export type NotificationCategory = 'quotes' | 'messages' | 'jobs' | 'other';

export type NotificationTypeEntry = {
  Icon: ElementType;
  iconCls: string;
  badgeCls: string;
  label: string;
  category: NotificationCategory;
  cta?: string;
};

// Covers every type the backend can emit; unknown types fall back safely (no crash).
const TYPE_CONFIG: Record<string, NotificationTypeEntry> = {
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
const FALLBACK: NotificationTypeEntry = { Icon: Bell, iconCls: 'text-muted-foreground bg-muted', badgeCls: 'bg-muted text-muted-foreground', label: 'Update', category: 'other' };

export const cfgFor = (n: HomeNotification): NotificationTypeEntry => TYPE_CONFIG[n.type] ?? FALLBACK;

// Message notifications are "<Sender>: <preview>" (apps/messaging/views.py).
export const splitMessage = (n: HomeNotification) => {
  const i = n.body.indexOf(': ');
  return i > 0 ? { sender: n.body.slice(0, i), preview: n.body.slice(i + 2) } : { sender: '', preview: n.body };
};

/** Where opening a notification should take the user, or null when it has nowhere to go. */
export const targetFor = (n: HomeNotification): string | null => {
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

// One rendered row: a single notification, or several messages from the same
// sender about the same job collapsed together. `lead` is the newest member.
export type NotificationRow = { key: string; lead: HomeNotification; items: HomeNotification[] };

export const groupItems = (list: HomeNotification[]): NotificationRow[] => {
  const rows: NotificationRow[] = [];
  const byThread = new Map<string, NotificationRow>();
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

/** One cache entry per scope (a home, or null for the whole account): the page, the
 * sidebar badge and the bell share it, so their counts always agree. */
export const notificationsKey = (propertyId: string | null) => ['ho-notifications', propertyId] as const;

export const fetchNotifications = (propertyId: string | null): Promise<NotificationsResponse> =>
  fetchData<NotificationsResponse>(`/api/v1/notifications/${propertyId ? `?property=${propertyId}` : ''}`).then(
    r => (r as { data?: NotificationsResponse })?.data ?? r,
  );
