import { useEffect, useMemo, useState } from 'react';
import {
  Zap, Search, FileText, CheckCircle, ChevronLeft, ChevronRight, ExternalLink, RefreshCw, AlertTriangle,
  Leaf, BadgeCheck, Sparkles, Info, Building2, CalendarClock, Home, Flame, Gauge, ClipboardList,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import apiClient from '@/lib/apiClient';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { myRole } from '@/lib/household';
import {
  fetchEpc, linkEpcCertificate, refreshEpcCertificate, searchEpcRegister, unlinkEpcCertificate,
  type EpcAssessment, type EpcFact, type EpcSearchResponse,
} from '@/lib/Api2';

type EpcBand = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
const BANDS: EpcBand[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const isBand = (b: unknown): b is EpcBand => typeof b === 'string' && (BANDS as string[]).includes(b);

// Official EPC band colours and SAP score ranges.
const BAND_META: Record<EpcBand, { bg: string; text: string; score: string; label: string; widthPct: number }> = {
  A: { bg: '#008054', text: '#fff', score: '92+', label: 'Very energy efficient', widthPct: 38 },
  B: { bg: '#19b459', text: '#fff', score: '81–91', label: 'Energy efficient', widthPct: 48 },
  C: { bg: '#8dce46', text: '#1A1A1A', score: '69–80', label: 'Good efficiency', widthPct: 58 },
  D: { bg: '#ffd500', text: '#1A1A1A', score: '55–68', label: 'Average efficiency', widthPct: 68 },
  E: { bg: '#fcaa65', text: '#1A1A1A', score: '39–54', label: 'Below average', widthPct: 78 },
  F: { bg: '#ef8023', text: '#fff', score: '21–38', label: 'Poor efficiency', widthPct: 88 },
  G: { bg: '#e9153b', text: '#fff', score: '1–20', label: 'Very poor efficiency', widthPct: 98 },
};

const GENERAL_TIPS: Record<'good' | 'mid' | 'poor', { title: string; desc: string }[]> = {
  good: [
    { title: 'Keep systems serviced', desc: 'An annual boiler or heat pump service keeps an efficient home efficient.' },
    { title: 'Smart controls', desc: 'Zoned smart heating controls can trim a further 10–15% off heating use.' },
  ],
  mid: [
    { title: 'Loft insulation to 270 mm', desc: 'Up to a quarter of heat can be lost through the roof.' },
    { title: 'Cavity wall insulation', desc: 'If your walls have an unfilled cavity, filling it is one of the best-value upgrades.' },
    { title: 'Heating controls', desc: 'A programmer, room thermostat and radiator valves (TRVs) let you heat only what you use.' },
  ],
  poor: [
    { title: 'Insulation first', desc: 'Loft and wall insulation usually make the biggest difference to comfort and bills.' },
    { title: 'Check grant support', desc: 'Homes rated E–G may qualify for government-funded insulation or heating upgrades.' },
    { title: 'Replace single glazing', desc: 'Modern double glazing can halve the heat lost through windows.' },
  ],
};

const RATING_WORDS = ['', 'Very poor', 'Poor', 'Average', 'Good', 'Very good'];
const COST_LABELS: Record<string, string> = { heating: 'Heating', hot_water: 'Hot water', lighting: 'Lighting' };
// Private rented sector minimum energy efficiency standards (England & Wales).
const LET_MINIMUM_NOW: EpcBand = 'E';
const LET_MINIMUM_2030: EpcBand = 'C';
const bandAtLeast = (band: EpcBand, min: EpcBand) => BANDS.indexOf(band) <= BANDS.indexOf(min);

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'd MMM yyyy');
  } catch {
    return iso;
  }
};
const money = (n?: number | null) => (n == null ? '—' : `£${n.toLocaleString('en-GB')}`);
const num = (n?: number | null) => (n == null ? '—' : n.toLocaleString('en-GB'));
/** The SAP band for a score (same thresholds for the environmental impact rating). */
const bandFor = (score?: number | null): EpcBand | null => {
  if (score == null) return null;
  if (score >= 92) return 'A';
  if (score >= 81) return 'B';
  if (score >= 69) return 'C';
  if (score >= 55) return 'D';
  if (score >= 39) return 'E';
  if (score >= 21) return 'F';
  return score >= 1 ? 'G' : null;
};
// Facts the energy and heat cards already show, so the full list does not repeat them.
const ENERGY_FACT_LABELS = new Set([
  'Environmental impact (CO₂) rating', 'Primary energy use', 'CO₂ emissions', 'CO₂ per m² of floor', 'Average home in England and Wales',
]);
const HEAT_FACT_LABELS = new Set(['Space heating needed', 'Water heating needed']);
const FACT_COLUMNS = [
  ['About the home', 'Renewables'],
  ['Heating and hot water', 'Windows, lighting and ventilation'],
  ['About the assessment'],
];

/** A coloured band chip, e.g. "D 66". */
const BandChip = ({ band, score }: { band: EpcBand | null; score?: number | null }) =>
  band ? (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap"
      style={{ background: BAND_META[band].bg, color: BAND_META[band].text }}>
      {band}{score != null ? <span className="font-semibold">{score}</span> : null}
    </span>
  ) : <span className="text-muted-foreground">—</span>;
const errorMessage = (err: unknown, fallback: string) => {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
};

type Source = 'register' | 'upload' | 'estimate' | 'manual' | null;

