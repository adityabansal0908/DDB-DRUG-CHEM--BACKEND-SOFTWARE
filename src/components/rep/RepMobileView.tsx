import React from 'react';
import { useApp } from '../../context/AppContext';
import { DdbLogo } from '../DdbLogo';
import { DoctorRouteList } from './DoctorRouteList';
import { CheckinForm } from './CheckinForm';
import { RepCatalog } from './RepCatalog';
import { RepActivity } from './RepActivity';
import {
  Signpost,
  Camera,
  Pill,
  ClockCounterClockwise,
  MapPin,
  DeviceMobile,
  CheckCircle,
  WifiHigh,
  BatteryMedium,
  CaretLeft
} from '@phosphor-icons/react';

export const RepMobileView: React.FC = () => {
  const {
    activeRepTab,
    setActiveRepTab,
    deviceView,
    currentRep,
    canGoBack,
    goBack,
    previousScreenName
  } = useApp();

  const navTabs = [
    {
      id: 'route' as const,
      label: "Today's Route",
      icon: Signpost
    },
    {
      id: 'checkin' as const,
      label: 'Chamber Check-in',
      icon: Camera
    },
    {
      id: 'catalog' as const,
      label: 'Formulary & Rates',
      icon: Pill
    },
    {
      id: 'activity' as const,
      label: 'My Logs',
      icon: ClockCounterClockwise
    }
  ];

  const renderActiveTab = () => {
    switch (activeRepTab) {
      case 'route':
        return <DoctorRouteList />;
      case 'checkin':
        return <CheckinForm />;
      case 'catalog':
        return <RepCatalog />;
      case 'activity':
        return <RepActivity />;
      default:
        return <DoctorRouteList />;
    }
  };

  // Content wrapper
  const content = (
    <div className="flex flex-col min-h-full bg-slate-50 relative">
      {/* Mobile Top App Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* "<" Sign Back Button to navigate to previous screen */}
          <button
            type="button"
            id="rep-mobile-back-btn"
            data-testid="rep-mobile-back-btn"
            onClick={canGoBack ? goBack : undefined}
            disabled={!canGoBack}
            title={canGoBack ? `Go back to ${previousScreenName} (<)` : 'Already on first screen'}
            aria-label={canGoBack ? `Go back to ${previousScreenName}` : 'Back button'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              canGoBack
                ? 'bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-800 border border-slate-300 shadow-2xs cursor-pointer group'
                : 'bg-slate-50 text-slate-300 border border-slate-200/50 cursor-not-allowed opacity-40'
            }`}
          >
            <CaretLeft size={18} weight="bold" className={canGoBack ? 'group-hover:-translate-x-0.5 transition-transform' : ''} />
            <span className="sr-only">Go back to previous screen</span>
          </button>
          <DdbLogo className="w-8 h-8 rounded-lg shadow-xs" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm font-heading">
                DDB DRUG CHEM
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {currentRep.name} &bull; {currentRep.territory.split('&')[0]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <div className="px-2 py-1 rounded bg-slate-100 flex items-center gap-1 text-[11px]">
            <WifiHigh size={13} className="text-emerald-600" />
            <span>4G Live</span>
          </div>
        </div>
      </div>

      {/* Main Tab Body */}
      <main className="flex-1 p-4 sm:p-5">
        {renderActiveTab()}
      </main>

      {/* Fixed Bottom Navigation Bar (as explicitly specified: fixed bottom-0, z-50, backdrop-blur-xl bg-white/80 border-t border-slate-200) */}
      <nav
        id="rep-bottom-nav"
        data-testid="rep-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 border-t border-slate-200 shadow-lg"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeRepTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`rep-nav-${tab.id}`}
                data-testid={`rep-nav-${tab.id}`}
                onClick={() => setActiveRepTab(tab.id)}
                className={`min-h-[48px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
                  }`}
                >
                  <Icon size={20} weight={isActive ? 'bold' : 'duotone'} />
                </div>
                <span className="text-[10px] tracking-tight leading-none whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );

  // If mobile frame is chosen on desktop, render inside a device frame mockup
  if (deviceView === 'mobile_frame') {
    return (
      <div className="py-8 px-4 flex justify-center items-start min-h-[calc(100vh-4rem)] bg-slate-200/70">
        <div className="relative w-full max-w-[420px] h-[860px] bg-white rounded-[44px] shadow-2xl border-[10px] border-slate-800 overflow-hidden flex flex-col">
          {/* Speaker / Camera Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
            <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
          </div>
          <div className="pt-4 flex-1 overflow-y-auto">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Full responsive mobile-first view
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      {content}
    </div>
  );
};
