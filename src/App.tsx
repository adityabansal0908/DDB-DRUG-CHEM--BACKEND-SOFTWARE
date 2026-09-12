import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { AdminSidebar } from './components/admin/AdminSidebar';
import { FieldMonitoring } from './components/admin/FieldMonitoring';
import { ProductManagement } from './components/admin/ProductManagement';
import { RepsManagement } from './components/admin/RepsManagement';
import { OrdersApprovals } from './components/admin/OrdersApprovals';
import { RepMobileView } from './components/rep/RepMobileView';
import { PhotoModal } from './components/PhotoModal';
import { Toaster } from 'sonner';

const AppContent: React.FC = () => {
  const { role, activeAdminTab } = useApp();

  const renderAdminContent = () => {
    switch (activeAdminTab) {
      case 'monitoring':
        return <FieldMonitoring />;
      case 'products':
        return <ProductManagement />;
      case 'reps':
        return <RepsManagement />;
      case 'orders':
        return <OrdersApprovals />;
      default:
        return <FieldMonitoring />;
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

          {/* Main Operations Content Area */}
          <main
            id="admin-main-viewport"
            data-testid="admin-main-viewport"
            className="flex-1 lg:ml-[250px] min-h-[calc(100vh-4rem)] bg-slate-50 overflow-x-hidden"
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
