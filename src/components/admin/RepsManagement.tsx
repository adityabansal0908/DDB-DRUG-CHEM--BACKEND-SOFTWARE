import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SalesRep } from '../../types';
import {
  Users,
  MapPin,
  BatteryCharging,
  Phone,
  CheckCircle,
  CalendarCheck,
  TrendUp,
  Clock,
  NavigationArrow,
  Target,
  Storefront,
  Pill,
  CurrencyInr,
  Sparkle,
  PencilSimple,
  CaretRight
} from '@phosphor-icons/react';
import { RepTargetModal } from './RepTargetModal';
import { RepActivityNetworkModal } from './RepActivityNetworkModal';
import { RepTerritoryModal } from './RepTerritoryModal';

export const RepsManagement: React.FC = () => {
  const { reps, visits, doctors, retailCounters, setCurrentRep, setRole, setActiveRepTab, users } = useApp();

  const [selectedRepForTarget, setSelectedRepForTarget] = useState<SalesRep | null>(null);
  const [selectedRepForNetwork, setSelectedRepForNetwork] = useState<SalesRep | null>(null);
  const [selectedRepForTerritory, setSelectedRepForTerritory] = useState<SalesRep | null>(null);

  const handleSimulateRepView = (rep: any) => {
    setCurrentRep(rep);
    setRole('sales_rep');
    setActiveRepTab('route');
  };

  return (
    <div
      id="reps-management-page"
      data-testid="reps-management-page"
      className="p-3 sm:p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-4 sm:space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-blue-600 block mb-1">
            Field Operations
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 font-heading">
            Medical Representative Force
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Active field force telemetry, monthly targets & quotas, doctor meeting detailing, and retail counter distribution.
          </p>
        </div>

        {/* Global Rep Summary Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Active Reps
            </span>
            <span className="text-lg font-bold text-slate-900 font-heading">
              {reps.length}
            </span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Retail Counters
            </span>
            <span className="text-lg font-bold text-emerald-700 font-heading">
              {retailCounters.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reps.map((rep) => {
          const repVisits = visits.filter(v => v.repId === rep.id);
          const completionPct = Math.round(((rep.todayVisitsCompleted || 0) / (rep.todayTarget || 1)) * 100);
          const monthlyPct = Math.round(((rep.monthlyAchieved || 0) / (rep.monthlyTarget || 1)) * 100);
          const revenueQuota = rep.monthlyRevenueTarget || 250000;
          const revenueAchieved = rep.monthlyRevenueAchieved || 0;
          const revenuePct = Math.round((revenueAchieved / revenueQuota) * 100);

          // Associated doctors count
          const assignedDocsCount = doctors.filter(
            d => (d.assignedRepIds && d.assignedRepIds.includes(rep.id)) ||
                 (rep.assignedDoctorIds && rep.assignedDoctorIds.includes(d.id))
          ).length;

          // Associated retail counters count
          const assignedCountersCount = retailCounters.filter(
            c => c.assignedRepId === rep.id || c.assignedRepName.toLowerCase() === rep.name.toLowerCase()
          ).length;

          return (
            <div
              key={rep.id}
              id={`rep-card-${rep.id}`}
              data-testid={`rep-card-${rep.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="space-y-4">
                {/* Header Profile */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={rep.avatarUrl}
                      alt={rep.name}
                      referrerPolicy="no-referrer"
                      className="w-13 h-13 rounded-xl object-cover border border-slate-200 shadow-2xs"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 font-heading text-lg leading-snug">
                        {rep.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-mono text-slate-500 font-semibold">
                          {rep.employeeCode}
                        </span>
                        {rep.targetPeriod && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {rep.targetPeriod}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {/* Live Portal Authentication Status */}
                    {(() => {
                      const repUser = users.find(u => u.repId === rep.id || u.name.toLowerCase() === rep.name.toLowerCase());
                      const isOnline = repUser ? repUser.isOnline : false;
                      return (
                        <span
                          id={`rep-auth-status-${rep.id}`}
                          data-testid={`rep-auth-status-${rep.id}`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                            isOnline
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                          title={isOnline ? `${rep.name} is currently logged in` : `${rep.name} is currently logged out`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOnline ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {isOnline ? 'Logged In' : 'Logged Out'}
                        </span>
                      );
                    })()}

                    {/* Field telemetry state */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        rep.status === 'active_in_field'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {rep.status === 'active_in_field' ? 'In Field' : 'Stationary'}
                    </span>
                  </div>
                </div>

                {/* Territory & Contact */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                        Assigned Territory
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                        Admin Only
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-800 font-semibold">{rep.territory}</span>
                      <button
                        type="button"
                        id={`edit-territory-pencil-btn-${rep.id}`}
                        data-testid={`edit-territory-pencil-btn-${rep.id}`}
                        onClick={() => setSelectedRepForTerritory(rep)}
                        title="Admin Exclusive: Assign or Edit Territory"
                        className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-100/70 transition-colors cursor-pointer"
                      >
                        <PencilSimple size={13} weight="bold" />
                      </button>
                    </div>
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

                {/* TARGETS SECTION: Daily visits, Monthly visits & Revenue Quota */}
                <div className="bg-blue-50/40 rounded-xl p-3.5 border border-blue-100/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider">
                      <Target size={15} weight="bold" className="text-blue-600" />
                      <span>Target Quotas & Compliance</span>
                    </div>
                    <button
                      type="button"
                      id={`set-target-badge-btn-${rep.id}`}
                      data-testid={`set-target-badge-btn-${rep.id}`}
                      onClick={() => setSelectedRepForTarget(rep)}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:bg-blue-100/70 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <PencilSimple size={12} weight="bold" />
                      <span>Set Target</span>
                    </button>
                  </div>

                  {/* Daily Target Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">Daily Doctor Visits</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {rep.todayVisitsCompleted || 0} / {rep.todayTarget} ({completionPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, completionPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Monthly Doctor Visits Target */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">Monthly Doctor Visits</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {rep.monthlyAchieved || 0} / {rep.monthlyTarget || 120} ({monthlyPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, monthlyPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Monthly Revenue Target */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">Monthly Revenue Quota</span>
                      <span className="font-bold tabular-nums text-emerald-700 font-mono">
                        ₹{(revenueAchieved / 1000).toFixed(0)}k / ₹{(revenueQuota / 1000).toFixed(0)}k ({revenuePct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, revenuePct)}%` }}
                      />
                    </div>
                  </div>

                  {rep.targetNotes && (
                    <p className="text-[11px] text-slate-500 italic pt-1 border-t border-blue-100/60 line-clamp-2">
                      &ldquo;{rep.targetNotes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Assigned Network Quick Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Meeting With:</span>
                    <span className="font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded-sm border border-slate-200">
                      {assignedDocsCount} Doctors
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Selling To:</span>
                    <span className="font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded-sm border border-slate-200">
                      {assignedCountersCount} Counters
                    </span>
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

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                {/* PRIMARY REQUESTED BUTTON: View Doctors, Retail Counters & Showcased Products */}
                <button
                  id={`view-rep-activity-btn-${rep.id}`}
                  data-testid={`view-rep-activity-btn-${rep.id}`}
                  onClick={() => setSelectedRepForNetwork(rep)}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Storefront size={16} weight="bold" className="shrink-0" />
                  <span>View Doctors, Retail Counters & Showcased Products</span>
                  <CaretRight size={13} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Administrative Controls Grid: Edit Territory & Set Target */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id={`assign-territory-btn-${rep.id}`}
                    data-testid={`assign-territory-btn-${rep.id}`}
                    onClick={() => setSelectedRepForTerritory(rep)}
                    className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Admin Privilege: Assign or Reallocate Territory"
                  >
                    <MapPin size={14} className="text-emerald-700" weight="bold" />
                    <span>Edit Territory</span>
                  </button>

                  <button
                    id={`set-target-btn-${rep.id}`}
                    data-testid={`set-target-btn-${rep.id}`}
                    onClick={() => setSelectedRepForTarget(rep)}
                    className="py-2 px-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Target size={14} className="text-blue-600" weight="bold" />
                    <span>Set Target</span>
                  </button>
                </div>

                <button
                  data-testid={`simulate-rep-${rep.id}`}
                  onClick={() => handleSimulateRepView(rep)}
                  className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <NavigationArrow size={12} />
                  <span>Switch to {rep.name.split(' ')[0]}'s Field View</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Assign / Edit Territory Modal (Admin-Only Privilege) */}
      {selectedRepForTerritory && (
        <RepTerritoryModal
          rep={selectedRepForTerritory}
          isOpen={!!selectedRepForTerritory}
          onClose={() => setSelectedRepForTerritory(null)}
        />
      )}

      {/* MODAL: Set Target Modal */}
      {selectedRepForTarget && (
        <RepTargetModal
          rep={selectedRepForTarget}
          isOpen={!!selectedRepForTarget}
          onClose={() => setSelectedRepForTarget(null)}
        />
      )}

      {/* MODAL: View Doctors, Retail Counters & Showcased Products */}
      {selectedRepForNetwork && (
        <RepActivityNetworkModal
          rep={selectedRepForNetwork}
          isOpen={!!selectedRepForNetwork}
          onClose={() => setSelectedRepForNetwork(null)}
        />
      )}
    </div>
  );
};

