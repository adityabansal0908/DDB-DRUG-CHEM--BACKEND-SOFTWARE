import React, { useState } from 'react';
import { Tag, X, Check, Sparkle, FolderSimple } from '@phosphor-icons/react';

interface BulkCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  existingCategories: string[];
  onApplyCategory: (newCategory: string) => void;
}

export const BulkCategoryModal: React.FC<BulkCategoryModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  existingCategories,
  onApplyCategory
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [selectedQuickCat, setSelectedQuickCat] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = (selectedQuickCat || categoryName).trim();
    if (!finalCategory) return;
    onApplyCategory(finalCategory);
    onClose();
  };

  const handleSelectQuick = (cat: string) => {
    setSelectedQuickCat(cat);
    setCategoryName(cat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-indigo-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Tag size={20} weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bulk Update Category</h3>
              <p className="text-xs text-slate-500">
                Updating category for{' '}
                <span className="font-bold text-blue-700">{selectedCount}</span> selected formulation
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
          {/* Quick Select Category Chips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select an Existing Specialty / Category
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/60">
              {existingCategories
                .filter((c) => c && c.toLowerCase() !== 'all')
                .map((cat) => {
                  const isSelected = selectedQuickCat === cat || categoryName.trim().toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelectQuick(cat)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {isSelected ? <Check size={12} weight="bold" /> : <FolderSimple size={12} />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Or Type a Custom Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Or Specify Category / Clinical Segment
            </label>
            <div className="relative">
              <input
                type="text"
                id="bulk-category-input"
                data-testid="bulk-category-input"
                placeholder="e.g. Cardiology, Pediatric Nutrition, Dermatology..."
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  setSelectedQuickCat(null);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              This category label will be applied to all {selectedCount} selected formulation(s) simultaneously.
            </p>
          </div>

          {/* Confirmation Notice */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Sparkle size={18} weight="fill" className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Instant Rate Card Update</span>
              <span>
                All selected products will instantly regroup under{' '}
                <strong>"{categoryName.trim() || 'New Category'}"</strong> across admin filters and sales rep
                catalogues. Undo is available after saving.
              </span>
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
              type="submit"
              id="apply-bulk-category-btn"
              data-testid="apply-bulk-category-btn"
              disabled={!categoryName.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
            >
              <Check size={16} weight="bold" />
              <span>Apply to {selectedCount} Product{selectedCount > 1 ? 's' : ''}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
