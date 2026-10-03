import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Package,
  ArrowsClockwise,
  CheckCircle,
  Warning,
  Percent,
  Plus,
  Minus,
  Sparkle,
  FloppyDisk,
  Table,
  SlidersHorizontal,
  Info,
  Check,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  ClockCounterClockwise,
  Fire,
  CalendarBlank,
  Tag
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface BulkInventoryAdjusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
}

export type AdjustmentType = 'percentage' | 'units_change' | 'set_fixed';
export type PercentageDirection = 'increase' | 'decrease';
export type UnitsDirection = 'increase' | 'decrease';
export type RoundingMethod = 'none' | 'nearest_10' | 'nearest_50' | 'nearest_100';

export const BulkInventoryAdjusterModal: React.FC<BulkInventoryAdjusterModalProps> = ({
  isOpen,
  onClose,
  selectedProducts
}) => {
  const { batchUpdateMultipleProducts, addAuditLog, checkAndTriggerStockAlerts } = useApp();

  // Mode Selection
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('units_change');

  // Percentage Mode State
  const [percentageDirection, setPercentageDirection] = useState<PercentageDirection>('increase');
  const [percentageValue, setPercentageValue] = useState<string>('20');
  const [roundingMethod, setRoundingMethod] = useState<RoundingMethod>('nearest_10');

  // Units Change State (+Units / -Units)
  const [unitsDirection, setUnitsDirection] = useState<UnitsDirection>('increase');
  const [unitsValue, setUnitsValue] = useState<string>('500');

  // Fixed Value State
  const [fixedValue, setFixedValue] = useState<string>('500');

  // Advanced & Safety Options
  const [autoUpdateStatus, setAutoUpdateStatus] = useState<boolean>(true);
  const [updateReorderLevel, setUpdateReorderLevel] = useState<boolean>(false);
  const [newReorderLevel, setNewReorderLevel] = useState<string>('500');
  const [allocateBatches, setAllocateBatches] = useState<boolean>(true);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Consignment Shipment Receipt');
  const [customReasonNote, setCustomReasonNote] = useState<string>('');

  // Per-row exclusion or individual overrides
  const [excludedProductIds, setExcludedProductIds] = useState<Set<string>>(new Set());
  const [searchPreviewTerm, setSearchPreviewTerm] = useState<string>('');

  if (!isOpen || selectedProducts.length === 0) return null;

  const targetProducts = selectedProducts.filter((p) => !excludedProductIds.has(p.id));

  // Compute calculated new stock for each product
  const previewData = targetProducts.map((p) => {
    const current = p.stockUnits ?? 0;
    let proposed = current;

    if (adjustmentType === 'percentage') {
      const pct = parseFloat(percentageValue) || 0;
      const factor = pct / 100;
      let diff = current * factor;
      if (percentageDirection === 'decrease') {
        diff = -diff;
      }
      let rawNew = current + diff;

      // Apply rounding
      if (roundingMethod === 'nearest_10') {
        rawNew = Math.round(rawNew / 10) * 10;
      } else if (roundingMethod === 'nearest_50') {
        rawNew = Math.round(rawNew / 50) * 50;
      } else if (roundingMethod === 'nearest_100') {
        rawNew = Math.round(rawNew / 100) * 100;
      } else {
        rawNew = Math.round(rawNew);
      }
      proposed = Math.max(0, rawNew);
    } else if (adjustmentType === 'units_change') {
      const delta = parseInt(unitsValue, 10) || 0;
      if (unitsDirection === 'increase') {
        proposed = Math.max(0, current + delta);
      } else {
        proposed = Math.max(0, current - delta);
      }
    } else if (adjustmentType === 'set_fixed') {
      const exact = parseInt(fixedValue, 10);
      proposed = isNaN(exact) ? 0 : Math.max(0, exact);
    }

    const reorderThresh = updateReorderLevel && parseInt(newReorderLevel, 10) > 0
      ? parseInt(newReorderLevel, 10)
      : (p.reorderLevel ?? 500);

    const newStatus = proposed === 0 ? 'out_of_stock' : proposed <= reorderThresh ? 'low_stock' : 'active';
    const oldStatus = current === 0 ? 'out_of_stock' : current <= (p.reorderLevel ?? 500) ? 'low_stock' : 'active';

    return {
      product: p,
      currentStock: current,
      proposedStock: proposed,
      diff: proposed - current,
      oldStatus,
      newStatus,
      reorderLevel: reorderThresh
    };
  });

  // Aggregate Metrics for Header
  const totalCurrentStock = previewData.reduce((sum, item) => sum + item.currentStock, 0);
  const totalProposedStock = previewData.reduce((sum, item) => sum + item.proposedStock, 0);
  const netDifference = totalProposedStock - totalCurrentStock;
  const depletedBeforeCount = previewData.filter((i) => i.currentStock === 0).length;
  const depletedAfterCount = previewData.filter((i) => i.proposedStock === 0).length;
  const replenishedCount = previewData.filter((i) => i.currentStock === 0 && i.proposedStock > 0).length;

  // Filter preview list
  const filteredPreview = previewData.filter((item) => {
    if (!item?.product) return false;
    if (!searchPreviewTerm.trim()) return true;
    const term = searchPreviewTerm.toLowerCase();
    return (
      (item.product.name && item.product.name.toLowerCase().includes(term)) ||
      (item.product.genericName && item.product.genericName.toLowerCase().includes(term)) ||
      (item.product.packaging && item.product.packaging.toLowerCase().includes(term)) ||
      (item.product.category && item.product.category.toLowerCase().includes(term))
    );
  });

  const toggleExcludeProduct = (id: string) => {
    setExcludedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApplyAdjustment = () => {
    if (previewData.length === 0) {
      toast.error('No products targeted for inventory adjustment');
      return;
    }

    const updatedProducts: Product[] = previewData.map(({ product, proposedStock, newStatus, reorderLevel, diff }) => {
      let updatedBatches = product.batches ? [...product.batches] : [];

      // Allocate diff to earliest batch if option is checked
      if (allocateBatches && diff !== 0) {
        if (updatedBatches.length > 0) {
          // Add or deduct from first active batch
          const firstBatch = { ...updatedBatches[0] };
          firstBatch.stock = Math.max(0, (firstBatch.stock || 0) + diff);
          updatedBatches[0] = firstBatch;
        } else if (diff > 0) {
          // If no batches exist and stock is being added, create a receipt batch
          const now = new Date();
          const expiryYear = now.getFullYear() + 2;
          const monthStr = String(now.getMonth() + 1).padStart(2, '0');
          updatedBatches = [
            {
              id: `b-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              batchNumber: `REC-${now.getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
              expiryDate: `${monthStr}/${expiryYear}`,
              stock: proposedStock
            }
          ];
        }
      }

      return {
        ...product,
        stockUnits: proposedStock,
        reorderLevel: updateReorderLevel ? reorderLevel : product.reorderLevel,
        status: autoUpdateStatus ? (newStatus as any) : product.status,
        batches: updatedBatches
      };
    });

    const fullReason = customReasonNote.trim()
      ? `${adjustmentReason} (${customReasonNote.trim()})`
      : adjustmentReason;

    const actionDescription = `Bulk inventory adjusted for ${updatedProducts.length} formulations: ${
      netDifference >= 0 ? `+${netDifference.toLocaleString()}` : netDifference.toLocaleString()
    } units net (${fullReason})`;

    batchUpdateMultipleProducts(updatedProducts, actionDescription);

    addAuditLog(
      'UPDATE',
      'Product Catalog',
      `${updatedProducts.length} Formulations`,
      actionDescription,
      `Total Stock: ${totalCurrentStock.toLocaleString()} units`,
      `Total Stock: ${totalProposedStock.toLocaleString()} units (${netDifference >= 0 ? '+' : ''}${netDifference.toLocaleString()})`
    );

    checkAndTriggerStockAlerts(updatedProducts);

    toast.success(`Updated Inventory for ${updatedProducts.length} Products`, {
      description: `Warehouse Stock: ${totalCurrentStock.toLocaleString()} -> ${totalProposedStock.toLocaleString()} units (${
        netDifference >= 0 ? `+${netDifference.toLocaleString()}` : netDifference.toLocaleString()
      } units net).`
    });

    onClose();
  };

  return (
    <div
      id="bulk-inventory-adjuster-modal-backdrop"
      data-testid="bulk-inventory-adjuster-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="bulk-inventory-adjuster-modal-container"
        data-testid="bulk-inventory-adjuster-modal-container"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 max-h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Package size={22} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                  Bulk Inventory Adjuster
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {targetProducts.length} Formulation{targetProducts.length > 1 ? 's' : ''} Targeted
                </span>
                {excludedProductIds.size > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    {excludedProductIds.size} Excluded
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Simultaneously modify stock levels across multiple formulations by percentage (+% / -%) or exact unit adjustments.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Close modal"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Total Stock</span>
            <span className="text-base font-extrabold text-slate-800 tabular-nums">
              {totalCurrentStock.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Projected Total Stock</span>
            <span className="text-base font-extrabold text-blue-900 tabular-nums">
              {totalProposedStock.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Net Change</span>
            <span
              className={`text-base font-extrabold tabular-nums flex items-center gap-1 ${
                netDifference > 0
                  ? 'text-emerald-700'
                  : netDifference < 0
                  ? 'text-rose-700'
                  : 'text-slate-700'
              }`}
            >
              {netDifference > 0 ? (
                <>
                  <ArrowUp size={15} weight="bold" />
                  +{netDifference.toLocaleString()}
                </>
              ) : netDifference < 0 ? (
                <>
                  <ArrowDown size={15} weight="bold" />
                  {netDifference.toLocaleString()}
                </>
              ) : (
                '0 units'
              )}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Depleted (0 Stock)</span>
            <span className="text-base font-extrabold text-slate-800 tabular-nums">
              {depletedBeforeCount} &rarr; <span className={depletedAfterCount === 0 ? 'text-emerald-700' : 'text-rose-700'}>{depletedAfterCount}</span>
              {replenishedCount > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 block">
                  +{replenishedCount} replenished
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
          {/* Section 1: Adjustment Mode Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <SlidersHorizontal size={15} weight="bold" className="text-amber-600" />
                <span>Select Inventory Modification Mode</span>
              </label>

              {/* Mode Tabs */}
              <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  id="mode-tab-units"
                  data-testid="mode-tab-units"
                  onClick={() => setAdjustmentType('units_change')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    adjustmentType === 'units_change'
                      ? 'bg-white text-amber-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus size={13} weight="bold" />
                  <span>Value (+/- Units)</span>
                </button>

                <button
                  type="button"
                  id="mode-tab-percentage"
                  data-testid="mode-tab-percentage"
                  onClick={() => setAdjustmentType('percentage')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    adjustmentType === 'percentage'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Percent size={13} weight="bold" />
                  <span>Percentage (+/- %)</span>
                </button>

                <button
                  type="button"
                  id="mode-tab-fixed"
                  data-testid="mode-tab-fixed"
                  onClick={() => setAdjustmentType('set_fixed')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    adjustmentType === 'set_fixed'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Check size={13} weight="bold" />
                  <span>Set Exact Stock</span>
                </button>
              </div>
            </div>

            {/* MODE 1: Value / Units Change */}
            {adjustmentType === 'units_change' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Adjustment Action
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setUnitsDirection('increase')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                          unitsDirection === 'increase'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Plus size={14} weight="bold" />
                        <span>Replenish (+)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnitsDirection('decrease')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                          unitsDirection === 'decrease'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Minus size={14} weight="bold" />
                        <span>Deduct (-)</span>
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Units to {unitsDirection === 'increase' ? 'Add' : 'Deduct'} per Product
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        id="bulk-adjust-units-input"
                        data-testid="bulk-adjust-units-input"
                        value={unitsValue}
                        onChange={(e) => setUnitsValue(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">units</span>
                    </div>
                  </div>
                </div>

                {/* Quick Unit Presets */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="font-semibold text-slate-500 text-[11px]">Quick Presets:</span>
                  {[100, 250, 500, 1000, 2500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setUnitsDirection('increase');
                        setUnitsValue(String(preset));
                      }}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md font-bold text-xs transition-colors cursor-pointer"
                    >
                      +{preset.toLocaleString()} Units
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setUnitsDirection('decrease');
                      setUnitsValue('100');
                    }}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md font-bold text-xs transition-colors cursor-pointer"
                  >
                    -100 Units
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: Percentage Change */}
            {adjustmentType === 'percentage' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Percentage Direction
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPercentageDirection('increase')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                          percentageDirection === 'increase'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <ArrowUp size={14} weight="bold" />
                        <span>Increase (+%)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPercentageDirection('decrease')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                          percentageDirection === 'decrease'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <ArrowDown size={14} weight="bold" />
                        <span>Decrease (-%)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        step="1"
                        id="bulk-adjust-percentage-input"
                        data-testid="bulk-adjust-percentage-input"
                        value={percentageValue}
                        onChange={(e) => setPercentageValue(e.target.value)}
                        placeholder="e.g. 20"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Rounding Rule
                    </label>
                    <select
                      value={roundingMethod}
                      onChange={(e) => setRoundingMethod(e.target.value as RoundingMethod)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="nearest_10">Round to nearest 10 units</option>
                      <option value="nearest_50">Round to nearest 50 units</option>
                      <option value="nearest_100">Round to nearest 100 units</option>
                      <option value="none">Exact integer (no rounding)</option>
                    </select>
                  </div>
                </div>

                {/* Quick Percentage Presets */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="font-semibold text-slate-500 text-[11px]">Quick Presets:</span>
                  {[
                    { label: '+10% Buffer', dir: 'increase', val: '10' },
                    { label: '+25% Shipment', dir: 'increase', val: '25' },
                    { label: '+50% Major Inflow', dir: 'increase', val: '50' },
                    { label: '+100% Double Stock', dir: 'increase', val: '100' },
                    { label: '-15% Audit Trim', dir: 'decrease', val: '15' },
                    { label: '-30% Stock Realignment', dir: 'decrease', val: '30' }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setPercentageDirection(preset.dir as PercentageDirection);
                        setPercentageValue(preset.val);
                      }}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-md font-bold text-xs transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {totalCurrentStock === 0 && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <Info size={16} weight="fill" className="text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Notice:</strong> All currently targeted formulations are at <strong>0 units</strong>. Percentage adjustments on zero units remain 0. To add initial stock, use <strong>&ldquo;Value (+/- Units)&rdquo;</strong> or <strong>&ldquo;Set Exact Stock&rdquo;</strong>.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* MODE 3: Set Exact Fixed Stock */}
            {adjustmentType === 'set_fixed' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Set Exact Stock Units for All Selected Formulations
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        id="bulk-adjust-fixed-input"
                        data-testid="bulk-adjust-fixed-input"
                        value={fixedValue}
                        onChange={(e) => setFixedValue(e.target.value)}
                        placeholder="e.g. 500 or 0"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">units each</span>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setFixedValue('0')}
                      className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Warning size={14} weight="fill" />
                      <span>Set All to 0 (Depleted)</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="font-semibold text-slate-500 text-[11px]">Quick Exact Points:</span>
                  {[0, 100, 250, 500, 1000, 2000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFixedValue(String(preset))}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-md font-bold text-xs transition-colors cursor-pointer"
                    >
                      {preset === 0 ? '0 (Out of Stock)' : `${preset.toLocaleString()} Units`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Safety & Batch Integration Options */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck size={16} weight="bold" className="text-emerald-600" />
              <span>Safety, Thresholds &amp; Audit Log Record</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Checkbox: Auto-update status */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none bg-white p-2.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="checkbox-auto-status"
                  data-testid="checkbox-auto-status"
                  checked={autoUpdateStatus}
                  onChange={(e) => setAutoUpdateStatus(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Automated Catalog Status</span>
                  <span className="text-[11px] text-slate-500">
                    Automatically flag as &lsquo;out_of_stock&rsquo; (0 units), &lsquo;low_stock&rsquo; (&le; threshold), or &lsquo;active&rsquo;.
                  </span>
                </div>
              </label>

              {/* Checkbox: Allocate to batches */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none bg-white p-2.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="checkbox-allocate-batches"
                  data-testid="checkbox-allocate-batches"
                  checked={allocateBatches}
                  onChange={(e) => setAllocateBatches(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Synchronize Batch Allocations</span>
                  <span className="text-[11px] text-slate-500">
                    Proportionally adjust earliest batch records or create receipt batch for added stock.
                  </span>
                </div>
              </label>

              {/* Checkbox & input: Update reorder level */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="checkbox-update-reorder"
                    data-testid="checkbox-update-reorder"
                    checked={updateReorderLevel}
                    onChange={(e) => setUpdateReorderLevel(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800">Synchronize Safety Re-Order Level</span>
                </label>
                {updateReorderLevel && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500">Safety Threshold:</span>
                    <input
                      type="number"
                      min="50"
                      step="50"
                      value={newReorderLevel}
                      onChange={(e) => setNewReorderLevel(e.target.value)}
                      className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-xs text-slate-800"
                    />
                    <span className="text-[11px] text-slate-500">units</span>
                  </div>
                )}
              </div>

              {/* Adjustment Reason & Note */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  Inventory Audit Reason Note:
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="Consignment Shipment Receipt">Consignment Shipment Receipt</option>
                  <option value="Manufacturer Direct Depot Delivery">Manufacturer Direct Depot Delivery</option>
                  <option value="Cycle Count Physical Audit Reconciliation">Cycle Count Physical Audit Reconciliation</option>
                  <option value="Quarterly Inventory Baseline Setup">Quarterly Inventory Baseline Setup</option>
                  <option value="Damaged / QC Quarantine Stock Deduction">Damaged / QC Quarantine Stock Deduction</option>
                  <option value="Inter-Branch Depot Stock Transfer">Inter-Branch Depot Stock Transfer</option>
                  <option value="Emergency Hospital Allocation">Emergency Hospital Allocation</option>
                </select>
                <input
                  type="text"
                  placeholder="Optional remarks (e.g. PO #84102, Truck Batch #9)"
                  value={customReasonNote}
                  onChange={(e) => setCustomReasonNote(e.target.value)}
                  className="w-full px-2.5 py-1 border border-slate-200 rounded text-xs text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Live Preview Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-0">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Table size={16} weight="bold" className="text-slate-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Live Stock Impact Preview ({previewData.length} of {selectedProducts.length})
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter preview..."
                  value={searchPreviewTerm}
                  onChange={(e) => setSearchPreviewTerm(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                />
                {excludedProductIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setExcludedProductIds(new Set())}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Include All
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-[10px] font-bold uppercase text-slate-600 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Formulation</th>
                    <th className="py-2 px-3">Current Stock</th>
                    <th className="py-2 px-3 text-center">Net Adjustment</th>
                    <th className="py-2 px-3 text-right">Projected Stock</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-2 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPreview.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                        No matching formulations in preview
                      </td>
                    </tr>
                  ) : (
                    filteredPreview.map((item) => {
                      const isExcluded = excludedProductIds.has(item.product.id);
                      return (
                        <tr
                          key={item.product.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isExcluded ? 'opacity-40 bg-slate-100/50' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{item.product.name}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              {item.product.genericName} &bull; {item.product.packaging}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 tabular-nums font-semibold text-slate-700 whitespace-nowrap">
                            {item.currentStock.toLocaleString()} units
                          </td>

                          <td className="py-2.5 px-3 tabular-nums text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                                item.diff > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.diff < 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.diff > 0 ? `+${item.diff.toLocaleString()}` : item.diff.toLocaleString()}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap font-extrabold text-blue-900">
                            {item.proposedStock.toLocaleString()} units
                          </td>

                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {item.newStatus === 'out_of_stock' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                                <Warning size={11} weight="fill" />
                                0 (Depleted)
                              </span>
                            ) : item.newStatus === 'low_stock' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                <Warning size={11} weight="fill" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle size={11} weight="fill" />
                                Active
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => toggleExcludeProduct(item.product.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition-colors"
                              title={isExcluded ? 'Include formulation' : 'Exclude from adjustment'}
                            >
                              {isExcluded ? (
                                <Plus size={14} weight="bold" className="text-blue-600" />
                              ) : (
                                <X size={14} weight="bold" />
                              )}
                            </button>
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

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 shrink-0 flex-wrap gap-2">
          <div className="text-xs text-slate-500">
            Applying adjustment will update <strong>{previewData.length}</strong> formulation(s) with undo snapshot preserved.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="bulk-adjust-cancel-btn"
              data-testid="bulk-adjust-cancel-btn"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="bulk-adjust-confirm-btn"
              data-testid="bulk-adjust-confirm-btn"
              disabled={previewData.length === 0}
              onClick={handleApplyAdjustment}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer ${
                previewData.length > 0
                  ? 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <FloppyDisk size={16} weight="bold" />
              <span>Apply Inventory Adjustment ({previewData.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
