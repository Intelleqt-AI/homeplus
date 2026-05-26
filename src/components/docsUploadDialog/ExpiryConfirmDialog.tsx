import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmDocumentReminder, type ConfirmReminderPayload } from '@/lib/Api';
import { TRADE_OPTIONS } from '@/lib/tradeCategories';
import { toast } from '@/lib/toast';
import { Bell, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

type LeadTime = '30' | '14' | '7' | 'custom';

interface UploadedDoc {
  id: string;
  name: string;
  /** Trade hint inferred at upload time (e.g. 'gas_engineer'). May be empty. */
  doc_type?: string | null;
  /** Expiry the user may have already entered during upload. */
  expires_at?: string | null;
  /** Event id when the backend already auto-scheduled the reminder. */
  created_event?: string | null;
}

interface Props {
  doc: UploadedDoc | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const TODAY_ISO = () => new Date().toISOString().split('T')[0];

const toIso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const subtractDays = (iso: string, days: number) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() - days);
  return toIso(d);
};

const diffDays = (laterIso: string, earlierIso: string): number => {
  const later = new Date(laterIso);
  const earlier = new Date(earlierIso);
  if (Number.isNaN(later.getTime()) || Number.isNaN(earlier.getTime())) return 0;
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24)));
};

const TRADE_OPTIONS_WITH_NONE = [
  { value: '', label: 'None (reminder only)' },
  ...TRADE_OPTIONS,
];

const ExpiryConfirmDialog = ({ doc, open, onOpenChange }: Props) => {
  const queryClient = useQueryClient();

  const [expiresOn, setExpiresOn] = useState('');
  const [leadTime, setLeadTime] = useState<LeadTime>('30');
  const [customRemindOn, setCustomRemindOn] = useState('');
  const [trade, setTrade] = useState('');
  const [recurring, setRecurring] = useState<'annually' | 'never'>('annually');
  const [title, setTitle] = useState('');

  // Reset state every time we open for a new document.
  useEffect(() => {
    if (!open || !doc) return;
    setExpiresOn(doc.expires_at ?? '');
    setLeadTime('30');
    setCustomRemindOn('');
    setTrade(doc.doc_type ?? '');
    setRecurring('annually');
    setTitle(`Renew: ${doc.name}`);
  }, [open, doc?.id, doc?.expires_at, doc?.doc_type, doc?.name]);

  // Lead time in days. For 'custom' we derive it from the picked date.
  const remindDaysBefore = useMemo<number>(() => {
    if (leadTime !== 'custom') return Number(leadTime);
    if (!expiresOn || !customRemindOn) return 0;
    return diffDays(expiresOn, customRemindOn);
  }, [leadTime, expiresOn, customRemindOn]);

  // Derived preview date — UI only.
  const previewRemindOn = useMemo(() => {
    if (!expiresOn) return '';
    if (leadTime === 'custom') return customRemindOn;
    return subtractDays(expiresOn, Number(leadTime));
  }, [expiresOn, leadTime, customRemindOn]);

  const mutation = useMutation({
    mutationFn: (payload: ConfirmReminderPayload) =>
      confirmDocumentReminder(doc!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/documents/'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/documents/expiring/'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      toast.success('Reminder added to your calendar');
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Couldn't save the reminder. Try again.");
    },
  });

  if (!doc) return null;

  const handleConfirm = () => {
    if (!expiresOn) {
      toast.error('Enter the document expiry date.');
      return;
    }
    if (leadTime === 'custom' && !customRemindOn) {
      toast.error('Pick the custom reminder date.');
      return;
    }
    mutation.mutate({
      expires_on: expiresOn,
      remind_days_before: remindDaysBefore,
      trade: trade || null,
      recurring,
      title: title.trim() || undefined,
    });
  };

  const handleSkip = () => onOpenChange(false);

  // Upsert mode: the backend already auto-created a reminder at upload time
  // (because the user supplied an expiry on the upload form). Submitting now
  // updates that event instead of creating a duplicate.
  const isUpdate = !!doc.created_event;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5" />
            {isUpdate ? 'Reminder scheduled — tweak it?' : 'Set a reminder for this document'}
          </DialogTitle>
        </DialogHeader>

        {isUpdate ? (
          <p className="text-sm text-gray-600">
            We've added <strong>{doc.name}</strong> to your calendar and scheduled a reminder
            1 month before it expires. Adjust the lead time or trade below, or skip to keep the
            defaults.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            We've saved <strong>{doc.name}</strong>. When does it expire, and how far in advance do you want a reminder?
          </p>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="expires-on">Expiry date <span className="text-red-500">*</span></Label>
            <Input
              id="expires-on"
              type="date"
              min={TODAY_ISO()}
              value={expiresOn}
              onChange={e => setExpiresOn(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Remind me</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { v: '30', l: '1 month before' },
                { v: '14', l: '2 weeks before' },
                { v: '7', l: '1 week before' },
                { v: 'custom', l: 'Custom date' },
              ] as { v: LeadTime; l: string }[]).map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setLeadTime(opt.v)}
                  className={cn(
                    'text-sm py-2 px-3 rounded-lg border transition-colors',
                    leadTime === opt.v
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
                  )}
                >
                  {opt.l}
                </button>
              ))}
            </div>
            {leadTime === 'custom' && (
              <Input
                type="date"
                value={customRemindOn}
                min={TODAY_ISO()}
                max={expiresOn || undefined}
                onChange={e => setCustomRemindOn(e.target.value)}
              />
            )}
            {previewRemindOn && (
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Bell className="w-3 h-3" />
                Reminder will fire on{' '}
                <strong className="text-gray-700">{previewRemindOn}</strong>
                {remindDaysBefore > 0 && ` (${remindDaysBefore} day${remindDaysBefore === 1 ? '' : 's'} before)`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Trade (for "Get Quotes" button)</Label>
            <Select value={trade || 'none'} onValueChange={v => setTrade(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRADE_OPTIONS_WITH_NONE.map(opt => (
                  <SelectItem key={opt.value || 'none'} value={opt.value || 'none'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Pick a trade to get a one-click "Get Quotes" button when the reminder fires. Choose "None" for a plain reminder.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Recurring</Label>
            <Select value={recurring} onValueChange={v => setRecurring(v as 'annually' | 'never')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annually">Repeat annually</SelectItem>
                <SelectItem value="never">One-off</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-title">Reminder title</Label>
            <Input
              id="reminder-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`Renew: ${doc.name}`}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button className="flex-1" onClick={handleConfirm} disabled={mutation.isPending}>
            {mutation.isPending
              ? 'Saving…'
              : isUpdate
              ? 'Save changes'
              : 'Confirm & set reminder'}
          </Button>
          <Button variant="outline" className="flex-1 text-black hover:bg-gray-200" onClick={handleSkip}>
            Skip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpiryConfirmDialog;
