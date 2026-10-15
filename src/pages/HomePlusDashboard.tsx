import { useState, useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Bell, Upload, Flame, Zap, Droplets, CloudRain, Home,
  Clock, ShieldCheck, Umbrella, BookOpen, ClipboardList,
  Ruler, Leaf, FolderOpen, Wrench, CheckCircle, Mail,
  TrendingUp, AlertCircle, CalendarDays, PoundSterling,
  Cpu, Star, ArrowRight, CalendarCheck, FileText, Trash2, RefreshCw, Building2,
  BadgeCheck, Key, Landmark, XCircle, ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TraderName from '@/components/trader/TraderName';
import useFetch from '@/hooks/useFetch';
import { getEvents, fetchMotScore, fetchDocumentSummary, fetchLastCompleted, fetchAnnualSpend, fetchTimeline, fetchAttention, fetchRecentActivity, fetchQuotesSummary, declineQuotes, fetchEpc, fetchSystemsHealth, isRatedSystem, type AnnualSpendYear, type AttentionItem, type ActivityItem, type SystemHealthItem, type SystemEventDraft, type SystemUploadDraft } from '@/lib/Api2';
import { fetchData, modifyBid, fetchLeads, fetchUnassignedLeads } from '@/lib/Api';
import { toast } from '@/lib/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DocsUploadDialog from '@/components/docsUploadDialog';
import HomeMotWizard, { STEP_CONFIG, type HomeMotStep } from '@/components/homemot/HomeMotWizard';
import EmptyState from '@/components/homeplus/EmptyState';
import GettingStarted, { type GsStep } from '@/components/homeplus/GettingStarted';
import SystemHealthDialog from '@/components/insights/SystemHealthDialog';
import { ACTION_BUTTON, runSystemAction } from '@/components/insights/systemHealthActions';
import Quote, { type QuotePrefill } from '@/components/topbar/Quote';
import AddEvent, { type AddEventInitialValues } from '@/components/event/AddEvent';
import {
  BarChart, Bar, Cell, XAxis, YAxis, PieChart, Pie,
  Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';

// ── Inline primitives ─────────────────────────────────────────────────────────

function HealthBar({ value, max = 100, segments = 20 }: { value: number; max?: number; segments?: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const filled = Math.round((pct / 100) * segments);
  const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#FBBF24' : '#EF4444';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < filled ? color : '#E8E8E3' }} />
      ))}
    </div>
  );
}

