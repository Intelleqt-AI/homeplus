import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
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
import { Textarea } from '@/components/ui/textarea';
import { Ban, Loader2, Save, Send, X } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import {
  blockConversation,
  CONVERSATIONS_URL,
  editMessage,
  getMessagesUrl,
  unblockConversation,
  UNREAD_URL,
} from '@/lib/messaging';
import { postData } from '@/lib/Api';
import { toast } from '@/lib/toast';
import MessageBubble, { type ChatMessage } from './MessageBubble';

interface ChatConversation {
  id: string;
  is_blocked: boolean;
  blocked_by_me: boolean;
  blocked_by_name: string | null;
  can_send: boolean;
}

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | null;
  title?: string;
  subtitle?: string;
}

const ChatPanel = ({ open, onOpenChange, conversationId, title, subtitle }: ChatPanelProps) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const messagesUrl =
    open && conversationId ? getMessagesUrl(conversationId) : null;

  const { data, isLoading } = useFetch<any>(messagesUrl, { refetchInterval: 8000 });
  const messages: ChatMessage[] = data?.data?.messages ?? [];
  const conversation: ChatConversation | null = data?.data?.conversation ?? null;

  const editingMessage = editingMessageId ? messages.find(m => m.id === editingMessageId) ?? null : null;

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, open]);

  useEffect(() => {
    if (open && conversationId) {
      queryClient.invalidateQueries({ queryKey: [UNREAD_URL] });
    }
  }, [open, conversationId, data, queryClient]);

  // Reset any in-progress edit whenever the panel is closed or swapped to a
  // different conversation, so a stale draft never leaks into a new thread.
  useEffect(() => {
    if (!open) {
      setEditingMessageId(null);
      setDraft('');
    }
  }, [open, conversationId]);

  const invalidateThread = () => {
    if (messagesUrl) queryClient.invalidateQueries({ queryKey: [messagesUrl] });
    queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_URL] });
  };

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      postData({ url: getMessagesUrl(conversationId!), data: { body } }),
    onSuccess: () => {
      setDraft('');
      invalidateThread();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send message.');
    },
  });

  const editMutation = useMutation({
    mutationFn: (body: string) => editMessage(conversationId!, editingMessageId!, body),
    onSuccess: () => {
      setDraft('');
      setEditingMessageId(null);
      invalidateThread();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save changes.');
    },
  });

  const blockMutation = useMutation({
    mutationFn: () => blockConversation(conversationId!),
    onSuccess: () => {
      setBlockConfirmOpen(false);
      invalidateThread();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to block conversation.');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => unblockConversation(conversationId!),
    onSuccess: () => invalidateThread(),
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to unblock conversation.');
    },
  });

  const handleEditRequest = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setDraft(message.body);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setDraft('');
  };

  const isSameAsOriginal =
    !!editingMessage && draft.trim() === editingMessage.body.trim();

  const handleSend = () => {
    const body = draft.trim();
    if (!body || !conversationId) return;
    if (editingMessageId) {
      if (isSameAsOriginal) return;
      editMutation.mutate(body);
    } else {
      sendMutation.mutate(body);
    }
  };

  // Default to showing the composer while the conversation is still loading
  // (conversation === null) so there's no flash of the blocked banner.
  const canSend = !conversation || conversation.can_send;
  const isSaving = editMutation.isPending;
  const isSending = sendMutation.isPending;

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-4 pr-12">
          <div className="min-w-0">
            <SheetTitle className="truncate text-base font-semibold text-gray-900">
              {title || 'Messages'}
            </SheetTitle>
            {subtitle && <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>}
          </div>

          {conversation && (
            conversation.blocked_by_me ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => unblockMutation.mutate()}
                disabled={unblockMutation.isPending}
              >
                {unblockMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Unblock'}
              </Button>
            ) : !conversation.is_blocked ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-gray-400 hover:text-destructive"
                title={`Block ${title || 'this contact'}`}
                onClick={() => setBlockConfirmOpen(true)}
              >
                <Ban className="h-4 w-4" />
              </Button>
            ) : null
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/60 px-4 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No messages yet — start the conversation.
            </p>
          ) : (
            messages.map(m => (
              <MessageBubble
                key={m.id}
                message={m}
                conversationId={conversationId!}
                onEdit={handleEditRequest}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {canSend ? (
          <div className="flex items-end gap-2 border-t border-gray-100 px-4 py-3">
            <div className="flex flex-1 flex-col gap-1.5">
              {editingMessageId && (
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>Editing message</span>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-0.5 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
              )}
              <Textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Type a message…"
                rows={1}
                className="max-h-32 min-h-[40px] resize-none"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                  if (e.key === 'Escape' && editingMessageId) {
                    handleCancelEdit();
                  }
                }}
              />
            </div>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!draft.trim() || isSending || isSaving || (!!editingMessageId && isSameAsOriginal)}
              title={editingMessageId ? 'Save' : 'Send'}
            >
              {isSending || isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingMessageId ? (
                <Save className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="border-t border-gray-100 px-4 py-3">
            {conversation?.blocked_by_me ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
                <span>You blocked {title || 'this contact'}.</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => unblockMutation.mutate()}
                  disabled={unblockMutation.isPending}
                >
                  {unblockMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Unblock'}
                </Button>
              </div>
            ) : (
              <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-center text-xs text-gray-500">
                You can't reply to this conversation.
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>

    <AlertDialog open={blockConfirmOpen} onOpenChange={setBlockConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block {title || 'this contact'}?</AlertDialogTitle>
          <AlertDialogDescription>
            They won't be able to send you messages until you unblock them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={blockMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={blockMutation.isPending}
            className="bg-destructive hover:bg-destructive/90"
            onClick={() => blockMutation.mutate()}
          >
            Block
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default ChatPanel;
