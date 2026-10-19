import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { startNewTenancy } from '@/lib/Api2';
import { toast } from '@/lib/toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  /** What the property is called, for the dialog's description. */
  nickname: string;
}

/** "New tenancy starting": adds the first-day check of the smoke and carbon monoxide alarms. */
const NewTenancyDialog = ({ open, onOpenChange, propertyId, nickname }: Props) => {
  const queryClient = useQueryClient();
  const [start, setStart] = useState('');

  useEffect(() => {
    if (open) setStart('');
  }, [open]);

  const add = useMutation({
    mutationFn: () => startNewTenancy(propertyId, start || undefined),
    onSuccess: () => {
      toast.success('Reminder added to your calendar.');
      onOpenChange(false);
      // The new task shows on the calendar, the dashboard lists and the portfolio.
      ['event', 'timeline', 'attention', 'systems-health'].forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      queryClient.invalidateQueries({
        predicate: q => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('/api/v1/properties/'),
      });
    },
    onError: () => toast.error('Could not add the reminder.'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-dialog="new-tenancy">
        <DialogHeader>
          <DialogTitle>New tenancy starting</DialogTitle>
          <DialogDescription>{nickname}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="tenancy-start-date">Start date (optional)</Label>
          <Input id="tenancy-start-date" type="date" value={start} onChange={e => setStart(e.target.value)} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={add.isPending}>
            Cancel
          </Button>
          <Button onClick={() => add.mutate()} disabled={add.isPending} data-action="add-tenancy-reminder">
            {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add reminder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewTenancyDialog;
