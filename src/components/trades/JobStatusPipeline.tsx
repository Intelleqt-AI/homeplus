import { CheckCircle, Clock, MessageSquare, Play, Star } from 'lucide-react';

type PipelineStage = 'posted' | 'quotes_received' | 'accepted' | 'in_progress' | 'completed';

interface JobStatusPipelineProps {
  currentStage: PipelineStage;
}

const STAGES: { id: PipelineStage; label: string; icon: typeof Clock }[] = [
  { id: 'posted', label: 'Posted', icon: Clock },
  { id: 'quotes_received', label: 'Quotes', icon: MessageSquare },
  { id: 'accepted', label: 'Accepted', icon: CheckCircle },
  { id: 'in_progress', label: 'In Progress', icon: Play },
  { id: 'completed', label: 'Completed', icon: Star },
];

const JobStatusPipeline = ({ currentStage }: JobStatusPipelineProps) => {
  const currentIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="flex items-center gap-1 w-full">
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const StageIcon = stage.icon;

        return (
          <div key={stage.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-[#FBBF24] text-[#1A1A1A]'
                    : 'bg-[#F0F0F0] text-[#9CA3AF]'
                }`}
              >
                <StageIcon className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <span
                className={`text-[9px] mt-1 font-medium ${
                  isCompleted ? 'text-emerald-600' : isCurrent ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'
                }`}
              >
                {stage.label}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div
                className={`h-0.5 flex-1 -mt-3 ${
                  idx < currentIndex ? 'bg-emerald-500' : 'bg-[#E8E8E3]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default JobStatusPipeline;

export const getJobPipelineStage = (job: { isApproved?: boolean; bids?: unknown[] }): PipelineStage => {
  if (job.isApproved) return 'completed';
  if (job.bids && job.bids.length > 0) {
    const anyAccepted = (job.bids as Array<{ status?: string }>).some(b => b.status === 'accepted');
    if (anyAccepted) return 'accepted';
    return 'quotes_received';
  }
  return 'posted';
};
