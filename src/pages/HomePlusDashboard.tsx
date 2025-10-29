import { useRef, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getEvents, uploadCover } from '@/lib/Api2';
import { listFilesWithMetadata, uploadFileWithMetadata } from '@/lib/Api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const HomePlusDashboard = () => {
  const [showSmartMatches, setShowSmartMatches] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();

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
    queryKey: ['GetCover', user.id],
    queryFn: () => listFilesWithMetadata(`${user.id}/cover`),
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

  const dashEvents: DashEvent[] = Array.isArray(rawEvents) ? mapToDashEvents(rawEvents) : [];

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

  const stats = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M1.15808 10C1.15808 7.65498 2.08964 5.40599 3.74783 3.74781C5.40601 2.08962 7.655 1.15806 10 1.15806C12.3451 1.15806 14.594 2.08962 16.2522 3.74781C17.9104 5.40599 18.842 7.65498 18.842 10C18.842 12.345 17.9104 14.594 16.2522 16.2522C14.594 17.9104 12.3451 18.8419 10 18.8419C7.655 18.8419 5.40601 17.9104 3.74783 16.2522C2.08964 14.594 1.15808 12.345 1.15808 10Z"
            stroke="#E8EFF5"
            stroke-width="1.66667"
          />

          <path
            d="M1.15808 10C1.15808 7.65498 2.08964 5.40599 3.74783 3.74781C5.40601 2.08962 7.655 1.15806 10 1.15806C12.3451 1.15806 14.594 2.08962 16.2522 3.74781C17.9104 5.40599 18.842 7.65498 18.842 10C18.842 12.345 17.9104 14.594 16.2522 16.2522C14.594 17.9104 12.3451 18.8419 10 18.8419C7.655 18.8419 5.40601 17.9104 3.74783 16.2522C2.08964 14.594 1.15808 12.345 1.15808 10Z"
            stroke="black"
            stroke-width="1.66667"
            stroke-dasharray="5 3"
            stroke-linecap="butt"
          />
        </svg>
      ),
      title: 'Home Health',
      subtitle: 'In Good Condition',
      value: '87%',
    },

    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M17.5 8.88V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H14.4533"
            stroke="black"
            stroke-width="1.66667"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M7.5 9.16666L10 11.6667L18.3333 3.33333"
            stroke="black"
            stroke-width="1.66667"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
      title: 'Tasks Due',
      subtitle: 'Scheduled This Week',
      value: '3',
    },

    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15.8333 5.83333V3.33333C15.8333 3.11232 15.7455 2.90036 15.5893 2.74408C15.433 2.5878 15.221 2.5 15 2.5H4.16667C3.72464 2.5 3.30072 2.67559 2.98816 2.98816C2.67559 3.30072 2.5 3.72464 2.5 4.16667C2.5 4.60869 2.67559 5.03262 2.98816 5.34518C3.30072 5.65774 3.72464 5.83333 4.16667 5.83333H16.6667C16.8877 5.83333 17.0996 5.92113 17.2559 6.07741C17.4122 6.23369 17.5 6.44565 17.5 6.66667V10M17.5 10H15C14.558 10 14.134 10.1756 13.8215 10.4882C13.5089 10.8007 13.3333 11.2246 13.3333 11.6667C13.3333 12.1087 13.5089 12.5326 13.8215 12.8452C14.134 13.1577 14.558 13.3333 15 13.3333H17.5C17.721 13.3333 17.933 13.2455 18.0893 13.0893C18.2455 12.933 18.3333 12.721 18.3333 12.5V10.8333C18.3333 10.6123 18.2455 10.4004 18.0893 10.2441C17.933 10.0878 17.721 10 17.5 10Z"
            stroke="black"
            stroke-width="1.66667"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M2.5 4.16667V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5H16.6667C16.8877 17.5 17.0996 17.4122 17.2559 17.2559C17.4122 17.0996 17.5 16.8877 17.5 16.6667V13.3333"
            stroke="black"
            stroke-width="1.66667"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
      title: 'This Months Spend',
      subtitle: 'In Completed Jobs',
      value: '£420',
    },
  ];

  const tasks = [
    {
      title: 'Boiler Service',
      category: 'Plumbing',
      subtitle: 'Quote Available',
      due: 'Due in 3 days',
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="36" rx="10" fill="#F9FAFB" />
          <path
            d="M20.25 13.25C20.0973 13.4058 20.0118 13.6152 20.0118 13.8333C20.0118 14.0515 20.0973 14.2609 20.25 14.4167L21.5833 15.75C21.7391 15.9027 21.9485 15.9882 22.1667 15.9882C22.3848 15.9882 22.5942 15.9027 22.75 15.75L25.8917 12.6083C26.3107 13.5343 26.4376 14.566 26.2554 15.566C26.0732 16.5659 25.5906 17.4865 24.8719 18.2052C24.1532 18.9239 23.2325 19.4065 22.2326 19.5887C21.2327 19.7709 20.201 19.644 19.275 19.225L13.5167 24.9833C13.1851 25.3149 12.7355 25.5011 12.2667 25.5011C11.7978 25.5011 11.3482 25.3149 11.0167 24.9833C10.6851 24.6518 10.4989 24.2022 10.4989 23.7333C10.4989 23.2645 10.6851 22.8149 11.0167 22.4833L16.775 16.725C16.356 15.799 16.2291 14.7673 16.4113 13.7674C16.5935 12.7675 17.0761 11.8468 17.7948 11.1281C18.5135 10.4094 19.4341 9.92681 20.434 9.74462C21.434 9.56243 22.4657 9.68931 23.3917 10.1083L20.2583 13.2417L20.25 13.25Z"
            stroke="#4A5565"
            stroke-width="1.66667"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
    },

    {
      title: 'Electrical Safety Check',
      category: 'Electrical',
      subtitle: 'In Progress',
      due: 'Due in 5 days',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3.33337 11.6667C3.17567 11.6672 3.02106 11.623 2.8875 11.5391C2.75393 11.4553 2.6469 11.3353 2.57883 11.193C2.51076 11.0508 2.48445 10.8921 2.50295 10.7355C2.52146 10.5789 2.58402 10.4308 2.68337 10.3083L10.9334 1.80833C10.9953 1.73689 11.0796 1.68862 11.1725 1.67144C11.2655 1.65425 11.3615 1.66917 11.4448 1.71375C11.5281 1.75832 11.5939 1.82991 11.6311 1.91675C11.6684 2.00359 11.6751 2.10053 11.65 2.19166L10.05 7.20833C10.0029 7.3346 9.98701 7.47043 10.0039 7.60417C10.0207 7.7379 10.0698 7.86556 10.1468 7.97618C10.2238 8.0868 10.3265 8.17709 10.4461 8.23929C10.5657 8.3015 10.6986 8.33377 10.8334 8.33333H16.6667C16.8244 8.33279 16.979 8.37701 17.1126 8.46084C17.2461 8.54468 17.3532 8.6647 17.4212 8.80695C17.4893 8.94919 17.5156 9.10784 17.4971 9.26444C17.4786 9.42105 17.4161 9.56919 17.3167 9.69166L9.0667 18.1917C9.00482 18.2631 8.92048 18.3114 8.82755 18.3285C8.73461 18.3457 8.6386 18.3308 8.55526 18.2862C8.47192 18.2417 8.40621 18.1701 8.36892 18.0832C8.33163 17.9964 8.32497 17.8995 8.35003 17.8083L9.95003 12.7917C9.99721 12.6654 10.0131 12.5296 9.99621 12.3958C9.97936 12.2621 9.93032 12.1344 9.85329 12.0238C9.77627 11.9132 9.67356 11.8229 9.55397 11.7607C9.43439 11.6985 9.3015 11.6662 9.1667 11.6667H3.33337Z"
            stroke="#4A5565"
            stroke-width="1.66667"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
    },

    {
      title: 'HVAC System Maintenance',
      category: 'HVAC',
      subtitle: 'Due Soon',
      due: 'Due in 7 days',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10.6666 16.3333C10.8779 16.4918 11.1238 16.5977 11.3841 16.6425C11.6443 16.6873 11.9115 16.6696 12.1636 16.5908C12.4156 16.5121 12.6454 16.3746 12.8339 16.1896C13.0224 16.0047 13.1643 15.7776 13.2478 15.527C13.3313 15.2765 13.3541 15.0097 13.3142 14.7486C13.2744 14.4876 13.1731 14.2397 13.0187 14.0255C12.8643 13.8112 12.6612 13.6367 12.4261 13.5164C12.191 13.3961 11.9307 13.3333 11.6666 13.3333H1.66663"
            stroke="#4A5565"
            stroke-width="1.66667"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M14.5833 6.66665C14.7964 6.38255 15.0785 6.15764 15.403 6.01326C15.7274 5.86889 16.0834 5.80984 16.4371 5.84173C16.7907 5.87362 17.1304 5.99539 17.4238 6.19548C17.7172 6.39557 17.9545 6.66732 18.1133 6.98495C18.2722 7.30258 18.3471 7.65553 18.3312 8.01029C18.3152 8.36505 18.2088 8.70984 18.0221 9.01192C17.8355 9.314 17.5746 9.56335 17.2645 9.73628C16.9543 9.90921 16.6051 9.99998 16.25 9.99998H1.66663"
            stroke="#4A5565"
            stroke-width="1.66667"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8.16663 3.66665C8.37789 3.50819 8.62379 3.40222 8.88406 3.35744C9.14432 3.31267 9.4115 3.33038 9.66357 3.40912C9.91565 3.48787 10.1454 3.62538 10.3339 3.81034C10.5224 3.9953 10.6643 4.2224 10.7478 4.47293C10.8313 4.72347 10.8541 4.99026 10.8142 5.25133C10.7744 5.51239 10.6731 5.76026 10.5187 5.9745C10.3643 6.18873 10.1612 6.36321 9.92609 6.48355C9.69102 6.60389 9.43071 6.66665 9.16663 6.66665H1.66663"
            stroke="#4A5565"
            stroke-width="1.66667"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className=" ">
        {/* Dashboard Content */}
        <main className=" space-y-6">
          {/* Property Header Section */}
          {/* <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1">
              <div className="relative h-64 rounded-lg overflow-hidden group">
                <img
                  src={(!coverLoading && cover[0]?.publicUrl) || '/lovable-uploads/326dc7e2-73e1-4176-b502-1deaed02919b.png'}
                  alt="Property at 23 Oakfield Road"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <input
                    ref={fileInputRef}
                    id="file-upload2"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label htmlFor="file-upload2">
                    <button
                      onClick={handleButtonClick}
                      type="button"
                      className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white transition-colors flex items-center space-x-2"
                    >
                      <Camera className="w-4 h-4" strokeWidth={1} />
                      <span>Upload New Photo</span>
                    </button>
                  </label>
                </div>
              </div>
            </div>
            <div className="col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 h-64 flex flex-col justify-center">
                <div>
                  <h1 className="text-2xl font-semibold text-black mb-3">{propertyDetails.address}</h1>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-4">Property Details:</h3>
                    <div className="space-y-2 text-sm text-black">
                      <div>• {propertyDetails.type}</div>
                      <div>• {propertyDetails.bedrooms} bed</div>
                      <div>• Moved in: {propertyDetails.moveInDate}</div>
                      <div>• Previous: {propertyDetails.previousAddress}</div>
                      <div>• Role: {propertyDetails.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 h-64 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-black">Property value</h3>
                    <TrendingUp className="w-4 h-4 text-gray-400" strokeWidth={1} />
                  </div>

                  <div className="text-2xl font-semibold text-black mb-4">£{propertyDetails.currentValue.toLocaleString()}</div>
                  <div className="text-sm text-green-600 mb-1 font-medium">+{propertyDetails.yearOnYearChange} YoY</div>
                  <div className="text-sm text-gray-600"></div>
                </div>

                <button className="w-full bg-gray-50 text-black font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                  Track Value
                </button>
              </div>
            </div>
          </div> */}

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-5">
            {stats.map((item, id) => (
              <div className="bg-[#F8F8F391] px-5 py-4 rounded-[9px] border border-[#DEDEDE63]" key={id}>
                <div className="flex items-start justify-between">
                  <span className="h-10 w-10 rounded-[14px] bg-white flex items-center justify-center">{item?.icon}</span>
                  <span className="border-[#BBF7D0] border bg-[#F0FDF4] text-[#10B981] text-[13px] px-4 py-[2px] rounded-[26px]">
                    {item?.subtitle}
                  </span>
                </div>
                <h3 className="text-sm text-[#6A7282] my-4">{item?.title}</h3>
                <h4 className="font-semibold text-[#101828] text-[41px]">{item?.value}</h4>
              </div>
            ))}
          </div>
          {/* Task and calander */}
          <div className="grid grid-cols-3 gap-5">
            {/* task */}
            <div className="bg-[#F8F8F391] col-span-2 rounded-[9px] p-[25px] border border-[#DEDEDE63]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[#101828] mb-1 text-[20px]">Your Active Home Tasks</h3>
                  <p className="text-[#6A7282] text-sm">We're tracking upcoming maintenance and new quote matches.</p>
                </div>
                <Button>
                  <Plus />
                  <span>Add Task</span>
                </Button>
              </div>

              {/* Tasks */}
              <div className="space-y-[15px] mt-[15px]">
                {tasks?.map((item, id) => (
                  <div className="border-[#E5E7EB80] p-[22px] border rounded-xl bg-white" key={id}>
                    <div className="flex items-start justify-between ">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-[10px] flex items-center bg-[#F9FAFB] justify-center">{item?.icon}</div>
                        <div>
                          <h3 className="text-[#101828] text-base font-medium">{item?.title}</h3>
                          <p className="text-[#6A7282] text-[12px]">{item?.category}</p>
                        </div>
                      </div>
                      <div className="border rounded-[26px] border-[#BBF7D0] text-[#10B981] bg-[#F0FDF4] py-1 px-2 text-[12px]">
                        {item?.subtitle}
                      </div>
                    </div>

                    <div className="flex items-center mt-5 justify-between">
                      <p className="text-[#6A7282] text-[13px]">{item?.due}</p>
                      <Button className="text-sm">View Quotes</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calaner */}
            <div className="bg-[#F8F8F391] col-span-1 rounded-[9px] p-[25px] border border-[#DEDEDE63]">
              <div className="flex items-center mb-5 justify-between">
                <h3 className="text-[#101828] text-[20px]">Upcoming Schedule</h3>
                <Calendar />
              </div>

              <div className="bg-white border border-[#E5E7EB80] rounded-[12px] p-5 flex flex-col">
                <div className="flex items-center justify-center mb-3">
                  <h3 className="text-[13px] text-[#6A7282]">{format(currentDate, 'MMMM yyyy').toUpperCase()}</h3>
                </div>

                <div className="flex-1">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => (
                      <div key={day} className="text-center text-[11px] font-medium text-[#99A1AF] p-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 place-items-center mb-8">
                    {Array.from({ length: (getDay(monthStart) + 6) % 7 }, (_, i) => (
                      <div key={`empty-${i}`} className="h-10"></div>
                    ))}

                    {monthDays.map(day => {
                      const dayNumber = day.getDate();
                      const isCurrentDay = isToday(day);
                      // find events for this day
                      const eventsForDay = dashEvents.filter(ev => ev.date && ev.date.toDateString() === day.toDateString());
                      // compute a status for the dot (priority: overdue > due-week > confirmed > future)
                      let dotStatus = null;
                      if (eventsForDay.some(e => computeStatus(e.date) === 'overdue')) dotStatus = 'overdue';
                      else if (eventsForDay.some(e => computeStatus(e.date) === 'due-week')) dotStatus = 'due-week';
                      else if (eventsForDay.some(e => computeStatus(e.date) === 'confirmed')) dotStatus = 'confirmed';
                      else if (eventsForDay.length) dotStatus = 'future';

                      return (
                        <div
                          key={dayNumber}
                          className={`relative h-[26px] w-full flex items-center justify-center text-[12px] cursor-pointer hover:bg-gray-50 rounded ${
                            isCurrentDay ? 'bg-black text-white font-semibold hover:bg-black' : 'text-[#4A5565]'
                          }`}
                        >
                          {dayNumber}
                          {dotStatus && <div className={`absolute top-1 right-1 w-1 h-1 rounded-full ${getDotColor(dotStatus)}`}></div>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  {/* <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Overdue/urgent</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Scheduled/confirmed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Due this week</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Future task</span>
                    </div>
                  </div> */}

                  {/* View Full Calendar Button */}
                  {/* <Link to="/dashboard/calendar" className="block w-full">
                    <button className="w-full bg-gray-50 text-black font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                      View Full Calendar
                    </button>
                  </Link> */}
                </div>
              </div>

              {/* Urgent Task */}

              <div className="mt-[30px] space-y-[32px]">
                <div className="flex gap-3">
                  <div className="h-[28px] flex items-center justify-center w-[28px] bg-[#FEF2F2] rounded-[10px]">
                    <Clock size={16} color="#E7000B" />
                  </div>
                  <div>
                    <h4 className="text-[#101828] text-sm mb-1">Roof Inspection</h4>
                    <p className="text-[#E7000B] text-xs">2 Days Left</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-[28px] flex items-center justify-center w-[28px] bg-[#FFFBEB] rounded-[10px]">
                    <Clock size={16} color="#E17100" />
                  </div>
                  <div>
                    <h4 className="text-[#101828] text-sm mb-1">Smoke Alarm Check</h4>
                    <p className="text-[#E17100] text-xs">Tomorrow</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-[28px] flex items-center justify-center w-[28px] bg-[#F0FDF4] rounded-[10px]">
                    <Clock size={16} color="#00A63E" />
                  </div>
                  <div>
                    <h4 className="text-[#101828] text-sm mb-1">Garden Clean-up</h4>
                    <p className="text-[#00A63E] text-xs">Next Week</p>
                  </div>
                </div>
              </div>

              <Link className="text-[#155DFC] text-xs mt-6 block" to={'/'}>
                View Full Calendar →
              </Link>
            </div>
          </div>

          {/* Corousel */}
          <div className="bg-[#F8F8F391] col-span-1 rounded-[9px] p-[25px] border border-[#DEDEDE63]">
            <div className="mb-5">
              <h3 className="text-[#101828] mb-1 text-[20px]">Matched Quotes Ready</h3>
              <p className="text-[#6A7282] text-sm">Compare verified local trades instantly and book in seconds.</p>
            </div>

            <Swiper
              spaceBetween={20}
              slidesPerView="auto"
              loop={true}
              autoplay={{ delay: 3000 }}
              // breakpoints={{
              //   320: { slidesPerView: 'auto' },
              //   768: { slidesPerView: 'auto' },
              //   1024: { slidesPerView: 'auto' },
              // }}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((item, id) => (
                <SwiperSlide className="!w-auto" key={id}>
                  <div className="p-[17px] bg-white text-center flex items-center flex-col border-[#E5E7EB80] border w-[215px] rounded-[12px]">
                    <div className="h-12 w-12 rounded-full bg-gray-300"></div>
                    <p className="text-[#101828] text-sm my-3">PlumbPro Ltd</p>
                    <p className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M6.72295 1.33877C6.74851 1.28712 6.788 1.24365 6.83696 1.21325C6.88592 1.18285 6.9424 1.16675 7.00003 1.16675C7.05766 1.16675 7.11414 1.18285 7.1631 1.21325C7.21206 1.24365 7.25155 1.28712 7.27712 1.33877L8.62462 4.06819C8.71339 4.24783 8.84442 4.40326 9.00648 4.52112C9.16854 4.63898 9.35677 4.71575 9.55503 4.74485L12.5685 5.18585C12.6256 5.19413 12.6793 5.21821 12.7234 5.25539C12.7675 5.29256 12.8004 5.34134 12.8182 5.39621C12.8361 5.45107 12.8382 5.50984 12.8244 5.56586C12.8106 5.62187 12.7813 5.67291 12.74 5.71319L10.5607 7.83535C10.417 7.97541 10.3094 8.1483 10.2474 8.33914C10.1853 8.52997 10.1705 8.73304 10.2043 8.93085L10.7188 11.9292C10.7289 11.9863 10.7227 12.045 10.701 12.0988C10.6793 12.1525 10.6429 12.199 10.596 12.2331C10.5491 12.2672 10.4936 12.2874 10.4358 12.2914C10.378 12.2954 10.3202 12.2831 10.269 12.2559L7.5752 10.8395C7.3977 10.7463 7.20022 10.6976 6.99974 10.6976C6.79926 10.6976 6.60178 10.7463 6.42428 10.8395L3.73103 12.2559C3.67989 12.2829 3.62218 12.2951 3.56446 12.291C3.50674 12.2869 3.45133 12.2667 3.40454 12.2326C3.35774 12.1986 3.32143 12.1521 3.29975 12.0985C3.27806 12.0448 3.27187 11.9862 3.28187 11.9292L3.79578 8.93144C3.82973 8.73353 3.81502 8.53033 3.75293 8.33938C3.69084 8.14842 3.58322 7.97544 3.43937 7.83535L1.26003 5.71377C1.21838 5.67354 1.18886 5.62242 1.17484 5.56623C1.16083 5.51004 1.16287 5.45105 1.18075 5.39596C1.19862 5.34088 1.23161 5.29193 1.27594 5.25468C1.32028 5.21743 1.37419 5.19338 1.43153 5.18527L4.44445 4.74485C4.64293 4.71598 4.83143 4.6393 4.99371 4.52143C5.15599 4.40355 5.28719 4.24801 5.37603 4.06819L6.72295 1.33877Z"
                          fill="#FCC800"
                          stroke="#FCC800"
                          stroke-width="1.16667"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      <span className="text-[#4A5565] text-xs">4.8</span>
                    </p>
                    <h4 className="text-[#101828] font-semibold text-[20px] my-3">£210</h4>
                    <Button className="w-full">Compare</Button>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default HomePlusDashboard;
