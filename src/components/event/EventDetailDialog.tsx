import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeEvent, deleteEvent, snoozeEvent, type DeleteScope } from '@/lib/Api2';
import { toast } from '@/lib/toast';
import {
  AlertTriangle,
  Bell,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  FileText,
  Repeat,
  Trash2,
  Wrench,
} from 'lucide-react';
import { TRADE_OPTIONS, getTradeCategoryLabel } from '@/lib/tradeCategories';
import { cn } from '@/lib/utils';

export interface CalendarEventDetail {
  id: string | number;
  title: string;
  date?: Date | string | null;
  time?: string;
  type?: string;
  status?: string;
  description?: string;
  priority?: string;
  complianceType?: string;
  recurring?: string;
  tradeConfirmed?: boolean;
  trade?: string | null;
  tradeCategory?: string | null;
  property?: string | null;
}

interface Props {
  event: CalendarEventDetail | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called when the user clicks "Get Quotes". Caller routes to Quote.tsx. */
  onGetQuotes?: (event: CalendarEventDetail) => void;
}

const formatDate = (d: Date | string | undefined | null): string => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const statusColor: Record<string, string> = {
  overdue: 'bg-red-50 text-red-700 border-red-200',
  action_required: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  due_this_week: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  scheduled: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-gray-50 text-gray-700 border-gray-200',
  pending: 'bg-gray-50 text-gray-600 border-gray-200',
};

const statusLabel: Record<string, string> = {
  overdue: 'Overdue',
  action_required: 'Needs Attention',
  due_this_week: 'Due This Week',
  confirmed: 'Scheduled',
  scheduled: 'Scheduled',
  completed: 'Done',
  pending: 'Upcoming',
};

