import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { fetchData } from '@/lib/Api';
import useFetch from '@/hooks/useFetch';
import { usePost } from '@/hooks/usePost';
import usePatch from '@/hooks/usePatch';
import useDelete from '@/hooks/useDelete';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  Building2,
  MapPin,
  Camera,
  Trash2,
  Pencil,
  Home,
  AlertCircle,
  ChevronsUpDown,
  Check,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { UK_LOCATIONS, LOCATION_POSTCODE } from '@/lib/ukLocations';
import PropertyMapPicker from '@/components/PropertyMapPicker';
import AddPropertyDialog from '@/components/property/AddPropertyDialog';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { memberRoleLabel, propertyNickname, usageOf } from '@/lib/household';
import { ROLE_FOR_USAGE, USAGE_OPTIONS, usageLabel, type Usage } from '@/lib/account';
import HomePeople from './HomePeople';
import { formatPostcode, postcodeError } from '@/lib/postcode';

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROPERTY_TYPES = [
  { value: 'detached', label: 'Detached' },
  { value: 'semi_detached', label: 'Semi-Detached' },
  { value: 'terraced', label: 'Terraced' },
  { value: 'flat', label: 'Flat' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'other', label: 'Other' },
];

/** What the property is to its owner, as a small coloured chip on a card. */
const USAGE_COLORS: Record<Usage, string> = {
  own_home: 'border-blue-300 text-blue-700 bg-blue-50',
  let: 'border-purple-300 text-purple-700 bg-purple-50',
  rented_home: 'border-orange-300 text-orange-700 bg-orange-50',
};

const TYPE_LABEL: Record<string, string> = Object.fromEntries(PROPERTY_TYPES.map(t => [t.value, t.label]));

const PAGE_SIZE = 20;

const fmtDay = (iso?: string | null) => {
  if (!iso) return undefined;
  try {
    return format(parseISO(iso), 'd MMM yyyy');
  } catch {
    return iso;
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  name: string;
  /** The name, else the first line of the address. */
  nickname?: string;
  address: string;
  postcode: string;
  location: string;
  property_type: string;
  role: string;
  /** Own home / let / rented home; older API rows only have `role`. */
  usage?: Usage;
  nation?: string;
  /** A renter's own tenancy dates and contents-insurance renewal (rented homes only). */
  tenancy_start?: string | null;
  tenancy_end?: string | null;
  contents_insurance_renewal?: string | null;
  bedrooms: number;
  bathrooms: number;
  cover_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  year_built: number | null;
  epc_band: string;
  tenure: string;
  heating_type: string;
  // About the building (filled from its EPC certificate at signup)
  floor_area?: number | null;
  built_form?: string;
  construction_age_band?: string;
  wall_construction?: string | null;
  // Letting details (PRS Database)
  rent_amount?: string | null;
  rent_frequency?: string;
  occupants?: number | null;
  households?: number | null;
  ownership_type?: string;
  freeholder_name?: string;
  freeholder_contact?: string;
  // Family members (optional â€” older API responses omit them)
  access?: 'owner' | 'member';
  owner_name?: string | null;
  is_shared?: boolean;
  member_count?: number;
  /** The role the app uses for the caller (a member's own role, else `role`). */
  my_role?: string;
  /** What the owner made a member on this home (incl. "family"); null for the owner. */
  member_role?: string | null;
}

export interface PropertyForm {
  name: string;
  address: string;
  postcode: string;
  location: string;
  property_type: string;
  usage: Usage;
  bedrooms: string;
  bathrooms: string;
  latitude: number | null;
  longitude: number | null;
  year_built: string;
  epc_band: string;
  tenure: string;
  heating_type: string;
  floor_area: string;
  wall_construction: string;
  rent_amount: string;
  rent_frequency: string;
  occupants: string;
  households: string;
  ownership_type: string;
  freeholder_name: string;
  freeholder_contact: string;
  tenancy_start: string;
  tenancy_end: string;
  contents_insurance_renewal: string;
}

/** Fields a deep link (System Health, Rental register) can scroll to and highlight. */
export const HIGHLIGHT_FIELDS = [
  'role', 'usage', 'heating_type', 'address', 'property_type', 'bedrooms', 'tenure',
  'ownership_type', 'occupants', 'rent_amount', 'freeholder_name',
  'tenancy_start', 'tenancy_end', 'contents_insurance_renewal',
] as const;
export type HighlightField = (typeof HIGHLIGHT_FIELDS)[number];
const LETTING_FIELDS: HighlightField[] = ['ownership_type', 'occupants', 'rent_amount', 'freeholder_name'];

export const RENT_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'four_weekly', label: 'Every 4 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];
export const OWNERSHIP_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'joint', label: 'Joint owners' },
  { value: 'company', label: 'Company' },
  { value: 'trust', label: 'Trust' },
  { value: 'other', label: 'Other' },
];

