import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  X,
  GitMerge,
  Trash,
  Lock,
  ShieldCheck,
  CheckCircle,
  Warning,
  Package,
  Buildings,
  Tag,
  CurrencyInr,
  Pill,
  Sparkle
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface MergeProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  dosageForm?: string;
}

export const MergeProductsModal: React.FC<MergeProductsModalProps> = ({
  isOpen,
  onClose,
  productName,
  dosageForm
}) => {
  const { products, deleteProduct, isProductOrdered, getProductOrderCount, mergeProducts } = useApp();

  // Find all products with this name (case-insensitive) AND exact dosage form
  const duplicateProducts = useMemo(() => {
    if (!productName) return [];
    const cleanName = productName.trim().toLowerCase();
    const cleanForm = (dosageForm || '').trim().toLowerCase();
    return products.filter((p) => {
      if (!p || !p.name) return false;
      const matchName = p.name.trim().toLowerCase() === cleanName;
      if (!matchName) return false;
      const pForm = (p.form || '').trim().toLowerCase();
      return pForm === cleanForm;
    });
  }, [products, productName, dosageForm]);

  // Selected primary product id
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string>('');
  const [combineStock, setCombineStock] = useState<boolean>(true);
  const [combineBatches, setCombineBatches] = useState<boolean>(true);

  // Initialize selected primary to the first product with orders or first item
  React.useEffect(() => {
    if (duplicateProducts.length > 0) {
      const withOrders = duplicateProducts.find((p) => isProductOrdered(p));
      setSelectedPrimaryId(withOrders ? withOrders.id : duplicateProducts[0].id);
    }
  }, [duplicateProducts, isProductOrdered]);

  if (!isOpen || duplicateProducts.length === 0) return null;

  const primaryProduct = duplicateProducts.find((p) => p.id === selectedPrimaryId) || duplicateProducts[0];
  const secondaryProducts = duplicateProducts.filter((p) => p.id !== selectedPrimaryId);

  // Check order constraints
  const primaryHasOrders = isProductOrdered(primaryProduct);
  const anySecondaryHasOrders = secondaryProducts.some((p) => isProductOrdered(p));

  const handleRemoveSingleDuplicate = (p: Product) => {
    if (isProductOrdered(p)) {
      toast.error(`Cannot remove "${p.name}" (${p.id})`, {
        description: 'Orders have been placed on this formulation. It can never be deleted from the database.'
      });
      return;
    }

    let confirmed = true;
    try {
      if (typeof window !== 'undefined' && window.confirm) {
        confirmed = window.confirm(`Are you sure you want to remove duplicate formulation "${p.name}" (${p.packaging || p.id})? This cannot be undone.`);
      }
    } catch {
      confirmed = true;
    }

    if (confirmed) {
      deleteProduct(p.id);
      if (duplicateProducts.length <= 2) {
        onClose();
      }
    }
  };

  const handleConfirmMerge = () => {
    if (!primaryProduct || secondaryProducts.length === 0) {
      toast.error('Select primary and at least one secondary duplicate formulation to merge');
      return;
    }

    // Merge each secondary into primary
    secondaryProducts.forEach((sec) => {
      mergeProducts(primaryProduct.id, sec.id, {
        combineStock,
        combineBatches
      });
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="merge-products-modal"
        data-testid="merge-products-modal"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-amber-100 flex items-center justify-between bg-amber-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <GitMerge size={22} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 font-heading">
                  Resolve Duplicate Formulations
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md">
                  {duplicateProducts.length} Formulations Found
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Duplicate product name: <span className="font-bold text-slate-900 font-mono">"{productName}"</span>
                {dosageForm && (
                  <span className="ml-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    Form: {dosageForm}
                  </span>
                )}
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Policy Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck size={20} weight="fill" className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 space-y-1">
              <span className="font-bold block text-sm text-blue-950">
                Audit & Database Retention Policy
              </span>
              <p>
                If by chance an order has been placed on any formulation, <strong>it can never be deleted from the database</strong>. Formulations with order history remain permanently archived to guarantee sales ledger and GST compliance.
              </p>
            </div>
          </div>

          {/* Formulations Comparison List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Review Existing Formulations with this Name ({duplicateProducts.length})
              </h3>
              <span className="text-xs text-slate-500">
                Select one to set as Primary (Master Entry)
              </span>
            </div>

            <div className="space-y-3">
              {duplicateProducts.map((p) => {
                const hasOrders = isProductOrdered(p);
                const orderCount = getProductOrderCount(p);
                const isPrimary = p.id === selectedPrimaryId;

                return (
                  <div
                    key={p.id}
                    id={`duplicate-card-${p.id}`}
                    data-testid={`duplicate-card-${p.id}`}
                    onClick={() => setSelectedPrimaryId(p.id)}
                    className={`rounded-xl border p-4 transition-all cursor-pointer ${
                      isPrimary
                        ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Radio + Title + Badges */}
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="primaryProductSelect"
                          checked={isPrimary}
                          onChange={() => setSelectedPrimaryId(p.id)}
                          className="mt-1 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              ID: {p.id}
                            </span>
                            {isPrimary && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                                Master / Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.genericName}</p>
                        </div>
                      </div>

                      {/* Right: Order Status Badge & Remove button */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                        {hasOrders ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200"
                            title="Orders have been placed on this product. It can never be deleted from the database."
                          >
                            <Package size={14} weight="fill" className="text-blue-600" />
                            <span>Placed Orders ({orderCount})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span>No Orders Placed</span>
                          </span>
                        )}

                        {/* Remove Option for This Duplicate */}
                        {hasOrders ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed border border-slate-200"
                            title="Cannot delete: An order has been placed on this formulation. It can never be deleted from the database."
                          >
                            <Lock size={12} weight="bold" />
                            <span>Protected</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSingleDuplicate(p);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="Remove this duplicate formulation"
                          >
                            <Trash size={12} weight="bold" />
                            <span>Remove Duplicate</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Specifications Grid */}
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Packaging</span>
                        <span className="font-semibold text-slate-800 truncate block">{p.packaging || 'Standard'}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Form</span>
                        <span className="font-semibold text-slate-800 block">{p.form || 'Tablet'}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">MRP</span>
                        <span className="font-bold text-slate-900 block font-mono">₹{Number(p.mrp).toFixed(2)}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-blue-600 block">Selling Price</span>
                        <span className="font-bold text-blue-700 block font-mono">
                          {p.sellingRate !== undefined && p.sellingRate !== null && p.sellingRate > 0
                            ? `₹${Number(p.sellingRate).toFixed(2)}`
                            : '—'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 block">Stock Units</span>
                        <span className="font-bold text-emerald-700 block font-mono">{p.stockUnits ?? 0}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Company</span>
                        <span className="font-semibold text-slate-800 truncate block">{p.company || 'DDB DRUG CHEM'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Merge Controls Section */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <GitMerge size={18} weight="bold" className="text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                2. Merge Duplicate Formulations Into Master
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Merging consolidates the secondary formulation(s) into <strong className="text-slate-900">{primaryProduct.name} ({primaryProduct.packaging || primaryProduct.id})</strong>.
            </p>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={combineStock}
                  onChange={(e) => setCombineStock(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Combine stock units from all duplicates into the master entry</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={combineBatches}
                  onChange={(e) => setCombineBatches(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Consolidate batch numbers and lot records into the master entry</span>
              </label>
            </div>

            {/* Impact Explanation */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
              {anySecondaryHasOrders ? (
                <span>
                  <strong>Notice:</strong> One or more secondary formulations have placed orders. In compliance with policy, their records <strong>will remain in the database</strong> (archived with merged status) so historical order invoices are never broken.
                </span>
              ) : (
                <span>
                  <strong>Clean Removal:</strong> Since the secondary formulation(s) have no placed orders, their stock will be transferred to the master and the duplicate entries will be cleanly removed from the database.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="confirm-merge-products-btn"
              data-testid="confirm-merge-products-btn"
              onClick={handleConfirmMerge}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold tracking-wide shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <GitMerge size={16} weight="bold" />
              <span>Merge Into Selected Master</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
