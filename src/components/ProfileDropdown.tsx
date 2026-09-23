import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserGear,
  DeviceMobile,
  Monitor,
  Timer,
  SignOut,
  ShieldCheck,
  CheckCircle,
  X,
  Buildings,
  ArrowClockwise,
  Users,
  PencilSimple
} from '@phosphor-icons/react';
import { EditAdminModal } from './EditAdminModal';
import { UserAvatar } from './UserAvatar';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditAdmin?: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  onOpenEditAdmin
}) => {
  const {
    role,
    setRole,
    deviceView,
    setDeviceView,
    currentUser,
    currentRep,
    users,
    remainingSeconds,
    resetInactivityTimer,
    logout
  } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (isEditModalOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isEditModalOpen]);

  if (!isOpen) return null;

  const onlineReps = users.filter((u) => u.role === 'sales_rep' && u.isOnline);
  const totalReps = users.filter((u) => u.role === 'sales_rep');

  return (
    <div
      ref={dropdownRef}
      id="profile-section-dropdown"
      data-testid="profile-section-dropdown"
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Avatar and User Information */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <UserAvatar
                name={currentUser?.name || (role === 'admin' ? 'Aditya Bansal' : currentRep.name)}
                avatarUrl={
                  currentUser?.avatarUrl ||
                  (role === 'admin' ? 'monogram' : currentRep.avatarUrl)
                }
                avatarType={currentUser?.avatarType}
                className="w-12 h-12 border-2 border-white/30 ring-2 ring-white/10"
                textClassName="text-base font-bold font-heading"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900"
                title="Online"
              ></span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-white truncate font-heading">
                {currentUser?.name || (role === 'admin' ? 'Regional Director' : currentRep.name)}
              </h3>
              <p className="text-xs text-blue-200 truncate">
                {currentUser?.email || (role === 'admin' ? 'admin@ddbdrugchem.com' : 'rep@ddbdrugchem.com')}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    role === 'admin'
                      ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                      : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                  }`}
                >
                  {role === 'admin' ? 'Administrator' : 'Sales Representative'}
                </span>
              </div>
            </div>
          </div>

          {/* Top-Right Action Controls (Clean side-by-side flex layout, zero overlap) */}
          <div className="flex items-center gap-1.5 shrink-0 self-start">
            {role === 'admin' && (
              <button
                type="button"
                id="edit-admin-profile-btn"
                data-testid="edit-admin-profile-btn"
                onClick={() => {
                  if (onOpenEditAdmin) {
                    onOpenEditAdmin();
                  } else {
                    setIsEditModalOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 rounded-lg border border-white/20 transition-all cursor-pointer shadow-xs"
                title="Edit Admin details (Name, Email, Photo, Password)"
              >
                <PencilSimple size={13} weight="bold" />
                <span>Edit</span>
              </button>
            )}
            <button
              type="button"
              id="profile-dropdown-close-btn"
              data-testid="profile-dropdown-close-btn"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              title="Close profile section"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Workspace Role Switcher */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Switch View / Role
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              id="dropdown-role-admin-btn"
              data-testid="dropdown-role-admin-btn"
              onClick={() => {
                setRole('admin');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold transition-all ${
                role === 'admin'
                  ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <UserGear size={16} weight={role === 'admin' ? 'fill' : 'regular'} />
              <span>Admin Console</span>
            </button>
            <button
              id="dropdown-role-rep-btn"
              data-testid="dropdown-role-rep-btn"
              onClick={() => {
                setRole('sales_rep');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold transition-all ${
                role === 'sales_rep'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <DeviceMobile size={16} weight={role === 'sales_rep' ? 'fill' : 'regular'} />
              <span>Field App</span>
            </button>
          </div>
        </div>

        {/* Rep Mobile Frame View (If in sales rep view) */}
        {role === 'sales_rep' && (
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Field App Display Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeviceView('desktop')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  deviceView === 'desktop'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Monitor size={15} />
                <span>Full Width</span>
              </button>
              <button
                onClick={() => setDeviceView('mobile_frame')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  deviceView === 'mobile_frame'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <DeviceMobile size={15} />
                <span>Mobile Shell</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Field Force Presence Status */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
              <Users size={15} className="text-slate-500" />
              <span>Field Reps Online</span>
            </span>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
              {onlineReps.length} / {totalReps.length} Logged In
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
            {totalReps.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200"
                title={`${u.name} is ${u.isOnline ? 'online' : 'offline'}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    u.isOnline ? 'bg-emerald-500 ring-2 ring-emerald-100 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span className="text-[11px] font-medium text-slate-700 truncate max-w-[70px]">
                  {u.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 15-Minute Auto Logout Inactivity Watchdog */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
              <Timer size={15} className="text-amber-700" weight="bold" />
              <span>Inactivity Session Timer</span>
            </div>
            <span className="font-mono font-bold text-amber-900 tabular-nums">
              {Math.floor(remainingSeconds / 60)}:
              {(remainingSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <p className="text-[11px] text-amber-800 leading-tight">
            Security policy logs out automatically after 15 mins of inactivity.
          </p>
          <button
            onClick={resetInactivityTimer}
            className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1"
          >
            <ArrowClockwise size={13} weight="bold" />
            <span>Reset 15-Min Timer</span>
          </button>
        </div>

        {/* Logout Action */}
        <button
          id="profile-modal-logout-btn"
          data-testid="profile-modal-logout-btn"
          onClick={() => {
            onClose();
            logout('User signed out from profile section');
          }}
          className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2"
        >
          <SignOut size={16} weight="bold" />
          <span>Sign Out of Account</span>
        </button>
      </div>

      {/* Edit Admin Profile Details Modal */}
      <EditAdminModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
        }}
      />
    </div>
  );
};
