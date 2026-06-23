import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Upload, Flame, Zap, Droplets, CloudRain, TreePine,
  Clock, ShieldCheck, Umbrella, BookOpen, ClipboardList,
  Ruler, Leaf, FolderOpen, Wrench, CheckCircle, Mail,
  TrendingUp, AlertCircle, CalendarDays, PoundSterling,
  Cpu, Star, ArrowRight, CalendarCheck, FileText,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import useFetch from '@/hooks/useFetch';
import { getEvents, fetchMotScore, fetchDocumentSummary, fetchLastCompleted, fetchAnnualSpend, fetchTimeline, fetchAttention, fetchRecentActivity, fetchQuotesSummary, declineQuotes, fetchEpc, type AnnualSpendYear, type AttentionItem, type ActivityItem } from '@/lib/Api2';
import { fetchData, modifyBid } from '@/lib/Api';
import { toast } from '@/lib/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DocsUploadDialog from '@/components/docsUploadDialog';
import HomeMotWizard, { STEP_CONFIG, type HomeMotStep } from '@/components/homemot/HomeMotWizard';
import {
  BarChart, Bar, Cell, XAxis, PieChart, Pie,
  Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';

// ── Inline primitives ─────────────────────────────────────────────────────────

function HealthBar({ value, segments = 20 }: { value: number; segments?: number }) {
  const filled = Math.round((value / 100) * segments);
  const color = value >= 80 ? '#10B981' : value >= 60 ? '#FBBF24' : '#EF4444';
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
  const coords = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
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
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ overflow: 'visible' }}>
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-[#F5F5F0] rounded-full flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#1A1A1A]" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">{label}</span>
      </div>
      {trailing && <div>{trailing}</div>}
    </div>
  );
}

// ── Recent activity helpers ───────────────────────────────────────────────────

// Notification type → icon for the Recent Activity card.
const ACTIVITY_ICON: Record<string, React.ElementType> = {
  new_quote: Mail,
  job_completed: CheckCircle,
  bid_accepted: CheckCircle,
  new_review: Star,
  job_status: Clock,
  bid_rejected: AlertCircle,
};

