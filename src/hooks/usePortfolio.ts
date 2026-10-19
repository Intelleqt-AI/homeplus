import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchPortfolio } from '@/lib/Api2';

// Keys start with '/api/v1/properties/' so every existing property invalidation also refreshes them.
export const PORTFOLIO_KEY = '/api/v1/properties/portfolio/';

/** The landlord's overview: a row per home with its status and next due item. */
export function usePortfolio(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [PORTFOLIO_KEY, user?.id ?? null],
    queryFn: fetchPortfolio,
    enabled: enabled && !!user,
    // Calendar and document writes elsewhere do not invalidate it, so look again when it is shown.
    staleTime: 60_000,
    refetchOnMount: 'always',
  });
}
