import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, FileText, ClipboardList, Settings, Quote } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: ClipboardList, label: 'Tasks', path: '/dashboard/calendar' },
    { icon: Quote, label: 'Quotes', path: '/dashboard/job-leads' },
    // { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
    { icon: FileText, label: 'Documents', path: '/dashboard/documents' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <>
      <nav className="fixed left-0 top-0 h-full w-[280px] bg-[#F8F8F3] border-r border-gray-200 z-40 flex-col p-4 flex">
        {/* Header */}
        <div className="p-3 border border-[#EDEDED] rounded-[16px] flex items-center gap-3">
          <div className="h-9 w-9 bg-[#121212] rounded-[10px]"></div>
          <div className="">
            <h1 className="text-sm font-regular text-[#4B4B4B] aeonik">Home +</h1>
            <p className="text-xs text-[#4B4B4B] aeonik">Free Plan</p>
          </div>
        </div>

        {/* Main Menu */}
        <div className="flex-1 mt-4 overflow-y-auto">
          <p className="text-xs font-regular text-[#8B8B8B] mb-2">MAIN MENU</p>

          <ul className="space-y-1">
            {sidebarItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-[14px] py-3 rounded-lg text-sm font-medium transition-colors group ${
                      isActive ? 'bg-black text-white' : 'text-[#4A5565] hover:bg-black hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 group-hover:text-white ${isActive ? 'text-white' : 'text-[#4A5565]'}`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* User Info */}
        <div className="flex gap-3 items-center">
          <img src="/images/sidebar-img.png" alt="" className="h-9 w-9 rounded-full" />
          <div className="flex flex-col">
            <p className="text-sm font-regular text-[#4B4B4B]">Michael Robinson</p>
            <p className="text-xs text-[#4B4B4B]">michael.robin@gmail.com</p>
          </div>
          {/* <button
          onClick={signOut}
          className="mt-4 w-full text-left text-sm text-red-500 hover:text-red-600 transition-colors">
          Log Out
        </button> */}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
