import React from 'react';
import {
  CheckSquareOffset,
  Eye,
  EyeSlash,
  Tag,
  Buildings,
  Percent,
  Trash,
  DownloadSimple,
  X,
  Sparkle
} from '@phosphor-icons/react';

interface BulkActionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  onSelectAllFiltered: () => void;
  onClearSelection: () => void;
  onBulkSetVisibility: (hidden: boolean) => void;
  onOpenCategoryModal: () => void;
  onOpenCompanyModal: () => void;
  onOpenGstModal: () => void;
  onOpenDeleteModal: () => void;
  onExportSelected: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalFilteredCount,
  onSelectAllFiltered,
  onClearSelection,
  onBulkSetVisibility,
  onOpenCategoryModal,
  onOpenCompanyModal,
  onOpenGstModal,
  onOpenDeleteModal,
  onExportSelected
}) => {
  if (selectedCount === 0) return null;

  const isAllFilteredSelected = selectedCount === totalFilteredCount && totalFilteredCount > 0;

  return (
    <div
      id="bulk-actions-toolbar"
      data-testid="bulk-actions-toolbar"
      className="bg-slate-900 text-white rounded-xl px-4 py-3 shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Selection info & quick select helpers */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 bg-blue-600/30 text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide">
          <CheckSquareOffset size={16} weight="fill" className="text-blue-400" />
          <span>
            <strong className="text-white text-sm">{selectedCount}</strong> product{selectedCount > 1 ? 's' : ''}{' '}
            selected
          </span>
        </div>

        {!isAllFilteredSelected && totalFilteredCount > selectedCount && (
          <button
            type="button"
            onClick={onSelectAllFiltered}
            className="text-xs text-slate-300 hover:text-white underline font-medium hover:bg-slate-800 px-2 py-1 rounded transition-colors"
            title={`Select all ${totalFilteredCount} matching products`}
          >
            Select all {totalFilteredCount} filtered
          </button>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          title="Clear current selection"
        >
          <X size={13} weight="bold" />
          <span>Deselect all</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Bulk Visibility: Show to Reps */}
        <button
          type="button"
          id="bulk-btn-show-reps"
          data-testid="bulk-btn-show-reps"
          onClick={() => onBulkSetVisibility(false)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors"
          title="Make all selected products visible to Sales Reps"
        >
          <Eye size={15} weight="bold" className="text-emerald-400" />
          <span>Show to Reps</span>
        </button>

        {/* Bulk Visibility: Hide from Reps */}
        <button
          type="button"
          id="bulk-btn-hide-reps"
          data-testid="bulk-btn-hide-reps"
          onClick={() => onBulkSetVisibility(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/25 hover:bg-amber-600/40 text-amber-200 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors"
          title="Hide all selected products from Sales Rep catalogues"
        >
          <EyeSlash size={15} weight="bold" className="text-amber-400" />
          <span>Hide from Reps</span>
        </button>

        <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />

        {/* Bulk Update Category */}
        <button
          type="button"
          id="bulk-btn-update-category"
          data-testid="bulk-btn-update-category"
          onClick={onOpenCategoryModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          title="Assign a new specialty or clinical category to all selected products"
        >
          <Tag size={15} weight="bold" />
          <span>Update Category</span>
        </button>

        {/* Bulk Update Company */}
        <button
          type="button"
          id="bulk-btn-update-company"
          data-testid="bulk-btn-update-company"
          onClick={onOpenCompanyModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          title="Batch update manufacturer company name"
        >
          <Buildings size={15} />
          <span className="hidden sm:inline">Company</span>
        </button>

        {/* Bulk Update GST */}
        <button
          type="button"
          id="bulk-btn-update-gst"
          data-testid="bulk-btn-update-gst"
          onClick={onOpenGstModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          title="Set GST rate for selected products"
        >
          <Percent size={15} />
          <span className="hidden sm:inline">GST</span>
        </button>

        {/* Export Selected to Excel */}
        <button
          type="button"
          id="bulk-btn-export-excel"
          data-testid="bulk-btn-export-excel"
          onClick={onExportSelected}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          title="Download an Excel sheet of selected products"
        >
          <DownloadSimple size={15} weight="bold" />
          <span className="hidden md:inline">Export ({selectedCount})</span>
        </button>

        {/* Bulk Delete */}
        <button
          type="button"
          id="bulk-btn-delete"
          data-testid="bulk-btn-delete"
          onClick={onOpenDeleteModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/25 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 rounded-lg text-xs font-semibold transition-colors"
          title="Delete selected formulations"
        >
          <Trash size={15} weight="bold" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
  );
};
