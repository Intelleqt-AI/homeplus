import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  User,
  Home,
  Calendar,
  FileText,
  Briefcase,
  Settings,
  HelpCircle,
  LogOut,
  TrendingUp,
  Upload,
  CheckCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Users,
  MessageSquare,
  ChevronDown,
  Zap,
  PiggyBank,
  Camera,
  Wrench,
  Package,
  Plus,
  Target,
  Shield,
  Star,
  Eye,
  Download,
  Lightbulb,
  MoreHorizontal,
  FileCheck,
  Flame,
  Smartphone,
  Car,
  Paintbrush,
  TreePine,
  Hammer,
  X,
  Activity,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';

const HomePlusDashboard = () => {
  const location = useLocation();
  const [selectedProperty, setSelectedProperty] = useState('23 Oakfield Rd, SW12 8JD');
  const [activeJobTab, setActiveJobTab] = useState('awaiting');
  const [showSmartMatches, setShowSmartMatches] = useState(false);
  const { signOut, user } = useAuth();

  console.log(user);

  // Calendar setup
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Sample calendar events with colors matching the legend
  const calendarEvents = {
    1: 'overdue', // Red - overdue/urgent
    2: 'scheduled', // Green - scheduled/confirmed
    7: 'due-week', // Yellow - due this week
    8: 'due-week', // Yellow
    16: 'future', // Gray - future task
    23: 'future', // Gray
    29: 'future', // Gray
  };

  const getDotColor = status => {
    switch (status) {
      case 'overdue':
        return 'bg-red-500';
      case 'scheduled':
        return 'bg-green-500';
      case 'due-week':
        return 'bg-yellow-500';
      case 'future':
        return 'bg-gray-400';
      default:
        return '';
    }
  };

  // Property details
  const propertyDetails = {
    address: '23 Oakfield Road, SW12 8JD',
    type: 'Detached house',
    bedrooms: 4,
    bathrooms: 2,
    moveInDate: 'March 2019',
    yearsAtProperty: 5,
    previousAddress: '14 High St (2015-2019)',
    currentValue: 549000,
    yearOnYearChange: 3.7,
  };

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
    { icon: FileText, label: 'Documents', path: '/dashboard/documents' },
    { icon: Briefcase, label: 'Job Leads', path: '/dashboard/job-leads' },
    { icon: Activity, label: 'Insights', path: '/dashboard/insights' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

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
    { key: 'eicr', title: 'EICR (electrical inspection)', cadence: 'P5Y', dueInDays: 42, action: '+ document', category: 'document' },
    { key: 'gas_safety', title: 'Gas safety CP12', cadence: 'P12M', dueInDays: 18, action: 'book service', category: 'service' },
    { key: 'tenancy_swap', title: 'Tenancy changeover', checklist: true, dueInDays: 55, action: 'view checklist', category: 'safety' },
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

  const { overdue, today, thisWeek, laterThisMonth } = groupAlertsByUrgency(allAlerts);

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

  // Mock property history for trade matcher chips
  const propertyTradeHistory = [
    { name: 'Plumber', icon: Wrench, count: 8 },
    { name: 'Electrician', icon: Zap, count: 5 },
    { name: 'Gas Engineer', icon: Flame, count: 4 },
    { name: 'Handyman', icon: Hammer, count: 12 },
    { name: 'Gardener', icon: TreePine, count: 6 },
    { name: 'Cleaner', icon: Smartphone, count: 15 },
    { name: 'Painter', icon: Paintbrush, count: 3 },
    { name: 'Roofer', icon: Home, count: 2 },
  ];

  // Documents ordered by urgency
  const urgentDocuments = [
    { name: 'Buildings Insurance', daysLeft: 30, hasDocument: false, type: 'compliance' },
    { name: 'Appliance Warranty', daysLeft: 21, hasDocument: true, type: 'warranty' },
    { name: 'Gas Safety Certificate', daysLeft: 365, hasDocument: true, type: 'compliance' },
    { name: 'EICR Certificate', daysLeft: 730, hasDocument: true, type: 'compliance' },
    { name: 'EPC Rating', daysLeft: 1095, hasDocument: true, type: 'compliance' },
  ].sort((a, b) => a.daysLeft - b.daysLeft);

  const missingDocuments = [
    { name: 'Roof inspection', type: 'service', notApplicable: false },
    { name: 'Electrical certificate', type: 'compliance', notApplicable: false },
  ];

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

  // Jobs data with tabs
  const jobsData = {
    awaiting: [
      { title: 'Fix leaking tap', posted: '2 days ago', quotes: 0 },
      { title: 'Paint hallway', posted: '4 hours ago', quotes: 0 },
    ],
    'in-progress': [{ title: 'Trim hedges', posted: '1 day ago', quotes: 2 }],
    completed: [{ title: 'Roof repair', completed: '1 week ago', rating: 5 }],
  };

  // Expiring documents
  const expiringDocs = [
    { name: 'Gas Safety Certificate', expires: '14 days', action: 'renew' },
    { name: 'EPC Certificate', expires: '90 days', action: 'upload' },
    { name: 'Building Insurance', expires: '30 days', action: 'renew' },
  ];

  // Smart matches data
  const smartMatches = [
    { name: 'ABC Plumbing', rating: 4.8, reviews: 156, specialty: 'Emergency repairs' },
    { name: 'Smith Gas Services', rating: 4.9, reviews: 89, specialty: 'Boiler specialists' },
    { name: 'Local Handyman Co', rating: 4.7, reviews: 203, specialty: 'General maintenance' },
  ];

  const properties = ['23 Oakfield Rd, SW12 8JD', '4 Maple Cottage, BN20 7HH'];

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
                  src="/lovable-uploads/326dc7e2-73e1-4176-b502-1deaed02919b.png"
                  alt="Property at 23 Oakfield Road"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white transition-colors flex items-center space-x-2">
                    <Camera className="w-4 h-4" strokeWidth={1} />
                    <span>Upload New Photo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 h-64 flex flex-col justify-center">
                <div>
                  <h1 className="text-2xl font-semibold text-black mb-3">{propertyDetails.address}</h1>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-4">Property Details:</h3>
                    <div className="space-y-2 text-sm text-black">
                      <div>• {propertyDetails.type}</div>
                      <div>
                        • {propertyDetails.bedrooms} bed, {propertyDetails.bathrooms} bath
                      </div>
                      <div>
                        • Moved in: {propertyDetails.moveInDate} ({propertyDetails.yearsAtProperty} years)
                      </div>
                      <div>• Previous: {propertyDetails.previousAddress}</div>
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
                    <TrendingUp className="w-4 h-4 text-gray-400" strokeWidth={1} />
                  </div>

                  <div className="text-2xl font-semibold text-black mb-4">£{propertyDetails.currentValue.toLocaleString()}</div>
                  <div className="text-sm text-green-600 mb-1 font-medium">+{propertyDetails.yearOnYearChange}% YoY</div>
                  <div className="text-sm text-gray-600">
                    +£{Math.round(propertyDetails.currentValue * (propertyDetails.yearOnYearChange / 100)).toLocaleString()}
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
                    <h3 className="font-medium text-black text-sm">Gas Safety</h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={1} />
                    <span className="text-xs text-green-600 font-medium">Valid</span>
                  </div>
                  <div className="text-xs text-gray-600">Expires in 264 days</div>
                </div>

                {/* EICR Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="w-4 h-4 text-gray-600" strokeWidth={1} />
                    <h3 className="font-medium text-black text-sm">EICR</h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={1} />
                    <span className="text-xs text-green-600 font-medium">Valid</span>
                  </div>
                  <div className="text-xs text-gray-600">Expires in 1,642 days</div>
                </div>

                {/* EPC Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileCheck className="w-4 h-4 text-gray-600" strokeWidth={1} />
                    <h3 className="font-medium text-black text-sm">EPC</h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={1} />
                    <span className="text-xs text-green-600 font-medium">Rating B</span>
                  </div>
                  <div className="text-xs text-gray-600">Expires in 2,856 days</div>
                </div>

                {/* Insurance Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-4 h-4 text-gray-600" strokeWidth={1} />
                    <h3 className="font-medium text-black text-sm">Insurance</h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500" strokeWidth={1} />
                    <span className="text-xs text-orange-600 font-medium">Expires soon</span>
                  </div>
                  <div className="text-xs text-gray-600">Renewal in 30 days</div>
                </div>

                {/* Boiler Service Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Flame className="w-4 h-4 text-gray-600" strokeWidth={1} />
                    <h3 className="font-medium text-black text-sm">Boiler Service</h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" strokeWidth={1} />
                    <span className="text-xs text-red-600 font-medium">46 days overdue</span>
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
                <h3 className="font-semibold text-black">{format(currentDate, 'MMMM yyyy').toUpperCase()}</h3>
              </div>

              <div className="flex-1">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-8">
                  {/* Empty cells for days before month start */}
                  {Array.from({ length: (getDay(monthStart) + 6) % 7 }, (_, i) => (
                    <div key={`empty-${i}`} className="h-10"></div>
                  ))}

                  {/* Month days */}
                  {monthDays.map(day => {
                    const dayNumber = day.getDate();
                    const eventStatus = calendarEvents[dayNumber];
                    const isCurrentDay = isToday(day);

                    return (
                      <div
                        key={dayNumber}
                        className={`relative h-10 flex items-center justify-center text-sm cursor-pointer hover:bg-gray-50 rounded ${
                          isCurrentDay ? 'bg-yellow-400 text-black font-semibold' : 'text-gray-900'
                        }`}
                      >
                        {dayNumber}
                        {eventStatus && (
                          <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${getDotColor(eventStatus)}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="space-y-2 mb-4">
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
                  <h4 className="text-sm font-medium text-red-600 mb-3">Overdue</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Flame className="w-4 h-4 text-red-600" strokeWidth={1} />
                        <div>
                          <span className="text-sm font-medium text-black">Boiler service</span>
                          <p className="text-xs text-gray-600">2 days overdue</p>
                        </div>
                      </div>
                      <button className="bg-red-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm">
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>

                {/* This Week Tasks */}
                <div>
                  <h4 className="text-sm font-medium text-yellow-600 mb-3">Due This Week</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-4 h-4 text-yellow-600" strokeWidth={1} />
                        <div>
                          <span className="text-sm font-medium text-black">Smoke/CO alarm test</span>
                          <p className="text-xs text-gray-600">Due in 5 days</p>
                        </div>
                      </div>
                      <button className="bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                        Mark Done
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Home className="w-4 h-4 text-yellow-600" strokeWidth={1} />
                        <div>
                          <span className="text-sm font-medium text-black">Gutter clean</span>
                          <p className="text-xs text-gray-600">Due in 6 days</p>
                        </div>
                      </div>
                      <button className="bg-primary text-black font-medium py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors text-sm">
                        Get Quotes
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scheduled Tasks */}
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-3">Scheduled</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Wrench className="w-4 h-4 text-green-600" strokeWidth={1} />
                        <div>
                          <span className="text-sm font-medium text-black">Window cleaning</span>
                          <p className="text-xs text-gray-600">Confirmed for Tuesday</p>
                        </div>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Confirmed</span>
                    </div>
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
            <h2 className="text-xl font-semibold text-black mb-6 text-center">KNOWLEDGE CENTRE</h2>

            <div className="grid grid-cols-3 gap-6">
              {/* MAINTENANCE GUIDES */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col">
                <div className="flex items-center space-x-2 mb-6">
                  <Wrench className="w-5 h-5 text-gray-600" strokeWidth={1} />
                  <h3 className="font-semibold text-black">MAINTENANCE GUIDES</h3>
                </div>

                <div className="flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">Boiler Servicing</h4>
                        <p className="text-xs text-gray-600">When & why you need annual checks</p>
                      </div>
                      <button className="bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded-lg hover:bg-gray-200 transition-colors text-xs">
                        Read Guide
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">Insurance Basics</h4>
                        <p className="text-xs text-gray-600">What coverage you really need</p>
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
                  <TrendingUp className="w-5 h-5 text-gray-600" strokeWidth={1} />
                  <h3 className="font-semibold text-black">VALUE YOUR HOME</h3>
                </div>

                <div className="flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">Add Value Tips</h4>
                        <p className="text-xs text-gray-600">Top 10 improvements that add £5k+</p>
                      </div>
                      <button className="bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded-lg hover:bg-gray-200 transition-colors text-xs">
                        Learn More
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">EPC Improvements</h4>
                        <p className="text-xs text-gray-600">Get from C to B rating guide</p>
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
                        <h4 className="text-sm font-medium text-black mb-2">Winter Prep Guide</h4>
                        <p className="text-xs text-gray-600">Protect pipes, gutters & heating</p>
                      </div>
                      <button className="bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded-lg hover:bg-gray-200 transition-colors text-xs">
                        Add Checklist
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">Spring Tasks</h4>
                        <p className="text-xs text-gray-600">Garden, roof & exterior checks</p>
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
                <h3 className="font-semibold text-black">Smart Matches for Boiler Service</h3>
                <button onClick={() => setShowSmartMatches(false)} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                {smartMatches.map((match, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="font-medium text-black mb-1">{match.name}</div>
                    <div className="text-sm text-gray-600 mb-2">{match.specialty}</div>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="text-sm font-medium">{match.rating}★</div>
                      <div className="text-sm text-gray-600">({match.reviews} reviews)</div>
                    </div>
                    <button className="text-sm text-primary hover:underline">Swap for different trade</button>
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
                className="bg-primary text-black font-medium py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors"
              >
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
