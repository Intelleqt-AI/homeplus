import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { UK_LOCATIONS, LOCATION_POSTCODE } from '@/lib/ukLocations';
import PropertyMapPicker from '@/components/PropertyMapPicker';

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROPERTY_TYPES = [
  { value: 'detached', label: 'Detached' },
  { value: 'semi_detached', label: 'Semi-Detached' },
  { value: 'terraced', label: 'Terraced' },
  { value: 'flat', label: 'Flat' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'other', label: 'Other' },
];

export const ROLES = [
  { value: 'homeowner', label: 'Homeowner' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'tenant', label: 'Tenant' },
];

const ROLE_COLORS: Record<string, string> = {
  homeowner: 'border-blue-300 text-blue-700 bg-blue-50',
  landlord: 'border-purple-300 text-purple-700 bg-purple-50',
  tenant: 'border-orange-300 text-orange-700 bg-orange-50',
};

const TYPE_LABEL: Record<string, string> = Object.fromEntries(PROPERTY_TYPES.map(t => [t.value, t.label]));

const PAGE_SIZE = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  name: string;
  address: string;
  postcode: string;
  location: string;
  property_type: string;
  role: string;
  bedrooms: number;
  bathrooms: number;
  cover_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  year_built: number | null;
  epc_band: string;
  tenure: string;
  heating_type: string;
}

export interface PropertyForm {
  name: string;
  address: string;
  postcode: string;
  location: string;
  property_type: string;
  role: string;
  bedrooms: string;
  bathrooms: string;
  latitude: number | null;
  longitude: number | null;
  year_built: string;
  epc_band: string;
  tenure: string;
  heating_type: string;
}

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
  role: 'homeowner',
  bedrooms: '0',
  bathrooms: '0',
  latitude: null,
  longitude: null,
  year_built: '',
  epc_band: '',
  tenure: '',
  heating_type: '',
};

function propertyToForm(p: Property): PropertyForm {
  return {
    name: p.name ?? '',
    address: p.address ?? '',
    postcode: p.postcode ?? '',
    location: p.location ?? '',
    property_type: p.property_type ?? '',
    role: p.role ?? 'homeowner',
    bedrooms: String(p.bedrooms ?? 0),
    bathrooms: String(p.bathrooms ?? 0),
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    year_built: p.year_built != null ? String(p.year_built) : '',
    epc_band: p.epc_band ?? '',
    tenure: p.tenure ?? '',
    heating_type: p.heating_type ?? '',
  };
}

export function validatePropertyForm(form: PropertyForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.address.trim()) {
    errors.address = 'Address is required.';
  }
  if (!form.postcode.trim()) {
    errors.postcode = 'Postcode is required.';
  }
  if (!form.property_type) {
    errors.property_type = 'Select a property type.';
  }
  if (form.latitude === null || form.longitude === null) {
    errors.postcode = errors.postcode || 'Set the property location on the map.';
  }
  return errors;
}

