import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, ClipboardList, Settings, LogOut, HelpCircle, Search, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Sidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarItems = [
    { icon: Home, label: 'My Home', path: '/dashboard' },
    { icon: FileText, label: 'Documents', path: '/dashboard/documents' },
    { icon: ClipboardList, label: 'Tasks', path: '/dashboard/calendar' },
    { icon: Search, label: 'Find a Trade', path: '/dashboard/job-leads' },
    { icon: HelpCircle, label: 'How it Works', path: '/dashboard/how-it-works' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const navContent = (
    <>
      {/* Header - Home+ Logo */}
      <div className="flex items-center gap-2 mb-8">
        <svg width="24" height="22" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 10L14 2L25 10V22C25 22.5304 24.7893 23.0391 24.4142 23.4142C24.0391 23.7893 23.5304 24 23 24H5C4.46957 24 3.96086 23.7893 3.58579 23.4142C3.21071 23.0391 3 22.5304 3 22V10Z" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        <span className="text-lg font-bold text-[#1A1A1A]">Home+</span>
      </div>

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
                    isActive ? 'bg-[#1A1A1A] text-white' : 'text-[#4A4A4A] hover:bg-[#E8E8E3] hover:text-[#1A1A1A]'
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] transition-colors duration-200 ${isActive ? 'text-white' : 'text-[#4A4A4A] group-hover:text-[#1A1A1A]'}`} strokeWidth={1.5} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User Info */}
      <div className="flex gap-3 items-center justify-between pt-4 border-t border-[#E8E8E3]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#E8E8E3] flex items-center justify-center text-sm font-medium text-[#1A1A1A]">
            {user?.user_metadata?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium text-[#1A1A1A]">{user?.user_metadata?.full_name}</p>
            <p className="text-xs text-[#6B6B6B] truncate max-w-[160px]">{user?.email}</p>
          </div>
        </div>
        <LogOut onClick={signOut} className="w-5 h-5 cursor-pointer text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors" size={10} />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#F5F5F0] border-b border-[#E8E8E3] z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <svg width="20" height="18" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10L14 2L25 10V22C25 22.5304 24.7893 23.0391 24.4142 23.4142C24.0391 23.7893 23.5304 24 23 24H5C4.46957 24 3.96086 23.7893 3.58579 23.4142C3.21071 23.0391 3 22.5304 3 22V10Z" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span className="text-base font-bold text-[#1A1A1A]">Home+</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-full hover:bg-[#E8E8E3] transition-colors">
          {mobileOpen ? <X className="w-5 h-5 text-[#1A1A1A]" /> : <Menu className="w-5 h-5 text-[#1A1A1A]" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile slide-out sidebar */}
      <nav className={`lg:hidden fixed left-0 top-14 bottom-0 w-[280px] bg-[#F5F5F0] border-r border-[#E8E8E3] z-50 flex flex-col p-5 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {navContent}
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-full w-[280px] bg-[#F5F5F0] border-r border-[#E8E8E3] z-40 flex-col p-5">
        {navContent}
      </nav>
    </>
  );
};

export default Sidebar;
