import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { AdminSidebar } from './components/admin/AdminSidebar';
import { FieldMonitoring } from './components/admin/FieldMonitoring';
import { DoctorManagement } from './components/admin/DoctorManagement';
import { ProductManagement } from './components/admin/ProductManagement';
import { RepsManagement } from './components/admin/RepsManagement';
import { OrdersApprovals } from './components/admin/OrdersApprovals';
import { AuditHistory } from './components/admin/AuditHistory';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SalesRepReports } from './components/admin/SalesRepReports';
import { RepMobileView } from './components/rep/RepMobileView';
import { PhotoModal } from './components/PhotoModal';
import { SignedOutPage } from './components/SignedOutPage';
import { Toaster } from 'sonner';

const AppContent: React.FC = () => {
  const { role, activeAdminTab, isSidebarCollapsed, currentUser } = useApp();

  // If user is signed out, render dedicated full-page signed out screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white font-sans selection:bg-[#372b83]/20 selection:text-[#372b83]">
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              borderRadius: '12px',
              fontFamily: 'Manrope, sans-serif'
            }
          }}
        />
        <SignedOutPage />
      </div>
    );
  }

  const renderAdminContent = () => {
    switch (activeAdminTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'reports':
        return <SalesRepReports />;
      case 'monitoring':
        return <FieldMonitoring />;
      case 'doctors':
        return <DoctorManagement />;
      case 'products':
        return <ProductManagement />;
      case 'reps':
        return <RepsManagement />;
      case 'orders':
        return <OrdersApprovals />;
      case 'history':
        return <AuditHistory />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontFamily: 'Manrope, sans-serif'
          }
        }}
      />

      {/* High-res Proof Photo Modal */}
      <PhotoModal />

      {/* Global Top Header (Fixed 64px) */}
      <Header />

      {/* Role-Based Layout Rendering */}
      {role === 'admin' ? (
        <div className="flex pt-16 min-h-screen">
          {/* Desktop Fixed Sidebar (250px) */}
          <AdminSidebar />

          {/* Main Operations Content Area - Expands to 100% width when collapsed for great phone visibility */}
          <main
            id="admin-main-viewport"
            data-testid="admin-main-viewport"
            className={`flex-1 min-h-[calc(100vh-4rem)] bg-slate-50 overflow-x-hidden transition-all duration-300 ${
              isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-[250px]'
            }`}
          >
            {renderAdminContent()}
          </main>
        </div>
      ) : (
        <div className="pt-16 min-h-screen">
          <RepMobileView />
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
