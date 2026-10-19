import { formatDistanceToNow } from 'date-fns';
import {
  Briefcase, CalendarClock, CalendarDays, CheckCircle2, Clock, FileText,
  Flag, Home, KeyRound, MapPin, RefreshCw, Users,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TraderName from '@/components/trader/TraderName';
import { categoryConfig } from '@/lib/jobCategories';
import { TRADE_OPTIONS, getTradeCategoryLabel } from '@/lib/tradeCategories';
import { cn } from '@/lib/utils';

interface JobDetail {
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
}

interface JobFile {
  id: string;
  file_name: string;
  file_size: number | null;
  content_type: string;
  presigned_url: string | null;
}

interface BidSummary {
  id: string;
  conversation_id: string | null;
  amount?: string | number | null;
  previous_amount?: string | null;
  quote_history?: { amount: string; created_at: string }[];
  status?: string;
  company_name?: string;
  contractor_name?: string;
  bidder?: { first_name: string; last_name: string; email: string };
  tradepilot_profile: { business_name: string; user_id?: string } | null;
}

/** Full `/api/v1/jobs/{id}/` payload (JobLeadSerializer). */
export interface FullJob extends JobDetail {
  property_address?: string | null;
  /** "Access note for the trade" (a home that is let out). */
  access_note?: string;
  answers?: Record<string, unknown>;
  files?: JobFile[];
  todo_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface JobInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobDetail: JobDetail | null;
  job?: FullJob | null;
  bids: BidSummary[];
  conversationId: string | null;
}

const URGENCY_LABEL: Record<string, string> = {
  within_1_week: 'Within 1 week',
  within_2_weeks: 'Within 2 weeks',
  within_1_month: 'Within 1 month',
  within_2_months: 'Within 2 months',
  flexible: '3+ months / Flexible',
};

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-[#FEF9E7] text-[#B45309]',
  todo: 'bg-[#F5F3FF] text-[#6D28D9]',
  in_progress: 'bg-[#EFF6FF] text-[#1D4ED8]',
  completed: 'bg-[#ECFDF5] text-[#047857]',
  cancelled: 'bg-[#F5F5F0] text-[#6B6B6B]',
};

const QUESTION_TEXT: Record<string, string> = Object.fromEntries(
  categoryConfig.flatMap(c => c.questions.map(q => [q.output_key, q.question_text])),
);

const prettify = (s?: string) => (s ? s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : '');
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtSize = (b?: number | null) =>
  !b ? '' : b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

const bidderName = (b: BidSummary) =>
  b.tradepilot_profile?.business_name
  || b.company_name
  || b.contractor_name
  || `${b.bidder?.first_name ?? ''} ${b.bidder?.last_name ?? ''}`.trim()
  || 'A trader';

const Section = ({ title, icon: Icon, children }: { title: string; icon: typeof Clock; children: React.ReactNode }) => (
  <div>
    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6B6B6B]">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {title}
    </p>
    {children}
  </div>
);

const Fact = ({ icon: Icon, label, value, sub }: { icon: typeof Clock; label: string; value: string; sub?: string }) => (
  <div className="flex items-start gap-2.5 rounded-[12px] bg-[#F5F5F0] p-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#6B6B6B]" strokeWidth={1.5} />
    <div className="min-w-0">
      <p className="text-[11px] text-[#6B6B6B]">{label}</p>
      <p className="text-sm font-medium text-[#1A1A1A] break-words">{value}</p>
      {sub && <p className="text-[11px] text-[#A1A1A1]">{sub}</p>}
    </div>
  </div>
);

