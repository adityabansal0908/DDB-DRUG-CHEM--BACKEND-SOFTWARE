import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DdbLogo } from './DdbLogo';
import { Bell, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { ProfileDropdown } from './ProfileDropdown';
import { UserAvatar } from './UserAvatar';
import { EditAdminModal } from './EditAdminModal';
import { NotificationDropdown } from './NotificationDropdown';

export const Header: React.FC = () => {
  const {
    role,
    currentRep,
    orders,
    visits,
    isSidebarCollapsed,
    toggleSidebar,
    currentUser,
    unreadNotificationsCount,
    notifications,
    canGoBack,
    goBack,
    previousScreenName
  } = useApp();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);

  const pendingVisitsCount = visits.filter(v => v.approvalStatus === 'pending').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <header
      id="app-top-header"
      data-testid="app-top-header"
      className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 px-3 sm:px-6 flex items-center justify-between"
    >
      {/* Brand & Navigation Back Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* "<" Sign Back Button to navigate to previous screen */}
        <button
          type="button"
          id="global-header-back-btn"
          data-testid="global-header-back-btn"
          onClick={canGoBack ? goBack : undefined}
          disabled={!canGoBack}
          title={canGoBack ? `Go back to ${previousScreenName} (<)` : 'Already on first screen'}
          aria-label={canGoBack ? `Go back to ${previousScreenName}` : 'Back button'}
          className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all ${
            canGoBack
              ? 'bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-800 hover:text-slate-950 font-bold border border-slate-300 shadow-2xs cursor-pointer group'
              : 'bg-slate-50 text-slate-300 border border-slate-200/50 cursor-not-allowed opacity-40'
          }`}
        >
          <CaretLeft size={20} weight="bold" className={canGoBack ? 'group-hover:-translate-x-0.5 transition-transform' : ''} />
          <span className="sr-only">Go back to previous screen</span>
        </button>

        <button
          type="button"
          id="company-logo-collapse-btn"
          data-testid="company-logo-collapse-btn"
          onClick={role === 'admin' ? toggleSidebar : undefined}
          title={
            role === 'admin'
              ? isSidebarCollapsed
                ? 'Click company logo to expand Operations Console'
                : 'Click company logo to collapse Operations Console'
              : 'DDB DRUG CHEM'
          }
          className={`flex items-center gap-2.5 sm:gap-3 text-left rounded-xl transition-all p-1 -m-1 group ${
            role === 'admin'
              ? 'hover:bg-slate-100/80 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40'
              : 'cursor-default'
          }`}
        >
          <div className="relative">
            <DdbLogo className="w-10 h-10 shadow-xs group-hover:shadow-md transition-shadow" />
            {role === 'admin' && (
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border border-white shadow-xs transition-colors ${
                  isSidebarCollapsed
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700 group-hover:bg-blue-600 group-hover:text-white'
                }`}
                title={isSidebarCollapsed ? 'Expand console' : 'Collapse console'}
              >
                {isSidebarCollapsed ? (
                  <CaretRight size={10} weight="bold" />
                ) : (
                  <CaretLeft size={10} weight="bold" />
                )}
              </span>
            )}
          </div>
          <div>
            <span className="font-heading font-bold text-slate-900 text-lg sm:text-xl tracking-tight leading-none block">
              DDB DRUG CHEM
            </span>
          </div>
        </button>
      </div>

      {/* Right side: Bell icon and Profile icon only */}
      <div className="flex items-center gap-2 sm:gap-3 relative">
        {/* Bell Icon Button */}
        <div className="relative">
          <button
            type="button"
            id="header-bell-icon"
            data-testid="header-bell-icon"
            onClick={() => {
              setIsNotificationsOpen(prev => {
                const next = !prev;
                if (next) setIsProfileOpen(false);
                return next;
              });
            }}
            title={
              unreadNotificationsCount > 0
                ? `${unreadNotificationsCount} unread field alerts (${notifications.length} total)`
                : `Real-time field notifications (${notifications.length} alerts)`
            }
            className={`p-2 rounded-xl transition-all cursor-pointer relative flex items-center justify-center ${
              isNotificationsOpen
                ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-500/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bell size={22} weight={unreadNotificationsCount > 0 ? 'fill' : 'bold'} className={unreadNotificationsCount > 0 ? 'text-blue-600' : ''} />
            {unreadNotificationsCount > 0 ? (
              <span
                id="header-bell-unread-badge"
                data-testid="header-bell-unread-badge"
                className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse"
              >
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            ) : pendingVisitsCount > 0 || pendingOrdersCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white"></span>
            ) : null}
          </button>

          {/* Real-time Field Alerts Dropdown */}
          <NotificationDropdown
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        {/* Profile Icon Button (Tapping opens the Profile Section) */}
        <div className="relative">
          <button
            type="button"
            id="header-profile-btn"
            data-testid="header-profile-btn"
            onClick={() => {
              setIsProfileOpen(prev => {
                const next = !prev;
                if (next) setIsNotificationsOpen(false);
                return next;
              });
            }}
            title="Open user profile and workspace settings"
            className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-blue-500/40 transition-all cursor-pointer group"
          >
            <div className="relative">
              <UserAvatar
                name={currentUser?.name || (role === 'admin' ? 'Aditya Bansal' : currentRep.name)}
                avatarUrl={
                  currentUser?.avatarUrl ||
                  (role === 'admin' ? 'monogram' : currentRep.avatarUrl)
                }
                avatarType={currentUser?.avatarType}
                className="w-9 h-9 sm:w-10 sm:h-10 border border-slate-300 ring-2 ring-white group-hover:scale-105 transition-transform"
                textClassName="text-xs sm:text-sm font-bold font-heading"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>
          </button>

          {/* Profile Section Dropdown (shows role toggle, frame mode, reps presence, 15m timer, and sign out) */}
          <ProfileDropdown
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onOpenEditAdmin={() => {
              setIsProfileOpen(false);
              setIsEditAdminOpen(true);
            }}
          />

          {/* Edit Admin Modal portaled cleanly from Header */}
          <EditAdminModal
            isOpen={isEditAdminOpen}
            onClose={() => setIsEditAdminOpen(false)}
          />
        </div>
      </div>
    </header>
  );
};
