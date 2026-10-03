import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ExcelImportModal } from './ExcelImportModal';
import { RepColumnPermissionsModal } from './RepColumnPermissionsModal';
import { BulkCategoryModal } from './BulkCategoryModal';
import { BulkCompanyModal } from './BulkCompanyModal';
import { BulkDeleteModal } from './BulkDeleteModal';
import { BulkGstModal } from './BulkGstModal';
import { BulkActionBar } from './BulkActionBar';
import { MergeProductsModal } from './MergeProductsModal';
import { BatchEditModal } from './BatchEditModal';
import { BulkInventoryAdjusterModal } from './BulkInventoryAdjusterModal';
import { ProductExpiryTracker } from './ProductExpiryTracker';
import { BatchManagementModal } from './BatchManagementModal';
import { InventoryChangeLog } from './InventoryChangeLog';
import { evaluateProductExpiry, ExpiryUrgency } from '../../utils/expiryHelper';
import { downloadExcelTemplate, exportProductsToExcel } from '../../utils/excelHelper';
import { formatGst } from '../../utils/gstHelper';
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
  PencilSimpleLine,
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
  CheckSquareOffset,
  GitMerge,
  Lock,
  SortAscending,
  Fire,
  Lightning,
  ArrowsClockwise,
  Camera,
  Image,
  UploadSimple,
  HourglassMedium,
  ClockCountdown,
  CaretDown,
  CaretUp,
  Stethoscope
} from '@phosphor-icons/react';