export type FormErrors = Partial<Record<keyof PropertyForm, string>>;

interface ListResponse {
  results?: Property[];
  count?: number;
  next?: string | null;
  previous?: string | null;
  data?: Property[];
}

interface PropertyResponse {
  data: Property;
}

interface CoverResponse {
  data: { url: string | null };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const EMPTY_FORM: PropertyForm = {
  name: '',
  address: '',
  postcode: '',
  location: '',
  property_type: '',
  usage: 'own_home',
  bedrooms: '0',
  bathrooms: '0',
  latitude: null,
  longitude: null,
  year_built: '',
  epc_band: '',
  tenure: '',
  heating_type: '',
  floor_area: '',
  wall_construction: '',
  rent_amount: '',
  rent_frequency: '',
  occupants: '',
  households: '',
  ownership_type: '',
  freeholder_name: '',
  freeholder_contact: '',
  tenancy_start: '',
  tenancy_end: '',
  contents_insurance_renewal: '',
};

function propertyToForm(p: Property): PropertyForm {
  return {
    name: p.name ?? '',
    address: p.address ?? '',
    postcode: p.postcode ?? '',
    location: p.location ?? '',
    property_type: p.property_type ?? '',
    usage: usageOf(p),
    bedrooms: String(p.bedrooms ?? 0),
    bathrooms: String(p.bathrooms ?? 0),
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    year_built: p.year_built != null ? String(p.year_built) : '',
    epc_band: p.epc_band ?? '',
    tenure: p.tenure ?? '',
    heating_type: p.heating_type ?? '',
    floor_area: p.floor_area != null ? String(p.floor_area) : '',
    wall_construction: p.wall_construction ?? '',
    rent_amount: p.rent_amount != null ? String(Number(p.rent_amount)) : '',
    rent_frequency: p.rent_frequency ?? '',
    occupants: p.occupants != null ? String(p.occupants) : '',
    households: p.households != null ? String(p.households) : '',
    ownership_type: p.ownership_type ?? '',
    freeholder_name: p.freeholder_name ?? '',
    freeholder_contact: p.freeholder_contact ?? '',
    tenancy_start: p.tenancy_start ?? '',
    tenancy_end: p.tenancy_end ?? '',
    contents_insurance_renewal: p.contents_insurance_renewal ?? '',
  };
}

export function validatePropertyForm(form: PropertyForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.address.trim()) {
    errors.address = 'Address is required.';
  }
  const pcError = postcodeError(form.postcode);
  if (pcError) {
    errors.postcode = pcError;
  }
  if (!form.property_type) {
    errors.property_type = 'Select a property type.';
  }
  if (form.latitude === null || form.longitude === null) {
    errors.postcode = errors.postcode || 'Set the property location on the map.';
  }
  if (form.usage === 'rented_home' && form.tenancy_start && form.tenancy_end && form.tenancy_end < form.tenancy_start) {
    errors.tenancy_end = "The end date can't be before the start date.";
  }
  return errors;
}

/** `withBuildingFacts`: also send floor area and wall construction. Only the edit form has them,
 *  so adding a property sends exactly what it always did. */
