import { useEffect, useRef, useState, type ChangeEvent } from 'react';
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
import { Ban, FileText, Info, Loader2, Paperclip, Save, Send, X } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import {
  blockConversation,
  CONVERSATIONS_URL,
  editMessage,
  getMessagesUrl,
  presignAttachment,
  unblockConversation,
  UNREAD_URL,
  type AttachmentType,
} from '@/lib/messaging';
import { uploadAttachment, validateAttachmentClientSide } from '@/lib/attachmentUpload';
import { postData } from '@/lib/Api';
import { toast } from '@/lib/toast';
import MessageBubble, { type ChatMessage } from './MessageBubble';
import JobInfoDialog from './JobInfoDialog';
import TraderDetailsDialog from './TraderDetailsDialog';

const ATTACHMENT_ACCEPT = 'image/*,video/*,application/pdf,.doc,.docx';

type PendingAttachment = {
  file: File;
  s3_key: string;
  attachment_type: AttachmentType;
};

interface ChatConversationBid {
  id: string;
  conversation_id: string | null;
  contractor_phone: string;
  company_name: string;
  bidder: { first_name: string; last_name: string; email: string };
  tradepilot_profile: {
    business_name: string;
    trade_specialty: string;
    years_experience: string;
    postcode: string;
    has_insurance: boolean;
    has_license: boolean;
    is_verified: boolean;
    completed_jobs: number;
    avg_rating: number | null;
    total_ratings: number;
    profile_photo_url: string | null;
  } | null;
}

interface ChatConversation {
  id: string;
  job: string | null;
  job_detail: {
    title: string;
    description: string;
    trade: string;
    category: string;
    urgency: string;
    priority: string;
    status: string;
    location: string;
    postcode: string;
    preferred_date: string | null;
  } | null;
  other_party: { id: string; name: string; role: string; business_name?: string } | null;
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
  const [jobInfoOpen, setJobInfoOpen] = useState(false);
  const [traderDetailsOpen, setTraderDetailsOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [attachmentProgress, setAttachmentProgress] = useState<number | null>(null);
  const [isAttaching, setIsAttaching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const messagesUrl =
    open && conversationId ? getMessagesUrl(conversationId) : null;

  const { data, isLoading } = useFetch<any>(messagesUrl, { refetchInterval: 8000 });
  const messages: ChatMessage[] = data?.data?.messages ?? [];
  const conversation: ChatConversation | null = data?.data?.conversation ?? null;

  const jobUrl = open && conversation?.job ? `/api/v1/jobs/${conversation.job}/` : null;
  const { data: jobData } = useFetch<any>(jobUrl);
  const bids: ChatConversationBid[] = jobData?.data?.bids ?? [];
  const traderBid = bids.find(b => b.conversation_id === conversationId) ?? null;

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
      setPendingAttachment(null);
      setAttachmentProgress(null);
      setIsAttaching(false);
    }
  }, [open, conversationId]);

  const invalidateThread = () => {
    if (messagesUrl) queryClient.invalidateQueries({ queryKey: [messagesUrl] });
    queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_URL] });
  };

  const sendMutation = useMutation({
    mutationFn: ({ body, attachment }: { body: string; attachment: PendingAttachment | null }) =>
      postData({
        url: getMessagesUrl(conversationId!),
        data: {
          body,
          ...(attachment && {
            attachment_s3_key: attachment.s3_key,
            attachment_file_name: attachment.file.name,
            attachment_file_size: attachment.file.size,
            attachment_content_type: attachment.file.type,
            attachment_type: attachment.attachment_type,
          }),
        },
      }),
    onSuccess: () => {
      setDraft('');
      setPendingAttachment(null);
      invalidateThread();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send message.');
    },
  });

  const handleAttachClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !conversationId) return;
    const clientError = validateAttachmentClientSide(file);
    if (clientError) {
      toast.error(clientError);
      return;
    }
    setIsAttaching(true);
    setAttachmentProgress(0);
    try {
      const presigned = await presignAttachment(conversationId, file);
      await uploadAttachment(file, presigned, setAttachmentProgress);
      setPendingAttachment({ file, s3_key: presigned.s3_key, attachment_type: presigned.attachment_type });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to attach file.');
    } finally {
      setIsAttaching(false);
      setAttachmentProgress(null);
    }
  };

  const handleRemoveAttachment = () => setPendingAttachment(null);

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
    if (!conversationId) return;
    if (editingMessageId) {
      if (!body || isSameAsOriginal) return;
      editMutation.mutate(body);
    } else {
      if (!body && !pendingAttachment) return;
      sendMutation.mutate({ body, attachment: pendingAttachment });
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
              {conversation?.other_party ? (
                <button
                  type="button"
                  onClick={() => setTraderDetailsOpen(true)}
                  className="truncate text-left hover:underline"
                  title="View trader details"
                >
                  {title || 'Messages'}
                </button>
              ) : (
                title || 'Messages'
              )}
            </SheetTitle>
            {subtitle && <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>}
          </div>

          {conversation && (
            <div className="flex shrink-0 items-center gap-1">
              {conversation.job_detail && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-gray-400 hover:text-gray-700"
                  title="View job details"
                  onClick={() => setJobInfoOpen(true)}
                >
                  <Info className="h-4 w-4" />
                </Button>
              )}
              {conversation.blocked_by_me ? (
                <Button
                  variant="outline"
                  size="sm"
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
              ) : null}
            </div>
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
            <input
              ref={fileInputRef}
              type="file"
              accept={ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={handleFileSelected}
            />
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
              {(isAttaching || pendingAttachment) && !editingMessageId && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="min-w-0 flex-1 truncate">
                    {isAttaching ? 'Uploading…' : pendingAttachment?.file.name}
                    {isAttaching && attachmentProgress != null ? ` ${attachmentProgress}%` : ''}
                  </span>
                  {isAttaching ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-gray-400" />
                  ) : (
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="shrink-0 text-gray-400 hover:text-gray-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
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
            {!editingMessageId && (
              <Button
                size="icon"
                variant="outline"
                onClick={handleAttachClick}
                disabled={isAttaching}
                title="Attach a file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              onClick={handleSend}
              disabled={
                isSending ||
                isSaving ||
                isAttaching ||
                (editingMessageId ? !draft.trim() || isSameAsOriginal : !draft.trim() && !pendingAttachment)
              }
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

    <JobInfoDialog
      open={jobInfoOpen}
      onOpenChange={setJobInfoOpen}
      jobDetail={conversation?.job_detail ?? null}
      bids={bids}
      conversationId={conversationId}
    />

    <TraderDetailsDialog
      open={traderDetailsOpen}
      onOpenChange={setTraderDetailsOpen}
      bid={traderBid}
      fallbackName={conversation?.other_party?.name}
    />
    </>
  );
};

export default ChatPanel;
