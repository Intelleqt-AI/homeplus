import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Wrench, TreePine, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentSeasonTemplates, SEASON_CONFIG, type MaintenanceTemplate } from '@/lib/maintenanceTemplates';

const DIFFICULTY_CONFIG = {
  easy: { label: 'DIY', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  medium: { label: 'DIY / Trade', color: 'text-amber-600', bg: 'bg-amber-50' },
  professional: { label: 'Trade Required', color: 'text-red-600', bg: 'bg-red-50' },
};

const SeasonalReminders = () => {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const templates = getCurrentSeasonTemplates();
  const month = new Date().getMonth();
  let seasonKey: keyof typeof SEASON_CONFIG;
  if (month >= 2 && month <= 4) seasonKey = 'spring';
  else if (month >= 5 && month <= 7) seasonKey = 'summer';
  else if (month >= 8 && month <= 10) seasonKey = 'autumn';
  else seasonKey = 'winter';

  const season = SEASON_CONFIG[seasonKey];

  const toggleComplete = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedCount = completedIds.size;
  const totalCount = templates.length;

  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#E8E8E3]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
            <TreePine className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-[#1A1A1A] text-lg font-semibold">
              {season.label} Maintenance
            </h3>
            <p className="text-[#6B6B6B] text-sm">
              {season.months} · {completedCount}/{totalCount} completed
            </p>
          </div>
        </div>
        <Link to="/dashboard/settings">
          <Button variant="outline" className="text-sm h-9 px-4 rounded-full border-[#E8E8E3]">
            Manage Templates
          </Button>
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FBBF24] rounded-full transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map(template => {
          const isComplete = completedIds.has(template.id);
          const difficulty = DIFFICULTY_CONFIG[template.diyDifficulty];

          return (
            <div
              key={template.id}
              className={`rounded-[12px] p-4 border transition-all cursor-pointer ${
                isComplete
                  ? 'bg-[#F0FDF4] border-emerald-200 opacity-75'
                  : 'bg-[#FAFAFA] border-[#F0F0F0] hover:bg-[#F5F5F0]'
              }`}
              onClick={() => toggleComplete(template.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`h-7 w-7 rounded-[8px] flex items-center justify-center ${isComplete ? 'bg-emerald-100' : 'bg-white border border-[#E5E7EB]'}`}>
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Wrench className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  )}
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${difficulty.bg} ${difficulty.color}`}>
                  {difficulty.label}
                </span>
              </div>
              <h4 className={`text-sm font-medium mb-1 ${isComplete ? 'text-emerald-700 line-through' : 'text-[#1A1A1A]'}`}>
                {template.title}
              </h4>
              <p className="text-[#9CA3AF] text-xs line-clamp-2">{template.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[#6B6B6B] text-xs">{template.estimatedCostGBP}</span>
                {template.tradeRequired && (
                  <Link
                    to="/dashboard/job-leads"
                    onClick={e => e.stopPropagation()}
                    className="text-[10px] text-[#FBBF24] hover:text-[#D4A017] font-medium"
                  >
                    Get Quotes
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeasonalReminders;
