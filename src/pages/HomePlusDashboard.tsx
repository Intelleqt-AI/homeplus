import { useRef, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getEvents, uploadCover } from '@/lib/Api2';
import { listFilesWithMetadata, uploadFileWithMetadata } from '@/lib/Api';
import { toast } from 'sonner';

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
    queryKey: ["property"],
    queryFn: () => import("@/lib/Api2").then((mod) => mod.getProperty()),
  });

  const { data: eventData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["event"],
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
    rows.map((r) => ({
      id: r.id as string,
      title: r.title || "Untitled",
      date: r.date ? new Date(r.date) : null,
      time: r.time || "",
      type: r.eventType || r.type || "maintenance",
      priority: r.priority || "medium",
      cost: typeof r.cost === "number" ? r.cost : r.cost ? Number(r.cost) : 0,
      recurring: r.recurring || "never",
      complianceType: r.complianceType || "none",
      isRequireTrade: !!r.isRequireTrade,
      description: r.description || "",
    }));

  const dashEvents: DashEvent[] = Array.isArray(rawEvents)
    ? mapToDashEvents(rawEvents)
    : [];

  const getDotColor = (status) => {
    switch (status) {
      case "overdue":
        return "bg-red-500";
      case "scheduled":
      case "confirmed":
        return "bg-green-500";
      case "due-week":
      case "action_required":
        return "bg-yellow-500";
      case "future":
        return "bg-gray-400";
      default:
        return "";
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
    if (!d) return "unscheduled";
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "confirmed";
    if (d < now) return "overdue";
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 7) return "due-week";
    return "future";
  };

  // Property details
  const propertyDetails = {
    address: data?.data?.address || "Loading address...",
    type: data?.data?.type || "Loading...",
    bedrooms: data?.data?.bedrooms || "Loading...",
    bathrooms: "N/A",
    moveInDate: "N/A",
    yearsAtProperty: "N/A",
    previousAddress: "N/A",
    currentValue: "N/A",
    yearOnYearChange: "N/A",
    role: data?.data?.role || "Loading...",
  };

  // Alert defaults for UK properties - enhanced with new row anatomy
  const ALERT_DEFAULTS = [
    {
      key: "boiler_service",
      title: "Boiler service",
      icon: Flame,
      cadence: "P12M",
      dueInDays: -2,
      action: "get 3 quotes",
      category: "service",
      type: "Service",
    },
    {
      key: "alarm_test",
      title: "Smoke/CO alarm test",
      icon: Shield,
      cadence: "P1M",
      dueInDays: 5,
      action: "mark done",
      category: "safety",
      type: "Safety",
    },
    {
      key: "gutter_clean",
      title: "Gutter clean",
      icon: Home,
      cadence: "P12M",
      dueInDays: 6,
      action: "get 3 quotes",
      category: "service",
      type: "Service",
    },
    {
      key: "insurance_renewal",
      title: "Buildings insurance",
      icon: FileCheck,
      nudges: [60, 30, 7],
      dueInDays: 30,
      action: "get 3 quotes",
      category: "compliance",
      type: "Compliance",
    },
    {
      key: "warranty_end",
      title: "Appliance warranty",
      icon: Shield,
      nudges: [30, 7, 1],
      dueInDays: 21,
      action: "get 3 quotes",
      category: "warranty",
      type: "Warranty",
    },
    {
      key: "garden_maintenance",
      title: "Garden maintenance",
      icon: TreePine,
      cadence: "P3M",
      dueInDays: 12,
      action: "get 3 quotes",
      category: "service",
      type: "Service",
    },
    {
      key: "window_cleaning",
      title: "Window cleaning",
      icon: Home,
      cadence: "P6M",
      dueInDays: 25,
      action: "get 3 quotes",
      category: "service",
      type: "Service",
    },
  ];

  const LANDLORD_EXTRAS = [
    {
      key: "eicr",
      title: "EICR (electrical inspection)",
      cadence: "P5Y",
      dueInDays: 42,
      action: "+ document",
      category: "document",
    },
    {
      key: "gas_safety",
      title: "Gas safety CP12",
      cadence: "P12M",
      dueInDays: 18,
      action: "book service",
      category: "service",
    },
    {
      key: "tenancy_swap",
      title: "Tenancy changeover",
      checklist: true,
      dueInDays: 55,
      action: "view checklist",
      category: "safety",
    },
  ];

  // Mock property settings - in real app would come from settings
  const isLandlordProperty = false; // This would come from property settings

  // Combine alerts based on property type
  const allAlerts = isLandlordProperty
    ? [...ALERT_DEFAULTS, ...LANDLORD_EXTRAS]
    : ALERT_DEFAULTS;

  // Group alerts by urgency (new grouping)
  const groupAlertsByUrgency = (alerts) => {
    const overdue = alerts.filter((alert) => alert.dueInDays < 0);
    const today = alerts.filter(
      (alert) => alert.dueInDays >= 0 && alert.dueInDays <= 1
    );
    const thisWeek = alerts.filter(
      (alert) => alert.dueInDays > 1 && alert.dueInDays <= 7
    );
    const laterThisMonth = alerts.filter(
      (alert) => alert.dueInDays > 7 && alert.dueInDays <= 30
    );

    return { overdue, today, thisWeek, laterThisMonth };
  };

  // Get category chip color
  const getCategoryColor = (type) => {
    switch (type.toLowerCase()) {
      case "service":
        return "bg-blue-100 text-blue-700";
      case "safety":
        return "bg-red-100 text-red-700";
      case "warranty":
        return "bg-green-100 text-green-700";
      case "compliance":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusDotColor = (dueInDays) => {
    if (dueInDays < 0) return "bg-gray-800"; // overdue - dark grey
    if (dueInDays <= 7) return "bg-red-500"; // urgent - red
    if (dueInDays <= 14) return "bg-yellow-500"; // medium - yellow
    return "bg-gray-400"; // later - grey
  };

  const getButtonStyle = (dueInDays) => {
    if (dueInDays < 0) return "bg-gray-500 text-white hover:bg-gray-600"; // overdue
    if (dueInDays <= 7) return "bg-red-500 text-white hover:bg-red-600"; // urgent - red
    if (dueInDays <= 14) return "bg-primary text-black hover:bg-primary/90"; // medium - your brand yellow
    return "bg-gray-300 text-gray-700 hover:bg-gray-400"; // later - grey
  };

  // Smart matches data
  const smartMatches = [
    {
      name: "ABC Plumbing",
      rating: 4.8,
      reviews: 156,
      specialty: "Emergency repairs",
    },
    {
      name: "Smith Gas Services",
      rating: 4.9,
      reviews: 89,
      specialty: "Boiler specialists",
    },
    {
      name: "Local Handyman Co",
      rating: 4.7,
      reviews: 203,
      specialty: "General maintenance",
    },
  ];

  return (
    <DashboardLayout>
      <div className=" bg-gray-50 font-inter">
        {/* Dashboard Content */}
        <main className=" space-y-6">
          {/* Property Header Section */}
          <div className="grid grid-cols-3 gap-6">
            {/* Property Photo */}
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

            {/* Property Details */}
            <div className="col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 h-64 flex flex-col justify-center">
                <div>
                  <h1 className="text-2xl font-semibold text-black mb-3">
                    {propertyDetails.address}
                  </h1>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-4">
                      Property Details:
                    </h3>
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

            {/* Property Value Card */}
            <div className="col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 h-64 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-black">Property value</h3>
                    <TrendingUp
                      className="w-4 h-4 text-gray-400"
                      strokeWidth={1}
                    />
                  </div>

                  <div className="text-2xl font-semibold text-black mb-4">
                    £{propertyDetails.currentValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600 mb-1 font-medium">
                    +{propertyDetails.yearOnYearChange} YoY
                  </div>
                  <div className="text-sm text-gray-600">
                    {/* +£{Math.round(propertyDetails.currentValue * (propertyDetails.yearOnYearChange / 100)).toLocaleString()} */}
                  </div>
                </div>

                <button className="w-full bg-gray-50 text-black font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                  Track Value
                </button>
              </div>
            </div>
          </div>

          {/* Home Essentials Horizontal Scroll Row */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <div className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-gray-600" strokeWidth={1} />
                <h2 className="font-semibold text-black">HOME ESSENTIALS</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 gap-4">
                {/* Gas Safety Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Flame className="w-4 h-4 text-gray-600" strokeWidth={1} />
                    <h3 className="font-medium text-black text-sm">
                      Gas Safety
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle
                      className="w-5 h-5 text-green-500"
                      strokeWidth={1}
                    />
                    <span className="text-xs text-green-600 font-medium">
                      Valid
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Expires in 264 days
                  </div>
                </div>

                {/* EICR Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="w-4 h-4 text-gray-600" strokeWidth={1} />
                    <h3 className="font-medium text-black text-sm">EICR</h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle
                      className="w-5 h-5 text-green-500"
                      strokeWidth={1}
                    />
                    <span className="text-xs text-green-600 font-medium">
                      Valid
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Expires in 1,642 days
                  </div>
                </div>

                {/* EPC Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileCheck
                      className="w-4 h-4 text-gray-600"
                      strokeWidth={1}
                    />
                    <h3 className="font-medium text-black text-sm">EPC</h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle
                      className="w-5 h-5 text-green-500"
                      strokeWidth={1}
                    />
                    <span className="text-xs text-green-600 font-medium">
                      Rating B
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Expires in 2,856 days
                  </div>
                </div>

                {/* Insurance Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-4 h-4 text-gray-600" strokeWidth={1} />
                    <h3 className="font-medium text-black text-sm">
                      Insurance
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle
                      className="w-5 h-5 text-orange-500"
                      strokeWidth={1}
                    />
                    <span className="text-xs text-orange-600 font-medium">
                      Expires soon
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Renewal in 30 days
                  </div>
                </div>

                {/* Boiler Service Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Flame className="w-4 h-4 text-gray-600" strokeWidth={1} />
                    <h3 className="font-medium text-black text-sm">
                      Boiler Service
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle
                      className="w-5 h-5 text-red-500"
                      strokeWidth={1}
                    />
                    <span className="text-xs text-red-600 font-medium">
                      46 days overdue
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Warranty at risk</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mb-16">
            {/* CALENDAR */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-5 h-5 text-gray-600" strokeWidth={1} />
                <h3 className="font-semibold text-black">
                  {format(currentDate, "MMMM yyyy").toUpperCase()}
                </h3>
              </div>

              <div className="flex-1">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-500 p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-8">
                  {/* Empty cells for days before month start */}
                  {Array.from(
                    { length: (getDay(monthStart) + 6) % 7 },
                    (_, i) => (
                      <div key={`empty-${i}`} className="h-10"></div>
                    )
                  )}

                  {/* Month days */}
                  {monthDays.map((day) => {
                    const dayNumber = day.getDate();
                    const isCurrentDay = isToday(day);
                    // find events for this day
                    const eventsForDay = dashEvents.filter(
                      (ev) =>
                        ev.date && ev.date.toDateString() === day.toDateString()
                    );
                    // compute a status for the dot (priority: overdue > due-week > confirmed > future)
                    let dotStatus = null;
                    if (
                      eventsForDay.some(
                        (e) => computeStatus(e.date) === "overdue"
                      )
                    )
                      dotStatus = "overdue";
                    else if (
                      eventsForDay.some(
                        (e) => computeStatus(e.date) === "due-week"
                      )
                    )
                      dotStatus = "due-week";
                    else if (
                      eventsForDay.some(
                        (e) => computeStatus(e.date) === "confirmed"
                      )
                    )
                      dotStatus = "confirmed";
                    else if (eventsForDay.length) dotStatus = "future";

                    return (
                      <div
                        key={dayNumber}
                        className={`relative h-10 flex items-center justify-center text-sm cursor-pointer hover:bg-gray-50 rounded ${
                          isCurrentDay
                            ? "bg-yellow-400 text-black font-semibold"
                            : "text-gray-900"
                        }`}>
                        {dayNumber}
                        {dotStatus && (
                          <div
                            className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${getDotColor(
                              dotStatus
                            )}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Overdue/urgent
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Scheduled/confirmed
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Due this week</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Future task</span>
                  </div>
                </div>

                {/* View Full Calendar Button */}
                <Link to="/dashboard/calendar" className="block w-full">
                  <button className="w-full bg-gray-50 text-black font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                    View Full Calendar
                  </button>
                </Link>
              </div>
            </div>

            {/* THIS WEEK'S TASKS */}
            <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="w-5 h-5 text-gray-600" strokeWidth={1} />
                <h3 className="font-semibold text-black">THIS WEEK'S TASKS</h3>
              </div>

              <div className="space-y-4">
                {/* Overdue Tasks */}
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-3">
                    Overdue
                  </h4>
                  <div className="space-y-3">
                    {dashEvents
                      .filter((e) => computeStatus(e.date) === "overdue")
                      .map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Flame
                              className="w-4 h-4 text-red-600"
                              strokeWidth={1}
                            />
                            <div>
                              <span className="text-sm font-medium text-black">
                                {e.title}
                              </span>
                              <p className="text-xs text-gray-600">
                                Due{" "}
                                {e.date
                                  ? Math.ceil(
                                      (Date.now() - e.date.getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    )
                                  : ""}{" "}
                                days ago
                              </p>
                            </div>
                          </div>
                          <button className="bg-red-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm">
                            Book Now
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* This Week Tasks */}
                <div>
                  <h4 className="text-sm font-medium text-yellow-600 mb-3">
                    Due This Week
                  </h4>
                  <div className="space-y-3">
                    {dashEvents
                      .filter((e) => computeStatus(e.date) === "due-week")
                      .map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between p-3 bg-white border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Shield
                              className="w-4 h-4 text-yellow-600"
                              strokeWidth={1}
                            />
                            <div>
                              <span className="text-sm font-medium text-black">
                                {e.title}
                              </span>
                              <p className="text-xs text-gray-600">
                                Due{" "}
                                {e.date
                                  ? Math.ceil(
                                      (e.date.getTime() - Date.now()) /
                                        (1000 * 60 * 60 * 24)
                                    )
                                  : ""}{" "}
                                days
                              </p>
                            </div>
                          </div>
                          <button className="bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                            Mark Done
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Scheduled Tasks */}
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-3">
                    Scheduled
                  </h4>
                  <div className="space-y-3">
                    {dashEvents
                      .filter((e) => computeStatus(e.date) === "confirmed")
                      .map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Wrench
                              className="w-4 h-4 text-green-600"
                              strokeWidth={1}
                            />
                            <div>
                              <span className="text-sm font-medium text-black">
                                {e.title}
                              </span>
                              <p className="text-xs text-gray-600">
                                {e.date ? e.date.toLocaleDateString() : ""}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm text-green-600 font-medium">
                            Confirmed
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100">
                <Link to="/dashboard/calendar" className="block w-full">
                  <button className="w-full bg-gray-50 text-black font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                    View All Tasks →
                  </button>
                </Link>
              </div>
            </div>
          </div>
          {/* Knowledge Centre Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-16">
            <h2 className="text-xl font-semibold text-black mb-6 text-center">
              KNOWLEDGE CENTRE
            </h2>

            <div className="grid grid-cols-3 gap-6">
              {/* MAINTENANCE GUIDES */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
                <div className="flex items-center space-x-2 mb-6">
                  <Wrench className="w-5 h-5 text-gray-600" strokeWidth={1} />
                  <h3 className="font-semibold text-black">
                    MAINTENANCE GUIDES
                  </h3>
                </div>

                <div className="flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">
                          Boiler Servicing
                        </h4>
                        <p className="text-xs text-gray-600">
                          When & why you need annual checks
                        </p>
                      </div>
                      <button className="bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded-lg hover:bg-gray-200 transition-colors text-xs">
                        Read Guide
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">
                          Insurance Basics
                        </h4>
                        <p className="text-xs text-gray-600">
                          What coverage you really need
                        </p>
                      </div>
                      <button className="bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded-lg hover:bg-gray-200 transition-colors text-xs">
                        Read Guide
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* VALUE YOUR HOME */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
                <div className="flex items-center space-x-2 mb-6">
                  <TrendingUp
                    className="w-5 h-5 text-gray-600"
                    strokeWidth={1}
                  />
                  <h3 className="font-semibold text-black">VALUE YOUR HOME</h3>
                </div>

                <div className="flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">
                          Add Value Tips
                        </h4>
                        <p className="text-xs text-gray-600">
                          Top 10 improvements that add £5k+
                        </p>
                      </div>
                      <button className="bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded-lg hover:bg-gray-200 transition-colors text-xs">
                        Learn More
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">
                          EPC Improvements
                        </h4>
                        <p className="text-xs text-gray-600">
                          Get from C to B rating guide
                        </p>
                      </div>
                      <button className="bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded-lg hover:bg-gray-200 transition-colors text-xs">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEASONAL TIPS */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
                <div className="flex items-center space-x-2 mb-6">
                  <Calendar className="w-5 h-5 text-gray-600" strokeWidth={1} />
                  <h3 className="font-semibold text-black">SEASONAL TIPS</h3>
                </div>

                <div className="flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">
                          Winter Prep Guide
                        </h4>
                        <p className="text-xs text-gray-600">
                          Protect pipes, gutters & heating
                        </p>
                      </div>
                      <button className="bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded-lg hover:bg-gray-200 transition-colors text-xs">
                        Add Checklist
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">
                          Spring Tasks
                        </h4>
                        <p className="text-xs text-gray-600">
                          Garden, roof & exterior checks
                        </p>
                      </div>
                      <button className="bg-gray-300 text-gray-700 font-medium py-1.5 px-3 rounded-lg hover:bg-gray-400 transition-colors text-xs">
                        Coming March
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Smart Matches Panel (Conditional) */}
          {showSmartMatches && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-black">
                  Smart Matches for Boiler Service
                </h3>
                <button
                  onClick={() => setShowSmartMatches(false)}
                  className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                {smartMatches.map((match, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4">
                    <div className="font-medium text-black mb-1">
                      {match.name}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {match.specialty}
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="text-sm font-medium">{match.rating}★</div>
                      <div className="text-sm text-gray-600">
                        ({match.reviews} reviews)
                      </div>
                    </div>
                    <button className="text-sm text-primary hover:underline">
                      Swap for different trade
                    </button>
                  </div>
                ))}
              </div>

              <button className="w-full bg-primary text-black font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors">
                Request 3 Quotes
              </button>
            </div>
          )}

          {/* Book Service Trigger */}
          {!showSmartMatches && (
            <div className="text-center">
              <button
                onClick={() => setShowSmartMatches(true)}
                className="bg-primary text-black font-medium py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors">
                Book Service
              </button>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default HomePlusDashboard;
