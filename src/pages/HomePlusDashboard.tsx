import { useRef, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';
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
import { useMutation, useQuery } from '@tanstack/react-query';
import { getEvents, uploadCover, getCoverImage } from '@/lib/Api2';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { listFilesWithMetadata } from '@/lib/Api';

const HomePlusDashboard = () => {
  const [showSmartMatches, setShowSmartMatches] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();

  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleButtonClick = () => {
    fileInputRef.current?.click(); // manually open file picker
  };

  // Fetch property cover image
  const {
    data: cover,
    isLoading: coverLoading,
    refetch,
  } = useQuery({
    queryKey: ['GetCover', user.id],
    queryFn: async () => {
      // Get the first property id, then fetch its cover
      const { data: prop } = await import('@/lib/Api2').then(m => m.getProperty());
      if (!prop?.id) return [];
      return getCoverImage(prop.id);
    },
    enabled: !!user.id,
  });
  
    const {
      data: apiDocs,
    } = useQuery({
      queryKey: ['GetAllDocs', user.id],
      queryFn: () => listFilesWithMetadata(user.id),
      enabled: !!user.id,
    });


  const { data, isLoading } = useQuery({
    queryKey: ['property'],
    queryFn: () => import('@/lib/Api2').then(mod => mod.getProperty()),
  });

  const { data: eventData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['event'],
    queryFn: getEvents,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadCover,
    onMutate: () => toast.loading('Uploading...', { id: 'upload-toast' }),
    onSuccess: () => {
      toast.dismiss('upload-toast');
      toast.success('Uploaded successfully!');
      setSelectedFile(null);
      refetch();
    },
    onError: e => {
      console.log(e);
      toast.dismiss('upload-toast');
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

  // Calendar setup
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

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
      date: r.date ? new Date(r.date) : null,
      time: r.time || '',
      type: r.eventType || r.type || 'maintenance',
      priority: r.priority || 'medium',
      cost: typeof r.cost === 'number' ? r.cost : r.cost ? Number(r.cost) : 0,
      recurring: r.recurring || 'never',
      complianceType: r.complianceType || 'none',
      isRequireTrade: !!r.isRequireTrade,
      description: r.description || '',
    }));

  // Sample events for calendar display when no API data exists - dates from Jan 27, 2026

  const dashEvents: DashEvent[] = Array.isArray(rawEvents) && rawEvents.length > 0
    ? mapToDashEvents(rawEvents)
    : [];

  // Calculate event counts for next 2 weeks and next 6 weeks
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const sixWeeksFromNow = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000);

  const eventsNextTwoWeeks = dashEvents.filter(event => {
    if (!event.date) return false;
    return event.date >= now && event.date <= twoWeeksFromNow;
  }).length;

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

              {/* Quick Actions - Cleaner button style */}
              <div className="flex items-center gap-3">
                <Link to="/dashboard/calendar">
                  <Button variant="outline" className="text-[#1A1A1A] hover:bg-[#F5F5F0] border border-[#E8E8E3] bg-white transition-all text-sm font-medium h-10 px-4 rounded-full">
                    Get started
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Row - Inside the welcome block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B6B6B] text-sm">Saved Documents</span>
                  <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-[#1A1A1A] text-2xl font-semibold">{apiDocs?.length}</p>
                <p className="text-[#8B8B8B] text-xs mt-1">Stored safely</p>
              </div>

              <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B6B6B] text-sm">Next two weeks</span>
                  <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-[#1A1A1A] text-2xl font-semibold">{eventsNextTwoWeeks}</p>
                <p className="text-[#8B8B8B] text-xs mt-1">Tasks and reminders</p>
              </div>

              <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B6B6B] text-sm">Next 6 weeks</span>
                  <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-[#1A1A1A] text-2xl font-semibold">{eventsNextSixWeeks}</p>
                <p className="text-[#8B8B8B] text-xs mt-1">Tasks and reminders</p>
              </div>

              <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#6B6B6B] text-sm">Quick Actions</span>
                </div>
                <div className="flex flex-col gap-1">
                  <Link to="/dashboard/documents">
                    <button className="flex items-center gap-3 px-4 py-3 text-[#4A4A4A] text-sm font-medium rounded-full hover:bg-[#E8E8E3] hover:text-[#1A1A1A] transition-all duration-200">
                      <FileText className="w-[18px] h-[18px]" strokeWidth={1.5} />
                      Add Document
                    </button>
                  </Link>
                  <button
                    onClick={() => navigate('/dashboard/calendar')}
                    className="flex items-center gap-3 px-4 py-3 text-[#4A4A4A] text-sm font-medium rounded-full hover:bg-[#E8E8E3] hover:text-[#1A1A1A] transition-all duration-200"
                  >
                    <ClipboardList className="w-[18px] h-[18px]" strokeWidth={1.5} />
                    Add Task
                  </button>
                  <button
                    onClick={() => navigate('/dashboard/calendar')}
                    className="flex items-center gap-3 px-4 py-3 text-[#4A4A4A] text-sm font-medium rounded-full hover:bg-[#E8E8E3] hover:text-[#1A1A1A] transition-all duration-200"
                  >
                    <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
                    Add Reminder
                  </button>
                </div>
              </div>
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
                  <Button variant="outline" className="text-[#1A1A1A] hover:bg-[#F5F5F0] border border-[#E8E8E3] text-sm font-medium h-10 px-4 rounded-full">
                    View Calendar
                  </Button>
                </Link>
              </div>

              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] p-6">
                {/* Month Header */}
                <div className="flex items-center justify-center mb-5">
                  <h3 className="text-[18px] font-semibold text-[#1F2937]">{format(currentDate, 'MMMM yyyy')}</h3>
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
                        {dotStatus && (
                          <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${getDotColor(dotStatus)}`}></div>
                        )}
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

            {/* Tasks - Side Panel (max 3 per spec) */}
            <div className="bg-white lg:col-span-1 rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[#1A1A1A] text-lg font-semibold">Upcoming tasks and reminders</h3>
                </div>
              </div>
              <p className="text-[#6B6B6B] text-sm mb-4">Next 3 items</p>

              {/* Task List - Max 3 items per spec */}
              <div className="space-y-3">
                {displayTasks.slice(0, 3).map((item, id) => {
                  const dueDate = new Date(item?.date);
                  const today = new Date();
                  const diffTime = dueDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  let urgencyColor = 'text-[#6B7280]';
                  let urgencyBg = 'bg-[#F9FAFB]';
                  let urgencyBorder = 'border-[#E5E7EB]';
                  if (diffDays < 0) {
                    urgencyColor = 'text-[#DC2626]';
                    urgencyBg = 'bg-[#FEF2F2]';
                    urgencyBorder = 'border-[#FECACA]';
                  } else if (diffDays <= 3) {
                    urgencyColor = 'text-[#D97706]';
                    urgencyBg = 'bg-[#FFFBEB]';
                    urgencyBorder = 'border-[#FDE68A]';
                  } else if (diffDays <= 7) {
                    urgencyColor = 'text-[#1F2937]';
                    urgencyBg = 'bg-[#FEF3C7]/50';
                    urgencyBorder = 'border-[#FDE68A]/50';
                  }

                  return (
                    <div
                      className={`${urgencyBg} border ${urgencyBorder} rounded-[12px] p-4 hover:shadow-sm transition-all cursor-pointer`}
                      key={item?.id || id}
                      onClick={() => navigate('/dashboard/calendar')}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-[8px] flex items-center justify-center bg-white border border-[#E5E7EB]`}>
                          <Clock size={14} className={urgencyColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[#1F2937] text-sm font-medium truncate">{item?.title}</h4>
                          <p className="text-[#9CA3AF] capitalize text-[11px] mt-0.5">{item?.eventType}</p>
                          <p className={`text-xs mt-2 font-medium ${urgencyColor}`}>
                            {diffDays < 0
                              ? `Overdue by ${Math.abs(diffDays)} days`
                              : diffDays === 0
                              ? 'Due today'
                              : diffDays === 1
                              ? 'Due tomorrow'
                              : `${diffDays} days left`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {eventData?.data?.length > 3 && (
                <Link
                  to="/dashboard/calendar"
                  className="text-[#FBBF24] text-sm mt-4 block text-center hover:text-[#D4A017] transition-colors font-medium"
                >
                  View all {eventData.data.length} tasks →
                </Link>
              )}
            </div>
          </div>

          {/* Recent Activity Feed - Per Spec (max 3 items) */}
          <div className="bg-white rounded-[20px] p-6 border border-[#E8E8E3]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-[#1A1A1A] text-lg font-semibold">Recent Activity</h3>
                  <p className="text-[#6B6B6B] text-sm">Your latest home updates</p>
                </div>
              </div>
            </div>

            {/* Activity List - Max 3 items per spec */}
            <div className="grid grid-cols-3 gap-4">
              {/* Sample activity items - would come from API in production */}
              <div className="bg-[#F5F5F0] rounded-[16px] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#1A1A1A]" strokeWidth={1.5} />
                  </div>
                  <span className="text-[#8B8B8B] text-xs">2 hours ago</span>
                </div>
                <p className="text-[#1A1A1A] text-sm font-medium">Document uploaded</p>
                <p className="text-[#6B6B6B] text-xs mt-1">Boiler service certificate added</p>
              </div>

              <div className="bg-[#F5F5F0] rounded-[16px] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-[#1A1A1A]" strokeWidth={1.5} />
                  </div>
                  <span className="text-[#8B8B8B] text-xs">Yesterday</span>
                </div>
                <p className="text-[#1A1A1A] text-sm font-medium">Task completed</p>
                <p className="text-[#6B6B6B] text-xs mt-1">Smoke alarm test marked done</p>
              </div>

              <div className="bg-[#F5F5F0] rounded-[16px] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                    <Bell className="w-4 h-4 text-[#1A1A1A]" strokeWidth={1.5} />
                  </div>
                  <span className="text-[#8B8B8B] text-xs">3 days ago</span>
                </div>
                <p className="text-[#1A1A1A] text-sm font-medium">Reminder set</p>
                <p className="text-[#6B6B6B] text-xs mt-1">Gutter cleaning scheduled</p>
              </div>
            </div>

            {/* Empty state for activity */}
            {false && (
              <div className="text-center py-6">
                <div className="h-10 w-10 rounded-full bg-[#FEF9E7] flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-4 h-4 text-[#FBBF24]" />
                </div>
                <p className="text-[#1A1A1A] text-sm font-medium">No recent activity</p>
                <p className="text-[#6B6B6B] text-xs mt-1">Start by uploading a document or setting a reminder</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default HomePlusDashboard;
