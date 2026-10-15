import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, ChevronsUpDown, Settings, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { groupHomes } from '@/lib/household';

const SharedDot = () => (
  <Users className="w-3.5 h-3.5 shrink-0 text-sidebar-foreground/50" aria-label="Shared" />
);

const PropertySwitcher = () => {
  const { properties, activeProperty, setActivePropertyId } = useActiveProperty();
  const [open, setOpen] = useState(false);

  if (properties.length === 0) return null;

  const label = activeProperty?.name || activeProperty?.address || 'Select property';

  // Single property — static label, no picker needed.
  if (properties.length === 1) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 mb-4 rounded-2xl bg-white border border-sidebar-border shadow-sm">
        <Building2 className="w-[18px] h-[18px] shrink-0 text-sidebar-foreground/70" strokeWidth={1.5} />
        <span className="text-sm font-semibold text-sidebar-foreground truncate flex-1">{label}</span>
        {activeProperty?.is_shared && <SharedDot />}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 w-full px-4 py-2.5 mb-4 rounded-2xl bg-white hover:bg-sidebar-accent/10 border border-sidebar-border shadow-sm transition-colors"
        >
          <Building2 className="w-[18px] h-[18px] shrink-0 text-sidebar-foreground/70" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-sidebar-foreground truncate flex-1 text-left">{label}</span>
          {activeProperty?.is_shared && <SharedDot />}
          <ChevronsUpDown className="w-4 h-4 shrink-0 text-sidebar-foreground/70" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandList>
            {groupHomes(properties).map(group => (
            <CommandGroup key={group.key} heading={group.heading || undefined}>
              {group.items.map(p => (
                <CommandItem
                  key={p.id}
                  value={`${p.name ?? ''} ${p.address}`}
                  onSelect={() => {
                    setActivePropertyId(p.id);
                    setOpen(false);
                  }}
                >
                  <Check className={`mr-2 h-3.5 w-3.5 shrink-0 ${p.id === activeProperty?.id ? 'opacity-100' : 'opacity-0'}`} />
                  <span className="flex flex-col min-w-0 flex-1">
                    <span className="truncate font-medium text-sm leading-tight">{p.name || p.address}</span>
                    {p.name && <span className="truncate text-xs text-muted-foreground leading-tight">{p.address}</span>}
                  </span>
                  {p.is_shared && (
                    <span className="ml-2 shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Shared
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            ))}

          </CommandList>
          <div className="border-t p-1">
            <Link
              to="/dashboard/settings?tab=properties"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-sm hover:bg-accent transition-colors"
            >
              <Settings className="w-3.5 h-3.5" /> Manage properties
            </Link>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default PropertySwitcher;
