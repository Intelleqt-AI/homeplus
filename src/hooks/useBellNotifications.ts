import { useQuery } from '@tanstack/react-query';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { usePortfolioView } from '@/hooks/usePortfolioView';
import { fetchNotifications, notificationsKey } from '@/lib/notifications';

/**
 * The notifications behind the sidebar's bell and its Notifications badge: the active
 * home's, or the whole account's while "All properties" is showing. Both read this one
 * hook (and the page shares the same cache entry), so the counts never disagree.
 */
export function useBellNotifications() {
  const { activePropertyId } = useActiveProperty();
  const { portfolioViewActive } = usePortfolioView();
  const propertyId = portfolioViewActive ? null : activePropertyId;
  const query = useQuery({
    queryKey: notificationsKey(propertyId),
    queryFn: () => fetchNotifications(propertyId),
    refetchInterval: 5 * 60 * 1000,
  });
  return { ...query, propertyId };
}
