import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Home, Building, Building2, Warehouse, LayoutGrid, HelpCircle, Loader2, LogOut } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import apiClient from '@/lib/apiClient';
import { toast } from '@/lib/toast';
import { formatPostcode, postcodeError } from '@/lib/postcode';
import { firstUsage, ROLE_FOR_USAGE, USAGE_OPTIONS, wordingFor, type Usage } from '@/lib/account';
import HomeSelector from '@/components/HomeSelector';
import { EMPTY_HOME, fetchHomeDetails, type HomeSelection } from '@/lib/homeLookup';
import {
  PROPERTY_TYPES as TYPE_OPTIONS, HEATING_TYPES, TENURE_TYPES,
  EMPTY_HOME_DETAILS, applyEpc, clearEpc, type HomeDetails,
} from '@/lib/propertyOptions';

type ApiErr = Error & { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };

const TYPE_ICONS: Record<string, typeof Home> = {
  detached: Home, semi_detached: Building2, terraced: LayoutGrid, flat: Building, bungalow: Warehouse, other: HelpCircle,
};
const PROPERTY_TYPES = TYPE_OPTIONS.map(t => ({ ...t, icon: TYPE_ICONS[t.value] ?? Home }));

const inputClass =
  'w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors';
const dateInputClass =
  'w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3.5 text-[17px] font-medium text-foreground outline-none transition-colors';

/** Shown instead of the app to an account with no home (its own or shared):
 *  everything in Home+ belongs to a home, so one is needed before going on. */
