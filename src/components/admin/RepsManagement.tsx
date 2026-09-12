import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  MapPin,
  BatteryCharging,
  Phone,
  CheckCircle,
  CalendarCheck,
  TrendUp,
  Clock,
  NavigationArrow
} from '@phosphor-icons/react';

export const RepsManagement: React.FC = () => {
  const { reps, visits, setCurrentRep, setRole, setActiveRepTab } = useApp();

  const handleSimulateRepView = (rep: any) => {
    setCurrentRep(rep);
    setRole('sales_rep');
    setActiveRepTab('route');
  };

  return (
    <div
      id="reps-management-page"
      data-testid="reps-management-page"
      className="p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-6"
    >
      <div>
        <span className="text-xs font-bold tracking-[0.15em] uppercase text-blue-600 block mb-1">
          Field Operations
        </span>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 font-heading">
          Medical Representative Force
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-1">
          Active field force telemetry, GPS location verification, daily route compliance, and doctor detailing quotas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reps.map((rep) => {
          const repVisits = visits.filter(v => v.repId === rep.id);
          const completionPct = Math.round((rep.todayVisitsCompleted / rep.todayTarget) * 100);

          return (
            <div
              key={rep.id}
              id={`rep-card-${rep.id}`}
              data-testid={`rep-card-${rep.id}`}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5 flex flex-col justify-between hover:border-blue-300 transition-all"
            >
              <div className="space-y-4">
                {/* Header Profile */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={rep.avatarUrl}
                      alt={rep.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 font-heading text-lg">
                        {rep.name}
                      </h3>
                      <span className="text-xs font-mono text-slate-500 block">
                        {rep.employeeCode}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      rep.status === 'active_in_field'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rep.status === 'active_in_field' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    ></span>
                    {rep.status === 'active_in_field' ? 'In Field' : 'Stationary'}
                  </span>
                </div>

                {/* Territory & Contact */}
                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                      Assigned Territory
                    </span>
                    <span className="text-slate-800 font-medium">{rep.territory}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                      Direct Mobile
                    </span>
                    <span className="text-blue-700 font-medium flex items-center gap-1">
                      <Phone size={12} />
                      {rep.phone}
                    </span>
                  </div>
                </div>

                {/* Daily Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Daily Doctor Target</span>
                    <span className="font-bold tabular-nums text-slate-900">
                      {rep.todayVisitsCompleted} / {rep.todayTarget} completed ({completionPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, completionPct)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Live Telemetry Data */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      GPS Geolocation
                    </span>
                    <span className="text-slate-800 font-medium truncate flex items-center gap-1 mt-0.5">
                      <MapPin size={13} className="text-blue-600 shrink-0" />
                      {rep.currentLocationName.split('/')[0]}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Device & Signal
                    </span>
                    <span className="text-slate-800 font-medium flex items-center gap-1 mt-0.5">
                      <BatteryCharging size={14} className="text-emerald-600" />
                      {rep.batteryLevel}% &bull; GPS: {rep.gpsSignal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  data-testid={`simulate-rep-${rep.id}`}
                  onClick={() => handleSimulateRepView(rep)}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <NavigationArrow size={14} />
                  <span>Switch to {rep.name.split(' ')[0]}'s Field View</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
