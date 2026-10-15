import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle, BadgeCheck, Building2, CalendarClock, CheckCircle, Circle, ClipboardCheck, ExternalLink,
  FileText, Loader2, MinusCircle, XCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DocsUploadDialog from '@/components/docsUploadDialog';
import Quote, { type QuotePrefill } from '@/components/topbar/Quote';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ACTION_BUTTON, runSystemAction } from '@/components/insights/systemHealthActions';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import apiClient from '@/lib/apiClient';
import { fetchPrsChecklist, type PrsItem, type PrsStatus, type SystemUploadDraft } from '@/lib/Api2';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { myRole } from '@/lib/household';

const STATUS: Record<PrsStatus, { label: string; chip: string; Icon: typeof CheckCircle; icon: string }> = {
  done: { label: 'Done', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', Icon: CheckCircle, icon: 'text-emerald-600' },
  missing: { label: 'Missing', chip: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300', Icon: Circle, icon: 'text-red-500' },
  undated: { label: 'No expiry date', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', Icon: AlertTriangle, icon: 'text-amber-500' },
  expired: { label: 'Expired', chip: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300', Icon: XCircle, icon: 'text-red-500' },
  expiring: { label: 'Expiring soon', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', Icon: CalendarClock, icon: 'text-amber-500' },
  below_minimum: { label: 'Below band E', chip: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300', Icon: XCircle, icon: 'text-red-500' },
  not_needed: { label: 'Not needed', chip: 'bg-muted text-muted-foreground', Icon: MinusCircle, icon: 'text-muted-foreground' },
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return '';
  try { return format(parseISO(iso), 'd MMM yyyy'); } catch { return iso; }
};

function Row({ item, onAction }: { item: PrsItem; onAction: (i: PrsItem, a: PrsItem['actions'][number]) => void }) {
  const s = STATUS[item.status];
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3" data-prs-item={item.key}>
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <s.Icon className={cn('w-4 h-4 mt-0.5 shrink-0', s.icon)} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13.5px] font-semibold text-foreground">{item.label}</p>
            <span className={cn('text-[10.5px] font-semibold px-2 py-0.5 rounded-full', s.chip)}>{s.label}</span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5 break-words">{item.detail}</p>
        </div>
      </div>
      {item.actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-7 sm:pl-0 shrink-0">
          {item.actions.map((a, i) => {
            const Icon = ACTION_BUTTON[a.kind]?.icon ?? FileText;
            const primary = i === 0 && item.status !== 'done';
            return (
              <button key={i} type="button" onClick={() => onAction(item, a)}
                className={cn('inline-flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap',
                  primary ? 'bg-foreground text-background hover:opacity-90' : 'border border-border bg-card text-foreground hover:bg-muted')}>
                <Icon className="w-3 h-3" /> {a.title}
              </button>
            );
          })}
        </div>
      )}
    </li>
  );
}

/** PRS Database readiness for the active home: what the register needs and what is missing. */
const RentalRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeProperty, activePropertyId, properties, isLoading: homesLoading } = useActiveProperty();
  const pid = activePropertyId;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['prs-checklist', pid],
    queryFn: () => fetchPrsChecklist(pid as string),
    enabled: !!pid,
    staleTime: 0,
  });

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadPrefill, setUploadPrefill] = useState<{ name?: string; discipline?: string; docType?: string; category?: string }>();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quotePrefill, setQuotePrefill] = useState<QuotePrefill>();
  const [regNumber, setRegNumber] = useState('');
  const [regDate, setRegDate] = useState('');

  useEffect(() => {
    setRegNumber(data?.registration.number ?? '');
    setRegDate(data?.registration.registered_at ?? '');
  }, [data?.registration.number, data?.registration.registered_at]);

  const invalidate = () => ['prs-checklist', 'prs-summary', 'documents-summary', 'systems-health', '/api/v1/properties/']
    .forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));

  const saveRegistration = useMutation({
    mutationFn: (body: { prs_registration_number: string; prs_registered_at: string | null }) =>
      apiClient.patch(`/api/v1/properties/${pid}/`, body),
    onSuccess: (_r, body) => {
      toast.success(body.prs_registration_number ? 'Registration saved' : 'Registration removed');
      invalidate();
    },
    onError: () => toast.error('Could not save the registration.'),
  });

  const handlers = {
    navigate,
    propertyId: pid,
    onUpload: (d?: SystemUploadDraft) => {
      setUploadPrefill(d && { name: d.name, discipline: d.discipline, docType: d.doc_type, category: d.category });
      setUploadOpen(true);
    },
    onQuote: (p: QuotePrefill) => { setQuotePrefill(p); setQuoteOpen(true); },
    onMot: () => navigate('/dashboard'),
    onLogWork: () => navigate('/dashboard/calendar'),
  };

  const deadline = data?.deadline;

  // The register belongs to a let home: only shown while a Landlord home is selected.
  // Anything else (e.g. switching to your own home here) goes back to the dashboard.
  // While the selection is still resolving (homes loaded, none picked yet) keep waiting.
  const resolving = homesLoading || (!activeProperty && properties.length > 0);
  if (!resolving && myRole(activeProperty) !== 'landlord') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 mx-auto w-full max-w-[1100px]">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 bg-card rounded-full flex items-center justify-center border border-border">
            <ClipboardCheck className="w-5 h-5 text-accent" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-foreground text-xl font-semibold">Rental register</h1>
            <p className="text-sm text-muted-foreground truncate">
              {activeProperty?.name || activeProperty?.address || 'Private Rented Sector Database'}
            </p>
          </div>
        </div>

        {resolving || isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : isError || !data ? (
          <div className="bg-card rounded-[20px] p-6 border border-border text-sm text-muted-foreground flex items-center justify-between gap-3">
            Could not load the checklist. <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <>
            {/* ── What the register is ── */}
            <div className="bg-card rounded-[20px] p-5 md:p-6 border border-border space-y-3" data-section="deadline">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.75} />
                <div className="min-w-0 space-y-1.5">
                  <p className="text-sm font-semibold text-foreground">The Private Rented Sector (PRS) Database</p>
                  <p className="text-[13px] text-foreground">{deadline?.summary}</p>
                  <p className="text-[12px] text-muted-foreground">{deadline?.keep_current}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-muted text-foreground">Opens {fmtDate(deadline?.opens)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-foreground">Deadline {fmtDate(deadline?.final_deadline)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-foreground">£{deadline?.fee_gbp} per home per year</span>
                  </div>
                  <a href={deadline?.gov_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground pt-1">
                    Check your region's date on GOV.UK <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* ── Readiness ── */}
            <div className="bg-card rounded-[20px] p-5 md:p-6 border border-border" data-section="readiness">
              <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Ready to register</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{data.percent}%</p>
                </div>
                <p className="text-sm text-muted-foreground">{data.done} of {data.total} in place</p>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full', data.ready ? 'bg-emerald-500' : data.percent >= 50 ? 'bg-amber-400' : 'bg-red-500')}
                  style={{ width: `${Math.max(data.percent, 3)}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {([['Property details', data.details], ['Certificates', data.certificates]] as const).map(([title, items]) => (
                <section key={title} className="bg-card rounded-[20px] border border-border overflow-hidden" data-section={title}>
                  <h2 className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{title}</h2>
                  <ul className="divide-y divide-border">
                    {items.map(item => (
                      <Row key={item.key} item={item} onAction={(_i, a) => runSystemAction(a, 'prs', handlers)} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {/* ── Registration ── */}
            <div className="bg-card rounded-[20px] p-5 md:p-6 border border-border space-y-4" data-section="registration">
              <div className="flex items-start gap-3">
                {data.registration.registered
                  ? <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  : <ClipboardCheck className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {data.registration.registered ? 'Registered on the PRS Database' : 'Mark as registered'}
                  </p>
                  <p className="text-[12.5px] text-muted-foreground mt-0.5">{data.registration.detail}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-3 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="prs-number">Registration reference</Label>
                  <Input id="prs-number" value={regNumber} onChange={e => setRegNumber(e.target.value)} placeholder="From your PRS Database account" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prs-date">Date registered</Label>
                  <Input id="prs-date" type="date" value={regDate} onChange={e => setRegDate(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={!regNumber.trim() || saveRegistration.isPending}
                    onClick={() => saveRegistration.mutate({ prs_registration_number: regNumber.trim(), prs_registered_at: regDate || null })}
                  >
                    {saveRegistration.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </Button>
                  {data.registration.registered && (
                    <Button variant="outline" disabled={saveRegistration.isPending}
                      onClick={() => saveRegistration.mutate({ prs_registration_number: '', prs_registered_at: null })}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-[11.5px] text-muted-foreground">
                Once registered, we remind you to update the entry within {deadline?.update_days} days when you add a new gas
                safety certificate, EICR or EPC.
              </p>
            </div>
          </>
        )}
      </div>

      <DocsUploadDialog
        openForm={uploadOpen}
        setOpenForm={setUploadOpen}
        refetch={invalidate}
        prefillDiscipline="compliance"
        prefill={uploadPrefill}
      />
      <Quote open={quoteOpen} setOpen={setQuoteOpen} prefill={quotePrefill} />
    </DashboardLayout>
  );
};

export default RentalRegister;