function Sparkline({ data, width = 120, height = 28, color = '#9CA3AF' }: {
  data: number[]; width?: number; height?: number; color?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  // Inset horizontally so the end-dot/stroke never touch (and clip at) the edges.
  const pad = 3;
  const coords = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
  const pts = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const last = coords[coords.length - 1];
  const areaPath =
    `M ${coords[0].x.toFixed(1)},${height} ` +
    coords.map(c => `L ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ') +
    ` L ${last.x.toFixed(1)},${height} Z`;
  const uid = `sg-${color.replace('#','')}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" fill="none" className="block w-full">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${uid})`} />
      <polyline points={pts} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={2.5} fill={color} />
    </svg>
  );
}




// ── Eyebrow helper ────────────────────────────────────────────────────────────

function Eyebrow({ icon: Icon, label, trailing }: { icon: React.ElementType; label: string; trailing?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-foreground" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground truncate">{label}</span>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

// ── Recent activity helpers ───────────────────────────────────────────────────

// Notification type → icon for the Recent Activity card.
const ACTIVITY_ICON: Record<string, React.ElementType> = {
  new_quote: Mail,
  quote_updated: RefreshCw,
  job_completed: CheckCircle,
  bid_accepted: CheckCircle,
  new_review: Star,
  job_status: Clock,
  bid_rejected: AlertCircle,
  document_uploaded: Upload,
  document_deleted: Trash2,
  trade_added: Wrench,
  epc_rated: Leaf,
  reminder_set: CalendarCheck,
};

const activityTime = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : formatDistanceToNow(d, { addSuffix: true });
};

// System-health key → icon for the "System health" card.
const SYSTEM_ICON: Record<string, React.ElementType> = {
  heating: Flame,
  electrical: Zap,
  plumbing: Droplets,
  roof: CloudRain,
  safety: ShieldCheck,
};

// System-health row headline colour, by the backend's headline_tone.
const HEADLINE_TONE: Record<string, string> = {
  poor: 'text-red-600 dark:text-red-400',
  warn: 'text-amber-700 dark:text-amber-300',
  good: 'text-emerald-700 dark:text-emerald-400',
  muted: 'text-muted-foreground',
};

// ── Energy & EPC helpers ──────────────────────────────────────────────────────

// EPC band → colour. A/B green, C/D amber, E–G red.
const epcBandColor = (band?: string | null): string => {
  const b = (band ?? '').toUpperCase();
  if (b === 'A' || b === 'B') return '#16a34a';
  if (b === 'C' || b === 'D') return '#f59e0b';
  if (b === 'E' || b === 'F' || b === 'G') return '#dc2626';
  return '#6B6B6B';
};

// EPC band → badge {bg, text} colours.
const epcBandBadge = (band?: string | null): { bg: string; color: string } => {
  const b = (band ?? '').toUpperCase();
  if (b === 'A' || b === 'B') return { bg: '#DCFCE7', color: '#15803d' };
  if (b === 'C' || b === 'D') return { bg: '#FEF3C7', color: '#b45309' };
  if (b === 'E' || b === 'F' || b === 'G') return { bg: '#FEE2E2', color: '#b91c1c' };
  return { bg: '#F5F5F0', color: '#8B8B8B' };
};

const epcDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : format(d, 'MMM yyyy');
};

// ── Main component ────────────────────────────────────────────────────────────

const HomePlusDashboard = () => {
  const { user } = useAuth();
  const { properties, activePropertyId } = useActiveProperty();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [epcUploadOpen, setEpcUploadOpen] = useState(false);
  const [spendYear, setSpendYear] = useState<number>(new Date().getFullYear());
  const [motStep, setMotStep] = useState<HomeMotStep | null>(null);
  const [motFocus, setMotFocus] = useState<string | null>(null);
  const [systemKey, setSystemKey] = useState<string | null>(null);
  const [certUploadOpen, setCertUploadOpen] = useState(false);
  // Held in state so the dialogs see a stable object (a new one would re-apply it mid-edit).
  const [certUploadPrefill, setCertUploadPrefill] = useState<
    { name?: string; discipline?: string; docType?: string; category?: string } | undefined
  >(undefined);
  const [logWork, setLogWork] = useState<{ mode: SystemEventDraft['mode']; date?: string; values: AddEventInitialValues } | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quotePrefill, setQuotePrefill] = useState<QuotePrefill | undefined>(undefined);
  const [quoteBusy, setQuoteBusy] = useState(false);

  // ── API hooks ──────────────────────────────────────────────────────────────

  const { data: scoreResp } = useFetch('/api/v1/mot/score/', {
    queryKey: ['mot-score', activePropertyId],
    queryFn: () => fetchMotScore(activePropertyId),
  });
  // Full MOT payload (score + per-step answers/breakdown) drives both the vitals
  // tile and the "Build your home MOT score" step card below.
  const motScore = (scoreResp?.data ?? null) as {
    score?: number;
    max?: number;
    breakdown?: Record<string, number>;
    answers?: Record<HomeMotStep, Record<string, boolean>>;
  } | null;
  const homeMotScore: number = motScore?.score ?? 0;
  const homeMotMax: number = motScore?.max ?? 50;
  const motAnswers: Record<HomeMotStep, Record<string, boolean>> =
    motScore?.answers ?? { A: {}, B: {}, C: {} };

  // Last-completed dates (keyed by template slug) hydrate the wizard date pickers.
  const { data: lastCompletedResp } = useFetch('/api/v1/mot/last-completed/', {
    queryKey: ['mot-last-completed', activePropertyId],
    queryFn: () => fetchLastCompleted(activePropertyId),
  });
  const motDates: Record<string, string> = lastCompletedResp?.data ?? {};

  // Per-step progress for the MOT step card.
  const STEP_LABEL: Record<HomeMotStep, string> = { A: 'Compliance', B: 'Documents', C: 'Maintenance' };
  // Only the step's own questions count (stray keys from old data never inflate it).
  const motYesCount = (s: HomeMotStep) => STEP_CONFIG[s].questions.filter(q => motAnswers[s]?.[q.id]).length;
  const motTotal = (s: HomeMotStep) => STEP_CONFIG[s].questions.length;
  const motEarned = (s: HomeMotStep) =>
    Math.round(motScore?.breakdown?.[s] ?? Math.min(STEP_CONFIG[s].maxPoints, motYesCount(s) * STEP_CONFIG[s].pointsPerYes));
  // Tasks + score are persisted by the wizard; refresh the derived dashboard views.
  const handleMotSave = () =>
    ['mot-score', 'mot-last-completed', 'event'].forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));

  const { data: eventData } = useFetch('/api/v1/events/', {
    queryKey: ['event', activePropertyId],
    queryFn: () => getEvents(activePropertyId),
  });

  const { data: docSummaryResp } = useFetch('/api/v1/documents/summary/', {
    queryKey: ['documents-summary', activePropertyId],
    queryFn: () => fetchDocumentSummary(activePropertyId),
  });

  const { data: annualSpendResp } = useFetch('/api/v1/insights/annual-spend/', {
    queryKey: ['annual-spend', activePropertyId],
    queryFn: () => fetchAnnualSpend(activePropertyId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: timelineResp } = useFetch('/api/v1/insights/timeline/', {
    queryKey: ['timeline', activePropertyId],
    queryFn: () => fetchTimeline(activePropertyId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: attentionResp } = useFetch('/api/v1/insights/attention/', {
    queryKey: ['attention', activePropertyId],
    queryFn: () => fetchAttention(activePropertyId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: systemsResp } = useFetch('/api/v1/insights/systems-health/', {
    queryKey: ['systems-health', activePropertyId],
    queryFn: () => fetchSystemsHealth(activePropertyId, true),
    // Always re-read on open: work marked done in Calendar or a document uploaded
    // elsewhere changes it, and the server caches it (busted on every such write).
    staleTime: 0,
  });
  // Every system, rated or not: a system is only scored from real records.
  const allSystems: SystemHealthItem[] = Array.isArray(systemsResp?.data) ? systemsResp.data : [];
  const systemsHealth = allSystems.filter(isRatedSystem);
  const unratedSystems = allSystems.filter(s => !isRatedSystem(s));
  const selectedSystem = allSystems.find(s => s.key === systemKey) ?? null;
  const healthCounts = {
    attention: systemsHealth.filter(s => s.tone === 'poor').length,
    fair: systemsHealth.filter(s => s.tone === 'warn').length,
    good: systemsHealth.filter(s => s.tone === 'good').length,
    unrated: unratedSystems.length,
  };
  // Every System Health button opens its form filled from the backend's draft.
  const systemActionHandlers = {
    navigate,
    propertyId: activePropertyId,
    onUpload: (draft?: SystemUploadDraft) => {
      setCertUploadPrefill(draft && { name: draft.name, discipline: draft.discipline, docType: draft.doc_type, category: draft.category });
      setCertUploadOpen(true);
    },
    onQuote: (prefill: QuotePrefill) => { setQuotePrefill(prefill); setQuoteOpen(true); },
    onMot: (step: HomeMotStep, focus?: string) => { setMotFocus(focus ?? null); setMotStep(step); },
    onLogWork: (draft: SystemEventDraft) => setLogWork({
      mode: draft.mode,
      date: draft.date,
      values: {
        title: draft.title,
        type: draft.type as AddEventInitialValues['type'],
        trade: draft.trade,
        tradeCategory: draft.trade_category,
        complianceType: (draft.compliance_type || undefined) as AddEventInitialValues['complianceType'],
        description: draft.description,
      },
    }),
  };

  const { data: quotesResp } = useFetch('/api/v1/jobs/quotes-summary/', {
    queryKey: ['quotes', activePropertyId],
    queryFn: () => fetchQuotesSummary(activePropertyId),
    staleTime: 5 * 60 * 1000,
  });

  // The user's posted jobs (shared cache with the Job Leads page). Lets the
  // TradePilot card surface jobs that are still awaiting quotes — quotes-summary
  // only returns a job once it has a pending bid.
  const { data: leadsResp } = useFetch('/api/v1/jobs/', {
    queryKey: ['leads', activePropertyId],
    queryFn: () => fetchLeads(activePropertyId),
    staleTime: 5 * 60 * 1000,
  });
  // Jobs without a property count under every property (shared cache with the
  // Home Improvements "Without property" tab).
  const { data: unassignedResp } = useFetch('/api/v1/jobs/?unassigned=1', {
    queryKey: ['leads', 'unassigned'],
    queryFn: () => fetchUnassignedLeads(),
    staleTime: 5 * 60 * 1000,
  });
  const leads: { isApproved?: boolean; status?: string }[] = [
    ...(Array.isArray(leadsResp) ? leadsResp : []),
    ...(Array.isArray(unassignedResp) ? unassignedResp : []),
  ];
  const awaitingJobsCount = leads.filter(
    j => !j.isApproved && j.status !== 'completed' && j.status !== 'cancelled'
  ).length;

  // AI-generated EPC rating (null until an EPC certificate has been analysed).
  const { data: epcResp } = useFetch('/api/v1/insights/epc/', {
    queryKey: ['epc', activePropertyId],
    queryFn: () => fetchEpc(activePropertyId),
    staleTime: 5 * 60 * 1000,
  });
  const epc = epcResp?.data ?? null;
  // Only treat the EPC as "rated" once AI has extracted a usable band/score; an empty/legacy
  // assessment must still show the upload wizard, not a half-filled "Score — / 100".
  const hasEpcRating = !!epc && (!!epc.currentBand || epc.currentScore != null);
  const epcExpired = !!epc?.validUntil && !epc.isEstimate && new Date(`${epc.validUntil}T23:59:59`) < new Date();

  const { data: notifData } = useQuery({
    queryKey: ['ho-notifications', activePropertyId],
    queryFn: () => fetchData<{ notifications: unknown[]; unread_count: number }>(
      `/api/v1/notifications/${activePropertyId ? `?property=${activePropertyId}` : ''}`,
    ).then(r => (r as { data?: { unread_count: number } })?.data ?? r),
    staleTime: 5 * 60 * 1000,
  });
  const unreadCount: number = (notifData as { unread_count?: number } | null)?.unread_count ?? 0;

  const { data: activityResp } = useFetch('/api/v1/notifications/recent/', {
    queryKey: ['recent-activity', activePropertyId],
    queryFn: () => fetchRecentActivity(6, activePropertyId),
    staleTime: 60 * 1000,
  });
  const recentActivity: ActivityItem[] = Array.isArray(activityResp?.data) ? activityResp.data : [];

  // Drives the first-run "Add your property" step (pre-completed at sign-up).
  const hasProperty = properties.length > 0;

  // ── Computed values ────────────────────────────────────────────────────────

  const firstName: string =
    (user as { user_metadata?: { full_name?: string } } | null)?.user_metadata?.full_name?.split(' ')[0] ?? 'there';

  type RawEvent = { id?: unknown; title?: string; date?: string | null; eventType?: string; type?: string };
  const rawEvents: RawEvent[] = Array.isArray(eventData?.data) ? eventData.data : Array.isArray(eventData) ? eventData : [];
  const dashEvents = rawEvents.map(r => ({
    title: r.title || 'Untitled',
    date: r.date ? new Date(r.date.split('T')[0] + 'T00:00:00') : null,
  }));

  const docSummary = (docSummaryResp?.data ?? docSummaryResp) as { total?: number; valid?: number; expiring?: number; expired?: number; by_discipline?: Record<string, number> } | null;
  const totalDocs: number = docSummary?.total ?? 0;
  const docsByDiscipline: Record<string, number> = docSummary?.by_discipline ?? {};

  const now = new Date();
  type ToneName = 'good' | 'warn' | 'now' | 'future';

  // 12-week timeline — live from /api/v1/insights/timeline/ (real events only,
  // backend guarantees at least a "Today" node).
  const timelineNodes: { label: string; diffDays: number; tone: ToneName }[] =
    (timelineResp?.data?.nodes ?? []).map(n => ({ label: n.label, diffDays: n.diff_days, tone: n.tone as ToneName }));

  const TONE_COLOR: Record<ToneName, string> = { good: '#10B981', warn: '#FBBF24', now: '#1A1A1A', future: '#D1D5DB' };
  const TONE_BG: Record<ToneName, string> = { good: '#ECFDF5', warn: '#FFFBEB', now: '#FBBF24', future: '#F3F4F6' };
  const TONE_LINE: Record<ToneName, string> = { good: '#A7F3D0', warn: '#FDE68A', now: '#FBBF24', future: '#E5E7EB' };
  const TONE_LABEL: Record<ToneName, string> = { good: '#4A4A4A', warn: '#1A1A1A', now: '#1A1A1A', future: '#8B8B8B' };

  // Needs attention — live from /api/v1/insights/attention/ (real events + docs).
  type AttnTone = 'danger' | 'warning' | 'neutral';
  const ATTN_ICON: Record<string, React.ElementType> = {
    flame: Flame, zap: Zap, droplets: Droplets, 'cloud-rain': CloudRain, umbrella: Umbrella,
    'shield-check': ShieldCheck, leaf: Leaf, file: FileText, calendar: CalendarDays, alert: AlertCircle,
  };
  const attentionItems: AttentionItem[] = attentionResp?.data?.items ?? [];
  const attentionTotal: number = attentionResp?.data?.total ?? attentionItems.length;
  const ATTN_BG: Record<AttnTone, string> = { danger: '#FEF2F2', warning: '#FFFBEB', neutral: '#F5F5F0' };
  const ATTN_FG: Record<AttnTone, string> = { danger: '#EF4444', warning: '#F59E0B', neutral: '#6B6B6B' };
  const ATTN_TAG: Record<AttnTone, string> = { danger: 'bg-red-100 text-red-700', warning: 'bg-yellow-100 text-yellow-800', neutral: 'bg-muted text-muted-foreground' };

  const now_month = now.getMonth();
  const MONTHS_LABELS = ['J','F','M','A','M','J','J','A','S','O','N','D'];

  // Events in next 30 days
  const eventsNext30 = dashEvents.filter(ev => {
    if (!ev.date) return false;
    const diff = ev.date.getTime() - now.getTime();
    return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  // Annual spend tracker — live from /api/v1/insights/annual-spend/
  const spendYears: AnnualSpendYear[] = annualSpendResp?.data?.years ?? [];
  const spendYearTabs: number[] = spendYears.map(y => y.year);
  const activeSpend: AnnualSpendYear | null =
    spendYears.find(y => y.year === spendYear) ?? spendYears[spendYears.length - 1] ?? null;

  const fmtGBP = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`;
  const fmtSpendSub = (yr: AnnualSpendYear | null) => {
    if (!yr) return 'No spend logged yet';
    const inv = `${yr.invoice_count} invoice${yr.invoice_count === 1 ? '' : 's'} logged`;
    if (yr.delta_vs_prev == null) return inv;
    const d = Math.round(yr.delta_vs_prev);
    const sign = d > 0 ? '+' : d < 0 ? '−' : '±';
    return `${sign}£${Math.abs(d).toLocaleString('en-GB')} vs last year · ${inv}`;
  };

  const yearData = {
    total: activeSpend ? fmtGBP(activeSpend.total) : '£0',
    sub: fmtSpendSub(activeSpend),
    center: activeSpend ? (activeSpend.total >= 1000 ? `£${(activeSpend.total / 1000).toFixed(1)}k` : fmtGBP(activeSpend.total)) : '£0',
  };
  const spendBarData = MONTHS_LABELS.map((month, i) => ({
    month,
    spend: activeSpend?.bars[i] ?? 0,
    highlight: i === now_month && activeSpend?.year === now.getFullYear(),
  }));
  const spendCats = (activeSpend?.categories ?? []).map(c => ({ name: c.label, v: Math.round(c.amount), color: c.color }));

  // Empty-state skeleton: when the selected year has no spend, show uniform
  // light-gray placeholder bars/donut instead of an invisible 0-height chart.
  const spendEmpty = spendBarData.every(d => d.spend === 0);
  const spendBarChartData = spendEmpty ? spendBarData.map(d => ({ ...d, spend: 1 })) : spendBarData;
  const spendPieData = spendCats.length
    ? spendCats.map(c => ({ name: c.name, value: c.v, fill: c.color }))
    : [{ name: 'No spend yet', value: 1, fill: '#ECECE6' }];

  // YTD home-spend vitals tile — derived from the same annual-spend payload.
  const ytdYear = now.getFullYear();
  const curYearEntry = spendYears.find(y => y.year === ytdYear) ?? null;
  const prevYearEntry = spendYears.find(y => y.year === ytdYear - 1) ?? null;
  const sumToDate = (yr: AnnualSpendYear | null) =>
    yr ? yr.bars.slice(0, now_month + 1).reduce((a, b) => a + b, 0) : 0; // Jan..current month
  const ytdSpend = sumToDate(curYearEntry);
  const ytdPrev = sumToDate(prevYearEntry); // same period last year
  const ytdDeltaPct = ytdPrev > 0 ? Math.round(((ytdSpend - ytdPrev) / ytdPrev) * 100) : null;
  const ytdBars = curYearEntry?.bars ?? [];

  // TradePilot — quotes in: live from /api/v1/jobs/quotes-summary/ (real bids).
  const quotes = quotesResp?.data ?? null;
  const TAG_CLS: Record<string, string> = {
    best_deal: 'bg-amber-100 text-amber-700',
    best_price: 'bg-green-100 text-green-700',
    top_rated: 'bg-amber-50 text-amber-700',
    closest: 'bg-blue-100 text-blue-700',
  };
  const recommendedName = quotes?.quotes.find(q => q.bid_id === quotes.recommended_bid_id)?.name ?? 'this trade';
  const refreshQuotes = () => {
    queryClient.invalidateQueries({ queryKey: ['quotes'] });
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };
  const acceptQuote = async () => {
    if (!quotes?.job || !quotes.recommended_bid_id) return;
    if (!window.confirm(`Accept ${recommendedName}? The other quotes will be declined.`)) return;
    setQuoteBusy(true);
    try {
      await modifyBid({ bid_id: quotes.recommended_bid_id, status: 'accepted', lead_id: quotes.job.id });
      toast.success('Quote accepted');
      refreshQuotes();
    } catch {
      toast.error('Could not accept the quote');
    } finally {
      setQuoteBusy(false);
    }
  };
  const declineAllQuotes = async () => {
    if (!quotes?.job) return;
    if (!window.confirm('Decline all quotes for this job?')) return;
    setQuoteBusy(true);
    try {
      await declineQuotes(quotes.job.id);
      toast.success('All quotes declined');
      refreshQuotes();
    } catch {
      toast.error('Could not decline the quotes');
    } finally {
      setQuoteBusy(false);
    }
  };

  // Same keys / labels / colours as the Documents page categories.
  const DOC_CATS = [
    { key: 'compliance', name: 'Compliance', color: '#A855F7', bg: '#F3E8FF', Icon: ShieldCheck },
    { key: 'warranty', name: 'Warranty', color: '#6366F1', bg: '#E0E7FF', Icon: BadgeCheck },
    { key: 'insurance', name: 'Insurance', color: '#3B82F6', bg: '#DBEAFE', Icon: Umbrella },
    { key: 'energy_epc', name: 'Energy & EPC', color: '#10B981', bg: '#DCFCE7', Icon: Leaf },
    { key: 'manuals_appliances', name: 'Manuals', color: '#F59E0B', bg: '#FEF3C7', Icon: BookOpen },
    { key: 'surveys_reports', name: 'Surveys', color: '#64748B', bg: '#E2E8F0', Icon: ClipboardList },
    { key: 'tenancy', name: 'Tenancy', color: '#F43F5E', bg: '#FFE4E6', Icon: Key },
    { key: 'purchase', name: 'Purchase', color: '#0EA5E9', bg: '#E0F2FE', Icon: Landmark },
    { key: 'planning', name: 'Planning', color: '#14B8A6', bg: '#CCFBF1', Icon: Ruler },
    { key: 'utility', name: 'Utility', color: '#F97316', bg: '#FFEDD5', Icon: Zap },
  ];
  const docRows = (() => {
    const rows = DOC_CATS.map(c => ({ ...c, count: docsByDiscipline[c.key] ?? 0 })).filter(c => c.count > 0);
    const known = rows.reduce((n, c) => n + c.count, 0);
    if (totalDocs > known) {
      rows.push({ key: 'other', name: 'Other', color: '#71717A', bg: '#F4F4F5', Icon: FolderOpen, count: totalDocs - known });
    }
    return rows.sort((a, b) => b.count - a.count);
  })();
  const docMax = Math.max(1, ...docRows.map(r => r.count));
  const DOC_ROWS_SHOWN = 6;
  const docHealth = [
    { key: 'valid', n: docSummary?.valid ?? 0, label: 'valid', cls: 'bg-muted text-muted-foreground', Icon: CheckCircle },
    { key: 'expiring', n: docSummary?.expiring ?? 0, label: 'expiring', cls: 'bg-amber-50 text-amber-700', Icon: Clock },
    { key: 'expired', n: docSummary?.expired ?? 0, label: 'expired', cls: 'bg-red-100 text-red-700', Icon: XCircle },
  ].filter(h => h.n > 0);

  // ── First-run "Getting started" checklist ────────────────────────────────────
  // Completion derives entirely from data already on the page. Step 1 (property) is
  // pre-completed at sign-up → endowed progress ("1 of 5 done").
  const motTickedTotal = motYesCount('A') + motYesCount('B') + motYesCount('C');
  const hasJob = !!quotes?.job;

  const gsSteps: GsStep[] = [
    { id: 'property', icon: Home, title: 'Add your property', helper: "Your home's address & details — done at sign-up.", done: hasProperty, ctaLabel: 'View', href: '/dashboard/settings?tab=properties' },
    { id: 'mot', icon: ClipboardList, title: 'Run your first Home MOT check', helper: 'Three 60-second checks. Each one grows your score.', done: motTickedTotal > 0, ctaLabel: 'Start check', onCta: () => setMotStep('A') },
    { id: 'document', icon: Upload, title: 'Upload your first document', helper: 'Warranties, certificates & manuals — safe and searchable.', done: totalDocs > 0, ctaLabel: 'Upload', onCta: () => setUploadOpen(true) },
    { id: 'epc', icon: Leaf, title: 'Get your EPC rating', helper: 'Upload your certificate for an instant energy rating.', done: hasEpcRating, ctaLabel: 'Add EPC', onCta: () => setEpcUploadOpen(true) },
    { id: 'job', icon: Wrench, title: 'Post your first job', helper: 'Get quotes from verified local trades.', done: hasJob, ctaLabel: 'Post a job', href: '/dashboard/job-leads' },
  ];
  // "Activated" = ≥2 meaningful actions (property excluded). New accounts always see
  // the checklist (through its celebratory finish); older accounts only while still
  // under-engaged. Either way it disappears once dismissed.
  const meaningfulDone = [totalDocs > 0, motTickedTotal > 0, hasEpcRating, hasJob].filter(Boolean).length;
  const createdMs = user?.created_at ? new Date(user.created_at).getTime() : NaN;
  const accountAgeDays = Number.isFinite(createdMs) ? (Date.now() - createdMs) / 86_400_000 : 999;

  const gsDismissKey = `hp_gs_dismissed_${user?.id ?? 'anon'}`;
  const [gsDismissed, setGsDismissed] = useState(false);
  useEffect(() => {
    try { setGsDismissed(localStorage.getItem(gsDismissKey) === '1'); } catch { setGsDismissed(false); }
  }, [gsDismissKey]);
  const dismissGettingStarted = () => {
    try { localStorage.setItem(gsDismissKey, '1'); } catch { /* ignore */ }
    setGsDismissed(true);
  };
  const showGettingStarted = !gsDismissed && (accountAgeDays < 30 || meaningfulDone < 2);

  return (
    <DashboardLayout>
      <div className="space-y-4">

        {/* ── PageHeader ─────────────────────────────────────── */}
        <div className="bg-card rounded-[18px] border border-border p-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Good morning</p>
            <h1 className="text-[22px] xs:text-[26px] font-bold tracking-tight text-foreground mt-1 leading-tight break-words">{firstName}'s home pulse</h1>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/dashboard/notifications"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-accent text-accent-foreground rounded-full min-w-[18px] h-[18px] text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload document</span>
            </button>
          </div>
        </div>

        {/* ── First-run getting-started checklist (new users only) ── */}
        {showGettingStarted && (
          <GettingStarted firstName={firstName} steps={gsSteps} onDismiss={dismissGettingStarted} />
        )}

        {/* ── Vitals strip — 4 tiles ──────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {/* MOT */}
          <div className="bg-card rounded-[18px] border border-border p-4 sm:p-5 min-w-0 flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Home MOT score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground leading-none">{homeMotScore}</span>
              <span className="text-[13px] text-muted-foreground">/ {homeMotMax}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {motTickedTotal === 0 ? 'Run your first check to begin' : `${motTickedTotal} check${motTickedTotal === 1 ? '' : 's'} completed`}
            </p>
            <div className="mt-1"><HealthBar value={homeMotScore} max={homeMotMax} segments={12} /></div>
          </div>
          {/* YTD Spend */}
          <div className="bg-card rounded-[18px] border border-border p-4 sm:p-5 min-w-0 flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">YTD home spend</p>
            <span className="text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground leading-none truncate">{fmtGBP(ytdSpend)}</span>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              {ytdDeltaPct == null ? (
                <span>First year tracked</span>
              ) : (
                <>
                  <span className={ytdDeltaPct < 0 ? 'text-green-600' : ytdDeltaPct > 0 ? 'text-red-500' : 'text-muted-foreground'}>
                    {ytdDeltaPct < 0 ? '↓' : ytdDeltaPct > 0 ? '↑' : '→'}
                  </span>
                  {Math.abs(ytdDeltaPct)}% vs last year
                </>
              )}
            </p>
            <div className="mt-1">
              <Sparkline data={ytdBars.length >= 2 ? ytdBars : [0, 0]} color="#FBBF24" />
            </div>
          </div>
          {/* Documents */}
          <div className="bg-card rounded-[18px] border border-border p-4 sm:p-5 min-w-0 flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Documents</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground leading-none">{totalDocs}</span>
              <span className="text-[13px] text-muted-foreground">files</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {totalDocs === 0 ? 'No documents yet' : `${totalDocs} file${totalDocs === 1 ? '' : 's'} stored`}
            </p>
            <div className="mt-1">
              <Sparkline data={totalDocs > 0 ? [0, totalDocs] : [0, 0]} />
            </div>
          </div>
          {/* Upcoming events */}
          <div className="bg-card rounded-[18px] border border-border p-4 sm:p-5 min-w-0 flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Upcoming events</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[24px] sm:text-[28px] font-bold tracking-tight text-foreground leading-none">{eventsNext30}</span>
              <span className="text-[13px] text-muted-foreground">tasks</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {eventsNext30 === 0 ? 'Nothing scheduled · all clear' : 'Due in next 30 days'}
            </p>
            <div className="mt-1">
              <Sparkline data={eventsNext30 > 0 ? [0, eventsNext30] : [0, 0]} color="#A855F7" />
            </div>
          </div>
        </div>

        {/* ── Timeline ────────────────────────────────────────── */}
        <div className="bg-card rounded-[18px] border border-border p-5">
          <Eyebrow icon={CalendarDays} label="12-week timeline" trailing={
            <div className="hidden xs:flex items-center gap-3.5 text-[11px] text-muted-foreground">
              {([['#10B981','Done'],['#FBBF24','Due'],['#D1D5DB','Future']] as [string,string][]).map(([c,l]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                  {l}
                </span>
              ))}
            </div>
          } />
          <div className="overflow-x-auto mt-5 pb-1">
            <div className="relative inline-flex min-w-full">
              <div className="absolute top-3 flex z-0 pointer-events-none"
                style={{ left: `calc(100% / ${timelineNodes.length * 2})`, right: `calc(100% / ${timelineNodes.length * 2})` }}>
                {timelineNodes.slice(0, -1).map((n, i) => (
                  <div key={i} className="flex-1 h-0.5" style={{ background: TONE_LINE[n.tone] }} />
                ))}
              </div>
              {timelineNodes.map((n, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1 min-w-[108px] relative z-10">
                  <span style={{
                    display: 'inline-flex', width: 24, height: 24, borderRadius: 99,
                    background: TONE_BG[n.tone], border: `2px solid ${TONE_COLOR[n.tone]}`,
                    alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 3px #fff',
                  }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: TONE_COLOR[n.tone] }} />
                  </span>
                  <div className="text-center w-full">
                    <p className="text-[11px] leading-tight line-clamp-2 break-words"
                      style={{ fontWeight: n.tone === 'now' ? 700 : 500, color: TONE_LABEL[n.tone] }}>
                      {n.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {n.diffDays === 0 ? 'today' : n.diffDays > 0 ? `+${n.diffDays}d` : `${n.diffDays}d`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row: SystemHealth + Attention ───────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4">
          {/* System health */}
          <div className="bg-card rounded-[18px] border border-border p-5">
            <Eyebrow icon={Cpu} label="System health" trailing={
              <Link to="/dashboard/calendar"
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-muted text-muted-foreground hover:bg-border transition-colors">
                <Wrench className="w-3 h-3" /> Log work
              </Link>
            } />
            {allSystems.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-medium">
                {healthCounts.attention > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300">
                    {healthCounts.attention} {healthCounts.attention === 1 ? 'needs' : 'need'} attention
                  </span>
                )}
                {healthCounts.fair > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">{healthCounts.fair} fair</span>
                )}
                {healthCounts.good > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{healthCounts.good} good</span>
                )}
                {healthCounts.unrated > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{healthCounts.unrated} not rated</span>
                )}
              </div>
            )}
            <div className="mt-3">
              {allSystems.length === 0 ? (
                <EmptyState
                  icon={Cpu}
                  title="Track your home's systems"
                  subtitle="Log a service or run your Home MOT and we'll start scoring heating, electrics, plumbing and more."
                  ctaLabel="Start Home MOT"
                  onCta={() => setMotStep('C')}
                />
              ) : (
                <>
                {systemsHealth.length === 0 && (
                  <p className="text-[12px] text-muted-foreground mb-3">
                    We score a system only from real records: a certificate, a logged service or your Home MOT answers.
                    Nothing is recorded for this home yet.
                  </p>
                )}
                {systemsHealth.map((s, i) => {
                  const Icon = SYSTEM_ICON[s.key] ?? Cpu;
                  return (
                    <div key={s.key} role="button" tabIndex={0} aria-label={`${s.name}: ${s.score} out of 100. Show details`}
                      onClick={() => setSystemKey(s.key)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSystemKey(s.key); } }}
                      className={`group cursor-pointer -mx-2 px-2 rounded-[12px] hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors flex flex-col gap-2 py-3.5 sm:grid sm:items-center sm:gap-5 sm:[grid-template-columns:160px_minmax(0,1fr)_76px] 2xl:[grid-template-columns:200px_minmax(0,1fr)_76px] ${i > 0 ? 'border-t border-border' : ''}`}>
                      {/* Mobile: name + score share one row; sm: wrapper dissolves so both fall into grid cols. */}
                      <div className="flex items-center justify-between gap-3 sm:contents">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="h-8 w-8 rounded-[10px] bg-muted text-foreground flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-semibold text-foreground truncate">{s.name}</p>
                            {s.details?.self_reported_only ? (
                              <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-px rounded-full bg-muted text-muted-foreground"
                                title="Only your Home MOT answers back this score. Add a certificate or log the work to confirm it.">
                                Self-reported
                              </span>
                            ) : s.details?.confidence === 'low' && (
                              <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-px rounded-full bg-muted text-muted-foreground"
                                title={`Based on ${s.details.basis.join(', ')} only`}>
                                Limited data
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-1 shrink-0 sm:order-last">
                          <div className="text-right">
                            <span className="text-[24px] font-bold tracking-tight text-foreground leading-none">{s.score}</span>
                            <span className="text-[10px] text-muted-foreground ml-0.5">/100</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className={cn('text-[12px] font-medium truncate mb-1.5', HEADLINE_TONE[s.headline_tone ?? 'muted'])}
                          title={s.headline ?? s.note}>
                          {s.headline ?? s.note}
                        </p>
                        <HealthBar value={s.score} segments={20} />
                        <div className="flex justify-between gap-3 mt-1.5 text-[11px] text-muted-foreground">
                          <span className="truncate">{s.last}</span>
                          <span className="truncate text-right">{s.next}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {unratedSystems.length > 0 && (
                  <div className={systemsHealth.length > 0 ? 'mt-2 pt-3 border-t border-border' : ''}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">Not rated yet</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {unratedSystems.map(u => {
                        const Icon = SYSTEM_ICON[u.key] ?? Cpu;
                        const first = u.details?.actions[0];
                        const btn = first ? ACTION_BUTTON[first.kind] : null;
                        return (
                          <div key={u.key} role="button" tabIndex={0} aria-label={`${u.name}: not rated yet. Show details`}
                            onClick={() => setSystemKey(u.key)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSystemKey(u.key); } }}
                            className="cursor-pointer flex items-center gap-2.5 rounded-[12px] bg-muted/60 hover:bg-muted px-3 py-2.5 min-w-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <span className="h-7 w-7 rounded-[9px] bg-card text-muted-foreground flex items-center justify-center shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] font-semibold text-foreground">{u.name}</p>
                              {u.flag ? (
                                <p className="text-[11px] text-red-600 dark:text-red-400 leading-snug">{u.flag}</p>
                              ) : (
                                <p className="text-[11px] text-muted-foreground leading-snug">{first?.title ?? 'No records yet'}</p>
                              )}
                            </div>
                            {first && btn && (
                              <button type="button"
                                onClick={(e) => { e.stopPropagation(); runSystemAction(first, u.key, systemActionHandlers); }}
                                className="shrink-0 text-[11px] font-medium px-2.5 py-1.5 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors whitespace-nowrap">
                                {btn.label}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                </>
              )}
            </div>
          </div>

          {/* Attention — shell keeps the grid row sized by System health; card fills it and the list scrolls */}
          <div className="relative xl:min-h-[280px]">
          <div className="bg-card rounded-[18px] border border-border p-5 xl:absolute xl:inset-0 flex flex-col">
            <Eyebrow icon={AlertCircle} label="Needs attention" trailing={
              <span className="text-[11px] text-muted-foreground">{attentionTotal} item{attentionTotal === 1 ? '' : 's'}</span>
            } />
            <div className="flex flex-col gap-2 mt-4 flex-1 min-h-0 overflow-y-auto pr-1 max-h-[420px] xl:max-h-none">
              {attentionItems.length === 0 ? (
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-success/10 border border-success/30">
                  <span className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0 bg-card text-[#10B981]">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">You're all caught up</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Nothing needs your attention right now.</p>
                  </div>
                </div>
              ) : attentionItems.map((it, i) => {
                const Icon = ATTN_ICON[it.icon] ?? AlertCircle;
                const tone = it.tone as AttnTone;
                return (
                  <div key={`${it.title}-${i}`} className="flex items-center gap-3 p-3 rounded-[12px] bg-muted border border-border">
                    <span className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ background: ATTN_BG[tone], color: ATTN_FG[tone] }}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${ATTN_TAG[tone]}`}>{it.tag}</span>
                        <span className="text-[11px] text-muted-foreground">{it.meta}</span>
                      </div>
                      <p className="text-[13px] font-semibold text-foreground truncate">{it.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{it.sub}</p>
                    </div>
                    <Link to={it.path}
                      className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted transition-colors whitespace-nowrap">
                      {it.cta}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>

        {/* ── Row: Spend + EPC ─────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Spend tracker */}
          <div className="bg-card rounded-[18px] border border-border p-5">
            <Eyebrow icon={PoundSterling} label="Annual spend tracker" trailing={
              <div className="flex gap-1 bg-muted p-1 rounded-full">
                {spendYearTabs.slice(-3).map(y => (
                  <button key={y} onClick={() => setSpendYear(y)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 ${y === spendYear ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-muted-foreground'}`}>
                    {y}
                  </button>
                ))}
              </div>
            } />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 items-start mt-4">
              {/* Left: BigStat + BarChart */}
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[28px] font-bold tracking-tight text-foreground leading-none">{yearData.total}</span>
                  <p className="text-[11px] text-muted-foreground mt-1">{yearData.sub}</p>
                </div>
                <div className="h-[72px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={spendBarChartData} barCategoryGap="25%" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <YAxis hide domain={spendEmpty ? [0, 3] : [0, 'auto']} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false}
                        tick={{ fontSize: 9, fill: spendEmpty ? '#B8B8B8' : '#8B8B8B' }} interval={0} />
                      {!spendEmpty && (
                        <RTooltip
                          cursor={{ fill: '#F5F5F0', radius: 4 }}
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div className="bg-card border border-border rounded-[8px] px-2.5 py-1.5 shadow-sm text-[11px]">
                                <span className="font-semibold text-foreground">£{payload[0].value}</span>
                              </div>
                            ) : null
                          }
                        />
                      )}
                      <Bar dataKey="spend" radius={[3, 3, 0, 0]} isAnimationActive={!spendEmpty} animationDuration={400}>
                        {spendBarChartData.map((entry, i) => (
                          <Cell key={i} fill={!spendEmpty && entry.highlight ? '#FBBF24' : '#E4E4DE'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Right: Donut + legend */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendPieData}
                        cx="50%" cy="50%"
                        innerRadius={32} outerRadius={46}
                        dataKey="value"
                        isAnimationActive={!spendEmpty} animationBegin={0} animationDuration={500}
                        strokeWidth={0}
                      >
                        {spendPieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[15px] font-bold text-foreground leading-none">{yearData.center}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">YTD</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
                  {spendCats.length ? (
                    spendCats.map(c => (
                      <div key={c.name} className="flex items-center gap-2 text-[12px]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                        <span className="flex-1 text-muted-foreground truncate">{c.name}</span>
                        <span className="font-semibold text-foreground shrink-0 tabular-nums">£{c.v}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[12px] text-muted-foreground">No categories yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* EPC */}
          <div className="bg-card rounded-[18px] border border-border p-5">
            <Eyebrow icon={Leaf} label="Energy & EPC" trailing={
              hasEpcRating ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: epcBandBadge(epc.currentBand).bg, color: epcBandBadge(epc.currentBand).color }}>
                  EPC {epc.currentBand}{epc.isEstimate ? ' · est' : ''}
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">AI-powered</span>
              )
            } />

            {hasEpcRating ? (
              <>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 mt-4 mb-3">
                  <div className="p-3.5 bg-muted rounded-[12px] border border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">EPC rating</p>
                    <div className="flex flex-wrap items-baseline gap-x-1.5 mt-1.5">
                      <span className="text-[40px] font-extrabold leading-none tracking-tighter" style={{ color: epcBandColor(epc.currentBand) }}>{epc.currentBand || '—'}</span>
                      <span className="text-[13px] text-muted-foreground whitespace-nowrap">Score {epc.currentScore ?? '—'} / 100</span>
                    </div>
                    <p className={cn('text-[11px] mt-1.5', epcExpired ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                      {epc.isEstimate ? 'AI estimate' : epc.validUntil ? `${epcExpired ? 'Expired' : 'Valid until'} ${epcDate(epc.validUntil)}` : epc.source === 'register' ? 'GOV.UK register' : 'AI-assessed'}
                    </p>
                  </div>
                  <div className="p-3.5 bg-muted rounded-[12px] border border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Potential rating</p>
                    <div className="flex flex-wrap items-baseline gap-x-1.5 mt-1.5">
                      <span className="text-[40px] font-extrabold leading-none tracking-tighter" style={{ color: epcBandColor(epc.potentialBand ?? epc.currentBand) }}>{epc.potentialBand ?? '—'}</span>
                      <span className="text-[13px] text-muted-foreground whitespace-nowrap">{epc.potentialScore != null ? `Score ${epc.potentialScore} / 100` : '—'}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">With recommended changes</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-3 bg-warning/10 border border-warning/30 rounded-[12px] sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="h-8 w-8 rounded-[10px] bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    {epc.recommendations.length > 0 ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-semibold text-foreground truncate">{epc.recommendations[0].title}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground shrink-0">{epc.source === 'register' ? 'GOV.UK' : 'AI'}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {epc.recommendations[0].detail || 'Recommended improvement'}
                          {epc.recommendations[0].saving ? ` · saves ${epc.recommendations[0].saving}` : ''}
                          {epc.recommendations.length > 1 ? ` · +${epc.recommendations.length - 1} more` : ''}
                        </p>
                      </>
                    ) : epc.isEstimate ? (
                      <>
                        <p className="text-[13px] font-semibold text-foreground">AI estimate from your upload</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">Upload your EPC certificate for an exact, verified rating</p>
                      </>
                    ) : epc.source === 'register' ? (
                      <>
                        <p className="text-[13px] font-semibold text-foreground">Official rating from the GOV.UK register</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">We re-check the register every month</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[13px] font-semibold text-foreground">AI-rated from your certificate</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">Upload a newer certificate to refresh your rating</p>
                      </>
                    )}
                  </div>
                  </div>
                  {epc.source === 'register' ? (
                    <Link
                      to="/dashboard/energy"
                      className="shrink-0 flex items-center justify-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted transition-colors whitespace-nowrap w-full sm:w-auto sm:justify-start">
                      View EPC
                    </Link>
                  ) : (
                    <button
                      onClick={() => setEpcUploadOpen(true)}
                      className="shrink-0 flex items-center justify-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted transition-colors whitespace-nowrap w-full sm:w-auto sm:justify-start">
                      <Upload className="w-3 h-3" /> Update
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 mt-4 mb-3">
                  <div className="p-3.5 bg-muted rounded-[12px] border border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">EPC rating</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <AlertCircle className="w-5 h-5 text-accent shrink-0" />
                      <span className="text-[13px] font-medium text-[#9CA3AF]">Upload to see your rating</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">AI-assessed</p>
                  </div>
                  <div className="p-3.5 bg-muted rounded-[12px] border border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Potential rating</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <AlertCircle className="w-5 h-5 text-accent shrink-0" />
                      <span className="text-[13px] font-medium text-[#9CA3AF]">Upload to see your rating</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">With recommended changes</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-3 bg-warning/10 border border-warning/30 rounded-[12px] sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="h-8 w-8 rounded-[10px] bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">Find your official EPC</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">Look your home up on the GOV.UK register, or upload a certificate or photo for an AI rating</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Link
                      to="/dashboard/energy"
                      className="flex-1 sm:flex-none shrink-0 flex items-center justify-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity whitespace-nowrap">
                      Find EPC
                    </Link>
                    <button
                      onClick={() => setEpcUploadOpen(true)}
                      className="flex-1 sm:flex-none shrink-0 flex items-center justify-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted transition-colors whitespace-nowrap">
                      <Upload className="w-3 h-3" /> Upload
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Row: Activity + TradePilot + DocsGlance ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {/* Activity */}
          <div className="bg-card rounded-[18px] border border-border p-5">
            <Eyebrow icon={Clock} label="Recent activity" />
            <div className="mt-4">
              {recentActivity.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="Your activity will appear here"
                  subtitle="Document uploads, job requests, quotes, EPC ratings and reminders show up as you use HomePlus."
                  ctaLabel="Upload a document"
                  onCta={() => setUploadOpen(true)}
                />
              ) : (
                recentActivity.map((it, i) => {
                  const Icon = ACTIVITY_ICON[it.type] ?? Bell;
                  return (
                    <div key={it.id ?? i} className={`flex items-start gap-3 py-2.5 ${i > 0 ? 'border-t border-border' : ''}`}>
                      <span className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${it.good ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground leading-snug [overflow-wrap:anywhere]">{it.text}</p>
                        {(() => {
                          const actorName =
                            it.actor && it.actor.name && String(it.actor.id) !== String(user?.id) ? it.actor.name : '';
                          const sub = [actorName && `By ${actorName}`, it.sub].filter(Boolean).join(' · ');
                          return sub ? (
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 [overflow-wrap:anywhere]">{sub}</p>
                          ) : null;
                        })()}

                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">{activityTime(it.timestamp)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TradePilot */}
          <div className="bg-card rounded-[18px] border border-border p-5">
            <Eyebrow icon={Wrench} label="TradePilot — quotes in" trailing={
              quotes?.job
                ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 whitespace-nowrap">Awaiting decision</span>
                : awaitingJobsCount > 0
                  ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">{awaitingJobsCount} active</span>
                  : undefined
            } />
            {quotes?.job ? (
              <>
                <div className="mt-3 p-3.5 bg-muted rounded-[14px] mb-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="text-[14px] font-semibold text-foreground truncate">{quotes.job.title}</p>
                    {quotes.job.unassigned && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-medium text-[#B45309]">
                        <Building2 className="h-3 w-3" strokeWidth={1.75} />
                        No property
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {quotes.job.trades_responded} verified{quotes.job.location ? ` ${quotes.job.location}` : ''} trade{quotes.job.trades_responded === 1 ? '' : 's'} responded · avg {quotes.job.avg_response} response
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {quotes.quotes.map((t) => (
                    <div key={t.bid_id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] border ${t.highlight ? 'bg-warning/10 border-warning/30' : 'bg-card border-border'}`}>
                      {t.profile_photo_url ? (
                        <img
                          src={t.profile_photo_url}
                          alt={t.name}
                          className="h-8 w-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[13px] text-foreground shrink-0 ${t.highlight ? 'bg-accent' : 'bg-muted'}`}>
                          {t.name.charAt(0)}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <TraderName name={t.name} traderId={t.trader_id} className="text-[13px] font-semibold text-foreground truncate min-w-0" />
                          {t.tag && t.tag_kind && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${TAG_CLS[t.tag_kind]}`}>{t.tag}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {t.rating != null ? `★ ${t.rating} · ` : ''}{t.jobs} jobs
                        </span>
                      </div>
                      <span className="text-[15px] font-bold text-foreground shrink-0 whitespace-nowrap">{t.price}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={acceptQuote}
                    disabled={quoteBusy || !quotes.recommended_bid_id}
                    title={`Accept ${recommendedName}`}
                    className="flex-1 min-w-0 truncate text-center text-xs font-semibold px-3 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60">
                    Accept {recommendedName}
                  </button>
                  <button
                    onClick={declineAllQuotes}
                    disabled={quoteBusy}
                    className="shrink-0 whitespace-nowrap text-xs font-medium px-3 py-2 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-60">
                    Decline all
                  </button>
                </div>
              </>
            ) : awaitingJobsCount > 0 ? (
              <EmptyState
                icon={Clock}
                title={`${awaitingJobsCount} job${awaitingJobsCount === 1 ? '' : 's'} awaiting quotes`}
                subtitle="Local trades are reviewing your request — we'll alert you when quotes arrive."
                ctaLabel="View jobs"
                href="/dashboard/job-leads"
              />
            ) : (
              <EmptyState
                icon={Wrench}
                title="No quotes awaiting your decision"
                subtitle="Post a job to get quotes from verified local trades."
                ctaLabel="Post a job"
                href="/dashboard/job-leads"
              />
            )}
          </div>

          {/* DocsGlance */}
          <div className="bg-card rounded-[18px] border border-border p-5 md:col-span-2 2xl:col-span-1">
            <Eyebrow icon={FolderOpen} label="Documents at a glance" trailing={
              <Link to="/dashboard/documents"
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border border-border bg-muted text-muted-foreground hover:bg-border transition-colors">
                Open <ArrowRight className="w-3 h-3" />
              </Link>
            } />
            {totalDocs === 0 ? (
              <div className="mt-2">
                <EmptyState
                  icon={FolderOpen}
                  title="Build your home's document vault"
                  subtitle="Upload warranties, certificates and manuals — searchable and safe."
                  ctaLabel="Upload first document"
                  onCta={() => setUploadOpen(true)}
                />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[32px] font-bold tracking-tight text-foreground leading-none">{totalDocs}</span>
                    <span className="text-[12px] text-muted-foreground">file{totalDocs === 1 ? '' : 's'} stored</span>
                  </div>
                  {docHealth.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {docHealth.map(h => (
                        <Link key={h.key} to="/dashboard/documents"
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full whitespace-nowrap hover:opacity-80 transition-opacity ${h.cls}`}>
                          <h.Icon className="w-3 h-3" />
                          {h.n} {h.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-1 gap-x-6 gap-y-1 mt-4">
                  {docRows.slice(0, DOC_ROWS_SHOWN).map(r => (
                    <Link key={r.key} to="/dashboard/documents"
                      className="flex items-center gap-3 rounded-[12px] px-2 py-2 -mx-2 hover:bg-muted transition-colors min-w-0">
                      <span className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                        <r.Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-medium text-foreground truncate">{r.name}</span>
                          <span className="text-[12px] font-semibold text-foreground tabular-nums shrink-0">{r.count}</span>
                        </span>
                        <span className="block h-1 rounded-full bg-muted mt-1.5 overflow-hidden">
                          <span className="block h-full rounded-full bg-foreground/30" style={{ width: `${(r.count / docMax) * 100}%` }} />
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 mt-3">
                  {docRows.length > DOC_ROWS_SHOWN ? (
                    <Link to="/dashboard/documents" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                      +{docRows.length - DOC_ROWS_SHOWN} more<span className="hidden xs:inline"> categories</span>
                      {' · '}{docRows.slice(DOC_ROWS_SHOWN).reduce((n, r) => n + r.count, 0)} files
                    </Link>
                  ) : <span />}
                  <button type="button" onClick={() => setUploadOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 -mr-3 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Build your home MOT score — answer questions ────── */}
        <div className="bg-card rounded-[18px] border border-border p-5">
          <Eyebrow
            icon={ClipboardList}
            label="Build your home MOT score"
            trailing={
              <span className="text-[13px] text-muted-foreground">
                <b className="text-foreground font-bold">{homeMotScore}</b> / {homeMotMax}
              </span>
            }
          />
          <p className="text-[11px] text-muted-foreground mt-2">Three 60-second checks. Each one grows your score.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {(['A', 'B', 'C'] as HomeMotStep[]).map((step) => {
              const cfg = STEP_CONFIG[step];
              const StepIcon = cfg.icon;
              const done = motYesCount(step);
              const total = motTotal(step);
              const pct = total ? (done / total) * 100 : 0;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setMotStep(step)}
                  className="text-left rounded-[14px] border border-border bg-card hover:bg-muted hover:shadow-sm transition-all p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <StepIcon className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground leading-none">Step {step}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{STEP_LABEL[step]}</p>
                    </div>
                  </div>
                  <HealthBar value={pct} segments={total} />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{done}/{total} ticked</span>
                    <span className="font-semibold text-foreground">+{motEarned(step)} pts</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Upload modal ─────────────────────────────────────── */}
      <DocsUploadDialog
        openForm={uploadOpen}
        setOpenForm={setUploadOpen}
        refetch={() => {
          queryClient.invalidateQueries({ queryKey: ['documents-summary'] });
          queryClient.invalidateQueries({ queryKey: ['epc'] });
          queryClient.invalidateQueries({ queryKey: ['systems-health'] });
        }}
        prefillDiscipline={undefined}
      />

      {/* ── EPC certificate upload (AI rating) ───────────────── */}
      <DocsUploadDialog
        openForm={epcUploadOpen}
        setOpenForm={setEpcUploadOpen}
        refetch={() => {
          queryClient.invalidateQueries({ queryKey: ['documents-summary'] });
          queryClient.invalidateQueries({ queryKey: ['epc'] });
          queryClient.invalidateQueries({ queryKey: ['systems-health'] });
        }}
        prefillDiscipline="energy_epc"
      />

      {/* ── System health details ──────────────────────────── */}
      <SystemHealthDialog
        system={selectedSystem}
        open={selectedSystem !== null}
        onOpenChange={(o) => !o && setSystemKey(null)}
        icon={selectedSystem ? SYSTEM_ICON[selectedSystem.key] : undefined}
        propertyId={activePropertyId}
        onUpload={systemActionHandlers.onUpload}
        onQuote={systemActionHandlers.onQuote}
        onMot={systemActionHandlers.onMot}
        onLogWork={systemActionHandlers.onLogWork}
      />
      <DocsUploadDialog
        openForm={certUploadOpen}
        setOpenForm={setCertUploadOpen}
        refetch={() => {
          queryClient.invalidateQueries({ queryKey: ['documents-summary'] });
          queryClient.invalidateQueries({ queryKey: ['systems-health'] });
        }}
        prefillDiscipline="compliance"
        prefill={certUploadPrefill}
      />
      <Quote open={quoteOpen} setOpen={setQuoteOpen} prefill={quotePrefill} />
      {/* Log work / reminders from System Health ("Already done" saves a completed record). */}
      <AddEvent
        hideTrigger
        open={logWork !== null}
        onOpenChange={(o) => { if (!o) setLogWork(null); }}
        initialMode={logWork?.mode}
        initialDate={logWork?.date}
        initialValues={logWork?.values}
      />

      {/* ── Home MOT questions modal ─────────────────────────── */}
      <HomeMotWizard
        step={motStep}
        open={motStep !== null}
        onOpenChange={(o) => { if (!o) { setMotStep(null); setMotFocus(null); } }}
        initialAnswers={motStep ? (motAnswers[motStep] ?? {}) : undefined}
        initialDates={motDates}
        onSave={handleMotSave}
        propertyId={activePropertyId}
        focusQuestion={motFocus}
      />
    </DashboardLayout>
  );
};

export default HomePlusDashboard;
