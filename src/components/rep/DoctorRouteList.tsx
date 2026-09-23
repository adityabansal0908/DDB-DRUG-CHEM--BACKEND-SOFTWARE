import React from 'react';
import { useApp } from '../../context/AppContext';
import { Doctor } from '../../types';
import {
  MapPin,
  Clock,
  Calendar,
  Phone,
  NavigationArrow,
  CheckCircle,
  PlayCircle,
  CalendarCheck,
  Building,
  CaretRight,
  Pill,
  Cake,
  Lock
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export const DoctorRouteList: React.FC = () => {
  const {
    doctors,
    setSelectedDoctorForCheckin,
    setActiveRepTab,
    currentRep
  } = useApp();

  const handleStartVisit = (doctor: Doctor) => {
    setSelectedDoctorForCheckin(doctor);
    setActiveRepTab('checkin');
    toast.info(`Starting detailing visit with ${doctor.name}`);
  };

  const handleCallClinic = (phone: string, name: string) => {
    toast.info(`Calling ${name} at ${phone}`);
  };

  const handleOpenDirections = (clinicName: string) => {
    toast.info(`Navigation GPS routing to ${clinicName}`);
  };

  const completedCount = doctors.filter(d => d.status === 'completed').length;
  const totalCount = doctors.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <div
      id="rep-doctor-route-page"
      data-testid="rep-doctor-route-page"
      className="space-y-4 pb-24 max-w-xl mx-auto"
    >
      {/* Route Progress Header Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-blue-600 block">
              Today's Field Route
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                {currentRep.territory}
              </h2>
              <span
                id="rep-territory-assigned-badge"
                data-testid="rep-territory-assigned-badge"
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200"
                title="Only Admin can modify assigned territory and routes"
              >
                <Lock size={10} className="text-slate-400" />
                <span>Admin Assigned Route</span>
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 tabular-nums">
            {completedCount} of {totalCount} Visited
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Route completion target</span>
            <span className="tabular-nums font-bold text-slate-700">{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* Doctor Cards List - Edge-to-edge list items or full-width flat cards with 1px borders */}
      <div className="space-y-3">
        {doctors.map((doctor, index) => {
          const isCompleted = doctor.status === 'completed';
          const isInProgress = doctor.status === 'in_progress';

          return (
            <div
              key={doctor.id}
              id={`doctor-card-${doctor.id}`}
              data-testid={`doctor-card-${doctor.id}`}
              className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 transition-all ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isInProgress
                  ? 'border-blue-400 ring-1 ring-blue-400'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Doctor Top Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={doctor.avatarUrl}
                      alt={doctor.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                      {index + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-base font-heading truncate">
                      {doctor.name}
                    </h3>
                    <p className="text-xs font-semibold text-blue-700 truncate">
                      {doctor.specialty}
                    </p>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <Building size={12} className="shrink-0 text-slate-400" />
                      {doctor.clinicName}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isInProgress
                      ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {isCompleted ? 'Completed' : isInProgress ? 'Chamber Open' : 'Scheduled'}
                </span>
              </div>

              {/* Visiting Schedule (Days & Slots), City & Area */}
              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Visiting Days */}
                  <div className="flex items-center gap-1.5 font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded">
                    <Calendar size={13} className="text-indigo-600 shrink-0" />
                    <span>
                      {doctor.visitingDays && doctor.visitingDays.length > 0
                        ? doctor.visitingDays.length === 7
                          ? 'All Days (Mon-Sun)'
                          : doctor.visitingDays.length === 6 && !doctor.visitingDays.includes('Sun')
                          ? 'Mon - Sat'
                          : doctor.visitingDays.length === 5 && !doctor.visitingDays.includes('Sat') && !doctor.visitingDays.includes('Sun')
                          ? 'Mon - Fri'
                          : doctor.visitingDays.join(', ')
                        : 'Mon - Sat'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-500">
                    <MapPin size={13} className="text-slate-400" />
                    <span>
                      {doctor.city ? `${doctor.city} • ` : ''}
                      {doctor.area}
                    </span>
                  </div>
                </div>

                {/* Multiple Visiting Slots */}
                <div className="flex flex-wrap gap-1.5 items-center pt-0.5">
                  {doctor.visitingSlots && doctor.visitingSlots.length > 0 ? (
                    doctor.visitingSlots.map((slot, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200/80 font-mono text-[11px]"
                      >
                        <Clock size={11} className="text-blue-600" />
                        <strong className="text-slate-900 font-semibold">{slot.slotName || `Slot ${sIdx + 1}`}:</strong>
                        <span>{slot.startTime}{slot.endTime ? ` - ${slot.endTime}` : ''}</span>
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200/80 font-mono text-[11px]">
                      <Clock size={11} className="text-blue-600" />
                      <span>{doctor.bestTimeToVisit}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Targeted Products Marketed to this Doctor */}
              {doctor.targetedProducts && doctor.targetedProducts.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Targeted Formulations:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {doctor.targetedProducts.map((p, pIdx) => (
                      <span
                        key={pIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium"
                      >
                        <Pill size={11} className="text-blue-500" />
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons (Large tap targets) */}
              <div className="flex items-center gap-2 pt-1">
                {isCompleted ? (
                  <div className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200">
                    <CheckCircle size={16} weight="fill" />
                    <span>Check-in Verified & Submitted</span>
                  </div>
                ) : (
                  <button
                    data-testid={`start-visit-btn-${doctor.id}`}
                    onClick={() => handleStartVisit(doctor)}
                    className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 active:scale-[0.99]"
                  >
                    <PlayCircle size={17} weight="bold" />
                    <span>Start Check-in</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleCallClinic(doctor.phone, doctor.name)}
                  className="min-h-[44px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors flex items-center gap-1"
                  title="Call Clinic Reception"
                >
                  <Phone size={16} weight="duotone" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenDirections(doctor.clinicName)}
                  className="min-h-[44px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors flex items-center gap-1"
                  title="Directions"
                >
                  <NavigationArrow size={16} weight="duotone" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
