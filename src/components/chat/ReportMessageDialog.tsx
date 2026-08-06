import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { getMessagesUrl, reportMessage, type ReportReason } from '@/lib/messaging';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'scam_fraud', label: 'Scam or fraud' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'off_platform_contact', label: 'Trying to take this deal off-platform' },
  { value: 'other', label: 'Other' },
];

interface ReportMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  messageId: string;
}

const ReportMessageDialog = ({ open, onOpenChange, conversationId, messageId }: ReportMessageDialogProps) => {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setDetails('');
    }
  }, [open]);

  const isOther = reason === 'other';
  const isValid = !!reason && (!isOther || details.trim().length > 0);

  const reportMutation = useMutation({
    mutationFn: () =>
      reportMessage(conversationId, messageId, {
        reason: reason as ReportReason,
        details: details.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Message reported.');
      queryClient.invalidateQueries({ queryKey: [getMessagesUrl(conversationId)] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to report message.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report message</DialogTitle>
          <DialogDescription>
            Tell us what's wrong with this message. The other person won't be notified.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={v => setReason(v as ReportReason)} className="gap-2.5">
          {REASONS.map(r => (
            <label key={r.value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
              <RadioGroupItem value={r.value} />
              {r.label}
            </label>
          ))}
        </RadioGroup>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            {isOther ? 'Please describe the issue' : 'Additional details (optional)'}
          </label>
          <Textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={3}
            placeholder={isOther ? 'Describe what happened…' : 'Anything else we should know?'}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={reportMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => reportMutation.mutate()} disabled={!isValid || reportMutation.isPending}>
            {reportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportMessageDialog;
