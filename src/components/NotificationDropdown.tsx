import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AdminNotification, NotificationType } from '../types';
import {
  Bell,
  BellRinging,
  Checks,
  Trash,
  X,
  MapPin,
  ShoppingCart,
  User,
  UserCheck,
  SpeakerSimpleHigh,
  SpeakerSimpleSlash,
  Sparkle,
  ArrowRight,
  Clock,
  Buildings,
  FirstAid,
  CheckCircle,
  WarningCircle,
  Lightning,
  Eye
} from '@phosphor-icons/react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    deleteNotification,
    notificationSoundEnabled,
    setNotificationSoundEnabled,
    simulateRepLiveEvent,
    setActiveAdminTab,
    setRole,
    role
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'visits' | 'orders' | 'reps' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Check if the click target is the bell button itself
        const bellBtn = document.getElementById('header-bell-icon');
        if (bellBtn && bellBtn.contains(event.target as Node)) {
          return;
        }
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
  }, [isOpen, onClose]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeFilter === 'unread') return !n.read;
      if (activeFilter === 'visits') return n.type === 'visit_logged';
      if (activeFilter === 'orders') return n.type === 'order_submitted' || n.type === 'sample_requested';
      if (activeFilter === 'reps') {
        return (
          n.type === 'rep_login' ||
          n.type === 'rep_logout' ||
          n.type === 'rep_status_change' ||
          n.type === 'rep_account_activity' ||
          n.type === 'location_update' ||
          n.type === 'target_update'
        );
      }
      return true;
    });
  }, [notifications, activeFilter]);

  if (!isOpen) return null;

  const handleNotificationClick = (item: AdminNotification) => {
    if (!item.read) {
      markNotificationAsRead(item.id);
    }
    if (item.targetTab) {
      if (role !== 'admin') {
        setRole('admin');
      }
      setActiveAdminTab(item.targetTab);
      onClose();
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'visit_logged':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <FirstAid size={16} weight="bold" />
          </div>
        );
      case 'order_submitted':
      case 'sample_requested':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
            <ShoppingCart size={16} weight="bold" />
          </div>
        );
      case 'rep_login':
      case 'rep_status_change':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
            <UserCheck size={16} weight="bold" />
          </div>
        );
      case 'location_update':
        return (
          <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 border border-cyan-200">
            <MapPin size={16} weight="bold" />
          </div>
        );
      case 'rep_logout':
      case 'rep_account_activity':
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
            <User size={16} weight="bold" />
          </div>
        );
    }
  };

  return (
    <div
      ref={dropdownRef}
      id="admin-notifications-dropdown"
      data-testid="admin-notifications-dropdown"
      className="absolute right-0 top-full mt-2 w-[92vw] sm:w-96 md:w-[440px] max-w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{ maxHeight: 'calc(100vh - 85px)' }}
    >
      {/* Header */}
      <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <BellRinging size={20} className="text-blue-400" weight="fill" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm tracking-tight">Real-Time Field Alerts</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Live Feed
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {unreadNotificationsCount > 0 ? (
                <span>
                  <strong className="text-blue-400 font-bold">{unreadNotificationsCount} unread</strong> alert{unreadNotificationsCount === 1 ? '' : 's'} awaiting review
                </span>
              ) : (
                'All field events synced in real-time'
              )}
            </p>
          </div>
        </div>

        {/* Audio Toggle & Close */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setNotificationSoundEnabled(prev => !prev)}
            title={notificationSoundEnabled ? 'Alert chime enabled (click to mute)' : 'Alert chime muted (click to unmute)'}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              notificationSoundEnabled
                ? 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {notificationSoundEnabled ? <SpeakerSimpleHigh size={16} weight="bold" /> : <SpeakerSimpleSlash size={16} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close notifications"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Bulk Actions */}
      <div className="px-3 pt-2.5 pb-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('visits')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === 'visits'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Visits
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('orders')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === 'orders'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Orders
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('reps')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === 'reps'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Rep Actions
          </button>
          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeFilter === 'unread'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span>Unread</span>
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadNotificationsCount}
              </span>
            </button>
          )}
        </div>

        {/* Action icons: Mark all as read & Clear */}
        <div className="flex items-center gap-1 ml-auto">
          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              id="mark-all-notifications-read-btn"
              data-testid="mark-all-notifications-read-btn"
              onClick={markAllNotificationsAsRead}
              title="Mark all notifications as read"
              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <Checks size={14} weight="bold" />
              <span className="hidden sm:inline text-[11px]">Mark read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              id="clear-all-notifications-btn"
              data-testid="clear-all-notifications-btn"
              onClick={clearAllNotifications}
              title="Clear all notifications"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Trash size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Simulator Bar for instant interactive testing */}
      <div className="px-3 py-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border-b border-blue-100/70">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold tracking-wider uppercase text-blue-800 flex items-center gap-1">
            <Lightning size={12} weight="fill" className="text-amber-500" />
            <span>Simulate Live Field Event (Instant Alert)</span>
          </span>
          <span className="text-[9px] text-blue-600 font-mono">Real-time Push</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            id="simulate-visit-alert-btn"
            data-testid="simulate-visit-alert-btn"
            onClick={() => simulateRepLiveEvent('visit')}
            className="py-1 px-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:border-emerald-300 rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95"
            title="Simulate sales rep logging a clinic visit"
          >
            <FirstAid size={11} weight="bold" className="text-emerald-600" />
            <span className="truncate">Log Visit</span>
          </button>

          <button
            type="button"
            id="simulate-order-alert-btn"
            data-testid="simulate-order-alert-btn"
            onClick={() => simulateRepLiveEvent('order')}
            className="py-1 px-1.5 bg-white hover:bg-purple-50 text-purple-800 border border-purple-200/80 hover:border-purple-300 rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95"
            title="Simulate sales rep booking a clinic order"
          >
            <ShoppingCart size={11} weight="bold" className="text-purple-600" />
            <span className="truncate">Book Order</span>
          </button>

          <button
            type="button"
            id="simulate-rep-account-alert-btn"
            data-testid="simulate-rep-account-alert-btn"
            onClick={() => simulateRepLiveEvent('checkin')}
            className="py-1 px-1.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200/80 hover:border-blue-300 rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95"
            title="Simulate rep GPS check-in or account telemetry"
          >
            <MapPin size={11} weight="bold" className="text-blue-600" />
            <span className="truncate">Rep Activity</span>
          </button>
        </div>
      </div>

      {/* Notifications List Body */}
      <div className="overflow-y-auto divide-y divide-slate-100 max-h-[380px] sm:max-h-[440px] bg-white">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCircle size={24} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">No notifications found</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                {activeFilter === 'unread'
                  ? 'All field alerts have been reviewed! You are completely up-to-date.'
                  : 'Tap any of the simulation buttons above to test live incoming field alerts.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => simulateRepLiveEvent('visit')}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Lightning size={13} weight="fill" />
              <span>Simulate Test Alert</span>
            </button>
          </div>
        ) : (
          filteredNotifications.map(item => (
            <div
              key={item.id}
              id={`notification-item-${item.id}`}
              data-testid={`notification-item-${item.id}`}
              onClick={() => handleNotificationClick(item)}
              className={`p-3 sm:p-3.5 transition-all flex items-start gap-3 relative group cursor-pointer hover:bg-slate-50/80 ${
                !item.read ? 'bg-blue-50/40 border-l-4 border-l-blue-600 pl-2.5 sm:pl-3' : ''
              }`}
            >
              {/* Type Icon */}
              {getNotificationIcon(item.type)}

              {/* Notification Content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    <span>{item.title}</span>
                    {item.priority === 'urgent' && (
                      <span className="text-[9px] font-bold px-1 rounded bg-red-100 text-red-700 border border-red-200 uppercase">
                        Urgent
                      </span>
                    )}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-0.5">
                    <Clock size={10} />
                    {item.formattedTime}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                  {item.message}
                </p>

                {/* Sub-details pills */}
                <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[10px]">
                  <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <User size={10} className="text-slate-500" />
                    <span>{item.repName}</span>
                  </span>

                  {item.metadata?.territory && (
                    <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <MapPin size={10} className="text-blue-500" />
                      <span className="truncate max-w-[120px]">{item.metadata.territory}</span>
                    </span>
                  )}

                  {item.metadata?.amount && item.metadata.amount > 0 && (
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      ₹{item.metadata.amount.toLocaleString('en-IN')}
                    </span>
                  )}

                  {/* Destination link badge */}
                  {item.targetTab && (
                    <span className="ml-auto font-medium text-blue-600 hover:text-blue-800 flex items-center gap-0.5 group-hover:underline">
                      <span>
                        {item.targetTab === 'monitoring'
                          ? 'View Visit'
                          : item.targetTab === 'orders'
                          ? 'Review Order'
                          : item.targetTab === 'reps'
                          ? 'View Rep'
                          : 'Details'}
                      </span>
                      <ArrowRight size={10} weight="bold" />
                    </span>
                  )}
                </div>
              </div>

              {/* Single item actions (mark read / delete) */}
              <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5" onClick={e => e.stopPropagation()}>
                {!item.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationAsRead(item.id)}
                    title="Mark as read"
                    className="w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <CheckCircle size={12} weight="bold" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteNotification(item.id)}
                  title="Remove alert"
                  className="w-5 h-5 rounded-full text-slate-300 hover:text-red-600 hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px]">
          Showing <strong>{filteredNotifications.length}</strong> of {notifications.length} alerts
        </span>
        <button
          type="button"
          onClick={() => {
            if (role !== 'admin') setRole('admin');
            setActiveAdminTab('history');
            onClose();
          }}
          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer hover:underline"
        >
          <span>View Operations Audit History</span>
          <ArrowRight size={11} weight="bold" />
        </button>
      </div>
    </div>
  );
};