export function formToPayload(form: PropertyForm) {
  return {
    name: form.name.trim(),
    address: form.address.trim(),
    postcode: form.postcode.trim().toUpperCase(),
    location: form.location.trim(),
    property_type: form.property_type,
    role: form.role,
    bedrooms: parseInt(form.bedrooms) || 0,
    bathrooms: parseInt(form.bathrooms) || 0,
    latitude: form.latitude,
    longitude: form.longitude,
    year_built: form.year_built ? parseInt(form.year_built) : null,
    epc_band: form.epc_band || null,
    tenure: form.tenure || null,
    heating_type: form.heating_type || null,
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
}: {
  form: PropertyForm;
  setForm: React.Dispatch<React.SetStateAction<PropertyForm>>;
  errors?: FormErrors;
  onClearError?: (field: keyof PropertyForm) => void;
}) {
  const set = (k: keyof PropertyForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
    onClearError?.(k);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Property name</Label>
        <Input value={form.name} onChange={set('name')} placeholder="e.g. Main Home" />
      </div>

      <div className="space-y-1.5">
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

      <div className="grid grid-cols-2 gap-3">
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
          <Label>Your role</Label>
          <Select value={form.role} onValueChange={v => setForm(prev => ({ ...prev, role: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(r => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
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
        <div className="grid grid-cols-2 gap-3">
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
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
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
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Properties() {
  const queryClient = useQueryClient();

  // Search / pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (debouncedSearch) params.set('search', debouncedSearch);
  const listUrl = `/api/v1/properties/?${params}`;

  const { data: raw, isLoading, isError, refetch } = useFetch<ListResponse>(listUrl);

  const properties: Property[] = raw?.results ?? (raw as { data?: Property[] })?.data ?? [];
  const totalCount: number = raw?.count ?? properties.length;
  const hasNext = !!raw?.next;
  const hasPrev = !!raw?.previous;

  // Invalidate all /api/v1/properties/ queries across all pages/search combos
  const invalidateProperties = () =>
    queryClient.invalidateQueries({
      predicate: q => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('/api/v1/properties/'),
    });

  // View/edit modal
  const [selected, setSelected] = useState<Property | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<PropertyForm>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<PropertyForm>(EMPTY_FORM);
  const [addErrors, setAddErrors] = useState<FormErrors>({});
  const [addCoverFile, setAddCoverFile] = useState<File | null>(null);
  const [addCoverPreview, setAddCoverPreview] = useState<string | null>(null);
  const addCoverRef = useRef<HTMLInputElement>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const patchMutation = usePatch<PropertyResponse>({
    onSuccess: ({ data: updated }) => {
      setSelected(prev => (prev ? { ...prev, ...updated } : prev));
      setEditMode(false);
      setEditErrors({});
      toast.success('Property updated.');
      invalidateProperties();
    },
    onError: () => toast.error('Failed to update property.'),
  });

  const addMutation = usePost<PropertyResponse>({
    onSuccess: ({ data: created }) => {
      if (addCoverFile) {
        const fd = new FormData();
        fd.append('file', addCoverFile);
        addCoverMutation.mutate({
          url: `/api/v1/properties/${created.id}/cover-image/`,
          data: fd,
          config: { headers: { 'Content-Type': 'multipart/form-data' } },
        });
      }
      setAddOpen(false);
      setAddForm(EMPTY_FORM);
      setAddErrors({});
      resetAddCover();
      toast.success('Property added.');
      invalidateProperties();
    },
    onError: (err: Error & { response?: { data?: { errors?: Record<string, string[]> } } }) => {
      const apiErrs = err?.response?.data?.errors ?? {};
      const mapped: FormErrors = {};
      if (apiErrs.address) mapped.address = apiErrs.address[0];
      if (apiErrs.postcode) mapped.postcode = apiErrs.postcode[0];
      if (apiErrs.property_type) mapped.property_type = apiErrs.property_type[0];
      if (Object.keys(mapped).length) {
        setAddErrors(mapped);
      } else {
        toast.error('Failed to add property.');
      }
    },
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

  const addCoverMutation = usePost<CoverResponse>({
    onSuccess: () => invalidateProperties(),
    onError: () => toast.error('Property added but cover upload failed.'),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const resetAddCover = () => {
    if (addCoverPreview) URL.revokeObjectURL(addCoverPreview);
    setAddCoverFile(null);
    setAddCoverPreview(null);
    if (addCoverRef.current) addCoverRef.current.value = '';
  };

  const handleAddCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (addCoverPreview) URL.revokeObjectURL(addCoverPreview);
    setAddCoverFile(file);
    setAddCoverPreview(URL.createObjectURL(file));
    if (addCoverRef.current) addCoverRef.current.value = '';
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditMode(false);
    setSelected(null);
    setEditErrors({});
  };

  const openModal = (p: Property) => {
    setSelected(p);
    setEditForm(propertyToForm(p));
    setEditMode(false);
    setEditErrors({});
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!selected) return;
    const errors = validatePropertyForm(editForm);
    if (Object.keys(errors).length) {
      setEditErrors(errors);
      return;
    }
    patchMutation.mutate({ url: `/api/v1/properties/${selected.id}/`, data: formToPayload(editForm) });
  };

  const handleAdd = () => {
    const errors = validatePropertyForm(addForm);
    if (Object.keys(errors).length) {
      setAddErrors(errors);
      return;
    }
    addMutation.mutate({ url: '/api/v1/properties/', data: formToPayload(addForm) });
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
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, address, postcode…"
            className="pl-9"
          />
        </div>
        <Button
          size="sm"
          onClick={() => {
            setAddForm(EMPTY_FORM);
            setAddErrors({});
            setAddOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add property
        </Button>
      </div>

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
          <p className="text-sm text-muted-foreground">{debouncedSearch ? 'No properties match your search.' : 'No properties yet.'}</p>
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
                      <p className="font-semibold text-[#1A1A1A] truncate">{p.name || p.address || 'Unnamed Property'}</p>
                      {(p.location || p.address) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {p.location || p.address}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name || selected.address || 'Property Details'}</DialogTitle>
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
                  errors={editErrors}
                  onClearError={field => setEditErrors(prev => ({ ...prev, [field]: undefined }))}
                />
              ) : (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mt-1">
                  {[
                    { label: 'Name', value: selected.name },
                    { label: 'Role', value: ROLES.find(r => r.value === selected.role)?.label },
                    { label: 'Type', value: TYPE_LABEL[selected.property_type] ?? selected.property_type },
                    { label: 'Address', value: selected.address },
                    { label: 'Location', value: selected.location },
                    { label: 'Postcode', value: selected.postcode },
                    { label: 'Bedrooms', value: selected.bedrooms > 0 ? String(selected.bedrooms) : undefined },
                    { label: 'Bathrooms', value: selected.bathrooms > 0 ? String(selected.bathrooms) : undefined },
                    { label: 'Year Built', value: selected.year_built ? String(selected.year_built) : undefined },
                    { label: 'EPC Band', value: selected.epc_band || undefined },
                    { label: 'Tenure', value: selected.tenure || undefined },
                    { label: 'Heating', value: selected.heating_type ? selected.heating_type.replace(/_/g, ' ') : undefined },
                  ].map(({ label, value }) =>
                    value ? (
                      <div key={label}>
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="font-medium text-[#1A1A1A] capitalize">{value}</dd>
                      </div>
                    ) : null,
                  )}
                </dl>
              )}

              <DialogFooter className="gap-2 flex-wrap sm:flex-nowrap mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => setDeleteTarget(selected)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                </Button>
                <div className="flex-1" />
                {editMode ? (
                  <>
                    <Button
                      className="text-black hover:bg-gray-200"
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditMode(false); setEditErrors({}); }}
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

      {/* ── Add property modal ── */}
      <Dialog
        open={addOpen}
        onOpenChange={open => {
          if (!open) {
            setAddOpen(false);
            setAddForm(EMPTY_FORM);
            setAddErrors({});
            resetAddCover();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add property</DialogTitle>
          </DialogHeader>

          {/* Cover image */}
          <div
            className="relative rounded-lg overflow-hidden h-36 bg-[#F5F5F0] cursor-pointer"
            onClick={() => addCoverRef.current?.click()}
          >
            {addCoverPreview ? (
              <img src={addCoverPreview} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <Camera className="w-7 h-7 text-[#C0C0B8]" />
                <p className="text-xs text-muted-foreground">Add cover photo (optional)</p>
              </div>
            )}
            <span className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 hover:bg-black/75 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
              <Camera className="w-3.5 h-3.5" />
              {addCoverPreview ? 'Change' : 'Add photo'}
            </span>
            <input ref={addCoverRef} type="file" accept="image/*" className="hidden" onChange={handleAddCoverChange} />
          </div>

          <PropertyFormFields
            form={addForm}
            setForm={setAddForm}
            errors={addErrors}
            onClearError={field => setAddErrors(prev => ({ ...prev, [field]: undefined }))}
          />

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={addMutation.isPending} className="min-w-[120px]">
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {addMutation.isPending ? 'Adding…' : 'Add property'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete property?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name || deleteTarget?.address || 'This property'}" will be permanently deleted. This cannot be undone.
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
