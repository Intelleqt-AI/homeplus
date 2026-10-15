import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/hooks/useAuth';
import { fetchData } from '@/lib/Api';
import type { PropertyOption } from '@/components/property/PropertySelect';

const STORAGE_KEY = 'hp_active_property_id';

interface ActivePropertyContextType {
  properties: PropertyOption[];
  isLoading: boolean;
  /** True once the home list has loaded (false while loading or after a failed load). */
  isLoaded: boolean;
  activePropertyId: string | null;
  activeProperty: PropertyOption | null;
  setActivePropertyId: (id: string) => void;
}

const ActivePropertyContext = createContext<ActivePropertyContextType | undefined>(undefined);

export const ActivePropertyProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  // Key starts with '/api/v1/properties/' so every existing invalidation
  // (exact-prefix or startsWith predicate) still refreshes this list.
  const PROPERTIES_URL = '/api/v1/properties/?page_size=100';
  const { data, isLoading } = useFetch<{ results?: PropertyOption[]; data?: PropertyOption[] }>(
    user ? PROPERTIES_URL : null,
    {
      queryKey: ['/api/v1/properties/', { page_size: 100, user: user?.id ?? null }],
      queryFn: () => fetchData(PROPERTIES_URL),
    },
  );
  const properties: PropertyOption[] = useMemo(
    () => (user ? data?.results ?? data?.data ?? [] : []),
    [user, data],
  );

  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  // Default to the first property once the list loads, and fall back to it
  // if the stored id no longer matches anything (e.g. deleted elsewhere).
  // A loaded-but-empty list (e.g. access to a shared home was removed) clears
  // the stored id so pages don't keep filtering by a home we can't reach.
  useEffect(() => {
    if (!user || data === undefined) return;
    if (activeId && properties.some(p => p.id === activeId)) return;
    const next = properties[0]?.id ?? null;
    if (next === activeId) return;
    setActiveId(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // best effort
    }
  }, [user, data, properties, activeId]);


  const setActivePropertyId = (id: string) => {
    setActiveId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // best effort — per-browser convenience only, fine if storage is blocked
    }
  };

  const activeProperty = useMemo(
    () => properties.find(p => p.id === activeId) ?? null,
    [properties, activeId],
  );

  return (
    <ActivePropertyContext.Provider
      value={{ properties, isLoading, isLoaded: !!user && data !== undefined, activePropertyId: activeId, activeProperty, setActivePropertyId }}
    >
      {children}
    </ActivePropertyContext.Provider>
  );
};

export const useActiveProperty = () => {
  const context = useContext(ActivePropertyContext);
  if (context === undefined) throw new Error('useActiveProperty must be used within an ActivePropertyProvider');
  return context;
};
