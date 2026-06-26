import React, { useState } from "react";
import { Link } from "react-router-dom";

const SEASONAL_TIPS: Record<number, string[]> = {
  0:  ['Lag outdoor pipes to prevent freezing', 'Check boiler pressure and bleed radiators'],
  1:  ['Check roof for winter damage after storms', 'Boiler service due — book before spring demand peaks'],
  2:  ['External paintwork check — good weather coming', 'Service boiler before you stop needing heating'],
  3:  ['Clear gutters of winter debris', 'Check window seals and draught-proofing'],
  4:  ['Check outdoor taps and irrigation systems', 'Inspect eaves and roof for pest entry points'],
  5:  ['Check loft ventilation before summer heat builds', 'Test smoke and CO alarms'],
  6:  ['Water garden during heat — check for hose bans', 'Check if flat roof needs resealing'],
  7:  ['Review home insurance renewal if due', 'Book boiler service now before October rush'],
  8:  ['Service boiler before heating season', 'Check chimney if you have a fireplace'],
  9:  ['Clean gutters — autumn leaves block drainage', 'Lag exposed pipes before first frost', 'Bleed radiators for efficient heating'],
  10: ['Draught-proof doors and windows', 'Check boiler pressure and top up if low'],
  11: ['Test smoke and CO alarms before Christmas gatherings', 'Check boiler has enough pressure for the holiday period'],
};
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Calendar as CalendarIcon,
  Wrench,
  Shield,
  FileText,
  Users,
  Zap,
  Building,
  MessageSquare,
  Home,
  Flame,
  ClipboardList,
  Bell,
  Settings,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddEvent from "@/components/event/AddEvent";
