import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashEvent } from './dashboardTypes';
import { computeStatus, getDotColor } from './dashboardHelpers';

interface DashboardCalendarProps {
  events: DashEvent[];
}

const DashboardCalendar = ({ events }: DashboardCalendarProps) => {
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="bg-white lg:col-span-2 rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
      <div className="flex items-center mb-6 justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-[#1A1A1A] text-lg font-semibold">Your Schedule</h3>
            <p className="text-[#6B6B6B] text-sm">Plan ahead and stay organized</p>
          </div>
        </div>
        <Link to="/dashboard/calendar">
          <Button
            variant="outline"
            className="text-[#1A1A1A] hover:bg-[#F5F5F0] border border-[#E8E8E3] text-sm font-medium h-10 px-4 rounded-full"
          >
            View Calendar
          </Button>
        </Link>
      </div>

      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] p-6">
        {/* Month Header */}
        <div className="flex items-center justify-center mb-5">
          <h3 className="text-[18px] font-semibold text-[#1F2937]">{format(currentDate, 'MMMM yyyy')}</h3>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-[13px] font-medium text-[#9CA3AF] py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: (getDay(monthStart) + 6) % 7 }, (_, i) => (
            <div key={`empty-${i}`} className="h-14"></div>
          ))}

          {monthDays.map(day => {
            const dayNumber = day.getDate();
            const isCurrentDay = isToday(day);
            const eventsForDay = events.filter(ev => ev.date && ev.date.toDateString() === day.toDateString());

            let dotStatus: string | null = null;
            if (eventsForDay.some(e => computeStatus(e.date) === 'overdue')) dotStatus = 'overdue';
            else if (eventsForDay.some(e => computeStatus(e.date) === 'due-week')) dotStatus = 'due-week';
            else if (eventsForDay.some(e => computeStatus(e.date) === 'confirmed')) dotStatus = 'confirmed';
            else if (eventsForDay.length) dotStatus = 'future';

            return (
              <div
                key={dayNumber}
                className={`relative h-12 flex flex-col items-center justify-center text-[13px] cursor-pointer rounded-[10px] transition-all ${
                  isCurrentDay
                    ? 'bg-[#FBBF24] text-[#1A1A1A] font-semibold'
                    : eventsForDay.length > 0
                    ? 'bg-[#FEF9E7] text-[#1A1A1A] hover:bg-[#FEF3C7]'
                    : 'text-[#4B5563] hover:bg-[#F5F5F0]'
                }`}
              >
                <span>{dayNumber}</span>
                {dotStatus && (
                  <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${getDotColor(dotStatus)}`}></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6 pt-4 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#F87171] rounded-full"></div>
            <span className="text-xs text-[#9CA3AF]">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#FBBF24] rounded-full"></div>
            <span className="text-xs text-[#9CA3AF]">Due Soon</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#34D399] rounded-full"></div>
            <span className="text-xs text-[#9CA3AF]">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#D1D5DB] rounded-full"></div>
            <span className="text-xs text-[#9CA3AF]">Future</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCalendar;
