import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Plus,
  MagnifyingGlass,
  Funnel,
  Pill,
  CheckCircle,
  Warning,
  XCircle,
  ArrowsDownUp,
  X,
  CurrencyInr,
  Percent
} from '@phosphor-icons/react';

export const ProductManagement: React.FC = () => {
  const { products, addProduct, updateProduct } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdGeneric, setNewProdGeneric] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<Product['category']>('Antibiotics');
  const [newProdForm, setNewProdForm] = useState<Product['form']>('Tablet');
  const [newProdStrength, setNewProdStrength] = useState('');
  const [newProdMrp, setNewProdMrp] = useState<number>(200);
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState<number>(120);
  const [newProdSellingRate, setNewProdSellingRate] = useState<number>(150);
  const [newProdStock, setNewProdStock] = useState<number>(1000);
  const [newProdBatch, setNewProdBatch] = useState('BT-2026-09');
  const [newProdExpiry, setNewProdExpiry] = useState('12/2028');
  const [newProdIndication, setNewProdIndication] = useState('');

  const categories = ['All', 'Antibiotics', 'Cardiology', 'Gastroenterology', 'Respiratory', 'Diabetology'];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      searchTerm.trim() === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.batchNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    addProduct({
      name: newProdName,
      genericName: newProdGeneric || newProdName,
      category: newProdCategory,
      form: newProdForm,
      strength: newProdStrength || 'Standard',
      mrp: Number(newProdMrp),
      purchasePrice: Number(newProdPurchasePrice),
      sellingRate: Number(newProdSellingRate),
      stockUnits: Number(newProdStock),
      batchNo: newProdBatch,
      expiryDate: newProdExpiry,
      minOrderQty: 10,
      status: Number(newProdStock) === 0 ? 'out_of_stock' : Number(newProdStock) < 500 ? 'low_stock' : 'active',
      indication: newProdIndication || 'Clinical indication specified on package insert'
    });

    // Reset and close
    setNewProdName('');
    setNewProdGeneric('');
    setNewProdIndication('');
    setIsAddModalOpen(false);
  };

  // Calculate live profit margin for the form
  const calculatedCompanyMargin = newProdSellingRate > 0
    ? (((newProdSellingRate - newProdPurchasePrice) / newProdSellingRate) * 100).toFixed(1)
    : '0';

  const calculatedPharmacyMargin = newProdMrp > 0
    ? (((newProdMrp - newProdSellingRate) / newProdMrp) * 100).toFixed(1)
    : '0';

  return (
    <div
      id="product-management-page"
      data-testid="product-management-page"
      className="p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-blue-600 block mb-1">
            Formulary & Rate Cards
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 font-heading">
            Pharmaceutical Product Catalog
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Manage formulations, role-based rep selling rates, wholesale margins, and warehouse inventory.
          </p>
        </div>

        <button
          id="add-product-btn"
          data-testid="add-product-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus size={18} weight="bold" />
          <span>Add Formulation</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            data-testid="product-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search brand, salt name, or batch..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              data-testid={`category-filter-${cat.toLowerCase()}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table - Shadcn / Clinical Clean Design */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table
            id="products-table"
            data-testid="products-table"
            className="w-full text-left text-sm border-collapse"
          >
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                <th className="py-3.5 px-5">Product & Generic Formulation</th>
                <th className="py-3.5 px-4">Category / Form</th>
                <th className="py-3.5 px-4 text-right">MRP (Retail)</th>
                <th className="py-3.5 px-4 text-right">Company Cost</th>
                <th className="py-3.5 px-4 text-right">Rep Selling Rate</th>
                <th className="py-3.5 px-4 text-center">Net Margin</th>
                <th className="py-3.5 px-4 text-right">Stock (Units)</th>
                <th className="py-3.5 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredProducts.map((p) => {
                const marginPct = (((p.sellingRate - p.purchasePrice) / p.sellingRate) * 100).toFixed(1);
                return (
                  <tr
                    key={p.id}
                    id={`product-row-${p.id}`}
                    data-testid={`product-row-${p.id}`}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Name & Generic */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-900 font-heading text-base">
                        {p.name}
                      </div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5 line-clamp-1 max-w-sm">
                        {p.genericName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        Batch: {p.batchNo} &bull; Exp: {p.expiryDate}
                      </div>
                    </td>

                    {/* Category & Form */}
                    <td className="py-4 px-4">
                      <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                        {p.category}
                      </span>
                      <div className="text-xs text-slate-500 mt-1 font-medium">
                        {p.form} ({p.strength})
                      </div>
                    </td>

                    {/* MRP */}
                    <td className="py-4 px-4 text-right tabular-nums text-slate-700 font-medium">
                      ₹{p.mrp.toFixed(2)}
                    </td>

                    {/* Purchase Price */}
                    <td className="py-4 px-4 text-right tabular-nums text-slate-500">
                      ₹{p.purchasePrice.toFixed(2)}
                    </td>

                    {/* Selling Rate */}
                    <td className="py-4 px-4 text-right tabular-nums text-blue-700 font-bold text-base">
                      ₹{p.sellingRate.toFixed(2)}
                    </td>

                    {/* Net Margin */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tabular-nums bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {marginPct}%
                      </span>
                    </td>

                    {/* Stock Units */}
                    <td className="py-4 px-4 text-right tabular-nums font-semibold text-slate-800">
                      {p.stockUnits.toLocaleString('en-IN')}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'low_stock'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {p.status === 'active' && <CheckCircle size={13} weight="fill" />}
                        {p.status === 'low_stock' && <Warning size={13} weight="fill" />}
                        {p.status === 'out_of_stock' && <XCircle size={13} weight="fill" />}
                        {p.status === 'active' ? 'In Stock' : p.status === 'low_stock' ? 'Low Stock' : 'Stockout'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div
          id="add-product-modal-backdrop"
          data-testid="add-product-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-heading">
                  Register New Formulation
                </h3>
                <p className="text-xs text-slate-500">
                  Add product to field reps' rate cards and assign wholesale margins.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="input-product-name"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. CiproNova 500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Category *
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Diabetology">Diabetology</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Active Pharmaceutical Salt / Generic Formulation
                </label>
                <input
                  type="text"
                  data-testid="input-product-generic"
                  value={newProdGeneric}
                  onChange={(e) => setNewProdGeneric(e.target.value)}
                  placeholder="e.g. Ciprofloxacin Hydrochloride 500mg"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={newProdForm}
                    onChange={(e) => setNewProdForm(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Strength / Packaging
                  </label>
                  <input
                    type="text"
                    value={newProdStrength}
                    onChange={(e) => setNewProdStrength(e.target.value)}
                    placeholder="e.g. 500mg (Strip of 10)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing & Margin Calculator Matrix */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
                  Pricing Matrix (INR / ₹)
                </span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      MRP (Retail)
                    </label>
                    <input
                      type="number"
                      data-testid="input-product-mrp"
                      value={newProdMrp}
                      onChange={(e) => setNewProdMrp(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Purchase Cost
                    </label>
                    <input
                      type="number"
                      data-testid="input-product-cost"
                      value={newProdPurchasePrice}
                      onChange={(e) => setNewProdPurchasePrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-blue-700 mb-1">
                      Rep Selling Rate
                    </label>
                    <input
                      type="number"
                      data-testid="input-product-selling-rate"
                      value={newProdSellingRate}
                      onChange={(e) => setNewProdSellingRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm font-bold tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-600">
                    Company Profit Margin: <strong className="text-emerald-700 tabular-nums">{calculatedCompanyMargin}%</strong>
                  </span>
                  <span className="text-slate-600">
                    Retailer Margin: <strong className="text-blue-700 tabular-nums">{calculatedPharmacyMargin}%</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Initial Stock (Units)
                  </label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={newProdBatch}
                    onChange={(e) => setNewProdBatch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={newProdExpiry}
                    onChange={(e) => setNewProdExpiry(e.target.value)}
                    placeholder="MM/YYYY"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Primary Clinical Indication
                </label>
                <input
                  type="text"
                  value={newProdIndication}
                  onChange={(e) => setNewProdIndication(e.target.value)}
                  placeholder="e.g. Acute bacterial infections, otitis media, urinary tract infections"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-new-product-btn"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
                >
                  Save Formulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