const activityTime = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : formatDistanceToNow(d, { addSuffix: true });
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
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [epcUploadOpen, setEpcUploadOpen] = useState(false);
  const [spendYear, setSpendYear] = useState<number>(new Date().getFullYear());
  const [motStep, setMotStep] = useState<HomeMotStep | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);

  // ── API hooks ──────────────────────────────────────────────────────────────

  const { data: scoreResp } = useFetch('/api/v1/mot/score/', {
    queryKey: ['mot-score'],
    queryFn: fetchMotScore,
  });
  // Full MOT payload (score + per-step answers/breakdown) drives both the vitals
  // tile and the "Build your home MOT score" step card below.
  const motScore = (scoreResp?.data ?? null) as {
    score?: number;
    breakdown?: Record<string, number>;
    answers?: Record<HomeMotStep, Record<string, boolean>>;
  } | null;
  const homeMotScore: number = motScore?.score ?? 8;
  const motAnswers: Record<HomeMotStep, Record<string, boolean>> =
    motScore?.answers ?? { A: {}, B: {}, C: {} };

  // Last-completed dates (keyed by template slug) hydrate the wizard date pickers.
  const { data: lastCompletedResp } = useFetch('/api/v1/mot/last-completed/', {
    queryKey: ['mot-last-completed'],
    queryFn: fetchLastCompleted,
  });
  const motDates: Record<string, string> = lastCompletedResp?.data ?? {};

  // Per-step progress for the MOT step card.
  const STEP_LABEL: Record<HomeMotStep, string> = { A: 'Compliance', B: 'Documents', C: 'Maintenance' };
  const motYesCount = (s: HomeMotStep) => Object.values(motAnswers[s] ?? {}).filter(Boolean).length;
  const motTotal = (s: HomeMotStep) => STEP_CONFIG[s].questions.length;
  const motEarned = (s: HomeMotStep) =>
    Math.round(motScore?.breakdown?.[s] ?? Math.min(STEP_CONFIG[s].maxPoints, motYesCount(s) * STEP_CONFIG[s].pointsPerYes));
  // Tasks + score are persisted by the wizard; refresh the derived dashboard views.
  const handleMotSave = () =>
    ['mot-score', 'mot-last-completed', 'event'].forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));

  const { data: eventData } = useFetch('/api/v1/events/', {
    queryKey: ['event'],
    queryFn: getEvents,
  });

  const { data: docSummaryResp } = useFetch('/api/v1/documents/summary/', {
    queryKey: ['documents-summary'],
    queryFn: fetchDocumentSummary,
  });

  const { data: annualSpendResp } = useFetch('/api/v1/insights/annual-spend/', {
    queryKey: ['annual-spend'],
    queryFn: fetchAnnualSpend,
    staleTime: 5 * 60 * 1000,
  });

  const { data: timelineResp } = useFetch('/api/v1/insights/timeline/', {
    queryKey: ['timeline'],
    queryFn: fetchTimeline,
    staleTime: 5 * 60 * 1000,
  });

  const { data: attentionResp } = useFetch('/api/v1/insights/attention/', {
    queryKey: ['attention'],
    queryFn: fetchAttention,
    staleTime: 5 * 60 * 1000,
  });

  const { data: quotesResp } = useFetch('/api/v1/jobs/quotes-summary/', {
    queryKey: ['quotes'],
    queryFn: fetchQuotesSummary,
    staleTime: 5 * 60 * 1000,
  });

  // AI-generated EPC rating (null until an EPC certificate has been analysed).
  const { data: epcResp } = useFetch('/api/v1/insights/epc/', {
    queryKey: ['epc'],
    queryFn: fetchEpc,
    staleTime: 5 * 60 * 1000,
  });
  const epc = epcResp?.data ?? null;

  const { data: notifData } = useQuery({
    queryKey: ['ho-notifications'],
    queryFn: () => fetchData<{ notifications: unknown[]; unread_count: number }>('/api/v1/notifications/').then(r => (r as { data?: { unread_count: number } })?.data ?? r),
    staleTime: 5 * 60 * 1000,
  });
  const unreadCount: number = (notifData as { unread_count?: number } | null)?.unread_count ?? 0;

  const { data: activityResp } = useFetch('/api/v1/notifications/recent/', {
    queryKey: ['recent-activity'],
    queryFn: () => fetchRecentActivity(6),
    staleTime: 60 * 1000,
  });
  const recentActivity: ActivityItem[] = Array.isArray(activityResp?.data) ? activityResp.data : [];

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
  const validDocs: number = docSummary?.valid ?? 0;
  const completeness: number = totalDocs > 0 ? Math.round((validDocs / totalDocs) * 100) : 0;
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
  const ATTN_TAG: Record<AttnTone, string> = { danger: 'bg-red-100 text-red-700', warning: 'bg-yellow-100 text-yellow-800', neutral: 'bg-[#F5F5F0] text-[#6B6B6B]' };

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

  const SYSTEMS = [
    { name: 'Heating', Icon: Flame, score: 86, last: 'Serviced 04 Jun 2026', next: 'Next service May 2027', note: 'Worcester Bosch 28i' },
    { name: 'Electrical', Icon: Zap, score: 92, last: 'EICR 22 Jan 2026', next: 'Next test Jan 2031', note: '5-year inspection valid' },
    { name: 'Plumbing', Icon: Droplets, score: 78, last: 'Mains check 14 Mar', next: 'Stopcock check due', note: 'Low pressure noted x2' },
    { name: 'Roof & Exterior', Icon: CloudRain, score: 64, last: 'Gutter clean Oct 2024', next: 'Clean due Sep 2026', note: 'Missing tile flagged' },
    { name: 'Garden & Grounds', Icon: TreePine, score: 71, last: 'Hedge cut 02 May', next: 'Trim due Jun 2026', note: '—' },
  ];

  // TradePilot — quotes in: live from /api/v1/jobs/quotes-summary/ (real bids).
  const quotes = quotesResp?.data ?? null;
  const TAG_CLS: Record<string, string> = {
    best_price: 'bg-green-100 text-green-700',
    fastest: 'bg-blue-100 text-blue-700',
    top_rated: 'bg-[#F5F5F0] text-[#6B6B6B]',
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

  const DOC_CATS = [
    { key: 'compliance', name: 'Compliance', color: '#A855F7', bg: '#F3E8FF', Icon: ShieldCheck },
    { key: 'insurance', name: 'Insurance', color: '#3B82F6', bg: '#DBEAFE', Icon: Umbrella },
    { key: 'energy_epc', name: 'Energy', color: '#10B981', bg: '#DCFCE7', Icon: Leaf },
    { key: 'manuals_appliances', name: 'Manuals', color: '#F59E0B', bg: '#FEF3C7', Icon: BookOpen },
    { key: 'surveys_reports', name: 'Surveys', color: '#64748B', bg: '#E2E8F0', Icon: ClipboardList },
    { key: 'planning', name: 'Planning', color: '#14B8A6', bg: '#CCFBF1', Icon: Ruler },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">

        {/* ── PageHeader ─────────────────────────────────────── */}
        <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Good morning</p>
            <h1 className="text-[26px] font-bold tracking-tight text-[#1A1A1A] mt-1 leading-none">{firstName}'s home pulse</h1>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/dashboard/notifications"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E8E8E3] bg-white text-sm font-medium text-[#4A4A4A] hover:bg-[#F5F5F0] transition-colors"
            >
              <Bell className="w-4 h-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-[#FBBF24] text-[#1A1A1A] rounded-full min-w-[18px] h-[18px] text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1A1A1A] text-white text-sm font-medium hover:bg-[#333] transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload document
            </button>
          </div>
        </div>

        {/* ── Vitals strip — 4 tiles ──────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MOT */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5 flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Home MOT score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[28px] font-bold tracking-tight text-[#1A1A1A] leading-none">{homeMotScore}</span>
              <span className="text-[13px] text-[#8B8B8B]">/ 100</span>
            </div>
            <p className="text-[11px] text-[#8B8B8B] flex items-center gap-1">
              <span className="text-green-600">↑</span> +8 this month
            </p>
            <div className="mt-1"><HealthBar value={homeMotScore} segments={12} /></div>
          </div>
          {/* YTD Spend */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5 flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">YTD home spend</p>
            <span className="text-[28px] font-bold tracking-tight text-[#1A1A1A] leading-none">{fmtGBP(ytdSpend)}</span>
            <p className="text-[11px] text-[#8B8B8B] flex items-center gap-1">
              {ytdDeltaPct == null ? (
                <span>First year tracked</span>
              ) : (
                <>
                  <span className={ytdDeltaPct < 0 ? 'text-green-600' : ytdDeltaPct > 0 ? 'text-red-500' : 'text-[#8B8B8B]'}>
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
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5 flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Documents</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[28px] font-bold tracking-tight text-[#1A1A1A] leading-none">{totalDocs}</span>
              <span className="text-[13px] text-[#8B8B8B]">files</span>
            </div>
            <p className="text-[11px] text-[#8B8B8B] flex items-center gap-1">
              <span className="text-green-600">↑</span> {completeness}% complete
            </p>
            <div className="mt-1">
              <Sparkline data={[4,5,6,6,7,7,8,8,9,9,Math.max(totalDocs, 9),Math.max(totalDocs, 9)]} />
            </div>
          </div>
          {/* Upcoming events */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5 flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Upcoming events</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[28px] font-bold tracking-tight text-[#1A1A1A] leading-none">{eventsNext30}</span>
              <span className="text-[13px] text-[#8B8B8B]">tasks</span>
            </div>
            <p className="text-[11px] text-[#8B8B8B]">
              {eventsNext30 === 0 ? 'Nothing scheduled · all clear' : 'Due in next 30 days'}
            </p>
            <div className="mt-1">
              <Sparkline data={[2,1,3,2,4,3,eventsNext30 || 2,eventsNext30 || 2]} color="#A855F7" />
            </div>
          </div>
        </div>

        {/* ── Timeline ────────────────────────────────────────── */}
        <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
          <Eyebrow icon={CalendarDays} label="12-week timeline" trailing={
            <div className="flex items-center gap-3.5 text-[11px] text-[#8B8B8B]">
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
              <div className="absolute top-3 left-[54px] right-[54px] flex z-0 pointer-events-none">
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
                  <div className="text-center">
                    <p className="text-[11px] leading-tight whitespace-nowrap"
                      style={{ fontWeight: n.tone === 'now' ? 700 : 500, color: TONE_LABEL[n.tone] }}>
                      {n.label}
                    </p>
                    <p className="text-[10px] text-[#8B8B8B] mt-0.5">
                      {n.diffDays === 0 ? 'today' : n.diffDays > 0 ? `+${n.diffDays}d` : `${n.diffDays}d`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row: SystemHealth + Attention ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
          {/* System health */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
            <Eyebrow icon={Cpu} label="System health" trailing={
              <Link to="/dashboard/calendar"
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-[#E8E8E3] bg-[#F5F5F0] text-[#4A4A4A] hover:bg-[#E8E8E3] transition-colors">
                <Wrench className="w-3 h-3" /> Log work
              </Link>
            } />
            <div className="mt-4">
              {SYSTEMS.map((s, i) => (
                <div key={s.name}
                  className={`grid items-center gap-5 py-3.5 ${i > 0 ? 'border-t border-[#E8E8E3]' : ''}`}
                  style={{ gridTemplateColumns: '200px 1fr 56px' }}>
                  <div className="flex items-center gap-2.5">
                    <span className="h-8 w-8 rounded-[10px] bg-[#F5F5F0] text-[#1A1A1A] flex items-center justify-center shrink-0">
                      <s.Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-[#1A1A1A]">{s.name}</p>
                      <p className="text-[11px] text-[#8B8B8B]">{s.note}</p>
                    </div>
                  </div>
                  <div>
                    <HealthBar value={s.score} segments={20} />
                    <div className="flex justify-between mt-1.5 text-[11px] text-[#6B6B6B]">
                      <span>{s.last}</span>
                      <span className="text-[#8B8B8B]">{s.next}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[24px] font-bold tracking-tight text-[#1A1A1A] leading-none">{s.score}</span>
                    <span className="text-[10px] text-[#8B8B8B] ml-0.5">/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attention */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
            <Eyebrow icon={AlertCircle} label="Needs attention" trailing={
              <span className="text-[11px] text-[#8B8B8B]">{attentionTotal} item{attentionTotal === 1 ? '' : 's'}</span>
            } />
            <div className="flex flex-col gap-2 mt-4">
              {attentionItems.length === 0 ? (
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[#ECFDF5] border border-[#A7F3D0]/70">
                  <span className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0 bg-white text-[#10B981]">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">You're all caught up</p>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5">Nothing needs your attention right now.</p>
                  </div>
                </div>
              ) : attentionItems.map((it, i) => {
                const Icon = ATTN_ICON[it.icon] ?? AlertCircle;
                const tone = it.tone as AttnTone;
                return (
                  <div key={`${it.title}-${i}`} className="flex items-center gap-3 p-3 rounded-[12px] bg-[#FAFAF7] border border-[#E8E8E3]">
                    <span className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ background: ATTN_BG[tone], color: ATTN_FG[tone] }}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ATTN_TAG[tone]}`}>{it.tag}</span>
                        <span className="text-[11px] text-[#8B8B8B]">{it.meta}</span>
                      </div>
                      <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{it.title}</p>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5 leading-snug">{it.sub}</p>
                    </div>
                    <Link to={it.path}
                      className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-[#4A4A4A] hover:bg-[#F5F5F0] transition-colors whitespace-nowrap">
                      {it.cta}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Row: Spend + EPC ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Spend tracker */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
            <Eyebrow icon={PoundSterling} label="Annual spend tracker" trailing={
              <div className="flex gap-1 bg-[#F5F5F0] p-1 rounded-full">
                {spendYearTabs.map(y => (
                  <button key={y} onClick={() => setSpendYear(y)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 ${y === spendYear ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#8B8B8B] hover:text-[#4A4A4A]'}`}>
                    {y}
                  </button>
                ))}
              </div>
            } />
            <div className="grid grid-cols-2 gap-6 items-start mt-4">
              {/* Left: BigStat + BarChart */}
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[28px] font-bold tracking-tight text-[#1A1A1A] leading-none">{yearData.total}</span>
                  <p className="text-[11px] text-[#8B8B8B] mt-1">{yearData.sub}</p>
                </div>
                <div className="h-[72px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={spendBarData} barCategoryGap="25%" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="month" tickLine={false} axisLine={false}
                        tick={{ fontSize: 9, fill: '#8B8B8B' }} interval={0} />
                      <RTooltip
                        cursor={{ fill: '#F5F5F0', radius: 4 }}
                        content={({ active, payload }) =>
                          active && payload?.length ? (
                            <div className="bg-white border border-[#E8E8E3] rounded-[8px] px-2.5 py-1.5 shadow-sm text-[11px]">
                              <span className="font-semibold text-[#1A1A1A]">£{payload[0].value}</span>
                            </div>
                          ) : null
                        }
                      />
                      <Bar dataKey="spend" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={400}>
                        {spendBarData.map((entry, i) => (
                          <Cell key={i} fill={entry.highlight ? '#FBBF24' : '#E4E4DE'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Right: Donut + legend */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendCats.map(c => ({ name: c.name, value: c.v, fill: c.color }))}
                        cx="50%" cy="50%"
                        innerRadius={32} outerRadius={46}
                        dataKey="value"
                        isAnimationActive animationBegin={0} animationDuration={500}
                        strokeWidth={0}
                      >
                        {spendCats.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[15px] font-bold text-[#1A1A1A] leading-none">{yearData.center}</span>
                    <span className="text-[9px] text-[#8B8B8B] uppercase tracking-wider mt-0.5">YTD</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  {spendCats.map(c => (
                    <div key={c.name} className="flex items-center gap-2 text-[12px]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="flex-1 text-[#4A4A4A] truncate">{c.name}</span>
                      <span className="font-semibold text-[#1A1A1A]">£{c.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* EPC */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
            <Eyebrow icon={Leaf} label="Energy & EPC" trailing={
              epc ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: epcBandBadge(epc.currentBand).bg, color: epcBandBadge(epc.currentBand).color }}>
                  EPC {epc.currentBand}
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F5F5F0] text-[#8B8B8B]">AI-powered</span>
              )
            } />

            {epc ? (
              <>
                <div className="grid grid-cols-2 gap-2.5 mt-4 mb-3">
                  <div className="p-3.5 bg-[#FAFAF7] rounded-[12px] border border-[#E8E8E3]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">EPC rating</p>
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span className="text-[40px] font-extrabold leading-none tracking-tighter" style={{ color: epcBandColor(epc.currentBand) }}>{epc.currentBand || '—'}</span>
                      <span className="text-[13px] text-[#6B6B6B]">Score {epc.currentScore ?? '—'} / 100</span>
                    </div>
                    <p className="text-[11px] text-[#8B8B8B] mt-1.5">{epc.validUntil ? `Valid until ${epcDate(epc.validUntil)}` : 'AI-assessed'}</p>
                  </div>
                  <div className="p-3.5 bg-[#FAFAF7] rounded-[12px] border border-[#E8E8E3]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Potential rating</p>
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span className="text-[40px] font-extrabold leading-none tracking-tighter" style={{ color: epcBandColor(epc.potentialBand ?? epc.currentBand) }}>{epc.potentialBand ?? '—'}</span>
                      <span className="text-[13px] text-[#6B6B6B]">{epc.potentialScore != null ? `Score ${epc.potentialScore} / 100` : '—'}</span>
                    </div>
                    <p className="text-[11px] text-[#8B8B8B] mt-1.5">With recommended changes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px]">
                  <span className="h-8 w-8 rounded-[10px] bg-[#FBBF24] text-[#1A1A1A] flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    {epc.recommendations.length > 0 ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{epc.recommendations[0].title}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#1A1A1A] text-white shrink-0">AI</span>
                        </div>
                        <p className="text-[11px] text-[#6B6B6B] mt-0.5 leading-snug">
                          {epc.recommendations[0].detail || 'Recommended improvement'}
                          {epc.recommendations[0].saving ? ` · saves ${epc.recommendations[0].saving}` : ''}
                          {epc.recommendations.length > 1 ? ` · +${epc.recommendations.length - 1} more` : ''}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[13px] font-semibold text-[#1A1A1A]">AI-rated from your certificate</p>
                        <p className="text-[11px] text-[#6B6B6B] mt-0.5 leading-snug">Upload a newer certificate to refresh your rating</p>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setEpcUploadOpen(true)}
                    className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-[#4A4A4A] hover:bg-[#F5F5F0] transition-colors whitespace-nowrap">
                    <Upload className="w-3 h-3" /> Update
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 mt-4 mb-3">
                  <div className="p-3.5 bg-[#FAFAF7] rounded-[12px] border border-[#E8E8E3]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">EPC rating</p>
                    <span className="block text-[40px] font-extrabold text-[#D1D5DB] leading-none tracking-tighter mt-1.5">—</span>
                    <p className="text-[11px] text-[#8B8B8B] mt-1.5">No certificate yet</p>
                  </div>
                  <div className="p-3.5 bg-[#FAFAF7] rounded-[12px] border border-[#E8E8E3]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Potential rating</p>
                    <span className="block text-[40px] font-extrabold text-[#D1D5DB] leading-none tracking-tighter mt-1.5">—</span>
                    <p className="text-[11px] text-[#8B8B8B] mt-1.5">With recommended changes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px]">
                  <span className="h-8 w-8 rounded-[10px] bg-[#FBBF24] text-[#1A1A1A] flex items-center justify-center shrink-0">
                    <Leaf className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">Get an instant AI EPC rating</p>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5 leading-snug">Upload your EPC certificate — we'll read your rating &amp; recommendations</p>
                  </div>
                  <button
                    onClick={() => setEpcUploadOpen(true)}
                    className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-[#4A4A4A] hover:bg-[#F5F5F0] transition-colors whitespace-nowrap">
                    <Upload className="w-3 h-3" /> Upload
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Row: Activity + TradePilot + DocsGlance ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
            <Eyebrow icon={Clock} label="Recent activity" />
            <div className="mt-4">
              {recentActivity.length === 0 ? (
                <p className="text-[12px] text-[#8B8B8B] py-6 text-center">No recent activity yet</p>
              ) : (
                recentActivity.map((it, i) => {
                  const Icon = ACTIVITY_ICON[it.type] ?? Bell;
                  return (
                    <div key={it.id ?? i} className={`flex items-start gap-3 py-2.5 ${i > 0 ? 'border-t border-[#E8E8E3]' : ''}`}>
                      <span className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${it.good ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F5F5F0] text-[#4A4A4A]'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#1A1A1A] leading-snug">{it.text}</p>
                        {it.sub && <p className="text-[11px] text-[#8B8B8B] mt-0.5">{it.sub}</p>}
                      </div>
                      <span className="text-[11px] text-[#8B8B8B] shrink-0">{activityTime(it.timestamp)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TradePilot */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
            <Eyebrow icon={Wrench} label="TradePilot — quotes in" trailing={
              quotes?.job
                ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Awaiting decision</span>
                : undefined
            } />
            {quotes?.job ? (
              <>
                <div className="mt-3 p-3.5 bg-[#F5F5F0] rounded-[14px] mb-3">
                  <p className="text-[14px] font-semibold text-[#1A1A1A] truncate">{quotes.job.title}</p>
                  <p className="text-[12px] text-[#6B6B6B] mt-0.5">
                    {quotes.job.trades_responded} verified{quotes.job.location ? ` ${quotes.job.location}` : ''} trade{quotes.job.trades_responded === 1 ? '' : 's'} responded · avg {quotes.job.avg_response} response
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {quotes.quotes.map((t) => (
                    <div key={t.bid_id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] border ${t.highlight ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-white border-[#E8E8E3]'}`}>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[13px] text-[#1A1A1A] shrink-0 ${t.highlight ? 'bg-[#FBBF24]' : 'bg-[#F5F5F0]'}`}>
                        {t.name.charAt(0)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-semibold text-[#1A1A1A]">{t.name}</span>
                          {t.tag && t.tag_kind && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TAG_CLS[t.tag_kind]}`}>{t.tag}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#8B8B8B]">
                          {t.rating != null ? `★ ${t.rating} · ` : ''}{t.jobs} jobs
                        </span>
                      </div>
                      <span className="text-[15px] font-bold text-[#1A1A1A] shrink-0">{t.price}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={acceptQuote}
                    disabled={quoteBusy || !quotes.recommended_bid_id}
                    className="flex-1 text-center text-xs font-semibold px-3 py-2 rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors disabled:opacity-60">
                    Accept {recommendedName}
                  </button>
                  <button
                    onClick={declineAllQuotes}
                    disabled={quoteBusy}
                    className="text-xs font-medium px-3 py-2 rounded-full border border-[#E8E8E3] text-[#4A4A4A] hover:bg-[#F5F5F0] transition-colors disabled:opacity-60">
                    Decline all
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center text-center py-6">
                <div className="h-9 w-9 rounded-[10px] bg-[#F5F5F0] flex items-center justify-center mb-2">
                  <Wrench className="w-4 h-4 text-[#8B8B8B]" />
                </div>
                <p className="text-[13px] font-semibold text-[#1A1A1A]">No quotes awaiting your decision</p>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">Post a job to get quotes from local trades.</p>
                <Link to="/dashboard/job-leads"
                  className="mt-3 text-xs font-semibold px-3.5 py-2 rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors">
                  Post a job
                </Link>
              </div>
            )}
          </div>

          {/* DocsGlance */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
            <Eyebrow icon={FolderOpen} label="Documents at a glance" trailing={
              <Link to="/dashboard/documents"
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border border-[#E8E8E3] bg-[#F5F5F0] text-[#4A4A4A] hover:bg-[#E8E8E3] transition-colors">
                Open <ArrowRight className="w-3 h-3" />
              </Link>
            } />
            <div className="flex items-center gap-3.5 py-3 my-3 border-y border-[#E8E8E3]">
              <div className="shrink-0">
                <span className="text-[28px] font-bold tracking-tight text-[#1A1A1A] leading-none">{totalDocs}</span>
                <span className="text-[12px] text-[#8B8B8B] ml-1.5">files · {completeness}% complete</span>
              </div>
              <div className="flex-1 h-1.5 bg-[#EEEEEA] rounded-full overflow-hidden">
                <div className="h-full bg-[#FBBF24] rounded-full transition-all" style={{ width: `${completeness}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DOC_CATS.map(c => {
                const count = docsByDiscipline[c.key] ?? 0;
                return (
                  <div key={c.key} className="p-2.5 rounded-[10px] bg-[#FAFAF7] border border-[#E8E8E3]">
                    <span className="inline-flex h-6 w-6 rounded-[7px] items-center justify-center mb-1.5"
                      style={{ background: c.bg, color: c.color }}>
                      <c.Icon className="w-3 h-3" />
                    </span>
                    <p className="text-[12px] font-semibold text-[#1A1A1A]">{c.name}</p>
                    <p className="text-[11px] text-[#8B8B8B] mt-0.5">{count} {count === 1 ? 'file' : 'files'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Build your home MOT score — answer questions ────── */}
        <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
          <Eyebrow
            icon={ClipboardList}
            label="Build your home MOT score"
            trailing={
              <span className="text-[13px] text-[#8B8B8B]">
                <b className="text-[#1A1A1A] font-bold">{homeMotScore}</b> / 100
              </span>
            }
          />
          <p className="text-[11px] text-[#8B8B8B] mt-2">Three 60-second checks. Each one grows your score.</p>
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
                  className="text-left rounded-[14px] border border-[#E8E8E3] bg-white hover:bg-[#F5F5F0] hover:shadow-sm transition-all p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-[#F5F5F0] flex items-center justify-center shrink-0">
                      <StepIcon className="w-4 h-4 text-[#1A1A1A]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1A1A] leading-none">Step {step}</p>
                      <p className="text-[11px] text-[#8B8B8B] mt-0.5 truncate">{STEP_LABEL[step]}</p>
                    </div>
                  </div>
                  <HealthBar value={pct} segments={total} />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8B8B8B]">{done}/{total} ticked</span>
                    <span className="font-semibold text-[#1A1A1A]">+{motEarned(step)} pts</span>
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
        }}
        prefillDiscipline="energy_epc"
      />

      {/* ── Home MOT questions modal ─────────────────────────── */}
      <HomeMotWizard
        step={motStep}
        open={motStep !== null}
        onOpenChange={(o) => !o && setMotStep(null)}
        initialAnswers={motStep ? (motAnswers[motStep] ?? {}) : undefined}
        initialDates={motDates}
        onSave={handleMotSave}
      />
    </DashboardLayout>
  );
};

export default HomePlusDashboard;
