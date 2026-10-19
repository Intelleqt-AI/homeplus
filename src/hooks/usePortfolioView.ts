import { useLocation } from 'react-router-dom';
import { useActiveProperty } from '@/hooks/useActiveProperty';

/**
 * Is the "All properties" overview showing? It is a view of the dashboard only: every other page
 * keeps working on the real active property, so Documents or Calendar never look like "all".
 * (Lives here, not in ActivePropertyProvider, which sits outside the router.)
 */
export function usePortfolioView() {
  const { canPortfolio, portfolioView, setPortfolioView } = useActiveProperty();
  const { pathname } = useLocation();
  const onDashboard = pathname === '/' || pathname === '/dashboard';
  return { canPortfolio, portfolioView, portfolioViewActive: portfolioView && onDashboard, setPortfolioView };
}
