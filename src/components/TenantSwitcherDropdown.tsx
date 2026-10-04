import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Buildings,
  Check,
  Plus,
  CaretDown,
  ShieldCheck,
  ArrowRight,
  Sparkle
} from '@phosphor-icons/react';

interface TenantSwitcherDropdownProps {
  onOpenCreateOrg?: () => void;
}

export const TenantSwitcherDropdown: React.FC<TenantSwitcherDropdownProps> = ({
  onOpenCreateOrg
}) => {
  const {
    organizations,
    activeOrganization,
    switchOrganization,
    role,
    setActiveAdminTab
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectOrg = (orgId: string) => {
    switchOrganization(orgId);
    setIsOpen(false);
  };

  const handleGoToTenants = () => {
    setIsOpen(false);
    if (role === 'admin') {
      setActiveAdminTab('tenants');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="header-tenant-switcher-btn"
        data-testid="header-tenant-switcher-btn"
        onClick={() => setIsOpen(prev => !prev)}
        title={`Active Tenant: ${activeOrganization.name} (${activeOrganization.plan.toUpperCase()} Tier). Click to switch organization.`}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-medium cursor-pointer ${
          isOpen
            ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs ring-2 ring-blue-500/20'
            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 active:scale-95'
        }`}
      >
        <div
          className="w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs"
          style={{ backgroundColor: activeOrganization.primaryColor || '#2563eb' }}
        >
          {activeOrganization.name.charAt(0)}
        </div>
        <span className="font-semibold text-slate-900 truncate max-w-[100px] sm:max-w-[130px] hidden xs:inline">
          {activeOrganization.name}
        </span>
        <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700 capitalize">
          {activeOrganization.plan}
        </span>
        <CaretDown size={12} weight="bold" className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div
          id="tenant-switcher-menu"
          data-testid="tenant-switcher-menu"
          className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block font-heading">
                Organization / Tenant
              </span>
              <span className="text-[11px] text-slate-500 block">
                Strict isolated tenant partitioning
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck size={12} weight="bold" />
              Isolated
            </span>
          </div>

          {/* Organizations List */}
          <div className="max-h-60 overflow-y-auto space-y-1 py-1">
            {organizations.map(org => {
              const isSelected = org.id === activeOrganization.id;
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleSelectOrg(org.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 text-blue-900 border border-blue-200/80'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-2xs"
                      style={{ backgroundColor: org.primaryColor || '#2563eb' }}
                    >
                      {org.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                          {org.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono capitalize">
                          {org.plan}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {org.city || 'India'} • {org.id}
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check size={12} weight="bold" />
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      Switch <ArrowRight size={10} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            {role === 'admin' && (
              <button
                type="button"
                onClick={handleGoToTenants}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Buildings size={15} className="text-slate-500" />
                  <span>Tenants & Isolation Hub</span>
                </div>
                <ArrowRight size={12} />
              </button>
            )}

            {onOpenCreateOrg && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateOrg();
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus size={15} weight="bold" />
                <span>Provision New Organization</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