const JobInfoDialog = ({ open, onOpenChange, jobDetail, job, bids, conversationId }: JobInfoDialogProps) => {
  const j: FullJob | null = job ?? jobDetail;
  if (!j) return null;

  const tradeLabel = TRADE_OPTIONS.find(t => t.value === j.trade)?.label ?? prettify(j.trade);
  const resolvedCategory = j.category ? getTradeCategoryLabel(j.category) : '';
  const categoryLabel = resolvedCategory === j.category ? prettify(j.category) : resolvedCategory;
  const answers = Object.entries(j.answers ?? {}).filter(
    ([k, v]) => k !== 'description' && v !== undefined && v !== null && String(v).trim() !== '',
  );
  const files = j.files ?? [];
  const images = files.filter(f => f.content_type?.startsWith('image/') && f.presigned_url);
  const otherFiles = files.filter(f => !images.includes(f));
  const location = [j.location, j.postcode].filter(Boolean).join(', ');

  const timeline = [
    { label: 'Posted', at: j.created_at },
    { label: 'Booked', at: j.todo_at },
    { label: 'In progress', at: j.started_at },
    { label: 'Completed', at: j.completed_at },
  ].filter((s): s is { label: string; at: string } => !!s.at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">Job details</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Title + tags */}
          <div>
            <h3 className="text-lg font-semibold leading-snug text-[#1A1A1A] break-words">{j.title}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tradeLabel && (
                <span className="rounded-full border border-[#E8E8E3] bg-white px-2.5 py-0.5 text-xs text-[#1A1A1A]">{tradeLabel}</span>
              )}
              {categoryLabel && (
                <span className="rounded-full border border-[#E8E8E3] bg-white px-2.5 py-0.5 text-xs text-[#6B6B6B]">{categoryLabel}</span>
              )}
              {j.status && (
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLE[j.status] ?? 'bg-[#F5F5F0] text-[#6B6B6B]')}>
                  {prettify(j.status)}
                </span>
              )}
            </div>
          </div>

          {/* Key facts */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {j.created_at && (
              <Fact icon={CalendarDays} label="Posted on" value={fmtDateTime(j.created_at)}
                sub={formatDistanceToNow(new Date(j.created_at), { addSuffix: true })} />
            )}
            {j.urgency && <Fact icon={Clock} label="Timeframe" value={URGENCY_LABEL[j.urgency] ?? prettify(j.urgency)} />}
            {j.priority && <Fact icon={Flag} label="Priority" value={prettify(j.priority)} />}
            {j.preferred_date && <Fact icon={CalendarClock} label="Preferred date" value={fmtDate(j.preferred_date)} />}
            {j.property_address && <Fact icon={Home} label="Property" value={j.property_address} />}
            {location && <Fact icon={MapPin} label="Location" value={location} />}
            {j.updated_at && j.created_at && j.updated_at !== j.created_at && (
              <Fact icon={RefreshCw} label="Last updated" value={fmtDateTime(j.updated_at)} />
            )}
          </div>

          {/* Description */}
          {j.description && (
            <Section title="Description" icon={FileText}>
              <p className="whitespace-pre-wrap rounded-[12px] border border-[#E8E8E3] bg-white p-3 text-sm leading-relaxed text-[#1A1A1A]">
                {j.description}
              </p>
            </Section>
          )}

          {/* Access note for the trade (a home that is let out) */}
          {j.access_note?.trim() && (
            <Section title="Access note" icon={KeyRound}>
              <p className="whitespace-pre-wrap break-words rounded-[12px] border border-[#E8E8E3] bg-white p-3 text-sm leading-relaxed text-[#1A1A1A]" data-access-note>
                {j.access_note}
              </p>
            </Section>
          )}

          {/* Q&A */}
          {answers.length > 0 && (
            <Section title="Job questions" icon={Briefcase}>
              <div className="divide-y divide-[#E8E8E3] rounded-[12px] border border-[#E8E8E3] bg-white">
                {answers.map(([k, v]) => (
                  <div key={k} className="p-3">
                    <p className="text-xs text-[#6B6B6B]">{QUESTION_TEXT[k] ?? prettify(k)}</p>
                    <p className="mt-0.5 text-sm font-medium text-[#1A1A1A] whitespace-pre-wrap break-words">{String(v)}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Photos & files */}
          {files.length > 0 && (
            <Section title={`Photos & files (${files.length})`} icon={FileText}>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map(f => (
                    <a key={f.id} href={f.presigned_url!} target="_blank" rel="noopener noreferrer"
                      className="block aspect-square overflow-hidden rounded-[10px] border border-[#E8E8E3] bg-[#F5F5F0]">
                      <img src={f.presigned_url!} alt={f.file_name} className="h-full w-full object-cover transition-transform hover:scale-105" />
                    </a>
                  ))}
                </div>
              )}
              {otherFiles.length > 0 && (
                <div className={cn('space-y-1.5', images.length > 0 && 'mt-2')}>
                  {otherFiles.map(f => (
                    <a key={f.id} href={f.presigned_url ?? undefined} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-[10px] border border-[#E8E8E3] bg-white px-3 py-2 text-xs text-[#1A1A1A] hover:bg-[#FAFAF7]">
                      <FileText className="h-4 w-4 shrink-0 text-[#6B6B6B]" />
                      <span className="min-w-0 flex-1 truncate">{f.file_name}</span>
                      <span className="shrink-0 text-[#A1A1A1]">{fmtSize(f.file_size)}</span>
                    </a>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Progress */}
          {timeline.length > 0 && (
            <Section title="Progress" icon={CheckCircle2}>
              <ol className="relative ml-1.5 space-y-3 border-l border-[#E8E8E3] pl-4">
                {timeline.map(s => (
                  <li key={s.label} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#FBBF24] ring-2 ring-white" />
                    <p className="text-sm font-medium text-[#1A1A1A]">{s.label}</p>
                    <p className="text-xs text-[#6B6B6B]">{fmtDateTime(s.at)}</p>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* Traders */}
          <Section title={`Traders on this job (${bids.length})`} icon={Users}>
            {bids.length === 0 ? (
              <p className="text-xs text-[#6B6B6B]">No traders have purchased this job yet.</p>
            ) : (
              <div className="space-y-1.5">
                {bids.map(b => {
                  const isThis = b.conversation_id === conversationId;
                  const amount = b.amount != null && b.amount !== '' ? Number(b.amount) : null;
                  const previous = b.previous_amount != null ? Number(b.previous_amount) : null;
                  const history = (b.quote_history ?? []).filter(
                    (h, i, arr) => i === 0 || Number(h.amount) !== Number(arr[i - 1].amount),
                  );
                  return (
                    <div key={b.id}
                      className={cn('rounded-[10px] border px-3 py-2',
                        isThis ? 'border-[#FDE68A] bg-[#FFFBEB]' : 'border-[#E8E8E3] bg-white')}>
                      <div className="flex items-center gap-2">
                        <TraderName
                          name={bidderName(b)}
                          traderId={b.tradepilot_profile?.user_id}
                          className="min-w-0 flex-1 truncate text-sm text-[#1A1A1A]"
                        />
                        {isThis && (
                          <span className="hidden xs:inline shrink-0 rounded-full bg-[#FBBF24] px-2 py-0.5 text-[10px] font-semibold text-[#1A1A1A]">
                            You're chatting
                          </span>
                        )}
                        <span className="flex shrink-0 items-center gap-1.5 text-xs text-[#6B6B6B]">
                          {amount != null && previous != null && (
                            <span className="text-[11px] text-[#A1A1A1] line-through">£{previous.toLocaleString('en-GB')}</span>
                          )}
                          {amount != null ? <span className="font-semibold text-[#1A1A1A]">£{amount.toLocaleString('en-GB')}</span> : 'Awaiting quote'}
                        </span>
                      </div>
                      {history.length > 1 && (
                        <p className="mt-1 text-[11px] text-[#6B6B6B]">
                          Quote history: {history.map(h => `£${Number(h.amount).toLocaleString('en-GB')}`).join(' → ')}
                          {' · '}updated {fmtDate(history[history.length - 1].created_at)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobInfoDialog;
