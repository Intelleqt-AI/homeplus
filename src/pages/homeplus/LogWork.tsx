import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { CalendarDays, CheckCircle, Wrench } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventDetailDialog, { type CalendarEventDetail } from '@/components/event/EventDetailDialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { fetchOpenTasks, type OpenTask } from '@/lib/Api2';

/**
 * "Log work": a home's earlier tasks that are still open, per system. Work is recorded
 * by marking its task completed (no separate "already done" form), so System Health
 * and the calendar count it like any other finished task.
 */

const fmtDate = (iso: string) => {
  try {
    return format(parseISO(iso), 'd MMM yyyy');
  } catch {
    return iso;
  }
};

const dueText = (t: OpenTask) => {
  const days = differenceInCalendarDays(new Date(), parseISO(t.date));
  if (days <= 0) return 'Due today';
  return `${days} day${days === 1 ? '' : 's'} overdue`;
};

const LogWork = () => {
  const [params, setParams] = useSearchParams();
  const system = params.get('system') || '';
  const { activeProperty: property } = useActiveProperty();
  const propertyId = property?.id ?? null;
  // Completing opens the shared event dialog on its "mark complete" step, so work
  // logged here can carry its cost into Annual Spend like anywhere else.
  const [completeTask, setCompleteTask] = useState<CalendarEventDetail | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['open-tasks', propertyId, system],
    queryFn: () => fetchOpenTasks(propertyId, system || null),
    enabled: !!propertyId,
    // Tasks change on the calendar and in Home MOT, so never open on a stale list.
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  const tasks = data?.tasks ?? [];
  const systems = data?.systems ?? [];
  const systemName = systems.find(s => s.key === system)?.name;

  const chooseSystem = (key: string) => setParams(key ? { system: key } : {}, { replace: true });

  return (
    <DashboardLayout>
      <div className="space-y-6 mx-auto w-full max-w-[1100px]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 bg-card rounded-full flex items-center justify-center border border-border">
              <Wrench className="w-5 h-5 text-accent" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-foreground text-xl font-semibold">Log work{systemName ? ` · ${systemName}` : ''}</h1>
              <p className="text-sm text-muted-foreground">
                Done one of these? Mark it completed and it counts as a record.
              </p>
            </div>
          </div>
          <Link to="/dashboard/calendar" className="self-start sm:self-auto shrink-0">
            <Button variant="outline" className="text-sm rounded-full h-10 gap-2">
              <CalendarDays className="w-4 h-4" /> Calendar
            </Button>
          </Link>
        </div>

        {systems.length > 0 && (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="System">
            {[{ key: '', name: 'All systems' }, ...systems].map(s => (
              <button
                key={s.key || 'all'}
                type="button"
                role="tab"
                aria-selected={system === s.key}
                onClick={() => chooseSystem(s.key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors',
                  system === s.key ? 'bg-foreground text-background border-foreground' : 'bg-card text-foreground border-border hover:bg-muted',
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        <div className="bg-card rounded-[20px] border border-border">
          {isLoading || !propertyId ? (
            <div className="p-5 space-y-2">
              {[0, 1, 2].map(i => <div key={i} className="h-14 rounded-[12px] bg-muted animate-pulse" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">
                No unfinished {systemName ? `${systemName.toLowerCase()} ` : ''}tasks
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Everything due so far is done. Plan new work in the{' '}
                <Link to="/dashboard/calendar" className="underline hover:text-foreground">calendar</Link>.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {tasks.map(t => (
                <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3.5">
                  <div className="min-w-[12rem] flex-1">
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2">
                      <span>{fmtDate(t.date)}</span>
                      {!system && <span>· {t.systemName}</span>}
                      <span className={cn(t.overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>· {dueText(t)}</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full gap-1.5 text-xs"
                    onClick={() => setCompleteTask({
                      id: t.id, title: t.title, date: t.date, status: t.status,
                      trade: t.trade, complianceType: t.complianceType, property: propertyId,
                    })}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-success" />
                    Mark as completed
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <EventDetailDialog
        event={completeTask}
        open={!!completeTask}
        onOpenChange={v => { if (!v) setCompleteTask(null); }}
        initialView="confirm-complete"
      />
    </DashboardLayout>
  );
};

export default LogWork;