import EventDetailDialog, { type CalendarEventDetail } from "@/components/event/EventDetailDialog";
import Quote, { type QuotePrefill } from "@/components/topbar/Quote";
import { inferTradeFromTitle } from "@/lib/tradeInference";
import { TRADE_OPTIONS, getTradeCategoryLabel } from "@/lib/tradeCategories";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getEvents } from "@/lib/Api2";
import usePatch from "@/hooks/usePatch";
import { toast } from "sonner";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "list">(
    "month"
  );
  type FilterType =
    | "all"
    | "safety"
    | "maintenance"
    | "financial"
    | "household"
    | "custom";
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogDate, setAddDialogDate] = useState<string | undefined>(undefined);
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quotePrefill, setQuotePrefill] = useState<QuotePrefill | undefined>(undefined);
  const [detailEvent, setDetailEvent] = useState<CalendarEventDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const queryClient = useQueryClient();

  const openDetail = (event: CalendarEventDetail) => {
    setDetailEvent(event);
    setDetailOpen(true);
  };

  const openQuoteFor = (event: {
    title: string;
    property?: string | null;
    trade?: string | null;
    tradeCategory?: string | null;
  }) => {
    // Quote.tsx's `service` is the *display label* ('Gas Engineer'),
    // and `category` is the subcategory's display label ('Boilers').
    // Convert slugs → labels here. Fall back to title inference for legacy
    // events created before Phase 1.8.
    const tradeOption = event.trade
      ? TRADE_OPTIONS.find(o => o.value === event.trade)
      : undefined;
    const serviceLabel = tradeOption?.label ?? inferTradeFromTitle(event.title);
    const categoryLabel = event.tradeCategory
      ? getTradeCategoryLabel(event.tradeCategory)
      : undefined;

    setQuotePrefill({
      title: event.title,
      service: serviceLabel,
      category: categoryLabel,
      property: event.property ?? undefined,
    });
    setQuoteOpen(true);
  };

  const moveEventMutation = usePatch({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event"] });
    },
    onError: () => {
      toast.error("Couldn't move task");
    },
  });

  const toDateInputValue = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleDayClick = (day: Date) => {
    setAddDialogDate(toDateInputValue(day));
    setAddDialogOpen(true);
  };

  const handleEventDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    eventId: string | number
  ) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", String(eventId));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDayDragOver = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const key = toDateInputValue(day);
    if (dragOverDateKey !== key) setDragOverDateKey(key);
  };

  const handleDayDragLeave = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
    // Only clear if we're really leaving this cell (not entering a child).
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    const key = toDateInputValue(day);
    if (dragOverDateKey === key) setDragOverDateKey(null);
  };

  const handleDayDrop = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
    e.preventDefault();
    setDragOverDateKey(null);
    const eventId = e.dataTransfer.getData("text/plain");
    if (!eventId) return;
    const newDate = toDateInputValue(day);
    const dropped = filteredEvents.find((ev) => String(ev.id) === eventId);
    if (dropped?.date && getEventDateString(dropped) === day.toDateString()) return;
    moveEventMutation.mutate({ url: `/api/v1/events/${eventId}/`, data: { date: newDate } });
  };

  const { data, isLoading } = useQuery({
    queryKey: ["event"],
    queryFn: getEvents,
  });

  type BankHoliday = { title: string; date: string; notes?: string };
  type BankHolidaysResponse = {
    [division: string]: { division: string; events: BankHoliday[] };
  };

  const { data: bankHolidays } = useQuery({
    queryKey: ["uk-bank-holidays"],
    queryFn: async (): Promise<Record<string, BankHoliday>> => {
      const res = await fetch("https://www.gov.uk/bank-holidays.json");
      if (!res.ok) throw new Error("Failed to load bank holidays");
      const json = (await res.json()) as BankHolidaysResponse;
      // Default to England & Wales — adjust the division key for Scotland/NI if needed.
      const events = json["england-and-wales"]?.events ?? [];
      return Object.fromEntries(events.map((ev) => [ev.date, ev]));
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  const getBankHolidayForDate = (d: Date): BankHoliday | undefined => {
    if (!bankHolidays) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return bankHolidays[`${y}-${m}-${day}`];
  };

  const today = new Date();

  const computeStatusFromDate = (d: Date | null) => {
    if (!d) return "pending";
    if (d.toDateString() === today.toDateString()) return "confirmed";
    if (d < today) return "overdue";
    return "confirmed";
  };

  // Map remote `getEvents` data to the UI shape. Prefer `date` field for calendar placement.
  const remoteRaw = data?.data ?? data ?? [];
  type RawEvent = {
    id?: string;
    created_at?: string;
    title?: string;
    date?: string | null;
    time?: string;
    eventType?: string;
    type?: string;
    description?: string;
    contractor?: string;
    priority?: string;
    complianceType?: string;
    hasDocument?: boolean;
    hasQuotes?: boolean;
    isRequireTrade?: boolean;
    tradeConfirmed?: boolean;
    photosRequired?: boolean;
    user_id?: string;
    recurring?: string;
    property?: string | null;
    trade?: string | null;
    tradeCategory?: string | null;
    actionStatus?: string;
    reminderDate?: string | null;
  };

  const mappedRemoteEvents = Array.isArray(remoteRaw)
    ? (remoteRaw as RawEvent[]).map((ev: RawEvent) => {
        const parsedDate = ev?.date ? new Date(ev.date) : null;

        return {
          id: ev.id,
          created_at: ev.created_at,
          title: ev.title ?? "",
          date: parsedDate,
          time: ev.time ?? "",
          type: ev.eventType ?? ev.type ?? "maintenance",
          // Prefer the server's date-aware escalation (action_required/overdue);
          // fall back to the local date check for legacy events.
          status:
            ev.actionStatus && ev.actionStatus !== "scheduled"
              ? ev.actionStatus
              : computeStatusFromDate(parsedDate),
          description: ev.description ?? "",
          contractor: ev.contractor ?? "",
          priority: ev.priority ?? "medium",
          complianceType: ev.complianceType ?? "none",
          hasDocument: !!ev.hasDocument,
          hasQuotes: !!ev.hasQuotes,
          tradeConfirmed: !!ev.isRequireTrade || !!ev.tradeConfirmed,
          photosRequired: !!ev.photosRequired,
          user_id: ev.user_id,
          recurring: ev.recurring ?? "never",
          property: ev.property ?? null,
          trade: ev.trade ?? null,
          tradeCategory: ev.tradeCategory ?? null,
        };
      })
    : [];

  // MOT tasks now arrive as linked Events via /api/v1/events/, already carrying
  // the trade route + server-computed action_status — no localStorage merge.
  const events = mappedRemoteEvents;

  // Enhanced filtering and data processing
  const filteredEvents = events.filter((event) => {
    if (filterType === "all") return true;
    if (filterType === "safety")
      return (
        ["safety", "inspection"].includes(event.type) ||
        event.complianceType !== "none"
      );
    if (filterType === "maintenance") return event.type === "maintenance";
    if (filterType === "financial")
      return (
        event.type === "admin" ||
        event.title.toLowerCase().includes("insurance") ||
        event.title.toLowerCase().includes("payment")
      );
    if (filterType === "household")
      return (
        event.title.toLowerCase().includes("bin") ||
        event.title.toLowerCase().includes("meter") ||
        event.title.toLowerCase().includes("shopping")
      );
    if (filterType === "custom")
      return !["safety", "maintenance", "admin", "inspection"].includes(
        event.type
      );
    return true;
  });

  const overdueEvents = filteredEvents.filter(
    (event) => event.status === "overdue"
  );

  const thisWeekEvents = filteredEvents.filter((event) => {
    const eventDate = new Date(event?.date);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return (
      eventDate >= weekStart &&
      eventDate <= weekEnd &&
      event.status !== "overdue"
    );
  });

  const actionRequiredEvents = filteredEvents.filter((event) =>
    ["action_required", "due_this_week", "quotes_ready"].includes(event.status)
  );

  const upcomingEvents = filteredEvents
    .filter(
      (event) =>
        event?.date > new Date() &&
        event.date.toDateString() !== new Date().toDateString()
    )
    .slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <>
            <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
            Done
          </>
        );
      case "action_required":
        return (
          <>
            <AlertTriangle className="w-3 h-3 text-yellow-600 mr-1" />
            Book now
          </>
        );
      case "overdue":
        return (
          <>
            <AlertTriangle className="w-3 h-3 text-red-600 mr-1" />
            Overdue
          </>
        );
      case "due_this_week":
        return (
          <>
            <AlertTriangle className="w-3 h-3 text-yellow-600 mr-1" />
            Book now
          </>
        );
      case "quotes_ready":
        return (
          <>
            <MessageSquare className="w-3 h-3 text-blue-600 mr-1" />
            Quotes ready
          </>
        );
      case "completed":
        return (
          <>
            <CheckCircle className="w-3 h-3 text-gray-600 mr-1" />
            Completed
          </>
        );
      default:
        return (
          <>
            <AlertTriangle className="w-3 h-3 text-yellow-600 mr-1" />
            Book now
          </>
        );
    }
  };

  // Helpers to safely handle event.date which may be Date, string, or null
  const getEventDateString = (ev: RawEvent | unknown) => {
    const e = ev as RawEvent | undefined;
    if (!e?.date) return null;
    const d =
      typeof e.date === "string"
        ? new Date(e.date as string)
        : (e.date as Date);
    return d.toDateString();
  };

  const formatEventDateLong = (ev: RawEvent | unknown) => {
    const e = ev as RawEvent | undefined;
    if (!e?.date) return "—";
    const d =
      typeof e.date === "string"
        ? new Date(e.date as string)
        : (e.date as Date);
    return d.toLocaleDateString();
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case "overdue":
        return "bg-red-50 border border-red-200";
      case "due_this_week":
      case "action_required":
        return "bg-yellow-50 border border-yellow-200";
      case "confirmed":
        return "bg-green-50 border border-green-200";
      case "completed":
        return "bg-gray-50 border border-gray-200";
      default:
        return "bg-white border border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case "medium":
        return <Clock className="w-3 h-3 text-yellow-500" />;
      case "low":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "maintenance":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "safety":
        return "bg-red-50 text-red-700 border-red-200";
      case "inspection":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "admin":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="w-3 h-3 text-blue-600" />;
      case "safety":
        return <Shield className="w-3 h-3 text-red-600" />;
      case "inspection":
        return <FileText className="w-3 h-3 text-purple-600" />;
      case "admin":
        return <Users className="w-3 h-3 text-gray-600" />;
      default:
        return <CalendarIcon className="w-3 h-3 text-gray-600" />;
    }
  };

  // Enhanced type icon function for specific services
  const getServiceIcon = (title: string, type: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("boiler"))
      return <Flame className="w-3 h-3 text-orange-600" />;
    if (titleLower.includes("smoke") || titleLower.includes("alarm"))
      return <Shield className="w-3 h-3 text-red-600" />;
    if (titleLower.includes("insurance"))
      return <FileText className="w-3 h-3 text-blue-600" />;
    if (titleLower.includes("gas"))
      return <Flame className="w-3 h-3 text-orange-600" />;
    if (titleLower.includes("eicr") || titleLower.includes("electrical"))
      return <Zap className="w-3 h-3 text-yellow-600" />;
    if (titleLower.includes("gutter"))
      return <Building className="w-3 h-3 text-gray-600" />;
    if (titleLower.includes("garden"))
      return <Home className="w-3 h-3 text-green-600" />;
    return getTypeIcon(type);
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(
      (event) => getEventDateString(event) === date.toDateString()
    );
  };

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const previousMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );

  const generateCalendarDays = () => {
    const firstDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const startDate = new Date(firstDay);
    // Week starts on Monday: shift Sunday (getDay=0) back 6 days, everything else (getDay-1).
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - mondayOffset);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section - Dashboard Style */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[#6B6B6B] text-sm mb-0.5">Your schedule</p>
                <h1 className="text-[#1A1A1A] text-2xl font-semibold">Tasks</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AddEvent />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-[#F5F5F0] rounded-[16px] px-3 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-xs sm:text-sm">Total Tasks</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#1A1A1A] text-xl sm:text-2xl font-semibold">{filteredEvents.length}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">All tasks</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-[16px] px-3 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-xs sm:text-sm">This Week</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#1A1A1A] text-xl sm:text-2xl font-semibold">{thisWeekEvents.length}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">Due this week</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-[16px] px-3 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-xs sm:text-sm">Done</span>
                <div className="h-8 w-8 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#10B981] text-xl sm:text-2xl font-semibold">{filteredEvents.filter(e => e.status === 'completed').length}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">Completed</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-[16px] px-3 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-xs sm:text-sm">Needs attention</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#DC2626] text-xl sm:text-2xl font-semibold">{overdueEvents.length}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">Need attention</p>
            </div>
          </div>
        </div>

        {/* Manage templates shortcut */}
        <div className="flex justify-end">
          <Link to="/dashboard/settings?tab=tasks">
            <Button variant="outline" size="sm" className="flex items-center gap-2 text-[#4A4A4A] border-[#E8E8E3] hover:border-[#1A1A1A]">
              <Settings className="w-4 h-4" />
              Manage task templates
            </Button>
          </Link>
        </div>

        {/* Seasonal nudges */}
        {(SEASONAL_TIPS[currentDate.getMonth()] ?? []).length > 0 && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[20px] p-5">
            <p className="text-sm font-semibold text-[#1A1A1A] mb-3">
              Seasonal tips for {currentDate.toLocaleString('default', { month: 'long' })}
            </p>
            <div className="flex flex-wrap gap-2">
              {(SEASONAL_TIPS[currentDate.getMonth()] ?? []).map((tip, i) => (
                <div key={i} className="bg-white border border-[#FDE68A] rounded-full px-3 py-1.5 text-xs text-[#1A1A1A]">
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Mode & Filters */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">

          {/* Desktop (sm+): single row — view toggle left, pills right */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { value: "month", label: "Calendar" },
                { value: "list", label: "List" },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value as "month" | "list")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                    viewMode === mode.value
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#4A4A4A] hover:bg-[#F5F5F0] hover:text-[#1A1A1A]'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {[
                { value: "all", label: "All" },
                { value: "safety", label: "Safety" },
                { value: "maintenance", label: "Maintenance" },
                { value: "financial", label: "Financial" },
                { value: "household", label: "Household" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value as FilterType)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                    filterType === filter.value
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#4A4A4A] hover:bg-[#F5F5F0] hover:text-[#1A1A1A] border border-[#E8E8E3]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: single row — view toggle + Filter button with floating popup */}
          <div className="sm:hidden flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { value: "month", label: "Calendar" },
                { value: "list", label: "List" },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value as "month" | "list")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                    viewMode === mode.value
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#4A4A4A] hover:bg-[#F5F5F0] hover:text-[#1A1A1A]'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Filter button + floating popup */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full border transition-all duration-200 ${
                  filterOpen || filterType !== 'all'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'text-[#4A4A4A] border-[#E8E8E3] hover:bg-[#F5F5F0]'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
                {filterType !== 'all' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FBBF24] ml-0.5" />
                )}
              </button>

              {filterOpen && (
                <>
                  {/* Backdrop — closes popup on outside tap */}
                  <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                  {/* Mini popup */}
                  <div className="absolute top-full right-0 mt-2 z-20 bg-white border border-[#E8E8E3] rounded-[16px] shadow-lg py-2 min-w-[160px]">
                    {[
                      { value: "all", label: "All" },
                      { value: "safety", label: "Safety" },
                      { value: "maintenance", label: "Maintenance" },
                      { value: "financial", label: "Financial" },
                      { value: "household", label: "Household" },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => { setFilterType(filter.value as FilterType); setFilterOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                          filterType === filter.value
                            ? 'bg-[#F5F5F0] text-[#1A1A1A] font-semibold'
                            : 'text-[#4A4A4A] hover:bg-[#F5F5F0] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {filterType === filter.value && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1A1A1A] mr-2 mb-0.5" />
                        )}
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {viewMode === "month" ? (
              <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[#1A1A1A] text-lg font-semibold">
                    {monthYear}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={previousMonth}
                      className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors">
                      <ChevronLeft className="w-4 h-4 text-[#4A4A4A]" />
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors">
                      <ChevronRight className="w-4 h-4 text-[#4A4A4A]" />
                    </button>
                  </div>
                </div>

                <>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {[
                      ["Mon", "M"], ["Tue", "T"], ["Wed", "W"], ["Thu", "T"],
                      ["Fri", "F"], ["Sat", "S"], ["Sun", "S"],
                    ].map(([full, short]) => (
                      <div
                        key={full}
                        className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-600">
                        <span className="hidden sm:inline">{full}</span>
                        <span className="sm:hidden">{short}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      const isCurrentMonth =
                        day.getMonth() === currentDate.getMonth();
                      const isToday =
                        day.toDateString() === new Date().toDateString();
                      const dayEvents = getEventsForDate(day);
                      const bankHoliday = getBankHolidayForDate(day);

                      const dayKey = toDateInputValue(day);
                      const isDragOver = dragOverDateKey === dayKey;

                      return (
                        <div
                          key={index}
                          onClick={() => handleDayClick(day)}
                          onDragOver={(e) => handleDayDragOver(e, day)}
                          onDragLeave={(e) => handleDayDragLeave(e, day)}
                          onDrop={(e) => handleDayDrop(e, day)}
                          role="button"
                          tabIndex={0}
                          title={
                            bankHoliday
                              ? `UK Bank Holiday: ${bankHoliday.title}${
                                  bankHoliday.notes ? ` — ${bankHoliday.notes}` : ""
                                }\nClick to add a task on this day`
                              : "Click to add a task on this day"
                          }
                          className={`min-h-[60px] sm:min-h-[80px] md:min-h-[100px] p-1 sm:p-2 border border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !isCurrentMonth ? "text-gray-400 bg-gray-50" : ""
                          } ${isToday ? "bg-primary/10 border-primary" : ""} ${
                            bankHoliday && isCurrentMonth ? "bg-rose-50/60" : ""
                          } ${
                            isDragOver
                              ? "ring-2 ring-primary/60 bg-primary/5"
                              : ""
                          }`}>
                          <div
                            className={`text-xs sm:text-sm mb-0.5 sm:mb-1 ${
                              isToday ? "font-bold text-primary" : ""
                            }`}>
                            {day.getDate()}
                          </div>

                          {bankHoliday && (
                            <div className="hidden sm:block text-[10px] font-medium px-1.5 py-0.5 mb-1 rounded bg-rose-100 text-rose-700 border border-rose-200 truncate">
                              {bankHoliday.title}
                            </div>
                          )}

                          {/* Clean Event Display */}
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map((event, i) => (
                              <div
                                key={event.id}
                                draggable
                                onDragStart={(e) => handleEventDragStart(e, event.id)}
                                className={`text-xs px-1.5 sm:px-2 py-1 sm:py-2 rounded border ${getStatusBorder(
                                  event.status
                                )} cursor-pointer hover:shadow-sm transition-shadow ${i === 1 ? 'hidden sm:block' : ''}`}
                                title={`${event.time ? event.time + ' - ' : ''}${event.title}${event.description ? '\n' + event.description : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetail(event as unknown as CalendarEventDetail);
                                }}>
                                <div className="font-medium text-gray-900 truncate">
                                  {event.title}
                                </div>
                                {event.time && (
                                  <div className="hidden sm:block text-xs text-gray-600 mt-1">
                                    {event.time}
                                  </div>
                                )}
                                <div className="hidden sm:flex items-center text-xs text-gray-500 mt-1">
                                  {getStatusIcon(event.status)}
                                </div>
                              </div>
                            ))}
                            {/* +N more: shows after 1 event on mobile, after 2 on sm+ */}
                            {dayEvents.length > 1 && (
                              <div className="sm:hidden text-[10px] text-gray-500 pl-1">
                                +{dayEvents.length - 1} more
                              </div>
                            )}
                            {dayEvents.length > 2 && (
                              <div className="hidden sm:block text-xs text-gray-500 pl-2 py-1">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              </div>
            ) : viewMode === "list" ? (
              <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[#1A1A1A] text-lg font-semibold">Tasks List</h2>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 text-sm font-medium text-[#4A4A4A] hover:bg-[#F5F5F0] rounded-full transition-colors flex items-center gap-2 border border-[#E8E8E3]">
                      <Filter className="w-3 h-3" />
                      Filter
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredEvents.map((event) => (
                    <Card
                      key={event.id}
                      onClick={() => openDetail(event as unknown as CalendarEventDetail)}
                      className={`${getStatusBorder(
                        event.status
                      )} hover:shadow-sm transition-shadow cursor-pointer`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-sm font-medium text-black">
                                {event.title}
                              </h3>
                              {event.time && (
                                <span className="text-xs text-gray-600">
                                  {event.time}
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-gray-600 mb-2 flex items-center">
                              {getStatusIcon(event.status)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                              <div>
                                <p className="text-xs text-gray-500">Date</p>
                                <p className="text-sm">
                                  {event?.date?.toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">
                                  Contractor
                                </p>
                                <p className="text-sm">
                                  {event.contractor === "Not booked"
                                    ? "To be booked"
                                    : event.contractor}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4" onClick={e => e.stopPropagation()}>
                            {event.tradeConfirmed && (
                              <Button
                                size="sm"
                                onClick={() => openQuoteFor(event)}
                                className="px-3 py-1.5 h-7 text-xs bg-[#FBBF24] text-[#1A1A1A] hover:bg-[#F59E0B]">
                                Get Quotes
                              </Button>
                            )}
                            {event.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-3 py-1.5 h-7 text-xs">
                                Reschedule
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Sidebar - Upcoming Tasks and Reminders */}
          <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[#1A1A1A] text-lg font-semibold">Upcoming tasks and reminders</h3>
              </div>
            </div>
            <p className="text-[#6B6B6B] text-sm mb-4">Next 3 items</p>

            {/* Task List */}
            <div className="space-y-3">
              {[...overdueEvents, ...thisWeekEvents, ...upcomingEvents].slice(0, 3).map((item, idx) => {
                const dueDate = item?.date ? new Date(item.date) : null;
                const diffDays = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;

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
                    key={item?.id || idx}
                    onClick={() => openDetail(item as unknown as CalendarEventDetail)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-[8px] flex items-center justify-center bg-white border border-[#E5E7EB]`}>
                        <Clock size={14} className={urgencyColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[#1F2937] text-sm font-medium truncate">{item?.title}</h4>
                        <p className="text-[#9CA3AF] capitalize text-[11px] mt-0.5">{item?.type}</p>
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

            {filteredEvents.length > 3 && (
              <button className="text-[#FBBF24] text-sm mt-4 block text-center hover:text-[#D4A017] transition-colors font-medium w-full">
                View all {filteredEvents.length} tasks
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Day-click "Add Task" dialog (prefilled with the clicked date) */}
      <AddEvent
        hideTrigger
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initialDate={addDialogDate}
      />

      {/* Post-a-Job dialog opened from "Get Quotes" buttons on trade events */}
      <Quote open={quoteOpen} setOpen={setQuoteOpen} prefill={quotePrefill} />

      {/* Task / Reminder details popup — opens when any event card is clicked */}
      <EventDetailDialog
        event={detailEvent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onGetQuotes={ev =>
          openQuoteFor({
            title: ev.title,
            property: ev.property ?? null,
            trade: ev.trade ?? null,
            tradeCategory: ev.tradeCategory ?? null,
          })
        }
      />
    </DashboardLayout>
  );
};

export default Calendar;
