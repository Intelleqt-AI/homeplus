import { Building2, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fmtDay } from '@/components/dashboard/CertificateRow';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usageLabel } from '@/lib/account';
import type { PortfolioStatus } from '@/lib/Api2';

const STATUS: Record<PortfolioStatus, { label: string; chip: string }> = {
  overdue: { label: 'Overdue', chip: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
  due_soon: { label: 'Due in 30 days', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  up_to_date: { label: 'All up to date', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  // A let home outside England with nothing tracked yet: we cannot say it is up to date.
  check_local_rules: { label: 'Add your own dates', chip: 'bg-muted text-muted-foreground' },
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The summary line: "3 properties · 1 overdue · 2 due in the next 30 days". */
export const summaryLine = (s: { properties: number; overdue: number; due_30: number }) =>
  `${plural(s.properties, 'property', 'properties')} · ${s.overdue} overdue · ${s.due_30} due in the next 30 days`;

/**
 * The landlord's "All properties" view: a card per property with its status and next due item.
 * Tapping a property opens that property's own dashboard.
 */
const PortfolioOverview = () => {
  const { data, isLoading, isError, refetch } = usePortfolio();
  const { setActivePropertyId } = useActiveProperty();

  return (
    <section className="space-y-4" data-section="portfolio">
      <div className="bg-card rounded-[18px] border border-border p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Your properties</p>
        {isLoading ? (
          <div className="mt-2 h-6 w-64 max-w-full animate-pulse rounded bg-muted" />
        ) : data ? (
          <h1 className="mt-1 text-[18px] xs:text-[20px] font-bold tracking-tight text-foreground" data-summary>
            {summaryLine(data.summary)}
          </h1>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map(i => <div key={i} className="h-28 animate-pulse rounded-[18px] border border-border bg-card" />)}
        </div>
      ) : isError || !data ? (
        <div className="bg-card rounded-[18px] border border-border p-5 text-sm text-muted-foreground flex items-center justify-between gap-3">
          Could not load your properties.
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.items.map(item => {
            const s = STATUS[item.status];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActivePropertyId(item.id)}
                  data-portfolio-item={item.nickname}
                  data-status={item.status}
                  className="group w-full text-left bg-card rounded-[18px] border border-border p-4 sm:p-5 hover:shadow-md transition-shadow flex items-start gap-3"
                >
                  <div className="h-10 w-10 shrink-0 bg-muted rounded-full flex items-center justify-center">
                    <Building2 className="w-[18px] h-[18px] text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold text-foreground truncate max-w-full">{item.nickname}</p>
                      <span className={cn('text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', s.chip)} data-chip>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{usageLabel(item.usage)}</p>
                    <p className="text-[13px] text-foreground mt-2" data-next-due>
                      {item.next_due ? `${item.next_due.title}: ${fmtDay(item.next_due.date)}` : 'Nothing due'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 mt-1 text-muted-foreground group-hover:text-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default PortfolioOverview;
