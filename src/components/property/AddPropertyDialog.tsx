import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import NewPropertyFields from '@/components/property/NewPropertyFields';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { useAuth } from '@/hooks/useAuth';
import { usePost } from '@/hooks/usePost';
import apiClient from '@/lib/apiClient';
import { toast } from '@/lib/toast';
import { formatPostcode } from '@/lib/postcode';
import { EMPTY_HOME, type HomeSelection } from '@/lib/homeLookup';
import { EMPTY_HOME_DETAILS, toHomeDetailsPayload, type HomeDetails } from '@/lib/propertyOptions';
import { wordingFor, type Usage } from '@/lib/account';

type Created = { data: { id: string } };
type ApiErr = Error & { response?: { data?: { errors?: Record<string, string[]> } } };
type CoverResponse = { data: { url: string | null } };

/** What a person adding a property most likely adds, from how they use Home+. */
const defaultUsage = (accountType?: string): Usage =>
  accountType === 'landlord' || accountType === 'both' ? 'let' : accountType === 'renter' ? 'rented_home' : 'own_home';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, what the property is is already decided (e.g. "Add a let property") and not asked. */
  fixedUsage?: Usage;
  onCreated?: (propertyId: string) => void;
}

/**
 * Add a property: pick Area → Postcode → Home (EPC fills in the details), and say what it is to you
 * (own home / let / rented). The same dialog serves Settings, the property switcher and the
 * "Do you let out a property?" card.
 */
