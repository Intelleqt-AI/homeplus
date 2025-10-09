import { Link, useLocation } from "react-router-dom";
import { 
  Home,
  Calendar,
  FileText,
  Briefcase,
  Settings,
  HelpCircle,
  LogOut,
  Activity
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Sidebar = () => {
  const location = useLocation();

  const sidebarItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Calendar, label: "Calendar", path: "/dashboard/calendar" },
    { icon: FileText, label: "Documents", path: "/dashboard/documents" },
    { icon: Briefcase, label: "Job Leads", path: "/dashboard/job-leads" },
    { icon: Activity, label: "Insights", path: "/dashboard/insights" },
    { icon: Settings, label: "Settings", path: "/dashboard/settings" },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-[72px] bg-white border-r border-gray-200 z-40">
      <div className="flex flex-col h-full">
        {/* Main Navigation */}
        <div className="flex-1 pt-6">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link to={item.path} className="block relative">
                    {isActive && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-r"></div>
                    )}
                    <div className={`flex items-center justify-center h-12 mx-2 rounded-lg transition-colors ${
                      isActive ? 'bg-primary' : 'hover:bg-gray-50'
                    }`}>
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-black'}`} strokeWidth={1} />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Bottom Items */}
        <div className="pb-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center h-12 mx-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <HelpCircle className="w-5 h-5 text-black" strokeWidth={1} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Help</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center h-12 mx-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <LogOut className="w-5 h-5 text-black" strokeWidth={1} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Log Out</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;