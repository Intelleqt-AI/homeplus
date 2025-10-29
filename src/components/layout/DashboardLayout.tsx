import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />

      {/* Main Content */}
      <div className="ml-[280px]">
        <TopHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
