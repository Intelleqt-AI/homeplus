import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { postData } from '@/lib/Api';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

// Homeowner-side chat panel (HomePlus). Talks to the homeowner messaging mount.
const BASE = '/api/v1/messaging';
const UNREAD_URL = `${BASE}/unread-count/`;

interface ChatMessage {
  id: string;
  sender: string;
  sender_name: string;
  body: string;
  created_at: string;
  read_at: string | null;
  is_mine: boolean;
}

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string | null;
  title?: string;
  subtitle?: string;
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

const ChatPanel = ({ open, onOpenChange, conversationId, title, subtitle }: ChatPanelProps) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const messagesUrl =
    open && conversationId ? `${BASE}/conversations/${conversationId}/messages/` : null;

  const { data, isLoading } = useFetch<any>(messagesUrl, { refetchInterval: 8000 });
  const messages: ChatMessage[] = data?.data?.messages ?? [];

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, open]);

  useEffect(() => {
    if (open && conversationId) {
      queryClient.invalidateQueries({ queryKey: [UNREAD_URL] });
    }
  }, [open, conversationId, data, queryClient]);

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      postData({ url: `${BASE}/conversations/${conversationId}/messages/`, data: { body } }),
    onSuccess: () => {
      setDraft('');
      if (messagesUrl) queryClient.invalidateQueries({ queryKey: [messagesUrl] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_URL] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send message.');
    },
  });

  const handleSend = () => {
    const body = draft.trim();
    if (!body || !conversationId) return;
    sendMutation.mutate(body);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <div className="border-b border-gray-100 px-6 py-4">
          <SheetTitle className="text-base font-semibold text-gray-900">
            {title || 'Messages'}
          </SheetTitle>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
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
              <div key={m.id} className={cn('flex', m.is_mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
                    m.is_mine
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-gray-200 bg-white text-gray-800',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={cn('mt-1 text-[10px]', m.is_mine ? 'opacity-80' : 'text-gray-400')}>
                    {fmtTime(m.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-end gap-2 border-t border-gray-100 px-4 py-3">
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
            }}
          />
          <Button size="icon" onClick={handleSend} disabled={!draft.trim() || sendMutation.isPending}>
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatPanel;