export default function AddFirstHome() {
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();
  const { setActivePropertyId } = useActiveProperty();
  const accountType = user?.account_type ?? 'homeowner';
  const usage: Usage = firstUsage(accountType);
  const wording = wordingFor(usage);

  // Home selection (Area → Postcode → Home from register)
  const [home, setHome] = useState<HomeSelection>(EMPTY_HOME);
  const [propertyName, setPropertyName] = useState('');
  const [propertyType, setPropertyType] = useState('');

  // Detail fields
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [heatingType, setHeatingType] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [tenure, setTenure] = useState('');
  const [floorArea, setFloorArea] = useState('');

  // EPC auto-fill tracking
  const detailsRef = useRef<HomeDetails>({ ...EMPTY_HOME_DETAILS, usage });
  const [details, setDetails] = useState<HomeDetails>(() => ({ ...EMPTY_HOME_DETAILS, usage }));
  const patchDetails = (patch: Partial<HomeDetails>) => {
    const next = { ...detailsRef.current, ...patch };
    detailsRef.current = next;
    setDetails(next);
    // Sync individual fields from EPC data
    if (patch.propertyType && !propertyType) setPropertyType(patch.propertyType);
    if (patch.floorArea) setFloorArea(patch.floorArea);
    if (patch.heatingType) setHeatingType(patch.heatingType);
    if (patch.yearBuilt) setYearBuilt(patch.yearBuilt);
    if (patch.tenure) setTenure(patch.tenure);
  };

  // Tenancy dates (renters only)
  const [tenancyStart, setTenancyStart] = useState('');
  const [tenancyEnd, setTenancyEnd] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleHomeChange = (h: HomeSelection) => {
    const prevId = home.homeId;
    setHome(h);
    if (h.homeId !== prevId) {
      patchDetails(clearEpc(detailsRef.current));
      if (h.homeId !== null) {
        fetchHomeDetails(h.homeId).then(epc => {
          patchDetails(applyEpc(clearEpc(detailsRef.current), epc));
        });
      }
    }
  };

  const save = async () => {
    if (!home.address.trim() || !home.postcode.trim()) {
      setError('Pick your home from the list, or type the address and place the pin.');
      return;
    }
    const pcErr = postcodeError(home.postcode);
    if (pcErr) { setError(pcErr); return; }
    if (!propertyType) { setError('Select a property type.'); return; }
    if (usage === 'rented_home' && tenancyStart && tenancyEnd && tenancyEnd < tenancyStart) {
      setError("The tenancy end date can't be before the start date.");
      return;
    }
    setError('');
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      name: propertyName.trim() || undefined,
      address: home.address.trim(),
      postcode: formatPostcode(home.postcode),
      location: home.area.trim() || undefined,
      property_type: propertyType,
      usage,
      role: ROLE_FOR_USAGE[usage],
      bedrooms: bedrooms ? parseInt(bedrooms, 10) : 0,
      bathrooms: bathrooms ? parseInt(bathrooms, 10) : 0,
      ...(heatingType ? { heating_type: heatingType } : {}),
      ...(yearBuilt ? { year_built: parseInt(yearBuilt, 10) } : {}),
      ...(tenure ? { tenure } : {}),
      ...(floorArea ? { floor_area: parseInt(floorArea, 10) } : {}),
      ...(details.builtForm ? { built_form: details.builtForm } : {}),
      ...(details.ageBand ? { construction_age_band: details.ageBand } : {}),
      ...(details.wallConstruction ? { wall_construction: details.wallConstruction } : {}),
      ...(home.lat !== null ? { latitude: home.lat } : {}),
      ...(home.lng !== null ? { longitude: home.lng } : {}),
      ...(home.uprn ? { uprn: home.uprn } : {}),
      ...(home.certificateNumber ? { epc_certificate: home.certificateNumber } : {}),
      ...(usage === 'rented_home' && tenancyStart ? { tenancy_start: tenancyStart } : {}),
      ...(usage === 'rented_home' && tenancyEnd ? { tenancy_end: tenancyEnd } : {}),
    };

    try {
      const { data: res } = await apiClient.post('/api/v1/properties/', payload);
      const id = res?.data?.id ?? res?.id;
      toast.success('Home added.');
      await queryClient.invalidateQueries({
        predicate: q => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('/api/v1/properties/'),
      });
      if (id) setActivePropertyId(id);
    } catch (err) {
      const apiErr = err as ApiErr;
      const msg = apiErr?.response?.data?.message
        || Object.values(apiErr?.response?.data?.errors ?? {}).flat()[0]
        || 'Could not add your home. Check the details and try again.';
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12" data-page="add-first-home">
      <div className="mx-auto w-full max-w-lg space-y-7">
        {/* Welcome heading */}
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
            <Home className="h-7 w-7 text-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-[15px] text-muted-foreground">
            Add a home to get started. Everything in Home+ belongs to a home.
          </p>
        </div>

        {/* Property name */}
        <input
          type="text"
          value={propertyName}
          onChange={e => { setPropertyName(e.target.value); setError(''); }}
          placeholder={wording === 'property' ? 'Property name (e.g. Flat 2, Oxford Road)' : 'Property name (e.g. Main Home)'}
          className={inputClass}
        />

        {/* Area → Postcode → Home picker */}
        <HomeSelector value={home} onChange={h => { handleHomeChange(h); setError(''); }} wording={wording} />

        {/* Property type grid */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Property type *</label>
          <div className="grid grid-cols-3 gap-2.5">
            {PROPERTY_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => { setPropertyType(t.value); setError(''); }}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3.5 px-2 transition-all ${
                  propertyType === t.value
                    ? 'border-accent bg-gradient-hero text-accent-foreground'
                    : 'border-border bg-card text-foreground hover:border-foreground'
                }`}
              >
                <t.icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Usage (read-only display — pre-set from account type) */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">How you use this property</label>
          <Select value={usage} disabled>
            <SelectTrigger className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3 h-auto text-[15px] font-medium text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USAGE_OPTIONS.map(u => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Bedrooms</label>
            <input type="number" min="0" max="20" value={bedrooms} onChange={e => setBedrooms(e.target.value)}
              placeholder="e.g. 3" className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Bathrooms</label>
            <input type="number" min="0" max="10" value={bathrooms} onChange={e => setBathrooms(e.target.value)}
              placeholder="e.g. 1" className={inputClass} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">Property Details (optional — helps with reminders &amp; compliance)</p>

        {/* Floor area */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
            Floor area (m²) <span className="font-normal normal-case text-muted-foreground/60">(optional)</span>
          </label>
          <input type="number" min="1" value={floorArea} onChange={e => setFloorArea(e.target.value)}
            placeholder="e.g. 85" className={inputClass} />
        </div>

        {/* Heating type */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Heating type</label>
          <Select value={heatingType} onValueChange={setHeatingType}>
            <SelectTrigger className="w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3 h-auto text-[15px] font-medium text-foreground">
              <SelectValue placeholder="Select heating type (optional)" />
            </SelectTrigger>
            <SelectContent>
              {HEATING_TYPES.map(h => (
                <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year built & Tenure */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
              Year built <span className="font-normal normal-case text-muted-foreground/60">(optional)</span>
            </label>
            <input type="number" min="1800" max={new Date().getFullYear()} value={yearBuilt}
              onChange={e => setYearBuilt(e.target.value)} placeholder="e.g. 1985" className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
              Tenure <span className="font-normal normal-case text-muted-foreground/60">(optional)</span>
            </label>
            <Select value={tenure} onValueChange={setTenure}>
              <SelectTrigger className="w-full rounded-2xl border-2 border-border focus:border-foreground bg-card px-4 py-3 h-auto text-[15px] font-medium text-foreground">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {TENURE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Renter tenancy dates — inline, both optional */}
        {usage === 'rented_home' && (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tenancy dates <span className="font-normal normal-case text-muted-foreground/60">(optional)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Start date</label>
                <input type="date" value={tenancyStart} onChange={e => { setTenancyStart(e.target.value); setError(''); }}
                  aria-label="Tenancy start date" className={dateInputClass} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">End / renewal date</label>
                <input type="date" value={tenancyEnd} min={tenancyStart || undefined}
                  onChange={e => { setTenancyEnd(e.target.value); setError(''); }}
                  aria-label="Tenancy end date" className={dateInputClass} />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          onClick={save}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-foreground text-white rounded-2xl py-4 text-[16px] font-semibold hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {submitting ? 'Adding…' : 'Add home and continue'}
        </button>

        <button
          type="button"
          onClick={() => signOut()}
          className="mx-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
