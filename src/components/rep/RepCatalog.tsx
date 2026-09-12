import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MagnifyingGlass,
  Pill,
  CheckCircle,
  Warning,
  Tag,
  Sparkle
} from '@phosphor-icons/react';

export const RepCatalog: React.FC = () => {
  const { products } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', 'Antibiotics', 'Cardiology', 'Gastroenterology', 'Respiratory', 'Diabetology'];

  const filtered = products.filter(p => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.genericName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div
      id="rep-catalog-page"
      data-testid="rep-catalog-page"
      className="space-y-4 pb-24 max-w-xl mx-auto"
    >
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div>
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-blue-600 block">
            Rate Cards & Indications
          </span>
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            Field Formulary
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified physician MRP, rep booking rate, and clinic trade schemes.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            data-testid="rep-catalog-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search formulation or salt..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards List (Full-width flat cards with 1px borders) */}
      <div className="space-y-3">
        {filtered.map((prod) => {
          const retailerMargin = (((prod.mrp - prod.sellingRate) / prod.mrp) * 100).toFixed(1);

          return (
            <div
              key={prod.id}
              id={`rep-prod-${prod.id}`}
              data-testid={`rep-prod-${prod.id}`}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base font-heading">
                      {prod.name}
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {prod.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {prod.genericName}
                  </p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                    prod.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : prod.status === 'low_stock'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {prod.status === 'active' ? 'In Stock' : prod.status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                </span>
              </div>

              {/* Indication */}
              <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <strong className="text-slate-700 font-medium">Indication:</strong> {prod.indication}
              </p>

              {/* Pricing Matrix */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    MRP (Retail)
                  </span>
                  <span className="text-xs font-semibold text-slate-700 tabular-nums">
                    ₹{prod.mrp.toFixed(2)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                    Rep Selling Rate
                  </span>
                  <span className="text-sm font-bold text-blue-800 tabular-nums">
                    ₹{prod.sellingRate.toFixed(2)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Trade Margin
                  </span>
                  <span className="text-xs font-bold text-emerald-700 tabular-nums">
                    {retailerMargin}%
                  </span>
                </div>
              </div>

              {/* Trade Scheme Info */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1 text-blue-700 font-semibold">
                  <Tag size={12} weight="fill" />
                  Promo Scheme: 10 + 1 Free Deal
                </span>
                <span>Batch: {prod.batchNo}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
