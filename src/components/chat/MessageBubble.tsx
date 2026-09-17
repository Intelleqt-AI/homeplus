import { useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, MoreVertical } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { CONVERSATIONS_URL, deleteMessage, getMessagesUrl, UNREAD_URL, type DeleteScope } from '@/lib/messaging';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import EditHistoryDialog from './EditHistoryDialog';
import ReportMessageDialog from './ReportMessageDialog';

export interface ChatMessage {
  id: string;
  sender: string;
  sender_name: string;
  body: string;
  created_at: string;
  read_at: string | null;
  is_mine: boolean;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  is_reported_by_me: boolean;
  attachment_url?: string | null;
  attachment_file_name?: string;
  attachment_file_size?: number | null;
  attachment_type?: 'image' | 'video' | 'pdf' | 'docx' | '';
}

interface MenuAction {
  key: string;
  label: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface MessageBubbleProps {
  message: ChatMessage;
  conversationId: string;
  onEdit: (message: ChatMessage) => void;
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

const fmtFileSize = (bytes?: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AttachmentContent = ({ m }: { m: ChatMessage }) => {
  if (!m.attachment_url || !m.attachment_type) return null;
  if (m.attachment_type === 'image') {
    return (
      <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={m.attachment_url}
          alt={m.attachment_file_name || 'Image attachment'}
          className="max-h-64 w-full rounded-lg object-cover"
        />
      </a>
    );
  }
  if (m.attachment_type === 'video') {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video src={m.attachment_url} controls className="max-h-64 w-full rounded-lg" />
    );
  }
  // pdf / docx — a downloadable file chip.
  return (
    <a
      href={m.attachment_url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs no-underline',
        m.is_mine ? 'border-white/30 bg-white/10' : 'border-gray-200 bg-gray-50',
      )}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{m.attachment_file_name || 'Attachment'}</span>
      {m.attachment_file_size ? <span className="shrink-0 opacity-70">{fmtFileSize(m.attachment_file_size)}</span> : null}
      <Download className="h-3.5 w-3.5 shrink-0" />
    </a>
  );
};

const MessageBubble = ({ message: m, conversationId, onEdit }: MessageBubbleProps) => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [deleteScope, setDeleteScope] = useState<DeleteScope | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (scope: DeleteScope) => deleteMessage(conversationId, m.id, scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getMessagesUrl(conversationId)] });
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_URL] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_URL] });
      toast.success('Message deleted');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete message.');
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(m.body);
    toast.success('Copied to clipboard');
  };

  if (m.is_deleted) {
    return (
      <div className={cn('flex', m.is_mine ? 'justify-end' : 'justify-start')}>
        <div className="max-w-[80%] rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm italic text-gray-400">
          <p>This message was deleted</p>
          <p className="mt-1 text-[10px] text-gray-400">{fmtTime(m.created_at)}</p>
        </div>
      </div>
    );
  }

  // Built once, feeds both the right-click ContextMenu (desktop) and the
  // MoreVertical DropdownMenu (mobile/touch, no discoverable right-click) so
  // the conditional item logic never has to be duplicated.
  const actions: MenuAction[] = [{ key: 'copy', label: 'Copy', onSelect: handleCopy }];

  if (m.is_edited) {
    actions.push({ key: 'history', label: 'View edit history', onSelect: () => setHistoryOpen(true) });
  }
  if (m.is_mine) {
    actions.push({ key: 'edit', label: 'Edit', onSelect: () => onEdit(m) });
  }
  actions.push({ key: 'delete-me', label: 'Delete for me', onSelect: () => setDeleteScope('me') });
  if (m.is_mine) {
    actions.push({
      key: 'delete-everyone',
      label: 'Delete for everyone',
      onSelect: () => setDeleteScope('everyone'),
      destructive: true,
    });
  }
  if (!m.is_mine) {
    actions.push(
      m.is_reported_by_me
        ? { key: 'report', label: 'Reported', disabled: true }
        : { key: 'report', label: 'Report', onSelect: () => setReportOpen(true) },
    );
  }

  const menuButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 shrink-0 text-gray-400 transition-opacity hover:text-gray-600',
            isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={m.is_mine ? 'end' : 'start'}>
        {actions.map(a => (
          <DropdownMenuItem
            key={a.key}
            disabled={a.disabled}
            onSelect={a.onSelect}
            className={a.destructive ? 'text-destructive focus:text-destructive' : undefined}
          >
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className={cn('group flex items-center gap-1', m.is_mine ? 'justify-end' : 'justify-start')}>
        {m.is_mine && menuButton}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
                m.is_mine
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-gray-200 bg-white text-gray-800',
              )}
            >
              {m.attachment_url && (
                <div className={cn(m.body ? 'mb-1.5' : undefined)}>
                  <AttachmentContent m={m} />
                </div>
              )}
              {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
              <p className={cn('mt-1 flex items-center gap-1 text-[10px]', m.is_mine ? 'opacity-80' : 'text-gray-400')}>
                {fmtTime(m.created_at)}
                {m.is_edited && <span>· edited</span>}
              </p>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {actions.map(a => (
              <ContextMenuItem
                key={a.key}
                disabled={a.disabled}
                onSelect={a.onSelect}
                className={a.destructive ? 'text-destructive focus:text-destructive' : undefined}
              >
                {a.label}
              </ContextMenuItem>
            ))}
          </ContextMenuContent>
        </ContextMenu>
        {!m.is_mine && menuButton}
      </div>

      <AlertDialog open={deleteScope !== null} onOpenChange={open => !open && setDeleteScope(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteScope === 'everyone' ? 'Delete for everyone?' : 'Delete for me?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteScope === 'everyone'
                ? "This message will be removed for both you and the other person. This can't be undone."
                : 'This message will be removed from your view only. The other person will still see it.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              className={deleteScope === 'everyone' ? 'bg-destructive hover:bg-destructive/90' : undefined}
              onClick={() => deleteScope && deleteMutation.mutate(deleteScope)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReportMessageDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        conversationId={conversationId}
        messageId={m.id}
      />

      <EditHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        conversationId={conversationId}
        messageId={m.id}
      />
    </>
  );
};

export default MessageBubble;
