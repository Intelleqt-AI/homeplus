import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  Star,
  MapPin,
  Clock,
  MessageSquare,
  Heart,
  CheckCircle,
  Info,
  Phone,
  Mail,
  ChevronDown,
  Download,
  Eye,
  Trash2,
  Archive,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const JobDetail = () => {
  const { id } = useParams();
  const [isOtherQuotesOpen, setIsOtherQuotesOpen] = useState(false);

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
    { icon: FileText, label: 'Documents', path: '/dashboard/documents' },
    { icon: Briefcase, label: 'Job Leads', path: '/dashboard/job-leads' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  // Mock job data - approved state
  const job = {
    id: 1,
    title: 'Fix leaking kitchen tap',
    location: 'Clapham, SW12',
    estimateBand: '£80-£120',
    status: 'scheduled' as const,
    description: 'Kitchen tap has been dripping constantly for a week. Need urgent repair. Located under the main kitchen sink.',
    selectedTradeId: 1,
  };

  // Selected trade (approved quote)
  const selectedTrade = {
    tradeId: 1,
    name: 'Swift Plumbing',
    rating: 4.8,
    reviewsCount: 156,
    distanceKm: 0.8,
    verified: true,
    price: 95,
    bookingDate: 'Tomorrow',
    bookingTime: '2:00 PM - 4:00 PM',
    address: '123 High Street, Clapham, SW12 8QR',
    phone: '+44 20 7123 4567',
    email: 'info@swiftplumbing.co.uk',
  };

  // Other quotes (not selected)
  const otherQuotes = [
    {
      tradeId: 2,
      name: 'London Fix Pro',
      rating: 4.6,
      reviewsCount: 89,
      priceMin: 60,
      priceMax: 90,
    },
    {
      tradeId: 3,
      name: 'Expert Plumbers Ltd',
      rating: 4.9,
      reviewsCount: 203,
      priceMin: 100,
      priceMax: 140,
    },
  ];

  // History timeline data
  const history = [
    { time: '2 hours ago', icon: CheckCircle, text: 'quote approved', link: null },
    { time: '3 hours ago', icon: Calendar, text: 'booking set', link: null },
    { time: '1 day ago', icon: Clock, text: 'work completed', link: null },
    { time: '1 day ago', icon: FileText, text: 'invoice uploaded #1023 (£120)', link: null },
    { time: '2 days ago', icon: Star, text: 'review posted ★★★★★', link: null },
  ];

  // Files data
  const files = [
    { id: 1, name: 'before.jpg', type: 'image', size: '2.3 MB' },
    { id: 2, name: 'after.jpg', type: 'image', size: '1.8 MB' },
    { id: 3, name: 'invoice.pdf', type: 'pdf', size: '240 KB' },
    { id: 4, name: 'receipt.jpg', type: 'image', size: '1.2 MB' },
  ];

  const isActive = (path: string) => false; // Since this is a specific job page

  return (
    <div className="min-h-screen bg-gray-50 font-manrope">
      {/* Left Navigation */}
      <nav className="fixed left-0 top-0 h-full w-[72px] bg-white border-r border-gray-200 z-40">
        <div className="flex flex-col h-full">
          <div className="flex-1 pt-6">
            {sidebarItems.map((item, index) => {
              const isActive = item.path === '/dashboard/job-leads'; // Highlight job leads as active
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Link to={item.path} className="block relative">
                      {isActive && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-r"></div>}
                      <div
                        className={`flex items-center justify-center h-12 mx-2 rounded-lg transition-colors ${
                          isActive ? 'bg-primary/10' : 'hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-600'}`} strokeWidth={1} />
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <div className="pb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center h-12 mx-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <HelpCircle className="w-5 h-5 text-gray-600" strokeWidth={1} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Help</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center h-12 mx-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <LogOut className="w-5 h-5 text-gray-600" strokeWidth={1} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Log Out</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="ml-[72px]">
        {/* Top Bar */}
        <header className="sticky top-0 bg-white h-16 border-b border-gray-200 px-6 flex items-center justify-between z-30">
          <div className="font-bold text-xl text-black">Home⁺</div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-10 pl-10 pr-4 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-400 hover:text-primary transition-colors cursor-pointer" strokeWidth={1} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></div>
            </div>
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" strokeWidth={1} />
            </div>
          </div>
        </header>

        {/* Job Content */}
        <main className="max-w-[1200px] mx-auto p-6 space-y-6">
          {/* Job Header (12 cols) */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-black mb-2">{job.title}</h1>
                  <div className="text-gray-600 text-sm flex items-center">
                    <MapPin className="w-4 h-4 mr-1" strokeWidth={1} />
                    {job.location} • {job.estimateBand}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-lg text-sm border ${
                    job.status === 'scheduled'
                      ? 'border-gray-300 text-gray-600'
                      : job.status === 'in progress'
                      ? 'border-primary text-primary'
                      : job.status === 'completed'
                      ? 'border-green-300 text-green-600'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {job.status}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Strip (12 cols) */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <div className="bg-gray-50 rounded-2xl p-6">
                <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">{job.description}</p>
                <button className="text-xs text-gray-500 hover:text-gray-700 mt-2">read more</button>
              </div>
            </div>
          </div>

          {/* Section A - Selected Trade (Pinned) */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                {/* Trade Header */}
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" strokeWidth={1} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-black">{selectedTrade.name}</h3>
                      {selectedTrade.verified && <CheckCircle className="w-4 h-4 text-gray-600" strokeWidth={1} />}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 fill-current text-gray-600" strokeWidth={1} />
                      <span>{selectedTrade.rating}</span>
                      <span className="text-gray-500">({selectedTrade.reviewsCount})</span>
                      <span className="text-gray-400">•</span>
                      <span>{selectedTrade.distanceKm} miles</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <button className="text-xs text-gray-500 hover:text-gray-700 underline">view contract & quote</button>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="mb-6 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Booking</div>
                    <div className="text-black">
                      {selectedTrade.bookingDate} • {selectedTrade.bookingTime}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Address</div>
                    <div className="text-black">{selectedTrade.address}</div>
                  </div>
                  <div className="flex space-x-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" strokeWidth={1} />
                      <span>{selectedTrade.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" strokeWidth={1} />
                      <span>{selectedTrade.email}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="bg-primary text-black font-medium py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" strokeWidth={1} />
                    message
                  </button>
                  <button className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                    reschedule
                  </button>
                  <button className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                    upload invoice
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section B - Other Quotes (Collapsed) */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <Collapsible open={isOtherQuotesOpen} onOpenChange={setIsOtherQuotesOpen}>
                <CollapsibleTrigger className="w-full">
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-black">other quotes ({otherQuotes.length})</h3>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform ${isOtherQuotesOpen ? 'rotate-180' : ''}`}
                        strokeWidth={1}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="space-y-4">
                    {otherQuotes.map(quote => (
                      <div key={quote.tradeId} className="bg-white border border-gray-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" strokeWidth={1} />
                            </div>
                            <div>
                              <div className="font-medium text-black">{quote.name}</div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Star className="w-3 h-3 fill-current" strokeWidth={1} />
                                <span>{quote.rating}</span>
                                <span className="text-gray-500">({quote.reviewsCount})</span>
                                <span className="text-gray-400">•</span>
                                <span>
                                  £{quote.priceMin}–£{quote.priceMax}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="border border-gray-300 text-gray-700 py-1 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                              message
                            </button>
                            <button className="border border-gray-300 text-gray-700 py-1 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                              <Archive className="w-4 h-4" strokeWidth={1} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          {/* Section C - History (Timeline) */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-medium text-black mb-6">history</h3>
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-gray-500" strokeWidth={1} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-500">{item.time}</span>
                          <span className="text-black">{item.text}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section D - Files */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-medium text-black mb-6">files</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {files.map(file => (
                    <div key={file.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-black truncate">{file.name}</div>
                        <div className="flex space-x-1">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Eye className="w-3 h-3 text-gray-500" strokeWidth={1} />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Download className="w-3 h-3 text-gray-500" strokeWidth={1} />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Trash2 className="w-3 h-3 text-gray-500" strokeWidth={1} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {file.type} • {file.size}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Helpers */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <div className="flex items-center justify-center">
                <button className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                  <Info className="w-4 h-4 mr-2" strokeWidth={1} />
                  need help choosing? see how we pick trades
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default JobDetail;
