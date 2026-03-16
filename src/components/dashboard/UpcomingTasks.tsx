import { Link, useNavigate } from 'react-router-dom';
import { Clock, ClipboardList } from 'lucide-react';

interface TaskItem {
  id?: string;
  title?: string;
  date?: string | Date;
  eventType?: string;
}

interface UpcomingTasksProps {
  tasks: TaskItem[];
  totalCount: number;
}

const UpcomingTasks = ({ tasks, totalCount }: UpcomingTasksProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white lg:col-span-1 rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
          </div>
          <h3 className="text-[#1A1A1A] text-lg font-semibold">Upcoming tasks and reminders</h3>
        </div>
      </div>
      <p className="text-[#6B6B6B] text-sm mb-4">Next 3 items</p>

      <div className="space-y-3">
        {tasks.slice(0, 3).map((item, idx) => {
          const dueDate = new Date(item?.date as string);
          const today = new Date();
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
              onClick={() => navigate('/dashboard/calendar')}
            >
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-[8px] flex items-center justify-center bg-white border border-[#E5E7EB]">
                  <Clock size={14} className={urgencyColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#1F2937] text-sm font-medium truncate">{item?.title}</h4>
                  <p className="text-[#9CA3AF] capitalize text-[11px] mt-0.5">{item?.eventType}</p>
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

      {totalCount > 3 && (
        <Link
          to="/dashboard/calendar"
          className="text-[#FBBF24] text-sm mt-4 block text-center hover:text-[#D4A017] transition-colors font-medium"
        >
          View all {totalCount} tasks &rarr;
        </Link>
      )}
    </div>
  );
};

export default UpcomingTasks;
