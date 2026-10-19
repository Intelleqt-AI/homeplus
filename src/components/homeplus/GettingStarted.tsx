import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Sparkles, X } from 'lucide-react';

// ── First-run "Getting started" checklist ──────────────────────────────────────
// A short, gamified setup checklist shown only to new/under-populated users. Data
// is derived in HomePlusDashboard and passed in as `steps`, keeping this pure.
// Endowed progress: the property step is pre-completed (done at sign-up), so a new
// user lands on "1 of 5 done · 20%" rather than an empty 0%.
// Styled only with theme tokens (accent, primary, success, border, muted), so it
// follows the light and dark themes like the rest of the dashboard.

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

const RING = 56;
const RING_STROKE = 5;
const RING_RADIUS = (RING - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** Circular progress with "done/total" in the middle. */
function ProgressRing({ done, total, pct }: { done: number; total: number; pct: number }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: RING, height: RING }}
      role="progressbar"
      aria-label="Setup progress"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
    >
      <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} className="-rotate-90">
        <circle cx={RING / 2} cy={RING / 2} r={RING_RADIUS} fill="none" strokeWidth={RING_STROKE} className="stroke-border" />
        <circle
          cx={RING / 2} cy={RING / 2} r={RING_RADIUS} fill="none" strokeWidth={RING_STROKE} strokeLinecap="round"
          className="stroke-accent transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - pct / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-foreground tabular-nums">
        {done}/{total}
      </span>
    </div>
  );
}

/** One pill per step: done = solid accent, next = soft accent, later = muted. */
function SegmentedBar({ steps, nextIndex }: { steps: GsStep[]; nextIndex: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {steps.map((s, i) => (
        <span
          key={s.id}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
            s.done ? 'bg-accent' : i === nextIndex ? 'bg-accent/40' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );
}

const COLLAPSED_KEY = 'hp_gs_collapsed';
const readCollapsed = () => {
  try { return localStorage.getItem(COLLAPSED_KEY) === '1'; } catch { return false; }
};

export default function GettingStarted({ firstName, steps, onDismiss }: GettingStartedProps) {
  // The chevron folds the card down to its header (remembered in this browser).
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggle = () => {
    setCollapsed(c => {
      try { localStorage.setItem(COLLAPSED_KEY, c ? '0' : '1'); } catch { /* ignore */ }
      return !c;
    });
  };
  const total = steps.length;
  const completed = steps.filter(s => s.done).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const allDone = completed === total;
  const left = total - completed;
  const nextIndex = steps.findIndex(s => !s.done);

  return (
    <div className="rounded-[18px] border border-border bg-card shadow-soft overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-4 sm:p-5">
        {/* The whole header row folds/unfolds the card (the chevron is the keyboard control). */}
        <div className="flex items-center gap-3 sm:gap-4 cursor-pointer select-none" onClick={toggle}>
          <ProgressRing done={completed} total={total} pct={pct} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" /> Getting started
            </p>
            <p className="text-[15px] sm:text-[16px] font-bold text-foreground leading-tight mt-0.5">
              {allDone ? <>You&apos;re all set, {firstName}! 🎉</> : <>{firstName}, let&apos;s get your home set up</>}
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {allDone ? 'All steps done · 100% complete' : `${left} step${left === 1 ? '' : 's'} left · ${pct}% complete`}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); toggle(); }}
            aria-expanded={!collapsed}
            aria-controls="getting-started-steps"
            aria-label={collapsed ? 'Show setup steps' : 'Hide setup steps'}
            className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />
          </button>
          {/* Only once everything is done can the card be removed; until then it can only fold. */}
          {allDone && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onDismiss(); }}
              aria-label="Remove getting started"
              className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          </div>
        </div>
        {!collapsed && (
          <div className="mt-4">
            <SegmentedBar steps={steps} nextIndex={nextIndex} />
          </div>
        )}
      </div>

      {/* Steps */}
      {!collapsed && (
      <ul id="getting-started-steps" className="divide-y divide-border px-2 sm:px-3 pb-1">
        {steps.map((s, i) => {
          const isNext = i === nextIndex;
          const Icon = s.icon;
          const ctaBase = 'shrink-0 ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full whitespace-nowrap transition-colors';
          const ctaClass = isNext
            ? `${ctaBase} bg-primary text-primary-foreground hover:bg-primary/90`
            : `${ctaBase} border border-border bg-card text-foreground hover:bg-muted`;
          const ctaInner = (
            <>
              {s.ctaLabel}
              {isNext && <ArrowRight className="w-3.5 h-3.5" />}
            </>
          );
          return (
            <li key={s.id} className="py-3">
              <div className={`flex flex-wrap items-center gap-3 rounded-[12px] px-2 py-1.5 ${isNext ? 'bg-accent/10' : ''}`}>
                <span
                  className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    s.done
                      ? 'bg-success/15 text-success'
                      : isNext
                        ? 'bg-accent text-accent-foreground ring-4 ring-accent/25'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.done ? <Check className="w-4 h-4" strokeWidth={3} /> : <Icon className="w-4 h-4" />}
                </span>
                <div className="flex-1 min-w-[160px]">
                  {isNext && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-foreground/70 mb-0.5">Next up</p>
                  )}
                  <p className={`text-[13.5px] font-semibold leading-snug ${s.done ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {s.title}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">{s.helper}</p>
                </div>
                {s.done ? (
                  <span className="shrink-0 ml-auto inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success">
                    <Check className="w-3 h-3" strokeWidth={3} /> Done
                  </span>
                ) : s.href ? (
                  <Link to={s.href} className={ctaClass}>{ctaInner}</Link>
                ) : (
                  <button type="button" onClick={s.onCta} className={ctaClass}>{ctaInner}</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
}
