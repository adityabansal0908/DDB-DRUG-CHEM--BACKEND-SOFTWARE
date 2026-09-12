import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckCircle,
  Warning,
  MapPin,
  Clock,
  Pill,
  Users,
  ShoppingCart,
  TrendUp,
  ArrowsClockwise,
  MagnifyingGlass,
  Funnel,
  ShieldCheck,
  Eye,
  FileText
} from '@phosphor-icons/react';

export const FieldMonitoring: React.FC = () => {
  const {
    visits,
    approveVisit,
    flagVisit,
    setPreviewPhotoUrl,
    reps,
    products,
    orders
  } = useApp();

  const [feedFilter, setFeedFilter] = useState<'all' | 'pending' | 'approved' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculations for metrics
  const totalVisitsCount = visits.length;
  const approvedVisitsCount = visits.filter(v => v.approvalStatus === 'approved').length;
  const pendingVisitsCount = visits.filter(v => v.approvalStatus === 'pending').length;
  
  const totalOrderValue = visits.reduce((sum, v) => sum + (v.orderValueBooked || 0), 0);
  const totalSamplesGiven = visits.reduce((sum, v) => sum + (v.sampleUnitsGiven || 0), 0);

  const filteredVisits = visits.filter(v => {
    if (feedFilter !== 'all' && v.approvalStatus !== feedFilter) return false;
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      v.doctorName.toLowerCase().includes(query) ||
      v.clinicName.toLowerCase().includes(query) ||
      v.repName.toLowerCase().includes(query) ||
      v.purpose.toLowerCase().includes(query)
    );
  });

  return (
    <div
      id="field-monitoring-dashboard"
      data-testid="field-monitoring-dashboard"
      className="p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8"
    >
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-blue-600 block mb-1">
            Real-time Telemetry
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 font-heading">
            Field Monitoring & Surveillance
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Live stream of medical representative clinic visits, verified GPS check-ins, and detailing logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-semibold text-slate-800">Auto-refresh Active</span>
            <span className="text-slate-300">|</span>
            <span className="tabular-nums">Sync 5s</span>
          </div>
        </div>
      </div>

      {/* 12-Column Bento Grid Specification */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* SUMMARY METRICS - Spans col-span-12 md:col-span-8 */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Card 1: Total Visits */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500">
                  Today's Visits
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Clock size={18} weight="duotone" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 tabular-nums font-heading">
                  {totalVisitsCount}
                </span>
                <span className="text-xs font-medium text-emerald-600">
                  +18% vs yesterday
                </span>
              </div>
              <div className="space-y-1 pt-1">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (totalVisitsCount / 15) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Target: 15 visits</span>
                  <span className="tabular-nums font-semibold">{Math.round((totalVisitsCount / 15) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Card 2: Active Reps in Field */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500">
                  Active Reps
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Users size={18} weight="duotone" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 tabular-nums font-heading">
                  {reps.filter(r => r.status === 'active_in_field').length}
                  <span className="text-lg text-slate-400 font-normal"> / {reps.length}</span>
                </span>
                <span className="text-xs font-medium text-emerald-600">
                  100% In Zone
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>All units transmitting GPS coordinates</span>
              </div>
            </div>

            {/* Card 3: Orders Booked */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500">
                  Orders Booked
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <ShoppingCart size={18} weight="duotone" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 tabular-nums font-heading">
                  ₹{(totalOrderValue).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                <span>{orders.length} hospital & clinic pharmacy orders</span>
              </div>
            </div>

            {/* Card 4: Sample Distribution */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500">
                  Samples Dropped
                </span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Pill size={18} weight="duotone" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 tabular-nums font-heading">
                  {totalSamplesGiven}
                  <span className="text-sm text-slate-400 font-normal"> units</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                <span>Trial starter kits distributed to doctors</span>
              </div>
            </div>

          </div>

          {/* Territory & Doctor Coverage Heatmap / Schedule Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 font-heading">
                  Territory Coverage & Field Progress
                </h3>
                <p className="text-xs text-slate-500">
                  Doctor visit targets, route status, and compliance by medical territory
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  Northern Medical Hub
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reps.map(rep => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rep.avatarUrl}
                        alt={rep.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-slate-300"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{rep.name}</h4>
                        <span className="text-[11px] text-slate-500">{rep.territory}</span>
                      </div>
                    </div>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        rep.status === 'active_in_field' ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-amber-400'
                      }`}
                      title={rep.status === 'active_in_field' ? 'Active in field' : 'Stationary'}
                    />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Daily Visits</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {rep.todayVisitsCompleted} / {rep.todayTarget}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, (rep.todayVisitsCompleted / rep.todayTarget) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-blue-600" />
                      {rep.currentLocationName.split('/')[0]}
                    </span>
                    <span className="tabular-nums font-medium">{rep.lastCheckinTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Products Focus Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 rounded-xl border border-blue-950 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-blue-300">
                Quarterly Focus Campaign
              </span>
              <h3 className="text-xl font-bold font-heading text-white">
                TelmiKard 40-H & AmoxiClav 625 Detailing Blitz
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Current incentive scheme active for Cardiology & Pulmonology clinics. Minimum 3 doctor detailings per rep required today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 bg-white/10 rounded-lg backdrop-blur-xs text-center border border-white/10">
                <span className="text-xs text-slate-300 block">Catalog Margin</span>
                <span className="text-base font-bold text-emerald-400 tabular-nums">28.4%</span>
              </div>
              <div className="px-3 py-2 bg-white/10 rounded-lg backdrop-blur-xs text-center border border-white/10">
                <span className="text-xs text-slate-300 block">In Stock</span>
                <span className="text-base font-bold text-white tabular-nums">1,450 units</span>
              </div>
            </div>
          </div>

        </div>

        {/* FEED / LIST - Spans col-span-12 md:col-span-4 row-span-2 as specified */}
        <div
          id="field-monitoring-feed-panel"
          data-testid="field-monitoring-feed-panel"
          className="col-span-12 lg:col-span-4 space-y-4"
        >
          {/* Feed Header */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Live Field Visits Feed
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 tabular-nums">
                {filteredVisits.length} Events
              </span>
            </div>

            {/* Feed Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                data-testid="feed-filter-all"
                onClick={() => setFeedFilter('all')}
                className={`flex-1 py-1 rounded transition-colors ${
                  feedFilter === 'all' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                data-testid="feed-filter-pending"
                onClick={() => setFeedFilter('pending')}
                className={`flex-1 py-1 rounded transition-colors ${
                  feedFilter === 'pending' ? 'bg-white text-blue-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingVisitsCount})
              </button>
              <button
                data-testid="feed-filter-approved"
                onClick={() => setFeedFilter('approved')}
                className={`flex-1 py-1 rounded transition-colors ${
                  feedFilter === 'approved' ? 'bg-white text-emerald-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Approved ({approvedVisitsCount})
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                data-testid="feed-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctor, clinic or rep..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Visits Cards Stream */}
          <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
            {filteredVisits.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-2">
                <FileText size={32} className="mx-auto text-slate-300" weight="duotone" />
                <p className="text-sm font-medium">No visits found matching filters</p>
                <p className="text-xs text-slate-400">Try changing the search or status filter</p>
              </div>
            ) : (
              filteredVisits.map((visit) => (
                <div
                  key={visit.id}
                  id={`visit-card-${visit.id}`}
                  data-testid={`visit-card-${visit.id}`}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
                >
                  {/* Doctor & Clinic Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {visit.doctorName}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={13} className="text-blue-600 shrink-0" weight="fill" />
                        <span className="truncate max-w-[200px]">{visit.clinicName}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        visit.approvalStatus === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : visit.approvalStatus === 'flagged'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {visit.approvalStatus === 'approved' ? 'Approved' : visit.approvalStatus === 'flagged' ? 'Flagged' : 'Pending Review'}
                    </span>
                  </div>

                  {/* Evidence Photo Thumbnail + Details */}
                  <div className="flex gap-3 items-center">
                    <div
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0 group cursor-pointer bg-slate-100"
                      onClick={() => setPreviewPhotoUrl(visit.photoUrl)}
                      title="Click to expand photo"
                    >
                      <img
                        src={visit.photoUrl}
                        alt="Visit verification"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye size={18} className="text-white" weight="bold" />
                      </div>
                      <span className="absolute bottom-1 right-1 bg-slate-900/70 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                        GPS ✓
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <img
                          src={visit.repAvatar}
                          alt={visit.repName}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="truncate">{visit.repName}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-[11px] text-slate-500 tabular-nums">{visit.timestamp}</span>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Purpose:</span> {visit.purpose}
                      </div>

                      {/* Products Discussed Pills */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {visit.productsDiscussed.map((prod, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-100 truncate max-w-[140px]"
                          >
                            {prod}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rep Notes */}
                  {visit.notes && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic line-clamp-2">
                      "{visit.notes}"
                    </div>
                  )}

                  {/* GPS & Samples telemetry bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle size={13} weight="fill" />
                      GPS Verified ({visit.distanceMeters}m radius)
                    </span>
                    {visit.sampleUnitsGiven > 0 && (
                      <span className="text-indigo-600 font-medium tabular-nums">
                        {visit.sampleUnitsGiven} samples delivered
                      </span>
                    )}
                  </div>

                  {/* Actions for Pending Visits */}
                  {visit.approvalStatus === 'pending' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        id={`approve-visit-btn-${visit.id}`}
                        data-testid={`approve-visit-btn-${visit.id}`}
                        onClick={() => approveVisit(visit.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        <CheckCircle size={15} weight="bold" />
                        <span>Approve Visit</span>
                      </button>
                      <button
                        id={`flag-visit-btn-${visit.id}`}
                        data-testid={`flag-visit-btn-${visit.id}`}
                        onClick={() => flagVisit(visit.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-medium transition-colors"
                        title="Flag for audit"
                      >
                        <Warning size={15} />
                        <span className="hidden sm:inline">Flag</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
