import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, ClipboardList, ClipboardCheck, Settings, LogOut, HelpCircle, Search, Menu, X, Bell, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/lib/Api';
import PropertySwitcher from './PropertySwitcher';
// Notification bell temporarily hidden; restore by uncommenting this and its two mounts below.
// import NotificationBell from './NotificationBell';
import { useBellNotifications } from '@/hooks/useBellNotifications';
import { useActiveProperty } from '@/hooks/useActiveProperty';
import { usePortfolioView } from '@/hooks/usePortfolioView';
import { myRole, myUsage } from '@/lib/household';
import { homeLabels } from '@/lib/account';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { activeProperty } = useActiveProperty();
  const { portfolioViewActive } = usePortfolioView();
  // The PRS register belongs to a let home: shown only while that home is selected.
  // The register is for whoever lets the home: its landlord owner, or a member they made its landlord.
  const hasLetHome = myRole(activeProperty) === 'landlord';
  // Unread badge: the active home's, or the whole account's under "All properties".
  // Same hook as the bell, so the badge and the bell never disagree.
  const { data: bellData } = useBellNotifications();
  const unreadCount = bellData?.unread_count ?? 0;

  const { data: msgData } = useQuery({
    queryKey: ['/api/v1/messaging/unread-count/'],
    queryFn: (): Promise<{ unread_count: number }> =>
      fetchData('/api/v1/messaging/unread-count/').then(
        (r: { data?: { unread_count: number } } & { unread_count?: number }) =>
          r?.data ?? (r as { unread_count: number }),
      ),
    refetchInterval: 60 * 1000,
  });
  const messagesUnread: number = (msgData as { unread_count?: number } | undefined)?.unread_count ?? 0;

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  // Where the app says "your home", a let property says "this property" and the overview "your properties".
  const labels = homeLabels(myUsage(activeProperty), portfolioViewActive);
  const sidebarItems = [
    { icon: Home, label: labels.nav, path: '/dashboard' },
    { icon: Search, label: 'Home Improvements', path: '/dashboard/job-leads' },
    { icon: FileText, label: 'Documents', path: '/dashboard/documents' },
    ...(hasLetHome ? [{ icon: ClipboardCheck, label: 'Rental register', path: '/dashboard/rental-register' }] : []),
    { icon: ClipboardList, label: 'Tasks & Reminders', path: '/dashboard/calendar' },
    { icon: MessageSquare, label: 'Messages', path: '/dashboard/messages', badge: messagesUnread },
    { icon: Bell, label: 'Notifications', path: '/dashboard/notifications', badge: unreadCount },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  // The bell rides in the desktop sidebar's header; on mobile it lives in the top bar.
  const renderNav = (withBell: boolean) => (
    <>
      {/* Header - Home+ Logo */}
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <img src="/homeplus-logo.png" alt="Home+" className="h-9 w-9 object-contain" />
          <span className="text-lg font-bold text-sidebar-foreground">Home+</span>
        </div>
        {/* {withBell && <NotificationBell />} */}
      </div>

      <PropertySwitcher />

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {sidebarItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <item.icon
                    className={`w-[18px] h-[18px] transition-colors duration-200 ${isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground'}`}
                    strokeWidth={1.5}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className={`min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none ${
                      isActive ? 'bg-sidebar-primary-foreground text-sidebar-primary' : 'bg-accent text-accent-foreground'
                    }`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Help / FAQ */}
      <div className="mb-3">
        <Link
          to="/dashboard/how-it-works"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 px-4 py-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          <HelpCircle className="w-4 h-4" strokeWidth={1.5} />
          <span>Help / FAQ</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="flex gap-3 items-center justify-between pt-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium text-sidebar-accent-foreground">
            {user?.user_metadata?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium text-sidebar-foreground">{user?.user_metadata?.full_name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate max-w-[160px]">{user?.email}</p>
          </div>
        </div>
        <LogOut
          onClick={handleSignOut}
          className="w-5 h-5 cursor-pointer text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          size={10}
        />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/homeplus-logo.png" alt="Home+" className="h-7 w-7 object-contain" />
          <span className="text-base font-bold text-sidebar-foreground">Home+</span>
        </div>
        <div className="flex items-center gap-1">
          {/* <NotificationBell /> */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-full hover:bg-sidebar-accent transition-colors">
            {mobileOpen ? <X className="w-5 h-5 text-sidebar-foreground" /> : <Menu className="w-5 h-5 text-sidebar-foreground" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setMobileOpen(false)} />}

      {/* Mobile slide-out sidebar */}
      <nav
        className={`lg:hidden fixed left-0 top-14 bottom-0 w-[280px] bg-sidebar border-r border-sidebar-border z-50 flex flex-col p-5 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {renderNav(false)}
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-full w-[280px] bg-sidebar border-r border-sidebar-border z-40 flex-col p-5">
        {renderNav(true)}
      </nav>
    </>
  );
};

export default Sidebar;
