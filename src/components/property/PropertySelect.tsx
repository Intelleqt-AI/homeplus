import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import useFetch from '@/hooks/useFetch';
import { Check, ChevronsUpDown, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupHomes, propertyNickname } from '@/lib/household';

export interface PropertyOption {
  id: string;
  address: string;
  postcode: string;
  location?: string;
  name?: string;
  latitude?: number | null;
  longitude?: number | null;
  // Rest of the Property API shape — not used by this picker, but present on
  // every row, so other consumers (e.g. useActiveProperty) can rely on it too.
  role?: string;
  /** What the home is to its owner: own_home / let / rented_home. */
  usage?: 'own_home' | 'let' | 'rented_home';
  /** What the app calls it: the name, else the first line of the address. */
  nickname?: string;
  /** england / scotland / wales / northern_ireland, or '' when it could not be worked out. */
  nation?: string;
  tenancy_start?: string | null;
  tenancy_end?: string | null;
  contents_insurance_renewal?: string | null;
  property_type?: string;
  heating_type?: string;
  year_built?: number | null;
  epc_band?: string | null;
  /** Linked home/certificate on the GOV.UK EPC register (read-only). */
  epc_uprn?: string;
  epc_certificate_number?: string;
  epc_checked_at?: string | null;
  // Family members: 'member' = shared with me by owner_name.
  access?: 'owner' | 'member';
  owner_id?: string | null;
  owner_name?: string | null;
  is_shared?: boolean;
  member_count?: number;
  /** The role the app uses for the caller: a member's own role on the home, else `role`. */
  my_role?: string;
  /** What the owner made a member on this home (incl. "family"); null for the owner. */
  member_role?: string | null;
}

interface PropertySelectProps {
  value: string;
  onChange: (propertyId: string, property: PropertyOption | undefined) => void;
  placeholder?: string;
  className?: string;
  /** When true, shows a red warning if the selected property has no lat/long pin. */
  requireMapPin?: boolean;
  /** When true, always shows the searchable dropdown even if only one property exists. */
  showDropdown?: boolean;
}

const PropertySelect = ({
  value,
  onChange,
  placeholder = 'Select a property',
  className,
  requireMapPin = false,
  showDropdown = false,
}: PropertySelectProps) => {
  const [open, setOpen] = React.useState(false);

  const { data: propertiesRes } = useFetch<{ results?: PropertyOption[]; data?: PropertyOption[] }>(
    '/api/v1/properties/',
  );
  const properties: PropertyOption[] = propertiesRes?.results ?? propertiesRes?.data ?? [];
  const selected = properties.find(p => p.id === value);

  // Single property — static read-only display, no search needed (skip when showDropdown is set)
  if (properties.length === 1 && !showDropdown) {
    const only = properties[0];
    return (
      <div className={cn('w-full overflow-hidden', className)}>
        <div className="w-full min-h-10 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm flex items-center gap-2 overflow-hidden">
          <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
          <div className="w-0 flex-1 overflow-hidden">
            <p className="truncate font-medium text-gray-900 leading-tight text-sm">
              {propertyNickname(only)}
            </p>
            {propertyNickname(only) !== only.address && (
              <p className="truncate text-xs text-gray-400 leading-tight">
                {only.address}{only.postcode ? ` · ${only.postcode}` : ''}
              </p>
            )}
          </div>
        </div>
        {requireMapPin && (only.latitude === null || only.longitude === null) && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            ⚠ This property has no map pin yet. Go to <strong>Settings → Properties</strong> and drag the pin to its exact location before posting the job.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full min-h-10 px-3 py-2 rounded-lg border text-sm flex items-center justify-between gap-2 bg-white border-gray-200 hover:bg-gray-50 transition-colors',
              !value && 'text-gray-400',
            )}
          >
            <span className="flex items-center gap-2 min-w-0 flex-1">
              <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
              {selected ? (
                <span className="flex flex-col min-w-0 text-left">
                  <span className="truncate font-medium max-w-[300px] text-gray-900 leading-tight">
                    {propertyNickname(selected)}
                  </span>
                  {propertyNickname(selected) !== selected.address && (
                    <span className="truncate text-xs text-gray-400 max-w-[300px] leading-tight">
                      {selected.address}
                      {selected.postcode ? ` · ${selected.postcode}` : ''}
                    </span>
                  )}
                </span>
              ) : (
                <span>{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[16rem] max-w-[calc(100vw-2rem)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search properties…" />
            <CommandList>
              <CommandEmpty>No properties found.</CommandEmpty>
              {groupHomes(properties).map(group => (
              <CommandGroup key={group.key} heading={group.heading || undefined}>
                {group.items.map(p => (
                  <CommandItem
                    key={p.id}
                    value={`${propertyNickname(p)} ${p.address}`}
                    onSelect={() => {
                      onChange(p.id, p);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3.5 w-3.5 shrink-0',
                        value === p.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="flex flex-col min-w-0 flex-1">
                      <span className="truncate font-medium text-gray-900 text-sm leading-tight">
                        {propertyNickname(p)}
                      </span>
                      {propertyNickname(p) !== p.address && (
                        <span className="truncate text-xs text-gray-400 leading-tight">
                          {p.address}
                          {p.postcode ? ` · ${p.postcode}` : ''}
                        </span>
                      )}
                    </span>
                    {p.is_shared && (
                      <Users className="ml-1 h-3.5 w-3.5 shrink-0 text-gray-400" aria-label="Shared" />
                    )}
                    {p.postcode && propertyNickname(p) === p.address && (
                      <Badge variant="outline" className="ml-auto text-xs shrink-0">
                        {p.postcode}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              ))}

            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {requireMapPin && selected && (selected.latitude === null || selected.longitude === null) && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          ⚠ This property has no map pin yet. Go to <strong>Settings → Properties</strong> and drag the pin to its
          exact location before posting the job.
        </p>
      )}
    </div>
  );
};

export default PropertySelect;
