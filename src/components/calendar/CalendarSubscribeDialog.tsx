import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarSync, Copy, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { getCalendarFeedLinks, rotateCalendarFeedLink } from '@/lib/Api2';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Scope = 'all' | 'property';

const FEED_KEY = ['calendar-feed-links'];

/** "Sync to my calendar": a private subscription link for Apple/Google/Outlook. */
export default function CalendarSubscribeDialog() {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>('all');
  const [confirmingRotate, setConfirmingRotate] = useState(false);
  const queryClient = useQueryClient();
  const { activePropertyId, activeProperty, properties } = useActiveProperty();
  const canScope = !!activePropertyId && properties.length > 1;
  const effectiveScope: Scope = canScope ? scope : 'all';

  const { data: links, isLoading, isError, refetch } = useQuery({
    queryKey: FEED_KEY,
    queryFn: getCalendarFeedLinks,
    enabled: open,
    staleTime: Infinity,
  });

  const rotate = useMutation({
    mutationFn: rotateCalendarFeedLink,
    onSuccess: next => {
      queryClient.setQueryData(FEED_KEY, next);
      setConfirmingRotate(false);
      toast.success('New link created. The old one no longer works.');
    },
    onError: () => toast.error('Could not create a new link. Please try again.'),
  });

  const suffix = effectiveScope === 'property' && activePropertyId ? `?property=${activePropertyId}` : '';
  const webcalUrl = links ? `${links.webcal_url}${suffix}` : '';
  const httpsUrl = links ? `${links.url}${suffix}` : '';
  const googleUrl = webcalUrl ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}` : '';
  const isLocalLink = /^https?:\/\/(localhost|127\.|0\.0\.0\.0)/i.test(links?.url ?? '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(httpsUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.');
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-10 gap-2 rounded-[10px] border-[#E8E8E3] text-sm"
        onClick={() => setOpen(true)}
        aria-label="Sync to calendar"
      >
        <CalendarSync className="h-4 w-4" strokeWidth={1.5} />
        <span className="hidden sm:inline">Sync to calendar</span>
      </Button>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setConfirmingRotate(false); }}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add your reminders to your own calendar</DialogTitle>
            <DialogDescription>
              Subscribe once and every gas, electrical and other due date shows up in your phone or computer
              calendar, and stays up to date, even if you stop using the app.
            </DialogDescription>
          </DialogHeader>

          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Preparing your link…</p>}

          {isError && (
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm text-red-600">We could not load your calendar link.</p>
              <Button variant="outline" onClick={() => refetch()}>Try again</Button>
            </div>
          )}

          {links && (
            <div className="space-y-4">
              {canScope && (
                <div className="grid grid-cols-2 gap-2 rounded-[12px] bg-[#F5F5F0] p-1" role="radiogroup" aria-label="What to include">
                  {([
                    ['all', 'All my properties'],
                    ['property', activeProperty?.name ?? 'This property'],
                  ] as [Scope, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={effectiveScope === value}
                      onClick={() => setScope(value)}
                      className={cn(
                        'truncate rounded-[10px] px-3 py-2 text-sm transition-colors',
                        effectiveScope === value ? 'bg-white font-medium shadow-sm' : 'text-[#6B6B6B]',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild className="h-10 rounded-[10px]">
                  <a href={webcalUrl}>Add to Apple Calendar</a>
                </Button>
                <Button asChild variant="outline" className="h-10 rounded-[10px]">
                  <a href={googleUrl} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>
                </Button>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-[#6B6B6B]">Or paste this link into any calendar app (Outlook, etc.)</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={httpsUrl}
                    onFocus={e => e.currentTarget.select()}
                    aria-label="Calendar subscription link"
                    className="h-9 min-w-0 flex-1 rounded-[8px] border border-[#E8E8E3] bg-[#F5F5F0] px-3 text-xs"
                  />
                  <Button type="button" variant="outline" className="h-9 shrink-0 gap-1.5 rounded-[8px] px-3 text-xs" onClick={copy}>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
              </div>

              <ul className="space-y-1 text-xs text-[#6B6B6B]">
                <li>Google Calendar can take 12 to 24 hours to show new items. Apple Calendar is usually quicker.</li>
                <li>Only upcoming, unfinished reminders are included.</li>
              </ul>

              {isLocalLink && (
                <p className="rounded-[10px] bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This is a local development link, so it only works on this computer.
                </p>
              )}

              <div className="rounded-[12px] border border-[#E8E8E3] p-3">
                <p className="flex items-start gap-2 text-xs text-[#6B6B6B]">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  Keep this link private. Anyone who has it can see your reminders. If it was shared by mistake, create a new one.
                </p>
                {confirmingRotate ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs">Calendars using the old link will stop updating. Continue?</span>
                    <Button type="button" size="sm" variant="destructive" disabled={rotate.isPending} onClick={() => rotate.mutate()}>
                      {rotate.isPending ? 'Creating…' : 'Yes, create new link'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" className="text-[#1A1A1A] hover:bg-[#F5F5F0]" onClick={() => setConfirmingRotate(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="sm" className="mt-2 h-8 gap-1.5 px-2 text-xs text-[#1A1A1A] hover:bg-[#F5F5F0]" onClick={() => setConfirmingRotate(true)}>
                    <RefreshCw className="h-3.5 w-3.5" /> Create a new link
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
