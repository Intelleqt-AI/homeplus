import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import AddFirstHome from '@/components/AddFirstHome';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const Spinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { properties, isLoading: homesLoading, isLoaded: homesLoaded } = useActiveProperty();

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user._raw?.profile?.onboarding_completed === false) {
    return <Navigate to="/onboarding" replace />;
  }

  // Every account needs a home (its own or one shared with it). Older accounts that
  // skipped it during onboarding add one here. A failed home-list load lets them in.
  if (homesLoading) {
    return <Spinner />;
  }
  if (homesLoaded && properties.length === 0) {
    return <AddFirstHome />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
