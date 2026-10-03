import React from 'react';
import { Trash, X, Warning, ArrowCounterClockwise, ShieldCheck, Lock } from '@phosphor-icons/react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onConfirmDelete: () => void;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  onClose,
  selectedProducts,
  onConfirmDelete
}) => {
  const { isProductOrdered } = useApp();

  if (!isOpen) return null;

  const protectedProducts = selectedProducts.filter((p) => isProductOrdered(p));
  const deletableProducts = selectedProducts.filter((p) => !isProductOrdered(p));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Trash size={20} weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Selected Formulations</h3>
              <p className="text-xs text-rose-700">
                {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} targeted
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Protected items notice if any */}
          {protectedProducts.length > 0 && (
            <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950">
              <ShieldCheck size={20} weight="fill" className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {protectedProducts.length} Product{protectedProducts.length > 1 ? 's' : ''} Protected from Deletion
                </span>
                <span>
                  Orders have been placed on these formulations. By system policy, they{' '}
                  <strong>can never be deleted from the database</strong> and will be preserved.
                </span>
              </div>
            </div>
          )}

          {deletableProducts.length > 0 ? (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <Warning size={20} weight="fill" className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Destructive Bulk Action</span>
                <span>
                  This will remove {deletableProducts.length} un-ordered formulation(s) from the database. You can restore them via Undo.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700">
              <Lock size={18} weight="bold" className="text-slate-500 shrink-0 mt-0.5" />
              <span>
                All selected products have placed orders and are protected. None of them can be deleted from the database.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Targeted Formulations:
            </label>
            <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 p-2">
              {selectedProducts.slice(0, 15).map((p) => {
                const ordered = isProductOrdered(p);
                return (
                  <div key={p.id} className="py-1.5 px-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                      {ordered ? (
                        <span title="Has placed orders">
                          <Lock size={13} weight="bold" className="text-blue-600 shrink-0" />
                        </span>
                      ) : (
                        <Trash size={13} className="text-rose-500 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-900 truncate">{p.name}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {ordered ? (
                        <span className="text-blue-700 font-bold">Protected</span>
                      ) : (
                        `₹${p.sellingRate}`
                      )}
                    </span>
                  </div>
                );
              })}
              {selectedProducts.length > 15 && (
                <div className="py-1.5 px-2 text-center text-xs text-slate-400 italic">
                  + {selectedProducts.length - 15} more formulations
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-bulk-delete-btn"
              data-testid="confirm-bulk-delete-btn"
              disabled={deletableProducts.length === 0}
              onClick={() => {
                onConfirmDelete();
                onClose();
              }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-colors ${
                deletableProducts.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
              }`}
            >
              <Trash size={16} weight="bold" />
              <span>
                {deletableProducts.length === 0
                  ? 'All Protected (Cannot Delete)'
                  : `Delete ${deletableProducts.length} Un-ordered Product${deletableProducts.length > 1 ? 's' : ''}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

