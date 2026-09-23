import React, { useState } from 'react';
import { Percent, X, Check } from '@phosphor-icons/react';

interface BulkGstModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onApplyGst: (gstRate: string) => void;
}

const GST_SLABS = ['0%', '5%', '12%', '18%', '28%'];

export const BulkGstModal: React.FC<BulkGstModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onApplyGst
}) => {
  const [selectedGst, setSelectedGst] = useState('12%');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyGst(selectedGst);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Percent size={20} weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bulk Update GST Slab</h3>
              <p className="text-xs text-slate-500">
                Updating GST rate for{' '}
                <span className="font-bold text-purple-700">{selectedCount}</span> formulation
                {selectedCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select GST Slab
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GST_SLABS.map((rate) => {
                const isSelected = selectedGst === rate;
                return (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSelectedGst(rate)}
                    className={`py-3 px-2 rounded-xl text-sm font-bold transition-all text-center border ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {rate}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="apply-bulk-gst-btn"
              data-testid="apply-bulk-gst-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
            >
              <Check size={16} weight="bold" />
              <span>Apply {selectedGst} to {selectedCount} Products</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
