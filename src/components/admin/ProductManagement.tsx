import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ExcelImportModal } from './ExcelImportModal';
import { RepColumnPermissionsModal } from './RepColumnPermissionsModal';
import { BulkCategoryModal } from './BulkCategoryModal';
import { BulkCompanyModal } from './BulkCompanyModal';
import { BulkDeleteModal } from './BulkDeleteModal';
import { BulkGstModal } from './BulkGstModal';
import { BulkActionBar } from './BulkActionBar';
import { downloadExcelTemplate, exportProductsToExcel } from '../../utils/excelHelper';
import {
  Plus,
  MagnifyingGlass,
  Pill,
  CheckCircle,
  Warning,
  XCircle,
  X,
  FileXls,
  DownloadSimple,
  Trash,
  PencilSimple,
  Eye,
  EyeSlash,
  Buildings,
  Tag,
  CalendarBlank,
  Package,
  Sparkle,
  ArrowCounterClockwise,
  ArrowClockwise,
  ClockCounterClockwise,
  SlidersHorizontal,
  ShieldCheck,
  CheckSquareOffset
} from '@phosphor-icons/react';

export const ProductManagement: React.FC = () => {
  const {
    products,
    addProduct,
    addMultipleProducts,
    updateProduct,
    deleteProduct,
    bulkUpdateProducts,
    bulkDeleteProducts,
    clearAllProducts,
    canUndo,
    canRedo,
    undoProductAction,
    redoProductAction,
    setActiveAdminTab,
    reps,
    repColumnPermissions
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Bulk operations and selection state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [isBulkCompanyModalOpen, setIsBulkCompanyModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkGstModalOpen, setIsBulkGstModalOpen] = useState(false);
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // New product form state matching the 12 columns
  const [newProdName, setNewProdName] = useState('');
  const [newProdGeneric, setNewProdGeneric] = useState('');
  const [newProdPackaging, setNewProdPackaging] = useState('10x10 Tablets');
  const [newProdForm, setNewProdForm] = useState('Tablet');
  const [newProdMrp, setNewProdMrp] = useState<number>(220);
  const [newProdPricingToStockist, setNewProdPricingToStockist] = useState<number>(145);
  const [newProdPricingToRetailer, setNewProdPricingToRetailer] = useState<number>(155);
  const [newProdSellingRate, setNewProdSellingRate] = useState<number>(165);
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState<number>(130);
  const [newProdGst, setNewProdGst] = useState('12%');
  const [newProdCompany, setNewProdCompany] = useState('DDB DRUG CHEM');
  const [newProdCategory, setNewProdCategory] = useState('Antibiotics');

  // Edit product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGeneric, setEditGeneric] = useState('');
  const [editPackaging, setEditPackaging] = useState('');
  const [editForm, setEditForm] = useState('Tablet');
  const [editMrp, setEditMrp] = useState<number>(0);
  const [editPricingToStockist, setEditPricingToStockist] = useState<number>(0);
  const [editPricingToRetailer, setEditPricingToRetailer] = useState<number>(0);
  const [editSellingRate, setEditSellingRate] = useState<number>(0);
  const [editPurchasePrice, setEditPurchasePrice] = useState<number>(0);
  const [editGst, setEditGst] = useState('12%');
  const [editCompany, setEditCompany] = useState('');
  const [editCategory, setEditCategory] = useState('Antibiotics');
  const [editHiddenFromRep, setEditHiddenFromRep] = useState(false);

  // Dynamic list of all distinct specialities from current catalogue + standard medical specialties
  const allSpecialities = useMemo(() => {
    const defaultList = [
      'Antibiotics',
      'Cardiology',
      'Gastroenterology',
      'Respiratory',
      'Diabetology',
      'Analgesics',
      'Orthopedics',
      'Dermatology',
      'Neurology',
      'Pediatrics',
      'Ophthalmology',
      'Gynecology'
    ];
    const uniqueSet = new Set<string>();
    // Collect from actual products first
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        uniqueSet.add(p.category.trim());
      }
    });
    // Add default clinical specialties
    defaultList.forEach((s) => uniqueSet.add(s));
    return Array.from(uniqueSet);
  }, [products]);

  // Categories displayed as filter pills next to search bar (All + all specialities in catalogue or defaults)
  const categories = useMemo(() => {
    const list = ['All'];
    const inCatalogue = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        inCatalogue.add(p.category.trim());
      }
    });

    if (inCatalogue.size > 0) {
      // Add all active categories from current products sorted
      Array.from(inCatalogue)
        .sort((a, b) => a.localeCompare(b))
        .forEach((c) => list.push(c));

      // Append standard defaults if not already present
      ['Antibiotics', 'Cardiology', 'Gastroenterology', 'Respiratory', 'Diabetology'].forEach((staple) => {
        if (!list.includes(staple)) list.push(staple);
      });
    } else {
      ['Antibiotics', 'Cardiology', 'Gastroenterology', 'Respiratory', 'Diabetology'].forEach((staple) => {
        list.push(staple);
      });
    }
    return list;
  }, [products]);

  // Count products for category pill badges
  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return products.length;
    return products.filter((p) => (p.category || '').toLowerCase().trim() === cat.toLowerCase().trim()).length;
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === 'All' ||
        (p.category && p.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim());
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term === '' ||
        p.name.toLowerCase().includes(term) ||
        p.genericName.toLowerCase().includes(term) ||
        (p.company && p.company.toLowerCase().includes(term)) ||
        (p.packaging && p.packaging.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term));
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Derived selection state for the current filtered view
  const filteredProductIds = useMemo(() => filteredProducts.map((p) => p.id), [filteredProducts]);

  const selectedFilteredCount = useMemo(() => {
    return filteredProductIds.filter((id) => selectedProductIds.includes(id)).length;
  }, [filteredProductIds, selectedProductIds]);

  const isAllFilteredSelected =
    filteredProductIds.length > 0 && selectedFilteredCount === filteredProductIds.length;
  const isSomeFilteredSelected = selectedFilteredCount > 0 && !isAllFilteredSelected;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isSomeFilteredSelected;
    }
  }, [isSomeFilteredSelected]);

  const handleToggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !filteredProductIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...filteredProductIds])));
    }
  };

  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Bulk action handlers
  const handleBulkSetVisibility = (hidden: boolean) => {
    if (selectedProductIds.length === 0) return;
    const actionDesc = hidden
      ? `Hid ${selectedProductIds.length} formulation(s) from Sales Reps`
      : `Made ${selectedProductIds.length} formulation(s) visible to Sales Reps`;
    bulkUpdateProducts(selectedProductIds, { hiddenFromRep: hidden }, actionDesc);
  };

  const handleBulkApplyCategory = (newCategory: string) => {
    if (selectedProductIds.length === 0) return;
    bulkUpdateProducts(
      selectedProductIds,
      { category: newCategory },
      `Categorized ${selectedProductIds.length} formulation(s) as "${newCategory}"`
    );
  };

  const handleBulkApplyCompany = (newCompany: string) => {
    if (selectedProductIds.length === 0) return;
    bulkUpdateProducts(
      selectedProductIds,
      { company: newCompany },
      `Set company to "${newCompany}" for ${selectedProductIds.length} formulation(s)`
    );
  };

  const handleBulkApplyGst = (newGst: string) => {
    if (selectedProductIds.length === 0) return;
    bulkUpdateProducts(
      selectedProductIds,
      { gst: newGst },
      `Updated GST rate to ${newGst} for ${selectedProductIds.length} formulation(s)`
    );
  };

  const handleBulkConfirmDelete = () => {
    if (selectedProductIds.length === 0) return;
    bulkDeleteProducts(selectedProductIds);
    setSelectedProductIds([]);
  };

  const handleExportSelected = () => {
    const prodsToExport = products.filter((p) => selectedProductIds.includes(p.id));
    if (prodsToExport.length === 0) return;
    exportProductsToExcel(prodsToExport, `DDB_DRUG_CHEM_${prodsToExport.length}_Selected_Products.xlsx`);
  };

  const selectedProductsList = useMemo(() => {
    return products.filter((p) => selectedProductIds.includes(p.id));
  }, [products, selectedProductIds]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    addProduct({
      name: newProdName.trim(),
      genericName: newProdGeneric.trim() || newProdName.trim(),
      packaging: newProdPackaging.trim() || '10x10 Tablets',
      form: newProdForm,
      mrp: Number(newProdMrp) || 0,
      pricingToStockist: Number(newProdPricingToStockist) || 0,
      pricingToRetailer: Number(newProdPricingToRetailer) || 0,
      sellingRate: Number(newProdSellingRate) || 0,
      purchasePrice: Number(newProdPurchasePrice) || 0,
      gst: newProdGst || '12%',
      company: newProdCompany.trim() || 'DDB DRUG CHEM',
      stockUnits: 1000,
      batchNo: 'STD-BATCH',
      expiryDate: '12/2028',
      batches: [],
      category: newProdCategory.trim() || 'Antibiotics',
      minOrderQty: 10,
      status: 'active',
      indication: 'Clinical prescription formulation'
    });

    // Reset and close
    setNewProdName('');
    setNewProdGeneric('');
    setNewProdPackaging('10x10 Tablets');
    setNewProdCompany('DDB DRUG CHEM');
    setNewProdCategory('Antibiotics');
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditGeneric(p.genericName);
    setEditPackaging(p.packaging || '10x10 Tablets');
    setEditForm(p.form || 'Tablet');
    setEditMrp(p.mrp);
    setEditPricingToStockist(
      p.pricingToStockist ?? (p.sellingRate ? Math.round(p.sellingRate * 0.88 * 100) / 100 : 0)
    );
    setEditPricingToRetailer(
      p.pricingToRetailer ?? (p.sellingRate ? Math.round(p.sellingRate * 0.94 * 100) / 100 : 0)
    );
    setEditSellingRate(p.sellingRate);
    setEditPurchasePrice(p.purchasePrice);
    setEditGst(p.gst || '12%');
    setEditCompany(p.company || 'DDB DRUG CHEM');
    setEditCategory(p.category || 'Antibiotics');
    setEditHiddenFromRep(!!p.hiddenFromRep);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editName.trim()) return;

    updateProduct({
      ...editingProduct,
      name: editName.trim(),
      genericName: editGeneric.trim() || editName.trim(),
      packaging: editPackaging.trim() || '10x10 Tablets',
      form: editForm,
      mrp: Number(editMrp) || 0,
      pricingToStockist: Number(editPricingToStockist) || 0,
      pricingToRetailer: Number(editPricingToRetailer) || 0,
      sellingRate: Number(editSellingRate) || 0,
      purchasePrice: Number(editPurchasePrice) || 0,
      gst: editGst || '12%',
      company: editCompany.trim() || 'DDB DRUG CHEM',
      category: editCategory.trim() || 'General',
      hiddenFromRep: editHiddenFromRep
    });

    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleToggleHide = (product: Product) => {
    updateProduct({
      ...product,
      hiddenFromRep: !product.hiddenFromRep
    });
  };

  // Seed sample products matching 12 columns
  const handleLoadSampleCatalogue = () => {
    const samples: Omit<Product, 'id'>[] = [
      {
        name: 'TelmiKard 40-H',
        genericName: 'Telmisartan 40mg + Hydrochlorothiazide 12.5mg',
        packaging: '10x10 Tablets',
        form: 'Tablet',
        mrp: 210.0,
        pricingToStockist: 138.0,
        pricingToRetailer: 148.0,
        sellingRate: 158.0,
        purchasePrice: 125.0,
        gst: '12%',
        company: 'Torrent Pharmaceuticals',
        stockUnits: 2300,
        batchNo: 'TKH-2026-01, TKH-2026-02',
        expiryDate: '11/2027',
        batches: [
          { batchNumber: 'TKH-2026-01', expiryDate: '11/2027', stock: 1500 },
          { batchNumber: 'TKH-2026-02', expiryDate: '04/2028', stock: 800 }
        ],
        category: 'Cardiology',
        minOrderQty: 10,
        status: 'active',
        indication: 'Essential hypertension in patients not adequately controlled on monotherapy'
      },
      {
        name: 'AmoxyClav 625 Duo',
        genericName: 'Amoxicillin 500mg + Potassium Clavulanate 125mg',
        packaging: '1x10 Strip',
        form: 'Tablet',
        mrp: 228.5,
        pricingToStockist: 152.0,
        pricingToRetailer: 162.0,
        sellingRate: 172.0,
        purchasePrice: 138.0,
        gst: '12%',
        company: 'Alkem Laboratories',
        stockUnits: 2400,
        batchNo: 'ACD-8820',
        expiryDate: '09/2027',
        batches: [{ batchNumber: 'ACD-8820', expiryDate: '09/2027', stock: 2400 }],
        category: 'Antibiotics',
        minOrderQty: 10,
        status: 'active',
        indication: 'Upper and lower respiratory tract infections, ENT infections'
      },
      {
        name: 'Pantocid DSR',
        genericName: 'Pantoprazole 40mg + Domperidone 30mg SR',
        packaging: '10x10 Capsules',
        form: 'Capsule',
        mrp: 195.0,
        pricingToStockist: 128.0,
        pricingToRetailer: 136.0,
        sellingRate: 145.0,
        purchasePrice: 115.0,
        gst: '12%',
        company: 'Sun Pharma Ltd',
        stockUnits: 1800,
        batchNo: 'PDS-4011',
        expiryDate: '01/2028',
        batches: [{ batchNumber: 'PDS-4011', expiryDate: '01/2028', stock: 1800 }],
        category: 'Gastroenterology',
        minOrderQty: 10,
        status: 'active',
        indication: 'Gastroesophageal reflux disease (GERD) and refractory hyperacidity'
      },
      {
        name: 'Montair-LC',
        genericName: 'Montelukast 10mg + Levocetirizine 5mg',
        packaging: '10x10 Tablets',
        form: 'Tablet',
        mrp: 185.0,
        pricingToStockist: 120.0,
        pricingToRetailer: 129.0,
        sellingRate: 138.0,
        purchasePrice: 108.0,
        gst: '12%',
        company: 'Cipla Ltd',
        stockUnits: 1200,
        batchNo: 'MLC-1090',
        expiryDate: '10/2027',
        batches: [{ batchNumber: 'MLC-1090', expiryDate: '10/2027', stock: 1200 }],
        category: 'Respiratory',
        minOrderQty: 10,
        status: 'active',
        indication: 'Allergic rhinitis and concurrent mild to moderate asthma'
      },
      {
        name: 'GlimiKard-M2',
        genericName: 'Glimepiride 2mg + Metformin 500mg SR',
        packaging: '10x15 Tablets',
        form: 'Tablet',
        mrp: 175.0,
        pricingToStockist: 112.0,
        pricingToRetailer: 120.0,
        sellingRate: 128.0,
        purchasePrice: 98.0,
        gst: '12%',
        company: 'Mankind Pharma Ltd',
        stockUnits: 1650,
        batchNo: 'GKM-3301, GKM-3302',
        expiryDate: '08/2027',
        batches: [
          { batchNumber: 'GKM-3301', expiryDate: '08/2027', stock: 1000 },
          { batchNumber: 'GKM-3302', expiryDate: '03/2028', stock: 650 }
        ],
        category: 'Diabetology',
        minOrderQty: 15,
        status: 'active',
        indication: 'Type 2 Diabetes Mellitus glycemic control'
      }
    ];

    addMultipleProducts(samples, 'append');
  };

  return (
    <div
      id="product-management-page"
      data-testid="product-management-page"
      className="p-3 sm:p-6 md:p-8 lg:p-10 max-w-[1700px] mx-auto space-y-4 sm:space-y-6"
    >
      {/* Top Header - Kept EXACTLY as shown in user image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-blue-600 block mb-1">
            FORMULARY & RATE CARDS
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 font-heading">
            Pharmaceutical Product Catalog
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Manage formulations, role-based rep selling rates, wholesale margins, and warehouse inventory.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Undo Button - Rectifies any mistake made in product catalog */}
          <button
            id="product-undo-btn"
            data-testid="product-undo-btn"
            onClick={undoProductAction}
            disabled={!canUndo}
            title={canUndo ? 'Undo last change made in product catalog' : 'No changes to undo'}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
              canUndo
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs cursor-pointer active:scale-95'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
            }`}
          >
            <ArrowCounterClockwise size={16} weight="bold" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Redo Button */}
          {canRedo && (
            <button
              id="product-redo-btn"
              data-testid="product-redo-btn"
              onClick={redoProductAction}
              title="Redo previous change"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all active:scale-95"
            >
              <ArrowClockwise size={16} weight="bold" />
              <span className="hidden sm:inline">Redo</span>
            </button>
          )}

          {/* Change History Button - Navigates directly to History field in operations console */}
          <button
            id="product-history-shortcut-btn"
            data-testid="product-history-shortcut-btn"
            onClick={() => setActiveAdminTab('history')}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-colors"
            title="View who changed what last time in Operations Console Change History"
          >
            <ClockCounterClockwise size={16} weight="bold" />
            <span className="hidden md:inline">Change History</span>
          </button>

          {/* Rep Column Visibility Button */}
          <button
            id="rep-column-permissions-btn"
            data-testid="rep-column-permissions-btn"
            onClick={() => setIsPermissionsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-sm font-semibold shadow-xs transition-colors"
            title="Configure which columns are hidden for specific sales rep accounts"
          >
            <SlidersHorizontal size={18} weight="bold" className="text-indigo-600" />
            <span>Rep Column Access</span>
            {(Object.values(repColumnPermissions) as string[][]).some((cols) => cols.length > 0) && (
              <span
                title="Active column hiding policies in effect for reps"
                className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white"
              >
                {(Object.values(repColumnPermissions) as string[][]).filter((cols) => cols.length > 0).length}
              </span>
            )}
          </button>

          {/* Download Template Button */}
          <button
            onClick={downloadExcelTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-colors"
            title="Download formatted Excel spreadsheet template with 8 columns"
          >
            <DownloadSimple size={16} weight="bold" />
            <span>Excel Template</span>
          </button>

          {/* Import Excel Button */}
          <button
            id="import-excel-btn"
            data-testid="import-excel-btn"
            onClick={() => setIsExcelModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            title="Import products from .xlsx, .xls, or .csv"
          >
            <FileXls size={18} weight="fill" />
            <span>Import Excel</span>
          </button>

          {/* Add Formulation Button - Matching image exactly */}
          <button
            id="add-product-btn"
            data-testid="add-product-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus size={18} weight="bold" />
            <span>Add Formulation</span>
          </button>

          {products.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all products from the catalog?')) {
                  clearAllProducts();
                }
              }}
              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
              title="Clear entire catalog"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search Bar - Specialities next to search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full lg:w-80 shrink-0">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            data-testid="product-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, salt, company, category..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Category / Speciality Pills shown next to search bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-thin">
          <div className="flex items-center gap-1.5 shrink-0">
            {categories.map((cat) => {
              const count = getCategoryCount(cat);
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  data-testid={`category-filter-${cat.toLowerCase()}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all inline-flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bulk Operations Toolbar - Appears when items are selected */}
      {selectedProductIds.length > 0 && (
        <BulkActionBar
          selectedCount={selectedProductIds.length}
          totalFilteredCount={filteredProducts.length}
          onSelectAllFiltered={() => setSelectedProductIds(filteredProductIds)}
          onClearSelection={() => setSelectedProductIds([])}
          onBulkSetVisibility={handleBulkSetVisibility}
          onOpenCategoryModal={() => setIsBulkCategoryModalOpen(true)}
          onOpenCompanyModal={() => setIsBulkCompanyModalOpen(true)}
          onOpenGstModal={() => setIsBulkGstModalOpen(true)}
          onOpenDeleteModal={() => setIsBulkDeleteModalOpen(true)}
          onExportSelected={handleExportSelected}
        />
      )}

      {/* Product Table or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
            <Pill size={32} weight="duotone" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 font-heading">
              {products.length === 0 ? 'Product Catalogue is Ready' : 'No Matching Formulations'}
            </h3>
            <p className="text-sm text-slate-500 max-w-lg mx-auto mt-1">
              {products.length === 0
                ? 'Upload an Excel spreadsheet with the 10 columns (Product Name, Salt Name, Packaging, Dosage Form, MRP, Selling Price, Purchase Price, GST, Company, and Category), or add formulations manually.'
                : 'No formulations found matching your search term or category filter. Try changing your query.'}
            </p>
          </div>

          <div className="flex items-center justify-center flex-wrap gap-3 pt-2">
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            >
              <FileXls size={18} weight="fill" />
              <span>Import via Excel</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            >
              <Plus size={18} weight="bold" />
              <span>Add Formulation Manually</span>
            </button>
            {products.length === 0 && (
              <button
                onClick={handleLoadSampleCatalogue}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition-colors border border-slate-200"
              >
                <Sparkle size={16} className="text-amber-500" weight="fill" />
                <span>Load Sample Product Catalogue</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* The 12-Column Product Catalogue Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table
              id="products-table"
              data-testid="products-table"
              className="w-full text-left text-xs sm:text-sm border-collapse"
            >
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
                  {/* Bulk Select Checkbox */}
                  <th className="py-3.5 px-3.5 w-10 text-center select-none">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        id="select-all-products-checkbox"
                        data-testid="select-all-products-checkbox"
                        ref={masterCheckboxRef}
                        checked={isAllFilteredSelected}
                        onChange={handleToggleSelectAllFiltered}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        title={
                          isAllFilteredSelected
                            ? `Deselect all ${filteredProducts.length} items`
                            : `Select all ${filteredProducts.length} items`
                        }
                      />
                    </div>
                  </th>
                  {/* Column 1 */}
                  <th className="py-3.5 px-4 whitespace-nowrap">1. Product Name</th>
                  {/* Column 2 */}
                  <th className="py-3.5 px-4 min-w-[200px]">2. Salt / Composition</th>
                  {/* Column 3 */}
                  <th className="py-3.5 px-3 whitespace-nowrap">3. Packaging</th>
                  {/* Column 4 */}
                  <th className="py-3.5 px-3 whitespace-nowrap">4. Dosage Form</th>
                  {/* Column 5 */}
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">5. MRP</th>
                  {/* Column 6: Pricing to Stockist (PTS) */}
                  <th className="py-3.5 px-3 text-right whitespace-nowrap text-emerald-800 bg-emerald-50/50 font-bold">
                    6. Pricing to Stockist
                  </th>
                  {/* Column 7: Pricing to Retailer (PTR) */}
                  <th className="py-3.5 px-3 text-right whitespace-nowrap text-teal-800 bg-teal-50/50 font-bold">
                    7. Pricing to Retailer
                  </th>
                  {/* Column 8 */}
                  <th className="py-3.5 px-3 text-right whitespace-nowrap text-blue-700">8. Selling Price</th>
                  {/* Column 9 */}
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">9. Purchase Price</th>
                  {/* Column 10 */}
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">10. GST</th>
                  {/* Column 11 */}
                  <th className="py-3.5 px-3 whitespace-nowrap">11. Company</th>
                  {/* Column 12 */}
                  <th className="py-3.5 px-3 whitespace-nowrap text-blue-900 bg-blue-50/60 font-extrabold">12. Category</th>
                  {/* Actions */}
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs">
                {filteredProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      id={`product-row-${p.id}`}
                      data-testid={`product-row-${p.id}`}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 hover:bg-blue-100/60'
                          : p.hiddenFromRep
                          ? 'bg-amber-50/30 hover:bg-slate-50/70'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="py-3.5 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            id={`checkbox-product-${p.id}`}
                            data-testid={`checkbox-product-${p.id}`}
                            checked={isSelected}
                            onChange={() => handleToggleSelectProduct(p.id)}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            title={`Select ${p.name}`}
                          />
                        </div>
                      </td>

                      {/* 1. Product Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-heading text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          {p.hiddenFromRep && (
                            <span
                              title="Product is hidden from sales rep in the field catalog"
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100/70 border border-amber-200 px-1.5 py-0.5 rounded"
                            >
                              <EyeSlash size={12} weight="bold" />
                              Hidden from Rep
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Salt Name / Composition */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="line-clamp-2" title={p.genericName}>
                          {p.genericName}
                        </span>
                      </td>

                      {/* 3. Packaging */}
                      <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap font-medium">
                        {p.packaging || 'Standard'}
                      </td>

                      {/* 4. Dosage form */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-xs">
                          {p.form}
                        </span>
                      </td>

                      {/* 5. MRP */}
                      <td className="py-3.5 px-3 text-right tabular-nums text-slate-700 font-semibold whitespace-nowrap">
                        ₹{Number(p.mrp).toFixed(2)}
                      </td>

                      {/* 6. Pricing to Stockist */}
                      <td className="py-3.5 px-3 text-right tabular-nums text-emerald-700 font-medium whitespace-nowrap bg-emerald-50/25">
                        ₹{Number(p.pricingToStockist ?? (p.sellingRate ? p.sellingRate * 0.88 : 0)).toFixed(2)}
                      </td>

                      {/* 7. Pricing to Retailer */}
                      <td className="py-3.5 px-3 text-right tabular-nums text-teal-700 font-medium whitespace-nowrap bg-teal-50/25">
                        ₹{Number(p.pricingToRetailer ?? (p.sellingRate ? p.sellingRate * 0.94 : 0)).toFixed(2)}
                      </td>

                      {/* 8. Selling Price */}
                      <td className="py-3.5 px-3 text-right tabular-nums text-blue-700 font-bold whitespace-nowrap">
                        ₹{Number(p.sellingRate).toFixed(2)}
                      </td>

                      {/* 9. Purchase Price */}
                      <td className="py-3.5 px-3 text-right tabular-nums text-slate-500 whitespace-nowrap">
                        ₹{Number(p.purchasePrice).toFixed(2)}
                      </td>

                      {/* 10. GST */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap font-medium text-slate-700">
                        {p.gst || '12%'}
                      </td>

                      {/* 11. Company */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-800">
                        <span className="inline-flex items-center gap-1.5">
                          <Buildings size={14} className="text-slate-400" />
                          <span>{p.company || 'DDB DRUG CHEM'}</span>
                        </span>
                      </td>

                      {/* 12. Category (Open field / speciality) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(p.category || 'All')}
                          title={`Click to filter by ${p.category || 'General'}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                        >
                          <Tag size={12} weight="bold" className="text-blue-500" />
                          <span>{p.category || 'General'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Eye Icon - Toggle Rep Visibility */}
                          <button
                            id={`toggle-hide-${p.id}`}
                            data-testid={`toggle-hide-${p.id}`}
                            onClick={() => handleToggleHide(p)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              p.hiddenFromRep
                                ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title={
                              p.hiddenFromRep
                                ? 'Product is HIDDEN from Sales Rep. Click to show.'
                                : 'Product is VISIBLE to Sales Rep. Click to hide.'
                            }
                          >
                            {p.hiddenFromRep ? (
                              <EyeSlash size={16} weight="bold" />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>

                          {/* Pencil Icon - Edit details manually */}
                          <button
                            id={`edit-product-${p.id}`}
                            data-testid={`edit-product-${p.id}`}
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit product details manually"
                          >
                            <PencilSimple size={16} />
                          </button>

                          {/* Trash Icon - Delete product */}
                          <button
                            id={`delete-product-${p.id}`}
                            data-testid={`delete-product-${p.id}`}
                            onClick={() => deleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete formulation"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer with quick selection stats */}
          <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span>
                Showing <strong className="text-slate-900">{filteredProducts.length}</strong> of{' '}
                <strong className="text-slate-900">{products.length}</strong> formulations
              </span>
              {selectedProductIds.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800 font-bold">
                  <span>{selectedProductIds.length} selected for bulk action</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedProductIds.length > 0 ? (
                <button
                  type="button"
                  id="clear-selection-footer-btn"
                  data-testid="clear-selection-footer-btn"
                  onClick={() => setSelectedProductIds([])}
                  className="font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Clear selection ({selectedProductIds.length})
                </button>
              ) : (
                <button
                  type="button"
                  id="select-all-filtered-footer-btn"
                  data-testid="select-all-filtered-footer-btn"
                  onClick={() => setSelectedProductIds(filteredProductIds)}
                  className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Select all {filteredProducts.length} matching
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Product Modal with 9-Column Specification */}
      {isAddModalOpen && (
        <div
          id="add-product-modal-backdrop"
          data-testid="add-product-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 block">
                  10-Column Specification
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-heading">
                  Add Formulation to Product Catalog
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register new pharmaceutical product with commercial pricing, company name, rate card rates, and clinical category.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              {/* Column 1 & Column 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    1. Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="input-product-name"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. TelmiKard 40-H"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    2. Salt Name / Composition *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="input-product-generic"
                    value={newProdGeneric}
                    onChange={(e) => setNewProdGeneric(e.target.value)}
                    placeholder="e.g. Telmisartan 40mg + HCTZ 12.5mg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Column 3, Column 4, Column 9 & Column 10 Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    3. Packaging *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdPackaging}
                    onChange={(e) => setNewProdPackaging(e.target.value)}
                    placeholder="e.g. 10x10 Tablets, 100ml"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    4. Dosage Form *
                  </label>
                  <select
                    value={newProdForm}
                    onChange={(e) => setNewProdForm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Suspension">Suspension</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    11. Company (Manufacturing Name) *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="input-product-company"
                    value={newProdCompany}
                    onChange={(e) => setNewProdCompany(e.target.value)}
                    placeholder="e.g. Torrent Pharmaceuticals, Cipla Ltd"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    12. Category / Speciality (Open Field) *
                  </label>
                  <input
                    type="text"
                    list="new-speciality-options"
                    data-testid="input-product-category"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    placeholder="e.g. Antibiotics, Cardiology, Orthopedics..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                  <datalist id="new-speciality-options">
                    {allSpecialities.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">Quick pick:</span>
                    {['Antibiotics', 'Cardiology', 'Gastroenterology', 'Respiratory', 'Orthopedics', 'Dermatology'].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setNewProdCategory(s)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing Matrix: Column 5, 6, 7, 8, 9, 10 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
                  Commercial Pricing & GST Matrix
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      5. MRP (Retail)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 font-semibold text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newProdMrp}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewProdMrp(val);
                        }}
                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                      6. Pricing to Stockist
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-emerald-500 font-semibold text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        data-testid="input-product-pts"
                        value={newProdPricingToStockist}
                        onChange={(e) => setNewProdPricingToStockist(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1.5 bg-emerald-50/40 border border-emerald-200 text-emerald-900 rounded-lg text-sm font-semibold tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-teal-800 mb-1">
                      7. Pricing to Retailer
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-teal-500 font-semibold text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        data-testid="input-product-ptr"
                        value={newProdPricingToRetailer}
                        onChange={(e) => setNewProdPricingToRetailer(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1.5 bg-teal-50/40 border border-teal-200 text-teal-900 rounded-lg text-sm font-semibold tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-blue-700 mb-1">
                      8. Selling Price (Rep)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-blue-500 font-semibold text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newProdSellingRate}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewProdSellingRate(val);
                          // Auto update PTS and PTR suggestions if they are default
                          if (!newProdPricingToStockist || newProdPricingToStockist === 145) {
                            setNewProdPricingToStockist(Math.round(val * 0.88 * 100) / 100);
                          }
                          if (!newProdPricingToRetailer || newProdPricingToRetailer === 155) {
                            setNewProdPricingToRetailer(Math.round(val * 0.94 * 100) / 100);
                          }
                        }}
                        className="w-full pl-6 pr-2 py-1.5 bg-blue-50/60 border border-blue-200 text-blue-900 rounded-lg text-sm font-bold tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      9. Purchase Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 font-semibold text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newProdPurchasePrice}
                        onChange={(e) => setNewProdPurchasePrice(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      10. GST
                    </label>
                    <input
                      type="text"
                      required
                      value={newProdGst}
                      onChange={(e) => setNewProdGst(e.target.value)}
                      placeholder="e.g. 12%"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-center"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 flex-wrap gap-2">
                  <span className="text-slate-600">
                    Stockist Margin:{' '}
                    <strong className="text-emerald-700 tabular-nums">
                      {newProdPricingToRetailer > 0 && newProdPricingToStockist > 0
                        ? (((newProdPricingToRetailer - newProdPricingToStockist) / newProdPricingToRetailer) * 100).toFixed(1)
                        : '0'}
                      %
                    </strong>
                  </span>
                  <span className="text-slate-600">
                    Wholesale Profit Margin:{' '}
                    <strong className="text-emerald-700 tabular-nums">
                      {newProdSellingRate > 0
                        ? (((newProdSellingRate - newProdPurchasePrice) / newProdSellingRate) * 100).toFixed(1)
                        : '0'}
                      %
                    </strong>
                  </span>
                  <span className="text-slate-600">
                    Retailer Margin:{' '}
                    <strong className="text-blue-700 tabular-nums">
                      {newProdMrp > 0 ? (((newProdMrp - newProdSellingRate) / newProdMrp) * 100).toFixed(1) : '0'}%
                    </strong>
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsExcelModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold hover:underline"
                >
                  <FileXls size={16} weight="fill" />
                  <span>Have an Excel sheet? Upload spreadsheet instead</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
                  >
                    Save Formulation
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Edit Product Modal (Triggered by Pencil Icon) */}
      {isEditModalOpen && editingProduct && (
        <div
          id="edit-product-modal-backdrop"
          data-testid="edit-product-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <PencilSimple size={18} weight="bold" />
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 font-heading">
                    Edit Product Details
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Modify catalogue specifications, pricing, manufacturing company, or sales rep visibility for <strong>{editingProduct.name}</strong>.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Column 1 & Column 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    1. Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="edit-input-product-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. TelmiKard 40-H"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    2. Salt Name / Composition *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="edit-input-product-generic"
                    value={editGeneric}
                    onChange={(e) => setEditGeneric(e.target.value)}
                    placeholder="e.g. Telmisartan 40mg + HCTZ 12.5mg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Column 3, Column 4, Column 9 & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    3. Packaging *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="edit-input-packaging"
                    value={editPackaging}
                    onChange={(e) => setEditPackaging(e.target.value)}
                    placeholder="e.g. 10x10 Tablets, 100ml"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    4. Dosage Form *
                  </label>
                  <select
                    value={editForm}
                    onChange={(e) => setEditForm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Suspension">Suspension</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    11. Company (Manufacturing Name) *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="edit-input-company"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    placeholder="e.g. Torrent Pharmaceuticals, Cipla Ltd"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    12. Category / Speciality (Open Field) *
                  </label>
                  <input
                    type="text"
                    list="edit-speciality-options"
                    data-testid="edit-input-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="e.g. Antibiotics, Cardiology, Orthopedics..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                  <datalist id="edit-speciality-options">
                    {allSpecialities.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">Quick pick:</span>
                    {['Antibiotics', 'Cardiology', 'Gastroenterology', 'Respiratory', 'Orthopedics', 'Dermatology'].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setEditCategory(s)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing Matrix: Column 5, 6, 7, 8, 9, 10 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
                  Commercial Pricing & GST Matrix
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      5. MRP (Retail)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 font-semibold text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        data-testid="edit-input-mrp"
                        value={editMrp}
                        onChange={(e) => setEditMrp(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                      6. Pricing to Stockist
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-emerald-500 font-semibold text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        data-testid="edit-input-pts"
                        value={editPricingToStockist}
                        onChange={(e) => setEditPricingToStockist(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1.5 bg-emerald-50/40 border border-emerald-200 text-emerald-900 rounded-lg text-sm font-semibold tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-teal-800 mb-1">
                      7. Pricing to Retailer
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-teal-500 font-semibold text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        data-testid="edit-input-ptr"
                        value={editPricingToRetailer}
                        onChange={(e) => setEditPricingToRetailer(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1.5 bg-teal-50/40 border border-teal-200 text-teal-900 rounded-lg text-sm font-semibold tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-blue-700 mb-1">
                      8. Selling Price (Rep)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-blue-500 font-semibold text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        data-testid="edit-input-selling-rate"
                        value={editSellingRate}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditSellingRate(val);
                          // Auto update if unset
                          if (!editPricingToStockist) {
                            setEditPricingToStockist(Math.round(val * 0.88 * 100) / 100);
                          }
                          if (!editPricingToRetailer) {
                            setEditPricingToRetailer(Math.round(val * 0.94 * 100) / 100);
                          }
                        }}
                        className="w-full pl-6 pr-2 py-1.5 bg-blue-50/60 border border-blue-200 text-blue-900 rounded-lg text-sm font-bold tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      9. Purchase Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 font-semibold text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        data-testid="edit-input-purchase-price"
                        value={editPurchasePrice}
                        onChange={(e) => setEditPurchasePrice(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      10. GST
                    </label>
                    <input
                      type="text"
                      required
                      data-testid="edit-input-gst"
                      value={editGst}
                      onChange={(e) => setEditGst(e.target.value)}
                      placeholder="e.g. 12%"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-center"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 flex-wrap gap-2">
                  <span className="text-slate-600">
                    Stockist Margin:{' '}
                    <strong className="text-emerald-700 tabular-nums">
                      {editPricingToRetailer > 0 && editPricingToStockist > 0
                        ? (((editPricingToRetailer - editPricingToStockist) / editPricingToRetailer) * 100).toFixed(1)
                        : '0'}
                      %
                    </strong>
                  </span>
                  <span className="text-slate-600">
                    Wholesale Profit Margin:{' '}
                    <strong className="text-emerald-700 tabular-nums">
                      {editSellingRate > 0
                        ? (((editSellingRate - editPurchasePrice) / editSellingRate) * 100).toFixed(1)
                        : '0'}
                      %
                    </strong>
                  </span>
                  <span className="text-slate-600">
                    Retailer Margin:{' '}
                    <strong className="text-blue-700 tabular-nums">
                      {editMrp > 0 ? (((editMrp - editSellingRate) / editMrp) * 100).toFixed(1) : '0'}%
                    </strong>
                  </span>
                </div>
              </div>

              {/* Hide from Sales Rep Option */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-lg ${editHiddenFromRep ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                    {editHiddenFromRep ? <EyeSlash size={20} weight="bold" /> : <Eye size={20} />}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Hide Product from Sales Reps
                    </h4>
                    <p className="text-xs text-slate-500">
                      When enabled, this formulation is hidden from the representative rate card and field formulary.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="edit-toggle-hidden-from-rep"
                    checked={editHiddenFromRep}
                    onChange={(e) => setEditHiddenFromRep(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-edit-product-btn"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />

      {/* Rep Column Permissions Modal */}
      <RepColumnPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />

      {/* Bulk Category Modal */}
      <BulkCategoryModal
        isOpen={isBulkCategoryModalOpen}
        onClose={() => setIsBulkCategoryModalOpen(false)}
        selectedCount={selectedProductIds.length}
        categories={categories}
        onApplyCategory={handleBulkApplyCategory}
      />

      {/* Bulk Company / Manufacturer Modal */}
      <BulkCompanyModal
        isOpen={isBulkCompanyModalOpen}
        onClose={() => setIsBulkCompanyModalOpen(false)}
        selectedCount={selectedProductIds.length}
        onApplyCompany={handleBulkApplyCompany}
      />

      {/* Bulk GST Slab Modal */}
      <BulkGstModal
        isOpen={isBulkGstModalOpen}
        onClose={() => setIsBulkGstModalOpen(false)}
        selectedCount={selectedProductIds.length}
        onApplyGst={handleBulkApplyGst}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        selectedProducts={selectedProductsList}
        onConfirmDelete={handleBulkConfirmDelete}
      />

      {/* Floating Bottom Quick Action Pill when products are selected */}
      {selectedProductIds.length > 0 && (
        <div
          id="floating-bulk-pill"
          data-testid="floating-bulk-pill"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-4 duration-200 max-w-[95vw] overflow-x-auto"
        >
          <div className="flex items-center gap-2 pr-2 border-r border-slate-700 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold whitespace-nowrap">
              {selectedProductIds.length} Selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedProductIds([])}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              title="Deselect all"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="pill-btn-show-reps"
              data-testid="pill-btn-show-reps"
              onClick={() => handleBulkSetVisibility(false)}
              className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              title="Show to Reps"
            >
              <Eye size={14} />
              <span>Show</span>
            </button>

            <button
              type="button"
              id="pill-btn-hide-reps"
              data-testid="pill-btn-hide-reps"
              onClick={() => handleBulkSetVisibility(true)}
              className="px-2.5 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              title="Hide from Reps"
            >
              <EyeSlash size={14} />
              <span>Hide</span>
            </button>

            <button
              type="button"
              id="pill-btn-category"
              data-testid="pill-btn-category"
              onClick={() => setIsBulkCategoryModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
              title="Batch update category"
            >
              <Tag size={14} weight="bold" />
              <span>Category</span>
            </button>

            <button
              type="button"
              id="pill-btn-company"
              data-testid="pill-btn-company"
              onClick={() => setIsBulkCompanyModalOpen(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              title="Batch update manufacturer"
            >
              <Buildings size={14} />
              <span>Company</span>
            </button>

            <button
              type="button"
              id="pill-btn-export"
              data-testid="pill-btn-export"
              onClick={handleExportSelected}
              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
              title="Export selected items to Excel"
            >
              <DownloadSimple size={14} weight="bold" />
              <span>Export</span>
            </button>

            <button
              type="button"
              id="pill-btn-delete"
              data-testid="pill-btn-delete"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="p-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 rounded-lg transition-colors"
              title="Delete selected formulations"
            >
              <Trash size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
