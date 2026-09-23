import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CATALOG_COLUMNS, ProductCatalogColumnKey } from '../../types';
import {
  MagnifyingGlass,
  Pill,
  CheckCircle,
  Warning,
  Tag,
  Sparkle,
  EyeSlash,
  User,
  Table,
  SquaresFour,
  Buildings,
  ShieldCheck,
  Percent
} from '@phosphor-icons/react';

export const RepCatalog: React.FC = () => {
  const {
    products,
    currentRep,
    setCurrentRep,
    reps,
    isColumnVisibleForRep,
    getRepHiddenColumns
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Rep specific hidden columns
  const hiddenColumns = useMemo(() => {
    return getRepHiddenColumns(currentRep.id);
  }, [getRepHiddenColumns, currentRep.id]);

  const isVisible = (colKey: ProductCatalogColumnKey) => {
    return isColumnVisibleForRep(currentRep.id, colKey);
  };

  // Visible columns for table view
  const visibleTableColumns = useMemo(() => {
    return CATALOG_COLUMNS.filter((col) => isVisible(col.key));
  }, [isVisible]);

  const categories = useMemo(() => {
    const list = ['All'];
    const set = new Set<string>();
    products.forEach((p) => {
      if (!p.hiddenFromRep && p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });

    if (set.size > 0) {
      Array.from(set).sort().forEach((cat) => list.push(cat));
    } else {
      ['Antibiotics', 'Cardiology', 'Gastroenterology', 'Respiratory', 'Diabetology'].forEach((cat) => list.push(cat));
    }
    return list;
  }, [products]);

  const filtered = products.filter((p) => {
    // Strictly hide products flagged as hiddenFromRep by admin
    if (p.hiddenFromRep) return false;

    const matchesCat =
      categoryFilter === 'All' ||
      (p.category && p.category.toLowerCase().trim() === categoryFilter.toLowerCase().trim());
    const matchesSearch =
      searchTerm.trim() === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.company && p.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div
      id="rep-catalog-page"
      data-testid="rep-catalog-page"
      className="space-y-4 pb-24 max-w-5xl mx-auto"
    >
      {/* Active Rep Account & Policy Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={currentRep.avatarUrl}
              alt={currentRep.name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl border border-white/20 object-cover shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base font-heading text-white">
                  {currentRep.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  {currentRep.employeeCode}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Active Rep
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Territory: <strong className="text-white">{currentRep.district}</strong> • Target: ₹{(currentRep.monthlyTarget / 100000).toFixed(1)}L
              </p>
            </div>
          </div>

          {/* Quick Rep Switcher for Testing Different Accounts */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-300 hidden md:inline">Viewing As:</span>
            <select
              id="rep-account-switcher"
              data-testid="rep-account-switcher"
              value={currentRep.id}
              onChange={(e) => {
                const found = reps.find((r) => r.id === e.target.value);
                if (found) setCurrentRep(found);
              }}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none cursor-pointer backdrop-blur-xs"
            >
              {reps.map((r) => {
                const rHiddenCount = getRepHiddenColumns(r.id).length;
                return (
                  <option key={r.id} value={r.id} className="text-slate-900 font-medium">
                    {r.name} ({r.district}) {rHiddenCount > 0 ? `• ${rHiddenCount} cols hidden` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Hidden Columns Policy Notice */}
        {hiddenColumns.length > 0 ? (
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <EyeSlash size={16} weight="bold" className="shrink-0" />
              <span>
                <strong>Account Privacy Active:</strong> {hiddenColumns.length} catalog {hiddenColumns.length === 1 ? 'column is' : 'columns are'} restricted from {currentRep.name}'s account.
              </span>
            </div>
            <span className="text-[11px] text-slate-300 bg-white/10 px-2.5 py-1 rounded-md">
              Visible Columns: {12 - hiddenColumns.length} / 12
            </span>
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-[11px] text-emerald-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={15} weight="bold" />
              <span>Full catalogue access enabled for {currentRep.name} (all 12 commercial columns visible).</span>
            </span>
          </div>
        )}
      </div>

      {/* Filter and View Mode Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-blue-600 block">
              RATE CARDS & FORMULARY
            </span>
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Field Product Catalog
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified physician MRP, stockist & retailer rates, and clinic trade margins.
            </p>
          </div>

          {/* View Switcher */}
          <div className="flex items-center self-start sm:self-auto bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SquaresFour size={15} weight="bold" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table size={15} weight="bold" />
              <span>Table View ({visibleTableColumns.length} cols)</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            data-testid="rep-catalog-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search formulation, generic composition, category or company..."
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

      {/* VIEW MODE: TABLE */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">#</th>
                  {visibleTableColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`py-3 px-3 whitespace-nowrap ${
                        ['mrp', 'pricingToStockist', 'pricingToRetailer', 'sellingRate', 'purchasePrice'].includes(
                          col.key
                        )
                          ? 'text-right'
                          : col.key === 'gst'
                          ? 'text-center'
                          : ''
                      } ${
                        ['pricingToStockist', 'pricingToRetailer'].includes(col.key)
                          ? 'text-indigo-700 bg-indigo-50/40'
                          : ''
                      }`}
                    >
                      {col.order}. {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((prod, idx) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    {visibleTableColumns.map((col) => {
                      switch (col.key) {
                        case 'name':
                          return (
                            <td key={col.key} className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                              {prod.name}
                            </td>
                          );
                        case 'genericName':
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={prod.genericName}>
                              {prod.genericName}
                            </td>
                          );
                        case 'packaging':
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                              {prod.packaging}
                            </td>
                          );
                        case 'form':
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                              {prod.form}
                            </td>
                          );
                        case 'mrp':
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-right font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                              ₹{Number(prod.mrp).toFixed(2)}
                            </td>
                          );
                        case 'pricingToStockist': {
                          const pts = prod.pricingToStockist ?? (prod.sellingRate ? Math.round(prod.sellingRate * 0.88 * 100) / 100 : 0);
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-right font-semibold text-indigo-700 bg-indigo-50/20 tabular-nums whitespace-nowrap">
                              ₹{Number(pts).toFixed(2)}
                            </td>
                          );
                        }
                        case 'pricingToRetailer': {
                          const ptr = prod.pricingToRetailer ?? (prod.sellingRate ? Math.round(prod.sellingRate * 0.94 * 100) / 100 : 0);
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-right font-semibold text-indigo-700 bg-indigo-50/20 tabular-nums whitespace-nowrap">
                              ₹{Number(ptr).toFixed(2)}
                            </td>
                          );
                        }
                        case 'sellingRate':
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-right font-bold text-blue-700 tabular-nums whitespace-nowrap">
                              ₹{Number(prod.sellingRate).toFixed(2)}
                            </td>
                          );
                        case 'purchasePrice':
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-right text-slate-500 tabular-nums whitespace-nowrap">
                              ₹{Number(prod.purchasePrice).toFixed(2)}
                            </td>
                          );
                        case 'gst':
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-center text-slate-700 font-medium whitespace-nowrap">
                              {prod.gst || '12%'}
                            </td>
                          );
                        case 'company':
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-slate-800 font-medium whitespace-nowrap">
                              {prod.company || 'DDB DRUG CHEM'}
                            </td>
                          );
                        case 'category':
                          return (
                            <td key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                {prod.category || 'General'}
                              </span>
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE: CARDS */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {filtered.map((prod) => {
            const retailerMargin = (((prod.mrp - prod.sellingRate) / prod.mrp) * 100).toFixed(1);
            const pts = prod.pricingToStockist ?? (prod.sellingRate ? Math.round(prod.sellingRate * 0.88 * 100) / 100 : 0);
            const ptr = prod.pricingToRetailer ?? (prod.sellingRate ? Math.round(prod.sellingRate * 0.94 * 100) / 100 : 0);

            // Compute active pricing pills based on rep visibility
            const showMrp = isVisible('mrp');
            const showPts = isVisible('pricingToStockist');
            const showPtr = isVisible('pricingToRetailer');
            const showSellingRate = isVisible('sellingRate');
            const showPurchasePrice = isVisible('purchasePrice');
            const showGst = isVisible('gst');
            const showPackaging = isVisible('packaging');
            const showForm = isVisible('form');
            const showCompany = isVisible('company');
            const showCategory = isVisible('category');
            const showGeneric = isVisible('genericName');

            return (
              <div
                key={prod.id}
                id={`rep-prod-${prod.id}`}
                data-testid={`rep-prod-${prod.id}`}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base font-heading">
                        {prod.name}
                      </h3>

                      {showCategory && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {prod.category}
                        </span>
                      )}

                      {showPackaging && prod.packaging && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          {prod.packaging}
                        </span>
                      )}

                      {showForm && prod.form && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {prod.form}
                        </span>
                      )}

                      {showCompany && prod.company && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {prod.company}
                        </span>
                      )}
                    </div>

                    {showGeneric && (
                      <p className="text-xs text-slate-600 mt-1">
                        {prod.genericName}
                      </p>
                    )}
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
                {prod.indication && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <strong className="text-slate-700 font-medium">Indication:</strong> {prod.indication}
                  </p>
                )}

                {/* Commercial Pricing Grid - Dynamically Filters Out Columns Hidden for this Rep */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-center">
                  {showMrp && (
                    <div className="bg-white p-2 rounded-lg border border-slate-150">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        5. MRP (Retail)
                      </span>
                      <span className="text-sm font-semibold text-slate-800 tabular-nums">
                        ₹{Number(prod.mrp).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {showPts && (
                    <div className="bg-indigo-50/60 p-2 rounded-lg border border-indigo-150">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                        6. Pricing to Stockist
                      </span>
                      <span className="text-sm font-bold text-indigo-900 tabular-nums">
                        ₹{Number(pts).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {showPtr && (
                    <div className="bg-indigo-50/60 p-2 rounded-lg border border-indigo-150">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                        7. Pricing to Retailer
                      </span>
                      <span className="text-sm font-bold text-indigo-900 tabular-nums">
                        ₹{Number(ptr).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {showSellingRate && (
                    <div className="bg-blue-50/60 p-2 rounded-lg border border-blue-150">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                        8. Rep Selling Rate
                      </span>
                      <span className="text-sm font-bold text-blue-800 tabular-nums">
                        ₹{Number(prod.sellingRate).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {showPurchasePrice && (
                    <div className="bg-white p-2 rounded-lg border border-slate-150">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        9. Purchase Price
                      </span>
                      <span className="text-sm font-medium text-slate-600 tabular-nums">
                        ₹{Number(prod.purchasePrice).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {showGst && (
                    <div className="bg-white p-2 rounded-lg border border-slate-150">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        10. GST Slab
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {prod.gst || '12%'}
                      </span>
                    </div>
                  )}

                  {showMrp && showSellingRate && (
                    <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-150">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Trade Margin
                      </span>
                      <span className="text-sm font-bold text-emerald-800 tabular-nums">
                        {retailerMargin}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Trade Scheme Info */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-blue-700 font-semibold">
                    <Tag size={12} weight="fill" />
                    Standard Field Promo: 10 + 1 Bonus Scheme
                  </span>
                  <span>Batch: {prod.batchNo}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

