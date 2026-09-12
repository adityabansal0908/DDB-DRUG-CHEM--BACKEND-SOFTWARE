import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChartLineUp,
  Pill,
  Users,
  ShoppingCart,
  ShieldCheck,
  CheckCircle,
  MapPinLine,
  CaretRight
} from '@phosphor-icons/react';

export const AdminSidebar: React.FC = () => {
  const {
    activeAdminTab,
    setActiveAdminTab,
    visits,
    products,
    reps,
    orders
  } = useApp();

  const pendingVisits = visits.filter(v => v.approvalStatus === 'pending').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const navItems = [
    {
      id: 'monitoring' as const,
      label: 'Field Monitoring',
      icon: ChartLineUp,
      badge: pendingVisits > 0 ? `${pendingVisits} New` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'products' as const,
      label: 'Product Catalog',
      icon: Pill,
      badge: `${products.length}`,
      badgeColor: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'reps' as const,
      label: 'Medical Reps',
      icon: Users,
      badge: `${reps.length} Active`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    },
    {
      id: 'orders' as const,
      label: 'Orders & Dispatches',
      icon: ShoppingCart,
      badge: pendingOrders > 0 ? `${pendingOrders} Pending` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    }
  ];

  return (
    <aside
      id="admin-sidebar"
      data-testid="admin-sidebar"
      className="fixed top-16 left-0 bottom-0 w-[250px] bg-white border-r border-slate-200 z-30 flex flex-col justify-between overflow-y-auto"
    >
      <div className="p-4 space-y-6">
        {/* Navigation Group */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 px-3 mb-2">
            Operations Console
          </div>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  data-testid={`admin-nav-${item.id}`}
                  onClick={() => setActiveAdminTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} weight={isActive ? 'bold' : 'duotone'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Territory Live Status */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Geo-Fence Accuracy
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle size={14} weight="fill" />
              98.4%
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98%' }}></div>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            All visits require GPS verification within 50m radius of verified clinics.
          </p>
        </div>
      </div>

      {/* Footer System Info */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={16} className="text-blue-600" weight="duotone" />
          <span>HIPAA & FDA 21 CFR Compliant</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">
          v2.4.0-clinical &bull; Node 12-Bento
        </p>
      </div>
    </aside>
  );
};
