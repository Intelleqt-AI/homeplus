import { HelpCircle, BookOpen, CheckCircle, Home, FileText, Search, Calendar, Shield } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section - Dashboard Style */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[#6B6B6B] text-sm mb-0.5">Learn the basics</p>
                <h1 className="text-[#1A1A1A] text-2xl font-semibold">How It Works</h1>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Documents</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#1A1A1A] text-sm font-medium">Store & organize</p>
              <p className="text-[#8B8B8B] text-xs mt-1">All your home docs</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Tasks</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#1A1A1A] text-sm font-medium">Track & remind</p>
              <p className="text-[#8B8B8B] text-xs mt-1">Never miss a deadline</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Find a Trade</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <Search className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#1A1A1A] text-sm font-medium">Get quotes</p>
              <p className="text-[#8B8B8B] text-xs mt-1">Local tradespeople</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Compliance</span>
                <div className="h-8 w-8 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#10B981]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#10B981] text-sm font-medium">Stay compliant</p>
              <p className="text-[#8B8B8B] text-xs mt-1">UK regulations</p>
            </div>
          </div>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Main Content (3 columns wide) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Getting Started Section */}
            <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                  <Home className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                </div>
                <h2 className="text-[#1A1A1A] text-lg font-semibold">Getting Started</h2>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-[#6B6B6B]">
                  Welcome to Home+! Here's how to get the most out of managing your home.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#F5F5F0] rounded-[12px] p-5">
                    <div className="h-10 w-10 bg-[#FEF9E7] rounded-full flex items-center justify-center mb-3">
                      <span className="text-[#FBBF24] font-semibold">1</span>
                    </div>
                    <h4 className="text-[#1A1A1A] text-sm font-medium mb-2">Upload Documents</h4>
                    <p className="text-[#6B6B6B] text-xs">Start by uploading important home documents like insurance, warranties, and certificates.</p>
                  </div>

                  <div className="bg-[#F5F5F0] rounded-[12px] p-5">
                    <div className="h-10 w-10 bg-[#FEF9E7] rounded-full flex items-center justify-center mb-3">
                      <span className="text-[#FBBF24] font-semibold">2</span>
                    </div>
                    <h4 className="text-[#1A1A1A] text-sm font-medium mb-2">Set Up Reminders</h4>
                    <p className="text-[#6B6B6B] text-xs">Create tasks and reminders for maintenance, renewals, and important deadlines.</p>
                  </div>

                  <div className="bg-[#F5F5F0] rounded-[12px] p-5">
                    <div className="h-10 w-10 bg-[#FEF9E7] rounded-full flex items-center justify-center mb-3">
                      <span className="text-[#FBBF24] font-semibold">3</span>
                    </div>
                    <h4 className="text-[#1A1A1A] text-sm font-medium mb-2">Find Tradespeople</h4>
                    <p className="text-[#6B6B6B] text-xs">Post jobs and receive quotes from verified local professionals when you need work done.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Overview Section */}
            <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                </div>
                <h2 className="text-[#1A1A1A] text-lg font-semibold">Features Overview</h2>
              </div>
              <div className="space-y-3">
                <div className="bg-[#F5F5F0] rounded-[12px] px-5 py-4 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#4A4A4A]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[#1A1A1A] text-sm font-medium">Document Storage</h4>
                    <p className="text-[#6B6B6B] text-xs mt-1">Safely store all your home-related documents in one place. Organize by category, track expiry dates, and export when needed.</p>
                  </div>
                </div>

                <div className="bg-[#F5F5F0] rounded-[12px] px-5 py-4 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[#4A4A4A]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[#1A1A1A] text-sm font-medium">Task Management</h4>
                    <p className="text-[#6B6B6B] text-xs mt-1">Keep track of maintenance tasks, set reminders for important dates, and never miss a renewal or service deadline again.</p>
                  </div>
                </div>

                <div className="bg-[#F5F5F0] rounded-[12px] px-5 py-4 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                    <Search className="w-5 h-5 text-[#4A4A4A]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[#1A1A1A] text-sm font-medium">Find a Trade</h4>
                    <p className="text-[#6B6B6B] text-xs mt-1">Post jobs and receive competitive quotes from verified local tradespeople. Compare prices and reviews to find the right professional.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Links Panel */}
          <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[#1A1A1A] text-lg font-semibold">Quick Links</h3>
              </div>
            </div>

            <div className="space-y-3">
              <Link to="/dashboard/documents" className="block bg-[#F5F5F0] rounded-[12px] p-4 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#FBBF24]" />
                  <span className="text-[#1A1A1A] text-sm font-medium">Go to Documents</span>
                </div>
              </Link>

              <Link to="/dashboard/calendar" className="block bg-[#F5F5F0] rounded-[12px] p-4 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#FBBF24]" />
                  <span className="text-[#1A1A1A] text-sm font-medium">Go to Tasks</span>
                </div>
              </Link>

              <Link to="/dashboard/job-leads" className="block bg-[#F5F5F0] rounded-[12px] p-4 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-[#FBBF24]" />
                  <span className="text-[#1A1A1A] text-sm font-medium">Find a Trade</span>
                </div>
              </Link>

              <Link to="/dashboard/settings" className="block bg-[#F5F5F0] rounded-[12px] p-4 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-[#FBBF24]" />
                  <span className="text-[#1A1A1A] text-sm font-medium">Settings</span>
                </div>
              </Link>
            </div>

            {/* FAQ Section */}
            <div className="mt-6 pt-6 border-t border-[#E8E8E3]">
              <h4 className="text-[#1A1A1A] text-sm font-medium mb-3">Frequently Asked</h4>
              <div className="space-y-2">
                <p className="text-[#6B6B6B] text-xs">How do I upload documents?</p>
                <p className="text-[#6B6B6B] text-xs">How do I set reminders?</p>
                <p className="text-[#6B6B6B] text-xs">How do I find a tradesperson?</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HowItWorks;