const SOURCE_BADGE: Record<Exclude<Source, null>, { label: string; cls: string; Icon: React.ElementType }> = {
  register: { label: 'Official · GOV.UK register', cls: 'bg-success/10 text-success border-success/30', Icon: BadgeCheck },
  upload: { label: 'Read from your certificate', cls: 'bg-muted text-foreground border-border', Icon: FileText },
  estimate: { label: 'AI estimate', cls: 'bg-warning/10 text-foreground border-warning/40', Icon: Sparkles },
  manual: { label: 'Set by you', cls: 'bg-muted text-muted-foreground border-border', Icon: Info },
};

const EnergyEPC = () => {
  const qc = useQueryClient();
  const { activeProperty: property, isLoading: propLoading } = useActiveProperty();
  const propertyId = property?.id ?? null;
  const linkedNumber = property?.epc_certificate_number || '';

  const { data: epcResp, isLoading: epcLoading } = useQuery({
    queryKey: ['epc', propertyId],
    queryFn: () => fetchEpc(propertyId),
    enabled: !!propertyId,
  });
  // The API answers {} (not null) when there is no rating yet, so require a real band.
  const epc: EpcAssessment | null = epcResp?.data && isBand(epcResp.data.currentBand) ? epcResp.data : null;

  // Which rating to show: a real certificate (register or upload) beats the user's
  // manual band, which beats an AI estimate.
  const realEpc = epc && (epc.source === 'register' || !epc.isEstimate) ? epc : null;
  const manualBand = isBand(property?.epc_band) ? property!.epc_band as EpcBand : null;
  const source: Source = realEpc
    ? realEpc.source === 'register' ? 'register' : 'upload'
    : manualBand ? 'manual' : epc ? 'estimate' : null;
  const shown = realEpc ?? (manualBand ? null : epc);
  const currentBand: EpcBand | null = isBand(shown?.currentBand) ? shown!.currentBand as EpcBand : manualBand;
  const potentialBand: EpcBand | null = isBand(shown?.potentialBand) ? shown!.potentialBand as EpcBand : null;
  const isOfficial = source === 'register';

  const daysLeft = realEpc?.validUntil ? differenceInCalendarDays(parseISO(realEpc.validUntil), new Date()) : null;
  const expired = daysLeft != null && daysLeft < 0;
  const expiringSoon = daysLeft != null && daysLeft >= 0 && daysLeft <= 180;

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['epc'] });
    qc.invalidateQueries({ queryKey: ['/api/v1/properties/'] });
    qc.invalidateQueries({ queryKey: ['event'] });
  };

  // ── finder ──
  const [finderOpen, setFinderOpen] = useState(false);
  const [postcode, setPostcode] = useState('');
  const [search, setSearch] = useState<EpcSearchResponse | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  useEffect(() => {
    setPostcode(property?.postcode ?? '');
    setSearch(null);
    setSelected(null);
    setFinderOpen(false);
    setConfirmUnlink(false);
  }, [propertyId, property?.postcode]);

  const [openRec, setOpenRec] = useState<number | null>(null);

  const searchMut = useMutation({
    mutationFn: () => searchEpcRegister(propertyId!, postcode.trim()),
    onSuccess: data => {
      setSearch(data);
      setSelected(data.suggested ?? data.results.find(r => r.linked)?.certificateNumber ?? (data.results.length === 1 ? data.results[0].certificateNumber : null));
    },
    onError: err => toast.error(errorMessage(err, 'The EPC register is not responding. Please try again.')),
  });

  const linkMut = useMutation({
    mutationFn: (number: string) => linkEpcCertificate(propertyId!, number),
    onSuccess: res => {
      invalidateAll();
      setFinderOpen(false);
      setSearch(null);
      toast.success(`EPC linked: band ${res.assessment?.currentBand ?? ''}`.trim());
    },
    onError: err => toast.error(errorMessage(err, 'Could not link that certificate. Please try again.')),
  });

  const unlinkMut = useMutation({
    mutationFn: () => unlinkEpcCertificate(propertyId!),
    onSuccess: () => {
      invalidateAll();
      setConfirmUnlink(false);
      toast.success('EPC link removed');
    },
    onError: err => toast.error(errorMessage(err, 'Could not remove the link.')),
  });

  const refreshMut = useMutation({
    mutationFn: () => refreshEpcCertificate(propertyId!),
    onSuccess: res => {
      invalidateAll();
      if (res.status === 'updated') toast.success(`New certificate found: band ${res.assessment?.currentBand ?? ''}`);
      else if (res.status === 'unchanged') toast.success('Up to date — this is still the latest certificate');
      else toast.error('This home is no longer listed on the register');
    },
    onError: err => toast.error(errorMessage(err, 'The EPC register is not responding. Please try again.')),
  });

  // The register search opens in a pop-up, so a long list of homes never stretches the page.
  const openFinder = () => {
    setSearch(null);
    setSelected(null);
    setFinderOpen(true);
    if (propertyId && postcode.trim()) searchMut.mutate();
  };

  // ── manual band ──
  const [saving, setSaving] = useState(false);
  const saveBand = async (band: EpcBand) => {
    if (!propertyId) return;
    setSaving(true);
    try {
      await apiClient.patch(`/api/v1/properties/${propertyId}/`, { epc_band: band });
      qc.invalidateQueries({ queryKey: ['/api/v1/properties/'] });
      toast.success(`EPC band saved as ${band}`);
    } catch {
      toast.error('Failed to save EPC band');
    } finally {
      setSaving(false);
    }
  };

  const costs = realEpc?.details.costs;
  const features = realEpc?.details.features ?? [];
  const d = realEpc?.details;
  const hasEnergyCard = !!d && (d.energyUseCurrent != null || d.environmentalCurrent != null || d.co2Current != null);
  const heat = d?.heatDemand;
  const hasHeatCard = !!heat && (heat.spaceHeating != null || heat.waterHeating != null);
  const facts: EpcFact[] = (d?.facts ?? []).filter(f =>
    !(hasEnergyCard && ENERGY_FACT_LABELS.has(f.label)) && !(hasHeatCard && HEAT_FACT_LABELS.has(f.label)));
  const factSections = facts.reduce<{ section: string; items: EpcFact[] }[]>((acc, f) => {
    const group = acc.find(g => g.section === f.section);
    if (group) group.items.push(f);
    else acc.push({ section: f.section, items: [f] });
    return acc;
  }, []);
  // Which sections share a column; anything new from the backend goes in the last one.
  const factColumns = FACT_COLUMNS.map(names => factSections.filter(g => names.includes(g.section)));
  factColumns[factColumns.length - 1].push(...factSections.filter(g => !FACT_COLUMNS.flat().includes(g.section)));
  const hasFacts = (d?.facts?.length ?? 0) > 0;
  const recommendations = shown?.recommendations ?? [];
  const rec = openRec != null ? recommendations[openRec] ?? null : null;
  const tipsKey = currentBand ? ('AB'.includes(currentBand) ? 'good' : 'CD'.includes(currentBand) ? 'mid' : 'poor') : null;
  const isLandlord = myRole(property) === 'landlord';
  const loading = propLoading || (!!propertyId && epcLoading);

  // The suggested/linked home goes first so it is visible without scrolling a long list.
  const orderedResults = useMemo(() => {
    if (!search) return [];
    const rank = (r: EpcSearchResponse['results'][number]) => (r.certificateNumber === search.suggested ? 0 : r.linked ? 1 : 2);
    return [...search.results].sort((x, y) => rank(x) - rank(y));
  }, [search]);

  const searchStatusText = useMemo(() => {
    if (!search) return null;
    switch (search.status) {
      case 'unavailable': return 'Automatic EPC lookup is not available right now. You can still set your band manually below.';
      case 'invalid_postcode': return 'Enter a full postcode, e.g. SW1A 1AA.';
      case 'not_found': return `No certificates are registered for ${search.postcode}. Homes only need an EPC when they are sold or let, so yours may not have one yet.`;
      default: return null;
    }
  }, [search]);

  return (
    <DashboardLayout>
      <div className="space-y-6 mx-auto w-full max-w-[1600px]">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 bg-card rounded-full flex items-center justify-center border border-border">
              <Zap className="w-5 h-5 text-accent" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-foreground text-xl font-semibold">Energy & EPC</h1>
              <p className="text-sm text-muted-foreground truncate">{property?.address || 'Energy Performance Certificate'}</p>
            </div>
          </div>
          <Link to="/dashboard/documents" className="self-start sm:self-auto shrink-0">
            <Button variant="outline" className="text-sm rounded-full h-10 gap-2">
              <FileText className="w-4 h-4" /> EPC documents
            </Button>
          </Link>
        </div>

        {/* ── Alerts ── */}
        {expired && (
          <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-[14px] px-5 py-4" role="alert">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">This EPC expired on {fmtDate(realEpc?.validUntil)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">You need a valid certificate before you sell or let this home. A new EPC is done by an accredited energy assessor.</p>
            </div>
          </div>
        )}
        {expiringSoon && (
          <div className="flex items-start gap-3 bg-warning/10 border border-warning/40 rounded-[14px] px-5 py-4">
            <CalendarClock className="w-5 h-5 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              This EPC expires in <strong>{daysLeft} day{daysLeft === 1 ? '' : 's'}</strong> ({fmtDate(realEpc?.validUntil)}). We have added a reminder to your calendar.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Certificate ── */}
          <div className="xl:col-span-2 bg-card rounded-[20px] p-4 md:p-6 border border-border flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <h2 className="text-base font-semibold text-foreground">Energy Performance Certificate</h2>
              {source && (() => {
                const b = SOURCE_BADGE[source];
                return (
                  <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border', b.cls)}>
                    <b.Icon className="w-3.5 h-3.5" /> {b.label}
                  </span>
                );
              })()}
            </div>

            <div className="flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="space-y-2">{BANDS.map(b => <div key={b} className="h-9 rounded-[6px] bg-muted animate-pulse" />)}</div>
            ) : (
              <div className="space-y-2 mb-6" aria-label="EPC rating chart">
                {BANDS.map(band => {
                  const m = BAND_META[band];
                  const isCurrent = band === currentBand;
                  const isPotential = band === potentialBand && potentialBand !== currentBand;
                  return (
                    <div key={band} className="flex items-center gap-2">
                      <div
                        className="h-9 min-w-[3rem] rounded-r-[6px] flex items-center px-3 gap-2"
                        style={{ width: `${m.widthPct * 0.8}%`, background: m.bg, opacity: currentBand && !isCurrent && !isPotential ? 0.55 : 1 }}
                      >
                        <span className="text-xs font-extrabold" style={{ color: m.text }}>{band}</span>
                        <span className="text-[11px] font-medium whitespace-nowrap hidden xs:inline" style={{ color: m.text }}>{m.score}</span>
                      </div>
                      {isCurrent && (
                        <span className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: m.bg, color: m.text }}>
                          Now{shown?.currentScore != null ? ` · ${shown.currentScore}` : ''}
                        </span>
                      )}
                      {isPotential && (
                        <span className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap border-2 text-foreground" style={{ borderColor: m.bg }}>
                          Potential{shown?.potentialScore != null ? ` · ${shown.potentialScore}` : ''}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && currentBand && (
              <div className="rounded-[12px] p-4 flex flex-wrap items-center gap-4 border border-border bg-muted/50">
                <div className="h-12 w-12 rounded-full flex items-center justify-center text-2xl font-extrabold shrink-0"
                  style={{ background: BAND_META[currentBand].bg, color: BAND_META[currentBand].text }}>
                  {currentBand}
                </div>
                <div className="flex-1 min-w-[10rem]">
                  <p className="font-semibold text-foreground">{BAND_META[currentBand].label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {shown?.currentScore != null ? <>Score <span className="font-medium text-foreground">{shown.currentScore}</span> of 100</> : <>Band score range {BAND_META[currentBand].score}</>}
                    {potentialBand && potentialBand !== currentBand ? <> · could reach <span className="font-medium text-foreground">{potentialBand}</span></> : null}
                  </p>
                </div>
              </div>
            )}

            {!loading && !currentBand && (
              <div className="rounded-[12px] p-5 bg-warning/10 border border-warning/40 text-center">
                <p className="text-sm font-medium text-foreground mb-1">No EPC rating yet</p>
                <p className="text-xs text-muted-foreground">Find your home on the government register, upload your certificate, or set your band manually.</p>
              </div>
            )}


            {source === 'estimate' && (
              <p className="mt-4 text-xs text-muted-foreground flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                This is an AI estimate from a file you uploaded, not an official rating. Find your home on the register for the real one.
              </p>
            )}
            </div>
          </div>

          {/* ── Right column ── (the last card stretches so both columns end on one line) */}
          <div className="flex flex-col gap-4 xl:[&>*:last-child]:flex-1">

            {/* Register link / finder */}
            <div className="bg-card rounded-[20px] p-5 border border-border">
              {linkedNumber ? (
                <>
                  <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-success" strokeWidth={1.75} />
                    Linked to the GOV.UK register
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {realEpc?.source === 'register' && realEpc.details.address ? <>{realEpc.details.address}<br /></> : null}
                    We re-check the register every month and tell you when a newer certificate appears.
                    {property?.epc_checked_at ? ` Last checked ${fmtDate(property.epc_checked_at)}.` : ''}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" disabled={refreshMut.isPending} onClick={() => refreshMut.mutate()}>
                      <RefreshCw className={cn('w-3.5 h-3.5', refreshMut.isPending && 'animate-spin')} /> Check now
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-foreground hover:bg-muted" onClick={openFinder}>Change</Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setConfirmUnlink(true)}>Not my home</Button>
                  </div>
                  {confirmUnlink && (
                    <div className="mt-3 rounded-[10px] bg-muted p-3 space-y-2">
                      <p className="text-xs text-foreground">Remove this certificate and its details from this property?</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" className="h-8 text-xs" disabled={unlinkMut.isPending} onClick={() => unlinkMut.mutate()}>
                          {unlinkMut.isPending ? 'Removing…' : 'Yes, remove'}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs text-foreground hover:bg-muted" onClick={() => setConfirmUnlink(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                    <Search className="w-4 h-4 text-accent" strokeWidth={1.75} />
                    Find your home's EPC
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">Search the official government register by postcode, then pick your address.</p>
                  <form className="flex gap-2" onSubmit={e => { e.preventDefault(); openFinder(); }}>
                    <Input
                      aria-label="Postcode"
                      placeholder="e.g. SW1A 1AA"
                      value={postcode}
                      onChange={e => setPostcode(e.target.value.toUpperCase())}
                      className="text-sm h-9 rounded-[8px] uppercase"
                      maxLength={8}
                    />
                    <Button type="submit" disabled={!propertyId || !postcode.trim()} className="h-9 px-3 rounded-[8px] text-xs shrink-0 gap-1.5">
                      <Search className="w-3.5 h-3.5" /> Search
                    </Button>
                  </form>
                </>
              )}
            </div>

            {/* Certificate details */}
            {realEpc && (
              <div className="bg-card rounded-[20px] p-5 border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                  Certificate details
                </h3>
                <dl className="divide-y divide-border">
                  {realEpc.certificateNumber && (
                    <div className="flex items-start justify-between gap-3 py-2">
                      <dt className="text-xs text-muted-foreground pt-0.5">Certificate</dt>
                      <dd className="text-[13px] font-medium text-foreground tabular-nums text-right">
                        {realEpc.govUrl ? (
                          <a href={realEpc.govUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                            {realEpc.certificateNumber} <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : realEpc.certificateNumber}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3 py-2">
                    <dt className="text-xs text-muted-foreground pt-0.5">Valid until</dt>
                    <dd className={cn('text-[13px] font-medium text-right', expired ? 'text-destructive' : expiringSoon ? 'text-warning' : 'text-foreground')}>
                      {fmtDate(realEpc.validUntil)}{expired ? ' (expired)' : ''}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3 py-2">
                    <dt className="text-xs text-muted-foreground pt-0.5">Assessed</dt>
                    <dd className="text-[13px] font-medium text-foreground text-right">{fmtDate(realEpc.assessmentDate ?? realEpc.registrationDate)}</dd>
                  </div>
                  {realEpc.registrationDate && realEpc.registrationDate !== realEpc.assessmentDate && (
                    <div className="flex items-start justify-between gap-3 py-2">
                      <dt className="text-xs text-muted-foreground pt-0.5">Lodged</dt>
                      <dd className="text-[13px] font-medium text-foreground text-right">{fmtDate(realEpc.registrationDate)}</dd>
                    </div>
                  )}
                  {realEpc.details.transactionType && (
                    <div className="flex items-start justify-between gap-3 py-2">
                      <dt className="text-xs text-muted-foreground pt-0.5">Reason</dt>
                      <dd className="text-[13px] font-medium text-foreground text-right">{realEpc.details.transactionType}</dd>
                    </div>
                  )}
                  {!hasFacts && realEpc.details.propertyType && (
                    <div className="flex items-start justify-between gap-3 py-2">
                      <dt className="text-xs text-muted-foreground pt-0.5">Property type</dt>
                      <dd className="text-[13px] font-medium text-foreground text-right">{realEpc.details.propertyType}</dd>
                    </div>
                  )}
                  {!hasFacts && realEpc.details.floorArea != null && (
                    <div className="flex items-start justify-between gap-3 py-2">
                      <dt className="text-xs text-muted-foreground pt-0.5">Floor area</dt>
                      <dd className="text-[13px] font-medium text-foreground text-right">{realEpc.details.floorArea} m²</dd>
                    </div>
                  )}
                  {!hasEnergyCard && realEpc.details.co2Current != null && (
                    <div className="flex items-start justify-between gap-3 py-2">
                      <dt className="text-xs text-muted-foreground pt-0.5">CO₂ per year</dt>
                      <dd className="text-[13px] font-medium text-foreground text-right">
                        {realEpc.details.co2Current} t{realEpc.details.co2Potential != null ? ` → ${realEpc.details.co2Potential} t` : ''}
                      </dd>
                    </div>
                  )}
                  {realEpc.source === 'upload' && realEpc.documentName && (
                    <div className="flex items-start justify-between gap-3 py-2">
                      <dt className="text-xs text-muted-foreground pt-0.5">From your document</dt>
                      <dd className="text-[13px] font-medium text-foreground text-right">
                        <Link to="/dashboard/documents" className="hover:underline [overflow-wrap:anywhere]">{realEpc.documentName}</Link>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Manual band (only when there is no official/real certificate) */}
            {!realEpc && (
              <div className="bg-card rounded-[20px] p-5 border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                  Set band manually
                </h3>
                <p className="text-xs text-muted-foreground mb-3">From a paper certificate, if your home isn't on the register.</p>
                <div className="grid grid-cols-7 gap-1">
                  {BANDS.map(band => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => saveBand(band)}
                      disabled={saving || !propertyId}
                      aria-pressed={band === manualBand}
                      title={BAND_META[band].label}
                      className="h-9 rounded-[6px] text-xs font-bold transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                      style={{
                        background: BAND_META[band].bg,
                        color: BAND_META[band].text,
                        boxShadow: band === manualBand ? '0 0 0 2px hsl(var(--foreground))' : undefined,
                      }}
                    >
                      {band}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rental rules */}
            {isLandlord && (
              <div className="bg-card rounded-[20px] p-5 border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                  Letting this home
                </h3>
                <ul className="space-y-2.5 text-xs">
                  <li className="flex items-start gap-2">
                    {!currentBand || expired || !realEpc ? (
                      <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    ) : bandAtLeast(currentBand, LET_MINIMUM_NOW) ? (
                      <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                    <span className="text-foreground">
                      <strong>Today:</strong>{' '}
                      {!realEpc || !currentBand
                        ? 'a valid EPC rated E or above is needed to let this home.'
                        : expired
                          ? 'this EPC has expired — you need a new one before a new tenancy.'
                          : bandAtLeast(currentBand, LET_MINIMUM_NOW)
                            ? `band ${currentBand} meets the legal minimum (E).`
                            : `band ${currentBand} is below the legal minimum (E). You need improvements or a registered exemption.`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    {currentBand && bandAtLeast(currentBand, LET_MINIMUM_2030)
                      ? <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      : <CalendarClock className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <span className="text-foreground">
                      <strong>From 1 Oct 2030:</strong> rented homes must reach band C.{' '}
                      {currentBand && bandAtLeast(currentBand, LET_MINIMUM_2030)
                        ? 'This home already does.'
                        : 'Landlords are expected to spend up to £10,000 per home on improvements.'}
                      {' '}A certificate rated C or better issued before 1 Oct 2029 counts until it expires.
                    </span>
                  </li>
                </ul>
                <a href="https://www.gov.uk/government/consultations/improving-the-energy-performance-of-privately-rented-homes-2025-update" target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Government guidance <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── Costs & features (official certificate only) ── */}
        {realEpc && (costs?.total_current != null || features.length > 0) && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {costs?.total_current != null && (
              <div className="bg-card rounded-[20px] p-4 md:p-6 border border-border">
                <h2 className="text-base font-semibold text-foreground mb-1">Estimated running costs</h2>
                <p className="text-xs text-muted-foreground mb-4">Per year, from the certificate (prices at the time of assessment).</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="text-left font-normal pb-2" />
                      <th className="text-right font-normal pb-2">Now</th>
                      <th className="text-right font-normal pb-2">After improvements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['heating', 'hot_water', 'lighting'] as const).map(k => costs?.[k] ? (
                      <tr key={k} className="border-t border-border">
                        <td className="py-2 text-foreground">{COST_LABELS[k]}</td>
                        <td className="py-2 text-right tabular-nums text-foreground">{money(costs[k]?.current)}</td>
                        <td className="py-2 text-right tabular-nums text-muted-foreground">{money(costs[k]?.potential)}</td>
                      </tr>
                    ) : null)}
                    <tr className="border-t border-border font-semibold">
                      <td className="py-2 text-foreground">Total</td>
                      <td className="py-2 text-right tabular-nums text-foreground">{money(costs.total_current)}</td>
                      <td className="py-2 text-right tabular-nums text-success">{money(costs.total_potential)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {features.length > 0 && (
              <div className={cn('bg-card rounded-[20px] p-4 md:p-6 border border-border', costs?.total_current != null ? 'xl:col-span-2' : 'xl:col-span-3')}>
                <h2 className="text-base font-semibold text-foreground mb-1">How your home performs</h2>
                <p className="text-xs text-muted-foreground mb-4">The assessor's rating of each part of the home.</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {features.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{f.name}</p>
                        <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{f.description}</p>
                      </div>
                      {f.rating != null && (
                        <div className="shrink-0 text-right" aria-label={`${RATING_WORDS[f.rating]} (${f.rating} of 5)`}>
                          <div className="flex gap-0.5 justify-end">
                            {[1, 2, 3, 4, 5].map(n => (
                              <span key={n} className={cn('h-1.5 w-3 rounded-full', n <= f.rating! ? (f.rating! >= 4 ? 'bg-success' : f.rating! === 3 ? 'bg-warning' : 'bg-destructive') : 'bg-muted')} />
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">{RATING_WORDS[f.rating]}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Energy use, emissions and heat demand (official certificate only) ── */}
        {realEpc && (hasEnergyCard || hasHeatCard) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasEnergyCard && d && (
              <div className="bg-card rounded-[20px] p-4 md:p-6 border border-border">
                <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  Energy use and emissions
                </h2>
                <p className="text-xs text-muted-foreground mb-4">From the certificate. "After improvements" assumes every recommendation is done.</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="text-left font-normal pb-2" />
                      <th className="text-right font-normal pb-2">Now</th>
                      <th className="text-right font-normal pb-2">After improvements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.environmentalCurrent != null && (
                      <tr className="border-t border-border">
                        <td className="py-2 text-foreground">Environmental impact (CO₂) rating</td>
                        <td className="py-2 text-right"><BandChip band={bandFor(d.environmentalCurrent)} score={d.environmentalCurrent} /></td>
                        <td className="py-2 text-right"><BandChip band={bandFor(d.environmentalPotential)} score={d.environmentalPotential} /></td>
                      </tr>
                    )}
                    {d.energyUseCurrent != null && (
                      <tr className="border-t border-border">
                        <td className="py-2 text-foreground">Primary energy use <span className="text-xs text-muted-foreground">kWh/m² a year</span></td>
                        <td className="py-2 text-right tabular-nums text-foreground">{num(d.energyUseCurrent)}</td>
                        <td className="py-2 text-right tabular-nums text-success">{num(d.energyUsePotential)}</td>
                      </tr>
                    )}
                    {d.co2Current != null && (
                      <tr className="border-t border-border">
                        <td className="py-2 text-foreground">CO₂ emissions <span className="text-xs text-muted-foreground">tonnes a year</span></td>
                        <td className="py-2 text-right tabular-nums text-foreground">{d.co2Current}</td>
                        <td className="py-2 text-right tabular-nums text-success">{d.co2Potential ?? '—'}</td>
                      </tr>
                    )}
                    {d.co2PerFloorArea != null && (
                      <tr className="border-t border-border">
                        <td className="py-2 text-foreground">CO₂ per m² of floor <span className="text-xs text-muted-foreground">kg a year</span></td>
                        <td className="py-2 text-right tabular-nums text-foreground">{num(d.co2PerFloorArea)}</td>
                        <td className="py-2 text-right text-muted-foreground">—</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {d.energyRatingAverage != null && shown?.currentScore != null && (
                  <p className="mt-4 text-xs text-muted-foreground flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      This home scores <span className="font-medium text-foreground">{shown.currentScore} ({currentBand})</span>.
                      The average home in England and Wales scores <span className="font-medium text-foreground">{d.energyRatingAverage} ({bandFor(d.energyRatingAverage)})</span>.
                    </span>
                  </p>
                )}
              </div>
            )}
            {hasHeatCard && heat && (
              <div className="bg-card rounded-[20px] p-4 md:p-6 border border-border">
                <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  Heat this home needs
                </h2>
                <p className="text-xs text-muted-foreground mb-4">The assessor's estimate for a year, in kilowatt hours (kWh).</p>
                <dl className="grid grid-cols-2 gap-3">
                  {heat.spaceHeating != null && (
                    <div className="rounded-[12px] border border-border bg-muted/40 p-3">
                      <dt className="text-xs text-muted-foreground">Space heating</dt>
                      <dd className="text-lg font-semibold text-foreground tabular-nums">{num(heat.spaceHeating)} <span className="text-xs font-normal text-muted-foreground">kWh</span></dd>
                    </div>
                  )}
                  {heat.waterHeating != null && (
                    <div className="rounded-[12px] border border-border bg-muted/40 p-3">
                      <dt className="text-xs text-muted-foreground">Water heating</dt>
                      <dd className="text-lg font-semibold text-foreground tabular-nums">{num(heat.waterHeating)} <span className="text-xs font-normal text-muted-foreground">kWh</span></dd>
                    </div>
                  )}
                </dl>
                {(heat.insulationSavings?.length ?? 0) > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-foreground mb-2">Insulation could cut space heating by</p>
                    <ul className="divide-y divide-border">
                      {heat.insulationSavings!.map(sv => (
                        <li key={sv.label} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <span className="text-foreground">{sv.label}</span>
                          <span className="tabular-nums text-success font-medium">{num(sv.kwh)} kWh a year</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Everything else on the certificate (official certificate only) ── */}
        {realEpc && factSections.length > 0 && (
          <div className="bg-card rounded-[20px] p-4 md:p-6 border border-border">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                Everything on your certificate
              </h2>
              {realEpc.govUrl && (
                <a href={realEpc.govUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  Official certificate on GOV.UK <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {/* Fixed columns: the home and its renewables, then heating and the fabric, then the assessment. */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              {factColumns.map((column, ci) => (
                <div key={ci} className="flex flex-col gap-6">
                  {column.map(group => (
                <section key={group.section}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-1">{group.section}</h3>
                  <dl className="mt-1.5 rounded-[12px] border border-border overflow-hidden divide-y divide-border">
                    {group.items.map(f => (
                      <div key={f.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                        <dt className="bg-muted/50 border-r border-border px-3 py-2 text-xs text-muted-foreground">{f.label}</dt>
                        <dd className="px-3 py-2 text-[13px] font-medium text-foreground text-right [overflow-wrap:anywhere]">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recommendations ── */}
        {currentBand && (recommendations.length > 0 || tipsKey) && (
          <div className="bg-card rounded-[20px] p-4 md:p-6 border border-border">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Leaf className="w-5 h-5 text-success" strokeWidth={1.5} />
                {recommendations.length > 0 ? (isOfficial ? 'Recommended by your assessor' : 'Recommended improvements') : 'General tips'}
              </h2>
              <a href="https://www.gov.uk/improve-energy-efficiency" target="_blank" rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Help with costs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {recommendations.length > 0
                ? recommendations.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setOpenRec(i)}
                    aria-label={`${r.title}: read more`}
                    className="group h-full text-left flex flex-col rounded-[12px] p-4 border border-border bg-muted/40 transition-colors hover:border-foreground/30 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex flex-1 items-start gap-3">
                      <span className="h-6 w-6 rounded-full bg-accent/20 text-foreground text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="min-w-0 flex flex-col self-stretch">
                        <p className="text-sm font-medium text-foreground">{r.title}</p>
                        {r.detail && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-3">{r.detail}</p>}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-auto pt-2 text-xs">
                          {r.indicativeCost && <span className="text-muted-foreground">Cost <span className="text-foreground font-medium">{r.indicativeCost}</span></span>}
                          {r.saving && <span className="text-muted-foreground">Saves <span className="text-success font-medium">{r.saving}</span></span>}
                          {isBand(r.bandAfter) && r.ratingAfter != null && (
                            <span className="text-muted-foreground">Rating after <span className="font-semibold" style={{ color: BAND_META[r.bandAfter].bg }}>{r.bandAfter} ({r.ratingAfter})</span></span>
                          )}
                        </div>
                        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                          Read more <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))
                : GENERAL_TIPS[tipsKey!].map((t, i) => (
                  <div key={i} className="rounded-[12px] p-4 border border-border bg-muted/40">
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.desc}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── What is an EPC ── */}
        {!loading && !currentBand && (
          <div className="bg-card rounded-[20px] p-4 md:p-6 border border-border">
            <h2 className="text-base font-semibold text-foreground mb-2">What is an EPC?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              An Energy Performance Certificate rates a home from <strong className="text-foreground">A (most efficient)</strong> to{' '}
              <strong className="text-foreground">G (least efficient)</strong>. You need one to sell or let a home, and it is valid for 10 years.
              Certificates are public, so if your home has had one you can find it above.
            </p>
          </div>
        )}

        {/* ── Links ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/dashboard/documents" className="group bg-card rounded-[16px] p-5 border border-border hover:border-accent transition-colors flex items-center gap-4">
            <div className="h-10 w-10 bg-accent/15 rounded-full flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-accent" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Upload your EPC</p>
              <p className="text-xs text-muted-foreground mt-0.5">We read the certificate number and match it to the register</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          </Link>
          <Link to="/dashboard/calendar" className="group bg-card rounded-[16px] p-5 border border-border hover:border-accent transition-colors flex items-center gap-4">
            <div className="h-10 w-10 bg-success/10 rounded-full flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5 text-success" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Compliance reminders</p>
              <p className="text-xs text-muted-foreground mt-0.5">EPC renewal and other checks in your calendar</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          </Link>
        </div>
      </div>

      {/* ── Register search pop-up ── */}
      <Dialog open={finderOpen} onOpenChange={open => { setFinderOpen(open); if (!open) { setSearch(null); setSelected(null); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-4 h-4 text-accent" strokeWidth={1.75} /> Find your home's EPC
            </DialogTitle>
            <DialogDescription>Search the official GOV.UK register by postcode, then pick your address.</DialogDescription>
          </DialogHeader>

          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (propertyId && postcode.trim()) { setSelected(null); searchMut.mutate(); } }}>
            <Input
              aria-label="Postcode"
              placeholder="e.g. SW1A 1AA"
              value={postcode}
              onChange={e => setPostcode(e.target.value.toUpperCase())}
              className="text-sm h-9 rounded-[8px] uppercase"
              maxLength={8}
            />
            <Button type="submit" disabled={!propertyId || !postcode.trim() || searchMut.isPending} className="h-9 px-3 rounded-[8px] text-xs shrink-0 gap-1.5">
              {searchMut.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </Button>
          </form>

          {searchMut.isPending && !search && (
            <div className="space-y-1.5" aria-hidden="true">
              {[0, 1, 2, 3].map(i => <div key={i} className="h-14 rounded-[10px] bg-muted animate-pulse" />)}
            </div>
          )}

          {searchStatusText && <p className="text-xs text-muted-foreground" role="status">{searchStatusText}</p>}

          {search?.status === 'ok' && (
            <div className="space-y-2 min-w-0">
              <p className="text-xs text-muted-foreground">{search.results.length} home{search.results.length === 1 ? '' : 's'} with a certificate in {search.postcode}</p>
                      <div className="max-h-[45dvh] overflow-y-auto space-y-1.5 pr-1" role="radiogroup" aria-label="Choose your address">
                        {orderedResults.map(r => {
                          const active = selected === r.certificateNumber;
                          const band = isBand(r.band) ? r.band : null;
                          return (
                            <button
                              key={r.certificateNumber}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setSelected(r.certificateNumber)}
                              className={cn(
                                'w-full text-left rounded-[10px] border px-3 py-2 transition-colors',
                                active ? 'border-foreground bg-muted' : 'border-border hover:bg-muted/60',
                              )}
                            >
                              <div className="flex items-start gap-2">
                                {band && (
                                  <span className="mt-0.5 h-6 w-6 shrink-0 rounded-[6px] text-xs font-extrabold flex items-center justify-center"
                                    style={{ background: BAND_META[band].bg, color: BAND_META[band].text }}>{band}</span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-foreground leading-snug [overflow-wrap:anywhere]">{r.address}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {r.registrationDate ? `Certificate ${fmtDate(r.registrationDate)}` : 'Certificate'}
                                    {r.expired ? ' · expired' : r.validUntil ? ` · valid to ${fmtDate(r.validUntil)}` : ''}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {search.suggested === r.certificateNumber && (
                                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-success/10 text-success inline-flex items-center gap-1"><Home className="w-3 h-3" /> Looks like your home</span>
                                    )}
                                    {r.linked && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Linked now</span>}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
              <p className="text-[11px] text-muted-foreground">Can't see your address? Your home may not have a certificate yet, or it's listed under a different postcode.</p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFinderOpen(false)}>Cancel</Button>
            <Button disabled={search?.status !== 'ok' || !selected || linkMut.isPending} onClick={() => selected && linkMut.mutate(selected)}>
              {linkMut.isPending ? 'Linking…' : 'This is my home'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Recommendation details pop-up ── */}
      <Dialog open={rec != null} onOpenChange={open => { if (!open) setOpenRec(null); }}>
        <DialogContent className="max-w-xl">
          {rec && (
            <>
              <DialogHeader>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Recommendation {openRec! + 1} of {recommendations.length}{isOfficial ? ' · from your assessor' : ''}
                </p>
                <DialogTitle className="text-lg leading-snug">{rec.title}</DialogTitle>
                <DialogDescription className="sr-only">Full details of this recommended improvement.</DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-2 gap-2.5">
                {rec.indicativeCost && (
                  <div className="rounded-[12px] border border-border bg-muted/40 p-3">
                    <dt className="text-[11px] text-muted-foreground">Indicative cost</dt>
                    <dd className="text-sm font-semibold text-foreground mt-0.5">{rec.indicativeCost}</dd>
                  </div>
                )}
                {rec.saving && (
                  <div className="rounded-[12px] border border-border bg-muted/40 p-3">
                    <dt className="text-[11px] text-muted-foreground">Typical saving</dt>
                    <dd className="text-sm font-semibold text-success mt-0.5">{rec.saving}</dd>
                  </div>
                )}
                {isBand(rec.bandAfter) && rec.ratingAfter != null && (
                  <div className="rounded-[12px] border border-border bg-muted/40 p-3">
                    <dt className="text-[11px] text-muted-foreground">Energy rating after</dt>
                    <dd className="mt-1"><BandChip band={rec.bandAfter} score={rec.ratingAfter} /></dd>
                  </div>
                )}
                {rec.environmentalAfter != null && (
                  <div className="rounded-[12px] border border-border bg-muted/40 p-3">
                    <dt className="text-[11px] text-muted-foreground">Environmental impact after</dt>
                    <dd className="mt-1"><BandChip band={bandFor(rec.environmentalAfter)} score={rec.environmentalAfter} /></dd>
                  </div>
                )}
              </dl>

              {rec.detail && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">{rec.detail}</p>}

              {isOfficial && (
                <p className="text-[11px] text-muted-foreground">
                  Ratings after each step assume the steps above it are done too, in order. Costs and savings are the assessor's estimates.
                </p>
              )}

              <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
                <a href="https://www.gov.uk/improve-energy-efficiency" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Help with costs <ExternalLink className="w-3 h-3" />
                </a>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={openRec === 0} onClick={() => setOpenRec(i => (i != null && i > 0 ? i - 1 : i))} aria-label="Previous recommendation">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={openRec === recommendations.length - 1} onClick={() => setOpenRec(i => (i != null && i < recommendations.length - 1 ? i + 1 : i))} aria-label="Next recommendation">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EnergyEPC;
