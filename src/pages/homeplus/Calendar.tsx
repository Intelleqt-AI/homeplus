import React, { useState } from "react";
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
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddEvent from "@/components/event/AddEvent";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/lib/Api2";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "list" | "board">(
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
  const [selectedEvents, setSelectedEvents] = useState<Array<string | number>>(
    []
  );

  const { data, isLoading } = useQuery({
    queryKey: ["event"],
    queryFn: getEvents,
  });

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
    cost?: number | string;
    priority?: string;
    complianceType?: string;
    hasDocument?: boolean;
    hasQuotes?: boolean;
    isRequireTrade?: boolean;
    tradeConfirmed?: boolean;
    photosRequired?: boolean;
    user_id?: string;
    recurring?: string;
  };

  const mappedRemoteEvents = Array.isArray(remoteRaw)
    ? (remoteRaw as RawEvent[]).map((ev: RawEvent) => {
        const parsedDate = ev?.date ? new Date(ev.date) : null;
        const costField =
          typeof ev?.cost === "number"
            ? ev.cost === 0
              ? "Free"
              : `£${ev.cost}`
            : ev?.cost ?? "Free";

        return {
          id: ev.id,
          created_at: ev.created_at,
          title: ev.title ?? "",
          date: parsedDate,
          time: ev.time ?? "",
          type: ev.eventType ?? ev.type ?? "maintenance",
          status: computeStatusFromDate(parsedDate),
          description: ev.description ?? "",
          contractor: ev.contractor ?? "",
          cost: costField,
          priority: ev.priority ?? "medium",
          complianceType: ev.complianceType ?? "none",
          hasDocument: !!ev.hasDocument,
          hasQuotes: !!ev.hasQuotes,
          tradeConfirmed: !!ev.isRequireTrade || !!ev.tradeConfirmed,
          photosRequired: !!ev.photosRequired,
          user_id: ev.user_id,
          recurring: ev.recurring ?? "never",
        };
      })
    : [];

  const fallbackEvents = [
    {
      id: "ca206a4f-db58-41e0-afc7-3ac7308d7666",
      created_at: "2025-10-09T10:27:19.130604+00:00",
      title: "Test",
      date: null,
      time: "",
      type: "maintenance",
      status: computeStatusFromDate(null),
      description: "",
      contractor: "",
      cost: "Free",
      priority: "medium",
      complianceType: "none",
      hasDocument: false,
      hasQuotes: false,
      tradeConfirmed: false,
      photosRequired: false,
      user_id: "2aa3c70e-c10c-4a31-9654-3e37adcd9cdd",
    },
  ];

  const events = mappedRemoteEvents.length
    ? mappedRemoteEvents
    : fallbackEvents;

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

  // Cost calculations
  const thisMonthCost = filteredEvents
    .filter((event) => {
      const eventDate = new Date(event?.date);
      const now = new Date();
      return (
        eventDate.getMonth() === now.getMonth() &&
        eventDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((total, event) => {
      const cost = event.cost.replace(/[£,-]/g, "");
      const numCost = parseInt(cost) || 0;
      return total + numCost;
    }, 0);

  const yearlySpent = 2847; // This would come from backend

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <>
            <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
            Confirmed
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

  const getBoardStatusBorder = (status: string) => {
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

  const formatCost = (cost: string, status: string) => {
    if (status === "quotes_ready") {
      const cleanCost = cost.replace(/[£,-]/g, "");
      if (cleanCost.includes("-")) {
        return `£${cleanCost.split("-")[0]} (3 quotes)`;
      }
      return `${cost} (3 quotes)`;
    }
    if (cost === "Free") return cost;
    if (status === "overdue" || status === "action_required") {
      return "Get quote";
    }
    return cost;
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(
      (event) => getEventDateString(event) === date.toDateString()
    );
  };

  const toggleEventSelection = (eventId: string | number) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
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
    startDate.setDate(startDate.getDate() - firstDay.getDay());
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
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Total Tasks</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#1A1A1A] text-2xl font-semibold">{filteredEvents.length}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">All tasks</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">This Week</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#1A1A1A] text-2xl font-semibold">{thisWeekEvents.length}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">Due this week</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Confirmed</span>
                <div className="h-8 w-8 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#10B981] text-2xl font-semibold">{filteredEvents.filter(e => e.status === 'confirmed').length}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">Tasks confirmed</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Action Required</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#DC2626] text-2xl font-semibold">{overdueEvents.length}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">Need attention</p>
            </div>
          </div>
        </div>

        {/* View Mode & Filters */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
          <div className="flex items-center justify-between">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              {[
                { value: "month", label: "Calendar" },
                { value: "list", label: "List" },
                { value: "board", label: "Board" },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value as "month" | "list" | "board")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
                    viewMode === mode.value
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#4A4A4A] hover:bg-[#F5F5F0] hover:text-[#1A1A1A]'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Filter Pills */}
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
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
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
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          key={day}
                          className="p-2 text-center text-sm font-medium text-gray-600">
                          {day}
                        </div>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      const isCurrentMonth =
                        day.getMonth() === currentDate.getMonth();
                      const isToday =
                        day.toDateString() === new Date().toDateString();
                      const dayEvents = getEventsForDate(day);

                      return (
                        <div
                          key={index}
                          className={`min-h-[100px] p-2 border border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !isCurrentMonth ? "text-gray-400 bg-gray-50" : ""
                          } ${isToday ? "bg-primary/10 border-primary" : ""}`}>
                          <div
                            className={`text-sm mb-1 ${
                              isToday ? "font-bold text-primary" : ""
                            }`}>
                            {day.getDate()}
                          </div>

                          {/* Clean Event Display */}
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className={`text-xs px-2 py-2 rounded border ${getStatusBorder(
                                  event.status
                                )} cursor-pointer hover:shadow-sm transition-shadow`}
                                title={`${event.time} - ${event.title}\n${event.description}`}
                                onClick={() => toggleEventSelection(event.id)}>
                                <div className="font-medium text-gray-900 truncate">
                                  {event.title}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center justify-between mt-1">
                                  <span>
                                    {event.time} •{" "}
                                    {formatCost(event.cost, event.status)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {getStatusIcon(event.status)}
                                </div>
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-gray-500 pl-2 py-1">
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
                      className={`${getStatusBorder(
                        event.status
                      )} hover:shadow-sm transition-shadow`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-sm font-medium text-black">
                                {event.title}
                              </h3>
                              <span className="text-xs text-gray-600">
                                {event.time} •{" "}
                                {formatCost(event.cost, event.status)}
                              </span>
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

                          <div className="flex flex-col gap-2 ml-4">
                            {event.status === "quotes_ready" ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="px-3 py-1.5 h-7 text-xs bg-gray-100 hover:bg-gray-200">
                                View quotes
                              </Button>
                            ) : event.status === "overdue" ||
                              event.status === "action_required" ||
                              event.status === "due_this_week" ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="px-3 py-1.5 h-7 text-xs bg-gray-100 hover:bg-gray-200">
                                Get quotes
                              </Button>
                            ) : event.status === "confirmed" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-3 py-1.5 h-7 text-xs">
                                Reschedule
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="px-3 py-1.5 h-7 text-xs">
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
                <h2 className="text-[#1A1A1A] text-lg font-semibold mb-6">Board View</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Overdue Column */}
                    <Card className="bg-white border border-gray-200">
                      <CardHeader className="pb-3 border-b border-gray-100">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />{" "}
                          Overdue ({overdueEvents.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {overdueEvents.map((event) => (
                          <Card
                            key={event.id}
                            className={`${getBoardStatusBorder(
                              event.status
                            )} shadow-sm`}>
                            <CardContent className="p-3">
                              <h4 className="text-sm font-medium mb-1">
                                {event.title}
                              </h4>
                              <p className="text-xs text-gray-600 mb-2">
                                {event.time} •{" "}
                                {formatCost(event.cost, event.status)}
                              </p>
                              <div className="text-xs text-red-600 mb-3 flex items-center">
                                {getStatusIcon(event.status)}
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full text-xs px-2 py-1.5 h-7 bg-gray-100 hover:bg-gray-200">
                                Get quotes
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Due This Week Column */}
                    <Card className="bg-white border border-gray-200">
                      <CardHeader className="pb-3 border-b border-gray-100">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-orange-600" /> This
                          Week ({thisWeekEvents.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {thisWeekEvents.map((event) => (
                          <Card
                            key={event.id}
                            className={`${getBoardStatusBorder(
                              event.status
                            )} shadow-sm`}>
                            <CardContent className="p-3">
                              <h4 className="text-sm font-medium mb-1">
                                {event.title}
                              </h4>
                              <p className="text-xs text-gray-600 mb-2">
                                {event.time} •{" "}
                                {formatCost(event.cost, event.status)}
                              </p>
                              <div className="text-xs text-yellow-600 mb-3 flex items-center">
                                {getStatusIcon(event.status)}
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full text-xs px-2 py-1.5 h-7 bg-gray-100 hover:bg-gray-200">
                                {event.status === "quotes_ready"
                                  ? "View quotes"
                                  : "Get quotes"}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Confirmed Column */}
                    <Card className="bg-white border border-gray-200">
                      <CardHeader className="pb-3 border-b border-gray-100">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />{" "}
                          Confirmed (
                          {
                            filteredEvents.filter(
                              (e) => e.status === "confirmed"
                            ).length
                          }
                          )
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {filteredEvents
                          .filter((e) => e.status === "confirmed")
                          .map((event) => (
                            <Card
                              key={event.id}
                              className={`${getBoardStatusBorder(
                                event.status
                              )} shadow-sm`}>
                              <CardContent className="p-3">
                                <h4 className="text-sm font-medium mb-1">
                                  {event.title}
                                </h4>
                                <p className="text-xs text-gray-600 mb-2">
                                  {event.time} • {event.cost}
                                </p>
                                <div className="text-xs text-green-600 mb-3 flex items-center">
                                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                                  {event.contractor}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-xs px-2 py-1.5 h-7">
                                  Reschedule
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                      </CardContent>
                    </Card>

                    {/* Completed Column */}
                    <Card className="bg-white border border-gray-200">
                      <CardHeader className="pb-3 border-b border-gray-100">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-gray-600" />{" "}
                          Completed (
                          {
                            filteredEvents.filter(
                              (e) => e.status === "completed"
                            ).length
                          }
                          )
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {filteredEvents
                          .filter((e) => e.status === "completed")
                          .map((event) => (
                            <Card
                              key={event.id}
                              className={`${getBoardStatusBorder(
                                event.status
                              )} shadow-sm opacity-75`}>
                              <CardContent className="p-3">
                                <h4 className="text-sm font-medium text-gray-600 mb-1">
                                  {event.title}
                                </h4>
                                <p className="text-xs text-gray-500 mb-2">
                                  {event.time} • {event.cost}
                                </p>
                                <div className="text-xs text-gray-500 flex items-center">
                                  <CheckCircle className="w-3 h-3 text-gray-600 mr-1" />
                                  Completed
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </CardContent>
                    </Card>
                  </div>
              </div>
            )}
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
    </DashboardLayout>
  );
};

export default Calendar;
