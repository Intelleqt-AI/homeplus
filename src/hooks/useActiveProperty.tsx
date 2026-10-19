import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/hooks/useAuth';
import { fetchData } from '@/lib/Api';
import { isPortfolioAccount, type AccountType } from '@/lib/account';
import type { PropertyOption } from '@/components/property/PropertySelect';

const STORAGE_KEY = 'hp_active_property_id';
// "All properties" (the portfolio overview) or one property's own dashboard, per user.
const portfolioKey = (userId: string) => `hp_portfolio_view_${userId}`;
const PORTFOLIO_OVERVIEW = false;

interface ActivePropertyContextType {
  properties: PropertyOption[];
  isLoading: boolean;
  /** True once the home list has loaded (false while loading or after a failed load). */
  isLoaded: boolean;
  /** Always a real property id (pages pass it to the API as ?property=), never "all". */
  activePropertyId: string | null;
  activeProperty: PropertyOption | null;
  /** Picks a property; this also leaves the portfolio overview so its own dashboard opens. */
  setActivePropertyId: (id: string) => void;
  accountType: AccountType;
  /** Landlord / both account holding two or more homes of their own: the portfolio overview exists. */
  canPortfolio: boolean;
  /** The "All properties" choice is on (the default for those accounts). Only the dashboard shows it:
   *  use usePortfolioView() for "is it showing right now". */
  portfolioView: boolean;
  setPortfolioView: (on: boolean) => void;
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


  // Portfolio view: stored per user; unset means the default ("All properties" for landlord/both).
  const [portfolioPref, setPortfolioPref] = useState<'all' | 'property' | null>(null);
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) {
      setPortfolioPref(null);
      return;
    }
    try {
      const stored = localStorage.getItem(portfolioKey(userId));
      setPortfolioPref(stored === 'all' || stored === 'property' ? stored : null);
    } catch {
      setPortfolioPref(null);
    }
  }, [userId]);

  const rememberPortfolioPref = (pref: 'all' | 'property') => {
    setPortfolioPref(pref);
    if (!userId) return;
    try {
      localStorage.setItem(portfolioKey(userId), pref);
    } catch {
      // best effort
    }
  };

  const setActivePropertyId = (id: string) => {
    setActiveId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // best effort — per-browser convenience only, fine if storage is blocked
    }
    // Choosing a property (a row in the portfolio, the switcher, a newly added home) opens its dashboard.
    rememberPortfolioPref('property');
  };

  const accountType: AccountType = user?.account_type ?? 'homeowner';
  // The "All properties" overview is switched off: every account picks one home from the
  // sidebar switcher. Set PORTFOLIO_OVERVIEW to bring the overview back.
  const ownHomes = properties.filter(p => p.access !== 'member').length;
  const canPortfolio = PORTFOLIO_OVERVIEW && isPortfolioAccount(accountType) && ownHomes >= 2;
  const portfolioView = canPortfolio && (portfolioPref ?? 'all') === 'all';

  const activeProperty = useMemo(
    () => properties.find(p => p.id === activeId) ?? null,
    [properties, activeId],
  );

  return (
    <ActivePropertyContext.Provider
      value={{
        properties, isLoading, isLoaded: !!user && data !== undefined, activePropertyId: activeId, activeProperty,
        setActivePropertyId, accountType, canPortfolio, portfolioView,
        setPortfolioView: (on: boolean) => rememberPortfolioPref(on ? 'all' : 'property'),
      }}
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
