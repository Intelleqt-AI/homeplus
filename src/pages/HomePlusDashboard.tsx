import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Upload, Flame, Zap, Droplets, CloudRain, TreePine,
  Clock, ShieldCheck, Umbrella, BookOpen, ClipboardList,
  Ruler, Leaf, FolderOpen, Wrench, CheckCircle, Mail,
  TrendingUp, AlertCircle, Shield, CalendarDays, PoundSterling,
  Cpu, Star, ArrowRight, CalendarCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import useFetch from '@/hooks/useFetch';
import { getEvents, fetchMotScore, fetchDocumentSummary } from '@/lib/Api2';
import { fetchData } from '@/lib/Api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DocsUploadDialog from '@/components/docsUploadDialog';
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

// ── Main component ────────────────────────────────────────────────────────────

const HomePlusDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [spendYear, setSpendYear] = useState<'2024' | '2025' | '2026'>('2026');

  // ── API hooks ──────────────────────────────────────────────────────────────

  const { data: scoreResp } = useFetch('/api/v1/mot/score/', {
    queryKey: ['mot-score'],
    queryFn: fetchMotScore,
  });
  const homeMotScore: number = (scoreResp?.data as { score?: number } | null)?.score ?? 8;

  const { data: eventData } = useFetch('/api/v1/events/', {
    queryKey: ['event'],
    queryFn: getEvents,
  });

  const { data: docSummaryResp } = useFetch('/api/v1/documents/summary/', {
    queryKey: ['documents-summary'],
    queryFn: fetchDocumentSummary,
  });

  const { data: notifData } = useQuery({
    queryKey: ['ho-notifications'],
    queryFn: () => fetchData<{ notifications: unknown[]; unread_count: number }>('/api/v1/notifications/').then(r => (r as { data?: { unread_count: number } })?.data ?? r),
    staleTime: 5 * 60 * 1000,
  });
  const unreadCount: number = (notifData as { unread_count?: number } | null)?.unread_count ?? 0;

  // ── Computed values ────────────────────────────────────────────────────────

  const firstName: string =
    (user as { user_metadata?: { full_name?: string } } | null)?.user_metadata?.full_name?.split(' ')[0] ?? 'there';

  type RawEvent = { id?: unknown; title?: string; date?: string | null; eventType?: string; type?: string };
  const rawEvents: RawEvent[] = Array.isArray(eventData?.data) ? eventData.data : Array.isArray(eventData) ? eventData : [];
  const dashEvents = rawEvents.map(r => ({
    title: r.title || 'Untitled',
    date: r.date ? new Date(r.date.split('T')[0] + 'T00:00:00') : null,
  }));

  const docSummary = (docSummaryResp?.data ?? docSummaryResp) as { total?: number; valid?: number; expiring?: number; expired?: number } | null;
  const totalDocs: number = docSummary?.total ?? 0;
  const validDocs: number = docSummary?.valid ?? 0;
  const completeness: number = totalDocs > 0 ? Math.round((validDocs / totalDocs) * 100) : 0;

  // Build timeline
  const now = new Date();
  type ToneName = 'good' | 'warn' | 'now' | 'future';
  const DUMMY_TIMELINE: { label: string; diffDays: number; tone: ToneName }[] = [
    { label: 'EICR passed', diffDays: -22, tone: 'good' },
    { label: 'Insurance renewed', diffDays: -14, tone: 'good' },
    { label: 'Boiler booked', diffDays: -4, tone: 'good' },
    { label: 'Today', diffDays: 0, tone: 'now' },
    { label: 'Boiler service', diffDays: 4, tone: 'warn' },
    { label: 'Gas Safety', diffDays: 14, tone: 'warn' },
    { label: 'Quarterly check', diffDays: 29, tone: 'future' },
    { label: 'EPC review', diffDays: 42, tone: 'future' },
  ];
  const realNodes = dashEvents
    .filter(ev => ev.date)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime())
    .slice(0, 7)
    .map(ev => {
      const diff = Math.round((ev.date!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const tone: ToneName = diff < 0 ? 'good' : diff === 0 ? 'now' : diff <= 14 ? 'warn' : 'future';
      return { label: ev.title, diffDays: diff, tone };
    });
  const hasToday = realNodes.some(n => n.tone === 'now');
  const timelineNodes: { label: string; diffDays: number; tone: ToneName }[] =
    realNodes.length >= 3
      ? (hasToday
          ? realNodes
          : [...realNodes.filter(n => n.diffDays < 0), { label: 'Today', diffDays: 0, tone: 'now' as ToneName }, ...realNodes.filter(n => n.diffDays >= 0)].slice(0, 8)
        )
      : DUMMY_TIMELINE;

  const TONE_COLOR: Record<ToneName, string> = { good: '#10B981', warn: '#FBBF24', now: '#1A1A1A', future: '#D1D5DB' };
  const TONE_BG: Record<ToneName, string> = { good: '#ECFDF5', warn: '#FFFBEB', now: '#FBBF24', future: '#F3F4F6' };
  const TONE_LINE: Record<ToneName, string> = { good: '#A7F3D0', warn: '#FDE68A', now: '#FBBF24', future: '#E5E7EB' };
  const TONE_LABEL: Record<ToneName, string> = { good: '#4A4A4A', warn: '#1A1A1A', now: '#1A1A1A', future: '#8B8B8B' };

  // Static data
  type AttnTone = 'danger' | 'warning' | 'neutral';
  const ATTENTION: { tone: AttnTone; tag: string; Icon: React.ElementType; title: string; sub: string; cta: string; meta: string; path: string }[] = [
    { tone: 'danger', tag: 'Overdue', Icon: Flame, title: 'Boiler annual service', sub: 'Was due last month · 3 trades available locally', cta: 'Find a trade', meta: '£90 avg', path: '/dashboard/job-leads' },
    { tone: 'warning', tag: 'Due in 18d', Icon: ShieldCheck, title: 'Gas Safety Certificate', sub: 'CP12 renewal required — expires soon', cta: 'Renew', meta: 'From £65', path: '/dashboard/job-leads' },
    { tone: 'warning', tag: 'Due in 21d', Icon: Umbrella, title: 'Buildings & Contents Insurance', sub: 'Annual renewal due — check your inbox', cta: 'View', meta: 'Jul 1', path: '/dashboard/job-leads' },
    { tone: 'neutral', tag: 'Reminder', Icon: Shield, title: 'Test smoke & CO alarms', sub: 'Monthly check — last done 14 May', cta: 'Mark done', meta: '2 min', path: '/dashboard/calendar' },
  ];
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

  const YEAR_DATA = {
    '2024': {
      bars: [340,220,180,290,150,420,380,200,310,240,180,90],
      cats: [
        { name: 'Heating', v: 480, color: '#FBBF24' },
        { name: 'Electrical', v: 320, color: '#1A1A1A' },
        { name: 'Insurance', v: 680, color: '#7E22CE' },
        { name: 'Cleaning', v: 190, color: '#10B981' },
        { name: 'Other', v: 480, color: '#D1D5DB' },
      ],
      total: '£2,150', sub: '+£510 vs 2023 · 8 invoices logged', center: '£2.2k',
    },
    '2025': {
      bars: [180,260,95,310,130,285,195,350,225,170,295,160],
      cats: [
        { name: 'Heating', v: 420, color: '#FBBF24' },
        { name: 'Electrical', v: 540, color: '#1A1A1A' },
        { name: 'Insurance', v: 700, color: '#7E22CE' },
        { name: 'Cleaning', v: 220, color: '#10B981' },
        { name: 'Other', v: 780, color: '#D1D5DB' },
      ],
      total: '£2,660', sub: '+£510 vs 2024 · 11 invoices logged', center: '£2.7k',
    },
    '2026': {
      bars: [120,180,60,240,90,320,0,0,0,0,0,0],
      cats: [
        { name: 'Heating', v: 360, color: '#FBBF24' },
        { name: 'Electrical', v: 480, color: '#1A1A1A' },
        { name: 'Insurance', v: 720, color: '#7E22CE' },
        { name: 'Cleaning', v: 240, color: '#10B981' },
        { name: 'Other', v: 540, color: '#D1D5DB' },
      ],
      total: '£2,340', sub: '−£320 vs last year · 6 invoices logged', center: '£2.3k',
    },
  } as const;

  type SpendYear = keyof typeof YEAR_DATA;
  const yearData = YEAR_DATA[spendYear];
  const spendBarData = MONTHS_LABELS.map((month, i) => ({
    month, spend: yearData.bars[i], highlight: i === now_month && spendYear === '2026',
  }));
  const spendCats = yearData.cats;

  const SYSTEMS = [
    { name: 'Heating', Icon: Flame, score: 86, last: 'Serviced 04 Jun 2026', next: 'Next service May 2027', note: 'Worcester Bosch 28i' },
    { name: 'Electrical', Icon: Zap, score: 92, last: 'EICR 22 Jan 2026', next: 'Next test Jan 2031', note: '5-year inspection valid' },
    { name: 'Plumbing', Icon: Droplets, score: 78, last: 'Mains check 14 Mar', next: 'Stopcock check due', note: 'Low pressure noted x2' },
    { name: 'Roof & Exterior', Icon: CloudRain, score: 64, last: 'Gutter clean Oct 2024', next: 'Clean due Sep 2026', note: 'Missing tile flagged' },
    { name: 'Garden & Grounds', Icon: TreePine, score: 71, last: 'Hedge cut 02 May', next: 'Trim due Jun 2026', note: '—' },
  ];

  const ACTIVITY = [
    { t: '2h ago', Icon: Upload, good: false, text: 'Boiler Service Record uploaded', sub: '840 KB · Compliance' },
    { t: 'Yesterday', Icon: CheckCircle, good: true, text: 'Carter Heating marked job complete', sub: 'Annual boiler service · £92 paid' },
    { t: '3 days ago', Icon: Mail, good: false, text: '3 trade quotes received', sub: 'View and accept by 18 Jun' },
    { t: '5 days ago', Icon: ShieldCheck, good: true, text: 'EICR Certificate verified', sub: 'Valid for 5 years · next Jan 2031' },
    { t: '12 days ago', Icon: TrendingUp, good: false, text: 'Property value updated to £485,000', sub: 'Up £15k from last quarter' },
  ];

  const TRADES = [
    { name: 'Carter Heating', rating: 4.9, jobs: 412, price: '£85', tag: 'Best price', tagCls: 'bg-green-100 text-green-700', highlight: true },
    { name: 'BS Plumb & Heat', rating: 4.8, jobs: 280, price: '£95', tag: 'Fastest ETA', tagCls: 'bg-blue-100 text-blue-700', highlight: false },
    { name: 'Avon Gas Services', rating: 4.7, jobs: 510, price: '£110', tag: 'Top rated', tagCls: 'bg-[#F5F5F0] text-[#6B6B6B]', highlight: false },
  ];

  const DOC_CATS = [
    { name: 'Compliance', color: '#A855F7', bg: '#F3E8FF', Icon: ShieldCheck },
    { name: 'Insurance', color: '#3B82F6', bg: '#DBEAFE', Icon: Umbrella },
    { name: 'Energy', color: '#10B981', bg: '#DCFCE7', Icon: Leaf },
    { name: 'Manuals', color: '#F59E0B', bg: '#FEF3C7', Icon: BookOpen },
    { name: 'Surveys', color: '#64748B', bg: '#E2E8F0', Icon: ClipboardList },
    { name: 'Planning', color: '#14B8A6', bg: '#CCFBF1', Icon: Ruler },
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
            <span className="text-[28px] font-bold tracking-tight text-[#1A1A1A] leading-none">£2,340</span>
            <p className="text-[11px] text-[#8B8B8B] flex items-center gap-1">
              <span className="text-red-500">↓</span> −12% vs last year
            </p>
            <div className="mt-1">
              <Sparkline data={[120,180,60,240,90,320,60,280,410,180,220,180]} color="#FBBF24" />
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
              <span className="text-[11px] text-[#8B8B8B]">4 items</span>
            } />
            <div className="flex flex-col gap-2 mt-4">
              {ATTENTION.map((it) => (
                <div key={it.title} className="flex items-center gap-3 p-3 rounded-[12px] bg-[#FAFAF7] border border-[#E8E8E3]">
                  <span className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: ATTN_BG[it.tone], color: ATTN_FG[it.tone] }}>
                    <it.Icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ATTN_TAG[it.tone]}`}>{it.tag}</span>
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
              ))}
            </div>
          </div>
        </div>

        {/* ── Row: Spend + EPC ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Spend tracker */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
            <Eyebrow icon={PoundSterling} label="Annual spend tracker" trailing={
              <div className="flex gap-1 bg-[#F5F5F0] p-1 rounded-full">
                {(['2024','2025','2026'] as SpendYear[]).map(y => (
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
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">EPC C</span>
            } />
            <div className="grid grid-cols-2 gap-2.5 mt-4 mb-3">
              <div className="p-3.5 bg-[#FAFAF7] rounded-[12px] border border-[#E8E8E3]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">EPC rating</p>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-[40px] font-extrabold text-[#16a34a] leading-none tracking-tighter">C</span>
                  <span className="text-[13px] text-[#6B6B6B]">Score 72 / 100</span>
                </div>
                <p className="text-[11px] text-[#8B8B8B] mt-1.5">Valid since Nov 2025</p>
              </div>
              <div className="p-3.5 bg-[#FAFAF7] rounded-[12px] border border-[#E8E8E3]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B8B8B]">Potential rating</p>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-[40px] font-extrabold text-[#f59e0b] leading-none tracking-tighter">B</span>
                  <span className="text-[13px] text-[#6B6B6B]">Score 81 / 100</span>
                </div>
                <p className="text-[11px] text-[#8B8B8B] mt-1.5">With recommended changes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px]">
              <span className="h-8 w-8 rounded-[10px] bg-[#FBBF24] text-[#1A1A1A] flex items-center justify-center shrink-0">
                <Star className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1A1A1A]">Track your energy bills</p>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5 leading-snug">Upload your gas & electric bills to track spend and spot savings</p>
              </div>
              <button
                onClick={() => setUploadOpen(true)}
                className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-[#4A4A4A] hover:bg-[#F5F5F0] transition-colors whitespace-nowrap">
                <Upload className="w-3 h-3" /> Add bills
              </button>
            </div>
          </div>
        </div>

        {/* ── Row: Activity + TradePilot + DocsGlance ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
            <Eyebrow icon={Clock} label="Recent activity" />
            <div className="mt-4">
              {ACTIVITY.map((it, i) => (
                <div key={i} className={`flex items-start gap-3 py-2.5 ${i > 0 ? 'border-t border-[#E8E8E3]' : ''}`}>
                  <span className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${it.good ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F5F5F0] text-[#4A4A4A]'}`}>
                    <it.Icon className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#1A1A1A] leading-snug">{it.text}</p>
                    <p className="text-[11px] text-[#8B8B8B] mt-0.5">{it.sub}</p>
                  </div>
                  <span className="text-[11px] text-[#8B8B8B] shrink-0">{it.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TradePilot */}
          <div className="bg-white rounded-[18px] border border-[#E8E8E3] p-5">
            <Eyebrow icon={Wrench} label="TradePilot — quotes in" trailing={
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Awaiting decision</span>
            } />
            <div className="mt-3 p-3.5 bg-[#F5F5F0] rounded-[14px] mb-3">
              <p className="text-[14px] font-semibold text-[#1A1A1A]">Boiler annual service</p>
              <p className="text-[12px] text-[#6B6B6B] mt-0.5">3 verified Bristol trades responded · avg 2h response</p>
            </div>
            <div className="flex flex-col gap-2">
              {TRADES.map((t) => (
                <div key={t.name}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] border ${t.highlight ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-white border-[#E8E8E3]'}`}>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[13px] text-[#1A1A1A] shrink-0 ${t.highlight ? 'bg-[#FBBF24]' : 'bg-[#F5F5F0]'}`}>
                    {t.name.charAt(0)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-semibold text-[#1A1A1A]">{t.name}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${t.tagCls}`}>{t.tag}</span>
                    </div>
                    <span className="text-[11px] text-[#8B8B8B]">★ {t.rating} · {t.jobs} jobs</span>
                  </div>
                  <span className="text-[15px] font-bold text-[#1A1A1A] shrink-0">{t.price}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Link to="/dashboard/job-leads"
                className="flex-1 text-center text-xs font-semibold px-3 py-2 rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors">
                Accept Carter Heating
              </Link>
              <button className="text-xs font-medium px-3 py-2 rounded-full border border-[#E8E8E3] text-[#4A4A4A] hover:bg-[#F5F5F0] transition-colors">
                Decline all
              </button>
            </div>
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
              {DOC_CATS.map(c => (
                <div key={c.name} className="p-2.5 rounded-[10px] bg-[#FAFAF7] border border-[#E8E8E3]">
                  <span className="inline-flex h-6 w-6 rounded-[7px] items-center justify-center mb-1.5"
                    style={{ background: c.bg, color: c.color }}>
                    <c.Icon className="w-3 h-3" />
                  </span>
                  <p className="text-[12px] font-semibold text-[#1A1A1A]">{c.name}</p>
                  <p className="text-[11px] text-[#8B8B8B] mt-0.5">— files</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Upload modal ─────────────────────────────────────── */}
      <DocsUploadDialog
        openForm={uploadOpen}
        setOpenForm={setUploadOpen}
        refetch={() => { queryClient.invalidateQueries({ queryKey: ['documents-summary'] }); }}
        prefillDiscipline={undefined}
      />
    </DashboardLayout>
  );
};

export default HomePlusDashboard;