const EventDetailDialog = ({ event, open, onOpenChange, onGetQuotes }: Props) => {
  const queryClient = useQueryClient();

  // The dialog has two views: the details panel and a "what should we
  // delete?" panel. We swap between them in-place so the user keeps context.
  const [view, setView] = useState<'details' | 'confirm-delete'>('details');
  const [scope, setScope] = useState<DeleteScope>('this');

  // Reset to the details view whenever the dialog re-opens for a new event.
  useEffect(() => {
    if (open) {
      setView('details');
      setScope('this');
    }
  }, [open, event?.id]);

  const completeMut = useMutation({
    mutationFn: (id: string) => completeEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
      toast.success('Marked as completed');
      onOpenChange(false);
    },
    onError: () => toast.error("Couldn't mark complete"),
  });

  const deleteMut = useMutation({
    mutationFn: ({ id, scope }: { id: string; scope: DeleteScope }) => deleteEvent(id, scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
      toast.success('Deleted');
      onOpenChange(false);
    },
    onError: () => toast.error("Couldn't delete"),
  });

  const snoozeMut = useMutation({
    mutationFn: ({ days }: { days: 1 | 7 | 14 }) => snoozeEvent(String(event!.id), days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event'] });
      toast.success('Task snoozed');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to snooze'),
  });

  if (!event) return null;

  const isTask = !!event.tradeConfirmed;
  const isRecurring = !!event.recurring && event.recurring !== 'never';
  const tradeLabel = event.trade
    ? TRADE_OPTIONS.find(o => o.value === event.trade)?.label ?? event.trade
    : null;
  const subcategoryLabel = event.tradeCategory ? getTradeCategoryLabel(event.tradeCategory) : null;
  const status = event.status ?? 'pending';
  const canComplete = status !== 'completed';

  const handleDeleteClick = () => {
    // Recurring events get the scope chooser; one-offs go straight to confirm.
    setView('confirm-delete');
    setScope('this');
  };

  const handleConfirmDelete = () => {
    deleteMut.mutate({ id: String(event.id), scope: isRecurring ? scope : 'this' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {isTask ? <Wrench className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            <span className="flex-1">{event.title}</span>
          </DialogTitle>
        </DialogHeader>

        {view === 'details' ? (<>
        {/* Status + recurring chips */}
        <div className="flex flex-wrap gap-2 -mt-2">
          <Badge variant="outline" className={cn('text-xs', statusColor[status] ?? '')}>
            {status === 'completed' ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : status === 'overdue' ? (
              <AlertTriangle className="w-3 h-3 mr-1" />
            ) : (
              <Clock className="w-3 h-3 mr-1" />
            )}
            {statusLabel[status] ?? status.replace(/_/g, ' ')}
          </Badge>
          {event.recurring && event.recurring !== 'never' && (
            <Badge variant="outline" className="text-xs">
              <Repeat className="w-3 h-3 mr-1" />
              Repeats {event.recurring}
            </Badge>
          )}
          {isTask ? (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200">
              Task
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
              Reminder
            </Badge>
          )}
        </div>

        <div className="space-y-3 py-2 text-sm">
          <Row icon={<CalendarIcon className="w-4 h-4 text-gray-400" />} label="Date">
            {formatDate(event.date)}
            {event.time ? ` · ${event.time}` : ''}
          </Row>

          {(tradeLabel || subcategoryLabel) && (
            <Row icon={<Wrench className="w-4 h-4 text-gray-400" />} label="Category">
              {tradeLabel}
              {subcategoryLabel ? ` · ${subcategoryLabel}` : ''}
            </Row>
          )}

          {event.type && (
            <Row icon={<FileText className="w-4 h-4 text-gray-400" />} label="Type">
              {String(event.type).charAt(0).toUpperCase() + String(event.type).slice(1)}
            </Row>
          )}

          {event.priority && (
            <Row icon={<AlertTriangle className="w-4 h-4 text-gray-400" />} label="Priority">
              {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
            </Row>
          )}

          {event.complianceType && event.complianceType !== 'none' && (
            <Row icon={<FileText className="w-4 h-4 text-gray-400" />} label="Compliance">
              {event.complianceType.replace(/_/g, ' ')}
            </Row>
          )}

          {event.property && (
            <Row icon={<Building2 className="w-4 h-4 text-gray-400" />} label="Property">
              <span className="text-gray-500 text-xs">{String(event.property).slice(0, 8)}…</span>
            </Row>
          )}

          {event.description && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {isTask && (
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onGetQuotes?.(event);
              }}
              className="flex-1 bg-[#FBBF24] text-[#1A1A1A] hover:bg-[#F59E0B]"
            >
              <Wrench className="w-4 h-4 mr-1.5" />
              Get Quotes
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              variant="outline"
              disabled={completeMut.isPending}
              onClick={() => completeMut.mutate(String(event.id))}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Mark Complete
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={deleteMut.isPending}
            onClick={handleDeleteClick}
            className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
          {canComplete && event.date && (
            <div className="flex items-center gap-1 w-full pt-1 border-t border-gray-100 mt-1">
              <span className="text-xs text-gray-500 shrink-0 mr-1">Snooze:</span>
              {([
                { days: 1 as const, label: 'Tomorrow' },
                { days: 7 as const, label: '1 week' },
                { days: 14 as const, label: '2 weeks' },
              ] as { days: 1 | 7 | 14; label: string }[]).map(opt => (
                <Button
                  key={opt.days}
                  size="sm"
                  variant="outline"
                  disabled={snoozeMut.isPending}
                  onClick={() => snoozeMut.mutate({ days: opt.days })}
                  className="h-7 px-2.5 text-xs flex-1"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        </>) : (
          /* ── Confirm-delete view ───────────────────────────────────────── */
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-red-100 bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-900">
                  {isRecurring ? 'Delete recurring task' : 'Delete event'}
                </p>
                <p className="text-red-700 text-xs mt-0.5">
                  {isRecurring
                    ? 'Choose what to remove from the series. Past completed instances are always kept.'
                    : `"${event.title}" will be removed. This can't be undone.`}
                </p>
              </div>
            </div>

            {isRecurring && (
              <div role="radiogroup" className="space-y-2">
                <ScopeOption
                  value="this"
                  current={scope}
                  onChange={setScope}
                  label="This event only"
                  description="Remove just this occurrence. The rest of the series continues."
                />
                <ScopeOption
                  value="this_and_future"
                  current={scope}
                  onChange={setScope}
                  label="This and following events"
                  description="Remove this occurrence and every later one. Stops the recurring schedule."
                />
                <ScopeOption
                  value="all"
                  current={scope}
                  onChange={setScope}
                  label="All events in the series"
                  description="Remove every active occurrence (past completed ones stay as history)."
                />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setView('details')}
                disabled={deleteMut.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmDelete}
                disabled={deleteMut.isPending}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {deleteMut.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const ScopeOption = ({
  value,
  current,
  onChange,
  label,
  description,
}: {
  value: DeleteScope;
  current: DeleteScope;
  onChange: (v: DeleteScope) => void;
  label: string;
  description: string;
}) => {
  const selected = current === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onChange(value)}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-colors flex items-start gap-3',
        selected
          ? 'border-red-500 bg-red-50/50'
          : 'border-gray-200 hover:bg-gray-50',
      )}
    >
      <span
        className={cn(
          'mt-1 h-3.5 w-3.5 rounded-full border-2 shrink-0 transition-colors',
          selected ? 'border-red-600 bg-red-600 ring-2 ring-red-200' : 'border-gray-300',
        )}
      />
      <span className="flex-1">
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        <span className="block text-xs text-gray-500 mt-0.5">{description}</span>
      </span>
    </button>
  );
};

const Row = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{children}</p>
    </div>
  </div>
);

export default EventDetailDialog;
