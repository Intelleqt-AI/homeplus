import { Activity, FileText, CheckCircle, Bell } from 'lucide-react';

const RecentActivity = () => {
  return (
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

      <div className="grid grid-cols-3 gap-4">
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
    </div>
  );
};

export default RecentActivity;
