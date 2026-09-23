import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCatalogColumnKey, CATALOG_COLUMNS, SalesRep } from '../../types';
import {
  SlidersHorizontal,
  Eye,
  EyeSlash,
  CheckCircle,
  X,
  ShieldCheck,
  Buildings,
  Tag,
  User,
  CurrencyInr,
  ArrowsLeftRight,
  Info
} from '@phosphor-icons/react';

interface RepColumnPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRepId?: string;
}

export const RepColumnPermissionsModal: React.FC<RepColumnPermissionsModalProps> = ({
  isOpen,
  onClose,
  initialRepId
}) => {
  const {
    reps,
    repColumnPermissions,
    updateRepHiddenColumns,
    setCurrentRep,
    setRole,
    setActiveRepTab
  } = useApp();

  const [selectedRepId, setSelectedRepId] = useState<string>(() => {
    if (initialRepId && reps.some(r => r.id === initialRepId)) {
      return initialRepId;
    }
    return reps[0]?.id || 'rep-1';
  });

  const selectedRep = reps.find(r => r.id === selectedRepId) || reps[0];

  // Local draft of hidden columns for the active selected rep
  const [draftHidden, setDraftHidden] = useState<ProductCatalogColumnKey[]>(() => {
    return repColumnPermissions[selectedRepId] || ['purchasePrice'];
  });

  // Keep draft in sync when user switches selected rep
  const handleSelectRep = (repId: string) => {
    setSelectedRepId(repId);
    setDraftHidden(repColumnPermissions[repId] || []);
  };

  if (!isOpen || !selectedRep) return null;

  const isColumnHidden = (key: ProductCatalogColumnKey) => draftHidden.includes(key);

  const toggleColumn = (key: ProductCatalogColumnKey) => {
    setDraftHidden(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const applyPreset = (preset: 'all_visible' | 'hide_cost_only' | 'hide_pts_ptr_cost' | 'minimal') => {
    switch (preset) {
      case 'all_visible':
        setDraftHidden([]);
        break;
      case 'hide_cost_only':
        setDraftHidden(['purchasePrice']);
        break;
      case 'hide_pts_ptr_cost':
        setDraftHidden(['purchasePrice', 'pricingToStockist', 'pricingToRetailer']);
        break;
      case 'minimal':
        setDraftHidden(['purchasePrice', 'pricingToStockist', 'pricingToRetailer', 'gst']);
        break;
    }
  };

  const handleSave = () => {
    updateRepHiddenColumns(selectedRep.id, draftHidden);
    onClose();
  };

  const handleSimulateView = () => {
    updateRepHiddenColumns(selectedRep.id, draftHidden);
    setCurrentRep(selectedRep);
    setRole('sales_rep');
    setActiveRepTab('catalog');
    onClose();
  };

  return (
    <div
      id="rep-column-permissions-backdrop"
      data-testid="rep-column-permissions-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <SlidersHorizontal size={22} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-slate-900 font-heading">
                  Sales Rep Catalogue Column Permissions
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Account-Specific Access Control
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Selectively show or hide columns in the product catalogue for individual sales representatives.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            data-testid="close-rep-permissions-modal"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Rep Selector Strip */}
        <div className="p-4 sm:px-6 bg-slate-50/70 border-b border-slate-200">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <User size={14} weight="bold" className="text-blue-600" />
              1. Select Sales Rep Account to Configure:
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Configuring:{' '}
              <strong className="text-slate-800 font-bold">{selectedRep.name}</strong> ({selectedRep.employeeCode})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {reps.map((rep) => {
              const isSelected = rep.id === selectedRepId;
              const repHidden = rep.id === selectedRepId ? draftHidden : (repColumnPermissions[rep.id] || []);
              const hiddenCount = repHidden.length;

              return (
                <button
                  key={rep.id}
                  type="button"
                  id={`select-rep-${rep.id}`}
                  data-testid={`select-rep-${rep.id}`}
                  onClick={() => handleSelectRep(rep.id)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={rep.avatarUrl}
                    alt={rep.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-sm font-bold truncate ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                        {rep.name}
                      </span>
                      {isSelected && (
                        <CheckCircle size={15} weight="fill" className="text-blue-600 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono text-[10px]">{rep.employeeCode}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                          hiddenCount > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {hiddenCount > 0 ? `${hiddenCount} hidden` : 'All visible'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Quick Presets Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck size={16} weight="bold" className="text-blue-600" />
              Quick Presets for {selectedRep.name}:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => applyPreset('hide_cost_only')}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 transition-colors"
              >
                Hide Purchase Price (Cost)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('hide_pts_ptr_cost')}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 transition-colors"
              >
                Hide Stockist (PTS) & Retailer (PTR)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('all_visible')}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg border border-emerald-200 transition-colors"
              >
                Show All 12 Columns
              </button>
            </div>
          </div>

          {/* Columns Visibility List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Configure 12 Product Catalogue Columns:
              </h4>
              <span className="text-xs text-slate-500">
                Visible to {selectedRep.name}:{' '}
                <strong className="text-emerald-700 font-bold">
                  {12 - draftHidden.length} / 12 columns
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {CATALOG_COLUMNS.map((col) => {
                const isHidden = isColumnHidden(col.key);
                const isPricingCol = ['mrp', 'pricingToStockist', 'pricingToRetailer', 'sellingRate', 'purchasePrice'].includes(col.key);

                return (
                  <div
                    key={col.key}
                    id={`perm-row-${col.key}`}
                    data-testid={`perm-row-${col.key}`}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isHidden
                        ? 'bg-amber-50/40 border-amber-200/80'
                        : isPricingCol
                        ? 'bg-blue-50/20 border-blue-200/60'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center shrink-0 ${
                          isHidden
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {col.orderNumber}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-sm font-bold ${
                              isHidden ? 'text-slate-500 line-through' : 'text-slate-900'
                            }`}
                          >
                            {col.label}
                          </span>
                          {(col.key === 'pricingToStockist' || col.key === 'pricingToRetailer') && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {col.description}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      id={`toggle-col-${col.key}`}
                      data-testid={`toggle-col-${col.key}`}
                      onClick={() => toggleColumn(col.key)}
                      title={
                        isHidden
                          ? `Click to SHOW ${col.label} to ${selectedRep.name}`
                          : `Click to HIDE ${col.label} from ${selectedRep.name}`
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        isHidden
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
                      }`}
                    >
                      {isHidden ? (
                        <>
                          <EyeSlash size={15} weight="bold" />
                          <span>Hidden</span>
                        </>
                      ) : (
                        <>
                          <Eye size={15} weight="bold" />
                          <span>Visible</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Preview Strip */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-2 text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Preview: What {selectedRep.name} will see in Field Catalogue
              </span>
              <span className="text-slate-400 text-[11px]">
                {draftHidden.length === 0
                  ? 'All columns visible to this rep'
                  : `${draftHidden.length} column(s) omitted exclusively for this rep`}
              </span>
            </div>

            {/* Mock Header Preview */}
            <div className="overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                {CATALOG_COLUMNS.filter(c => !draftHidden.includes(c.key)).map((c) => (
                  <span
                    key={c.key}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 whitespace-nowrap"
                  >
                    {c.orderNumber}. {c.shortLabel}
                  </span>
                ))}
              </div>
            </div>

            {draftHidden.length > 0 && (
              <p className="text-[11px] text-amber-300 flex items-center gap-1.5 pt-1 border-t border-slate-800">
                <Info size={14} weight="bold" />
                <span>
                  Omitted from {selectedRep.name}'s account:{' '}
                  <strong>
                    {draftHidden.map(k => CATALOG_COLUMNS.find(c => c.key === k)?.label).join(', ')}
                  </strong>
                  . Other sales representatives remain unaffected.
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleSimulateView}
            data-testid="simulate-rep-catalog-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
            title="Save and switch immediately into this sales rep's view"
          >
            <ArrowsLeftRight size={15} weight="bold" className="text-blue-600" />
            <span>Simulate & View Catalog as {selectedRep.name}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              data-testid="save-rep-permissions-btn"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <CheckCircle size={16} weight="bold" />
              <span>Save Permissions for {selectedRep.name}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
