import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import useFetch from '@/hooks/useFetch';
import ChatPanel from '@/components/chat/ChatPanel';
import { cn } from '@/lib/utils';

const CONVERSATIONS_URL = '/api/v1/messaging/conversations/';

interface Conversation {
  id: string;
  job: string;
  job_title: string;
  job_trade: string;
  job_status: string;
  other_party: { id: string; name: string; role: string };
  last_message: { body: string; created_at: string; sender: string } | null;
  last_message_at: string;
  unread_count: number;
}

const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const Messages = () => {
  const { data, isLoading } = useFetch<any>(CONVERSATIONS_URL, {
    queryKey: [CONVERSATIONS_URL],
    refetchInterval: 20000,
  });
  const conversations: Conversation[] = data?.data?.conversations ?? [];

  const [chatOpen, setChatOpen] = useState(false);
  const [active, setActive] = useState<Conversation | null>(null);

  const openChat = (c: Conversation) => {
    setActive(c);
    setChatOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500">Chat with traders who have purchased your job leads.</p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading conversations…</div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <MessageSquare className="h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No conversations yet</p>
            <p className="max-w-xs text-xs text-gray-400">
              When a trader purchases one of your leads, you'll be able to message them here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => openChat(c)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {c.other_party.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{c.other_party.name}</p>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {c.last_message ? fmtWhen(c.last_message.created_at) : fmtWhen(c.last_message_at)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-gray-500">{c.job_title}</p>
                  {c.last_message && (
                    <p className="mt-0.5 truncate text-xs text-gray-400">{c.last_message.body}</p>
                  )}
                </div>
                {c.unread_count > 0 && (
                  <span
                    className={cn(
                      'ml-1 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5',
                      'bg-primary text-[11px] font-semibold text-primary-foreground',
                    )}
                  >
                    {c.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <ChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        conversationId={active?.id ?? null}
        title={active?.other_party.name}
        subtitle={active?.job_title}
      />
    </DashboardLayout>
  );
};

export default Messages;
