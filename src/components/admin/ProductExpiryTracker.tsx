import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import {
  CalendarBlank,
  Warning,
  XCircle,
  ClockCountdown,
  HourglassMedium,
  CheckCircle,
  CurrencyInr,
  Stack,
  CaretDown,
  CaretUp,
  Tag,
  FadersHorizontal,
  PencilSimple,
  ArrowRight
} from '@phosphor-icons/react';
import {
  aggregateCatalogExpiryMetrics,
  evaluateProductExpiry,
  BatchExpiryInfo,
  ExpiryUrgency
} from '../../utils/expiryHelper';

interface ProductExpiryTrackerProps {
  products: Product[];
  onOpenBatchModal: (product: Product) => void;
  activeFilterUrgency: ExpiryUrgency | 'all_near_term' | null;
  onFilterChange: (filter: ExpiryUrgency | 'all_near_term' | null) => void;
}

export const ProductExpiryTracker: React.FC<ProductExpiryTrackerProps> = ({
  products,
  onOpenBatchModal,
  activeFilterUrgency,
  onFilterChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trackerTab, setTrackerTab] = useState<'batches' | 'summary'>('batches');

  const metrics = useMemo(() => aggregateCatalogExpiryMetrics(products), [products]);

  // Flatten all batches across all products with their expiry details
  const allBatchesWithExpiry = useMemo(() => {
    const list: BatchExpiryInfo[] = [];
    products.forEach((p) => {
      const summary = evaluateProductExpiry(p);
      summary.batches.forEach((b) => {
        list.push(b);
      });
    });

    // Sort: most urgent first (expired first, then nearest expiration)
    list.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return list;
  }, [products]);

  // Filter batches based on selected filter
  const filteredBatches = useMemo(() => {
    if (!activeFilterUrgency) return allBatchesWithExpiry;

    if (activeFilterUrgency === 'all_near_term') {
      return allBatchesWithExpiry.filter(
        (b) => b.urgency === 'expired' || b.urgency === 'critical' || b.urgency === 'near_term'
      );
    }

    return allBatchesWithExpiry.filter((b) => b.urgency === activeFilterUrgency);
  }, [allBatchesWithExpiry, activeFilterUrgency]);

  const hasAnyNearTermOrExpired = metrics.totalNearTermOrExpiredBatches > 0;

  return (
    <div
      id="product-expiry-tracker-panel"
      data-testid="product-expiry-tracker-panel"
      className={`bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white border-2 border-amber-300/90 rounded-2xl shadow-xs transition-all ${
        isExpanded ? 'p-4 sm:p-5 space-y-4' : 'p-3.5 sm:p-4'
      }`}
    >
      {/* Tracker Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isExpanded ? 'border-b border-amber-200/80 pb-3.5' : ''
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <HourglassMedium size={22} weight="fill" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-amber-950 font-heading">
                Product Expiry Tracker
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-md">
                Admin Batch Auditing
              </span>
              {metrics.expiredBatchesCount > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-md animate-pulse">
                  {metrics.expiredBatchesCount} Expired
                </span>
              )}
              {metrics.criticalBatchesCount > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded-md">
                  {metrics.criticalBatchesCount} Critical (&le;30 Days)
                </span>
              )}
            </div>
            <p className="text-xs text-amber-900/80 mt-0.5">
              Automated surveillance of batch lifecycles, shelf-life depletion, and liquidation buffers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/90 hover:bg-white text-amber-950 border border-amber-300 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse Tracker' : 'Expand Tracker'}</span>
            {isExpanded ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Top KPI Cards for Expiry Status */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Card 1: Expired Batches */}
            <button
              type="button"
              onClick={() => onFilterChange(activeFilterUrgency === 'expired' ? null : 'expired')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                activeFilterUrgency === 'expired'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400'
                  : 'bg-white hover:bg-rose-50 text-slate-800 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${activeFilterUrgency === 'expired' ? 'text-rose-100' : 'text-rose-700'}`}>
                  Expired
                </span>
                <XCircle size={16} weight="fill" className={activeFilterUrgency === 'expired' ? 'text-white' : 'text-rose-600'} />
              </div>
              <div className="text-xl sm:text-2xl font-black mt-1 tabular-nums font-heading">
                {metrics.expiredBatchesCount}
              </div>
              <p className={`text-[10px] mt-0.5 ${activeFilterUrgency === 'expired' ? 'text-rose-100' : 'text-slate-500'}`}>
                Past expiration date
              </p>
            </button>

            {/* Card 2: Critical <= 30 Days */}
            <button
              type="button"
              onClick={() => onFilterChange(activeFilterUrgency === 'critical' ? null : 'critical')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                activeFilterUrgency === 'critical'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-400'
                  : 'bg-white hover:bg-amber-50 text-slate-800 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${activeFilterUrgency === 'critical' ? 'text-amber-100' : 'text-amber-800'}`}>
                  Critical (&le;30d)
                </span>
                <ClockCountdown size={16} weight="fill" className={activeFilterUrgency === 'critical' ? 'text-white' : 'text-amber-600'} />
              </div>
              <div className="text-xl sm:text-2xl font-black mt-1 tabular-nums font-heading">
                {metrics.criticalBatchesCount}
              </div>
              <p className={`text-[10px] mt-0.5 ${activeFilterUrgency === 'critical' ? 'text-amber-100' : 'text-slate-500'}`}>
                Depleting in 1 month
              </p>
            </button>

            {/* Card 3: Near-Term 31-90 Days */}
            <button
              type="button"
              onClick={() => onFilterChange(activeFilterUrgency === 'near_term' ? null : 'near_term')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                activeFilterUrgency === 'near_term'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                  : 'bg-white hover:bg-amber-50 text-slate-800 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${activeFilterUrgency === 'near_term' ? 'text-amber-100' : 'text-amber-700'}`}>
                  Near-Term (1-3m)
                </span>
                <Warning size={16} weight="fill" className={activeFilterUrgency === 'near_term' ? 'text-white' : 'text-amber-500'} />
              </div>
              <div className="text-xl sm:text-2xl font-black mt-1 tabular-nums font-heading">
                {metrics.nearTermBatchesCount}
              </div>
              <p className={`text-[10px] mt-0.5 ${activeFilterUrgency === 'near_term' ? 'text-amber-100' : 'text-slate-500'}`}>
                Expiring in 31-90 days
              </p>
            </button>

            {/* Card 4: Approaching 91-180 Days */}
            <button
              type="button"
              onClick={() => onFilterChange(activeFilterUrgency === 'approaching' ? null : 'approaching')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                activeFilterUrgency === 'approaching'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-300'
                  : 'bg-white hover:bg-blue-50 text-slate-800 border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${activeFilterUrgency === 'approaching' ? 'text-blue-100' : 'text-blue-700'}`}>
                  3-6 Months
                </span>
                <CalendarBlank size={16} weight="bold" className={activeFilterUrgency === 'approaching' ? 'text-white' : 'text-blue-600'} />
              </div>
              <div className="text-xl sm:text-2xl font-black mt-1 tabular-nums font-heading">
                {metrics.approachingBatchesCount}
              </div>
              <p className={`text-[10px] mt-0.5 ${activeFilterUrgency === 'approaching' ? 'text-blue-100' : 'text-slate-500'}`}>
                Approaching window
              </p>
            </button>

            {/* Card 5: Total At-Risk Inventory Value */}
            <div className="p-3 rounded-xl border border-amber-300 bg-amber-100/60 text-amber-950 col-span-2 sm:col-span-2 md:col-span-1 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                  At-Risk Value
                </span>
                <div className="text-xl sm:text-2xl font-black mt-1 tabular-nums font-heading text-amber-950">
                  ₹{metrics.totalAtRiskValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <p className="text-[10px] text-amber-800 font-semibold mt-1">
                {metrics.totalAtRiskUnits.toLocaleString()} units (&le;90d)
              </p>
            </div>
          </div>

          {/* Quick Filter Pill Controls */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="font-bold text-amber-950 text-xs mr-1">Filter Batches:</span>

              <button
                type="button"
                id="filter-expiry-all-btn"
                onClick={() => onFilterChange(null)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeFilterUrgency === null
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Batches ({allBatchesWithExpiry.length})
              </button>

              <button
                type="button"
                id="filter-expiry-all-near-term-btn"
                onClick={() => onFilterChange('all_near_term')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeFilterUrgency === 'all_near_term'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-100/80 text-amber-900 border border-amber-300 hover:bg-amber-200'
                }`}
              >
                <Warning size={13} weight="fill" />
                <span>All At-Risk (&le;90 Days) ({metrics.totalNearTermOrExpiredBatches})</span>
              </button>

              <button
                type="button"
                onClick={() => onFilterChange('critical')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeFilterUrgency === 'critical'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                &le; 30 Days ({metrics.criticalBatchesCount})
              </button>

              <button
                type="button"
                onClick={() => onFilterChange('expired')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeFilterUrgency === 'expired'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-rose-900 border border-rose-200 hover:bg-rose-50'
                }`}
              >
                Expired Only ({metrics.expiredBatchesCount})
              </button>
            </div>

            {activeFilterUrgency && (
              <button
                type="button"
                onClick={() => onFilterChange(null)}
                className="text-xs font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Batches Table List */}
          <div className="border border-amber-200/90 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="max-h-64 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-amber-50/80 text-amber-950 sticky top-0 font-bold uppercase tracking-wider text-[10px] border-b border-amber-200">
                  <tr>
                    <th className="py-2.5 px-3">Product Formulation</th>
                    <th className="py-2.5 px-3">Batch Number</th>
                    <th className="py-2.5 px-3">Expiration Date</th>
                    <th className="py-2.5 px-3">Timeline / Urgency</th>
                    <th className="py-2.5 px-3 text-right">Units in Batch</th>
                    <th className="py-2.5 px-3 text-right">At-Risk Value</th>
                    <th className="py-2.5 px-3 text-right">Manage Batch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <CheckCircle size={28} className="text-emerald-500 mx-auto mb-1" weight="duotone" />
                        <span className="font-semibold text-slate-700 block">No Expiring Batches Found</span>
                        <span className="text-xs text-slate-500">All registered batches have safe shelf-life buffers.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((b, idx) => {
                      const associatedProduct = products.find((p) => p.id === b.productId);
                      const isExpired = b.urgency === 'expired';
                      const isCritical = b.urgency === 'critical';
                      const isNearTerm = b.urgency === 'near_term';

                      return (
                        <tr
                          key={`${b.productId}-${b.batchNumber}-${idx}`}
                          className={`transition-colors ${
                            isExpired
                              ? 'bg-rose-50/70 hover:bg-rose-100/70'
                              : isCritical
                              ? 'bg-amber-50/80 hover:bg-amber-100/80'
                              : isNearTerm
                              ? 'bg-amber-50/40 hover:bg-amber-100/50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Product Formulation */}
                          <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{b.productName}</span>
                              {b.packaging && (
                                <span className="text-[10px] text-slate-500 font-normal">
                                  ({b.packaging})
                                </span>
                              )}
                              {b.category && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                                  {b.category}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Batch Number */}
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                              {b.batchNumber}
                            </span>
                          </td>

                          {/* Expiration Date */}
                          <td className="py-2.5 px-3 font-bold tabular-nums text-slate-800 whitespace-nowrap">
                            {b.expiryDateStr}
                          </td>

                          {/* Urgency Badge */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                                <XCircle size={12} weight="fill" className="text-rose-600" />
                                <span>Expired ({Math.abs(b.daysRemaining)} days ago)</span>
                              </span>
                            ) : isCritical ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
                                <ClockCountdown size={12} weight="fill" className="text-amber-600" />
                                <span>Critical: {b.daysRemaining} days remaining</span>
                              </span>
                            ) : isNearTerm ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                                <Warning size={12} weight="fill" className="text-amber-500" />
                                <span>Near-Term ({b.monthsRemaining} mos / {b.daysRemaining}d)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle size={12} weight="fill" className="text-emerald-500" />
                                <span>Safe ({b.daysRemaining}d remaining)</span>
                              </span>
                            )}
                          </td>

                          {/* Stock Units */}
                          <td className="py-2.5 px-3 text-right font-bold tabular-nums text-slate-900 whitespace-nowrap">
                            {b.stock.toLocaleString()} units
                          </td>

                          {/* Estimated Value */}
                          <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-slate-700 whitespace-nowrap">
                            ₹{((b.stock || 0) * (b.sellingRate || b.mrp || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>

                          {/* Action to edit/manage batch */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {associatedProduct && (
                              <button
                                type="button"
                                onClick={() => onOpenBatchModal(associatedProduct)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                title="Manage batch records & expiry"
                              >
                                <PencilSimple size={13} weight="bold" />
                                <span>Edit Batch</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
