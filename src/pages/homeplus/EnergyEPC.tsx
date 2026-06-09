import { useState } from 'react';
import {
  Zap, Search, FileText, CheckCircle, ChevronRight,
  Info, ExternalLink, RefreshCw, AlertTriangle, Leaf,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/apiClient';
import { toast } from '@/lib/toast';

type EpcBand = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
const BANDS: EpcBand[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const BAND_META: Record<EpcBand, {
  bg: string; text: string; score: string;
  label: string; cost: string; widthPct: number;
}> = {
  A: { bg: '#008054', text: '#fff', score: '92–100', label: 'Very energy efficient', cost: '~£700/yr', widthPct: 38 },
  B: { bg: '#19b459', text: '#fff', score: '81–91', label: 'Energy efficient', cost: '~£950/yr', widthPct: 50 },
  C: { bg: '#8dce46', text: '#1A1A1A', score: '69–80', label: 'Good efficiency', cost: '~£1,300/yr', widthPct: 62 },
  D: { bg: '#ffd500', text: '#1A1A1A', score: '55–68', label: 'Average efficiency', cost: '~£1,800/yr', widthPct: 74 },
  E: { bg: '#fcaa65', text: '#7c3c00', score: '39–54', label: 'Below average', cost: '~£2,400/yr', widthPct: 83 },
  F: { bg: '#ef8023', text: '#fff', score: '21–38', label: 'Poor efficiency', cost: '~£3,200/yr', widthPct: 91 },
  G: { bg: '#e9153b', text: '#fff', score: '1–20', label: 'Very poor efficiency', cost: '~£4,000+/yr', widthPct: 100 },
};

const TIPS: Record<EpcBand, { title: string; desc: string }[]> = {
  A: [
    { title: 'Keep it up', desc: 'Your home is in the top efficiency band — maintain insulation and heating systems with annual servicing.' },
    { title: 'Consider solar export', desc: 'A battery storage system could help you store surplus solar energy and reduce bills further.' },
  ],
  B: [
    { title: 'Solar PV panels', desc: 'Adding solar panels could push you to band A and significantly cut electricity bills.' },
    { title: 'Smart heating controls', desc: 'A smart thermostat with zone control can save a further 10–15% on heating.' },
  ],
  C: [
    { title: 'Smart thermostat', desc: 'Upgrade to a smart thermostat — save 10–15% on heating bills with minimal effort.' },
    { title: 'Check loft insulation', desc: '270mm of loft insulation is the recommended depth. Top up if yours is shallower.' },
    { title: 'Draught proofing', desc: 'Seal gaps around doors and windows to prevent heat escaping — low cost, high impact.' },
  ],
  D: [
    { title: 'Cavity wall insulation', desc: 'If your home has cavity walls, insulating them can cut heating bills by up to 15%.' },
    { title: 'Boiler upgrade', desc: 'An A-rated condensing boiler is 90%+ efficient vs 70% for older models.' },
    { title: 'Loft insulation', desc: 'Up to 25% of heat is lost through the roof. 270mm insulation pays back in under 2 years.' },
  ],
  E: [
    { title: 'Insulation first', desc: 'Loft and wall insulation will have the biggest impact on both comfort and bills.' },
    { title: 'ECO4 scheme', desc: 'You may qualify for free insulation and a new boiler under the government ECO4 scheme.' },
    { title: 'Double glazing', desc: 'Replacing single glazing can reduce heat loss through windows by up to 50%.' },
  ],
  F: [
    { title: 'Urgent: insulation', desc: 'Significant heat loss is costing you — loft and wall insulation should be the priority.' },
    { title: 'Boiler replacement', desc: 'A modern condensing boiler could move you up 1–2 bands and save £500+/yr.' },
    { title: 'Government grants', desc: 'At band F you are likely eligible for the Great British Insulation Scheme and ECO4.' },
  ],
  G: [
    { title: 'Multiple improvements needed', desc: 'Band G homes typically need insulation, glazing, and heating upgrades together.' },
    { title: 'Free government support', desc: 'Contact your local council — band G homes often qualify for fully funded retrofits.' },
    { title: 'Heat pump consideration', desc: 'A heat pump combined with insulation can transform energy performance long-term.' },
  ],
};

const bandAlertLevel = (band: EpcBand | null) => {
  if (!band) return 'none';
  if ('AB'.includes(band)) return 'good';
  if (band === 'C' || band === 'D') return 'ok';
  return 'warning';
};

const EnergyEPC = () => {
  const qc = useQueryClient();
  const [postcode, setPostcode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: property, isLoading: propLoading } = useQuery({
    queryKey: ['property-raw'],
    queryFn: async () => {
      const { data: res } = await apiClient.get('/api/v1/properties/');
      const list: any[] = res.data ?? res.results ?? [];
      return list[0] ?? null;
    },
  });

  const currentBand: EpcBand | null = property?.epc_band ?? null;
  const propertyId: string | null = property?.id ?? null;
  const propertyPostcode: string = property?.postcode ?? '';

  const saveBand = async (band: EpcBand) => {
    if (!propertyId) { toast.error('No property found'); return; }
    setSaving(true);
    try {
      await apiClient.patch(`/api/v1/properties/${propertyId}/`, { epc_band: band });
      qc.invalidateQueries({ queryKey: ['property-raw'] });
      qc.invalidateQueries({ queryKey: ['property'] });
      toast.success(`EPC band saved as ${band}`);
    } catch {
      toast.error('Failed to save EPC band');
    } finally {
      setSaving(false);
    }
  };

  const handleLookup = async () => {
    const pc = (postcode.trim() || propertyPostcode.trim()).toUpperCase();
    if (!pc) { toast.error('Enter a postcode first'); return; }
    setLookupLoading(true);
    try {
      const res = await fetch(
        `https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${encodeURIComponent(pc)}&size=1`,
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      const band = json?.rows?.[0]?.['current-energy-rating'] as string | undefined;
      if (band && BANDS.includes(band as EpcBand)) {
        await saveBand(band as EpcBand);
      } else {
        toast.error('No EPC record found for this postcode — please select your band manually.');
      }
    } catch {
      toast.error('EPC lookup failed — check the postcode or select your band manually below.');
    } finally {
      setLookupLoading(false);
    }
  };

  const meta = currentBand ? BAND_META[currentBand] : null;
  const tips = currentBand ? TIPS[currentBand] : [];
  const alertLevel = bandAlertLevel(currentBand);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-[#E8E8E3]">
              <Zap className="w-5 h-5 text-[#FBBF24]" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-[#1A1A1A] text-xl font-semibold">Energy & EPC</h1>
              {property?.address
                ? <p className="text-sm text-[#6B6B6B]">{property.address}</p>
                : !propLoading && <p className="text-sm text-[#6B6B6B]">Energy Performance Certificate</p>}
            </div>
          </div>
          <Link to="/dashboard/documents">
            <Button variant="outline" className="text-sm rounded-full border-[#E8E8E3] h-10 gap-2">
              <FileText className="w-4 h-4" /> EPC Documents
            </Button>
          </Link>
        </div>

        {/* ── Top alert if band is poor ── */}
        {alertLevel === 'warning' && currentBand && (
          <div className="flex items-start gap-3 bg-[#FFF7ED] border border-[#FED7AA] rounded-[14px] px-5 py-4">
            <AlertTriangle className="w-5 h-5 text-[#EA580C] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#9A3412]">Your home is rated band {currentBand} — {BAND_META[currentBand].label.toLowerCase()}</p>
              <p className="text-xs text-[#C2410C] mt-0.5">
                Average annual energy cost: <strong>{BAND_META[currentBand].cost}</strong>. Improving to band C could save hundreds of pounds per year.
              </p>
            </div>
          </div>
        )}

        {alertLevel === 'good' && currentBand && (
          <div className="flex items-start gap-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[14px] px-5 py-4">
            <Leaf className="w-5 h-5 text-[#16A34A] mt-0.5 shrink-0" />
            <p className="text-sm text-[#15803D]">
              Excellent — band {currentBand} is one of the most efficient ratings. Estimated annual energy cost: <strong>{BAND_META[currentBand].cost}</strong>.
            </p>
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* EPC Band visualisation — left 2/3 */}
          <div className="lg:col-span-2 bg-white rounded-[20px] p-6 border border-[#E8E8E3]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#1A1A1A]">Energy Performance Certificate</h2>
              {currentBand && meta && (
                <span
                  className="text-sm px-3 py-1 rounded-full font-bold"
                  style={{ background: meta.bg, color: meta.text }}
                >
                  Band {currentBand}
                </span>
              )}
            </div>

            {/* A–G bars */}
            <div className="space-y-2 mb-6">
              {BANDS.map(band => {
                const m = BAND_META[band];
                const isActive = band === currentBand;
                return (
                  <div key={band} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#6B6B6B] w-4 text-right">{band}</span>
                    <div className="flex-1">
                      <div
                        className="h-9 rounded-r-[6px] flex items-center px-3 gap-2 transition-all duration-300"
                        style={{
                          width: `${m.widthPct}%`,
                          background: m.bg,
                          boxShadow: isActive ? `0 0 0 2px #1A1A1A, 0 0 0 4px ${m.bg}50` : undefined,
                          opacity: currentBand && !isActive ? 0.6 : 1,
                        }}
                      >
                        <span className="text-[11px] font-semibold" style={{ color: m.text }}>{m.score}</span>
                        {isActive && (
                          <span className="ml-auto text-[11px] font-bold whitespace-nowrap" style={{ color: m.text }}>
                            ◀ Your home
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Band summary card */}
            {currentBand && meta ? (
              <div
                className="rounded-[12px] p-4 flex items-center gap-4"
                style={{ background: meta.bg + '18', border: `1px solid ${meta.bg}40` }}
              >
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-2xl font-extrabold shrink-0"
                  style={{ background: meta.bg, color: meta.text }}
                >
                  {currentBand}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A1A1A]">{meta.label}</p>
                  <p className="text-sm text-[#6B6B6B] mt-0.5">
                    Score range <span className="font-medium text-[#1A1A1A]">{meta.score}</span> · Estimated annual cost{' '}
                    <span className="font-medium text-[#1A1A1A]">{meta.cost}</span>
                  </p>
                </div>
                <button
                  onClick={() => saveBand(currentBand)}
                  className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] underline shrink-0"
                >
                  Change band
                </button>
              </div>
            ) : !propLoading ? (
              <div className="rounded-[12px] p-5 bg-[#FFFBEB] border border-[#FDE68A] text-center">
                <p className="text-sm font-medium text-[#92400E] mb-1">No EPC band recorded yet</p>
                <p className="text-xs text-[#B45309]">Look up by postcode or select your band manually →</p>
              </div>
            ) : (
              <div className="h-16 rounded-[12px] bg-[#F5F5F0] animate-pulse" />
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Postcode lookup */}
            <div className="bg-white rounded-[20px] p-5 border border-[#E8E8E3]">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                Look up by postcode
              </h3>
              <p className="text-xs text-[#6B6B6B] mb-3">We search the UK EPC register automatically.</p>
              <div className="flex gap-2">
                <Input
                  placeholder={propertyPostcode || 'e.g. SW1A 1AA'}
                  value={postcode}
                  onChange={e => setPostcode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleLookup()}
                  className="text-sm h-9 rounded-[8px] border-[#E8E8E3] uppercase tracking-widest"
                  maxLength={8}
                />
                <Button
                  onClick={handleLookup}
                  disabled={lookupLoading}
                  className="h-9 px-3 rounded-[8px] bg-[#1A1A1A] hover:bg-[#333] text-white text-xs shrink-0 gap-1.5"
                >
                  {lookupLoading
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : 'Search'}
                </Button>
              </div>
            </div>

            {/* Manual band select */}
            <div className="bg-white rounded-[20px] p-5 border border-[#E8E8E3]">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#6B6B6B]" strokeWidth={1.5} />
                Set manually
              </h3>
              <p className="text-xs text-[#6B6B6B] mb-3">Select from your paper EPC certificate.</p>
              <div className="grid grid-cols-7 gap-1">
                {BANDS.map(band => (
                  <button
                    key={band}
                    onClick={() => saveBand(band)}
                    disabled={saving}
                    title={BAND_META[band].label}
                    className="h-9 rounded-[6px] text-xs font-bold transition-all duration-150 hover:scale-110 active:scale-95"
                    style={{
                      background: BAND_META[band].bg,
                      color: BAND_META[band].text,
                      boxShadow: band === currentBand ? `0 0 0 2px #1A1A1A` : undefined,
                      transform: band === currentBand ? 'scale(1.12)' : undefined,
                    }}
                  >
                    {band}
                  </button>
                ))}
              </div>
            </div>

            {/* EPC validity */}
            <div className="bg-white rounded-[20px] p-5 border border-[#E8E8E3]">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" strokeWidth={1.5} />
                EPC validity
              </h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                Certificates are valid for <strong>10 years</strong>. Required when selling or renting your home.
              </p>
              <Link to="/dashboard/documents">
                <Button variant="ghost" className="mt-3 h-8 text-xs text-[#1A1A1A] hover:bg-[#F5F5F0] px-0 gap-1">
                  Upload your EPC certificate <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Improvement tips ── */}
        {currentBand && tips.length > 0 && (
          <div className="bg-white rounded-[20px] p-6 border border-[#E8E8E3]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#FBBF24]" strokeWidth={1.5} />
                {'AB'.includes(currentBand) ? 'Maintain your efficiency' : 'How to improve your band'}
              </h2>
              {['E', 'F', 'G'].includes(currentBand) && (
                <a
                  href="https://www.gov.uk/improve-energy-efficiency"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1 transition-colors"
                >
                  Gov grants <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 bg-[#F9FAFB] rounded-[12px] p-4 border border-[#F3F4F6]">
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold"
                    style={{ background: (meta?.bg ?? '#FBBF24') + '25', color: meta?.bg ?? '#FBBF24' }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{tip.title}</p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── What is an EPC (shown when no band set) ── */}
        {!currentBand && !propLoading && (
          <div className="bg-white rounded-[20px] p-6 border border-[#E8E8E3]">
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-2">What is an EPC?</h2>
            <p className="text-sm text-[#6B6B6B] leading-relaxed mb-5">
              An Energy Performance Certificate rates your home from <strong>A (most efficient)</strong> to <strong>G (least efficient)</strong>.
              It's required when selling or renting, valid for 10 years, and gives you an estimated annual energy cost.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['A', 'C', 'E', 'G'] as EpcBand[]).map(band => {
                const m = BAND_META[band];
                return (
                  <div key={band} className="rounded-[12px] p-4 text-center border" style={{ borderColor: m.bg + '40', background: m.bg + '12' }}>
                    <div className="text-3xl font-extrabold mb-1" style={{ color: m.bg }}>{band}</div>
                    <p className="text-xs text-[#6B6B6B] leading-tight mb-1">{m.label}</p>
                    <p className="text-xs font-semibold text-[#1A1A1A]">{m.cost}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Links ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/dashboard/documents" className="group bg-white rounded-[16px] p-5 border border-[#E8E8E3] hover:border-[#FBBF24] transition-colors flex items-center gap-4">
            <div className="h-10 w-10 bg-[#FFFBEB] rounded-full flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#FBBF24]" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1A1A1A]">Upload EPC Certificate</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Store it safely in your documents</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#1A1A1A] transition-colors shrink-0" />
          </Link>

          <Link to="/dashboard/calendar" className="group bg-white rounded-[16px] p-5 border border-[#E8E8E3] hover:border-[#FBBF24] transition-colors flex items-center gap-4">
            <div className="h-10 w-10 bg-[#F0FDF4] rounded-full flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1A1A1A]">EICR & Compliance Reminders</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">View scheduled checks in your calendar</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#1A1A1A] transition-colors shrink-0" />
          </Link>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default EnergyEPC;
