import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <Sidebar />

      {/* Main Content - aligned with sidebar top */}
      <div className="lg:ml-[280px] pt-14 lg:pt-0">
        <TopHeader />
        <main className="p-4 md:p-6 pt-4 md:pt-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
