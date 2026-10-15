import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageSquare, Search, Inbox, Plus, ChevronDown, Briefcase, Building2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import useFetch from '@/hooks/useFetch';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { useAuth } from '@/hooks/useAuth';
import ChatPanel from '@/components/chat/ChatPanel';
import TraderName from '@/components/trader/TraderName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const CONVERSATIONS_URL = '/api/v1/messaging/conversations/';

interface Conversation {
  id: string;
  job: string;
  job_title: string;
  job_trade: string;
  job_status: string;
  /** null when the job has no property — such chats show under every property. */
  job_property: string | null;
  other_party: { id: string; name: string; role: string; profile_photo_url?: string | null };
  last_message: {
    body: string;
    created_at: string;
    sender: string | null;
    sender_name?: string;
    sender_side?: 'homeowner' | 'trader';
  } | null;
  last_message_at: string;
  unread_count: number;
}

const NoPropertyChip = () => (
  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-medium text-[#B45309]">
    <Building2 className="h-3 w-3" strokeWidth={1.75} />
    No property
  </span>
);

const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const prettify = (s?: string) => (s ? s.replace(/_/g, ' ') : '');

const lastAt = (c: Conversation) => new Date(c.last_message?.created_at ?? c.last_message_at).getTime();

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-[#ECFDF5] text-[#047857]',
  in_progress: 'bg-[#EFF6FF] text-[#1D4ED8]',
  booked: 'bg-[#F5F3FF] text-[#6D28D9]',
  cancelled: 'bg-[#F5F5F0] text-[#6B6B6B]',
};

const Messages = () => {
  const { activePropertyId, activeProperty } = useActiveProperty();
  const { user } = useAuth();
  // "Sam: â€¦" when another household member sent the latest message.
  const preview = (lm: NonNullable<Conversation['last_message']>) => {
    const body = lm.body || 'Sent an attachment';
    const byHousehold = lm.sender_side === 'homeowner' && lm.sender_name && String(lm.sender) !== String(user?.id);
    return byHousehold ? `${lm.sender_name}: ${body}` : body;
  };
  const url = activePropertyId ? `${CONVERSATIONS_URL}?property=${activePropertyId}` : CONVERSATIONS_URL;
  const { data, isLoading } = useFetch<{ data?: { conversations?: Conversation[] } }>(url, {
    queryKey: [CONVERSATIONS_URL, activePropertyId],
    refetchInterval: 20000,
  });
  const conversations: Conversation[] = useMemo(() => data?.data?.conversations ?? [], [data]);

  const [search, setSearch] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [active, setActive] = useState<Conversation | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      c => c.other_party.name?.toLowerCase().includes(q) || c.job_title?.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  // One card per tradesperson; their jobs become threads inside it. Groups and
  // threads are both ordered newest-activity first.
  const groups = useMemo(() => {
    const byTrader = new Map<string, Conversation[]>();
    for (const c of filtered) {
      const key = c.other_party.id;
      byTrader.set(key, [...(byTrader.get(key) ?? []), c]);
    }
    return [...byTrader.values()]
      .map(convs => [...convs].sort((a, b) => lastAt(b) - lastAt(a)))
      .sort((a, b) => lastAt(b[0]) - lastAt(a[0]));
  }, [filtered]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const traderCount = new Set(conversations.map(c => c.other_party.id)).size;
  const unreadTotal = conversations.reduce((n, c) => n + (c.unread_count || 0), 0);
  const propertyLabel = activeProperty?.name || activeProperty?.address;

  const openChat = (c: Conversation) => {
    setActive(c);
    setChatOpen(true);
  };

  // Deep link from a message notification: ?job=<job id>&from=<sender name>.
  // Conversations are scoped to the active property, so a miss just shows the list.
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkJob = searchParams.get('job');
  useEffect(() => {
    if (!deepLinkJob || isLoading) return;
    const from = searchParams.get('from');
    const matches = conversations.filter(c => c.job === deepLinkJob).sort((a, b) => lastAt(b) - lastAt(a));
    const hit = matches.find(c => c.other_party.name === from) ?? matches[0];
    if (hit) {
      setActive(hit);
      setChatOpen(true);
    }
    setSearchParams({}, { replace: true });
  }, [deepLinkJob, isLoading, conversations, searchParams, setSearchParams]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-[20px] p-4 sm:p-6 border border-[#E8E8E3]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 bg-white rounded-full flex items-center justify-center border border-[#E8E8E3]">
              <MessageSquare className="w-5 h-5 text-[#FBBF24]" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#6B6B6B]">Chat with your tradespeople</p>
              <h1 className="text-[#1A1A1A] text-xl font-semibold">Messages</h1>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="rounded-[14px] bg-[#F5F5F0] p-4">
              <p className="text-xs text-[#6B6B6B]">Tradespeople</p>
              <p className="text-2xl font-semibold text-[#1A1A1A] mt-1">{traderCount}</p>
            </div>
            <div className="rounded-[14px] bg-[#F5F5F0] p-4">
              <p className="text-xs text-[#6B6B6B]">Conversations</p>
              <p className="text-2xl font-semibold text-[#1A1A1A] mt-1">{conversations.length}</p>
            </div>
            <div className="rounded-[14px] bg-[#F5F5F0] p-4">
              <p className="text-xs text-[#6B6B6B]">Unread</p>
              <p className={cn('text-2xl font-semibold mt-1', unreadTotal > 0 ? 'text-[#D97706]' : 'text-[#1A1A1A]')}>
                {unreadTotal}
              </p>
            </div>
            <div className="hidden sm:block rounded-[14px] bg-[#F5F5F0] p-4 min-w-0">
              <p className="text-xs text-[#6B6B6B]">Property</p>
              <p className="text-sm font-semibold text-[#1A1A1A] mt-2 truncate">{propertyLabel || '—'}</p>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-[20px] p-4 sm:p-5 border border-[#E8E8E3]">
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A1]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by tradesperson or job…"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-[#F5F5F0] text-sm text-[#1A1A1A] placeholder:text-[#A1A1A1] border border-transparent focus:border-[#FBBF24] focus:outline-none transition-colors"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-[72px] rounded-[16px] bg-[#F5F5F0] animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center text-center py-14 px-6 rounded-[16px] bg-[#FFFBEB] border border-[#FDE68A]">
              <div className="h-14 w-14 rounded-full bg-[#FEF3C7] flex items-center justify-center mb-4">
                <Inbox className="w-6 h-6 text-[#D97706]" strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-[#1A1A1A]">No conversations yet</p>
              <p className="mt-1 max-w-sm text-sm text-[#6B6B6B]">
                {propertyLabel ? `Nothing for ${propertyLabel} yet. ` : ''}
                When a tradesperson unlocks one of your jobs, you can chat with them here.
              </p>
              <Link
                to="/dashboard/job-leads"
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#1A1A1A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#333] transition-colors"
              >
                <Plus className="w-4 h-4" /> Post a job
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#6B6B6B]">No conversations match “{search}”.</p>
          ) : (
            <div className="space-y-2">
              {groups.map(convs => {
                const latest = convs[0];
                const trader = latest.other_party;
                const multi = convs.length > 1;
                const unreadCount = convs.reduce((n, c) => n + (c.unread_count || 0), 0);
                const unread = unreadCount > 0;
                const isOpen = multi && !!expanded[trader.id];
                return (
                  <div
                    key={trader.id}
                    className={cn(
                      'overflow-hidden rounded-[16px] border transition-all',
                      unread ? 'border-[#FDE68A] bg-[#FFFBEB]' : 'border-[#E8E8E3] bg-white',
                    )}
                  >
                    <button
                      onClick={() => (multi ? setExpanded(e => ({ ...e, [trader.id]: !e[trader.id] })) : openChat(latest))}
                      className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left hover:bg-black/[0.015]"
                    >
                      <Avatar className={cn('h-11 w-11 shrink-0 bg-[#F5F5F0]', unread && 'ring-2 ring-[#FBBF24] ring-offset-2')}>
                        <AvatarImage src={trader.profile_photo_url ?? undefined} alt={trader.name} />
                        <AvatarFallback className="bg-[#FEF9E7] text-sm font-semibold text-[#B45309]">
                          {trader.name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <TraderName
                              name={trader.name}
                              traderId={trader.role === 'trader' ? trader.id : null}
                              className={cn('truncate text-sm text-[#1A1A1A]', unread ? 'font-semibold' : 'font-medium')}
                            />
                            {multi && (
                              <span className="shrink-0 rounded-full bg-[#F5F5F0] px-2 py-0.5 text-[10px] font-medium text-[#6B6B6B]">
                                {convs.length} jobs
                              </span>
                            )}
                          </div>
                          <span className={cn('shrink-0 text-[11px]', unread ? 'font-semibold text-[#D97706]' : 'text-[#A1A1A1]')}>
                            {fmtWhen(latest.last_message?.created_at ?? latest.last_message_at)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-xs text-[#6B6B6B]">
                            {multi ? convs.map(c => c.job_title).join(' · ') : latest.job_title}
                          </span>
                          {!multi && latest.job_status && (
                            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                              STATUS_STYLE[latest.job_status] ?? 'bg-[#FEF9E7] text-[#B45309]')}>
                              {prettify(latest.job_status)}
                            </span>
                          )}
                          {!multi && !latest.job_property && <NoPropertyChip />}
                        </div>
                        {latest.last_message && (
                          <p className={cn('mt-1 truncate text-xs', unread ? 'text-[#1A1A1A]' : 'text-[#A1A1A1]')}>
                            {preview(latest.last_message)}
                          </p>
                        )}
                      </div>
                      {unread && (
                        <span className="ml-1 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#FBBF24] px-2 text-[11px] font-bold text-[#1A1A1A]">
                          {unreadCount}
                        </span>
                      )}
                      {multi && (
                        <ChevronDown className={cn('h-4 w-4 shrink-0 text-[#6B6B6B] transition-transform', isOpen && 'rotate-180')} />
                      )}
                    </button>

                    {isOpen && (
                      <div className="space-y-1.5 border-t border-[#E8E8E3] bg-white/60 px-3 py-2.5">
                        {convs.map(c => {
                          const threadUnread = c.unread_count > 0;
                          return (
                            <button
                              key={c.id}
                              onClick={() => openChat(c)}
                              className="flex w-full items-center gap-3 rounded-[12px] border border-[#E8E8E3] bg-white px-3 py-2.5 text-left hover:bg-[#FAFAF7]"
                            >
                              <Briefcase className="h-4 w-4 shrink-0 text-[#6B6B6B]" strokeWidth={1.5} />
                              <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <span className={cn('truncate text-sm text-[#1A1A1A]', threadUnread && 'font-semibold')}>
                                    {c.job_title}
                                  </span>
                                  {c.job_status && (
                                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                                      STATUS_STYLE[c.job_status] ?? 'bg-[#FEF9E7] text-[#B45309]')}>
                                      {prettify(c.job_status)}
                                    </span>
                                  )}
                                  {!c.job_property && <NoPropertyChip />}
                                </div>
                                {c.last_message && (
                                  <p className="mt-0.5 truncate text-xs text-[#A1A1A1]">{preview(c.last_message)}</p>

                                )}
                              </div>
                              <span className="shrink-0 text-[11px] text-[#A1A1A1]">
                                {fmtWhen(c.last_message?.created_at ?? c.last_message_at)}
                              </span>
                              {threadUnread && (
                                <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#FBBF24] px-1.5 text-[10px] font-bold text-[#1A1A1A]">
                                  {c.unread_count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        conversationId={active?.id ?? null}
        title={active?.other_party.name}
        subtitle={active?.job_title}
        avatarUrl={active?.other_party.profile_photo_url ?? null}
      />
    </DashboardLayout>
  );
};

export default Messages;
