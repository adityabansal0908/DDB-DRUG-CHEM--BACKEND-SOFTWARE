import React, { useState } from 'react';
import { Buildings, X, Check, Sparkle } from '@phosphor-icons/react';

interface BulkCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onApplyCompany: (companyName: string) => void;
}

const COMMON_COMPANIES = [
  'DDB DRUG CHEM',
  'Cipla Ltd',
  'Sun Pharma Ltd',
  'Mankind Pharma Ltd',
  'Torrent Pharmaceuticals',
  'Dr. Reddy’s Laboratories',
  'Lupin Ltd',
  'Alkem Laboratories',
  'Zydus Lifesciences',
  'Abbott Healthcare'
];

export const BulkCompanyModal: React.FC<BulkCompanyModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onApplyCompany
}) => {
  const [companyName, setCompanyName] = useState('DDB DRUG CHEM');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    onApplyCompany(companyName.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
              <Buildings size={20} weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bulk Update Manufacturer / Company</h3>
              <p className="text-xs text-slate-500">
                Updating manufacturing entity for{' '}
                <span className="font-bold text-blue-700">{selectedCount}</span> formulation
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
          {/* Quick Select Buttons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Common Pharmaceutical Manufacturers
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/60">
              {COMMON_COMPANIES.map((comp) => {
                const isSelected = companyName.trim().toLowerCase() === comp.toLowerCase();
                return (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setCompanyName(comp)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isSelected ? <Check size={12} weight="bold" /> : <Buildings size={12} />}
                    <span>{comp}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company Name Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Manufacturing Entity Name *
            </label>
            <input
              type="text"
              id="bulk-company-input"
              data-testid="bulk-company-input"
              placeholder="e.g. DDB DRUG CHEM"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
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
              id="apply-bulk-company-btn"
              data-testid="apply-bulk-company-btn"
              disabled={!companyName.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
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
