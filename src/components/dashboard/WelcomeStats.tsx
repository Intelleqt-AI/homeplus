import { Link, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, CheckCircle, Clock, FileText, ClipboardList, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeStatsProps {
  userName: string;
  eventCount: number;
}

const WelcomeStats = ({ userName, eventCount }: WelcomeStatsProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#E8E8E3]">
      {/* Top row: Property Info and Quick Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-[#F5F5F0] rounded-full flex items-center justify-center">
            <Home className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[#6B6B6B] text-sm mb-0.5">Welcome back</p>
            <h1 className="text-[#1A1A1A] text-2xl font-semibold">{userName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/dashboard/calendar">
            <Button
              variant="outline"
              className="text-[#1A1A1A] hover:bg-[#F5F5F0] border border-[#E8E8E3] bg-white transition-all text-sm font-medium h-10 px-4 rounded-full"
            >
              Get started
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#6B6B6B] text-sm">Saved Documents</span>
            <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[#1A1A1A] text-2xl font-semibold">12</p>
          <p className="text-[#8B8B8B] text-xs mt-1">Stored safely</p>
        </div>

        <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#6B6B6B] text-sm">Next two weeks</span>
            <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[#1A1A1A] text-2xl font-semibold">5</p>
          <p className="text-[#8B8B8B] text-xs mt-1">Tasks and reminders</p>
        </div>

        <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#6B6B6B] text-sm">Next 6 weeks</span>
            <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[#1A1A1A] text-2xl font-semibold">{eventCount}</p>
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
  );
};

export default WelcomeStats;
