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
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PropertyOption {
  id: string;
  address: string;
  postcode: string;
  location?: string;
  name?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface PropertySelectProps {
  value: string;
  onChange: (propertyId: string, property: PropertyOption | undefined) => void;
  placeholder?: string;
  className?: string;
  /** When true, shows a red warning if the selected property has no lat/long pin. */
  requireMapPin?: boolean;
}

const PropertySelect = ({
  value,
  onChange,
  placeholder = 'Select a property',
  className,
  requireMapPin = false,
}: PropertySelectProps) => {
  const [open, setOpen] = React.useState(false);

  const { data: propertiesRes } = useFetch<{ results?: PropertyOption[]; data?: PropertyOption[] }>(
    '/api/v1/properties/',
  );
  const properties: PropertyOption[] = propertiesRes?.results ?? propertiesRes?.data ?? [];
  const selected = properties.find(p => p.id === value);

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
                    {selected.name || selected.address}
                  </span>
                  {selected.name && (
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
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search properties…" />
            <CommandList>
              <CommandEmpty>No properties found.</CommandEmpty>
              <CommandGroup>
                {properties.map(p => (
                  <CommandItem
                    key={p.id}
                    value={`${p.name ?? ''} ${p.address}`}
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
                        {p.name || p.address}
                      </span>
                      {p.name && (
                        <span className="truncate text-xs text-gray-400 leading-tight">
                          {p.address}
                          {p.postcode ? ` · ${p.postcode}` : ''}
                        </span>
                      )}
                    </span>
                    {p.postcode && !p.name && (
                      <Badge variant="outline" className="ml-auto text-xs shrink-0">
                        {p.postcode}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
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
