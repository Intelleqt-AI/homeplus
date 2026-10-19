import type { ElementType, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  AlertCircle, AlertTriangle, ArrowRight, CalendarDays, Check, CheckCircle, ChevronRight, Clock, Cpu,
  FileText, Gauge, HelpCircle, Info, Leaf, Lightbulb, ListChecks, Minus, Upload, Wrench, X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { QuotePrefill } from '@/components/topbar/Quote';
import type { HomeMotStep } from '@/components/homemot/HomeMotWizard';
import {
  isRatedSystem, type SystemHealthCertificate, type SystemHealthItem, type SystemHealthSource,
  type SystemHealthAction, type SystemEventDraft, type SystemUploadDraft,
} from '@/lib/Api2';
import {
  ACTION_BUTTON, SYSTEM_TRADE, documentLink, eventLink, quotePrefillFromDraft, runSystemAction, logWorkLink,
} from './systemHealthActions';

const TONE = {
  good: { label: 'Good', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  warn: { label: 'Fair', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  poor: { label: 'Needs attention', chip: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
} as const;

const CERT_CHIP: Record<SystemHealthCertificate['status'], string> = {
  valid: TONE.good.chip,
  expiring: TONE.warn.chip,
  expired: TONE.poor.chip,
  missing: TONE.poor.chip,
  undated: 'bg-muted text-muted-foreground',
};

const PRIORITY_DOT: Record<SystemHealthAction['priority'], string> = {
  high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-muted-foreground/40',
};

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'd MMM yyyy');
  } catch {
    return iso;
  }
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function Bar({ value }: { value: number | null }) {
  const pct = value ?? 0;
  const color = value === null ? '' : pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      {value !== null && <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.max(pct, 3)}%` }} />}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: ElementType; title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> {title}
      </h3>
      {children}
    </section>
  );
}

function ReminderOnly() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground"
      title="A scheduled reminder, not a record of work done. It does not count towards the score.">
      Reminder only
    </span>
  );
}

function sourceText(src: SystemHealthSource) {
  switch (src.kind) {
    case 'document': return `From your document “${src.label}”`;
    case 'reminder': return `From your calendar reminder “${src.label}”`;
    case 'completed': return `Worked out from “${src.label}”, marked done`;
    case 'home_mot': return `From Home MOT: ${src.label}`;
    case 'job': return `From logged work “${src.label}”`;
  }
}

const HEADLINE_TONE: Record<string, string> = {
  poor: 'text-red-600 dark:text-red-400',
  warn: 'text-amber-700 dark:text-amber-300',
  good: 'text-emerald-700 dark:text-emerald-400',
  muted: 'text-muted-foreground',
};

/** How much a certificate line can be trusted, in words. */
function certEvidenceText(c: SystemHealthCertificate) {
  if (!c.source) return '';
  if (c.evidence === 'document') return `Verified · ${sourceText(c.source)}`;
  if (c.evidence === 'logged') return `Not verified · you marked “${c.source.label}” done in your calendar`;
  return `Not verified · your Home MOT answer (${c.source.label})`;
}

function certStatusText(c: SystemHealthCertificate) {
  if (c.status === 'missing') return 'Missing';
  if (c.status === 'undated') return 'No expiry date';
  if (c.status === 'expired') return `Expired ${fmtDate(c.expires)}`;
  if (c.status === 'expiring') return `Expires in ${plural(c.days_left ?? 0, 'day')}`;
  return `Valid until ${fmtDate(c.expires)}`;
}

interface Props {
  system: SystemHealthItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: ElementType;
  propertyId?: string | null;
  onUpload: (draft?: SystemUploadDraft) => void;
  onQuote: (prefill: QuotePrefill) => void;
  onMot: (step: HomeMotStep, focus?: string) => void;
  onLogWork: (draft: SystemEventDraft) => void;
}

/** A list row that opens one item (a calendar job or a document). */
const ROW_BUTTON = 'w-full text-left hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:bg-muted/60';

/** Everything behind one System Health score — or, for a system with no real
 *  records yet, what is missing and how to start. */
const SystemHealthDialog = ({
  system, open, onOpenChange, icon: Icon = Cpu, propertyId, onUpload, onQuote, onMot, onLogWork,
}: Props) => {
  const navigate = useNavigate();
  if (!system) return null;
  const d = system.details;
  const rated = isRatedSystem(system);
  const tone = rated ? TONE[system.tone ?? (system.score >= 80 ? 'good' : system.score >= 60 ? 'warn' : 'poor')] : null;

  const close = () => onOpenChange(false);
  const go = (path: string) => { close(); navigate(path); };
  const runAction = (a: SystemHealthAction) => {
    close();
    runSystemAction(a, system.key, { navigate, propertyId, onUpload, onQuote, onMot, onLogWork });
  };
  // Footer: the backend's drafts for this system (older backends: a generic job, plain pages).
  const shortcuts = d?.shortcuts;
  // Log work = complete the system's earlier tasks that are still open.
  const logWork = () => {
    close();
    navigate(logWorkLink(shortcuts?.log_work || system.key));
  };
  const uploadCertificate = () => { close(); onUpload(shortcuts?.upload); };
  const getQuotes = () => {
    close();
    onQuote(quotePrefillFromDraft(shortcuts?.quote ?? { title: `${system.name} work`, trade: SYSTEM_TRADE[system.key] }, propertyId));
  };

  const overdueJobs = d?.jobs.overdue ?? [];
  const upcomingJobs = d?.jobs.upcoming ?? [];
  const doneJobs = d?.jobs.done ?? [];
  const rentedChip = d?.context.rented
    ? (d.context.role === 'tenant' ? 'Rented home: landlord duties apply' : 'Landlord rules applied')
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90dvh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="p-5 pr-12 border-b border-border space-y-3">
          <div className="flex items-start gap-3">
            <span className="h-10 w-10 rounded-[12px] bg-muted text-foreground flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-[17px] font-semibold text-foreground">{system.name}</DialogTitle>
                {tone ? (
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', tone.chip)}>{tone.label}</span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Not rated yet</span>
                )}
              </div>
              {rated && system.headline && (
                <p className={cn('text-[12.5px] font-medium mt-0.5', HEADLINE_TONE[system.headline_tone ?? 'muted'])}>{system.headline}</p>
              )}
              <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">{system.note}</DialogDescription>
            </div>
            <div className="text-right shrink-0">
              {rated ? (
                <>
                  <span className="text-[30px] font-bold tracking-tight text-foreground leading-none">{system.score}</span>
                  <span className="text-[11px] text-muted-foreground ml-0.5">/100</span>
                </>
              ) : (
                <span className="text-[13px] font-medium text-muted-foreground">No score</span>
              )}
            </div>
          </div>
          {rated && <Bar value={system.score} />}
          {rated && d && d.basis.length > 0 && (
            <p className="text-[11.5px] text-muted-foreground">
              <span className="font-medium text-foreground">Based on:</span> {d.basis.join(' · ')}
              {d.confidence === 'low' && <> · <span className="text-amber-700 dark:text-amber-300">limited data, add more records for a firmer score</span></>}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 text-[10.5px]">
            {rated && system.forecast && system.status !== 'ok' && (
              <span className={cn('inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full',
                system.status === 'overdue' ? TONE.poor.chip : TONE.warn.chip)}>
                {system.status === 'overdue' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {system.forecast}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              <CalendarDays className="w-3 h-3" /> {system.next}
            </span>
            {rentedChip && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{rentedChip}</span>
            )}
            {d?.self_reported_only && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Self-reported</span>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6">
          {!d ? (
            <p className="text-[13px] text-muted-foreground">Details are not available yet. Refresh the page to load them.</p>
          ) : (
            <>
              {system.flag && (
                <div className={cn('flex gap-2 rounded-[12px] p-3 text-[12px]', TONE.poor.chip)}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{system.flag}</p>
                </div>
              )}

              {rated ? (
                <Section icon={Gauge} title="Why this score">
                  {d.cap && (
                    <div className={cn('flex gap-2 rounded-[12px] p-3 text-[12px]',
                      d.cap.applied && d.cap.kind === 'safety' ? TONE.poor.chip : TONE.warn.chip)}>
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>
                        {d.cap.applied
                          ? <>Held at <b>{d.cap.limit}</b>: {d.cap.reason}. It would otherwise be {d.cap.uncapped}.</>
                          : <>Can’t go above <b>{d.cap.limit}</b>: {d.cap.reason}.</>}
                      </p>
                    </div>
                  )}
                  <div className="divide-y divide-border rounded-[12px] border border-border">
                    {d.factors.map(f => (
                      <div key={f.key} className="p-3">
                        {/* Phone: label | score, bar on its own line. sm+: label | bar | score. */}
                        <div className="grid grid-cols-[minmax(0,1fr)_40px] sm:grid-cols-[minmax(0,1fr)_88px_40px] items-center gap-x-3 gap-y-1.5">
                          <p className="text-[13px] font-medium text-foreground min-w-0">
                            {f.label}
                            <span className="ml-1.5 text-[11px] font-normal text-muted-foreground whitespace-nowrap">
                              {f.share !== null ? `${f.share}% of score` : 'not measured'}
                            </span>
                          </p>
                          <div className="order-last col-span-2 sm:order-none sm:col-span-1"><Bar value={f.score} /></div>
                          <span className="text-right text-[13px] font-semibold tabular-nums text-foreground">
                            {f.score ?? <Minus className="w-3.5 h-3.5 inline text-muted-foreground" />}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-muted-foreground mt-1">{f.summary}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              ) : (
                <Section icon={HelpCircle} title="Why there is no score yet">
                  <div className="rounded-[12px] border border-border p-3 space-y-2 text-[12.5px] text-foreground">
                    <p>We only score {system.name} from real records, and nothing that counts has been recorded yet. Any one of these starts the score:</p>
                    <ul className="space-y-1 text-[12px] text-muted-foreground">
                      <li className="flex gap-2"><FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" /> A certificate uploaded to Documents</li>
                      <li className="flex gap-2"><Wrench className="w-3.5 h-3.5 mt-0.5 shrink-0" /> A service or job marked done in your calendar</li>
                      <li className="flex gap-2"><ListChecks className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Your saved Home MOT answers</li>
                    </ul>
                    <p className="text-[11.5px] text-muted-foreground">Reminders do not count: they are a schedule, not a record of work done.</p>
                  </div>
                </Section>
              )}

              {d.actions.length > 0 && (
                <Section icon={Lightbulb} title="What to do next">
                  <div className="space-y-2">
                    {d.actions.map((a, i) => {
                      const btn = ACTION_BUTTON[a.kind];
                      return (
                        <div key={i} className="flex items-start gap-3 rounded-[12px] border border-border p-3">
                          <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[a.priority])} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-foreground">{a.title}</p>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5">{a.detail}</p>
                          </div>
                          <button type="button" onClick={() => runAction(a)}
                            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors whitespace-nowrap">
                            <btn.icon className="w-3 h-3" /> {btn.label}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {d.certificates.length > 0 && (
                <Section icon={FileText} title="Certificates">
                  <div className="space-y-2">
                    {d.certificates.map(c => (
                      <div key={c.type} className={cn('rounded-[12px] border border-border p-3', !c.counts && 'opacity-80')}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-foreground">{c.label}</p>
                          <span className="flex flex-wrap items-center gap-1">
                            {c.status !== 'missing' && !c.verified && (
                              <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Not verified</span>
                            )}
                            <span className={cn('text-[10.5px] font-semibold px-2 py-0.5 rounded-full',
                              c.counts ? CERT_CHIP[c.status] : 'bg-muted text-muted-foreground')}>{certStatusText(c)}</span>
                          </span>
                        </div>
                        {c.requirement && <p className="text-[11.5px] text-muted-foreground mt-1">{c.requirement}</p>}
                        {!c.counts && (
                          <p className="text-[11.5px] text-muted-foreground mt-1">For reference: not required for this home, so it does not count towards the score.</p>
                        )}
                        {c.source && (
                          <p className="text-[11.5px] text-muted-foreground mt-1">
                            {certEvidenceText(c)}
                            {c.source.kind === 'document' && (
                              <button type="button"
                                onClick={() => go(c.source?.document_id ? documentLink(c.source.document_id) : '/dashboard/documents')}
                                className="ml-1.5 font-medium text-foreground underline underline-offset-2">Open</button>
                            )}
                          </p>
                        )}
                        {c.note && (
                          <p className="flex gap-1.5 text-[11.5px] text-amber-700 dark:text-amber-300 mt-1.5">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-px" /> {c.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {d.service && (
                <Section icon={Wrench} title="Servicing">
                  <div className="rounded-[12px] border border-border p-3 text-[12.5px] space-y-1">
                    {d.service.from_certificate ? (
                      <>
                        <p className="text-foreground">
                          <span className="font-semibold">Next {d.service.label.toLowerCase()}:</span> {fmtDate(d.service.due)}
                        </p>
                        <p className="text-[11.5px] text-muted-foreground">
                          Covered by your certificate{d.service.source ? ` (“${d.service.source.label}”)` : ''}: the inspection date is on it.
                        </p>
                      </>
                    ) : d.service.last ? (
                      <>
                        <p className="text-foreground">
                          <span className="font-semibold">Last {d.service.label.toLowerCase()}:</span> {fmtDate(d.service.last)}
                          {d.service.months_ago !== null && <span className="text-muted-foreground"> ({d.service.months_ago === 0 ? 'this month' : `${plural(d.service.months_ago, 'month')} ago`})</span>}
                        </p>
                        {d.service.source && (
                          <p className="text-[11.5px] text-muted-foreground">
                            {d.service.evidence === 'self_reported'
                              ? 'Not verified · your Home MOT answer. Log the work or upload a report to count it in full.'
                              : `Verified · ${sourceText(d.service.source)}`}
                            {d.service.evidence !== 'self_reported' && (d.service.source.document_id || d.service.source.event_id) && (
                              <button type="button"
                                onClick={() => {
                                  const src = d.service?.source;
                                  if (src?.document_id) go(documentLink(src.document_id));
                                  else if (src?.event_id) go(eventLink(src.event_id));
                                }}
                                className="ml-1.5 font-medium text-foreground underline underline-offset-2">Open</button>
                            )}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-foreground">No {d.service.label.toLowerCase()} logged yet.</p>
                    )}
                    {d.service.interval_months && !d.service.from_certificate && (
                      <p className={cn('text-[11.5px]', d.service.status === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                        Due every {plural(d.service.interval_months, 'month')}
                        {d.service.due && <> · {d.service.status === 'overdue' ? 'was due' : 'next due'} {fmtDate(d.service.due)}</>}
                      </p>
                    )}
                  </div>
                </Section>
              )}

              {(overdueJobs.length > 0 || upcomingJobs.length > 0 || doneJobs.length > 0) && (
                <Section icon={ListChecks} title="Jobs">
                  <div className="rounded-[12px] border border-border divide-y divide-border">
                    {overdueJobs.map(j => (
                      <button type="button" key={j.event_id} onClick={() => go(eventLink(j.event_id))}
                        className={cn('flex items-start gap-2.5 p-3', ROW_BUTTON)}>
                        <AlertCircle className={cn('w-4 h-4 shrink-0 mt-0.5', j.stale ? 'text-muted-foreground' : 'text-red-500')} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] font-medium text-foreground">{j.title}{j.reminder_only && <ReminderOnly />}</p>
                          <p className="text-[11.5px] text-muted-foreground">
                            Overdue since {fmtDate(j.date)}{(j.missed ?? 0) > 1 && ` · missed ${j.missed} times`}
                          </p>
                          {j.stale && <p className="text-[11.5px] text-muted-foreground">{j.stale} Not counted in the score.</p>}
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                      </button>
                    ))}
                    {upcomingJobs.map(j => (
                      <button type="button" key={j.event_id} onClick={() => go(eventLink(j.event_id))}
                        className={cn('flex items-start gap-2.5 p-3', ROW_BUTTON)}>
                        <Clock className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] font-medium text-foreground">{j.title}{j.reminder_only && <ReminderOnly />}</p>
                          <p className="text-[11.5px] text-muted-foreground">Due {fmtDate(j.date)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                      </button>
                    ))}
                    {doneJobs.map((j, i) => {
                      const body = (
                        <>
                          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] font-medium text-foreground">{j.title}</p>
                            <p className="text-[11.5px] text-muted-foreground">Done {fmtDate(j.date)}</p>
                          </div>
                        </>
                      );
                      return j.event_id ? (
                        <button type="button" key={`done-${i}`} onClick={() => go(eventLink(j.event_id as string))}
                          className={cn('flex items-start gap-2.5 p-3', ROW_BUTTON)}>
                          {body}
                          <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                        </button>
                      ) : (
                        <div key={`done-${i}`} className="flex items-start gap-2.5 p-3">{body}</div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {d.upcoming.length > 0 && (
                <Section icon={CalendarDays} title="Coming up">
                  <ul className="rounded-[12px] border border-border divide-y divide-border">
                    {d.upcoming.map((u, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-[12.5px]">
                        <span className="text-foreground min-w-0">{u.label}{u.reminder_only && <ReminderOnly />}</span>
                        <span className="text-muted-foreground tabular-nums whitespace-nowrap">{fmtDate(u.date)}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {d.checks.length > 0 && (
                <Section icon={Check} title="Home MOT checks">
                  <div className="flex flex-wrap gap-1.5">
                    {d.checks.map(c => (
                      <span key={c.slug} className={cn('inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full',
                        c.ticked === true ? TONE.good.chip : c.ticked === false ? TONE.poor.chip : 'bg-muted text-muted-foreground')}>
                        {c.ticked === true ? <Check className="w-3 h-3" /> : c.ticked === false ? <X className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {c.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Ticked, answered “no”, or not answered yet.</p>
                </Section>
              )}

              {d.documents.length > 0 && (
                <Section icon={FileText} title="On file">
                  <ul className="rounded-[12px] border border-border divide-y divide-border">
                    {d.documents.map(doc => (
                      <li key={doc.id}>
                        <button type="button" onClick={() => go(documentLink(doc.id))}
                          className={cn('flex items-center justify-between gap-3 px-3 py-2 text-[12.5px]', ROW_BUTTON)}>
                          <span className="text-foreground truncate">{doc.name}</span>
                          <span className={cn('flex items-center gap-1 whitespace-nowrap text-[11px]',
                            doc.status === 'expired' ? 'text-red-600 dark:text-red-400' : doc.status === 'expiring' ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground')}>
                            {doc.expires ? `${doc.status === 'expired' ? 'Expired' : 'Expires'} ${fmtDate(doc.expires)}` : 'No expiry'}
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-muted-foreground">Only certificates count towards the score; warranties and manuals are kept for reference.</p>
                </Section>
              )}

              {d.epc.length > 0 && (
                <Section icon={Leaf} title="From your official EPC">
                  <div className="rounded-[12px] border border-border divide-y divide-border">
                    {d.epc.map((f, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-medium text-foreground">{f.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{f.description}</p>
                        </div>
                        {f.rating !== null && (
                          <span className="flex items-center gap-1.5 shrink-0">
                            <span className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(n => (
                                <span key={n} className={cn('h-1.5 w-3 rounded-full', n <= (f.rating ?? 0)
                                  ? (f.rating ?? 0) >= 4 ? 'bg-emerald-500' : (f.rating ?? 0) === 3 ? 'bg-amber-400' : 'bg-red-500'
                                  : 'bg-muted')} />
                              ))}
                            </span>
                            <span className="text-[11px] text-muted-foreground w-16 text-right capitalize">{f.rating_label}</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Info className="w-3 h-3" /> Energy efficiency only. It does not change this score.
                  </p>
                </Section>
              )}
            </>
          )}
        </div>

        {/* ── Footer shortcuts ── */}
        <div className="flex flex-wrap justify-end gap-2 p-4 border-t border-border bg-card">
          <button type="button" onClick={logWork}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-border text-foreground hover:bg-muted transition-colors">
            <CalendarDays className="w-3.5 h-3.5" /> Log work
          </button>
          <button type="button" onClick={uploadCertificate}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-border text-foreground hover:bg-muted transition-colors">
            <Upload className="w-3.5 h-3.5" /> Upload certificate
          </button>
          <button type="button" onClick={getQuotes}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity">
            Get quotes <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SystemHealthDialog;