const AddPropertyDialog = ({ open, onOpenChange, fixedUsage, onCreated }: Props) => {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const { setActivePropertyId } = useActiveProperty();

  const startUsage = fixedUsage ?? defaultUsage(user?.account_type);
  const [home, setHome] = useState<HomeSelection>(EMPTY_HOME);
  const [details, setDetails] = useState<HomeDetails>({ ...EMPTY_HOME_DETAILS, usage: startUsage });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tenancyStart, setTenancyStart] = useState('');
  const [tenancyEnd, setTenancyEnd] = useState('');
  const certificate = useRef('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setHome(EMPTY_HOME);
    setDetails({ ...EMPTY_HOME_DETAILS, usage: fixedUsage ?? defaultUsage(user?.account_type) });
    setErrors({});
    setTenancyStart('');
    setTenancyEnd('');
    certificate.current = '';
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
    if (coverRef.current) coverRef.current.value = '';
  };

  // A fresh form each time it opens (the account type or the fixed usage may have changed).
  useEffect(() => {
    if (open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fixedUsage]);

  const invalidateProperties = () =>
    queryClient.invalidateQueries({
      predicate: q => {
        const k = q.queryKey[0];
        return typeof k === 'string' && (k.startsWith('/api/v1/properties/') || ['prs-checklist', 'prs-summary', 'systems-health'].includes(k));
      },
    });

  const coverMutation = usePost<CoverResponse>({
    onSuccess: () => invalidateProperties(),
    onError: () => toast.error('Property added but cover upload failed.'),
  });

  const addMutation = usePost<Created>({
    onSuccess: async ({ data: created }) => {
      if (coverFile) {
        const fd = new FormData();
        fd.append('file', coverFile);
        coverMutation.mutate({
          url: `/api/v1/properties/${created.id}/cover-image/`,
          data: fd,
          config: { headers: { 'Content-Type': 'multipart/form-data' } },
        });
      }
      // A home picked from the list already carries its EPC certificate: link it (non-critical).
      if (certificate.current) {
        await apiClient
          .post(`/api/v1/properties/${created.id}/epc/link/`, { certificate_number: certificate.current })
          .catch(() => {});
      }
      onOpenChange(false);
      toast.success('Property added.');
      // Await the refetch before switching: the active-property list must already include the new
      // home, or its "stored id not in the list yet" guard would bounce the selection back.
      await invalidateProperties();
      setActivePropertyId(created.id);
      // The server may have moved the account to "both" (a let home added from the one-off card).
      if (user?.let_prompt_pending) await refreshUser();
      onCreated?.(created.id);
    },
    onError: (err: ApiErr) => {
      const api = err?.response?.data?.errors ?? {};
      const mapped: Record<string, string> = {};
      const homeError = api.postcode?.[0] ?? api.address?.[0];
      if (homeError) mapped.home = homeError;
      if (api.property_type) mapped.propertyType = api.property_type[0];
      if (api.tenancy_end) mapped.tenancyEnd = api.tenancy_end[0];
      if (Object.keys(mapped).length) setErrors(mapped);
      else toast.error('Failed to add property.');
    },
  });

  const wording = wordingFor(details.usage);

  const handleAdd = () => {
    const found: Record<string, string> = {};
    if (!home.postcode) found.home = wording === 'property' ? 'Select your area and postcode, then the property.' : 'Select your area and postcode, then your home.';
    else if (!home.address.trim()) {
      found.home = wording === 'property'
        ? "Select the property, or choose \"This property isn't listed\" and enter the address."
        : "Select your home, or choose \"My home isn't listed\" and enter the address.";
    } else if (home.lat === null || home.lng === null) {
      found.home = wording === 'property' ? 'Place the pin on the map to mark the property.' : 'Place the pin on the map to mark your home.';
    }
    if (!details.propertyType) found.propertyType = 'Select a property type.';
    if (details.yearBuilt && (+details.yearBuilt < 1800 || +details.yearBuilt > new Date().getFullYear())) {
      found.yearBuilt = 'Enter a valid year.';
    }
    if (details.usage === 'rented_home' && tenancyStart && tenancyEnd && tenancyEnd < tenancyStart) {
      found.tenancyEnd = "The end date can't be before the start date.";
    }
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    const d = toHomeDetailsPayload(details);
    certificate.current = home.certificateNumber;
    addMutation.mutate({
      url: '/api/v1/properties/',
      data: {
        name: d.name,
        address: home.address.trim(),
        postcode: formatPostcode(home.postcode),
        location: home.area,
        property_type: details.propertyType,
        usage: d.usage,
        role: d.role,
        bedrooms: d.bedrooms,
        bathrooms: d.bathrooms,
        latitude: home.lat,
        longitude: home.lng,
        heating_type: d.heating_type || null,
        year_built: d.year_built,
        tenure: d.tenure || null,
        floor_area: d.floor_area,
        built_form: d.built_form,
        construction_age_band: d.construction_age_band,
        wall_construction: d.wall_construction || null,
        ...(details.usage === 'rented_home' && tenancyStart ? { tenancy_start: tenancyStart } : {}),
        ...(details.usage === 'rented_home' && tenancyEnd ? { tenancy_end: tenancyEnd } : {}),
      },
    });
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    if (coverRef.current) coverRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={next => { if (!next) onOpenChange(false); }}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto" data-dialog="add-property">
        <DialogHeader>
          <DialogTitle>{fixedUsage === 'let' ? 'Add a let property' : 'Add property'}</DialogTitle>
        </DialogHeader>

        {/* Cover image */}
        <div
          className="relative rounded-lg overflow-hidden h-36 bg-[#F5F5F0] cursor-pointer"
          onClick={() => coverRef.current?.click()}
        >
          {coverPreview ? (
            <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Camera className="w-7 h-7 text-[#C0C0B8]" />
              <p className="text-xs text-muted-foreground">Add cover photo (optional)</p>
            </div>
          )}
          <span className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
            <Camera className="w-3.5 h-3.5" />
            {coverPreview ? 'Change' : 'Add photo'}
          </span>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </div>

        <NewPropertyFields
          home={home}
          onHomeChange={h => {
            setHome(h);
            setErrors(prev => ({ ...prev, home: '' }));
          }}
          details={details}
          onDetailsChange={d => {
            setDetails(d);
            setErrors(prev => ({ ...prev, propertyType: '', yearBuilt: '' }));
          }}
          errors={errors}
          fixedUsage={!!fixedUsage}
          wording={wording}
        />

        {/* A renter's own tenancy dates (both optional) */}
        {details.usage === 'rented_home' && (
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 border-t pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-tenancy-start">Tenancy start <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="add-tenancy-start" type="date" value={tenancyStart} onChange={e => setTenancyStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-tenancy-end">Tenancy end or renewal <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="add-tenancy-end" type="date" value={tenancyEnd} min={tenancyStart || undefined} onChange={e => setTenancyEnd(e.target.value)} />
              {errors.tenancyEnd && <p className="text-xs text-destructive">{errors.tenancyEnd}</p>}
            </div>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={addMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={addMutation.isPending} className="min-w-[120px]" data-action="add-property">
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            {addMutation.isPending ? 'Adding…' : 'Add property'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPropertyDialog;
