import { Link } from 'react-router-dom';

// ── Reusable empty state ───────────────────────────────────────────────────────
// One consistent "what / why / what-next + single CTA" block for the dashboard's
// zero-data cards. Distilled from the two good inline patterns that already lived
// in HomePlusDashboard (the "Post a job" centred card + the green "all caught up").

type EmptyStateTone = 'neutral' | 'amber' | 'green';

type EmptyStateProps = {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
  href?: string;                 // use instead of onCta to navigate
  tone?: EmptyStateTone;         // icon-chip colour, default 'neutral'
  align?: 'center' | 'left';     // default 'center'
};

const CHIP: Record<EmptyStateTone, { bg: string; fg: string }> = {
  neutral: { bg: '#F5F5F0', fg: '#8B8B8B' },
  amber: { bg: '#FBBF24', fg: '#1A1A1A' },
  green: { bg: '#ECFDF5', fg: '#10B981' },
};

export default function EmptyState({
  icon: Icon, title, subtitle, ctaLabel, onCta, href, tone = 'neutral', align = 'center',
}: EmptyStateProps) {
  const chip = CHIP[tone];

  if (align === 'left') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[#FAFAF7] border border-[#E8E8E3]">
        <span className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: chip.bg, color: chip.fg }}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#1A1A1A]">{title}</p>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5 leading-snug">{subtitle}</p>
        </div>
        {ctaLabel && (href ? (
          <Link to={href}
            className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-[#4A4A4A] hover:bg-[#F5F5F0] transition-colors whitespace-nowrap">
            {ctaLabel}
          </Link>
        ) : (
          <button type="button" onClick={onCta}
            className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-[#4A4A4A] hover:bg-[#F5F5F0] transition-colors whitespace-nowrap">
            {ctaLabel}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-6">
      <div className="h-9 w-9 rounded-[10px] flex items-center justify-center mb-2"
        style={{ background: chip.bg, color: chip.fg }}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-[13px] font-semibold text-[#1A1A1A]">{title}</p>
      <p className="text-[11px] text-[#6B6B6B] mt-0.5 max-w-[260px] leading-snug">{subtitle}</p>
      {ctaLabel && (href ? (
        <Link to={href}
          className="mt-3 inline-block text-xs font-semibold px-3.5 py-2 rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors">
          {ctaLabel}
        </Link>
      ) : (
        <button type="button" onClick={onCta}
          className="mt-3 text-xs font-semibold px-3.5 py-2 rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors">
          {ctaLabel}
        </button>
      ))}
    </div>
  );
}