export const ProductManagement: React.FC = () => {
  const {
    products,
    addProduct,
    addMultipleProducts,
    updateProduct,
    deleteProduct,
    isProductOrdered,
    getProductOrderCount,
    bulkUpdateProducts,
    bulkDeleteProducts,
    clearAllProducts,
    canUndo,
    canRedo,
    undoProductAction,
    redoProductAction,
    setActiveAdminTab,
    reps,
    repColumnPermissions,
    checkAndTriggerStockAlerts,
    previewPhotoUrl,
    setPreviewPhotoUrl,
    auditLogs
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Product Expiry Tracker & Batch Management State
  const [selectedBatchProduct, setSelectedBatchProduct] = useState<Product | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [activeExpiryUrgencyFilter, setActiveExpiryUrgencyFilter] = useState<ExpiryUrgency | 'all_near_term' | null>(null);
  const [showExpiryTracker, setShowExpiryTracker] = useState(true);

  // Photo Attachment State
  const [newProdImageUrl, setNewProdImageUrl] = useState<string>('');
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [attachingPhotoProduct, setAttachingPhotoProduct] = useState<Product | null>(null);
  const [quickPhotoInputUrl, setQuickPhotoInputUrl] = useState<string>('');

  // Sample pharma packaging presets for quick 1-click test attachment
  const SAMPLE_PHARMA_PHOTOS = [
    {
      name: 'Tablet Blister',
      url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Capsule Bottle',
      url: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Alu-Alu Strip',
      url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Syrup Bottle',
      url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Vial Injection',
      url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const handleFileUploadToDataUrl = (file: File, callback: (url: string) => void) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
        toast.success('Photo attached successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  // Bulk operations and selection state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);

  // Product Management area primary sub-tabs: 'catalog' | 'changelog'
  const [activeCatalogSubTab, setActiveCatalogSubTab] = useState<'catalog' | 'changelog'>('catalog');

  const catalogAuditLogsCount = useMemo(() => {
    return (auditLogs || []).filter((log) => {
      const isCatalog = log.module === 'Product Catalog';
      const isStockOrPricing =
        log.changeCategory === 'stock' ||
        log.changeCategory === 'pricing' ||
        log.details.toLowerCase().includes('stock') ||
        log.details.toLowerCase().includes('price') ||
        log.details.toLowerCase().includes('mrp') ||
        log.details.toLowerCase().includes('pts') ||
        log.details.toLowerCase().includes('ptr') ||
        log.details.toLowerCase().includes('units');
      return isCatalog || isStockOrPricing;
    }).length;
  }, [auditLogs]);
  const [isBulkCompanyModalOpen, setIsBulkCompanyModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkGstModalOpen, setIsBulkGstModalOpen] = useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);
  const [isInventoryAdjusterModalOpen, setIsInventoryAdjusterModalOpen] = useState(false);
  const [isBatchModeActive, setIsBatchModeActive] = useState(false);
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Predefined Low Stock & Re-Order Warning System State
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(500);
  const [stockFilterMode, setStockFilterMode] = useState<'all' | 'below_threshold' | 'reorder' | 'out_of_stock' | 'high_demand'>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);
  const [isThresholdInputOpen, setIsThresholdInputOpen] = useState<boolean>(false);
  const [customThresholdInput, setCustomThresholdInput] = useState<string>('500');

  // Collapsable Inventory Warning Banner State
  const [isInventoryWarningCollapsed, setIsInventoryWarningCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ddb_inventory_warning_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('ddb_inventory_warning_collapsed', JSON.stringify(isInventoryWarningCollapsed));
  }, [isInventoryWarningCollapsed]);

  // Quick Stock Level Adjuster Modal State
  const [adjustingStockProduct, setAdjustingStockProduct] = useState<Product | null>(null);
  const [quickStockInput, setQuickStockInput] = useState<string>('');

  // New product form state matching the 12 columns + stock/reorder
  const [newProdName, setNewProdName] = useState('');
  const [newProdGeneric, setNewProdGeneric] = useState('');
  const [newProdPackaging, setNewProdPackaging] = useState('10x10 Tablets');
  const [newProdForm, setNewProdForm] = useState('Tablet');
  const [newProdMrp, setNewProdMrp] = useState<number>(220);
  const [newProdPricingToStockist, setNewProdPricingToStockist] = useState<string | number>('');
  const [newProdPricingToRetailer, setNewProdPricingToRetailer] = useState<string | number>('');
  const [newProdSellingRate, setNewProdSellingRate] = useState<string | number>('');
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState<string | number>('');
  const [newProdGst, setNewProdGst] = useState('12%');
  const [newProdCompany, setNewProdCompany] = useState('DDB DRUG CHEM');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdClinicalSpeciality, setNewProdClinicalSpeciality] = useState('');
  const [newProdStockUnits, setNewProdStockUnits] = useState<number>(0);
  const [newProdReorderLevel, setNewProdReorderLevel] = useState<number>(500);
  const [newProdIsHighDemand, setNewProdIsHighDemand] = useState<boolean>(false);

  // Edit product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGeneric, setEditGeneric] = useState('');
  const [editPackaging, setEditPackaging] = useState('');
  const [editForm, setEditForm] = useState('Tablet');
  const [editMrp, setEditMrp] = useState<number>(0);
  const [editPricingToStockist, setEditPricingToStockist] = useState<string | number>('');
  const [editPricingToRetailer, setEditPricingToRetailer] = useState<string | number>('');
  const [editSellingRate, setEditSellingRate] = useState<string | number>('');
  const [editPurchasePrice, setEditPurchasePrice] = useState<string | number>('');
  const [editGst, setEditGst] = useState('12%');
  const [editCompany, setEditCompany] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editClinicalSpeciality, setEditClinicalSpeciality] = useState('');
  const [editHiddenFromRep, setEditHiddenFromRep] = useState(false);
  const [editStockUnits, setEditStockUnits] = useState<number>(1000);
  const [editReorderLevel, setEditReorderLevel] = useState<number>(500);
  const [editIsHighDemand, setEditIsHighDemand] = useState<boolean>(false);

  // Filter state for Clinical Speciality / Division
  const [selectedClinicalSpeciality, setSelectedClinicalSpeciality] = useState<string>('All');

  // Warning system for stock levels below predefined threshold
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => (p.stockUnits ?? 0) < lowStockThreshold || (p.stockUnits ?? 0) <= (p.reorderLevel ?? lowStockThreshold));
  }, [products, lowStockThreshold]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => (p.stockUnits ?? 0) === 0);
  }, [products]);

  // Re-Order Level reached: products below or at re-order level, but not completely 0 (separate from out of stock)
  const reorderLevelProducts = useMemo(() => {
    return products.filter((p) => (p.stockUnits ?? 0) > 0 && ((p.stockUnits ?? 0) <= (p.reorderLevel ?? lowStockThreshold) || (p.stockUnits ?? 0) < lowStockThreshold));
  }, [products, lowStockThreshold]);

  // Specific high-demand products reaching re-order level
  const highDemandReorderProducts = useMemo(() => {
    return products.filter((p) => p.isHighDemand && (p.stockUnits ?? 0) <= (p.reorderLevel ?? lowStockThreshold) && (p.stockUnits ?? 0) > 0);
  }, [products, lowStockThreshold]);

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
    (products || []).forEach((p) => {
      if (p && p.category && typeof p.category === 'string' && p.category.trim()) {
        uniqueSet.add(p.category.trim());
      }
    });
    // Add default clinical specialties
    defaultList.forEach((s) => uniqueSet.add(s));
    return Array.from(uniqueSet);
  }, [products]);

  // Categories displayed as filter pills next to search bar (All + actual product categories + Uncategorized if present)
  const categories = useMemo(() => {
    const list = ['All'];
    const inCatalogue = new Set<string>();
    let hasUncategorized = false;
    (products || []).forEach((p) => {
      if (p && p.category && typeof p.category === 'string' && p.category.trim()) {
        inCatalogue.add(p.category.trim());
      } else {
        hasUncategorized = true;
      }
    });

    Array.from(inCatalogue)
      .sort((a, b) => a.localeCompare(b))
      .forEach((c) => list.push(c));

    if (hasUncategorized) {
      list.push('Uncategorized');
    }
    return list;
  }, [products]);

  // Dynamic list of clinical divisions/specialities (e.g. Paediatric, Gynaecology, Cardiology, etc.)
  const allClinicalSpecialities = useMemo(() => {
    const defaultList = [
      'Paediatric',
      'Gynaecology',
      'General Medicine',
      'Cardiology',
      'Orthopaedics',
      'Dermatology',
      'ENT',
      'Neurology',
      'Gastroenterology',
      'Pulmonology',
      'Diabetology',
      'Ophthalmology',
      'Urology',
      'Nephrology',
      'Oncology'
    ];
    const uniqueSet = new Set<string>();
    (products || []).forEach((p) => {
      if (p && p.clinicalSpeciality && typeof p.clinicalSpeciality === 'string' && p.clinicalSpeciality.trim()) {
        uniqueSet.add(p.clinicalSpeciality.trim());
      }
    });
    defaultList.forEach((s) => uniqueSet.add(s));
    return Array.from(uniqueSet);
  }, [products]);

  const clinicalSpecialitiesFilterList = useMemo(() => {
    const list = ['All'];
    const inCatalogue = new Set<string>();
    let hasUnassigned = false;
    (products || []).forEach((p) => {
      if (p && p.clinicalSpeciality && typeof p.clinicalSpeciality === 'string' && p.clinicalSpeciality.trim()) {
        inCatalogue.add(p.clinicalSpeciality.trim());
      } else {
        hasUnassigned = true;
      }
    });
    Array.from(inCatalogue)
      .sort((a, b) => a.localeCompare(b))
      .forEach((c) => list.push(c));
    if (hasUnassigned) {
      list.push('Unassigned');
    }
    return list;
  }, [products]);

  // Count products for category pill badges
  const getCategoryCount = (cat: string) => {
    if (!products) return 0;
    if (cat === 'All') return products.length;
    if (cat === 'Uncategorized') {
      return products.filter((p) => !p || !p.category || !p.category.trim()).length;
    }
    return products.filter((p) => (p?.category || '').toLowerCase().trim() === cat.toLowerCase().trim()).length;
  };

  // Duplicate product detection by case-insensitive name
  const duplicateGroups = useMemo(() => {
    const map = new Map<string, Product[]>();
    (products || []).forEach((p) => {
      if (!p || !p.name) return;
      const key = p.name.trim().toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    const dups = new Map<string, Product[]>();
    map.forEach((prods, key) => {
      if (prods.length > 1) {
        dups.set(key, prods);
      }
    });
    return dups;
  }, [products]);

  const duplicateNamesCount = duplicateGroups.size;
  const totalDuplicateProductsCount = useMemo(() => {
    let sum = 0;
    duplicateGroups.forEach((prods) => {
      sum += prods.length;
    });
    return sum;
  }, [duplicateGroups]);

  const [mergeModalProductName, setMergeModalProductName] = useState<string | null>(null);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState<boolean>(false);

  const filteredProducts = useMemo(() => {
    const list = (products || []).filter((p) => {
      if (!p) return false;
      const pCat = p.category ? p.category.trim() : '';
      const matchesCat =
        selectedCategory === 'All' ||
        (selectedCategory === 'Uncategorized'
          ? !pCat
          : (pCat.toLowerCase() === selectedCategory.toLowerCase().trim()));

      const pSpec = p.clinicalSpeciality ? p.clinicalSpeciality.trim() : '';
      const matchesSpec =
        selectedClinicalSpeciality === 'All' ||
        (selectedClinicalSpeciality === 'Unassigned'
          ? !pSpec
          : (pSpec.toLowerCase() === selectedClinicalSpeciality.toLowerCase().trim()));

      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term === '' ||
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.genericName && p.genericName.toLowerCase().includes(term)) ||
        (p.company && p.company.toLowerCase().includes(term)) ||
        (p.packaging && p.packaging.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.clinicalSpeciality && p.clinicalSpeciality.toLowerCase().includes(term));
      return matchesCat && matchesSpec && matchesSearch;
    });

    let candidates = list;

    if (showDuplicatesOnly) {
      candidates = candidates.filter((p) => {
        const pName = p?.name ? p.name.trim().toLowerCase() : '';
        return pName ? duplicateGroups.has(pName) : false;
      });
    }

    if (activeExpiryUrgencyFilter) {
      candidates = candidates.filter((p) => {
        const summary = evaluateProductExpiry(p);
        if (activeExpiryUrgencyFilter === 'all_near_term') {
          return summary.hasNearTermBatches || summary.hasExpiredBatches;
        }
        return summary.batches.some((b) => b.urgency === activeExpiryUrgencyFilter);
      });
    }

    if (stockFilterMode === 'below_threshold') {
      candidates = candidates.filter((p) => (p.stockUnits ?? 0) < lowStockThreshold || (p.stockUnits ?? 0) <= (p.reorderLevel ?? lowStockThreshold));
    } else if (stockFilterMode === 'reorder') {
      candidates = candidates.filter((p) => (p.stockUnits ?? 0) > 0 && ((p.stockUnits ?? 0) <= (p.reorderLevel ?? lowStockThreshold) || (p.stockUnits ?? 0) < lowStockThreshold));
    } else if (stockFilterMode === 'out_of_stock') {
      candidates = candidates.filter((p) => (p.stockUnits ?? 0) === 0);
    } else if (stockFilterMode === 'high_demand') {
      candidates = candidates.filter((p) => p.isHighDemand);
    } else if (showLowStockOnly) {
      candidates = candidates.filter((p) => (p.stockUnits ?? 0) < lowStockThreshold);
    }

    // Requirement: visible alphabetically by product name (A-Z)
    return candidates.sort((a, b) => {
      const nameA = a?.name || '';
      const nameB = b?.name || '';
      const cmp = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return (a?.packaging || '').localeCompare(b?.packaging || '');
    });
  }, [products, selectedCategory, searchTerm, showDuplicatesOnly, showLowStockOnly, stockFilterMode, lowStockThreshold, duplicateGroups, activeExpiryUrgencyFilter]);

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
    const formatted = formatGst(newGst);
    bulkUpdateProducts(
      selectedProductIds,
      { gst: formatted },
      `Updated GST rate to ${formatted} for ${selectedProductIds.length} formulation(s)`
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

    const ptsNum = newProdPricingToStockist !== '' ? Number(newProdPricingToStockist) : undefined;
    const ptrNum = newProdPricingToRetailer !== '' ? Number(newProdPricingToRetailer) : undefined;
    const srNum = newProdSellingRate !== '' ? Number(newProdSellingRate) : undefined;
    const ppNum = newProdPurchasePrice !== '' ? Number(newProdPurchasePrice) : undefined;

    const stockVal = Number(newProdStockUnits) >= 0 ? Number(newProdStockUnits) : 1000;
    const reorderVal = Number(newProdReorderLevel) > 0 ? Number(newProdReorderLevel) : 500;
    const statusVal = stockVal === 0 ? 'out_of_stock' : stockVal <= reorderVal ? 'low_stock' : 'active';

    const createdProd = {
      name: newProdName.trim(),
      genericName: newProdGeneric.trim() || newProdName.trim(),
      packaging: newProdPackaging.trim() || '10x10 Tablets',
      form: newProdForm,
      mrp: Number(newProdMrp) || 0,
      pricingToStockist: ptsNum !== undefined && !isNaN(ptsNum) && ptsNum > 0 ? ptsNum : undefined,
      pricingToRetailer: ptrNum !== undefined && !isNaN(ptrNum) && ptrNum > 0 ? ptrNum : undefined,
      sellingRate: srNum !== undefined && !isNaN(srNum) && srNum > 0 ? srNum : undefined,
      purchasePrice: ppNum !== undefined && !isNaN(ppNum) && ppNum > 0 ? ppNum : undefined,
      gst: formatGst(newProdGst || '12%'),
      company: newProdCompany.trim() || 'DDB DRUG CHEM',
      stockUnits: stockVal,
      reorderLevel: reorderVal,
      isHighDemand: newProdIsHighDemand,
      imageUrl: newProdImageUrl.trim() || undefined,
      batchNo: 'STD-BATCH',
      expiryDate: '12/2028',
      batches: [],
      category: newProdCategory.trim() && newProdCategory.trim() !== '-' ? newProdCategory.trim() : undefined,
      clinicalSpeciality: newProdClinicalSpeciality.trim() && newProdClinicalSpeciality.trim() !== '-' ? newProdClinicalSpeciality.trim() : undefined,
      minOrderQty: 10,
      status: statusVal as any,
      indication: 'Clinical prescription formulation'
    };

    addProduct(createdProd);
    checkAndTriggerStockAlerts([createdProd as Product]);

    // Reset and close
    setNewProdName('');
    setNewProdGeneric('');
    setNewProdPackaging('10x10 Tablets');
    setNewProdCompany('DDB DRUG CHEM');
    setNewProdCategory('');
    setNewProdClinicalSpeciality('');
    setNewProdPricingToStockist('');
    setNewProdPricingToRetailer('');
    setNewProdSellingRate('');
    setNewProdPurchasePrice('');
    setNewProdStockUnits(1000);
    setNewProdReorderLevel(500);
    setNewProdIsHighDemand(false);
    setNewProdImageUrl('');
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
      p.pricingToStockist !== undefined && p.pricingToStockist !== null && Number(p.pricingToStockist) > 0 ? String(p.pricingToStockist) : ''
    );
    setEditPricingToRetailer(
      p.pricingToRetailer !== undefined && p.pricingToRetailer !== null && Number(p.pricingToRetailer) > 0 ? String(p.pricingToRetailer) : ''
    );
    setEditSellingRate(
      p.sellingRate !== undefined && p.sellingRate !== null && Number(p.sellingRate) > 0 ? String(p.sellingRate) : ''
    );
    setEditPurchasePrice(
      p.purchasePrice !== undefined && p.purchasePrice !== null && Number(p.purchasePrice) > 0 ? String(p.purchasePrice) : ''
    );
    setEditGst(formatGst(p.gst));
    setEditCompany(p.company || 'DDB DRUG CHEM');
    setEditCategory(p.category || '');
    setEditClinicalSpeciality(p.clinicalSpeciality || '');
    setEditHiddenFromRep(!!p.hiddenFromRep);
    setEditStockUnits(p.stockUnits ?? 1000);
    setEditReorderLevel(p.reorderLevel ?? 500);
    setEditIsHighDemand(!!p.isHighDemand);
    setEditImageUrl(p.imageUrl || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editName.trim()) return;

    const ptsNum = editPricingToStockist !== '' ? Number(editPricingToStockist) : undefined;
    const ptrNum = editPricingToRetailer !== '' ? Number(editPricingToRetailer) : undefined;
    const srNum = editSellingRate !== '' ? Number(editSellingRate) : undefined;
    const ppNum = editPurchasePrice !== '' ? Number(editPurchasePrice) : undefined;

    const stockVal = Number(editStockUnits) >= 0 ? Number(editStockUnits) : (editingProduct.stockUnits ?? 0);
    const reorderVal = Number(editReorderLevel) > 0 ? Number(editReorderLevel) : 500;
    const statusVal = stockVal === 0 ? 'out_of_stock' : stockVal <= reorderVal ? 'low_stock' : 'active';

    const updatedProd: Product = {
      ...editingProduct,
      name: editName.trim(),
      genericName: editGeneric.trim() || editName.trim(),
      packaging: editPackaging.trim() || '10x10 Tablets',
      form: editForm,
      mrp: Number(editMrp) || 0,
      pricingToStockist: ptsNum !== undefined && !isNaN(ptsNum) && ptsNum > 0 ? ptsNum : undefined,
      pricingToRetailer: ptrNum !== undefined && !isNaN(ptrNum) && ptrNum > 0 ? ptrNum : undefined,
      sellingRate: srNum !== undefined && !isNaN(srNum) && srNum > 0 ? srNum : undefined,
      purchasePrice: ppNum !== undefined && !isNaN(ppNum) && ppNum > 0 ? ppNum : undefined,
      gst: formatGst(editGst || '12%'),
      company: editCompany.trim() || 'DDB DRUG CHEM',
      category: editCategory.trim() && editCategory.trim() !== '-' ? editCategory.trim() : undefined,
      clinicalSpeciality: editClinicalSpeciality.trim() && editClinicalSpeciality.trim() !== '-' ? editClinicalSpeciality.trim() : undefined,
      hiddenFromRep: editHiddenFromRep,
      stockUnits: stockVal,
      reorderLevel: reorderVal,
      isHighDemand: editIsHighDemand,
      imageUrl: editImageUrl.trim() || undefined,
      status: statusVal as any
    };

    updateProduct(updatedProd);
    checkAndTriggerStockAlerts([updatedProd]);

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
        pricingToStockist: undefined,
        pricingToRetailer: undefined,
        sellingRate: undefined,
        purchasePrice: 125.0,
        gst: '12%',
        company: 'Torrent Pharmaceuticals',
        stockUnits: 0,
        batchNo: 'TKH-2026-01, TKH-2026-02',
        expiryDate: '11/2027',
        batches: [
          { batchNumber: 'TKH-2026-01', expiryDate: '11/2027', stock: 0 },
          { batchNumber: 'TKH-2026-02', expiryDate: '04/2028', stock: 0 }
        ],
        category: 'Cardiology',
        minOrderQty: 10,
        status: 'out_of_stock',
        indication: 'Essential hypertension in patients not adequately controlled on monotherapy'
      },
      {
        name: 'AmoxyClav 625 Duo',
        genericName: 'Amoxicillin 500mg + Potassium Clavulanate 125mg',
        packaging: '1x10 Strip',
        form: 'Tablet',
        mrp: 228.5,
        pricingToStockist: undefined,
        pricingToRetailer: undefined,
        sellingRate: undefined,
        purchasePrice: 138.0,
        gst: '12%',
        company: 'Alkem Laboratories',
        stockUnits: 0,
        batchNo: 'ACD-8820',
        expiryDate: '09/2027',
        batches: [{ batchNumber: 'ACD-8820', expiryDate: '09/2027', stock: 0 }],
        category: 'Antibiotics',
        minOrderQty: 10,
        status: 'out_of_stock',
        indication: 'Upper and lower respiratory tract infections, ENT infections'
      },
      {
        name: 'Pantocid DSR',
        genericName: 'Pantoprazole 40mg + Domperidone 30mg SR',
        packaging: '10x10 Capsules',
        form: 'Capsule',
        mrp: 195.0,
        pricingToStockist: undefined,
        pricingToRetailer: undefined,
        sellingRate: undefined,
        purchasePrice: 115.0,
        gst: '12%',
        company: 'Sun Pharma Ltd',
        stockUnits: 0,
        batchNo: 'PDS-4011',
        expiryDate: '01/2028',
        batches: [{ batchNumber: 'PDS-4011', expiryDate: '01/2028', stock: 0 }],
        category: 'Gastroenterology',
        minOrderQty: 10,
        status: 'out_of_stock',
        indication: 'Gastroesophageal reflux disease (GERD) and refractory hyperacidity'
      },
      {
        name: 'Montair-LC',
        genericName: 'Montelukast 10mg + Levocetirizine 5mg',
        packaging: '10x10 Tablets',
        form: 'Tablet',
        mrp: 185.0,
        pricingToStockist: undefined,
        pricingToRetailer: undefined,
        sellingRate: undefined,
        purchasePrice: 108.0,
        gst: '12%',
        company: 'Cipla Ltd',
        stockUnits: 0,
        batchNo: 'MLC-1090',
        expiryDate: '10/2027',
        batches: [{ batchNumber: 'MLC-1090', expiryDate: '10/2027', stock: 0 }],
        category: 'Respiratory',
        minOrderQty: 10,
        status: 'out_of_stock',
        indication: 'Allergic rhinitis and concurrent mild to moderate asthma'
      },
      {
        name: 'GlimiKard-M2',
        genericName: 'Glimepiride 2mg + Metformin 500mg SR',
        packaging: '10x15 Tablets',
        form: 'Tablet',
        mrp: 175.0,
        pricingToStockist: undefined,
        pricingToRetailer: undefined,
        sellingRate: undefined,
        purchasePrice: 98.0,
        gst: '12%',
        company: 'Mankind Pharma Ltd',
        stockUnits: 0,
        batchNo: 'GKM-3301, GKM-3302',
        expiryDate: '08/2027',
        batches: [
          { batchNumber: 'GKM-3301', expiryDate: '08/2027', stock: 0 },
          { batchNumber: 'GKM-3302', expiryDate: '03/2028', stock: 0 }
        ],
        category: 'Diabetology',
        minOrderQty: 15,
        status: 'out_of_stock',
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

          {/* Change History Button - Toggles directly to Inventory Change Log within Product Management */}
          <button
            id="product-history-shortcut-btn"
            data-testid="product-history-shortcut-btn"
            onClick={() => setActiveCatalogSubTab((prev) => (prev === 'changelog' ? 'catalog' : 'changelog'))}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${
              activeCatalogSubTab === 'changelog'
                ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="View Inventory & Pricing Change Log within Product Management"
          >
            <ClockCounterClockwise size={16} weight="bold" />
            <span className="hidden md:inline">Change Log</span>
            {catalogAuditLogsCount > 0 && (
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full border border-amber-300">
                {catalogAuditLogsCount}
              </span>
            )}
          </button>

          {/* Product Expiry Tracker Toggle Button */}
          <button
            id="toggle-expiry-tracker-btn"
            data-testid="toggle-expiry-tracker-btn"
            onClick={() => setShowExpiryTracker((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${
              showExpiryTracker
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Toggle Product Expiry Tracker and batch shelf-life surveillance"
          >
            <HourglassMedium size={18} weight="fill" className="text-amber-600" />
            <span className="hidden lg:inline">Expiry Tracker</span>
            <span className="lg:hidden">Expiry</span>
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

          {/* Batch Edit Mode Button */}
          <button
            id="batch-edit-mode-btn"
            data-testid="batch-edit-mode-btn"
            onClick={() => {
              if (selectedProductIds.length > 0) {
                setIsBatchEditModalOpen(true);
              } else {
                setIsBatchModeActive((prev) => !prev);
              }
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${
              isBatchModeActive || selectedProductIds.length > 0
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Batch editing mode: select multiple formulations and adjust pricing or stock levels simultaneously"
          >
            <PencilSimpleLine size={18} weight="bold" className="text-blue-600" />
            <span>Batch Edit Mode</span>
            {selectedProductIds.length > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                {selectedProductIds.length}
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

      {/* Product Management Area Primary Navigation Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/90 pb-3 flex-wrap">
        <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-sm">
          <button
            type="button"
            id="tab-product-catalog"
            data-testid="tab-product-catalog"
            onClick={() => setActiveCatalogSubTab('catalog')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
              activeCatalogSubTab === 'catalog'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill size={17} weight="bold" className={activeCatalogSubTab === 'catalog' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Product Catalog</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
                activeCatalogSubTab === 'catalog'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {products.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-inventory-changelog"
            data-testid="tab-inventory-changelog"
            onClick={() => setActiveCatalogSubTab('changelog')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
              activeCatalogSubTab === 'changelog'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClockCounterClockwise
              size={17}
              weight="bold"
              className={activeCatalogSubTab === 'changelog' ? 'text-amber-600' : 'text-slate-400'}
            />
            <span>Inventory Change Log</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
                activeCatalogSubTab === 'changelog'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {catalogAuditLogsCount}
            </span>
          </button>
        </div>

        {/* Status / Quick hint */}
        <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
          <ShieldCheck size={16} weight="bold" className="text-emerald-600" />
          <span>Real-time Audit Trail &amp; Price Verification Active</span>
        </div>
      </div>

      {activeCatalogSubTab === 'changelog' ? (
        <InventoryChangeLog onSwitchToCatalog={() => setActiveCatalogSubTab('catalog')} />
      ) : (
        <>
          {/* Restructured Filters, Search & Inventory Controls Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 sm:p-4 space-y-3">
        {/* Top Row: Search Input & Inventory Warning Status Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              data-testid="product-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, salt, company, category..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X size={15} weight="bold" />
              </button>
            )}
          </div>

          {/* Right: Dedicated Inventory Warning & Low Stock Filter Control */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            {/* Inventory Warning Filter & Collapse Badge */}
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all inline-flex items-center gap-2 border ${
                showLowStockOnly
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : lowStockProducts.length > 0
                  ? 'bg-rose-50/90 text-rose-900 border-rose-200 hover:bg-rose-100 font-semibold'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="inventory-warning-checkbox"
                  data-testid="inventory-warning-checkbox"
                  checked={showLowStockOnly}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setShowLowStockOnly(checked);
                    if (checked) {
                      setStockFilterMode('below_threshold');
                    } else {
                      setStockFilterMode('all');
                    }
                  }}
                  className={`w-3.5 h-3.5 rounded cursor-pointer ${
                    showLowStockOnly ? 'accent-white' : 'text-rose-600 border-rose-300 focus:ring-rose-500'
                  }`}
                  title="Toggle filtering for Inventory Warning products (< threshold)"
                />
                <Warning size={14} weight="fill" className={showLowStockOnly ? 'text-white' : 'text-rose-600'} />
                <span>Inventory Warning</span>
              </label>

              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                  showLowStockOnly ? 'bg-rose-700 text-white' : 'bg-rose-200/90 text-rose-900'
                }`}
                title={`${lowStockProducts.length} formulation(s) below safety threshold (${outOfStockProducts.length} depleted / 0 units)`}
              >
                {lowStockProducts.length}
              </span>

              {/* Collapsable control toggle for the warning banner */}
              {lowStockProducts.length > 0 && (
                <button
                  type="button"
                  id="toggle-collapse-inventory-warning-btn"
                  data-testid="toggle-collapse-inventory-warning-btn"
                  onClick={() => setIsInventoryWarningCollapsed((prev) => !prev)}
                  className={`p-0.5 rounded transition-colors cursor-pointer ${
                    showLowStockOnly
                      ? 'hover:bg-rose-700 text-rose-100 hover:text-white'
                      : 'hover:bg-rose-200 text-rose-700 hover:text-rose-950'
                  }`}
                  title={isInventoryWarningCollapsed ? 'Expand Inventory Warning Banner' : 'Collapse Inventory Warning Banner'}
                >
                  {isInventoryWarningCollapsed ? <CaretDown size={14} weight="bold" /> : <CaretUp size={14} weight="bold" />}
                </button>
              )}
            </div>

            {/* Direct Quick Launch for Bulk Inventory Adjuster */}
            <button
              type="button"
              id="header-bulk-inventory-adjuster-btn"
              data-testid="header-bulk-inventory-adjuster-btn"
              onClick={() => {
                setSelectedProductIds(lowStockProducts.length > 0 ? lowStockProducts.map(p => p.id) : filteredProductIds);
                setIsInventoryAdjusterModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-xs transition-colors cursor-pointer"
              title="Launch Bulk Inventory Adjuster modal"
            >
              <Package size={14} weight="bold" />
              <span>Bulk Adjust</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Category / Speciality Pills */}
        <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 overflow-x-auto scrollbar-thin pb-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 select-none">
            Speciality:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {categories.map((cat) => {
              const count = getCategoryCount(cat);
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  data-testid={`category-filter-${cat.toLowerCase()}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all inline-flex items-center gap-1.5 cursor-pointer ${
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

        {/* Clinical Speciality / Medical Division Segment Filter Row */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-thin pb-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 shrink-0 select-none flex items-center gap-1">
            <Stethoscope size={13} weight="bold" />
            <span>Clinical Division:</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {clinicalSpecialitiesFilterList.map((spec) => {
              const count = spec === 'All'
                ? products.length
                : spec === 'Unassigned'
                ? products.filter((p) => !p || !p.clinicalSpeciality || !p.clinicalSpeciality.trim()).length
                : products.filter((p) => (p?.clinicalSpeciality || '').toLowerCase().trim() === spec.toLowerCase().trim()).length;
              const isSelected = selectedClinicalSpeciality.toLowerCase() === spec.toLowerCase();
              return (
                <button
                  key={spec}
                  type="button"
                  data-testid={`clinical-speciality-filter-${spec.toLowerCase()}`}
                  onClick={() => setSelectedClinicalSpeciality(spec)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-700 text-white font-semibold shadow-xs'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  <span>{spec}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                      isSelected ? 'bg-purple-900 text-white' : 'bg-purple-200/80 text-purple-900'
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

      {/* Batch Editing Mode Callout Banner */}
      {isBatchModeActive && (
        <div
          id="batch-edit-mode-banner"
          data-testid="batch-edit-mode-banner"
          className="bg-blue-50/95 border-2 border-blue-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <PencilSimpleLine size={18} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-950">
                  Batch Editing Mode Active
                </span>
                <span className="text-[10px] font-bold bg-blue-200/90 text-blue-900 px-2 py-0.5 rounded-md">
                  {selectedProductIds.length} Selected
                </span>
              </div>
              <p className="text-xs text-blue-800 mt-0.5">
                Select formulations below using checkboxes, then click &ldquo;Launch Batch Editor&rdquo; to simultaneously adjust prices, rates, or warehouse stock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              id="batch-mode-select-all"
              onClick={() => setSelectedProductIds(filteredProductIds)}
              className="px-2.5 py-1.5 bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Select All Filtered ({filteredProducts.length})
            </button>

            {selectedProductIds.length > 0 && (
              <button
                type="button"
                id="batch-mode-clear"
                onClick={() => setSelectedProductIds([])}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear Selection
              </button>
            )}

            <button
              type="button"
              id="batch-mode-launch-editor"
              data-testid="batch-mode-launch-editor"
              disabled={selectedProductIds.length === 0}
              onClick={() => setIsBatchEditModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors ${
                selectedProductIds.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <PencilSimpleLine size={14} weight="bold" />
              <span>Launch Batch Editor ({selectedProductIds.length})</span>
            </button>

            <button
              type="button"
              id="batch-mode-inventory-adjuster"
              data-testid="batch-mode-inventory-adjuster"
              disabled={selectedProductIds.length === 0}
              onClick={() => setIsInventoryAdjusterModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors ${
                selectedProductIds.length > 0
                  ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Package size={14} weight="bold" />
              <span>Bulk Inventory Adjuster ({selectedProductIds.length})</span>
            </button>

            <button
              type="button"
              id="batch-mode-exit"
              onClick={() => setIsBatchModeActive(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-blue-100/60 transition-colors cursor-pointer"
              title="Exit Batch Edit Mode"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Operations Toolbar - Appears when items are selected */}
      {selectedProductIds.length > 0 && (
        <BulkActionBar
          selectedCount={selectedProductIds.length}
          totalFilteredCount={filteredProducts.length}
          onSelectAllFiltered={() => setSelectedProductIds(filteredProductIds)}
          onClearSelection={() => setSelectedProductIds([])}
          onBulkSetVisibility={handleBulkSetVisibility}
          onOpenBatchEditModal={() => setIsBatchEditModalOpen(true)}
          onOpenInventoryAdjusterModal={() => setIsInventoryAdjusterModalOpen(true)}
          onOpenCategoryModal={() => setIsBulkCategoryModalOpen(true)}
          onOpenCompanyModal={() => setIsBulkCompanyModalOpen(true)}
          onOpenGstModal={() => setIsBulkGstModalOpen(true)}
          onOpenDeleteModal={() => setIsBulkDeleteModalOpen(true)}
          onExportSelected={handleExportSelected}
        />
      )}

      {/* Duplicate Products Alert & Action Banner */}
      {duplicateNamesCount > 0 && (
        <div
          id="duplicate-products-banner"
          data-testid="duplicate-products-banner"
          className="bg-amber-50 border border-amber-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Warning size={22} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-950">
                  {duplicateNamesCount} Duplicate Product Name{duplicateNamesCount > 1 ? 's' : ''} Detected ({totalDuplicateProductsCount} Total Formulations)
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Multiple formulations share the same name. Formulations with placed orders are protected from deletion, but you can merge their inventory or remove un-ordered duplicates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setShowDuplicatesOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                showDuplicatesOnly
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100/50'
              }`}
            >
              {showDuplicatesOnly ? 'Show All Products' : `Filter Duplicates (${totalDuplicateProductsCount})`}
            </button>

            <button
              type="button"
              onClick={() => {
                const firstDupName = duplicateGroups.values().next().value?.[0]?.name;
                if (firstDupName) {
                  setMergeModalProductName(firstDupName);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <GitMerge size={15} weight="bold" />
              <span>Resolve Duplicates</span>
            </button>
          </div>
        </div>
      )}

      {/* Product Expiry Tracker Panel */}
      {showExpiryTracker && (
        <ProductExpiryTracker
          products={products}
          onOpenBatchModal={(p) => {
            setSelectedBatchProduct(p);
            setIsBatchModalOpen(true);
          }}
          activeFilterUrgency={activeExpiryUrgencyFilter}
          onFilterChange={(filter) => setActiveExpiryUrgencyFilter(filter)}
        />
      )}

      {/* Low Stock & Re-Order Warning System Banner (Collapsable) */}
      {lowStockProducts.length > 0 && (
        isInventoryWarningCollapsed ? (
          <div
            id="low-stock-warning-banner-collapsed"
            data-testid="low-stock-warning-banner-collapsed"
            className="bg-rose-50/95 border border-rose-200/90 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs transition-all"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Warning size={18} weight="fill" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="inventory-warning-collapsed-checkbox"
                  data-testid="inventory-warning-collapsed-checkbox"
                  checked={false}
                  onChange={() => setIsInventoryWarningCollapsed(false)}
                  className="w-4 h-4 rounded text-rose-600 border-rose-300 focus:ring-rose-500 cursor-pointer"
                  title="Uncheck to collapse, check to expand"
                />
                <span className="text-xs font-bold text-rose-950">
                  Inventory Warning: {lowStockProducts.length} Formulation{lowStockProducts.length > 1 ? 's' : ''} Below Buffer Threshold ({outOfStockProducts.length} Depleted / 0 Units)
                </span>
              </label>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md">
                Banner Collapsed
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="collapsed-bulk-adjust-btn"
                data-testid="collapsed-bulk-adjust-btn"
                onClick={() => {
                  setSelectedProductIds(lowStockProducts.map(p => p.id));
                  setIsInventoryAdjusterModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors cursor-pointer"
                title="Select all depleted/warning formulations and launch Bulk Inventory Adjuster"
              >
                <Package size={14} weight="fill" />
                <span>Bulk Adjust ({lowStockProducts.length})</span>
              </button>

              <button
                type="button"
                id="expand-low-stock-banner-btn"
                data-testid="expand-low-stock-banner-btn"
                onClick={() => setIsInventoryWarningCollapsed(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-rose-900 border border-rose-300 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
              >
                <span>Expand Warning</span>
                <CaretDown size={14} weight="bold" />
              </button>
            </div>
          </div>
        ) : (
          <div
            id="low-stock-warning-banner"
            data-testid="low-stock-warning-banner"
            className="bg-white border-2 border-rose-200/90 rounded-xl overflow-hidden shadow-xs transition-all"
          >
            {/* Banner Header: Status, Alerts & Primary Action */}
            <div className="bg-rose-50/95 p-3.5 sm:p-4 border-b border-rose-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Warning size={22} weight="fill" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-rose-950 font-heading">
                      Inventory Buffer &amp; Re-Order Warning System
                    </h4>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer bg-rose-200/80 hover:bg-rose-300/80 text-rose-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md transition-colors select-none">
                      <input
                        type="checkbox"
                        id="inventory-warning-banner-checkbox"
                        data-testid="inventory-warning-banner-checkbox"
                        checked={true}
                        onChange={() => setIsInventoryWarningCollapsed(true)}
                        className="w-3.5 h-3.5 rounded text-rose-600 border-rose-400 focus:ring-rose-500 cursor-pointer"
                        title="Click to collapse inventory warning banner"
                      />
                      <span>Inventory Warning</span>
                    </label>
                    {outOfStockProducts.length > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-700 text-white px-2 py-0.5 rounded-md">
                        {outOfStockProducts.length} Depleted (0 Units)
                      </span>
                    )}
                    {highDemandReorderProducts.length > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                        <Fire size={11} weight="fill" />
                        {highDemandReorderProducts.length} High-Demand
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-rose-800 mt-0.5">
                    {outOfStockProducts.length > 0
                      ? `${outOfStockProducts.length} formulation${outOfStockProducts.length > 1 ? 's currently have' : ' has'} 0 units in stock. Automated notifications alert procurement to replenish warehouse buffer.`
                      : `All ${lowStockProducts.length} formulation${lowStockProducts.length > 1 ? 's are' : ' is'} below the predefined safety threshold of ${lowStockThreshold} units.`}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  id="trigger-stock-alerts-btn"
                  data-testid="trigger-stock-alerts-btn"
                  onClick={() => {
                    const res = checkAndTriggerStockAlerts(products, { forceNotify: true });
                    toast.success('Automated Stock Alerts Dispatched', {
                      description: `Broadcasted ${res.reorderCount} re-order warning(s) & ${res.outOfStockCount} out-of-stock alert(s) to Operations Console.`
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  title="Trigger automated re-order & out-of-stock notification alerts now"
                >
                  <Lightning size={14} weight="fill" className="text-amber-500" />
                  <span>Trigger Alerts</span>
                </button>

                <button
                  type="button"
                  id="banner-bulk-adjust-stock-btn"
                  data-testid="banner-bulk-adjust-stock-btn"
                  onClick={() => {
                    setSelectedProductIds(lowStockProducts.map(p => p.id));
                    setIsInventoryAdjusterModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
                  title="Select all formulations below threshold and launch Bulk Inventory Adjuster"
                >
                  <Package size={14} weight="fill" />
                  <span>Bulk Adjust Stock ({lowStockProducts.length})</span>
                </button>

                <button
                  type="button"
                  id="collapse-low-stock-banner-btn"
                  data-testid="collapse-low-stock-banner-btn"
                  onClick={() => setIsInventoryWarningCollapsed(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-800 hover:text-rose-950 bg-white border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                  title="Collapse this inventory warning banner"
                >
                  <span>Collapse</span>
                  <CaretUp size={14} weight="bold" />
                </button>
              </div>
            </div>

            {/* Banner Controls Toolbar: Neatly Segmented Filter View & Buffer Threshold */}
            <div className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-slate-100">
              {/* Filter Segmented Control */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Filter View:</span>
                <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg">
                  <button
                    type="button"
                    id="filter-all-warnings-btn"
                    data-testid="filter-all-warnings-btn"
                    onClick={() => {
                      if (stockFilterMode === 'below_threshold') {
                        setStockFilterMode('all');
                        setShowLowStockOnly(false);
                      } else {
                        setStockFilterMode('below_threshold');
                        setShowLowStockOnly(true);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      stockFilterMode === 'below_threshold' || (showLowStockOnly && stockFilterMode === 'all')
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Warnings ({lowStockProducts.length})
                  </button>

                  <button
                    type="button"
                    id="filter-reorder-only-btn"
                    data-testid="filter-reorder-only-btn"
                    onClick={() => {
                      if (stockFilterMode === 'reorder') {
                        setStockFilterMode('all');
                        setShowLowStockOnly(false);
                      } else {
                        setStockFilterMode('reorder');
                        setShowLowStockOnly(false);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      stockFilterMode === 'reorder'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Re-Order ({reorderLevelProducts.length})
                  </button>

                  {outOfStockProducts.length > 0 && (
                    <button
                      type="button"
                      id="filter-out-of-stock-btn"
                      data-testid="filter-out-of-stock-btn"
                      onClick={() => {
                        if (stockFilterMode === 'out_of_stock') {
                          setStockFilterMode('all');
                          setShowLowStockOnly(false);
                        } else {
                          setStockFilterMode('out_of_stock');
                          setShowLowStockOnly(false);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                        stockFilterMode === 'out_of_stock'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Out of Stock ({outOfStockProducts.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Buffer Threshold Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Buffer Threshold:</span>
                <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg">
                  {[250, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setLowStockThreshold(preset);
                        setCustomThresholdInput(String(preset));
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                        lowStockThreshold === preset
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  {isThresholdInputOpen ? (
                    <div className="flex items-center gap-1 pl-1">
                      <input
                        type="number"
                        min="1"
                        value={customThresholdInput}
                        onChange={(e) => setCustomThresholdInput(e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-xs bg-white border border-slate-300 rounded font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseInt(customThresholdInput, 10);
                          if (!isNaN(val) && val > 0) {
                            setLowStockThreshold(val);
                          }
                          setIsThresholdInputOpen(false);
                        }}
                        className="px-2 py-0.5 bg-rose-700 text-white rounded font-bold text-[10px] cursor-pointer"
                      >
                        Set
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsThresholdInputOpen(true)}
                      className="px-2 py-0.5 text-slate-600 hover:text-slate-900 font-semibold text-[11px] cursor-pointer"
                    >
                      Custom
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
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
                  <th className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>1. Product Name</span>
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                        <SortAscending size={11} weight="bold" />
                        A-Z
                      </span>
                    </div>
                  </th>
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
                  {/* Column 13: Clinical Speciality */}
                  <th className="py-3.5 px-3 whitespace-nowrap text-purple-900 bg-purple-50/60 font-extrabold">
                    <div className="flex items-center gap-1">
                      <Stethoscope size={13} weight="bold" />
                      <span>13. Speciality</span>
                    </div>
                  </th>
                  {/* Column 14: Stock Level & Warning System */}
                  <th className="py-3.5 px-3 whitespace-nowrap text-amber-900 bg-amber-50/60 font-extrabold">
                    <div className="flex items-center gap-1">
                      <span>14. Stock Level</span>
                      <span className="text-[10px] text-amber-700 font-semibold lowercase">(&lt;{lowStockThreshold})</span>
                    </div>
                  </th>
                  {/* Actions */}
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs">
                {filteredProducts.map((p) => {
                  if (!p) return null;
                  const isSelected = selectedProductIds.includes(p.id);
                  const pNameKey = p.name ? p.name.trim().toLowerCase() : '';
                  const isDuplicate = pNameKey ? duplicateGroups.has(pNameKey) : false;
                  const dupCount = pNameKey ? duplicateGroups.get(pNameKey)?.length || 0 : 0;
                  const hasOrders = isProductOrdered(p);
                  const orderCount = getProductOrderCount(p);
                  const isOutOfStock = (p.stockUnits ?? 0) === 0;
                  const isReorderLevel = !isOutOfStock && ((p.stockUnits ?? 0) <= (p.reorderLevel ?? lowStockThreshold) || (p.stockUnits ?? 0) < lowStockThreshold);
                  const isHighDemandReorder = isReorderLevel && !!p.isHighDemand;

                  return (
                    <tr
                      key={p.id}
                      id={`product-row-${p.id}`}
                      data-testid={`product-row-${p.id}`}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 hover:bg-blue-100/60'
                          : isOutOfStock
                          ? 'bg-rose-50/60 hover:bg-rose-100/60 border-l-4 border-l-rose-500'
                          : isHighDemandReorder
                          ? 'bg-amber-50/70 hover:bg-amber-100/70 border-l-4 border-l-orange-500'
                          : isReorderLevel
                          ? 'bg-amber-50/50 hover:bg-amber-100/60 border-l-4 border-l-amber-500'
                          : isDuplicate
                          ? 'bg-amber-50/30 hover:bg-amber-100/40 border-l-4 border-l-amber-400'
                          : p.hiddenFromRep
                          ? 'bg-amber-50/20 hover:bg-slate-50/70'
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

                      {/* 1. Product Name & Packaging Photo */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-heading text-sm whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {/* Product Packaging Photo Preview in PhotoModal or Attach Photo */}
                          {p.imageUrl ? (
                            <button
                              type="button"
                              id={`product-photo-btn-${p.id}`}
                              data-testid={`product-photo-btn-${p.id}`}
                              onClick={() => setPreviewPhotoUrl(p.imageUrl!)}
                              title={`View photo of ${p.name} in PhotoModal`}
                              className="relative group shrink-0 w-9 h-9 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500 shadow-2xs cursor-pointer bg-white"
                            >
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye size={14} weight="bold" />
                              </div>
                            </button>
                          ) : (
                            <button
                              type="button"
                              id={`attach-photo-cell-btn-${p.id}`}
                              data-testid={`attach-photo-cell-btn-${p.id}`}
                              onClick={() => {
                                setAttachingPhotoProduct(p);
                                setQuickPhotoInputUrl('');
                              }}
                              title="Attach visual photo for this product"
                              className="shrink-0 w-9 h-9 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Camera size={16} weight="duotone" />
                            </button>
                          )}

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="hover:text-blue-600 transition-colors">{p.name}</span>

                              {/* Product Expiry Shelf Life Badge */}
                              {(() => {
                                const expirySummary = evaluateProductExpiry(p);
                                if (expirySummary.highestUrgency === 'expired') {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedBatchProduct(p);
                                        setIsBatchModalOpen(true);
                                      }}
                                      title={`Expired batch alert: Batch ${expirySummary.earliestBatch?.batchNumber} expired on ${expirySummary.earliestBatch?.expiryDateStr}. Click to manage batches.`}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full cursor-pointer hover:bg-rose-200 transition-colors"
                                    >
                                      <HourglassMedium size={11} weight="fill" className="text-rose-600" />
                                      <span>Exp: {expirySummary.earliestBatch?.expiryDateStr} (Expired)</span>
                                    </button>
                                  );
                                }
                                if (expirySummary.highestUrgency === 'critical') {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedBatchProduct(p);
                                        setIsBatchModalOpen(true);
                                      }}
                                      title={`Critical shelf-life: ${expirySummary.earliestBatch?.daysRemaining} days remaining (Batch ${expirySummary.earliestBatch?.batchNumber}). Click to audit batches.`}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full cursor-pointer hover:bg-amber-200 transition-colors"
                                    >
                                      <ClockCountdown size={11} weight="fill" className="text-amber-600" />
                                      <span>Exp: {expirySummary.earliestBatch?.expiryDateStr} (&le;30d)</span>
                                    </button>
                                  );
                                }
                                if (expirySummary.highestUrgency === 'near_term') {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedBatchProduct(p);
                                        setIsBatchModalOpen(true);
                                      }}
                                      title={`Near-term expiry: ${expirySummary.earliestBatch?.daysRemaining} days remaining. Click to manage batches.`}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-100 transition-colors"
                                    >
                                      <HourglassMedium size={10} weight="bold" className="text-amber-600" />
                                      <span>Exp: {expirySummary.earliestBatch?.expiryDateStr} (1-3m)</span>
                                    </button>
                                  );
                                }
                                return null;
                              })()}

                              {/* Out of Stock Warning Badge */}
                            {isOutOfStock && (
                              <span
                                title={`Critical Alert: 0 units in warehouse! Formulation is completely depleted.`}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full animate-pulse shadow-2xs"
                              >
                                <Warning size={12} weight="fill" className="text-rose-600" />
                                Out of Stock (0 units)
                              </span>
                            )}

                            {/* Specific High Demand Re-Order Warning Badge */}
                            {isHighDemandReorder && (
                              <span
                                title={`🔥 High-Demand Formulation: Re-order level reached (${(p.stockUnits ?? 0).toLocaleString()} units left <= safety point of ${p.reorderLevel ?? lowStockThreshold} units). Automated alert dispatched to procurement.`}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-950 bg-amber-200/90 border border-amber-400 px-2 py-0.5 rounded-full shadow-2xs"
                              >
                                <Fire size={12} weight="fill" className="text-orange-600" />
                                High-Demand Re-Order ({(p.stockUnits ?? 0).toLocaleString()} &le; {p.reorderLevel ?? lowStockThreshold})
                              </span>
                            )}

                            {/* Standard Re-Order Warning Badge (separate from out of stock) */}
                            {isReorderLevel && !isHighDemandReorder && (
                              <span
                                title={`Re-Order Level Reached: ${(p.stockUnits ?? 0).toLocaleString()} units left, which is at or below the predefined threshold of ${p.reorderLevel ?? lowStockThreshold} units.`}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs"
                              >
                                <Warning size={12} weight="fill" className="text-amber-600" />
                                Re-Order Level: {(p.stockUnits ?? 0).toLocaleString()} &le; {p.reorderLevel ?? lowStockThreshold}
                              </span>
                            )}

                            {/* High demand flag on healthy formulations */}
                            {!isOutOfStock && !isReorderLevel && p.isHighDemand && (
                              <span
                                title="Specific high-demand formulation with automated re-order alerting enabled"
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded"
                              >
                                <Fire size={11} weight="fill" className="text-orange-500" />
                                High Demand
                              </span>
                            )}

                            {/* Duplicate Badge */}
                            {isDuplicate && (
                              <span
                                title={`${dupCount} formulations have this exact product name. Click Merge/Remove to resolve.`}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full"
                              >
                                <Warning size={12} weight="fill" className="text-amber-600" />
                                Duplicate ({dupCount})
                              </span>
                            )}

                            {/* Placed Orders Protection Badge */}
                            {hasOrders && (
                              <span
                                title={`An order has been placed on this formulation (${orderCount} order instances). By compliance policy, it can never be deleted from the database.`}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"
                              >
                                <Package size={12} weight="fill" className="text-blue-600" />
                                Has Orders ({orderCount})
                              </span>
                            )}

                            {/* Merged Status */}
                            {p.status === 'merged' && (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                Merged & Archived
                              </span>
                            )}

                            {/* Hidden from rep */}
                            {p.hiddenFromRep && (
                              <span
                                title="Product is hidden from sales rep in the field catalog"
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100/70 border border-amber-200 px-1.5 py-0.5 rounded"
                              >
                                <EyeSlash size={12} weight="bold" />
                                Hidden
                              </span>
                            )}
                          </div>

                          {/* Quick Merge button for duplicate rows */}
                          {isDuplicate && (
                            <div className="pt-0.5">
                              <button
                                type="button"
                                data-testid={`merge-btn-${p.id}`}
                                onClick={() => setMergeModalProductName(p.name)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                                title="Merge or remove duplicate formulations with this name"
                              >
                                <GitMerge size={12} weight="bold" />
                                <span>Merge / Remove Duplicate</span>
                              </button>
                            </div>
                          )}
                        </div>
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
                        ₹{Number(p.mrp || 0).toFixed(2)}
                      </td>

                      {/* 6. Pricing to Stockist - ONLY populated if entered by admin; strictly blank (—) otherwise */}
                      <td className="py-3.5 px-3 text-right tabular-nums text-emerald-700 font-medium whitespace-nowrap bg-emerald-50/25">
                        {p.pricingToStockist !== undefined && p.pricingToStockist !== null && Number(p.pricingToStockist) > 0 ? (
                          `₹${Number(p.pricingToStockist).toFixed(2)}`
                        ) : (
                          <span className="text-slate-300 font-normal select-none" title="No Stockist Price entered by admin">—</span>
                        )}
                      </td>

                      {/* 7. Pricing to Retailer - ONLY populated if entered by admin; strictly blank (—) otherwise */}
                      <td className="py-3.5 px-3 text-right tabular-nums text-teal-700 font-medium whitespace-nowrap bg-teal-50/25">
                        {p.pricingToRetailer !== undefined && p.pricingToRetailer !== null && Number(p.pricingToRetailer) > 0 ? (
                          `₹${Number(p.pricingToRetailer).toFixed(2)}`
                        ) : (
                          <span className="text-slate-300 font-normal select-none" title="No Retailer Price entered by admin">—</span>
                        )}
                      </td>

                      {/* 8. Selling Price - ONLY populated if entered by admin; strictly blank (—) otherwise */}
                      <td className="py-3.5 px-3 text-right tabular-nums text-blue-700 font-bold whitespace-nowrap">
                        {p.sellingRate !== undefined && p.sellingRate !== null && Number(p.sellingRate) > 0 ? (
                          `₹${Number(p.sellingRate).toFixed(2)}`
                        ) : (
                          <span className="text-slate-300 font-normal select-none" title="No Selling Price entered by admin">—</span>
                        )}
                      </td>

                      {/* 9. Purchase Price */}
                      <td className="py-3.5 px-3 text-right tabular-nums text-slate-500 whitespace-nowrap">
                        {p.purchasePrice !== undefined && p.purchasePrice !== null && Number(p.purchasePrice) > 0 ? (
                          `₹${Number(p.purchasePrice).toFixed(2)}`
                        ) : (
                          <span className="text-slate-300 font-normal select-none">—</span>
                        )}
                      </td>

                      {/* 10. GST */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap font-medium text-slate-700">
                        {formatGst(p.gst)}
                      </td>

                      {/* 11. Company */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-800">
                        <span className="inline-flex items-center gap-1.5">
                          <Buildings size={14} className="text-slate-400" />
                          <span>{p.company || 'DDB DRUG CHEM'}</span>
                        </span>
                      </td>

                      {/* 12. Category - ONLY populated if entered by admin; strictly blank (—) otherwise */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {p.category && p.category.trim() && p.category.trim() !== '-' && p.category.trim().toLowerCase() !== 'general' ? (
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(p.category!)}
                            title={`Click to filter by ${p.category}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                          >
                            <Tag size={12} weight="bold" className="text-blue-500" />
                            <span>{p.category}</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 font-normal select-none px-2" title="No Category entered by admin">—</span>
                        )}
                      </td>

                      {/* 13. Clinical Speciality / Medical Division */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {p.clinicalSpeciality && p.clinicalSpeciality.trim() && p.clinicalSpeciality.trim() !== '-' ? (
                          <button
                            type="button"
                            onClick={() => setSelectedClinicalSpeciality(p.clinicalSpeciality!)}
                            title={`Click to filter by ${p.clinicalSpeciality}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer"
                          >
                            <Stethoscope size={12} weight="bold" className="text-purple-600" />
                            <span>{p.clinicalSpeciality}</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 font-normal select-none px-2" title="No Clinical Speciality entered by admin">—</span>
                        )}
                      </td>

                      {/* 14. Stock Level & Warning System (Distinguishes Out of Stock vs Re-Order) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isOutOfStock ? (
                            <span
                              title={`Critical: 0 units available! Immediate procurement requisition required.`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs animate-pulse"
                            >
                              <Warning size={13} weight="fill" className="text-rose-600" />
                              <span>0 Units (Out of Stock)</span>
                            </span>
                          ) : isHighDemandReorder ? (
                            <span
                              title={`High-Demand Alert: ${(p.stockUnits ?? 0).toLocaleString()} units left (Re-order point: ${p.reorderLevel ?? lowStockThreshold} units). Urgent procurement requisition required.`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-950 border border-amber-400 shadow-2xs"
                            >
                              <Fire size={13} weight="fill" className="text-orange-600" />
                              <span>{(p.stockUnits ?? 0).toLocaleString()} Units (Re-Order)</span>
                            </span>
                          ) : isReorderLevel ? (
                            <span
                              title={`Re-Order Level Reached: ${(p.stockUnits ?? 0).toLocaleString()} units remaining (Safety point: ${p.reorderLevel ?? lowStockThreshold} units).`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs"
                            >
                              <Warning size={13} weight="fill" className="text-amber-600" />
                              <span>{(p.stockUnits ?? 0).toLocaleString()} Units (Re-Order)</span>
                            </span>
                          ) : (
                            <span
                              title={`Healthy depot stock: ${(p.stockUnits ?? 0).toLocaleString()} units (Threshold: ${lowStockThreshold})`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                            >
                              <CheckCircle size={13} weight="fill" className="text-emerald-600" />
                              <span>{(p.stockUnits ?? 0).toLocaleString()} Units</span>
                            </span>
                          )}

                          {/* Quick Replenish Button for depleted or re-order stock */}
                          {(isOutOfStock || isReorderLevel) && (
                            <button
                              type="button"
                              onClick={() => {
                                const addAmount = 500;
                                const newStock = (p.stockUnits ?? 0) + addAmount;
                                const reorderThresh = p.reorderLevel ?? lowStockThreshold;
                                const newStatus = newStock === 0 ? 'out_of_stock' : newStock <= reorderThresh ? 'low_stock' : 'active';
                                updateProduct(p.id, {
                                  stockUnits: newStock,
                                  status: newStatus as any
                                });
                                toast.success(`Replenished +${addAmount} units for "${p.name}" (Current Stock: ${newStock.toLocaleString()} units)`);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
                              title="Quick replenish +500 warehouse units"
                            >
                              +500
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Photo Icon - Attach or view photo in PhotoModal */}
                          <button
                            id={`action-photo-${p.id}`}
                            data-testid={`action-photo-${p.id}`}
                            onClick={() => {
                              if (p.imageUrl) {
                                setPreviewPhotoUrl(p.imageUrl);
                              } else {
                                setAttachingPhotoProduct(p);
                                setQuickPhotoInputUrl('');
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              p.imageUrl
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title={p.imageUrl ? 'View product photo in PhotoModal' : 'Attach product photo'}
                          >
                            <Camera size={16} weight={p.imageUrl ? 'fill' : 'regular'} />
                          </button>

                          {/* Batch & Expiry Management Icon */}
                          <button
                            id={`action-batches-${p.id}`}
                            data-testid={`action-batches-${p.id}`}
                            onClick={() => {
                              setSelectedBatchProduct(p);
                              setIsBatchModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Manage batches and expiry dates"
                          >
                            <HourglassMedium size={16} />
                          </button>

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

                          {/* Trash Icon or Locked Icon if Placed Orders */}
                          {hasOrders ? (
                            <button
                              type="button"
                              disabled
                              data-testid={`delete-product-locked-${p.id}`}
                              className="p-1.5 text-slate-300 bg-slate-50 border border-slate-200/80 rounded-lg cursor-not-allowed"
                              title={`Cannot delete "${p.name}": Placed orders exist for this formulation (${orderCount} order instances). By compliance policy, it can never be deleted from the database.`}
                            >
                              <Lock size={16} weight="bold" className="text-slate-400" />
                            </button>
                          ) : (
                            <button
                              id={`delete-product-${p.id}`}
                              data-testid={`delete-product-${p.id}`}
                              onClick={() => deleteProduct(p.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete formulation"
                            >
                              <Trash size={16} />
                            </button>
                          )}
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
      </>
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
                    12. Category / Speciality (Optional)
                  </label>
                  <input
                    type="text"
                    list="new-speciality-options"
                    data-testid="input-product-category"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    placeholder="Leave blank if unassigned"
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

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-900 mb-1 flex items-center justify-between">
                    <span>13. Clinical Speciality / Medical Division (Optional)</span>
                    <span className="text-[10px] text-purple-600 font-normal">e.g. Paediatric, Gynaecology</span>
                  </label>
                  <input
                    type="text"
                    list="new-clinical-speciality-options"
                    data-testid="input-product-clinical-speciality"
                    value={newProdClinicalSpeciality}
                    onChange={(e) => setNewProdClinicalSpeciality(e.target.value)}
                    placeholder="e.g. Paediatric, Gynaecology, General Medicine..."
                    className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  />
                  <datalist id="new-clinical-speciality-options">
                    {allClinicalSpecialities.map((spec) => (
                      <option key={spec} value={spec} />
                    ))}
                  </datalist>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span className="text-[10px] text-purple-600 font-medium">Quick pick:</span>
                    {['Paediatric', 'Gynaecology', 'General Medicine', 'Cardiology', 'Orthopaedics', 'Dermatology'].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setNewProdClinicalSpeciality(s)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100/70 hover:bg-purple-200 hover:text-purple-900 text-purple-800 transition-colors cursor-pointer"
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
                        data-testid="input-product-pts"
                        placeholder="Optional"
                        value={newProdPricingToStockist}
                        onChange={(e) => setNewProdPricingToStockist(e.target.value)}
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
                        data-testid="input-product-ptr"
                        placeholder="Optional"
                        value={newProdPricingToRetailer}
                        onChange={(e) => setNewProdPricingToRetailer(e.target.value)}
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
                        placeholder="Optional"
                        value={newProdSellingRate}
                        onChange={(e) => setNewProdSellingRate(e.target.value)}
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
                        placeholder="Optional"
                        value={newProdPurchasePrice}
                        onChange={(e) => setNewProdPurchasePrice(e.target.value)}
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
                      {Number(newProdPricingToRetailer) > 0 && Number(newProdPricingToStockist) > 0
                        ? (((Number(newProdPricingToRetailer) - Number(newProdPricingToStockist)) / Number(newProdPricingToRetailer)) * 100).toFixed(1)
                        : '0'}
                      %
                    </strong>
                  </span>
                  <span className="text-slate-600">
                    Wholesale Profit Margin:{' '}
                    <strong className="text-emerald-700 tabular-nums">
                      {Number(newProdSellingRate) > 0
                        ? (((Number(newProdSellingRate) - Number(newProdPurchasePrice || 0)) / Number(newProdSellingRate)) * 100).toFixed(1)
                        : '0'}
                      %
                    </strong>
                  </span>
                  <span className="text-slate-600">
                    Retailer Margin:{' '}
                    <strong className="text-blue-700 tabular-nums">
                      {newProdMrp > 0 && Number(newProdSellingRate) > 0 ? (((newProdMrp - Number(newProdSellingRate)) / newProdMrp) * 100).toFixed(1) : '0'}%
                    </strong>
                  </span>
                </div>
              </div>

              {/* Product Packaging Photo Attachment */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Camera size={16} weight="bold" className="text-blue-600" />
                    <span>Product Packaging Photo (Optional)</span>
                  </span>
                  {newProdImageUrl && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Photo Attached
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-8 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={newProdImageUrl}
                        onChange={(e) => setNewProdImageUrl(e.target.value)}
                        placeholder="Paste image URL (https://...)"
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <label className="shrink-0 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors">
                        <UploadSimple size={14} weight="bold" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUploadToDataUrl(file, setNewProdImageUrl);
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium">Quick sample presets:</span>
                      {SAMPLE_PHARMA_PHOTOS.map((p) => (
                        <button
                          type="button"
                          key={p.name}
                          onClick={() => setNewProdImageUrl(p.url)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 text-slate-600 transition-colors cursor-pointer"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-4 flex items-center justify-center sm:justify-end">
                    {newProdImageUrl ? (
                      <div className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white">
                        <img src={newProdImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(newProdImageUrl)}
                            className="p-1 text-white hover:text-blue-300 cursor-pointer"
                            title="Preview in PhotoModal"
                          >
                            <Eye size={16} weight="bold" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewProdImageUrl('')}
                            className="p-1 text-white hover:text-red-300 cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-100/60 flex flex-col items-center justify-center text-slate-400">
                        <Image size={20} weight="duotone" />
                        <span className="text-[9px] mt-0.5">No photo</span>
                      </div>
                    )}
                  </div>
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
                    12. Category / Speciality (Optional)
                  </label>
                  <input
                    type="text"
                    list="edit-speciality-options"
                    data-testid="edit-input-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Leave blank if unassigned"
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

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-900 mb-1 flex items-center justify-between">
                    <span>13. Clinical Speciality / Medical Division (Optional)</span>
                    <span className="text-[10px] text-purple-600 font-normal">e.g. Paediatric, Gynaecology</span>
                  </label>
                  <input
                    type="text"
                    list="edit-clinical-speciality-options"
                    data-testid="edit-input-clinical-speciality"
                    value={editClinicalSpeciality}
                    onChange={(e) => setEditClinicalSpeciality(e.target.value)}
                    placeholder="e.g. Paediatric, Gynaecology, General Medicine..."
                    className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  />
                  <datalist id="edit-clinical-speciality-options">
                    {allClinicalSpecialities.map((spec) => (
                      <option key={spec} value={spec} />
                    ))}
                  </datalist>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span className="text-[10px] text-purple-600 font-medium">Quick pick:</span>
                    {['Paediatric', 'Gynaecology', 'General Medicine', 'Cardiology', 'Orthopaedics', 'Dermatology'].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setEditClinicalSpeciality(s)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100/70 hover:bg-purple-200 hover:text-purple-900 text-purple-800 transition-colors cursor-pointer"
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
                        data-testid="edit-input-pts"
                        placeholder="Optional"
                        value={editPricingToStockist}
                        onChange={(e) => setEditPricingToStockist(e.target.value)}
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
                        data-testid="edit-input-ptr"
                        placeholder="Optional"
                        value={editPricingToRetailer}
                        onChange={(e) => setEditPricingToRetailer(e.target.value)}
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
                        data-testid="edit-input-selling-rate"
                        placeholder="Optional"
                        value={editSellingRate}
                        onChange={(e) => setEditSellingRate(e.target.value)}
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
                        data-testid="edit-input-purchase-price"
                        placeholder="Optional"
                        value={editPurchasePrice}
                        onChange={(e) => setEditPurchasePrice(e.target.value)}
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
                      {Number(editPricingToRetailer) > 0 && Number(editPricingToStockist) > 0
                        ? (((Number(editPricingToRetailer) - Number(editPricingToStockist)) / Number(editPricingToRetailer)) * 100).toFixed(1)
                        : '0'}
                      %
                    </strong>
                  </span>
                  <span className="text-slate-600">
                    Wholesale Profit Margin:{' '}
                    <strong className="text-emerald-700 tabular-nums">
                      {Number(editSellingRate) > 0
                        ? (((Number(editSellingRate) - Number(editPurchasePrice || 0)) / Number(editSellingRate)) * 100).toFixed(1)
                        : '0'}
                      %
                    </strong>
                  </span>
                  <span className="text-slate-600">
                    Retailer Margin:{' '}
                    <strong className="text-blue-700 tabular-nums">
                      {editMrp > 0 && Number(editSellingRate) > 0 ? (((editMrp - Number(editSellingRate)) / editMrp) * 100).toFixed(1) : '0'}%
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

              {/* Product Packaging Photo Attachment */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Camera size={16} weight="bold" className="text-blue-600" />
                    <span>Product Packaging Photo</span>
                  </span>
                  {editImageUrl && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Photo Attached
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-8 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        placeholder="Paste image URL (https://...)"
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <label className="shrink-0 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors">
                        <UploadSimple size={14} weight="bold" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUploadToDataUrl(file, setEditImageUrl);
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium">Quick sample presets:</span>
                      {SAMPLE_PHARMA_PHOTOS.map((p) => (
                        <button
                          type="button"
                          key={p.name}
                          onClick={() => setEditImageUrl(p.url)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 text-slate-600 transition-colors cursor-pointer"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-4 flex items-center justify-center sm:justify-end">
                    {editImageUrl ? (
                      <div className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white">
                        <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(editImageUrl)}
                            className="p-1 text-white hover:text-blue-300 cursor-pointer"
                            title="Preview in PhotoModal"
                          >
                            <Eye size={16} weight="bold" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditImageUrl('')}
                            className="p-1 text-white hover:text-red-300 cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-100/60 flex flex-col items-center justify-center text-slate-400">
                        <Image size={20} weight="duotone" />
                        <span className="text-[9px] mt-0.5">No photo</span>
                      </div>
                    )}
                  </div>
                </div>
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
        existingCategories={categories}
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

      {/* Merge & Resolve Duplicates Modal */}
      <MergeProductsModal
        isOpen={!!mergeModalProductName}
        productName={mergeModalProductName || ''}
        onClose={() => setMergeModalProductName(null)}
      />

      {/* Batch Edit Pricing & Stock Levels Modal */}
      <BatchEditModal
        isOpen={isBatchEditModalOpen}
        onClose={() => setIsBatchEditModalOpen(false)}
        selectedProducts={selectedProductsList}
      />

      {/* Dedicated Bulk Inventory Adjuster Modal */}
      <BulkInventoryAdjusterModal
        isOpen={isInventoryAdjusterModalOpen}
        onClose={() => setIsInventoryAdjusterModalOpen(false)}
        selectedProducts={selectedProductsList}
      />

      {/* Batch & Expiry Management Modal */}
      <BatchManagementModal
        product={selectedBatchProduct}
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setSelectedBatchProduct(null);
        }}
      />

      {/* Quick Attach Photo Modal */}
      {attachingPhotoProduct && (
        <div
          id="attach-photo-modal-backdrop"
          data-testid="attach-photo-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setAttachingPhotoProduct(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 block">
                  Product Visual Verification
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  {attachingPhotoProduct.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Attach or update packaging photo. Viewed via the PhotoModal integration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAttachingPhotoProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image URL or Local Upload
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={quickPhotoInputUrl}
                    onChange={(e) => setQuickPhotoInputUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <label className="shrink-0 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors">
                    <UploadSimple size={14} weight="bold" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUploadToDataUrl(file, setQuickPhotoInputUrl);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Or pick a pharma sample preset:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {SAMPLE_PHARMA_PHOTOS.map((sample) => (
                    <button
                      type="button"
                      key={sample.name}
                      onClick={() => setQuickPhotoInputUrl(sample.url)}
                      className="px-2.5 py-1.5 text-xs text-left rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Image size={14} className="text-slate-400" />
                      <span className="truncate">{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {quickPhotoInputUrl && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                      <img src={quickPhotoInputUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Photo Attached</span>
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(quickPhotoInputUrl)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer mt-0.5"
                      >
                        <Eye size={12} weight="bold" />
                        <span>Preview in PhotoModal</span>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickPhotoInputUrl('')}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAttachingPhotoProduct(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="save-attached-photo-btn"
                data-testid="save-attached-photo-btn"
                onClick={() => {
                  if (attachingPhotoProduct) {
                    const updated = {
                      ...attachingPhotoProduct,
                      imageUrl: quickPhotoInputUrl.trim() || undefined
                    };
                    updateProduct(updated);
                    toast.success(`Photo updated for "${attachingPhotoProduct.name}"`);
                    setAttachingPhotoProduct(null);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

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
            {/* Primary Batch Edit Button */}
            <button
              type="button"
              id="pill-btn-batch-edit"
              data-testid="pill-btn-batch-edit"
              onClick={() => setIsBatchEditModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Simultaneously update pricing or stock levels"
            >
              <PencilSimpleLine size={14} weight="bold" />
              <span>Batch Edit Pricing &amp; Stock</span>
            </button>

            <button
              type="button"
              id="pill-btn-show-reps"
              data-testid="pill-btn-show-reps"
              onClick={() => handleBulkSetVisibility(false)}
              className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
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
