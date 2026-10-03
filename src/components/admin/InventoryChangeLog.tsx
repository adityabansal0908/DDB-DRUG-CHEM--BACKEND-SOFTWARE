import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditLog } from '../../types';
import {
  ClockCounterClockwise,
  MagnifyingGlass,
  Funnel,
  FileXls,
  Package,
  Tag,
  ArrowsClockwise,
  PencilSimple,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  User,
  ShieldCheck,
  CheckCircle,
  CalendarBlank,
  X,
  Info,
  Pill,
  ArrowRight
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface InventoryChangeLogProps {
  onSwitchToCatalog: () => void;
  onSelectProductForEdit?: (productName: string) => void;
}

export const InventoryChangeLog: React.FC<InventoryChangeLogProps> = ({
  onSwitchToCatalog
}) => {
  const { auditLogs, products } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'stock' | 'pricing' | 'bulk'>('ALL');
  const [adminFilter, setAdminFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'today' | '7days' | '30days'>('ALL');
  const [selectedSnapshotLog, setSelectedSnapshotLog] = useState<AuditLog | null>(null);

  // Filter logs specifically relevant to Product Catalog, Inventory, and Pricing
  const inventoryLogs = useMemo(() => {
    return (auditLogs || []).filter((log) => {
      if (!log) return false;
      const details = (log.details || '').toLowerCase();
      // Must be relevant to catalog or inventory/pricing
      const isCatalogModule = log.module === 'Product Catalog';
      const isStockOrPricingChange =
        log.changeCategory === 'stock' ||
        log.changeCategory === 'pricing' ||
        details.includes('stock') ||
        details.includes('price') ||
        details.includes('mrp') ||
        details.includes('pts') ||
        details.includes('ptr') ||
        details.includes('rate') ||
        details.includes('units') ||
        details.includes('formulary') ||
        details.includes('catalog') ||
        details.includes('adjustment');

      return isCatalogModule || isStockOrPricingChange;
    });
  }, [auditLogs]);

  // Unique Admins from logs
  const adminUsers = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    inventoryLogs.forEach((log) => {
      if (log.userEmail && !map.has(log.userEmail)) {
        map.set(log.userEmail, { name: log.userName || log.userEmail, email: log.userEmail });
      }
    });
    return Array.from(map.values());
  }, [inventoryLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return inventoryLogs.filter((log) => {
      if (!log) return false;
      const logDetails = (log.details || '').toLowerCase();
      const logTarget = (log.targetItemName || '').toLowerCase();
      const logUser = (log.userName || '').toLowerCase();
      const logEmail = (log.userEmail || '').toLowerCase();
      // 1. Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = logTarget.includes(query);
        const matchesDetails = logDetails.includes(query);
        const matchesUser = logUser.includes(query) || logEmail.includes(query);
        const matchesReason = log.reason?.toLowerCase().includes(query);
        if (!matchesName && !matchesDetails && !matchesUser && !matchesReason) return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'ALL') {
        if (categoryFilter === 'stock') {
          const isStock =
            log.changeCategory === 'stock' ||
            logDetails.includes('stock') ||
            logDetails.includes('units');
          if (!isStock) return false;
        } else if (categoryFilter === 'pricing') {
          const isPricing =
            log.changeCategory === 'pricing' ||
            logDetails.includes('price') ||
            logDetails.includes('mrp') ||
            logDetails.includes('pts') ||
            logDetails.includes('ptr') ||
            logDetails.includes('rate');
          if (!isPricing) return false;
        } else if (categoryFilter === 'bulk') {
          const isBulk =
            log.actionType === 'IMPORT' ||
            log.targetItemName.toLowerCase().includes('formulations') ||
            log.details.toLowerCase().includes('bulk') ||
            log.details.toLowerCase().includes('batch');
          if (!isBulk) return false;
        }
      }

      // 3. Admin User Filter
      if (adminFilter !== 'ALL' && log.userEmail !== adminFilter) {
        return false;
      }

      // 4. Time Window Filter
      if (timeFilter !== 'ALL') {
        const logTime = new Date(log.timestamp).getTime();
        const diff = now - logTime;
        if (timeFilter === 'today' && diff > oneDay) return false;
        if (timeFilter === '7days' && diff > 7 * oneDay) return false;
        if (timeFilter === '30days' && diff > 30 * oneDay) return false;
      }

      return true;
    });
  }, [inventoryLogs, searchTerm, categoryFilter, adminFilter, timeFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let stockChangesCount = 0;
    let pricingChangesCount = 0;
    const adminSet = new Set<string>();

    inventoryLogs.forEach((log) => {
      adminSet.add(log.userEmail);
      const isStock =
        log.changeCategory === 'stock' ||
        log.details.toLowerCase().includes('stock') ||
        log.details.toLowerCase().includes('units');
      const isPricing =
        log.changeCategory === 'pricing' ||
        log.details.toLowerCase().includes('price') ||
        log.details.toLowerCase().includes('pts') ||
        log.details.toLowerCase().includes('ptr') ||
        log.details.toLowerCase().includes('mrp') ||
        log.details.toLowerCase().includes('rate');

      if (isStock) stockChangesCount++;
      if (isPricing) pricingChangesCount++;
    });

    return {
      totalLogs: inventoryLogs.length,
      stockChangesCount,
      pricingChangesCount,
      uniqueAdminsCount: adminSet.size
    };
  }, [inventoryLogs]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No change log entries to export');
      return;
    }

    const headers = [
      'Timestamp (ISO)',
      'Formatted Time',
      'Modified By (Name)',
      'Modified By (Email)',
      'Role',
      'Target Formulation',
      'Action Type',
      'Change Category',
      'Audit Details / Summary',
      'Previous State Snippet',
      'New State Snippet',
      'Reason / Note'
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.timestamp}"`,
      `"${log.formattedTime}"`,
      `"${log.userName.replace(/"/g, '""')}"`,
      `"${log.userEmail}"`,
      `"${log.userRole}"`,
      `"${log.targetItemName.replace(/"/g, '""')}"`,
      `"${log.actionType}"`,
      `"${log.changeCategory || 'general'}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      `"${(log.previousStateSnippet || '').replace(/"/g, '""')}"`,
      `"${(log.newStateSnippet || '').replace(/"/g, '""')}"`,
      `"${(log.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inventory_Change_Log_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Inventory Change Log Exported', {
      description: `Downloaded ${filteredLogs.length} audit records to CSV.`
    });
  };

  return (
    <div id="inventory-change-log-section" data-testid="inventory-change-log-section" className="space-y-4 sm:space-y-6">
      {/* Top Banner / Explanation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ClockCounterClockwise size={26} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                Inventory &amp; Pricing Change Log
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                Administrative Audit Trail
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Real-time audit history of every stock quantity modification, price tier adjustment (PTS, PTR, Selling Rate, MRP), and consignment receipt across warehouse formulations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <button
            type="button"
            id="export-inventory-changelog-btn"
            data-testid="export-inventory-changelog-btn"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Export audit log records to CSV"
          >
            <FileXls size={18} weight="bold" className="text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToCatalog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Pill size={18} weight="bold" />
            <span>Return to Catalog ({products.length})</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Audit Events</span>
            <ClockCounterClockwise size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {metrics.totalLogs}
          </div>
          <span className="text-[11px] text-slate-500 block">Catalog-related actions tracked</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Stock Adjustments</span>
            <Package size={18} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 tabular-nums">
            {metrics.stockChangesCount}
          </div>
          <span className="text-[11px] text-slate-500 block">Quantity increments, deductions &amp; resets</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pricing / Rate Cards</span>
            <Tag size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 tabular-nums">
            {metrics.pricingChangesCount}
          </div>
          <span className="text-[11px] text-slate-500 block">PTS, PTR, MRP &amp; selling price entries</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Admins</span>
            <ShieldCheck size={18} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-950 tabular-nums">
            {metrics.uniqueAdminsCount}
          </div>
          <span className="text-[11px] text-slate-500 block">Administrators with logged changes</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 max-w-lg">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              id="inventory-changelog-search-input"
              data-testid="inventory-changelog-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search formulation, salt, admin name, email, or remarks..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={15} weight="bold" />
              </button>
            )}
          </div>

          {/* Quick Category Tabs */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs flex-wrap gap-0.5">
            <button
              type="button"
              id="changelog-filter-all"
              data-testid="changelog-filter-all"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events ({inventoryLogs.length})
            </button>

            <button
              type="button"
              id="changelog-filter-stock"
              data-testid="changelog-filter-stock"
              onClick={() => setCategoryFilter('stock')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'stock'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package size={14} weight="bold" />
              <span>Stock Levels</span>
            </button>

            <button
              type="button"
              id="changelog-filter-pricing"
              data-testid="changelog-filter-pricing"
              onClick={() => setCategoryFilter('pricing')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'pricing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag size={14} weight="bold" />
              <span>Pricing (PTS/PTR)</span>
            </button>

            <button
              type="button"
              id="changelog-filter-bulk"
              data-testid="changelog-filter-bulk"
              onClick={() => setCategoryFilter('bulk')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'bulk'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal size={14} weight="bold" />
              <span>Bulk Adjustments</span>
            </button>
          </div>
        </div>

        {/* Dropdowns Row: Filter by Admin & Time Frame */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Admin User:</span>
            <select
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Administrators ({adminUsers.length})</option>
              {adminUsers.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Timeframe:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Time</option>
              <option value="today">Today Only</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          {(searchTerm || categoryFilter !== 'ALL' || adminFilter !== 'ALL' || timeFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('ALL');
                setAdminFilter('ALL');
                setTimeFilter('ALL');
              }}
              className="text-blue-600 hover:text-blue-800 font-bold ml-auto text-xs underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Change Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">When &amp; Time</th>
                <th className="py-3 px-4">Formulation / Target</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Changes &amp; Audit Diff</th>
                <th className="py-3 px-4">Modified By</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ClockCounterClockwise size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No inventory change records found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {searchTerm || categoryFilter !== 'ALL'
                        ? 'Try clearing the search or category filters to view more records.'
                        : 'Any updates to warehouse stock or pricing will be permanently logged here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isStock =
                    log.changeCategory === 'stock' ||
                    log.details.toLowerCase().includes('stock') ||
                    log.details.toLowerCase().includes('units');
                  const isPricing =
                    log.changeCategory === 'pricing' ||
                    log.details.toLowerCase().includes('price') ||
                    log.details.toLowerCase().includes('pts') ||
                    log.details.toLowerCase().includes('ptr') ||
                    log.details.toLowerCase().includes('mrp');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{log.formattedTime}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(log.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </td>

                      {/* Formulation Target Column */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{log.targetItemName}</div>
                        {log.reason && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="font-medium text-slate-400">Note:</span> {log.reason}
                          </div>
                        )}
                      </td>

                      {/* Change Category Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            <Package size={12} weight="fill" />
                            <span>Stock Adjustment</span>
                          </span>
                        ) : isPricing ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
                            <Tag size={12} weight="fill" />
                            <span>Pricing &amp; Margins</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <span>Formulary Update</span>
                          </span>
                        )}
                      </td>

                      {/* Changes & Audit Diff */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="text-slate-800 font-medium leading-relaxed">
                          {log.details}
                        </div>

                        {/* Explicit Field Diff Pills if present */}
                        {log.fieldDiffs && log.fieldDiffs.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {log.fieldDiffs.map((diff, idx) => (
                              <div
                                key={idx}
                                className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5 text-[11px]"
                              >
                                <span className="font-bold text-slate-600">{diff.label}:</span>
                                <span className="text-slate-500 line-through">{String(diff.oldValue)}</span>
                                <ArrowRight size={10} className="text-slate-400" />
                                <span className="font-extrabold text-slate-900">{String(diff.newValue)}</span>
                                {diff.diff !== undefined && diff.diff !== 0 && (
                                  <span
                                    className={`ml-1 text-[10px] font-bold px-1 rounded ${
                                      diff.diff > 0
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {diff.diff > 0 ? `+${diff.diff.toLocaleString()}` : diff.diff.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Modified By Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-200">
                            {log.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{log.userName}</div>
                            <div className="text-[10px] text-slate-500">{log.userEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Snapshot View Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {(log.previousStateSnippet || log.newStateSnippet) ? (
                          <button
                            type="button"
                            onClick={() => setSelectedSnapshotLog(log)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                          >
                            View Diff
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Logged</span>
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

      {/* Snapshot / Diff Modal */}
      {selectedSnapshotLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedSnapshotLog(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Audit Snapshot Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedSnapshotLog.targetItemName} &bull; {selectedSnapshotLog.formattedTime}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSnapshotLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Action Summary
                </span>
                <p className="text-slate-800 font-semibold text-sm">
                  {selectedSnapshotLog.details}
                </p>
                {selectedSnapshotLog.reason && (
                  <p className="text-xs text-slate-600 mt-1 italic">
                    Reason: {selectedSnapshotLog.reason}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-xl space-y-1">
                  <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px] block">
                    Before Modification
                  </span>
                  <div className="text-rose-950 font-medium font-mono text-[11px] whitespace-pre-wrap">
                    {selectedSnapshotLog.previousStateSnippet || 'Baseline / Not specified'}
                  </div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block">
                    After Modification
                  </span>
                  <div className="text-emerald-950 font-bold font-mono text-[11px] whitespace-pre-wrap">
                    {selectedSnapshotLog.newStateSnippet || 'Updated state'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Logged Administrator</span>
                  <span className="font-bold text-slate-800">{selectedSnapshotLog.userName}</span>{' '}
                  <span className="text-slate-500">({selectedSnapshotLog.userEmail})</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {selectedSnapshotLog.userRole}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSnapshotLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