export function formToPayload(form: PropertyForm, withBuildingFacts = false) {
  return {
    name: form.name.trim(),
    address: form.address.trim(),
    postcode: formatPostcode(form.postcode),
    location: form.location.trim(),
    property_type: form.property_type,
    usage: form.usage,
    // The older twin of `usage`, kept in step by the backend (an older backend only knows this).
    role: ROLE_FOR_USAGE[form.usage],
    bedrooms: parseInt(form.bedrooms) || 0,
    bathrooms: parseInt(form.bathrooms) || 0,
    latitude: form.latitude,
    longitude: form.longitude,
    year_built: form.year_built ? parseInt(form.year_built) : null,
    epc_band: form.epc_band || null,
    tenure: form.tenure || null,
    heating_type: form.heating_type || null,
    ...(withBuildingFacts
      ? {
          floor_area: form.floor_area ? parseInt(form.floor_area) || null : null,
          wall_construction: form.wall_construction || null,
        }
      : {}),
    rent_amount: form.rent_amount.trim() ? Number(form.rent_amount).toFixed(2) : null,
    rent_frequency: form.rent_frequency,
    occupants: form.occupants.trim() ? parseInt(form.occupants) || 0 : null,
    households: form.households.trim() ? parseInt(form.households) || 0 : null,
    ownership_type: form.ownership_type,
    freeholder_name: form.freeholder_name.trim(),
    freeholder_contact: form.freeholder_contact.trim(),
    // Only a rented home holds the renter's own dates (the backend clears them on any other).
    ...(form.usage === 'rented_home'
      ? {
          tenancy_start: form.tenancy_start || null,
          tenancy_end: form.tenancy_end || null,
          contents_insurance_renewal: form.contents_insurance_renewal || null,
        }
      : {}),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CoverImg({ url, className }: { url?: string | null; className?: string }) {
  const [error, setError] = useState(false);
  if (url?.trim() && !error) return <img src={url} alt="Property cover" className={className} onError={() => setError(true)} />;
  return (
    <div className={cn(className, 'bg-[#F5F5F0] flex items-center justify-center')}>
      <Home className="w-8 h-8 text-[#C0C0B8]" />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

function LocationPicker({
  value,
  onChange,
  placeholder = 'City / Area',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-full h-10 px-3 rounded-md border border-input text-sm flex items-center justify-between gap-1 bg-background',
            'hover:bg-muted/40 transition-colors',
            !value && 'text-muted-foreground',
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search area…" />
          <CommandList>
            <CommandEmpty>No area found.</CommandEmpty>
            {UK_LOCATIONS.map(group => (
              <CommandGroup key={group.group} heading={group.group}>
                {group.items.map(item => (
                  <CommandItem
                    key={item}
                    value={item}
                    onSelect={val => {
                      onChange(val);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-3.5 w-3.5', value === item ? 'opacity-100' : 'opacity-0')} />
                    {item}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function PropertyFormFields({
  form,
  setForm,
  errors = {},
  onClearError,
  highlightField,
  member,
  showBuildingFacts = false,
}: {
  form: PropertyForm;
  setForm: React.Dispatch<React.SetStateAction<PropertyForm>>;
  errors?: FormErrors;
  onClearError?: (field: keyof PropertyForm) => void;
  /** Field to scroll to and ring, e.g. "Set your heating type" from System Health. */
  highlightField?: HighlightField;
  /** A family member's view: their role is set by the owner and shown read-only. */
  member?: { role: string; ownerName?: string | null; viewerRole: string };
  /** Floor area and wall construction: shown when editing a home (signup fills them from EPC). */
  showBuildingFacts?: boolean;
}) {
  const set = (k: keyof PropertyForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
    onClearError?.(k);
  };

  const highlightRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!highlightField) return;
    // Wait for the dialog's open animation before scrolling inside it.
    const t = window.setTimeout(() => highlightRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
    return () => window.clearTimeout(t);
  }, [highlightField]);
  const fieldProps = (k: HighlightField) => ({
    ref: highlightField === k ? highlightRef : undefined,
    'data-field': k,
    className: cn('space-y-1.5', highlightField === k && 'rounded-md p-1.5 -m-1.5 ring-2 ring-amber-400 bg-amber-50/60'),
  });

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Property name</Label>
        <Input value={form.name} onChange={set('name')} placeholder="e.g. Main Home" />
      </div>

      <div {...fieldProps('address')}>
        <Label>
          Address <span className="text-destructive">*</span>
        </Label>
        <Input
          value={form.address}
          onChange={set('address')}
          placeholder="Street address"
          className={cn(errors.address && 'border-destructive focus-visible:ring-destructive')}
        />
        <FieldError message={errors.address} />
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>City / Area</Label>
          <LocationPicker
            value={form.location}
            onChange={loc => setForm(prev => ({ ...prev, location: loc, postcode: LOCATION_POSTCODE[loc] ?? prev.postcode }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            Postcode <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.postcode}
            onChange={e => {
              setForm(prev => ({ ...prev, postcode: e.target.value.toUpperCase() }));
              onClearError?.('postcode');
            }}
            placeholder="SW1A 1AA"
            className={cn('uppercase', errors.postcode && 'border-destructive focus-visible:ring-destructive')}
          />
          <FieldError message={errors.postcode} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>
          Exact location <span className="text-destructive">*</span>
          <span className="text-xs text-muted-foreground font-normal ml-2">Drag the pin to your exact address</span>
        </Label>
        <PropertyMapPicker
          lat={form.latitude}
          lng={form.longitude}
          postcode={form.postcode}
          onChange={({ lat, lng, address, postcode, city }) =>
            setForm(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              ...(postcode ? { postcode: postcode.toUpperCase() } : {}),
              ...(address ? { address } : {}),
              ...(city ? { location: city } : {}),
            }))
          }
        />
        {form.latitude !== null && form.longitude !== null && (
          <p className="text-xs text-muted-foreground">
            Pin: {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <div {...fieldProps('property_type')}>
          <Label>
            Property type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.property_type}
            onValueChange={v => {
              setForm(prev => ({ ...prev, property_type: v }));
              onClearError?.('property_type');
            }}
          >
            <SelectTrigger className={cn(errors.property_type && 'border-destructive focus-visible:ring-destructive')}>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.property_type} />
        </div>
        <div {...fieldProps(highlightField === 'usage' ? 'usage' : 'role')} data-field-usage>
          <Label>{member ? 'Your role' : 'How you use this property'}</Label>
          {member ? (
            <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm" aria-readonly="true">
              <span className="truncate">
                {memberRoleLabel(member.role)}{' '}
                <span className="text-muted-foreground">(set by {member.ownerName || 'the owner'})</span>
              </span>
            </div>
          ) : (
            <Select value={form.usage} onValueChange={v => setForm(prev => ({ ...prev, usage: v as Usage }))}>
              <SelectTrigger aria-label="How you use this property">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USAGE_OPTIONS.map(u => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div {...fieldProps('bedrooms')}>
          <Label>Bedrooms</Label>
          <Input type="number" min="0" max="20" value={form.bedrooms} onChange={set('bedrooms')} />
        </div>
        <div className="space-y-1.5">
          <Label>Bathrooms</Label>
          <Input type="number" min="0" max="20" value={form.bathrooms} onChange={set('bathrooms')} />
        </div>
      </div>

      {/* Property Details — extra profile fields */}
      <div className="pt-1 border-t border-[#E8E8E3]">
        <p className="text-xs text-muted-foreground mb-3 mt-2">Property Details <span className="font-normal">(optional — helps with reminders &amp; compliance)</span></p>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Year built</Label>
            <Input
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={form.year_built}
              onChange={set('year_built')}
              placeholder="e.g. 1985"
            />
          </div>
          <div className="space-y-1.5">
            <Label>EPC band</Label>
            <Select value={form.epc_band || '_none'} onValueChange={v => setForm(prev => ({ ...prev, epc_band: v === '_none' ? '' : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Not known" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not known</SelectItem>
                {['A','B','C','D','E','F','G'].map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mt-3">
          <div {...fieldProps('tenure')}>
            <Label>Tenure</Label>
            <Select value={form.tenure || '_none'} onValueChange={v => setForm(prev => ({ ...prev, tenure: v === '_none' ? '' : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not set</SelectItem>
                <SelectItem value="freehold">Freehold</SelectItem>
                <SelectItem value="leasehold">Leasehold</SelectItem>
                <SelectItem value="share_of_freehold">Share of Freehold</SelectItem>
                <SelectItem value="commonhold">Commonhold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div {...fieldProps('heating_type')}>
            <Label>Heating type</Label>
            <Select value={form.heating_type || '_none'} onValueChange={v => setForm(prev => ({ ...prev, heating_type: v === '_none' ? '' : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not set</SelectItem>
                <SelectItem value="gas_combi">Gas combi boiler</SelectItem>
                <SelectItem value="gas_system">Gas system boiler</SelectItem>
                <SelectItem value="electric">Electric heating</SelectItem>
                <SelectItem value="oil">Oil boiler</SelectItem>
                <SelectItem value="heat_pump">Heat pump</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {showBuildingFacts && (
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mt-3">
          <div className="space-y-1.5">
            <Label>Floor area (m²)</Label>
            <Input
              type="number"
              min="1"
              value={form.floor_area}
              onChange={set('floor_area')}
              placeholder="e.g. 85"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Wall construction</Label>
            <Select value={form.wall_construction || '_none'} onValueChange={v => setForm(prev => ({ ...prev, wall_construction: v === '_none' ? '' : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Not set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not set</SelectItem>
                <SelectItem value="cavity">Cavity wall</SelectItem>
                <SelectItem value="solid">Solid wall</SelectItem>
                <SelectItem value="timber">Timber frame</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        )}
      </div>

      {!member && form.usage === 'rented_home' && (
        <div className="pt-1 border-t border-[#E8E8E3]" data-section="tenancy">
          <p className="text-xs text-muted-foreground mb-3 mt-2">
            Your tenancy <span className="font-normal">(optional, kept in your account only)</span>
          </p>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            <div {...fieldProps('tenancy_start')}>
              <Label>Tenancy start</Label>
              <Input type="date" value={form.tenancy_start} onChange={set('tenancy_start')} aria-label="Tenancy start" />
            </div>
            <div {...fieldProps('tenancy_end')}>
              <Label>Tenancy end or renewal</Label>
              <Input
                type="date" value={form.tenancy_end} min={form.tenancy_start || undefined} onChange={set('tenancy_end')}
                aria-label="Tenancy end or renewal"
                className={cn(errors.tenancy_end && 'border-destructive focus-visible:ring-destructive')}
              />
              <FieldError message={errors.tenancy_end} />
            </div>
          </div>
          <div {...fieldProps('contents_insurance_renewal')} className={cn(fieldProps('contents_insurance_renewal').className, 'mt-3 sm:max-w-[50%]')}>
            <Label>Contents insurance renews</Label>
            <Input
              type="date" value={form.contents_insurance_renewal} onChange={set('contents_insurance_renewal')}
              aria-label="Contents insurance renews"
            />
          </div>
        </div>
      )}

      {((member ? member.viewerRole === 'landlord' : form.usage === 'let') || (highlightField && LETTING_FIELDS.includes(highlightField))) && (
        <div className="pt-1 border-t border-[#E8E8E3]" data-section="letting">
          <p className="text-xs text-muted-foreground mb-3 mt-2">
            Letting details <span className="font-normal">(needed for the PRS Database register)</span>
          </p>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            <div {...fieldProps('ownership_type')}>
              <Label>Ownership</Label>
              <Select value={form.ownership_type || '_none'} onValueChange={v => setForm(prev => ({ ...prev, ownership_type: v === '_none' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Not set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Not set</SelectItem>
                  {OWNERSHIP_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div {...fieldProps('rent_amount')}>
              <Label>Rent</Label>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                  <Input
                    type="number" min="0" step="0.01" inputMode="decimal" className="pl-6"
                    value={form.rent_amount} onChange={set('rent_amount')} placeholder="0.00" aria-label="Rent amount"
                  />
                </div>
                <Select value={form.rent_frequency || '_none'} onValueChange={v => setForm(prev => ({ ...prev, rent_frequency: v === '_none' ? '' : v }))}>
                  <SelectTrigger className="w-[130px] shrink-0" aria-label="Rent frequency">
                    <SelectValue placeholder="How often" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">How often</SelectItem>
                    {RENT_FREQUENCIES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div {...fieldProps('occupants')} className={cn(fieldProps('occupants').className, 'grid grid-cols-2 gap-3 space-y-0 mt-3')}>
            <div className="space-y-1.5">
              <Label>Occupants</Label>
              <Input type="number" min="0" max="99" value={form.occupants} onChange={set('occupants')} placeholder="People" aria-label="Occupants" />
            </div>
            <div className="space-y-1.5">
              <Label>Households</Label>
              <Input type="number" min="0" max="99" value={form.households} onChange={set('households')} placeholder="e.g. 1" aria-label="Households" />
            </div>
          </div>
          {(form.tenure === 'leasehold' || form.tenure === 'share_of_freehold' || highlightField === 'freeholder_name') && (
            <div {...fieldProps('freeholder_name')} className={cn(fieldProps('freeholder_name').className, 'grid grid-cols-1 xs:grid-cols-2 gap-3 space-y-0 mt-3')}>
              <div className="space-y-1.5">
                <Label>Freeholder name</Label>
                <Input value={form.freeholder_name} onChange={set('freeholder_name')} placeholder="e.g. Acme Estates Ltd" />
              </div>
              <div className="space-y-1.5">
                <Label>Freeholder contact</Label>
                <Input value={form.freeholder_contact} onChange={set('freeholder_contact')} placeholder="Email, phone or address" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Properties() {
  const queryClient = useQueryClient();
  const { setActivePropertyId } = useActiveProperty();

  // Pagination
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  const listUrl = `/api/v1/properties/?${params}`;

  const { data: raw, isLoading, isError, refetch } = useFetch<ListResponse>(listUrl);

  const properties: Property[] = raw?.results ?? (raw as { data?: Property[] })?.data ?? [];
  const totalCount: number = raw?.count ?? properties.length;
  const hasNext = !!raw?.next;
  const hasPrev = !!raw?.previous;

  // Invalidate every property cache across pages — this page's own URL-keyed
  // list query plus useActiveProperty()'s (shared key: '/api/v1/properties/').
  const invalidateProperties = () =>
    queryClient.invalidateQueries({
      predicate: q => {
        const k = q.queryKey[0];
        // The rental register and System Health read the home's details too.
        return typeof k === 'string' && (k.startsWith('/api/v1/properties/') || ['prs-checklist', 'prs-summary', 'systems-health'].includes(k));
      },
    });

  // View/edit modal
  const [selected, setSelected] = useState<Property | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<PropertyForm>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [focusField, setFocusField] = useState<HighlightField | undefined>();

  // Add property: the shared dialog (also used by the property switcher and the let-property card).
  const [addOpen, setAddOpen] = useState(false);

  // Rename (just the name: the full edit form needs the map pin)
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const patchMutation = usePatch<PropertyResponse>({
    onSuccess: ({ data: updated }) => {
      setSelected(prev => (prev ? { ...prev, ...updated } : prev));
      setEditMode(false);
      setEditErrors({});
      setFocusField(undefined);
      toast.success('Property updated.');
      invalidateProperties();
    },
    onError: (err: Error & { response?: { data?: { errors?: Record<string, string[]> } } }) => {
      // Field problems (e.g. a postcode that doesn't exist) show on the field.
      const apiErrs = err?.response?.data?.errors ?? {};
      const mapped: FormErrors = {};
      if (apiErrs.address) mapped.address = apiErrs.address[0];
      if (apiErrs.postcode) mapped.postcode = apiErrs.postcode[0];
      if (apiErrs.property_type) mapped.property_type = apiErrs.property_type[0];
      if (Object.keys(mapped).length) setEditErrors(mapped);
      else toast.error('Failed to update property.');
    },
  });

  const renameMutation = usePatch<PropertyResponse>({
    onSuccess: ({ data: updated }) => {
      setSelected(prev => (prev ? { ...prev, ...updated } : prev));
      setRenaming(false);
      toast.success('Property renamed.');
      invalidateProperties();
    },
    onError: () => toast.error('Could not rename the property.'),
  });

  const deleteMutation = useDelete({
    onSuccess: () => {
      closeModal();
      setDeleteTarget(null);
      toast.success('Property deleted.');
      invalidateProperties();
    },
    onError: () => toast.error('Failed to delete property.'),
  });

  const coverMutation = usePost<CoverResponse>({
    onSuccess: ({ data }) => {
      setSelected(prev => (prev ? { ...prev, cover_image_url: data?.url ?? null } : prev));
      toast.success('Cover image updated.');
      invalidateProperties();
    },
    onError: () => toast.error('Failed to upload cover image.'),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const closeModal = () => {
    setModalOpen(false);
    setRenaming(false);
    setEditMode(false);
    setSelected(null);
    setEditErrors({});
    setFocusField(undefined);
  };

  const openModal = (p: Property) => {
    setSelected(p);
    setEditForm(propertyToForm(p));
    setEditMode(false);
    setEditErrors({});
    setFocusField(undefined);
    setModalOpen(true);
  };

  // Deep link from System Health: ?tab=properties&edit=<id>&field=heating_type|role opens
  // that home straight in edit mode with the field highlighted. A home that is not on
  // this page of the list is fetched by id.
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkId = searchParams.get('edit');
  useEffect(() => {
    if (!deepLinkId || isLoading) return;
    const field = searchParams.get('field');
    const focus = HIGHLIGHT_FIELDS.find(f => f === field);
    const openForEdit = (p: Property) => {
      openModal(p);
      setEditMode(true);
      setFocusField(focus);
    };
    setSearchParams({ tab: 'properties' }, { replace: true });
    const hit = properties.find(p => p.id === deepLinkId);
    if (hit) {
      openForEdit(hit);
    } else {
      fetchData<PropertyResponse>(`/api/v1/properties/${deepLinkId}/`)
        .then(res => res?.data && openForEdit(res.data))
        .catch(() => toast.error('Could not open that property.'));
    }
  }, [deepLinkId, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    if (!selected) return;
    const errors = validatePropertyForm(editForm);
    if (Object.keys(errors).length) {
      setEditErrors(errors);
      return;
    }
    const payload: Partial<ReturnType<typeof formToPayload>> = formToPayload(editForm, true);
    // Only the owner says what the home is; a member's role comes from Settings → Family.
    if (selected.access === 'member') {
      delete payload.role;
      delete payload.usage;
      delete payload.tenancy_start;
      delete payload.tenancy_end;
      delete payload.contents_insurance_renewal;
    }
    patchMutation.mutate({ url: `/api/v1/properties/${selected.id}/`, data: payload });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate({ url: `/api/v1/properties/${deleteTarget.id}/` });
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    const fd = new FormData();
    fd.append('file', file);
    coverMutation.mutate({
      url: `/api/v1/properties/${selected.id}/cover-image/`,
      data: fd,
      config: { headers: { 'Content-Type': 'multipart/form-data' } },
    });
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Add property */}
      {!isLoading && !isError && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {totalCount} propert{totalCount === 1 ? 'y' : 'ies'}
          </p>
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            data-action="open-add-property"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add property
          </Button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load properties.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No properties yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {properties.map(p => (
              <Card
                key={p.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-[#E8E8E3]"
                onClick={() => openModal(p)}
              >
                <CoverImg url={p.cover_image_url} className="w-full h-36 object-cover" />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1A1A1A] truncate">{propertyNickname(p) || 'Unnamed Property'}</p>
                      {(p.location || p.address) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 min-w-0">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{p.location || p.address}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {p.access === 'member' && (
                        <Badge variant="outline" className="text-xs max-w-[140px] truncate border-blue-300 text-blue-700 bg-blue-50">
                          Shared by {p.owner_name || 'owner'}
                        </Badge>
                      )}
                      {p.access !== 'member' && p.is_shared && (
                        <Badge variant="outline" className="text-xs">
                          Shared
                        </Badge>
                      )}
                      {p.access !== 'member' && (
                        <Badge variant="outline" className={cn('text-xs max-w-[160px] truncate', USAGE_COLORS[usageOf(p)])} data-usage-chip={usageOf(p)}>
                          {usageLabel(usageOf(p))}
                        </Badge>
                      )}
                      {p.property_type && (
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_LABEL[p.property_type] ?? p.property_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {p.postcode && <span>{p.postcode}</span>}
                    {p.bedrooms > 0 && <span>{p.bedrooms} bed</span>}
                    {p.bathrooms > 0 && <span>{p.bathrooms} bath</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {(hasPrev || hasNext) && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>
                {totalCount} propert{totalCount === 1 ? 'y' : 'ies'}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span>Page {page}</span>
                <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── View / edit modal ── */}
      <Dialog open={modalOpen} onOpenChange={open => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                {renaming ? (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={e => {
                      e.preventDefault();
                      renameMutation.mutate({ url: `/api/v1/properties/${selected.id}/`, data: { name: renameValue.trim() } });
                    }}
                  >
                    <DialogTitle className="sr-only">Rename property</DialogTitle>
                    <Input
                      autoFocus value={renameValue} maxLength={200} aria-label="Property name"
                      placeholder="Name this property" onChange={e => setRenameValue(e.target.value)}
                    />
                    <Button type="submit" size="sm" disabled={renameMutation.isPending}>
                      {renameMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setRenaming(false)}>
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 min-w-0 pr-6">
                    <DialogTitle className="truncate">{propertyNickname(selected) || 'Property Details'}</DialogTitle>
                    {selected.access !== 'member' && !editMode && (
                      <button
                        type="button" aria-label="Rename property" data-action="rename-property"
                        onClick={() => { setRenameValue(selected.name ?? ''); setRenaming(true); }}
                        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </DialogHeader>

              {/* Cover image */}
              <div className="relative rounded-lg overflow-hidden h-44 bg-[#F5F5F0]">
                <CoverImg url={selected.cover_image_url} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverMutation.isPending}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 hover:bg-black/75 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
                >
                  {coverMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  {coverMutation.isPending ? 'Uploading…' : 'Change cover'}
                </button>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </div>

              {editMode ? (
                <PropertyFormFields
                  form={editForm}
                  setForm={setEditForm}
                  showBuildingFacts
                  errors={editErrors}
                  onClearError={field => setEditErrors(prev => ({ ...prev, [field]: undefined }))}
                  highlightField={focusField}
                  member={selected.access === 'member'
                    ? { role: selected.member_role ?? 'family', ownerName: selected.owner_name, viewerRole: selected.my_role ?? selected.role }
                    : undefined}
                />
              ) : (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mt-1">
                  {[
                    { label: 'Name', value: selected.name },
                    {
                      label: selected.access === 'member' ? 'Your role' : 'How you use it',
                      value: selected.access === 'member'
                        ? memberRoleLabel(selected.member_role)
                        : usageLabel(usageOf(selected)),
                    },
                    { label: 'Tenancy start', value: fmtDay(selected.tenancy_start) },
                    { label: 'Tenancy end or renewal', value: fmtDay(selected.tenancy_end) },
                    { label: 'Contents insurance renews', value: fmtDay(selected.contents_insurance_renewal) },
                    { label: 'Type', value: TYPE_LABEL[selected.property_type] ?? selected.property_type },
                    { label: 'Address', value: selected.address },
                    { label: 'Location', value: selected.location },
                    { label: 'Postcode', value: selected.postcode },
                    { label: 'Bedrooms', value: selected.bedrooms > 0 ? String(selected.bedrooms) : undefined },
                    { label: 'Bathrooms', value: selected.bathrooms > 0 ? String(selected.bathrooms) : undefined },
                    { label: 'Built form', value: selected.built_form && selected.built_form.toLowerCase() !== (TYPE_LABEL[selected.property_type] ?? '').toLowerCase() ? selected.built_form : undefined },
                    { label: 'Floor area', value: selected.floor_area ? `${selected.floor_area} m²` : undefined },
                    {
                      label: 'Year Built',
                      value: selected.year_built
                        ? `${selected.year_built}${selected.construction_age_band ? ` (EPC: ${selected.construction_age_band})` : ''}`
                        : selected.construction_age_band || undefined,
                    },
                    { label: 'Walls', value: selected.wall_construction ? ({ cavity: 'Cavity wall', solid: 'Solid wall', timber: 'Timber frame', other: 'Other' } as Record<string, string>)[selected.wall_construction] ?? selected.wall_construction : undefined },
                    { label: 'EPC Band', value: selected.epc_band || undefined },
                    { label: 'Tenure', value: selected.tenure || undefined },
                    { label: 'Heating', value: selected.heating_type ? selected.heating_type.replace(/_/g, ' ') : undefined },
                    {
                      label: 'Rent',
                      value: selected.rent_amount != null && selected.rent_frequency
                        ? `£${Number(selected.rent_amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })} ${RENT_FREQUENCIES.find(f => f.value === selected.rent_frequency)?.label.toLowerCase() ?? ''}`
                        : undefined,
                    },
                    {
                      label: 'Occupants',
                      value: selected.occupants != null ? `${selected.occupants} in ${selected.households ?? '?'} household${selected.households === 1 ? '' : 's'}` : undefined,
                    },
                    { label: 'Ownership', value: OWNERSHIP_TYPES.find(o => o.value === selected.ownership_type)?.label },
                  ].map(({ label, value }) =>
                    value ? (
                      <div key={label} className={cn('min-w-0', label === 'Address' && 'col-span-2')}>
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className={cn('font-medium text-[#1A1A1A] break-words', ['Heating', 'Tenure'].includes(label) && 'capitalize')}>{value}</dd>
                      </div>
                    ) : null,
                  )}
                </dl>
              )}

              {!editMode && <HomePeople propertyId={selected.id} />}

              <DialogFooter className="gap-2 flex-wrap sm:flex-nowrap mt-2">
                {/* Only the owner can delete a home. */}
                {selected.access !== 'member' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => setDeleteTarget(selected)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                  </Button>
                )}
                <div className="flex-1" />
                {editMode ? (
                  <>
                    <Button
                      className="text-black hover:bg-gray-200"
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditMode(false); setEditErrors({}); setFocusField(undefined); }}
                      disabled={patchMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={patchMutation.isPending} className="min-w-[80px]">
                      {patchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setEditMode(true)}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Add property ── */}
      <AddPropertyDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete property?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{propertyNickname(deleteTarget) || 'this property'}&quot;? Its tasks, reminders and documents will be deleted.
              {deleteTarget?.is_shared ? ' This removes it for everyone in the household.' : ''}{' '}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-black hover:bg-gray-200" disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive border-none text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
