import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import PropertyMapPicker from '@/components/PropertyMapPicker';
import { UK_LOCATIONS, LOCATION_POSTCODE } from '@/lib/ukLocations';
import { formatPostcode, isFullUkPostcode } from '@/lib/postcode';
import {
  fetchHomesPatiently,
  homeAddressText,
  locateHome,
  reversePin,
  searchPostcodes,
  type HomeSelection,
  type HomesResult,
  type LookupHome,
  type PostcodeOption,
} from '@/lib/homeLookup';

/**
 * Area → Postcode → Home picker with a map. Picking a postcode or home places the
 * pin and fills the address; moving or clicking the pin looks the address up again
 * and updates every field. Used on Sign up, and in Onboarding for people who signed
 * up with Google/Apple (no home yet).
 */
interface Props {
  value: HomeSelection;
  onChange: (next: HomeSelection) => void;
  error?: string;
}

const MANUAL = 'manual' as const;

function Dropdown({
  label, placeholder, display, disabled, open, onOpenChange, children, shouldFilter = true,
  onSearch, searching,
}: {
  label: string; placeholder: string; display: string; disabled?: boolean;
  open: boolean; onOpenChange: (o: boolean) => void; children: ReactNode;
  shouldFilter?: boolean; onSearch?: (q: string) => void; searching?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
              !display && 'text-muted-foreground',
            )}
          >
            <span className="truncate">{display || placeholder}</span>
            {searching ? <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-60" /> : <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-40" />}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0" align="start">
          <Command shouldFilter={shouldFilter}>
            <CommandInput placeholder={`Search ${label.toLowerCase()}…`} onValueChange={onSearch} />
            <CommandList>{children}</CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

