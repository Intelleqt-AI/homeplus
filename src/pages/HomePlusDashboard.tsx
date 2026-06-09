import { useRef, useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay, addMonths, subMonths } from 'date-fns';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import {
  Home,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  Camera,
  Wrench,
  Shield,
  FileCheck,
  Flame,
  TreePine,
  Plus,
  ClipboardList,
  Star,
  FileText,
  Bell,
  FolderOpen,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import useFetch from '@/hooks/useFetch';
import { usePost } from '@/hooks/usePost';
import {
  getEvents,
  uploadCover,
  getCoverImage,
  fetchMotScore,
  fetchLastCompleted,
  fetchDocumentSummary,
} from '@/lib/Api2';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { listFilesWithMetadata } from '@/lib/Api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import HomeMotWizard, { STEP_CONFIG, type HomeMotStep } from '@/components/homemot/HomeMotWizard';

const HomePlusDashboard = () => {
  const [showSmartMatches, setShowSmartMatches] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [motStep, setMotStep] = useState<HomeMotStep | null>(null);
  const openMotStep = (step: HomeMotStep) => setMotStep(step);
  const motQueryClient = useQueryClient();
  // Score + per-step answers now come from the backend (apps.homemot). The pie
  // ring + rail read these; the wizard PUTs answers and we invalidate to refresh.
  const { data: scoreResp } = useFetch('/api/v1/mot/score/', {
    queryKey: ['mot-score'],
    queryFn: fetchMotScore,
  });
  const motScore = (scoreResp?.data ?? null) as {
    score: number;
    breakdown?: Record<string, number>;
    answers?: Record<HomeMotStep, Record<string, boolean>>;
  } | null;
  const motAnswers: Record<HomeMotStep, Record<string, boolean>> =
    motScore?.answers ?? { A: {}, B: {}, C: {} };

  // Last-completed dates (keyed by template slug) hydrate the wizard inputs.
  const { data: lastCompletedResp } = useFetch('/api/v1/mot/last-completed/', {
    queryKey: ['mot-last-completed'],
    queryFn: fetchLastCompleted,
  });
  const motDates: Record<string, string> = lastCompletedResp?.data ?? {};

  const handleMotSave = () => {
    // Tasks + score already persisted by the wizard; refresh the derived views.
    ['mot-score', 'mot-last-completed', 'event'].forEach((key) =>
      motQueryClient.invalidateQueries({ queryKey: [key] })
    );
  };

  const HOME_MOT_BASE_SCORE = 8;
  const yesCountFor = (step: HomeMotStep) =>
    Object.values(motAnswers[step] ?? {}).filter(Boolean).length;
  const earnedFor = (step: HomeMotStep) =>
    motScore?.breakdown?.[step] ??
    Math.min(STEP_CONFIG[step].maxPoints, yesCountFor(step) * STEP_CONFIG[step].pointsPerYes);
  const homeMotScore = motScore?.score ?? HOME_MOT_BASE_SCORE;
  const { user } = useAuth();

  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleButtonClick = () => {
    fileInputRef.current?.click(); // manually open file picker
  };

  // Fetch files/folders
  const {
    data: cover,
    isLoading: coverLoading,
    refetch,
  } = useQuery({
    queryKey: ['GetCover', user?.id],
    queryFn: () => listFilesWithMetadata(`${user?.id}/cover`),
    enabled: !!user?.id,
  });

  const { data, isLoading } = useFetch('/api/v1/properties/', {
    queryKey: ['property'],
    queryFn: () => import('@/lib/Api2').then(mod => mod.getProperty()),
  });

  const { data: eventData, isLoading: isLoadingEvents } = useFetch('/api/v1/events/', {
    queryKey: ['event'],
    queryFn: getEvents,
  });

  const { data: docSummaryResp } = useFetch('/api/v1/documents/summary/', {
    queryKey: ['documents-summary'],
    queryFn: fetchDocumentSummary,
  });

  const uploadMutation = usePost({
    mutationFn: uploadCover,
    onSuccess: () => {
      toast.success('Uploaded successfully!');
      setSelectedFile(null);
      refetch();
    },
    onError: e => {
      console.log(e);
      toast.error('Failed to upload document.');
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate({
        file: file,
        id: `${user?.id}/cover`,
        metadata: {},
      });
    }
  };

  // Calendar setup — default to current month, but auto-advance if it has no events
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));

  // Sample calendar events with colors matching the legend
  // Map remote event data into UI shape for dashboard use
  const rawEvents = eventData?.data ?? eventData ?? [];

  type DashEvent = {
    id: string;
    title: string;
    date: Date | null;
    time?: string;
    type?: string;
    priority?: string;
    cost?: number | string;
    recurring?: string;
    complianceType?: string;
    isRequireTrade?: boolean;
    description?: string;
  };

  type RawEvent = {
    id?: string;
    title?: string;
    date?: string | null;
    time?: string;
    eventType?: string;
    type?: string;
    priority?: string;
    cost?: number | string;
    recurring?: string;
    complianceType?: string;
    isRequireTrade?: boolean;
    description?: string;
  };

  const mapToDashEvents = (rows: RawEvent[] = []): DashEvent[] =>
    rows.map(r => ({
      id: r.id as string,
      title: r.title || 'Untitled',
      date: r.date ? new Date(r.date.split('T')[0] + 'T00:00:00') : null,
      time: r.time || '',
      type: r.eventType || r.type || 'maintenance',
      priority: r.priority || 'medium',
      cost: typeof r.cost === 'number' ? r.cost : r.cost ? Number(r.cost) : 0,
      recurring: r.recurring || 'never',
      complianceType: r.complianceType || 'none',
      isRequireTrade: !!r.isRequireTrade,
      description: r.description || '',
    }));

  // MOT tasks now arrive as linked Events through /api/v1/events/, so the
  // schedule grid + stat tiles pick them up here — no separate client merge.
  const dashEvents: DashEvent[] =
    Array.isArray(rawEvents) && rawEvents.length > 0 ? mapToDashEvents(rawEvents) : [];

  // Auto-advance calendar to the first month that has events (up to 12 months ahead)
  useEffect(() => {
    if (!dashEvents.length) return;
    const today = startOfMonth(new Date());
    const hasEventsInMonth = (m: Date) =>
      dashEvents.some(ev => ev.date && startOfMonth(ev.date).getTime() === m.getTime());
    if (hasEventsInMonth(today)) return;
    for (let i = 1; i <= 12; i++) {
      const next = addMonths(today, i);
      if (hasEventsInMonth(next)) { setCalendarMonth(next); break; }
    }
  }, [dashEvents.length]);

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate event counts for the next 30 days + the longer 6-week horizon.
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sixWeeksFromNow = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000);

  const eventsNext30DaysList = dashEvents
    .filter(event => {
      if (!event.date) return false;
      return event.date >= now && event.date <= thirtyDaysFromNow;
    })
    .sort((a, b) => (a.date!.getTime() - b.date!.getTime()));
  const eventsNext30Days = eventsNext30DaysList.length;

  const eventsNextSixWeeks = dashEvents.filter(event => {
    if (!event.date) return false;
    return event.date >= now && event.date <= sixWeeksFromNow;
  }).length;

  const getDotColor = status => {
    switch (status) {
      case 'overdue':
        return 'bg-red-500';
      case 'scheduled':
      case 'confirmed':
        return 'bg-green-500';
      case 'due-week':
      case 'action_required':
        return 'bg-yellow-500';
      case 'future':
        return 'bg-gray-400';
      default:
        return '';
    }
  };

  // const computeStatus = (d: Date | null) => {
  //   if (!d) return "unscheduled";
  //   const now = new Date();
  //   if (d.toDateString() === now.toDateString()) return "confirmed";
  //   if (d < now) return "overdue";
  //   const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  //   if (diff <= 7) return "due-week";
  //   return "future";
  // };

  const computeStatus = (d: Date | null) => {
    if (!d) return 'unscheduled';
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'confirmed';
    if (d < now) return 'overdue';
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 7) return 'due-week';
    return 'future';
  };

  // Property details
  const propertyDetails = {
    address: data?.data?.address || 'Loading address...',
    type: data?.data?.type || 'Loading...',
    bedrooms: data?.data?.bedrooms || 'Loading...',
    bathrooms: 'N/A',
    moveInDate: 'N/A',
    yearsAtProperty: 'N/A',
    previousAddress: 'N/A',
    currentValue: 'N/A',
    yearOnYearChange: 'N/A',
    role: data?.data?.role || 'Loading...',
  };

  // Alert defaults for UK properties - enhanced with new row anatomy
  const ALERT_DEFAULTS = [
    {
      key: 'boiler_service',
      title: 'Boiler service',
      icon: Flame,
      cadence: 'P12M',
      dueInDays: -2,
      action: 'get 3 quotes',
      category: 'service',
      type: 'Service',
    },
    {
      key: 'alarm_test',
      title: 'Smoke/CO alarm test',
      icon: Shield,
      cadence: 'P1M',
      dueInDays: 5,
      action: 'mark done',
      category: 'safety',
      type: 'Safety',
    },
    {
      key: 'gutter_clean',
      title: 'Gutter clean',
      icon: Home,
      cadence: 'P12M',
      dueInDays: 6,
      action: 'get 3 quotes',
      category: 'service',
      type: 'Service',
    },
    {
      key: 'insurance_renewal',
      title: 'Buildings insurance',
      icon: FileCheck,
      nudges: [60, 30, 7],
      dueInDays: 30,
      action: 'get 3 quotes',
      category: 'compliance',
      type: 'Compliance',
    },
    {
      key: 'warranty_end',
      title: 'Appliance warranty',
      icon: Shield,
      nudges: [30, 7, 1],
      dueInDays: 21,
      action: 'get 3 quotes',
      category: 'warranty',
      type: 'Warranty',
    },
    {
      key: 'garden_maintenance',
      title: 'Garden maintenance',
      icon: TreePine,
      cadence: 'P3M',
      dueInDays: 12,
      action: 'get 3 quotes',
      category: 'service',
      type: 'Service',
    },
    {
      key: 'window_cleaning',
      title: 'Window cleaning',
      icon: Home,
      cadence: 'P6M',
      dueInDays: 25,
      action: 'get 3 quotes',
      category: 'service',
      type: 'Service',
    },
  ];

  const LANDLORD_EXTRAS = [
    {
      key: 'eicr',
      title: 'EICR (electrical inspection)',
      cadence: 'P5Y',
      dueInDays: 42,
      action: '+ document',
      category: 'document',
    },
    {
      key: 'gas_safety',
      title: 'Gas safety CP12',
      cadence: 'P12M',
      dueInDays: 18,
      action: 'book service',
      category: 'service',
    },
    {
      key: 'tenancy_swap',
      title: 'Tenancy changeover',
      checklist: true,
      dueInDays: 55,
      action: 'view checklist',
      category: 'safety',
    },
  ];

  // Mock property settings - in real app would come from settings
  const isLandlordProperty = false; // This would come from property settings

  // Combine alerts based on property type
  const allAlerts = isLandlordProperty ? [...ALERT_DEFAULTS, ...LANDLORD_EXTRAS] : ALERT_DEFAULTS;

  // Group alerts by urgency (new grouping)
  const groupAlertsByUrgency = alerts => {
    const overdue = alerts.filter(alert => alert.dueInDays < 0);
    const today = alerts.filter(alert => alert.dueInDays >= 0 && alert.dueInDays <= 1);
    const thisWeek = alerts.filter(alert => alert.dueInDays > 1 && alert.dueInDays <= 7);
    const laterThisMonth = alerts.filter(alert => alert.dueInDays > 7 && alert.dueInDays <= 30);

    return { overdue, today, thisWeek, laterThisMonth };
  };

  // Get category chip color
  const getCategoryColor = type => {
    switch (type.toLowerCase()) {
      case 'service':
        return 'bg-blue-100 text-blue-700';
      case 'safety':
        return 'bg-red-100 text-red-700';
      case 'warranty':
        return 'bg-green-100 text-green-700';
      case 'compliance':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusDotColor = dueInDays => {
    if (dueInDays < 0) return 'bg-gray-800'; // overdue - dark grey
    if (dueInDays <= 7) return 'bg-red-500'; // urgent - red
    if (dueInDays <= 14) return 'bg-yellow-500'; // medium - yellow
    return 'bg-gray-400'; // later - grey
  };

  const getButtonStyle = dueInDays => {
    if (dueInDays < 0) return 'bg-gray-500 text-white hover:bg-gray-600'; // overdue
    if (dueInDays <= 7) return 'bg-red-500 text-white hover:bg-red-600'; // urgent - red
    if (dueInDays <= 14) return 'bg-primary text-black hover:bg-primary/90'; // medium - your brand yellow
    return 'bg-gray-300 text-gray-700 hover:bg-gray-400'; // later - grey
  };

  // Smart matches data
  const smartMatches = [
    {
      name: 'ABC Plumbing',
      rating: 4.8,
      reviews: 156,
      specialty: 'Emergency repairs',
    },
    {
      name: 'Smith Gas Services',
      rating: 4.9,
      reviews: 89,
      specialty: 'Boiler specialists',
    },
    {
      name: 'Local Handyman Co',
      rating: 4.7,
      reviews: 203,
      specialty: 'General maintenance',
    },
  ];

  // Use API data if available, otherwise show sample tasks
  const displayTasks = eventData?.data?.length > 0 ? eventData.data : [];

  return (
    <DashboardLayout>
      <div className=" ">
        {/* Dashboard Content */}
        <main className=" space-y-6">
          {/* Combined Welcome + Stats Block */}
          <div className="bg-white rounded-[20px] p-6 border border-[#E8E8E3]">
            {/* Top row: Property Info and Quick Actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                  <Home className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[#6B6B6B] text-sm mb-0.5">Welcome back</p>
                  <h1 className="text-[#1A1A1A] text-2xl font-semibold">
                    {user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ')[0] : 'there'}
                  </h1>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-3">
                <Link to="/dashboard/job-leads">
                  <Button
                    variant="outline"
                    className="text-[#1A1A1A] hover:bg-[#F5F5F0] border border-[#E8E8E3] bg-white transition-all text-sm font-medium h-10 px-4 rounded-full"
                  >
                    Find a Trade
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Row - Inside the welcome block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Combined Saved Documents + Next 30 days tile (spans 2 columns on lg) */}
              {(() => {
                // Real counts from /documents/summary/ — backend only, no demo data.
                const summary = docSummaryResp?.data;
                const totalDocs = summary?.total ?? 0;
                const expiredDocs = summary?.expired ?? 0;
                const expiringDocs = summary?.expiring ?? 0;
                const validDocs = summary?.valid ?? 0;

                const next = eventsNext30DaysList[0];
                const nextDays = next
                  ? Math.ceil((next.date!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : 0;
                const nextUrgent = !!next && nextDays <= 14;

                return (
                  <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4 lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 h-full">
                      {/* ── Saved Documents ─────────────────────────── */}
                      <Link to="/dashboard/documents" className="flex flex-col group">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-[#6B6B6B] text-sm">Saved Documents</p>
                            <p className="text-[#1A1A1A] text-base font-semibold mt-0.5">
                              Stored safely
                            </p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center shrink-0">
                            <FolderOpen className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                          </div>
                        </div>
                        <p className="text-[#1A1A1A] text-3xl font-semibold leading-none mb-3">
                          {totalDocs}
                          <span className="text-[#8B8B8B] text-sm font-medium ml-1.5">
                            docs
                          </span>
                        </p>
                        <div className="grid grid-cols-3 gap-1.5 mt-auto">
                          <div className="rounded-[10px] px-2.5 py-1.5 bg-[#ECFDF5] border border-[#A7F3D0]/70">
                            <p className="text-[14px] font-semibold text-[#047857] leading-none">
                              {validDocs}
                            </p>
                            <p className="text-[10px] text-[#047857]/80 mt-0.5">
                              Valid
                            </p>
                          </div>
                          <div className="rounded-[10px] px-2.5 py-1.5 bg-[#FFFBEB] border border-[#FDE68A]/70">
                            <p className="text-[14px] font-semibold text-[#B45309] leading-none">
                              {expiringDocs}
                            </p>
                            <p className="text-[10px] text-[#B45309]/80 mt-0.5">
                              Expiring
                            </p>
                          </div>
                          <div className="rounded-[10px] px-2.5 py-1.5 bg-[#FEF2F2] border border-[#FECACA]/70">
                            <p className="text-[14px] font-semibold text-[#B91C1C] leading-none">
                              {expiredDocs}
                            </p>
                            <p className="text-[10px] text-[#B91C1C]/80 mt-0.5">
                              Expired
                            </p>
                          </div>
                        </div>
                      </Link>

                      {/* ── Next 30 days ────────────────────────────── */}
                      <Link
                        to="/dashboard/calendar"
                        className="flex flex-col sm:border-l sm:border-[#E8E8E3] sm:pl-5"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-[#6B6B6B] text-sm">Next 30 days</p>
                            <p className="text-[#1A1A1A] text-base font-semibold mt-0.5">
                              Tasks and reminders
                            </p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center shrink-0">
                            <CheckCircle className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                          </div>
                        </div>
                        <p className="text-[#1A1A1A] text-3xl font-semibold leading-none mb-3">
                          {eventsNext30Days}
                        </p>

                        {next ? (
                          <div
                            className={`mt-auto rounded-[10px] px-3 py-2 border ${
                              nextUrgent
                                ? 'bg-[#FEF9E7] border-[#FBBF24]/40'
                                : 'bg-white border-[#E8E8E3]'
                            }`}
                          >
                            <p className="text-[11px] text-[#6B6B6B]">Coming up</p>
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-[12px] font-medium text-[#1A1A1A] truncate leading-snug">
                                {next.title}
                              </p>
                              <span
                                className={`text-[11px] font-medium shrink-0 ${
                                  nextUrgent ? 'text-[#D97706]' : 'text-[#6B6B6B]'
                                }`}
                              >
                                {nextDays === 0
                                  ? 'Today'
                                  : nextDays === 1
                                    ? 'Tomorrow'
                                    : `in ${nextDays}d · ${format(next.date!, 'd MMM')}`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-auto text-[#8B8B8B] text-xs">
                            Nothing in the next 30 days
                          </p>
                        )}
                      </Link>
                    </div>
                  </div>
                );
              })()}

              {/* Home MOT tile (spans 2 columns on lg) */}
              {(() => {
                const homeMotMax = 100;
                const radius = 42;
                const circumference = 2 * Math.PI * radius;
                const progress = (homeMotScore / homeMotMax) * circumference;
                return (
                  <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4 lg:col-span-2 flex flex-col">
                    <div className="flex items-center gap-5 flex-1">
                      {/* Pie */}
                      <div className="relative h-[110px] w-[110px] flex items-center justify-center shrink-0">
                        <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
                          <circle
                            cx="55"
                            cy="55"
                            r={radius}
                            fill="none"
                            stroke="#E8E8E3"
                            strokeWidth="10"
                          />
                          <circle
                            cx="55"
                            cy="55"
                            r={radius}
                            fill="none"
                            stroke="#FBBF24"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={`${progress} ${circumference}`}
                            style={{ transition: 'stroke-dasharray 400ms ease-out' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[#1A1A1A] text-2xl font-semibold leading-none">
                            {homeMotScore}
                          </span>
                          <span className="text-[#8B8B8B] text-[11px] mt-0.5">
                            / {homeMotMax}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#6B6B6B] text-sm">Home MOT</p>
                        <p className="text-[#1A1A1A] text-base font-semibold mt-0.5">
                          Your home score
                        </p>
                        <p className="text-[#8B8B8B] text-xs mt-1 max-w-[260px]">
                          Updated by your activity — complete the steps in <em>Build your home MOT score</em> to grow it.
                        </p>
                      </div>
                    </div>

                    {/* Footer strip: Next 6 weeks stat */}
                    <div className="mt-4 pt-3 border-t border-[#E8E8E3] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                        <span className="text-[#6B6B6B] text-sm">Next 6 weeks</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[#1A1A1A] text-lg font-semibold">
                          {eventsNextSixWeeks}
                        </span>
                        <span className="text-[#8B8B8B] text-xs">Tasks and reminders</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          {/* Calendar Front and Center + Tasks Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar - Now Front and Center (2 columns on desktop) */}
            <div className="bg-white lg:col-span-2 rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
              <div className="flex items-center mb-6 justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-[#1A1A1A] text-lg font-semibold">Your Schedule</h3>
                    <p className="text-[#6B6B6B] text-sm">Plan ahead and stay organized</p>
                  </div>
                </div>
                <Link to="/dashboard/calendar">
                  <Button
                    variant="outline"
                    className="text-[#1A1A1A] hover:bg-[#F5F5F0] border border-[#E8E8E3] text-sm font-medium h-10 px-4 rounded-full"
                  >
                    View Calendar
                  </Button>
                </Link>
              </div>

              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] p-6">
                {/* Month Header */}
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={() => setCalendarMonth(m => subMonths(m, 1))}
                    className="p-1.5 rounded-full hover:bg-[#F5F5F0] text-[#6B6B6B]"
                    aria-label="Previous month"
                  >
                    &#8249;
                  </button>
                  <h3 className="text-[18px] font-semibold text-[#1F2937]">{format(calendarMonth, 'MMMM yyyy')}</h3>
                  <button
                    onClick={() => setCalendarMonth(m => addMonths(m, 1))}
                    className="p-1.5 rounded-full hover:bg-[#F5F5F0] text-[#6B6B6B]"
                    aria-label="Next month"
                  >
                    &#8250;
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-[13px] font-medium text-[#9CA3AF] py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: (getDay(monthStart) + 6) % 7 }, (_, i) => (
                    <div key={`empty-${i}`} className="h-14"></div>
                  ))}

                  {monthDays.map(day => {
                    const dayNumber = day.getDate();
                    const isCurrentDay = isToday(day);
                    const eventsForDay = dashEvents.filter(ev => ev.date && ev.date.toDateString() === day.toDateString());
                    let dotStatus = null;
                    if (eventsForDay.some(e => computeStatus(e.date) === 'overdue')) dotStatus = 'overdue';
                    else if (eventsForDay.some(e => computeStatus(e.date) === 'due-week')) dotStatus = 'due-week';
                    else if (eventsForDay.some(e => computeStatus(e.date) === 'confirmed')) dotStatus = 'confirmed';
                    else if (eventsForDay.length) dotStatus = 'future';

                    return (
                      <div
                        key={dayNumber}
                        className={`relative h-12 flex flex-col items-center justify-center text-[13px] cursor-pointer rounded-[10px] transition-all ${
                          isCurrentDay
                            ? 'bg-[#FBBF24] text-[#1A1A1A] font-semibold'
                            : eventsForDay.length > 0
                              ? 'bg-[#FEF9E7] text-[#1A1A1A] hover:bg-[#FEF3C7]'
                              : 'text-[#4B5563] hover:bg-[#F5F5F0]'
                        }`}
                      >
                        <span>{dayNumber}</span>
                        {dotStatus && <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${getDotColor(dotStatus)}`}></div>}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6 pt-4 border-t border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#F87171] rounded-full"></div>
                    <span className="text-xs text-[#9CA3AF]">Overdue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#FBBF24] rounded-full"></div>
                    <span className="text-xs text-[#9CA3AF]">Due Soon</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#34D399] rounded-full"></div>
                    <span className="text-xs text-[#9CA3AF]">Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#D1D5DB] rounded-full"></div>
                    <span className="text-xs text-[#9CA3AF]">Future</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Build your home MOT score - Side Panel */}
            <div className="bg-white lg:col-span-1 rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[#1A1A1A] text-lg font-semibold">Build your home MOT score</h3>
                </div>
              </div>
              <p className="text-[#6B6B6B] text-sm mb-4">Three 60-second checks. Each one grows your score.</p>

              <div className="space-y-3">
                {(['A', 'B', 'C'] as const).map((s) => {
                  const cfg = STEP_CONFIG[s];
                  const StepIcon = cfg.icon;
                  const ticked = yesCountFor(s);
                  const total = cfg.questions.length;
                  const earned = Math.round(earnedFor(s) * 10) / 10;
                  const complete = ticked > 0 && ticked === total;
                  const label =
                    s === 'A' ? 'Compliance' : s === 'B' ? 'Documents' : 'Maintenance';
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => openMotStep(s)}
                      className={`w-full text-left rounded-[12px] border p-4 transition-all hover:shadow-sm ${
                        complete
                          ? 'bg-[#FEF9E7] border-[#FBBF24]'
                          : 'bg-white border-[#E8E8E3] hover:bg-[#F5F5F0]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-[8px] flex items-center justify-center bg-white border border-[#E5E7EB] shrink-0">
                          <StepIcon size={16} className="text-[#1A1A1A]" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <h4 className="text-[#1F2937] text-sm font-semibold">
                              Step {s} · {label}
                            </h4>
                            <span className="text-[11px] text-[#6B6B6B] shrink-0">
                              {ticked}/{total}
                            </span>
                          </div>
                          <p className="text-[#9CA3AF] text-[11px] mt-0.5">
                            60 seconds · up to {cfg.maxPoints} pts
                          </p>
                          {/* progress bar */}
                          <div className="mt-2 h-1.5 w-full bg-[#F1F1EC] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#FBBF24] rounded-full transition-all duration-300"
                              style={{
                                width: `${total ? (ticked / total) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs mt-2 font-medium text-[#1F2937]">
                            {complete
                              ? `Complete · +${earned} pts`
                              : ticked > 0
                                ? `+${earned} pts so far`
                                : 'Not started'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Prescriptive Feed — "What needs doing" — top 3 live actions */}
          {(() => {
            const summary = docSummaryResp?.data;
            const totalDocs = summary?.total ?? 0;
            const expiringDocCount = summary?.expiring ?? 0;

            // Build feed items from real data, ordered by urgency
            type FeedItem = { id: string; text: string; subtext: string; action: string; href?: string; priority: number };
            const items: FeedItem[] = [];

            // P1: Overdue events
            dashEvents
              .filter(e => e.date && e.date < now && e.status !== 'completed')
              .slice(0, 2)
              .forEach(e => {
                items.push({
                  id: `overdue-${e.id}`,
                  text: `Overdue: ${e.title}`,
                  subtext: `Was due ${e.date?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
                  action: 'View task',
                  href: '/dashboard/calendar',
                  priority: 1,
                });
              });

            // P2: Expiring documents
            if (expiringDocCount > 0) {
              items.push({
                id: 'expiring-docs',
                text: `${expiringDocCount} document${expiringDocCount > 1 ? 's' : ''} expiring soon`,
                subtext: 'Review and renew before they expire',
                action: 'View documents',
                href: '/dashboard/documents',
                priority: 2,
              });
            }

            // P3: No EPC band set
            if (homeMotScore < 40 && totalDocs === 0) {
              items.push({
                id: 'epc-missing',
                text: 'Add your EPC band to improve your MOT score',
                subtext: 'Takes 30 seconds — we can look it up from your postcode',
                action: 'Add EPC',
                href: '/dashboard/energy',
                priority: 3,
              });
            }

            // P4: No documents at all
            if (totalDocs === 0) {
              items.push({
                id: 'no-docs',
                text: 'Upload your first document — start with your boiler manual',
                subtext: 'Helps us personalise your maintenance reminders',
                action: 'Upload document',
                href: '/dashboard/documents',
                priority: 4,
              });
            }

            // P5: Events this week
            eventsNext30DaysList
              .slice(0, 2)
              .forEach(e => {
                if (items.some(i => i.id === `overdue-${e.id}`)) return;
                items.push({
                  id: `upcoming-${e.id}`,
                  text: e.title,
                  subtext: `Due ${e.date?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
                  action: 'View',
                  href: '/dashboard/calendar',
                  priority: 5,
                });
              });

            const topItems = items.sort((a, b) => a.priority - b.priority).slice(0, 3);

            return (
              <div className="bg-white rounded-[20px] p-6 border border-[#E8E8E3]">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-[#1A1A1A] text-lg font-semibold">What needs doing</h3>
                      <p className="text-[#6B6B6B] text-sm">Your top 3 actions right now</p>
                    </div>
                  </div>
                </div>

                {topItems.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-[#1A1A1A] text-sm font-medium">All caught up!</p>
                    <p className="text-[#6B6B6B] text-xs mt-1">No urgent actions needed right now</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-[#F5F5F0] rounded-[16px] px-4 py-3.5">
                        <div>
                          <p className="text-[#1A1A1A] text-sm font-medium">{item.text}</p>
                          <p className="text-[#6B6B6B] text-xs mt-0.5">{item.subtext}</p>
                        </div>
                        <Link to={item.href ?? '#'}>
                          <Button size="sm" variant="outline" className="shrink-0 ml-3 text-xs h-8 px-3 rounded-full">
                            {item.action}
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </main>
      </div>

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
