import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchMessageHistory } from '@/lib/messaging';

interface EditHistoryEntry {
  previous_body: string;
  edited_at: string;
}

interface EditHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  messageId: string;
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

const EditHistoryDialog = ({ open, onOpenChange, conversationId, messageId }: EditHistoryDialogProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['message-history', conversationId, messageId],
    queryFn: () => fetchMessageHistory(conversationId, messageId),
    enabled: open,
  });

  const entries: EditHistoryEntry[] = data?.data?.entries ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit history</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No earlier versions found.</p>
        ) : (
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {entries.map((entry, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2">
                <p className="whitespace-pre-wrap break-words text-sm text-gray-700">{entry.previous_body}</p>
                <p className="mt-1 text-[11px] text-gray-400">Edited {fmtTime(entry.edited_at)}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditHistoryDialog;
