import { GooeyToaster } from 'goey-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Index from './pages/Index';
import Home2 from './pages/Home2';
import Features from './pages/Features';
import FeaturesPage from './pages/FeaturesPage';

import NotFound from './pages/NotFound';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import HomePlusDashboard from './pages/HomePlusDashboard';
import Insights from './pages/Insights';

import Documents from './pages/homeplus/Documents';
import JobLeads from './pages/homeplus/JobLeads';
import JobDetail from './pages/homeplus/JobDetail';
import Calendar from './pages/homeplus/Calendar';
import Settings from './pages/homeplus/Settings';
import HowItWorks from './pages/homeplus/HowItWorks';
import NotificationsPage from './pages/homeplus/Notifications';
import Messages from './pages/homeplus/Messages';
import EnergyEPC from './pages/homeplus/EnergyEPC';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime:    10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <GooeyToaster preset="subtle" position="bottom-right" />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePlusDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/home2" element={<Home2 />} />
            <Route path="/how-it-works" element={<Home2 />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/homeowners/features" element={<Features />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <HomePlusDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />

            <Route
              path="/dashboard/documents"
              element={
                <ProtectedRoute>
                  <Documents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/job-leads"
              element={
                <ProtectedRoute>
                  <JobLeads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <ProtectedRoute>
                  <JobDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/insights"
              element={
                <ProtectedRoute>
                  <Insights />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/how-it-works"
              element={
                <ProtectedRoute>
                  <HowItWorks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/energy"
              element={
                <ProtectedRoute>
                  <EnergyEPC />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
