import React from 'react';
import { useApp } from '../context/AppContext';
import {
  FirstAidKit,
  DeviceMobile,
  Monitor,
  Bell,
  CheckCircle,
  UserGear,
  User,
  ShieldCheck,
  Signpost
} from '@phosphor-icons/react';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    deviceView,
    setDeviceView,
    currentRep,
    orders,
    visits
  } = useApp();

  const pendingVisitsCount = visits.filter(v => v.approvalStatus === 'pending').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <header
      id="app-top-header"
      data-testid="app-top-header"
      className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 px-4 sm:px-6 flex items-center justify-between"
    >
      {/* Brand & Territory */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <FirstAidKit size={22} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-slate-900 text-lg sm:text-xl tracking-tight leading-none">
                PharmaTrack
              </span>
              <span className="hidden md:inline-flex text-[10px] uppercase font-extrabold tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block leading-tight mt-0.5">
              Clinical Field Monitoring & Sales Automation
            </p>
          </div>
        </div>

        {/* Territory Status Tag */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>North Medical Zone (Active)</span>
          <span className="text-slate-300">|</span>
          <span className="tabular-nums font-semibold text-slate-700">3 Reps Live</span>
        </div>
      </div>

      {/* Center / Right controls: Role Selector & Mode Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Toggle Selector */}
        <div
          id="role-toggle-group"
          data-testid="role-toggle-group"
          className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs"
        >
          <button
            id="role-admin-btn"
            data-testid="role-admin-btn"
            onClick={() => setRole('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              role === 'admin'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserGear size={16} weight={role === 'admin' ? 'fill' : 'regular'} />
            <span className="hidden sm:inline">Admin</span>
            <span>Dashboard</span>
          </button>
          <button
            id="role-rep-btn"
            data-testid="role-rep-btn"
            onClick={() => setRole('sales_rep')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              role === 'sales_rep'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DeviceMobile size={16} weight={role === 'sales_rep' ? 'fill' : 'regular'} />
            <span className="hidden sm:inline">Sales Rep</span>
            <span>Field App</span>
          </button>
        </div>

        {/* Rep Frame Toggle (When in rep mode, allows testing phone shell vs desktop) */}
        {role === 'sales_rep' && (
          <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              data-testid="toggle-mobile-shell-btn"
              onClick={() => setDeviceView(deviceView === 'mobile_frame' ? 'desktop' : 'mobile_frame')}
              title={deviceView === 'mobile_frame' ? 'Expand to Full View' : 'Preview in Phone Frame'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all font-medium ${
                deviceView === 'mobile_frame'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {deviceView === 'mobile_frame' ? (
                <>
                  <Monitor size={15} />
                  <span className="hidden md:inline">Full Width</span>
                </>
              ) : (
                <>
                  <DeviceMobile size={15} />
                  <span className="hidden md:inline">Mobile Frame</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Notifications / Pending Badge (Admin view) */}
        {role === 'admin' && (
          <div className="relative">
            <div
              title={`${pendingVisitsCount} visits pending approval, ${pendingOrdersCount} orders waiting`}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200 transition-colors relative cursor-default"
            >
              <Bell size={20} weight="bold" />
              {(pendingVisitsCount > 0 || pendingOrdersCount > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white"></span>
              )}
            </div>
          </div>
        )}

        {/* User Identity Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <img
            src={
              role === 'admin'
                ? 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxkb2N0b3IlMjBjbGluaWN8ZW58MHx8fHwxNzg4MTg4NjE5fDA&ixlib=rb-4.1.0&q=85'
                : currentRep.avatarUrl
            }
            alt="Current profile"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-slate-300 ring-2 ring-white"
          />
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {role === 'admin' ? 'Regional Director' : currentRep.name}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {role === 'admin' ? 'Dr. Verma (Admin)' : `${currentRep.employeeCode} &bull; Rep`}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
