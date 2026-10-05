import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { exportProductDataset, ProductExportOptions } from '../../utils/excelHelper';
import {
  X,
  DownloadSimple,
  FileXls,
  FileCsv,
  Checks,
  Table,
  Funnel,
  CheckCircle,
  CurrencyInr,
  Package,
  CalendarCheck,
  BuildingOffice,
  Sparkle
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export type ExportScope = 'all' | 'selected' | 'filtered';

interface ExportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProducts: Product[];
  selectedProductIds: string[];
  filteredProducts: Product[];
  organizationName?: string;
  initialScope?: ExportScope;
}

export const ExportProductsModal: React.FC<ExportProductsModalProps> = ({
  isOpen,
  onClose,
  allProducts,
  selectedProductIds,
  filteredProducts,
  organizationName = 'DDB DRUG CHEM',
  initialScope
}) => {
  // Determine default scope: if user opened while having checkboxes selected, default to 'selected'
  const [scope, setScope] = useState<ExportScope>(() => {
    if (initialScope) return initialScope;
    if (selectedProductIds.length > 0) return 'selected';
    return 'all';
  });

  // Keep state in sync if initialScope or selection changes when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (initialScope) {
        setScope(initialScope);
      } else if (selectedProductIds.length > 0) {
        setScope('selected');
      } else {
        setScope('all');
      }
    }
  }, [isOpen, initialScope, selectedProductIds.length]);

  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [includePricing, setIncludePricing] = useState<boolean>(true);
  const [includeInventory, setIncludeInventory] = useState<boolean>(true);
  const [includeBatches, setIncludeBatches] = useState<boolean>(true);
  const [customFilename, setCustomFilename] = useState<string>('');

  // Target products according to active scope
  const targetProducts = useMemo(() => {
    switch (scope) {
      case 'selected':
        return allProducts.filter((p) => selectedProductIds.includes(p.id));
      case 'filtered':
        return filteredProducts;
      case 'all':
      default:
        return allProducts;
    }
  }, [scope, allProducts, selectedProductIds, filteredProducts]);

  const totalCount = targetProducts.length;

  const defaultFilename = useMemo(() => {
    const cleanOrg = organizationName.replace(/[^a-zA-Z0-9]/g, '_');
    const scopeLabel = scope === 'selected' ? `${totalCount}_Selected` : scope === 'filtered' ? `${totalCount}_Filtered` : 'Catalog_Full';
    const dateStr = new Date().toISOString().slice(0, 10);
    return `${cleanOrg}_${scopeLabel}_${dateStr}.${format}`;
  }, [organizationName, scope, totalCount, format]);

  if (!isOpen) return null;

  const handleExport = () => {
    if (targetProducts.length === 0) {
      toast.error('No products to export in this scope.');
      return;
    }

    try {
      const options: ProductExportOptions = {
        format,
        includePricing,
        includeInventory,
        includeBatches
      };

      const finalName = customFilename.trim() ? customFilename.trim() : defaultFilename;
      const exportedFile = exportProductDataset(targetProducts, options, finalName);

      toast.success(`Exported ${targetProducts.length} formulations successfully!`, {
        description: `Saved as "${exportedFile}"`
      });

      onClose();
    } catch (err: any) {
      console.error('Export failed:', err);
      toast.error('Failed to export dataset. Please try again.');
    }
  };

  const handleQuickExportAll = () => {
    try {
      const exportedFile = exportProductDataset(
        allProducts,
        { format: 'xlsx', includePricing: true, includeInventory: true, includeBatches: true },
        `${organizationName.replace(/[^a-zA-Z0-9]/g, '_')}_Full_Catalog_${allProducts.length}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success(`Exported all ${allProducts.length} formulations to Excel!`, {
        description: `Saved as "${exportedFile}"`
      });
      onClose();
    } catch (err: any) {
      console.error('Quick export failed:', err);
      toast.error('Failed to export dataset.');
    }
  };

  return (
    <div
      id="export-products-modal-backdrop"
      data-testid="export-products-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-blue-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <DownloadSimple size={22} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 font-heading">
                  Export Product Catalogue Data
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                  {totalCount} Items Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Download structured product dataset in Excel (.xlsx) or CSV format for inventory auditing, reporting, or external ERP systems.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Step 1: Export Scope Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Choose Product Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option A: All Products */}
              <button
                type="button"
                id="export-scope-all"
                data-testid="export-scope-all"
                onClick={() => setScope('all')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  scope === 'all'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Table size={16} className={scope === 'all' ? 'text-emerald-600' : 'text-slate-400'} />
                      All Products
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {allProducts.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Entire catalogue across all clinical divisions and categories.
                  </p>
                </div>
                {scope === 'all' && (
                  <div className="mt-2 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle size={13} weight="fill" /> Selected
                  </div>
                )}
              </button>

              {/* Option B: Selected Products */}
              <button
                type="button"
                id="export-scope-selected"
                data-testid="export-scope-selected"
                disabled={selectedProductIds.length === 0}
                onClick={() => setScope('selected')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  selectedProductIds.length === 0
                    ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                    : scope === 'selected'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs cursor-pointer'
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Checks size={16} className={scope === 'selected' ? 'text-emerald-600' : 'text-slate-400'} />
                      Selected
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        selectedProductIds.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {selectedProductIds.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {selectedProductIds.length > 0
                      ? 'Only formulations ticked in the table checkboxes.'
                      : 'No items currently ticked in table checkboxes.'}
                  </p>
                </div>
                {scope === 'selected' && (
                  <div className="mt-2 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle size={13} weight="fill" /> Selected
                  </div>
                )}
              </button>

              {/* Option C: Filtered Products */}
              <button
                type="button"
                id="export-scope-filtered"
                data-testid="export-scope-filtered"
                onClick={() => setScope('filtered')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  scope === 'filtered'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Funnel size={16} className={scope === 'filtered' ? 'text-emerald-600' : 'text-slate-400'} />
                      Active Filtered
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {filteredProducts.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Formulations matching current search, category, or division.
                  </p>
                </div>
                {scope === 'filtered' && (
                  <div className="mt-2 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle size={13} weight="fill" /> Selected
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Format Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              2. Select File Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  format === 'xlsx'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value="xlsx"
                  checked={format === 'xlsx'}
                  onChange={() => setFormat('xlsx')}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileXls size={20} weight="fill" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">Excel Workbook (.xlsx)</div>
                  <div className="text-[11px] text-slate-500">
                    Styled spreadsheet with auto-fitted column widths and numeric cell types.
                  </div>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  format === 'csv'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileCsv size={20} weight="fill" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">CSV Document (.csv)</div>
                  <div className="text-[11px] text-slate-500">
                    Standard comma-separated format compatible with ERP, Tally, and databases.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Step 3: Column / Data Customization */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Include Data Fields
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Core formulation columns (Name, Salt, Form, Packaging, MRP) always included
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includePricing}
                  onChange={(e) => setIncludePricing(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-xs text-slate-900 block flex items-center gap-1">
                    <CurrencyInr size={13} weight="bold" className="text-emerald-600" />
                    Commercial Pricing & Tax
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    PTS, PTR, Rep Selling Rate, Purchase Price, GST %
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeInventory}
                  onChange={(e) => setIncludeInventory(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-xs text-slate-900 block flex items-center gap-1">
                    <Package size={13} weight="bold" className="text-blue-600" />
                    Warehouse Inventory
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Stock Units, Reorder Level, High Demand, Stock Status
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeBatches}
                  onChange={(e) => setIncludeBatches(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-xs text-slate-900 block flex items-center gap-1">
                    <CalendarCheck size={13} weight="bold" className="text-amber-600" />
                    Batches & Expiry
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Assigned Batch Numbers & Clinical Expiry Dates
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* File Details Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Target Records:</span>
              <span className="font-bold text-slate-900">{totalCount} Formulations</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Target Organization:</span>
              <span className="font-semibold text-slate-800">{organizationName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Generated File Name:</span>
              <span className="font-mono text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded truncate max-w-xs">
                {customFilename.trim() ? customFilename.trim() : defaultFilename}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Or quick export:</span>
            <button
              type="button"
              onClick={handleQuickExportAll}
              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <FileXls size={14} weight="bold" />
              <span>Full Catalog to Excel ({allProducts.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="confirm-export-dataset-btn"
              data-testid="confirm-export-dataset-btn"
              disabled={totalCount === 0}
              onClick={handleExport}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer ${
                totalCount > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <DownloadSimple size={16} weight="bold" />
              <span>Download {totalCount} Items ({format.toUpperCase()})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
