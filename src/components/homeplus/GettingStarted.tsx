import { Link } from 'react-router-dom';
import { CheckCircle, X, Sparkles } from 'lucide-react';

// ── First-run "Getting started" checklist ──────────────────────────────────────
// A short, gamified setup checklist shown only to new/under-populated users. Data
// is derived in HomePlusDashboard and passed in as `steps`, keeping this pure.
// Endowed progress: the property step is pre-completed (done at sign-up), so a new
// user lands on "1 of 5 done · 20%" rather than an empty 0%.

export type GsStep = {
  id: string;
  title: string;
  helper: string;
  done: boolean;
  ctaLabel: string;
  onCta?: () => void;
  href?: string;            // use instead of onCta to navigate
  icon: React.ElementType;
};

type GettingStartedProps = {
  firstName: string;
  steps: GsStep[];
  onDismiss: () => void;
};

export default function GettingStarted({ firstName, steps, onDismiss }: GettingStartedProps) {
  const total = steps.length;
  const completed = steps.filter(s => s.done).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const allDone = completed === total;

  if (allDone) {
    return (
      <div className="rounded-[18px] border border-[#A7F3D0] bg-gradient-to-b from-[#ECFDF5] to-white p-5">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-[12px] bg-white text-[#10B981] flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#1A1A1A] leading-tight">You're all set, {firstName}! 🎉</p>
            <p className="text-[12px] text-[#4A4A4A] mt-0.5">Your home hub is ready — we'll keep it humming.</p>
          </div>
          <button type="button" onClick={onDismiss}
            className="shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-[#FDE68A] bg-gradient-to-b from-[#FFFBEB] to-white p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0 text-[#1A1A1A]"
            style={{ background: 'linear-gradient(135deg,#FBBF24,#FFD96B)' }}>
            <Sparkles className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#1A1A1A] leading-tight">{firstName}, let's get your home set up</p>
            <p className="text-[12px] text-[#6B6B6B] mt-0.5">{completed} of {total} done · {pct}%</p>
          </div>
        </div>
        <button type="button" onClick={onDismiss} aria-label="Dismiss getting started"
          className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[#8B8B8B] hover:bg-[#F5F5F0] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#EEEEEA] rounded-full overflow-hidden mt-3.5">
        <div className="h-full bg-[#FBBF24] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-2 mt-4">
        {steps.map(s => {
          const Icon = s.done ? CheckCircle : s.icon;
          return (
            <div key={s.id}
              className={`flex items-center gap-3 p-3 rounded-[12px] border transition-colors ${s.done ? 'bg-[#ECFDF5] border-[#A7F3D0]/70' : 'bg-white border-[#E8E8E3]'}`}>
              <span className={`h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0 ${s.done ? 'bg-white text-[#10B981]' : 'bg-[#F5F5F0] text-[#1A1A1A]'}`}>
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-semibold ${s.done ? 'text-[#6B6B6B]' : 'text-[#1A1A1A]'}`}>{s.title}</p>
                <p className="text-[11px] text-[#8B8B8B] mt-0.5 leading-snug">{s.helper}</p>
              </div>
              {s.done ? (
                <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white text-[#10B981] border border-[#A7F3D0]/70">Done</span>
              ) : s.href ? (
                <Link to={s.href}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors whitespace-nowrap">
                  {s.ctaLabel}
                </Link>
              ) : (
                <button type="button" onClick={s.onCta}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors whitespace-nowrap">
                  {s.ctaLabel}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
