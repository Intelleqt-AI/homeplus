import { useState } from 'react';
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
  List,
  Grid3X3,
  Eye,
  X,
  Search,
  RotateCcw,
  PoundSterling,
  Zap,
  TrendingUp,
  Quote,
  Star,
  Repeat,
  Building,
  MapPin,
  Phone,
  Mail,
  Camera,
  Paperclip,
  MessageSquare,
  DollarSign,
  TrendingDown,
  Trash2,
  CreditCard,
  Home,
  Car,
  Settings,
  Flame,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AddEvent from '@/components/event/AddEvent';
import { useQuery } from '@tanstack/react-query';
import { getEvents } from '@/lib/Api2';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list' | 'board'>('month');
  const [filterType, setFilterType] = useState<'all' | 'safety' | 'maintenance' | 'financial' | 'household' | 'custom'>('all');
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['event'],
    queryFn: getEvents,
  });

  console.log(data);

  const today = new Date();

  const events = [
    // Overdue events
    {
      id: 0,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 47),
      time: '09:00',
      title: 'Boiler Service',
      type: 'maintenance',
      status: 'overdue',
      description: 'OVERDUE: Annual boiler service required - warranty at risk',
      contractor: 'Not booked',
      cost: '£120-180',
      priority: 'high',
      complianceType: 'gas_safety',
      hasDocument: false,
      hasQuotes: false,
      tradeConfirmed: false,
      photosRequired: true,
    },
    // Today's events
    {
      id: 1,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      time: '09:00',
      title: 'Boiler Annual Service',
      type: 'maintenance',
      status: 'confirmed',
      description: 'Annual boiler service and efficiency check',
      contractor: 'British Gas',
      cost: '£125',
      priority: 'medium',
      complianceType: 'gas_safety',
      hasDocument: true,
      hasQuotes: true,
      tradeConfirmed: true,
      photosRequired: false,
    },
    {
      id: 2,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      time: '14:30',
      title: 'Smoke Alarm Test',
      type: 'safety',
      status: 'pending',
      description: 'Monthly smoke alarm and carbon monoxide detector test',
      contractor: 'Self',
      cost: 'Free',
      priority: 'high',
      complianceType: 'safety',
      hasDocument: false,
      hasQuotes: false,
      tradeConfirmed: false,
      photosRequired: true,
    },
    // Insurance renewal (due soon)
    {
      id: 2.5,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
      time: '00:00',
      title: 'Insurance Renewal',
      type: 'admin',
      status: 'due_this_week',
      description: 'Home insurance policy renewal - current £420/year',
      contractor: 'Self',
      cost: '£420',
      priority: 'high',
      complianceType: 'insurance',
      hasDocument: true,
      hasQuotes: true,
      tradeConfirmed: false,
      photosRequired: false,
    },
    // Tomorrow's events
    {
      id: 3,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      time: '11:00',
      title: 'Gutter Cleaning',
      type: 'maintenance',
      status: 'quotes_ready',
      description: 'Autumn gutter cleaning and downpipe check - 3 quotes received',
      contractor: 'Not booked',
      cost: '£120-180',
      priority: 'medium',
      complianceType: 'none',
      hasDocument: false,
      hasQuotes: true,
      tradeConfirmed: false,
      photosRequired: true,
    },
    // This week's events
    {
      id: 4,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
      time: '10:30',
      title: 'HVAC Filter Change',
      type: 'maintenance',
      status: 'action_required',
      description: 'Replace air conditioning and heating filters',
      contractor: 'Self',
      cost: '£45',
      priority: 'low',
      complianceType: 'none',
      hasDocument: true,
      hasQuotes: false,
      tradeConfirmed: false,
      photosRequired: false,
    },
    {
      id: 5,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
      time: '15:00',
      title: 'Plumbing Inspection',
      type: 'inspection',
      status: 'pending',
      description: '6-month plumbing system inspection',
      contractor: 'AquaFlow Plumbing',
      cost: '£95',
      priority: 'medium',
      complianceType: 'none',
      hasDocument: false,
      hasQuotes: true,
      tradeConfirmed: true,
      photosRequired: false,
    },
    {
      id: 6,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
      time: '09:30',
      title: 'Window Cleaning',
      type: 'maintenance',
      status: 'confirmed',
      description: 'External window cleaning service',
      contractor: 'Crystal Clear Windows',
      cost: '£65',
      priority: 'low',
      complianceType: 'none',
      hasDocument: false,
      hasQuotes: false,
      tradeConfirmed: true,
      photosRequired: false,
    },
    // Later this month
    {
      id: 7,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10),
      time: '13:00',
      title: 'Garden Maintenance',
      type: 'maintenance',
      status: 'quotes_ready',
      description: 'Winter pruning and garden tidy - 3 quotes available',
      contractor: 'Not booked',
      cost: '£120-200',
      priority: 'low',
      complianceType: 'none',
      hasDocument: false,
      hasQuotes: true,
      tradeConfirmed: false,
      photosRequired: true,
    },
    {
      id: 8,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12),
      time: '11:30',
      title: 'EICR Testing',
      type: 'safety',
      status: 'due_this_week',
      description: 'Electrical Installation Condition Report - required for compliance',
      contractor: 'Not booked',
      cost: '£200-350',
      priority: 'high',
      complianceType: 'eicr',
      hasDocument: false,
      hasQuotes: false,
      tradeConfirmed: false,
      photosRequired: false,
    },
    {
      id: 9,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15),
      time: '10:00',
      title: 'Gas Safety Certificate',
      type: 'safety',
      status: 'confirmed',
      description: 'Annual gas safety inspection and certificate',
      contractor: 'SafeGas Engineers',
      cost: '£85',
      priority: 'high',
      complianceType: 'gas_safety',
      hasDocument: true,
      hasQuotes: false,
      tradeConfirmed: true,
      photosRequired: false,
    },
    {
      id: 10,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 18),
      time: '14:00',
      title: 'Electrical PAT Testing',
      type: 'safety',
      status: 'completed',
      description: 'Portable appliance testing for safety compliance - COMPLETED',
      contractor: 'ElectriSafe',
      cost: '£120',
      priority: 'medium',
      complianceType: 'pat_testing',
      hasDocument: true,
      hasQuotes: false,
      tradeConfirmed: true,
      photosRequired: false,
    },
  ];

  // Enhanced filtering and data processing
  const filteredEvents = events.filter(event => {
    if (filterType === 'all') return true;
    if (filterType === 'safety') return ['safety', 'inspection'].includes(event.type) || event.complianceType !== 'none';
    if (filterType === 'maintenance') return event.type === 'maintenance';
    if (filterType === 'financial')
      return event.type === 'admin' || event.title.toLowerCase().includes('insurance') || event.title.toLowerCase().includes('payment');
    if (filterType === 'household')
      return (
        event.title.toLowerCase().includes('bin') ||
        event.title.toLowerCase().includes('meter') ||
        event.title.toLowerCase().includes('shopping')
      );
    if (filterType === 'custom') return !['safety', 'maintenance', 'admin', 'inspection'].includes(event.type);
    return true;
  });

  const overdueEvents = filteredEvents.filter(event => event.status === 'overdue');

  const thisWeekEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.date);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return eventDate >= weekStart && eventDate <= weekEnd && event.status !== 'overdue';
  });

  const actionRequiredEvents = filteredEvents.filter(event => ['action_required', 'due_this_week', 'quotes_ready'].includes(event.status));

  const upcomingEvents = filteredEvents
    .filter(event => event.date > new Date() && event.date.toDateString() !== new Date().toDateString())
    .slice(0, 5);

  // Cost calculations
  const thisMonthCost = filteredEvents
    .filter(event => {
      const eventDate = new Date(event.date);
      const now = new Date();
      return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
    })
    .reduce((total, event) => {
      const cost = event.cost.replace(/[£,\-]/g, '');
      const numCost = parseInt(cost) || 0;
      return total + numCost;
    }, 0);

  const yearlySpent = 2847; // This would come from backend

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <>
            <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
            Confirmed
          </>
        );
      case 'action_required':
        return (
          <>
            <AlertTriangle className="w-3 h-3 text-yellow-600 mr-1" />
            Book now
          </>
        );
      case 'overdue':
        return (
          <>
            <AlertTriangle className="w-3 h-3 text-red-600 mr-1" />
            Overdue
          </>
        );
      case 'due_this_week':
        return (
          <>
            <AlertTriangle className="w-3 h-3 text-yellow-600 mr-1" />
            Book now
          </>
        );
      case 'quotes_ready':
        return (
          <>
            <MessageSquare className="w-3 h-3 text-blue-600 mr-1" />
            Quotes ready
          </>
        );
      case 'completed':
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

  const getStatusBorder = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-50 border border-red-200';
      case 'due_this_week':
      case 'action_required':
        return 'bg-yellow-50 border border-yellow-200';
      case 'confirmed':
        return 'bg-green-50 border border-green-200';
      case 'completed':
        return 'bg-gray-50 border border-gray-200';
      default:
        return 'bg-white border border-gray-200';
    }
  };

  const getBoardStatusBorder = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-50 border border-red-200';
      case 'due_this_week':
      case 'action_required':
        return 'bg-yellow-50 border border-yellow-200';
      case 'confirmed':
        return 'bg-green-50 border border-green-200';
      case 'completed':
        return 'bg-gray-50 border border-gray-200';
      default:
        return 'bg-white border border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case 'medium':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'safety':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'inspection':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="w-3 h-3 text-blue-600" />;
      case 'safety':
        return <Shield className="w-3 h-3 text-red-600" />;
      case 'inspection':
        return <FileText className="w-3 h-3 text-purple-600" />;
      case 'admin':
        return <Users className="w-3 h-3 text-gray-600" />;
      default:
        return <CalendarIcon className="w-3 h-3 text-gray-600" />;
    }
  };

  // Enhanced type icon function for specific services
  const getServiceIcon = (title: string, type: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('boiler')) return <Flame className="w-3 h-3 text-orange-600" />;
    if (titleLower.includes('smoke') || titleLower.includes('alarm')) return <Shield className="w-3 h-3 text-red-600" />;
    if (titleLower.includes('insurance')) return <FileText className="w-3 h-3 text-blue-600" />;
    if (titleLower.includes('gas')) return <Flame className="w-3 h-3 text-orange-600" />;
    if (titleLower.includes('eicr') || titleLower.includes('electrical')) return <Zap className="w-3 h-3 text-yellow-600" />;
    if (titleLower.includes('gutter')) return <Building className="w-3 h-3 text-gray-600" />;
    if (titleLower.includes('garden')) return <Home className="w-3 h-3 text-green-600" />;
    return getTypeIcon(type);
  };

  const formatCost = (cost: string, status: string) => {
    if (status === 'quotes_ready') {
      const cleanCost = cost.replace(/[£,\-]/g, '');
      if (cleanCost.includes('-')) {
        return `£${cleanCost.split('-')[0]} (3 quotes)`;
      }
      return `${cost} (3 quotes)`;
    }
    if (cost === 'Free') return cost;
    if (status === 'overdue' || status === 'action_required') {
      return 'Get quote';
    }
    return cost;
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => event.date.toDateString() === date.toDateString());
  };

  const toggleEventSelection = (eventId: number) => {
    setSelectedEvents(prev => (prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]));
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const generateCalendarDays = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
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
        {/* Simplified Top Controls Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-semibold text-black">Property Calendar</h1>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className="px-3 py-1 text-xs"
                >
                  Calendar
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3 py-1 text-xs"
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'board' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('board')}
                  className="px-3 py-1 text-xs"
                >
                  Board
                </Button>
              </div>

              {/* Enhanced Filter Pills */}
              <div className="flex items-center gap-2">
                {[
                  { value: 'all', label: 'All', color: 'default' },
                  { value: 'safety', label: 'Safety', color: 'destructive' },
                  { value: 'maintenance', label: 'Maintenance', color: 'secondary' },
                  { value: 'financial', label: 'Financial', color: 'default' },
                  { value: 'household', label: 'Household', color: 'default' },
                  { value: 'custom', label: 'Custom', color: 'outline' },
                ].map(filter => (
                  <Button
                    key={filter.value}
                    variant={filterType === filter.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType(filter.value as any)}
                    className={`px-3 py-1 text-xs ${
                      filterType === filter.value
                        ? filter.value === 'safety'
                          ? 'bg-red-500 text-white'
                          : filter.value === 'maintenance'
                          ? 'bg-orange-500 text-white'
                          : filter.value === 'financial'
                          ? 'bg-blue-500 text-white'
                          : filter.value === 'household'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-800 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Status Indicators & Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-4 h-4" /> <span className="font-medium">{overdueEvents.length} Overdue</span>
                </div>
                <div className="flex items-center gap-1 text-orange-600">
                  <Clock className="w-4 h-4" /> <span className="font-medium">{thisWeekEvents.length} This Week</span>
                </div>
                <AddEvent />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {viewMode === 'month' ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-black">{monthYear}</h2>
                  <div className="flex items-center space-x-2">
                    <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      const isToday = day.toDateString() === new Date().toDateString();
                      const dayEvents = getEventsForDate(day);

                      return (
                        <div
                          key={index}
                          className={`min-h-[100px] p-2 border border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''
                          } ${isToday ? 'bg-primary/10 border-primary' : ''}`}
                        >
                          <div className={`text-sm mb-1 ${isToday ? 'font-bold text-primary' : ''}`}>{day.getDate()}</div>

                          {/* Clean Event Display */}
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                className={`text-xs px-2 py-2 rounded border ${getStatusBorder(
                                  event.status
                                )} cursor-pointer hover:shadow-sm transition-shadow`}
                                title={`${event.time} - ${event.title}\n${event.description}`}
                                onClick={() => toggleEventSelection(event.id)}
                              >
                                <div className="font-medium text-gray-900 truncate">{event.title}</div>
                                <div className="text-xs text-gray-600 flex items-center justify-between mt-1">
                                  <span>
                                    {event.time} • {formatCost(event.cost, event.status)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{getStatusIcon(event.status)}</div>
                              </div>
                            ))}
                            {dayEvents.length > 2 && <div className="text-xs text-gray-500 pl-2 py-1">+{dayEvents.length - 2} more</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              </div>
            ) : viewMode === 'list' ? (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Events List</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="text-xs px-3 py-1.5 h-8">
                        <Filter className="w-3 h-3 mr-1" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs px-3 py-1.5 h-8">
                        Sort by date
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filteredEvents.map(event => (
                    <Card key={event.id} className={`${getStatusBorder(event.status)} hover:shadow-sm transition-shadow`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-sm font-medium text-black">{event.title}</h3>
                              <span className="text-xs text-gray-600">
                                {event.time} • {formatCost(event.cost, event.status)}
                              </span>
                            </div>

                            <div className="text-xs text-gray-600 mb-2 flex items-center">{getStatusIcon(event.status)}</div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                              <div>
                                <p className="text-xs text-gray-500">Date</p>
                                <p className="text-sm">{event.date.toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Contractor</p>
                                <p className="text-sm">{event.contractor === 'Not booked' ? 'To be booked' : event.contractor}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            {event.status === 'quotes_ready' ? (
                              <Button size="sm" variant="secondary" className="px-3 py-1.5 h-7 text-xs bg-gray-100 hover:bg-gray-200">
                                View quotes
                              </Button>
                            ) : event.status === 'overdue' || event.status === 'action_required' || event.status === 'due_this_week' ? (
                              <Button size="sm" variant="secondary" className="px-3 py-1.5 h-7 text-xs bg-gray-100 hover:bg-gray-200">
                                Get quotes
                              </Button>
                            ) : event.status === 'confirmed' ? (
                              <Button size="sm" variant="outline" className="px-3 py-1.5 h-7 text-xs">
                                Reschedule
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="px-3 py-1.5 h-7 text-xs">
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Board View</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Overdue Column */}
                    <Card className="bg-white border border-gray-200">
                      <CardHeader className="pb-3 border-b border-gray-100">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" /> Overdue ({overdueEvents.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {overdueEvents.map(event => (
                          <Card key={event.id} className={`${getBoardStatusBorder(event.status)} shadow-sm`}>
                            <CardContent className="p-3">
                              <h4 className="text-sm font-medium mb-1">{event.title}</h4>
                              <p className="text-xs text-gray-600 mb-2">
                                {event.time} • {formatCost(event.cost, event.status)}
                              </p>
                              <div className="text-xs text-red-600 mb-3 flex items-center">{getStatusIcon(event.status)}</div>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full text-xs px-2 py-1.5 h-7 bg-gray-100 hover:bg-gray-200"
                              >
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
                          <Clock className="w-5 h-5 text-orange-600" /> This Week ({thisWeekEvents.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {thisWeekEvents.map(event => (
                          <Card key={event.id} className={`${getBoardStatusBorder(event.status)} shadow-sm`}>
                            <CardContent className="p-3">
                              <h4 className="text-sm font-medium mb-1">{event.title}</h4>
                              <p className="text-xs text-gray-600 mb-2">
                                {event.time} • {formatCost(event.cost, event.status)}
                              </p>
                              <div className="text-xs text-yellow-600 mb-3 flex items-center">{getStatusIcon(event.status)}</div>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full text-xs px-2 py-1.5 h-7 bg-gray-100 hover:bg-gray-200"
                              >
                                {event.status === 'quotes_ready' ? 'View quotes' : 'Get quotes'}
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
                          <CheckCircle className="w-5 h-5 text-green-600" /> Confirmed (
                          {filteredEvents.filter(e => e.status === 'confirmed').length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {filteredEvents
                          .filter(e => e.status === 'confirmed')
                          .map(event => (
                            <Card key={event.id} className={`${getBoardStatusBorder(event.status)} shadow-sm`}>
                              <CardContent className="p-3">
                                <h4 className="text-sm font-medium mb-1">{event.title}</h4>
                                <p className="text-xs text-gray-600 mb-2">
                                  {event.time} • {event.cost}
                                </p>
                                <div className="text-xs text-green-600 mb-3 flex items-center">
                                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                                  {event.contractor}
                                </div>
                                <Button size="sm" variant="outline" className="w-full text-xs px-2 py-1.5 h-7">
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
                          <CheckCircle className="w-5 h-5 text-gray-600" /> Completed (
                          {filteredEvents.filter(e => e.status === 'completed').length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {filteredEvents
                          .filter(e => e.status === 'completed')
                          .map(event => (
                            <Card key={event.id} className={`${getBoardStatusBorder(event.status)} shadow-sm opacity-75`}>
                              <CardContent className="p-3">
                                <h4 className="text-sm font-medium text-gray-600 mb-1">{event.title}</h4>
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enhanced Right Sidebar - Structured Action Panel */}
          <div className="space-y-4">
            {/* Requires Action Panel */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
              <div className="flex items-center space-x-2 mb-6">
                <AlertTriangle className="w-5 h-5 text-yellow-600" strokeWidth={1} />
                <h3 className="font-semibold text-black">Requires Action ({actionRequiredEvents.length})</h3>
              </div>
              <div className="space-y-1">
                {[...overdueEvents.slice(0, 2), ...thisWeekEvents.slice(0, 2), ...upcomingEvents.slice(0, 2)].map(event => (
                  <div key={event.id} className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded">
                    <div className="flex items-center gap-2">
                      {getServiceIcon(event.title, event.type)}
                      <span className="text-sm font-medium text-black">{event.title}</span>
                    </div>
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 border-0">
                      {event.status === 'quotes_ready' ? 'View quotes' : 'Get quotes'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">This month</span>
                  <span className="font-medium">£{thisMonthCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">This year</span>
                  <span className="font-medium">£{yearlySpent.toLocaleString()}</span>
                </div>
                <button className="text-xs text-gray-600 hover:text-gray-800 mt-2 w-full text-left">View breakdown</button>
              </div>
            </div>

            {/* This Week Panel */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="w-5 h-5 text-gray-600" strokeWidth={1} />
                <h3 className="font-semibold text-black">This Week</h3>
              </div>
              <div className="space-y-1">
                {thisWeekEvents.slice(0, 3).map(event => (
                  <div key={event.id} className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded">
                    <div className="flex items-center gap-2">
                      {getServiceIcon(event.title, event.type)}
                      <span className="text-sm font-medium text-black">
                        {event.date.toLocaleDateString('en-GB', { weekday: 'short' })}: {event.title}
                      </span>
                    </div>
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 border-0">
                      {event.status === 'quotes_ready' ? 'View quotes' : 'Book now'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Week total:</span>
                  <span className="font-semibold text-green-600">
                    £
                    {thisWeekEvents.reduce((total, event) => {
                      const cost = event.cost.replace(/[£,\-]/g, '');
                      return total + (parseInt(cost) || 0);
                    }, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-5 h-5 text-gray-600" strokeWidth={1} />
                <h3 className="font-semibold text-black">Compliance Timeline</h3>
              </div>
              <div className="space-y-1">
                {[
                  { cert: 'EICR Testing', status: 'due', desc: 'Electrical Installation Condition Report', deadline: '15 Jan 2024' },
                  { cert: 'Gas Safety', status: 'ok', desc: 'Annual gas safety inspection', deadline: '20 Apr 2024' },
                  { cert: 'Boiler Service', status: 'ok', desc: 'Annual boiler maintenance', deadline: '10 Jul 2024' },
                  { cert: 'Insurance Renewal', status: 'expiring', desc: 'Home insurance policy renewal', deadline: '31 Oct 2024' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          item.status === 'due' ? 'bg-red-500' : item.status === 'expiring' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      ></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-black">{item.cert}</span>
                        <span className="text-xs text-gray-600">Due: {item.deadline}</span>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs px-2 py-1 ${
                        item.status === 'due'
                          ? 'bg-red-100 text-red-800'
                          : item.status === 'expiring'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Calendar;