const HomeSelector = ({ value, onChange, error }: Props) => {
  // Async lookups finish after renders, so they read the latest selection from here.
  const valueRef = useRef(value);
  valueRef.current = value;
  const emit = (patch: Partial<HomeSelection>) => {
    const next = { ...valueRef.current, ...patch };
    valueRef.current = next;
    onChange(next);
  };

  const [areaOpen, setAreaOpen] = useState(false);
  const [pcOpen, setPcOpen] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);

  const [pcOptions, setPcOptions] = useState<PostcodeOption[]>([]);
  const [pcQuery, setPcQuery] = useState('');
  const [pcSearching, setPcSearching] = useState(false);

  const [homes, setHomes] = useState<LookupHome[]>([]);
  const homesRef = useRef<LookupHome[]>([]);
  const [homesStatus, setHomesStatus] = useState<HomesResult['status'] | ''>('');
  const [loadingHomes, setLoadingHomes] = useState(false);
  const [selectedHome, setSelectedHome] = useState<number | typeof MANUAL | null>(null);
  const [locating, setLocating] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinNote, setPinNote] = useState('');
  const pinToken = useRef(0);

  const setHomeList = (list: LookupHome[], status: HomesResult['status'] | '') => {
    homesRef.current = list;
    setHomes(list);
    setHomesStatus(status);
  };

  const outcode = LOCATION_POSTCODE[value.area] ?? '';
  const areaIsListed = !value.area || value.area in LOCATION_POSTCODE;

  // A home that was already chosen (e.g. saved at signup, then "Change"): load its list.
  useEffect(() => {
    if (value.postcode && homesRef.current.length === 0 && !loadingHomes && !homesStatus) {
      void loadHomes(value.postcode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Postcode dropdown: server search as the user types (debounced).
  useEffect(() => {
    if (!pcOpen) return;
    const typed = pcQuery.toUpperCase().replace(/\s+/g, '');
    const rest = outcode && typed.startsWith(outcode) ? typed.slice(outcode.length) : typed;
    if (!outcode && typed.length < 2) {
      setPcOptions([]);
      return;
    }
    setPcSearching(true);
    let cancelled = false;
    const id = setTimeout(async () => {
      const results = await searchPostcodes(outcode, outcode ? rest : typed);
      if (!cancelled) {
        setPcOptions(results);
        setPcSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [pcOpen, pcQuery, outcode]);

  const typedPostcode = useMemo(
    () => (isFullUkPostcode(pcQuery) ? formatPostcode(pcQuery) : ''),
    [pcQuery],
  );
  const pcItems = useMemo(() => {
    const items = [...pcOptions];
    if (typedPostcode && !items.some(o => o.postcode === typedPostcode)) {
      items.unshift({ postcode: typedPostcode, latitude: null, longitude: null, admin_district: '' });
    }
    return items;
  }, [pcOptions, typedPostcode]);

  async function loadHomes(postcode: string): Promise<HomesResult | null> {
    setLoadingHomes(true);
    setHomeList([], '');
    const res = await fetchHomesPatiently(postcode);
    if (valueRef.current.postcode !== postcode) return null; // the user moved on
    setLoadingHomes(false);
    setHomeList(res.homes ?? [], res.status);
    return res;
  }

  const chooseArea = (area: string) => {
    setAreaOpen(false);
    pinToken.current++;
    setSelectedHome(null);
    setHomeList([], '');
    setPinNote('');
    emit({ area, postcode: '', address: '', uprn: '', certificateNumber: '', lat: null, lng: null, manual: false, homeId: null });
  };

  const choosePostcode = async (opt: PostcodeOption) => {
    setPcOpen(false);
    setPcQuery('');
    pinToken.current++;
    setSelectedHome(null);
    setPinNote('');
    emit({
      postcode: opt.postcode,
      area: opt.admin_district || valueRef.current.area,
      address: '', uprn: '', certificateNumber: '', manual: false, homeId: null,
      lat: opt.latitude, lng: opt.longitude,
    });
    const res = await loadHomes(opt.postcode);
    if (!res) return;
    if (res.status === 'not_found' || res.status === 'invalid_postcode') {
      emit({ postcode: '', lat: null, lng: null });
      setPinNote("We couldn't find that postcode.");
      return;
    }
    emit({
      area: res.area || valueRef.current.area,
      ...(valueRef.current.lat === null && res.latitude != null ? { lat: res.latitude, lng: res.longitude ?? null } : {}),
    });
  };

  const chooseHome = async (home: LookupHome) => {
    setHomeOpen(false);
    setSelectedHome(home.id);
    setPinNote('');
    pinToken.current++;
    emit({
      address: homeAddressText(home), uprn: home.uprn, certificateNumber: home.certificate_number, manual: false, homeId: home.id,
      ...(home.latitude != null ? { lat: home.latitude, lng: home.longitude } : {}),
    });
    if (home.latitude == null) {
      setLocating(true);
      const pos = await locateHome(home.id);
      setLocating(false);
      // Ignore the answer if the user picked something else meanwhile.
      if (pos && valueRef.current.address === homeAddressText(home)) emit({ lat: pos.latitude, lng: pos.longitude });
    }
  };

  const chooseManual = () => {
    setHomeOpen(false);
    setSelectedHome(MANUAL);
    pinToken.current++;
    emit({ address: '', uprn: '', certificateNumber: '', manual: true, homeId: null });
  };

  /** The pin was moved or the map clicked: look up what is there and update every field. */
  const handlePin = async (lat: number, lng: number) => {
    const token = ++pinToken.current;
    setPinNote('');
    setPinBusy(true);
    emit({ lat, lng });
    const r = await reversePin(lat, lng);
    if (token !== pinToken.current) return;
    if (r.status !== 'ok') {
      setPinBusy(false);
      setPinNote("We couldn't find an address at that spot. Move the pin, or pick your home from the lists.");
      return;
    }
    let list = homesRef.current;
    if (r.postcode !== valueRef.current.postcode) {
      emit({ postcode: r.postcode, area: r.area || valueRef.current.area, address: '', uprn: '', certificateNumber: '', manual: false, homeId: null });
      setSelectedHome(null);
      const res = await loadHomes(r.postcode);
      if (token !== pinToken.current || !res) return;
      list = res.homes ?? [];
    } else if (r.area) {
      emit({ area: r.area });
    }
    setPinBusy(false);
    const match = r.home_id ? list.find(h => h.id === r.home_id) : undefined;
    if (match) {
      setSelectedHome(match.id);
      emit({ address: homeAddressText(match), uprn: match.uprn, certificateNumber: match.certificate_number, manual: false, homeId: match.id, lat, lng });
    } else {
      setSelectedHome(MANUAL);
      emit({ address: r.address, uprn: '', certificateNumber: '', manual: true, homeId: null, lat, lng });
    }
  };

  const selectedHomeObj = typeof selectedHome === 'number' ? homes.find(h => h.id === selectedHome) : undefined;
  const homeDisplay =
    selectedHome === MANUAL || (value.manual && value.address)
      ? "My home isn't listed"
      : selectedHomeObj
        ? homeAddressText(selectedHomeObj)
        : value.address && !loadingHomes
          ? value.address
          : '';
  const usesOsm = homes.some(h => h.source === 'osm');

  return (
    <div className="space-y-4">
      <Dropdown
        label="Area"
        placeholder="Select your area"
        display={value.area}
        open={areaOpen}
        onOpenChange={setAreaOpen}
      >
        <CommandEmpty>No area found.</CommandEmpty>
        {!areaIsListed && (
          <CommandGroup heading="Your area">
            <CommandItem value={value.area} onSelect={() => setAreaOpen(false)}>
              <Check className="mr-2 h-3.5 w-3.5" />
              {value.area}
            </CommandItem>
          </CommandGroup>
        )}
        {UK_LOCATIONS.map(group => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map(item => (
              <CommandItem key={item} value={item} onSelect={() => chooseArea(item)}>
                <Check className={cn('mr-2 h-3.5 w-3.5', value.area === item ? 'opacity-100' : 'opacity-0')} />
                {item}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </Dropdown>
      <p className="-mt-2 text-xs text-muted-foreground">
        Not in the list? Search any UK postcode below, or click your home on the map.
      </p>

      <Dropdown
        label="Postcode"
        placeholder={outcode ? `Select a postcode in ${outcode}` : 'Search a postcode, e.g. E8 1AA'}
        display={value.postcode}
        open={pcOpen}
        onOpenChange={o => { setPcOpen(o); if (!o) setPcQuery(''); }}
        shouldFilter={false}
        onSearch={setPcQuery}
        searching={pcSearching}
      >
        {pcItems.length === 0 && (
          <CommandEmpty>
            {!outcode && pcQuery.replace(/\s+/g, '').length < 2 ? 'Type the start of a postcode.' : pcSearching ? 'Searching…' : 'No postcodes found.'}
          </CommandEmpty>
        )}
        <CommandGroup>
          {pcItems.map(o => (
            <CommandItem key={o.postcode} value={o.postcode} onSelect={() => void choosePostcode(o)}>
              <Check className={cn('mr-2 h-3.5 w-3.5', value.postcode === o.postcode ? 'opacity-100' : 'opacity-0')} />
              <span className="font-medium">{o.postcode}</span>
              {o.admin_district && <span className="ml-2 truncate text-xs text-muted-foreground">{o.admin_district}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
      </Dropdown>

      <Dropdown
        label="Home"
        placeholder={
          !value.postcode ? 'Select a postcode first'
            : loadingHomes ? 'Finding homes…'
              : homesStatus === 'unavailable' ? "Couldn't load homes: use \"My home isn't listed\""
                : 'Select your home'
        }
        display={homeDisplay}
        disabled={!value.postcode || loadingHomes}
        open={homeOpen}
        onOpenChange={setHomeOpen}
        searching={loadingHomes || locating}
      >
        <CommandEmpty>No homes match.</CommandEmpty>
        <CommandGroup>
          {homes.map(h => (
            <CommandItem key={h.id} value={`${h.id} ${h.address}`} onSelect={() => void chooseHome(h)}>
              <Check className={cn('mr-2 h-3.5 w-3.5 shrink-0', selectedHome === h.id ? 'opacity-100' : 'opacity-0')} />
              <span className="truncate">{homeAddressText(h)}</span>
            </CommandItem>
          ))}
          <CommandItem value="my home isn't listed" onSelect={chooseManual}>
            <Check className={cn('mr-2 h-3.5 w-3.5', selectedHome === MANUAL ? 'opacity-100' : 'opacity-0')} />
            My home isn&apos;t listed
          </CommandItem>
        </CommandGroup>
      </Dropdown>
      {value.postcode && !loadingHomes && homesStatus === 'ok' && (
        <p className="-mt-2 text-xs text-muted-foreground">
          {homes.length > 0 ? `${homes.length} homes found at ${value.postcode}.` : `No listed homes at ${value.postcode}.`}
          {usesOsm && ' Some addresses © OpenStreetMap contributors.'}
        </p>
      )}

      <div className="space-y-1.5">
          <Label htmlFor="home-address">Address</Label>
          <Input
            id="home-address"
            value={value.address}
            onChange={e => {
              setSelectedHome(MANUAL);
              emit({ address: e.target.value, uprn: '', certificateNumber: '', manual: true, homeId: null });
            }}
            placeholder="Fills in when you pick your home or move the pin"
          />
        </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-2">
          Exact location
          {(pinBusy || locating) && <Loader2 className="h-3.5 w-3.5 animate-spin opacity-60" />}
        </Label>
        <PropertyMapPicker
          lat={value.lat}
          lng={value.lng}
          hideSearch
          onChange={() => {}}
          onPinMove={handlePin}
          onMapClick={handlePin}
        />
        <p className="text-xs text-muted-foreground">
          Drag the pin, or click the map, to move it. The address and postcode update to match.
        </p>
      </div>

      {(pinNote || error) && <p className="text-sm text-destructive">{pinNote || error}</p>}
    </div>
  );
};

export default HomeSelector;
