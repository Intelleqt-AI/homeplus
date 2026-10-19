import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Check, ChevronsUpDown, LayoutGrid, Plus, Settings, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import AddPropertyDialog from '@/components/property/AddPropertyDialog';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { usePortfolioView } from '@/hooks/usePortfolioView';
import { groupHomes, propertyNickname } from '@/lib/household';

const SharedDot = () => (
  <Users className="w-3.5 h-3.5 shrink-0 text-sidebar-foreground/50" aria-label="Shared" />
);

const PropertySwitcher = () => {
  const { properties, activeProperty, setActivePropertyId } = useActiveProperty();
  const { canPortfolio, portfolioViewActive, setPortfolioView } = usePortfolioView();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  if (properties.length === 0) return null;

  // On the dashboard "All properties" can be showing; everywhere else the open property is.
  const label = portfolioViewActive ? 'All properties' : propertyNickname(activeProperty) || 'Select property';

  // Single property — static label, no picker needed.
  if (properties.length === 1) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 mb-4 rounded-2xl bg-white border border-sidebar-border shadow-sm">
        <Building2 className="w-[18px] h-[18px] shrink-0 text-sidebar-foreground/70" strokeWidth={1.5} />
        <span className="text-sm font-semibold text-sidebar-foreground truncate flex-1" data-switcher-label>{label}</span>
        {activeProperty?.is_shared && <SharedDot />}
      </div>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-property-switcher
            className="flex items-center gap-3 w-full px-4 py-2.5 mb-4 rounded-2xl bg-white hover:bg-sidebar-accent/10 border border-sidebar-border shadow-sm transition-colors"
          >
            {portfolioViewActive
              ? <LayoutGrid className="w-[18px] h-[18px] shrink-0 text-sidebar-foreground/70" strokeWidth={1.5} />
              : <Building2 className="w-[18px] h-[18px] shrink-0 text-sidebar-foreground/70" strokeWidth={1.5} />}
            <span className="text-sm font-semibold text-sidebar-foreground truncate flex-1 text-left" data-switcher-label>{label}</span>
            {!portfolioViewActive && activeProperty?.is_shared && <SharedDot />}
            <ChevronsUpDown className="w-4 h-4 shrink-0 text-sidebar-foreground/70" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0" align="start">
          <Command>
            <CommandList>
              {/* Landlord and "both" accounts: every property at once */}
              {canPortfolio && (
                <>
                  <CommandGroup>
                    <CommandItem
                      value="all properties"
                      data-switcher-item="all"
                      onSelect={() => {
                        setPortfolioView(true);
                        setOpen(false);
                        navigate('/dashboard');
                      }}
                    >
                      <Check className={`mr-2 h-3.5 w-3.5 shrink-0 ${portfolioViewActive ? 'opacity-100' : 'opacity-0'}`} />
                      <LayoutGrid className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium text-sm leading-tight">All properties</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              {groupHomes(properties).map(group => (
                <CommandGroup key={group.key} heading={group.heading || undefined}>
                  {group.items.map(p => {
                    const nickname = propertyNickname(p);
                    return (
                      <CommandItem
                        key={p.id}
                        value={`${nickname} ${p.address}`}
                        data-switcher-item={p.id}
                        onSelect={() => {
                          setActivePropertyId(p.id);
                          setOpen(false);
                        }}
                      >
                        <Check className={`mr-2 h-3.5 w-3.5 shrink-0 ${!portfolioViewActive && p.id === activeProperty?.id ? 'opacity-100' : 'opacity-0'}`} />
                        <span className="flex flex-col min-w-0 flex-1">
                          <span className="truncate font-medium text-sm leading-tight">{nickname}</span>
                          {nickname !== p.address && <span className="truncate text-xs text-muted-foreground leading-tight">{p.address}</span>}
                        </span>
                        {p.is_shared && (
                          <span className="ml-2 shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Shared
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
            <div className="border-t p-1">
              <button
                type="button"
                data-action="switcher-add-property"
                onClick={() => { setOpen(false); setAddOpen(true); }}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-sm hover:bg-accent transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add property
              </button>
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
      <AddPropertyDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
};

export default PropertySwitcher;
