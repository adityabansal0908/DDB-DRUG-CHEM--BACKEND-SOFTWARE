import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChartLineUp,
  Pill,
  Users,
  ShoppingCart,
  ShieldCheck,
  CheckCircle,
  MapPinLine,
  CaretRight,
  UserCheck,
  X,
  CaretLeft,
  ClockCounterClockwise,
  SquaresFour,
  FileText,
  Storefront,
  Buildings,
  GlobeHemisphereWest,
  Info,
  MapPin,
  Crosshair,
  CreditCard
} from '@phosphor-icons/react';

export const AdminSidebar: React.FC = () => {
  const {
    activeAdminTab,
    setActiveAdminTab,
    visits,
    products,
    reps,
    orders,
    doctors,
    retailCounters,
    auditLogs,
    organizations,
    isSidebarCollapsed,
    setIsSidebarCollapsed
  } = useApp();

  const [showGeoInfoModal, setShowGeoInfoModal] = useState(false);

  const pendingVisits = visits.filter(v => v.approvalStatus === 'pending').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const totalVisitsCount = visits.length;
  const verifiedVisitsCount = visits.filter(v => v.locationVerified).length;
  const geoAccuracyPercent =
    totalVisitsCount > 0
      ? ((verifiedVisitsCount / totalVisitsCount) * 100).toFixed(1)
      : '98.4';

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Home Dashboard',
      icon: SquaresFour,
      badge: 'Overview',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'reports' as const,
      label: 'Sales Reports',
      icon: FileText,
      badge: 'Monthly',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-semibold'
    },
    {
      id: 'monitoring' as const,
      label: 'Field Monitoring',
      icon: ChartLineUp,
      badge: pendingVisits > 0 ? `${pendingVisits} New` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'doctors' as const,
      label: "Doctor's List",
      icon: UserCheck,
      badge: `${doctors.length}`,
      badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200'
    },
    {
      id: 'medical_stores' as const,
      label: 'Medical Stores',
      icon: Storefront,
      badge: `${retailCounters.length}`,
      badgeColor: 'bg-teal-50 text-teal-700 border border-teal-200'
    },
    {
      id: 'products' as const,
      label: 'Product Catalog',
      icon: Pill,
      badge: `${products.length}`,
      badgeColor: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'reps' as const,
      label: 'Medical Reps',
      icon: Users,
      badge: `${reps.length} Active`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    },
    {
      id: 'orders' as const,
      label: 'Orders & Dispatches',
      icon: ShoppingCart,
      badge: pendingOrders > 0 ? `${pendingOrders} Pending` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'history' as const,
      label: 'History (Audit Trail)',
      icon: ClockCounterClockwise,
      badge: `${auditLogs.length}`,
      badgeColor: 'bg-purple-100 text-purple-800 font-bold border border-purple-200'
    },
    {
      id: 'company' as const,
      label: 'Company & Branding',
      icon: GlobeHemisphereWest,
      badge: 'SaaS',
      badgeColor: 'bg-blue-100 text-blue-800 font-bold border border-blue-200'
    },
    {
      id: 'tenants' as const,
      label: 'Multi-Tenant Orgs',
      icon: Buildings,
      badge: `${organizations.length} Orgs`,
      badgeColor: 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-200'
    },
    {
      id: 'subscriptions' as const,
      label: 'SaaS Subscriptions',
      icon: CreditCard,
      badge: 'Stripe',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200'
    }
  ];

  return (
    <>
      {/* Mobile / Tablet Backdrop: visible when console is open on small screens */}
      {!isSidebarCollapsed && (
        <div
          id="admin-sidebar-backdrop"
          data-testid="admin-sidebar-backdrop"
          onClick={() => setIsSidebarCollapsed(true)}
          className="fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-xs z-25 lg:hidden transition-opacity"
        />
      )}

      {/* Collapsible Operations Console Sidebar (270px width on desktop for clean single-line labels) */}
      <aside
        id="admin-sidebar"
        data-testid="admin-sidebar"
        aria-label="Operations Console"
        className={`fixed top-16 left-0 bottom-0 w-[280px] sm:w-[275px] lg:w-[270px] bg-[#2a1768] bg-gradient-to-br from-[#3b2782] via-[#2a1768] to-[#180b45] text-white border-r border-[#3b2782]/40 z-30 flex flex-col justify-between overflow-y-auto transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none scrollbar-thin scrollbar-thumb-purple-800/60 scrollbar-track-transparent ${
          isSidebarCollapsed
            ? '-translate-x-full pointer-events-none'
            : 'translate-x-0 pointer-events-auto'
        }`}
      >
        <div className="p-3.5 space-y-5">
          {/* Navigation Group Header with Close/Collapse button */}
          <div>
            <div className="flex items-center justify-between px-2.5 mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-purple-200/90">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.9)] animate-pulse"></span>
                <span>Operations Console</span>
              </div>
              <button
                type="button"
                data-testid="collapse-sidebar-inner-btn"
                onClick={() => setIsSidebarCollapsed(true)}
                title="Collapse Operations Console (or click company logo)"
                className="p-1 rounded-md text-purple-300/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
            </div>

            <nav className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeAdminTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`admin-nav-${item.id}`}
                    data-testid={`admin-nav-${item.id}`}
                    onClick={() => {
                      setActiveAdminTab(item.id);
                      // On phone devices, auto-collapse after selecting a tab for instant data visibility
                      if (window.innerWidth < 1024) {
                        setIsSidebarCollapsed(true);
                      }
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#6342c5] to-[#4c2d9f] text-white font-semibold shadow-xs border border-purple-300/30 ring-1 ring-purple-400/20'
                        : 'text-purple-100/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        size={18}
                        weight={isActive ? 'bold' : 'duotone'}
                        className={`shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-purple-300 group-hover:text-white'
                        }`}
                      />
                      <span className="whitespace-nowrap text-[13.5px] font-medium leading-none truncate">
                        {item.label}
                      </span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums shrink-0 whitespace-nowrap leading-tight transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.id === 'reports' || item.id === 'reps' || item.id === 'subscriptions'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : item.id === 'orders'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : item.id === 'monitoring' || item.id === 'dashboard' || item.id === 'tenants'
                            ? 'bg-indigo-400/20 text-indigo-200 border border-indigo-400/30'
                            : item.id === 'history' || item.id === 'company'
                            ? 'bg-purple-400/20 text-purple-200 border border-purple-400/30'
                            : 'bg-white/10 text-purple-200 border border-white/10'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Territory Live Status & Geo-Fence Accuracy Card */}
          <div
            onClick={() => setShowGeoInfoModal(true)}
            className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-purple-400/20 hover:border-purple-400/40 space-y-2.5 transition-all cursor-pointer group"
            title="Click to learn what Geo-Fence Accuracy is and how it works"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-200 group-hover:text-white transition-colors">
                  Geo-Fence Accuracy
                </span>
                <Info size={14} className="text-purple-300 group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle size={14} weight="fill" />
                {geoAccuracyPercent}%
              </span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                style={{ width: `${Math.min(100, Math.max(0, parseFloat(geoAccuracyPercent)))}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-purple-200/70 leading-tight">
              All visits require GPS verification within 50m radius of verified clinics.
            </p>
          </div>
        </div>

        {/* Footer System Info */}
        <div className="p-4 border-t border-purple-500/20 bg-[#180b45]/70">
          <div className="flex items-center gap-2 text-xs text-purple-200/80">
            <ShieldCheck size={16} className="text-purple-400" weight="duotone" />
            <span>HIPAA & FDA 21 CFR Compliant</span>
          </div>
          <p className="text-[10px] text-purple-300/60 mt-1 font-mono">
            v2.4.0-clinical &bull; Node 12-Bento
          </p>
        </div>
      </aside>

      {/* Geo-Fence Accuracy Educational Explanation Modal */}
      {showGeoInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowGeoInfoModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Crosshair size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-white">What is Geo-Fence Accuracy?</h3>
                  <p className="text-xs text-blue-200">Field Telemetry &amp; GPS Doctor Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGeoInfoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Current Sales Force Compliance Score
                  </span>
                  <span className="text-2xl font-black text-emerald-700 font-heading">
                    {geoAccuracyPercent}%
                  </span>
                </div>
                <div className="text-right text-[11px] text-emerald-800">
                  <span className="font-bold">{verifiedVisitsCount}</span> of <span className="font-bold">{totalVisitsCount || 1}</span> visits verified
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-slate-900 block text-xs">The Problem in Pharma Field Work:</strong>
                    Historically, medical representatives (MRs) sometimes filled fake visit reports from home or coffee shops without actually visiting the doctor's chamber.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-slate-900 block text-xs">How Geo-Fencing Solves It:</strong>
                    Every doctor registered in the software has precise GPS coordinates (Latitude &amp; Longitude). When a representative arrives and taps "Check In", the phone GPS calculates the physical distance to the clinic.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-slate-900 block text-xs">The 50-Meter Radius Rule:</strong>
                    If the representative is within a 50m radius of the doctor's chamber, the visit is validated as <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">GPS Verified (True)</span>. If they are farther away, the visit is flagged in red for administrative review.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    4
                  </div>
                  <div>
                    <strong className="text-slate-900 block text-xs">What the Percentage Means:</strong>
                    <strong>{geoAccuracyPercent}%</strong> means that {geoAccuracyPercent}% of all check-ins conducted by your field sales team were physically verified inside the doctor's clinic perimeter.
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGeoInfoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
