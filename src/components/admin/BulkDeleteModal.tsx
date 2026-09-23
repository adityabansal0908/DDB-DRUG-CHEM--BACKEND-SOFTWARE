import React from 'react';
import { Trash, X, Warning, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Product } from '../../types';

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
  if (!isOpen) return null;

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
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-lg transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <Warning size={20} weight="fill" className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Destructive Bulk Action</span>
              <span>
                This will remove these {selectedProducts.length} formulation(s) from the central database. You will
                be able to restore them immediately via the <strong>Undo</strong> button.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Products to be removed:
            </label>
            <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 p-2">
              {selectedProducts.slice(0, 15).map((p) => (
                <div key={p.id} className="py-1.5 px-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 truncate max-w-[220px]">{p.name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">₹{p.sellingRate}</span>
                </div>
              ))}
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
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-bulk-delete-btn"
              data-testid="confirm-bulk-delete-btn"
              onClick={() => {
                onConfirmDelete();
                onClose();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
            >
              <Trash size={16} weight="bold" />
              <span>Delete {selectedProducts.length} Product{selectedProducts.length > 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
