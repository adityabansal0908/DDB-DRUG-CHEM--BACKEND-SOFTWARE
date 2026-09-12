import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  CheckCircle,
  Warning,
  MapPin,
  Pill,
  ShoppingCart,
  Eye,
  CalendarCheck
} from '@phosphor-icons/react';

export const RepActivity: React.FC = () => {
  const { visits, currentRep, setPreviewPhotoUrl } = useApp();

  // Visits logged by this rep
  const repVisits = visits.filter(v => v.repId === currentRep.id);
  const totalSamples = repVisits.reduce((s, v) => s + (v.sampleUnitsGiven || 0), 0);
  const totalOrders = repVisits.reduce((s, v) => s + (v.orderValueBooked || 0), 0);

  return (
    <div
      id="rep-activity-page"
      data-testid="rep-activity-page"
      className="space-y-4 pb-24 max-w-xl mx-auto"
    >
      {/* Activity Summary Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-blue-600 block">
          Daily Log & Compliance
        </span>
        <h2 className="text-xl font-bold text-slate-900 font-heading">
          {currentRep.name}'s Field Activity
        </h2>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
          <div className="p-2 bg-slate-50 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Visits Logged</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums font-heading">
              {repVisits.length}
            </span>
          </div>

          <div className="p-2 bg-slate-50 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Samples Given</span>
            <span className="text-lg font-bold text-indigo-700 tabular-nums font-heading">
              {totalSamples}
            </span>
          </div>

          <div className="p-2 bg-slate-50 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Orders Booked</span>
            <span className="text-lg font-bold text-emerald-700 tabular-nums font-heading">
              ₹{(totalOrders).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Visits Stream */}
      <div className="space-y-3">
        {repVisits.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
            <Clock size={32} className="mx-auto text-slate-300 mb-2" weight="duotone" />
            <p className="text-sm font-semibold">No visits logged yet today</p>
            <p className="text-xs text-slate-400 mt-1">Tap 'Check-in' on your route to log your first clinic visit</p>
          </div>
        ) : (
          repVisits.map((v) => (
            <div
              key={v.id}
              id={`activity-visit-${v.id}`}
              data-testid={`activity-visit-${v.id}`}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-heading">
                    {v.doctorName}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={13} className="text-blue-600 shrink-0" weight="fill" />
                    <span>{v.clinicName}</span>
                  </p>
                </div>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    v.approvalStatus === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : v.approvalStatus === 'flagged'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {v.approvalStatus === 'approved'
                    ? 'Approved by Admin'
                    : v.approvalStatus === 'flagged'
                    ? 'Flagged'
                    : 'Pending Admin Review'}
                </span>
              </div>

              {/* Photo proof and telemetry */}
              <div className="flex gap-3 items-center">
                <div
                  className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer group"
                  onClick={() => setPreviewPhotoUrl(v.photoUrl)}
                >
                  <img
                    src={v.photoUrl}
                    alt="Visit proof"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye size={16} className="text-white" />
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock size={12} />
                    <span className="tabular-nums">{v.timestamp}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="font-semibold text-slate-700">{v.purpose}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {v.productsDiscussed.map((prod, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-100 truncate"
                      >
                        {prod}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
                    <CheckCircle size={12} weight="fill" />
                    <span>GPS Auto-verified ({v.distanceMeters}m from geofence)</span>
                  </div>
                </div>
              </div>

              {v.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                  "{v.notes}"
                </p>
              )}

              {v.orderValueBooked && v.orderValueBooked > 0 && (
                <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100 text-xs flex items-center justify-between">
                  <span className="font-semibold text-blue-800 flex items-center gap-1">
                    <ShoppingCart size={14} />
                    Order Booked
                  </span>
                  <span className="font-bold text-blue-900 tabular-nums">
                    ₹{v.orderValueBooked.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
