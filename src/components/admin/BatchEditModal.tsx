import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  PencilSimpleLine,
  CurrencyInr,
  Stack,
  ArrowsClockwise,
  CheckCircle,
  Warning,
  Fire,
  ArrowUp,
  ArrowDown,
  Percent,
  Plus,
  Minus,
  Sparkle,
  FloppyDisk,
  Table,
  SlidersHorizontal,
  Info,
  Check
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
}

type PriceField = 'pricingToStockist' | 'pricingToRetailer' | 'sellingRate' | 'mrp' | 'purchasePrice';
type PriceAdjustmentMode =
  | 'set_fixed'
  | 'inc_percent'
  | 'dec_percent'
  | 'inc_amount'
  | 'dec_amount'
  | 'clear_blank';

type StockAdjustmentMode = 'replenish_add' | 'deduct_units' | 'set_exact';

export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  isOpen,
  onClose,
  selectedProducts
}) => {
  const { batchUpdateMultipleProducts } = useApp();

  const [activeTab, setActiveTab] = useState<'simultaneous' | 'grid'>('simultaneous');

  // Working copy of products being edited
  const [editedProducts, setEditedProducts] = useState<Product[]>([]);

  // Bulk Simultaneous Adjuster States - Pricing
  const [targetPriceField, setTargetPriceField] = useState<PriceField>('pricingToStockist');
  const [priceAdjMode, setPriceAdjMode] = useState<PriceAdjustmentMode>('set_fixed');
  const [priceAdjValue, setPriceAdjValue] = useState<string>('');

  // Bulk Simultaneous Adjuster States - Stock
  const [stockAdjMode, setStockAdjMode] = useState<StockAdjustmentMode>('replenish_add');
  const [stockAdjValue, setStockAdjValue] = useState<string>('500');
  const [bulkReorderLevel, setBulkReorderLevel] = useState<string>('');
  const [bulkHighDemandMode, setBulkHighDemandMode] = useState<'keep' | 'enable' | 'disable'>('keep');

  // Initialize or reset working copy when selected products or modal open status changes
  useEffect(() => {
    if (isOpen) {
      setEditedProducts(selectedProducts.map((p) => ({ ...p })));
      setPriceAdjValue('');
      setStockAdjValue('500');
      setBulkReorderLevel('');
      setBulkHighDemandMode('keep');
    }
  }, [isOpen, selectedProducts]);

  if (!isOpen || selectedProducts.length === 0) return null;

  // Comparison metrics for summary
  const originalTotalStock = selectedProducts.reduce((sum, p) => sum + (p.stockUnits ?? 0), 0);
  const newTotalStock = editedProducts.reduce((sum, p) => sum + (p.stockUnits ?? 0), 0);
  const stockDiff = newTotalStock - originalTotalStock;

  // Count modified items
  const modifiedCount = editedProducts.filter((curr) => {
    const orig = selectedProducts.find((p) => p.id === curr.id);
    if (!orig) return false;
    return (
      curr.stockUnits !== orig.stockUnits ||
      curr.reorderLevel !== orig.reorderLevel ||
      curr.isHighDemand !== orig.isHighDemand ||
      curr.mrp !== orig.mrp ||
      curr.pricingToStockist !== orig.pricingToStockist ||
      curr.pricingToRetailer !== orig.pricingToRetailer ||
      curr.sellingRate !== orig.sellingRate ||
      curr.purchasePrice !== orig.purchasePrice
    );
  }).length;

  // Simultaneous Apply Handlers
  const handleApplyBulkPricing = () => {
    if (priceAdjMode !== 'clear_blank') {
      const numVal = parseFloat(priceAdjValue);
      if (isNaN(numVal) || numVal < 0) {
        toast.error('Please enter a valid numeric price or adjustment value');
        return;
      }
    }

    setEditedProducts((prev) =>
      prev.map((p) => {
        let currentVal = p[targetPriceField];
        let nextVal: number | undefined = undefined;

        if (priceAdjMode === 'clear_blank') {
          nextVal = undefined;
        } else {
          const valNum = parseFloat(priceAdjValue) || 0;
          const basePrice = currentVal !== undefined && currentVal !== null ? Number(currentVal) : (p.mrp || 0);

          if (priceAdjMode === 'set_fixed') {
            nextVal = valNum > 0 ? valNum : undefined;
          } else if (priceAdjMode === 'inc_percent') {
            nextVal = basePrice > 0 ? Math.round((basePrice * (1 + valNum / 100)) * 100) / 100 : undefined;
          } else if (priceAdjMode === 'dec_percent') {
            nextVal = basePrice > 0 ? Math.max(0, Math.round((basePrice * (1 - valNum / 100)) * 100) / 100) : undefined;
          } else if (priceAdjMode === 'inc_amount') {
            nextVal = basePrice > 0 ? Math.round((basePrice + valNum) * 100) / 100 : valNum;
          } else if (priceAdjMode === 'dec_amount') {
            nextVal = basePrice > 0 ? Math.max(0, Math.round((basePrice - valNum) * 100) / 100) : undefined;
          }
        }

        return {
          ...p,
          [targetPriceField]: nextVal
        };
      })
    );

    const fieldNames: Record<PriceField, string> = {
      pricingToStockist: 'Pricing to Stockist (PTS)',
      pricingToRetailer: 'Pricing to Retailer (PTR)',
      sellingRate: 'Selling Price (Rep Rate)',
      mrp: 'MRP',
      purchasePrice: 'Purchase Price'
    };

    toast.success(`Updated ${fieldNames[targetPriceField]} for ${editedProducts.length} formulations`, {
      description: priceAdjMode === 'clear_blank' ? 'Fields cleared to blank (—)' : `Applied ${priceAdjMode.replace('_', ' ')} (${priceAdjValue})`
    });
  };

  const handleApplyBulkStock = () => {
    const valNum = parseInt(stockAdjValue, 10);
    if (isNaN(valNum) || valNum < 0) {
      toast.error('Please enter a valid stock units amount');
      return;
    }

    const reorderVal = bulkReorderLevel ? parseInt(bulkReorderLevel, 10) : undefined;

    setEditedProducts((prev) =>
      prev.map((p) => {
        let currentStock = p.stockUnits ?? 0;
        let newStock = currentStock;

        if (stockAdjMode === 'replenish_add') {
          newStock = currentStock + valNum;
        } else if (stockAdjMode === 'deduct_units') {
          newStock = Math.max(0, currentStock - valNum);
        } else if (stockAdjMode === 'set_exact') {
          newStock = valNum;
        }

        const nextReorder = reorderVal !== undefined && !isNaN(reorderVal) && reorderVal > 0 ? reorderVal : (p.reorderLevel ?? 500);

        let nextHighDemand = p.isHighDemand;
        if (bulkHighDemandMode === 'enable') nextHighDemand = true;
        if (bulkHighDemandMode === 'disable') nextHighDemand = false;

        const nextStatus = newStock === 0 ? 'out_of_stock' : newStock <= nextReorder ? 'low_stock' : 'active';

        return {
          ...p,
          stockUnits: newStock,
          reorderLevel: nextReorder,
          isHighDemand: nextHighDemand,
          status: nextStatus as any
        };
      })
    );

    toast.success(`Updated stock levels & thresholds for ${editedProducts.length} formulations`, {
      description: `Action: ${stockAdjMode.replace('_', ' ')} (${valNum} units)`
    });
  };

  // Grid Cell Edit Handler
  const handleUpdateProductCell = (id: string, field: keyof Product, value: any) => {
    setEditedProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };

        // Recalculate status dynamically if stock or reorderLevel changes
        if (field === 'stockUnits' || field === 'reorderLevel') {
          const s = updated.stockUnits ?? 0;
          const r = updated.reorderLevel ?? 500;
          updated.status = (s === 0 ? 'out_of_stock' : s <= r ? 'low_stock' : 'active') as any;
        }

        return updated;
      })
    );
  };

  // Reset a single row back to original
  const handleResetRow = (id: string) => {
    const orig = selectedProducts.find((p) => p.id === id);
    if (!orig) return;
    setEditedProducts((prev) => prev.map((p) => (p.id === id ? { ...orig } : p)));
  };

  // Save all batch modifications
  const handleSaveAll = () => {
    batchUpdateMultipleProducts(
      editedProducts,
      `Batch updated pricing & inventory for ${editedProducts.length} formulation(s)`
    );
    onClose();
  };

  return (
    <div
      id="batch-edit-modal-backdrop"
      data-testid="batch-edit-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="batch-edit-modal-container"
        data-testid="batch-edit-modal-container"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full p-4 sm:p-6 space-y-4 max-h-[94vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <PencilSimpleLine size={22} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                  Batch Edit Pricing &amp; Stock Levels
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {selectedProducts.length} Formulations Selected
                </span>
                {modifiedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    {modifiedCount} Modified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Update prices, rates, margins, and warehouse inventory levels simultaneously across selected formulations.
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

        {/* Tab Controls */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              id="tab-simultaneous-bulk"
              data-testid="tab-simultaneous-bulk"
              onClick={() => setActiveTab('simultaneous')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'simultaneous'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal size={14} weight="bold" />
              <span>Simultaneous Bulk Adjuster</span>
            </button>
            <button
              type="button"
              id="tab-spreadsheet-grid"
              data-testid="tab-spreadsheet-grid"
              onClick={() => setActiveTab('grid')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table size={14} weight="bold" />
              <span>Editable Grid Table ({selectedProducts.length})</span>
            </button>
          </div>

          {/* Quick summary metric pill */}
          <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
            <span>
              Total Stock:{' '}
              <strong className="text-slate-900 font-bold tabular-nums">
                {newTotalStock.toLocaleString()} units
              </strong>{' '}
              {stockDiff !== 0 && (
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    stockDiff > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {stockDiff > 0 ? `+${stockDiff.toLocaleString()}` : stockDiff.toLocaleString()}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
          {activeTab === 'simultaneous' ? (
            /* TAB 1: SIMULTANEOUS BULK ADJUSTER */
            <div className="space-y-4">
              {/* Section A: Pricing Adjuster */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 border border-blue-150 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                  <CurrencyInr size={18} weight="bold" className="text-blue-600" />
                  <span>1. Simultaneous Pricing &amp; Margin Adjuster</span>
                </div>
                <p className="text-xs text-slate-600">
                  Select a rate field, choose an adjustment formula, and apply it simultaneously to all{' '}
                  <strong className="text-slate-900">{editedProducts.length}</strong> selected formulations.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Field Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Target Pricing Field
                    </label>
                    <select
                      id="batch-target-price-field"
                      data-testid="batch-target-price-field"
                      value={targetPriceField}
                      onChange={(e) => setTargetPriceField(e.target.value as PriceField)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pricingToStockist">6. Pricing to Stockist (PTS)</option>
                      <option value="pricingToRetailer">7. Pricing to Retailer (PTR)</option>
                      <option value="sellingRate">8. Selling Price (Rep Rate)</option>
                      <option value="mrp">5. MRP (Retail)</option>
                      <option value="purchasePrice">9. Purchase Price (Cost)</option>
                    </select>
                  </div>

                  {/* Mode Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Adjustment Action
                    </label>
                    <select
                      id="batch-price-adjustment-mode"
                      data-testid="batch-price-adjustment-mode"
                      value={priceAdjMode}
                      onChange={(e) => setPriceAdjMode(e.target.value as PriceAdjustmentMode)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="set_fixed">Set Exact Value (₹)</option>
                      <option value="inc_percent">Increase by Percentage (+%)</option>
                      <option value="dec_percent">Decrease by Percentage (-%)</option>
                      <option value="inc_amount">Increase by Amount (+₹)</option>
                      <option value="dec_amount">Decrease by Amount (-₹)</option>
                      <option value="clear_blank">Clear Value (Leave strictly Blank —)</option>
                    </select>
                  </div>

                  {/* Value Input & Apply */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      {priceAdjMode === 'clear_blank'
                        ? 'Confirm Clear'
                        : priceAdjMode.includes('percent')
                        ? 'Percentage (%)'
                        : 'Amount (₹)'}
                    </label>
                    <div className="flex items-center gap-2">
                      {priceAdjMode !== 'clear_blank' ? (
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            id="batch-price-value-input"
                            data-testid="batch-price-value-input"
                            value={priceAdjValue}
                            onChange={(e) => setPriceAdjValue(e.target.value)}
                            placeholder={priceAdjMode.includes('percent') ? 'e.g. 8' : 'e.g. 145.00'}
                            className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-2.5 top-2.5 text-xs font-bold text-slate-400">
                            {priceAdjMode.includes('percent') ? '%' : '₹'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex-1 py-2 px-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-800">
                          Field will be left strictly blank (—)
                        </div>
                      )}

                      <button
                        type="button"
                        id="btn-apply-bulk-price"
                        data-testid="btn-apply-bulk-price"
                        onClick={handleApplyBulkPricing}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs inline-flex items-center gap-1"
                      >
                        <Check size={14} weight="bold" />
                        <span>Apply</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Presets for Pricing */}
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 flex-wrap">
                  <span className="font-semibold text-slate-600">Quick Presets:</span>
                  {[
                    { label: '+5% Markup', mode: 'inc_percent', val: '5' },
                    { label: '+10% Markup', mode: 'inc_percent', val: '10' },
                    { label: '-5% Discount', mode: 'dec_percent', val: '5' },
                    { label: '+₹10 Amount', mode: 'inc_amount', val: '10' },
                    { label: 'Clear Blank (—)', mode: 'clear_blank', val: '' }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPriceAdjMode(p.mode as PriceAdjustmentMode);
                        setPriceAdjValue(p.val);
                      }}
                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors font-medium cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section B: Stock Levels & Re-Order Point Adjuster */}
              <div className="bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-slate-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                  <Stack size={18} weight="bold" className="text-amber-600" />
                  <span>2. Simultaneous Stock Levels &amp; Safety Buffer Adjuster</span>
                </div>
                <p className="text-xs text-slate-600">
                  Update inventory levels, set warehouse safety thresholds, or toggle high-demand automated alerts for all{' '}
                  <strong className="text-slate-900">{editedProducts.length}</strong> selected formulations.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Stock Action Mode */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Inventory Action
                    </label>
                    <select
                      id="batch-stock-mode"
                      data-testid="batch-stock-mode"
                      value={stockAdjMode}
                      onChange={(e) => setStockAdjMode(e.target.value as StockAdjustmentMode)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="replenish_add">+ Add Stock Units (Replenish)</option>
                      <option value="deduct_units">- Deduct Stock Units (Dispatch)</option>
                      <option value="set_exact">Set Exact Stock Units</option>
                    </select>
                  </div>

                  {/* Units Amount */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Stock Units Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      id="batch-stock-value-input"
                      data-testid="batch-stock-value-input"
                      value={stockAdjValue}
                      onChange={(e) => setStockAdjValue(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Re-order threshold override */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Re-Order Threshold Level
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        id="batch-reorder-input"
                        data-testid="batch-reorder-input"
                        value={bulkReorderLevel}
                        onChange={(e) => setBulkReorderLevel(e.target.value)}
                        placeholder="Leave blank to keep"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />

                      <button
                        type="button"
                        id="btn-apply-bulk-stock"
                        data-testid="btn-apply-bulk-stock"
                        onClick={handleApplyBulkStock}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs inline-flex items-center gap-1"
                      >
                        <Check size={14} weight="bold" />
                        <span>Apply</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* High Demand Toggle Mode */}
                <div className="flex items-center justify-between pt-2 border-t border-amber-200/80 flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                    <Fire size={15} weight="fill" className="text-orange-500" />
                    <span>High-Demand Automated Alerting:</span>
                  </div>
                  <div className="flex items-center bg-white rounded-lg border border-amber-200 p-0.5">
                    <button
                      type="button"
                      onClick={() => setBulkHighDemandMode('keep')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        bulkHighDemandMode === 'keep' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Keep Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkHighDemandMode('enable')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        bulkHighDemandMode === 'enable' ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Mark All High-Demand (🔥)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkHighDemandMode('disable')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        bulkHighDemandMode === 'disable' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Mark All Standard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* SPREADSHEET GRID TABLE (Always shown on Tab 2 or as preview below Tab 1) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Table size={15} weight="bold" />
                <span>
                  {activeTab === 'grid' ? 'Spreadsheet Row Editor' : 'Live Impact Preview of Formulations'} (
                  {editedProducts.length})
                </span>
              </span>
              <button
                type="button"
                onClick={() => setEditedProducts(selectedProducts.map((p) => ({ ...p })))}
                className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 inline-flex items-center gap-1"
                title="Reset all rows back to initial values"
              >
                <ArrowsClockwise size={12} />
                <span>Revert All Rows</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="max-h-80 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold uppercase tracking-wider text-[10px] z-10">
                    <tr className="border-b border-slate-200">
                      <th className="py-2.5 px-3 whitespace-nowrap">Product Formulation</th>
                      <th className="py-2.5 px-2 text-right whitespace-nowrap text-amber-900 bg-amber-50/50">
                        Stock Units
                      </th>
                      <th className="py-2.5 px-2 text-right whitespace-nowrap text-amber-900 bg-amber-50/50">
                        Re-Order Pt
                      </th>
                      <th className="py-2.5 px-2 text-center whitespace-nowrap">High Demand</th>
                      <th className="py-2.5 px-2 text-right whitespace-nowrap">MRP (₹)</th>
                      <th className="py-2.5 px-2 text-right whitespace-nowrap text-emerald-800 bg-emerald-50/40">
                        PTS (Stockist)
                      </th>
                      <th className="py-2.5 px-2 text-right whitespace-nowrap text-teal-800 bg-teal-50/40">
                        PTR (Retailer)
                      </th>
                      <th className="py-2.5 px-2 text-right whitespace-nowrap text-blue-800 bg-blue-50/40">
                        Selling Rate
                      </th>
                      <th className="py-2.5 px-2 text-right whitespace-nowrap text-slate-600">Purchase (₹)</th>
                      <th className="py-2.5 px-2 text-center whitespace-nowrap">Projected Status</th>
                      <th className="py-2.5 px-2 text-center">Reset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans text-xs">
                    {editedProducts.map((p, idx) => {
                      const orig = selectedProducts.find((o) => o.id === p.id);
                      const isModified =
                        orig &&
                        (p.stockUnits !== orig.stockUnits ||
                          p.reorderLevel !== orig.reorderLevel ||
                          p.isHighDemand !== orig.isHighDemand ||
                          p.mrp !== orig.mrp ||
                          p.pricingToStockist !== orig.pricingToStockist ||
                          p.pricingToRetailer !== orig.pricingToRetailer ||
                          p.sellingRate !== orig.sellingRate ||
                          p.purchasePrice !== orig.purchasePrice);

                      const isOutOfStock = (p.stockUnits ?? 0) === 0;
                      const isReorderLevel =
                        !isOutOfStock &&
                        (p.stockUnits ?? 0) <= (p.reorderLevel ?? 500);

                      return (
                        <tr
                          key={p.id}
                          className={`transition-colors ${
                            isModified ? 'bg-amber-50/40 hover:bg-amber-100/40' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Formulation Name & Packaging */}
                          <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold">{p.name}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({p.packaging || 'Standard'})
                              </span>
                              {isModified && (
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1 py-0.2 rounded">
                                  MOD
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Stock Units (editable) */}
                          <td className="py-1.5 px-2 text-right whitespace-nowrap bg-amber-50/20">
                            <input
                              type="number"
                              min="0"
                              value={p.stockUnits ?? 0}
                              onChange={(e) =>
                                handleUpdateProductCell(
                                  p.id,
                                  'stockUnits',
                                  Math.max(0, parseInt(e.target.value, 10) || 0)
                                )
                              }
                              className="w-20 px-1.5 py-1 text-right text-xs font-bold text-slate-900 border border-slate-200 rounded focus:ring-1 focus:ring-amber-500 bg-white"
                            />
                          </td>

                          {/* Re-Order Point (editable) */}
                          <td className="py-1.5 px-2 text-right whitespace-nowrap bg-amber-50/20">
                            <input
                              type="number"
                              min="0"
                              value={p.reorderLevel ?? 500}
                              onChange={(e) =>
                                handleUpdateProductCell(
                                  p.id,
                                  'reorderLevel',
                                  Math.max(0, parseInt(e.target.value, 10) || 500)
                                )
                              }
                              className="w-16 px-1.5 py-1 text-right text-xs font-bold text-slate-700 border border-slate-200 rounded focus:ring-1 focus:ring-amber-500 bg-white"
                            />
                          </td>

                          {/* High Demand Toggle */}
                          <td className="py-1.5 px-2 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleUpdateProductCell(p.id, 'isHighDemand', !p.isHighDemand)}
                              className={`p-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                p.isHighDemand
                                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-700'
                              }`}
                              title={p.isHighDemand ? 'High-Demand Formulation' : 'Click to mark High-Demand'}
                            >
                              <Fire size={14} weight={p.isHighDemand ? 'fill' : 'regular'} />
                            </button>
                          </td>

                          {/* MRP (editable) */}
                          <td className="py-1.5 px-2 text-right whitespace-nowrap">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={p.mrp ?? 0}
                              onChange={(e) =>
                                handleUpdateProductCell(p.id, 'mrp', parseFloat(e.target.value) || 0)
                              }
                              className="w-18 px-1.5 py-1 text-right text-xs font-semibold text-slate-800 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                            />
                          </td>

                          {/* PTS (editable, can be blank) */}
                          <td className="py-1.5 px-2 text-right whitespace-nowrap bg-emerald-50/15">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={p.pricingToStockist ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                handleUpdateProductCell(
                                  p.id,
                                  'pricingToStockist',
                                  val !== undefined && !isNaN(val) && val > 0 ? val : undefined
                                );
                              }}
                              placeholder="—"
                              className="w-20 px-1.5 py-1 text-right text-xs font-bold text-emerald-800 border border-emerald-200 rounded focus:ring-1 focus:ring-emerald-500 bg-white"
                            />
                          </td>

                          {/* PTR (editable, can be blank) */}
                          <td className="py-1.5 px-2 text-right whitespace-nowrap bg-teal-50/15">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={p.pricingToRetailer ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                handleUpdateProductCell(
                                  p.id,
                                  'pricingToRetailer',
                                  val !== undefined && !isNaN(val) && val > 0 ? val : undefined
                                );
                              }}
                              placeholder="—"
                              className="w-20 px-1.5 py-1 text-right text-xs font-bold text-teal-800 border border-teal-200 rounded focus:ring-1 focus:ring-teal-500 bg-white"
                            />
                          </td>

                          {/* Selling Price (editable, can be blank) */}
                          <td className="py-1.5 px-2 text-right whitespace-nowrap bg-blue-50/15">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={p.sellingRate ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                handleUpdateProductCell(
                                  p.id,
                                  'sellingRate',
                                  val !== undefined && !isNaN(val) && val > 0 ? val : undefined
                                );
                              }}
                              placeholder="—"
                              className="w-20 px-1.5 py-1 text-right text-xs font-bold text-blue-700 border border-blue-200 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                            />
                          </td>

                          {/* Purchase Price (editable) */}
                          <td className="py-1.5 px-2 text-right whitespace-nowrap">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={p.purchasePrice ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                handleUpdateProductCell(
                                  p.id,
                                  'purchasePrice',
                                  val !== undefined && !isNaN(val) && val > 0 ? val : undefined
                                );
                              }}
                              placeholder="—"
                              className="w-18 px-1.5 py-1 text-right text-xs font-medium text-slate-600 border border-slate-200 rounded bg-white"
                            />
                          </td>

                          {/* Projected Status */}
                          <td className="py-1.5 px-2 text-center whitespace-nowrap">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full">
                                <Warning size={11} weight="fill" className="text-rose-600" />
                                Out of Stock
                              </span>
                            ) : isReorderLevel ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                {p.isHighDemand ? (
                                  <Fire size={11} weight="fill" className="text-orange-600" />
                                ) : (
                                  <Warning size={11} weight="fill" className="text-amber-600" />
                                )}
                                Re-Order Level
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle size={11} weight="fill" className="text-emerald-600" />
                                Active
                              </span>
                            )}
                          </td>

                          {/* Reset Single Row */}
                          <td className="py-1.5 px-2 text-center whitespace-nowrap">
                            {isModified && (
                              <button
                                type="button"
                                onClick={() => handleResetRow(p.id)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                                title="Revert this row to original"
                              >
                                <ArrowsClockwise size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0 flex-wrap gap-2">
          <div className="text-xs text-slate-500">
            {modifiedCount > 0 ? (
              <span>
                <strong className="text-blue-700 font-bold">{modifiedCount}</strong> formulation(s) modified.{' '}
                Click Save Changes to commit all adjustments.
              </span>
            ) : (
              <span>No modifications made yet. Use the adjuster above or edit cells directly.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="save-batch-edit-btn"
              data-testid="save-batch-edit-btn"
              onClick={handleSaveAll}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <FloppyDisk size={16} weight="bold" />
              <span>Save &amp; Apply Changes ({editedProducts.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
