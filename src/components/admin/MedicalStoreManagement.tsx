import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { RetailCounter, Product } from '../../types';
import {
  Storefront,
  Plus,
  MagnifyingGlass,
  Funnel,
  PencilSimple,
  Trash,
  Phone,
  MapPin,
  FileText,
  CurrencyInr,
  CheckCircle,
  Tag,
  Package,
  Calendar,
  X,
  DownloadSimple,
  ShoppingCart,
  Buildings,
  Receipt,
  User,
  ShieldCheck,
  ArrowsClockwise,
  CreditCard,
  Percent,
  Sparkle,
  Stethoscope,
  UserCheck,
  UploadSimple
} from '@phosphor-icons/react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { downloadMedicalStoreExcelTemplate } from '../../utils/medicalStoreExcelHelper';
import { MedicalStoreExcelImportModal } from './MedicalStoreExcelImportModal';

type StoreTypeFilter = 'all' | 'retail_chemist' | 'wholesale_chemist' | 'hospital_pharmacy' | 'clinic_counter' | 'chain_pharmacy';

export const MedicalStoreManagement: React.FC = () => {
  const {
    retailCounters,
    addRetailCounter,
    updateRetailCounter,
    deleteRetailCounter,
    products,
    reps,
    orders,
    doctors,
    addDoctor,
    updateDoctor,
    setActiveAdminTab,
    addAuditLog
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<StoreTypeFilter>('all');
  const [territoryFilter, setTerritoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<RetailCounter | null>(null);

  // Direct Order Booking Modal state
  const [isDirectOrderModalOpen, setIsDirectOrderModalOpen] = useState(false);
  const [directOrderStore, setDirectOrderStore] = useState<RetailCounter | null>(null);
  const [directOrderItems, setDirectOrderItems] = useState<{ productId: string; qty: number; price: number }[]>([
    { productId: products[0]?.id || '', qty: 10, price: products[0]?.pricingToRetailer || products[0]?.mrp || 100 }
  ]);
  const [directOrderDiscountPct, setDirectOrderDiscountPct] = useState<number>(0);
  const [directOrderPaymentTerm, setDirectOrderPaymentTerm] = useState<string>('Net 15 Days');

  // Add / Edit Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<RetailCounter['type']>('retail_chemist');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formTerritory, setFormTerritory] = useState('');
  const [formAssignedRepId, setFormAssignedRepId] = useState('');
  const [formDlNo, setFormDlNo] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formCreditDays, setFormCreditDays] = useState('15');
  const [formCreditLimit, setFormCreditLimit] = useState('100000');
  const [formDirectDiscount, setFormDirectDiscount] = useState('5');
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 15 Days');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<RetailCounter['status']>('active');

  // Conditional Fields for Hospital Pharmacy and Clinic Counter
  const [formHospitalName, setFormHospitalName] = useState('');
  const [formClinicName, setFormClinicName] = useState('');
  const [formLinkedDoctorIds, setFormLinkedDoctorIds] = useState<string[]>([]);
  const [formLinkedDoctorNames, setFormLinkedDoctorNames] = useState<string[]>([]);
  const [customDoctorInput, setCustomDoctorInput] = useState('');

  // Store Type Counts for quick-filter tabs
  const storeTypeCounts = useMemo(() => {
    return {
      all: retailCounters.length,
      wholesale_chemist: retailCounters.filter(s => s.type === 'wholesale_chemist').length,
      retail_chemist: retailCounters.filter(s => s.type === 'retail_chemist').length,
      hospital_pharmacy: retailCounters.filter(s => s.type === 'hospital_pharmacy').length,
      clinic_counter: retailCounters.filter(s => s.type === 'clinic_counter').length,
      chain_pharmacy: retailCounters.filter(s => s.type === 'chain_pharmacy').length,
    };
  }, [retailCounters]);

  // Filtered Medical Stores
  const filteredStores = useMemo(() => {
    return retailCounters.filter(store => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        store.name.toLowerCase().includes(q) ||
        store.contactPerson.toLowerCase().includes(q) ||
        store.phone.includes(q) ||
        store.area.toLowerCase().includes(q) ||
        store.city.toLowerCase().includes(q) ||
        store.drugLicenseNo.toLowerCase().includes(q) ||
        store.gstin.toLowerCase().includes(q);

      const matchesType = typeFilter === 'all' || store.type === typeFilter;
      const matchesTerritory = territoryFilter === 'all' || store.territory === territoryFilter;
      const matchesStatus = statusFilter === 'all' || store.status === statusFilter;

      return matchesSearch && matchesType && matchesTerritory && matchesStatus;
    });
  }, [retailCounters, searchTerm, typeFilter, territoryFilter, statusFilter]);

  // Aggregate Metrics
  const totalStores = retailCounters.length;
  const totalDirectRevenue = useMemo(() => {
    return retailCounters.reduce((sum, s) => sum + (s.totalMonthlyRevenue || 0), 0);
  }, [retailCounters]);
  const highVolumeStoresCount = retailCounters.filter(s => s.status === 'high_volume' || s.type === 'hospital_pharmacy').length;
  const avgCreditDays = Math.round(
    retailCounters.reduce((sum, s) => sum + (s.creditDays || 15), 0) / (totalStores || 1)
  );

  // Available unique territories
  const uniqueTerritories = useMemo(() => {
    const set = new Set<string>();
    retailCounters.forEach(s => {
      if (s.territory) set.add(s.territory);
    });
    reps.forEach(r => {
      if (r.territory) set.add(r.territory);
    });
    return Array.from(set);
  }, [retailCounters, reps]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingStore(null);
    setFormName('');
    setFormType('retail_chemist');
    setFormContactPerson('');
    setFormPhone('+91 ');
    setFormAddress('');
    setFormArea('');
    setFormCity('New Delhi');
    setFormTerritory(uniqueTerritories[0] || 'Central & South Medical Belt');
    setFormAssignedRepId(reps[0]?.id || '');
    setFormDlNo('DL-20B-');
    setFormGstin('07AABC');
    setFormCreditDays('15');
    setFormCreditLimit('100000');
    setFormDirectDiscount('5');
    setFormPaymentTerms('Net 15 Days');
    setFormNotes('');
    setFormStatus('active');
    setFormHospitalName('');
    setFormClinicName('');
    setFormLinkedDoctorIds([]);
    setFormLinkedDoctorNames([]);
    setCustomDoctorInput('');
    setIsAddEditModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (store: RetailCounter) => {
    setEditingStore(store);
    setFormName(store.name);
    setFormType(store.type);
    setFormContactPerson(store.contactPerson);
    setFormPhone(store.phone);
    setFormAddress(store.address);
    setFormArea(store.area);
    setFormCity(store.city);
    setFormTerritory(store.territory);
    setFormAssignedRepId(store.assignedRepId || '');
    setFormDlNo(store.drugLicenseNo || '');
    setFormGstin(store.gstin || '');
    setFormCreditDays(String(store.creditDays ?? 15));
    setFormCreditLimit(String(store.creditLimit ?? 100000));
    setFormDirectDiscount(String(store.directDiscountPct ?? 5));
    setFormPaymentTerms(store.preferredPaymentTerms || 'Net 15 Days');
    setFormNotes(store.notes || '');
    setFormStatus(store.status);
    setFormHospitalName(store.hospitalName || '');
    setFormClinicName(store.clinicName || '');
    setFormLinkedDoctorIds(store.linkedDoctorIds || []);
    setFormLinkedDoctorNames(store.linkedDoctorNames || []);
    setCustomDoctorInput('');
    setIsAddEditModalOpen(true);
  };

  // Save Add/Edit Store
  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Store name is required');
      return;
    }

    if (formType === 'hospital_pharmacy' && !formHospitalName.trim()) {
      toast.error('Please enter the Hospital Name');
      return;
    }

    if (formType === 'clinic_counter' && !formClinicName.trim()) {
      toast.error('Please enter the Clinic Name');
      return;
    }

    const assignedRep = reps.find(r => r.id === formAssignedRepId);
    const repName = assignedRep ? assignedRep.name : 'Direct Depot Delivery (No Rep)';

    // Compile doctor names from selected IDs and typed custom names
    const namesFromIds = formLinkedDoctorIds.map(id => {
      const d = doctors.find(doc => doc.id === id);
      return d ? d.name : '';
    }).filter(Boolean);

    const mergedDoctorNames = Array.from(new Set([...namesFromIds, ...formLinkedDoctorNames]));

    const storePayload = {
      name: formName.trim(),
      type: formType,
      contactPerson: formContactPerson.trim(),
      phone: formPhone.trim(),
      address: formAddress.trim(),
      area: formArea.trim(),
      city: formCity.trim(),
      territory: formTerritory.trim(),
      assignedRepId: formAssignedRepId,
      assignedRepName: repName,
      drugLicenseNo: formDlNo.trim(),
      gstin: formGstin.trim(),
      hospitalName: formType === 'hospital_pharmacy' ? formHospitalName.trim() : undefined,
      clinicName: formType === 'clinic_counter' ? formClinicName.trim() : undefined,
      linkedDoctorIds: (formType === 'hospital_pharmacy' || formType === 'clinic_counter') ? formLinkedDoctorIds : [],
      linkedDoctorNames: (formType === 'hospital_pharmacy' || formType === 'clinic_counter') ? mergedDoctorNames : [],
      creditDays: Number(formCreditDays) || 15,
      creditLimit: Number(formCreditLimit) || 100000,
      directDiscountPct: Number(formDirectDiscount) || 0,
      preferredPaymentTerms: formPaymentTerms,
      notes: formNotes.trim(),
      status: formStatus,
      isDirectSaleEligible: true
    };

    let targetStoreId = editingStore?.id || '';

    if (editingStore) {
      updateRetailCounter(editingStore.id, storePayload);
      toast.success(`Updated store "${formName.trim()}"`);
    } else {
      targetStoreId = `counter-${Date.now()}`;
      addRetailCounter({
        ...storePayload,
        productsSold: [],
        totalMonthlyRevenue: 0
      });
      toast.success(`Registered new medical store "${formName.trim()}"`);
    }

    // Bidirectional link: update associated doctors in Doctor's List
    if (formType === 'hospital_pharmacy' || formType === 'clinic_counter') {
      // 1. Update doctors selected by ID
      formLinkedDoctorIds.forEach(docId => {
        updateDoctor(docId, {
          attachedPharmacyId: targetStoreId,
          attachedPharmacyName: formName.trim(),
          attachedPharmacyType: formType,
          attachedHospitalName: formType === 'hospital_pharmacy' ? formHospitalName.trim() : undefined,
          attachedClinicName: formType === 'clinic_counter' ? formClinicName.trim() : undefined
        });
      });

      // 2. Update or auto-register doctors entered by custom name
      formLinkedDoctorNames.forEach(docName => {
        const trimmed = docName.trim();
        if (!trimmed) return;
        const existing = doctors.find(d => d.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) {
          updateDoctor(existing.id, {
            attachedPharmacyId: targetStoreId,
            attachedPharmacyName: formName.trim(),
            attachedPharmacyType: formType,
            attachedHospitalName: formType === 'hospital_pharmacy' ? formHospitalName.trim() : undefined,
            attachedClinicName: formType === 'clinic_counter' ? formClinicName.trim() : undefined
          });
        } else {
          // Auto-register in Doctor's List
          addDoctor({
            name: trimmed,
            specialty: formType === 'hospital_pharmacy' ? 'Hospital Consultant (MD)' : 'Consultant Physician (MBBS, MD)',
            clinicName: formType === 'hospital_pharmacy' ? formHospitalName.trim() : formClinicName.trim(),
            address: formAddress.trim() || 'Medical Facility Campus',
            city: formCity.trim() || 'Mumbai',
            area: formArea.trim() || 'Central Zone',
            phone: formPhone.trim() || '+91 98000 00000',
            bestTimeToVisit: 'Mon - Sat • 10:00 AM - 01:00 PM',
            visitingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            targetVisitsPerMonth: 4,
            avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?crop=entropy&cs=srgb&fm=jpg&q=80&w=200',
            coordinates: { lat: 19.0760, lng: 72.8777 },
            attachedPharmacyId: targetStoreId,
            attachedPharmacyName: formName.trim(),
            attachedPharmacyType: formType,
            attachedHospitalName: formType === 'hospital_pharmacy' ? formHospitalName.trim() : undefined,
            attachedClinicName: formType === 'clinic_counter' ? formClinicName.trim() : undefined
          });
        }
      });
    }

    setIsAddEditModalOpen(false);
  };

  // Delete Store
  const handleDeleteStore = (store: RetailCounter) => {
    if (window.confirm(`Are you sure you want to remove medical store "${store.name}" from direct sales accounts?`)) {
      deleteRetailCounter(store.id);
      toast.success(`Removed store ${store.name}`);
    }
  };

  // Open Direct Order Booking Modal
  const handleOpenDirectOrder = (store: RetailCounter) => {
    setDirectOrderStore(store);
    setDirectOrderDiscountPct(store.directDiscountPct ?? 5);
    setDirectOrderPaymentTerm(store.preferredPaymentTerms || 'Net 15 Days');
    setDirectOrderItems([
      {
        productId: products[0]?.id || '',
        qty: 10,
        price: products[0]?.pricingToRetailer || products[0]?.sellingRate || products[0]?.mrp || 120
      }
    ]);
    setIsDirectOrderModalOpen(true);
  };

  // Submit Direct Order
  const handleSubmitDirectOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directOrderStore) return;

    const validItems = directOrderItems.filter(it => it.productId && it.qty > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one formulation to the order');
      return;
    }

    const itemsFormatted = validItems.map(it => {
      const prod = products.find(p => p.id === it.productId);
      return {
        productId: it.productId,
        productName: prod ? prod.name : 'Pharmaceutical Product',
        qty: it.qty,
        price: it.price
      };
    });

    const grossAmount = itemsFormatted.reduce((sum, it) => sum + it.qty * it.price, 0);
    const discountAmount = Math.round((grossAmount * directOrderDiscountPct) / 100);
    const netAmount = Math.max(0, grossAmount - discountAmount);

    const newOrderId = `DIR-${Date.now().toString().slice(-6)}`;
    const todayStr = new Date().toLocaleDateString('en-GB');

    // Create Order in context directly without doctor
    const newOrder = {
      id: newOrderId,
      repId: directOrderStore.assignedRepId || 'depot-direct',
      repName: directOrderStore.assignedRepName || 'Direct Company Depot',
      doctorName: `Direct Chemist Sale: ${directOrderStore.name} (No Doctor Involved)`,
      clinicName: `${directOrderStore.name} • ${directOrderStore.area}`,
      date: todayStr,
      isoDate: new Date().toISOString(),
      items: itemsFormatted,
      totalAmount: netAmount,
      type: 'Order' as const,
      status: 'approved' as const // Pre-approved direct B2B sale
    };

    // Save order into AppContext orders via localStorage / firestore if possible
    try {
      const existingOrdersRaw = localStorage.getItem('pharmatrack_orders');
      const existingOrders = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];
      localStorage.setItem('pharmatrack_orders', JSON.stringify([newOrder, ...existingOrders]));
    } catch {}

    // Update store direct turnover & direct orders count
    updateRetailCounter(directOrderStore.id, {
      totalMonthlyRevenue: (directOrderStore.totalMonthlyRevenue || 0) + netAmount,
      directOrdersCount: (directOrderStore.directOrdersCount || 0) + 1
    });

    addAuditLog(
      'CREATE',
      'Orders',
      `Direct Chemist Order: ${directOrderStore.name}`,
      `Generated direct B2B store invoice for ${directOrderStore.name} of ₹${netAmount.toLocaleString('en-IN')} (no doctor involved).`
    );

    toast.success(`Direct Order ${newOrderId} generated for ${directOrderStore.name}!`, {
      description: `Invoice value: ₹${netAmount.toLocaleString('en-IN')} with ${directOrderDiscountPct}% direct trade margin.`
    });

    setIsDirectOrderModalOpen(false);
  };

  // Export stores to Excel
  const handleExportStoresExcel = () => {
    const data = filteredStores.map(s => ({
      'Store ID': s.id,
      'Medical Store Name': s.name,
      'Store Type': s.type.replace('_', ' ').toUpperCase(),
      'Contact Person / Pharmacist': s.contactPerson,
      'Phone Number': s.phone,
      'Address': s.address,
      'Area': s.area,
      'City': s.city,
      'Territory': s.territory,
      'Assigned Rep': s.assignedRepName,
      'Drug License No (DL)': s.drugLicenseNo,
      'GSTIN': s.gstin,
      'Credit Terms (Days)': s.creditDays,
      'Credit Limit (INR)': s.creditLimit || 100000,
      'Direct Discount %': s.directDiscountPct || 0,
      'Monthly Direct Volume (INR)': s.totalMonthlyRevenue || 0,
      'Account Status': s.status.toUpperCase()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Medical Stores Direct');
    XLSX.writeFile(wb, `ddb_medical_stores_direct_registry_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Exported medical store registry to Excel');
  };

  return (
    <div
      id="medical-store-management-page"
      data-testid="medical-store-management-page"
      className="p-3 sm:p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-6"
    >
      {/* 1. TOP HEADER & DIRECT SALES BANNER */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
              <Storefront size={13} weight="bold" />
              Direct Commercial Supply
            </span>
            <span className="text-xs text-slate-500 font-medium">
              B2B Pharmacy & Retail Chemist Depot Sales
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading mt-1">
            Medical Stores & Direct Chemist Counters
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Manage wholesale chemist accounts, drug license compliance, and issue direct depot sales without physician involvement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download Bulk Upload Excel Template */}
          <button
            type="button"
            id="btn-download-medical-store-template"
            data-testid="btn-download-medical-store-template"
            onClick={downloadMedicalStoreExcelTemplate}
            title="Download formatted Excel spreadsheet template with all 19 columns for bulk upload"
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 border border-emerald-200 transition-colors cursor-pointer"
          >
            <DownloadSimple size={16} weight="bold" className="text-emerald-700" />
            <span>Excel Template</span>
          </button>

          {/* Bulk Upload Excel */}
          <button
            type="button"
            id="btn-bulk-upload-medical-stores"
            data-testid="btn-bulk-upload-medical-stores"
            onClick={() => setIsExcelImportModalOpen(true)}
            title="Upload completed Excel spreadsheet to bulk create or update medical stores"
            className="px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 border border-teal-200 transition-colors cursor-pointer"
          >
            <UploadSimple size={16} weight="bold" className="text-teal-700" />
            <span>Bulk Upload (.xlsx)</span>
          </button>

          {/* Export Registry */}
          <button
            type="button"
            id="btn-export-stores-excel"
            data-testid="btn-export-stores-excel"
            onClick={handleExportStoresExcel}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 border border-slate-200 transition-colors cursor-pointer"
          >
            <DownloadSimple size={16} weight="bold" />
            <span>Export Registry</span>
          </button>

          <button
            type="button"
            id="btn-add-medical-store"
            data-testid="btn-add-medical-store"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>+ Add Medical Store</span>
          </button>
        </div>
      </div>

      {/* 2. STORE PERFORMANCE METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Registered Stores
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-heading tabular-nums">
              {totalStores}
            </span>
            <span className="text-xs font-semibold text-teal-700">Accounts</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Retail & Hospital Counters</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Direct Monthly Turnover
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-heading tabular-nums">
              ₹{(totalDirectRevenue / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-bold text-emerald-600">B2B Volume</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Direct from company depot</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            High-Volume Chemist Accounts
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-teal-700 font-heading tabular-nums">
              {highVolumeStoresCount}
            </span>
            <span className="text-xs font-medium text-slate-500">of {totalStores}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Priority stock replenishment</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Average Credit Facility
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-heading tabular-nums">
              {avgCreditDays} Days
            </span>
            <span className="text-xs font-semibold text-blue-600">Credit Term</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Standard payment window</span>
        </div>
      </div>

      {/* 2.5 STORE CATEGORY QUICK FILTER TABS */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="filter-all-stores-btn"
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            typeFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Accounts ({storeTypeCounts.all})
        </button>

        <button
          type="button"
          data-testid="filter-wholesale-chemist-btn"
          onClick={() => setTypeFilter('wholesale_chemist')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            typeFilter === 'wholesale_chemist'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
          }`}
        >
          <Package size={14} weight="bold" />
          <span>Wholesale Chemist ({storeTypeCounts.wholesale_chemist})</span>
        </button>

        <button
          type="button"
          data-testid="filter-retail-chemist-btn"
          onClick={() => setTypeFilter('retail_chemist')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            typeFilter === 'retail_chemist'
              ? 'bg-slate-700 text-white border-slate-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Storefront size={14} weight="bold" />
          <span>Retail Chemist ({storeTypeCounts.retail_chemist})</span>
        </button>

        <button
          type="button"
          data-testid="filter-hospital-pharmacy-btn"
          onClick={() => setTypeFilter('hospital_pharmacy')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            typeFilter === 'hospital_pharmacy'
              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
              : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
          }`}
        >
          <Buildings size={14} weight="bold" />
          <span>Hospital Pharmacy ({storeTypeCounts.hospital_pharmacy})</span>
        </button>

        <button
          type="button"
          data-testid="filter-clinic-counter-btn"
          onClick={() => setTypeFilter('clinic_counter')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            typeFilter === 'clinic_counter'
              ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
              : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'
          }`}
        >
          <Stethoscope size={14} weight="bold" />
          <span>Clinic Attached ({storeTypeCounts.clinic_counter})</span>
        </button>

        <button
          type="button"
          data-testid="filter-chain-pharmacy-btn"
          onClick={() => setTypeFilter('chain_pharmacy')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            typeFilter === 'chain_pharmacy'
              ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
              : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
          }`}
        >
          <Buildings size={14} weight="bold" />
          <span>Chain Pharma Depot ({storeTypeCounts.chain_pharmacy})</span>
        </button>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by store name, contact, DL No, GSTIN, area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-teal-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Store Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Type:</span>
            <select
              aria-label="Filter store type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as StoreTypeFilter)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Store Types</option>
              <option value="retail_chemist">Retail Chemist</option>
              <option value="wholesale_chemist">Wholesale Chemist</option>
              <option value="hospital_pharmacy">Hospital Pharmacy</option>
              <option value="clinic_counter">Clinic Attached Pharmacy</option>
              <option value="chain_pharmacy">Chain Pharmacy Depot</option>
            </select>
          </div>

          {/* Territory Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Territory:</span>
            <select
              aria-label="Filter territory"
              value={territoryFilter}
              onChange={(e) => setTerritoryFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Territories</option>
              {uniqueTerritories.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {(searchTerm || typeFilter !== 'all' || territoryFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setTerritoryFilter('all');
                setStatusFilter('all');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. MEDICAL STORES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Medical Store & Category</th>
                <th className="py-3.5 px-4">Contact & Location</th>
                <th className="py-3.5 px-4">Drug License & GSTIN</th>
                <th className="py-3.5 px-4 text-center">Commercial Terms</th>
                <th className="py-3.5 px-4 text-right">Monthly Sales</th>
                <th className="py-3.5 px-4 text-center">Account Status</th>
                <th className="py-3.5 px-4 text-right">Direct Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Storefront size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No medical stores found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchTerm ? 'Try adjusting your search keywords or filters.' : 'Click "+ Add Medical Store" to register your first direct store.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStores.map(store => (
                  <tr key={store.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Store Name & Category */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200">
                          <Storefront size={16} weight="bold" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block leading-snug">
                            {store.name}
                          </span>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                store.type === 'wholesale_chemist'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : store.type === 'hospital_pharmacy'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : store.type === 'clinic_counter'
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                  : store.type === 'chain_pharmacy'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {store.type === 'wholesale_chemist'
                                  ? 'Wholesale Chemist'
                                  : store.type === 'hospital_pharmacy'
                                  ? 'Hospital Pharmacy'
                                  : store.type === 'clinic_counter'
                                  ? 'Clinic Attached Pharmacy'
                                  : store.type === 'chain_pharmacy'
                                  ? 'Chain Pharmacy Depot'
                                  : 'Retail Chemist'}
                              </span>
                              <span className="text-[11px] text-slate-400">&bull; Direct B2B</span>
                            </div>

                            {/* Hospital Details */}
                            {store.type === 'hospital_pharmacy' && store.hospitalName && (
                              <div className="text-[11px] text-blue-800 font-medium flex items-center gap-1 mt-0.5">
                                <Buildings size={12} className="text-blue-600 shrink-0" />
                                <span>Hospital: <strong>{store.hospitalName}</strong></span>
                              </div>
                            )}

                            {/* Clinic Details */}
                            {store.type === 'clinic_counter' && store.clinicName && (
                              <div className="text-[11px] text-teal-800 font-medium flex items-center gap-1 mt-0.5">
                                <Stethoscope size={12} className="text-teal-600 shrink-0" />
                                <span>Clinic: <strong>{store.clinicName}</strong></span>
                              </div>
                            )}

                            {/* Linked Doctor(s) Link to Doctor's List */}
                            {(store.type === 'hospital_pharmacy' || store.type === 'clinic_counter') && store.linkedDoctorNames && store.linkedDoctorNames.length > 0 && (
                              <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 flex-wrap">
                                <UserCheck size={13} className="text-blue-600 shrink-0" />
                                <span>Doctor: <strong className="text-slate-800">{store.linkedDoctorNames.join(', ')}</strong></span>
                                <button
                                  type="button"
                                  onClick={() => setActiveAdminTab('doctors')}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer ml-1"
                                  title="View in Doctor's List section"
                                >
                                  (View in Doctor's List)
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Location */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-medium text-slate-800 block">
                          {store.contactPerson}
                        </span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Phone size={11} />
                          <span className="font-mono">{store.phone}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <MapPin size={11} />
                          <span>{store.area}, {store.city}</span>
                        </div>
                      </div>
                    </td>

                    {/* Regulatory: DL No & GSTIN */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="font-bold text-slate-500">DL:</span>
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 text-[10px] font-semibold border border-slate-200">
                            {store.drugLicenseNo || 'DL-20B-PENDING'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="font-bold text-slate-500">GST:</span>
                          <span className="font-mono text-slate-700 text-[10px] font-medium">
                            {store.gstin || 'Unregistered'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Commercial Terms */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block">
                          {store.creditDays || 15} Days Credit
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                          Direct Disc: {store.directDiscountPct ?? 5}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Limit: ₹{(store.creditLimit || 100000).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </td>

                    {/* Monthly Sales */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-slate-900 text-sm font-mono block">
                        ₹{(store.totalMonthlyRevenue || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {store.directOrdersCount || 0} direct order(s)
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          store.status === 'high_volume'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : store.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {store.status === 'high_volume' ? 'High Volume' : store.status === 'active' ? 'Active Account' : 'Refill Due'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Book Direct Order (No Doctor Required) */}
                        <button
                          type="button"
                          onClick={() => handleOpenDirectOrder(store)}
                          className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          title="Book direct sale without doctor"
                        >
                          <ShoppingCart size={13} weight="bold" />
                          <span>Direct Sale</span>
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(store)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit store information"
                        >
                          <PencilSimple size={15} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteStore(store)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove store account"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ADD / EDIT MEDICAL STORE MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <Storefront size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingStore ? 'Edit Medical Store Account' : 'Register New Medical Store'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct commercial buyer details for physician-independent sales
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStore} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Store / Chemist Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sanjivani Medicos"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Store Type / Channel *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as RetailCounter['type'])}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-teal-500 focus:outline-none"
                  >
                    <option value="retail_chemist">Retail Chemist (Neighborhood Pharmacy)</option>
                    <option value="wholesale_chemist">Wholesale Chemist (B2B Bulk Stockist / Distributor)</option>
                    <option value="hospital_pharmacy">Hospital Pharmacy (In-Patient / Out-Patient Dispensing)</option>
                    <option value="clinic_counter">Clinic Attached Pharmacy (Chamber Dispensing Counter)</option>
                    <option value="chain_pharmacy">Chain Pharmacy Depot (Central Hub / Mother Warehouse)</option>
                  </select>
                </div>
              </div>

              {/* CONDITIONAL POPUP FIELDS FOR HOSPITAL PHARMACY */}
              {formType === 'hospital_pharmacy' && (
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-blue-200/70 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                      <Buildings size={18} className="text-blue-600" weight="bold" />
                      <span>Hospital Pharmacy Details & Physician Linkage</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      2 Pop-up Fields Required
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {/* Field 1: Hospital Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>1. Hospital Name *</span>
                        <span className="text-[10px] text-blue-700 font-semibold">Institutional Health Center</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formHospitalName}
                        onChange={(e) => setFormHospitalName(e.target.value)}
                        placeholder="e.g. Metro Heart Hospital & Multispeciality Institute"
                        className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-medium text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-2xs"
                      />
                    </div>

                    {/* Field 2: Doctor / Doctor's Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>2. Doctor / Doctor's Name *</span>
                        <span className="text-[10px] text-blue-700 font-bold flex items-center gap-1">
                          <span>🔗 Links to Doctor's List in Operations Console</span>
                        </span>
                      </label>

                      {/* Selected Doctor Badges */}
                      {(formLinkedDoctorIds.length > 0 || formLinkedDoctorNames.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-white/90 rounded-lg border border-blue-200">
                          {formLinkedDoctorIds.map(docId => {
                            const d = doctors.find(doc => doc.id === docId);
                            return (
                              <span
                                key={docId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 font-bold text-[11px]"
                              >
                                <span>{d ? d.name : docId}</span>
                                <span className="text-blue-700 text-[10px] font-normal">({d?.specialty || 'Doctor'})</span>
                                <button
                                  type="button"
                                  onClick={() => setFormLinkedDoctorIds(formLinkedDoctorIds.filter(id => id !== docId))}
                                  className="text-blue-600 hover:text-blue-900 p-0.5 rounded cursor-pointer"
                                  title="Remove doctor linkage"
                                >
                                  <X size={12} weight="bold" />
                                </button>
                              </span>
                            );
                          })}

                          {formLinkedDoctorNames.map((name, idx) => (
                            <span
                              key={`custom-${idx}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold text-[11px]"
                            >
                              <span>{name}</span>
                              <span className="text-indigo-700 text-[10px] font-normal">(New Physician)</span>
                              <button
                                type="button"
                                onClick={() => setFormLinkedDoctorNames(formLinkedDoctorNames.filter((_, i) => i !== idx))}
                                className="text-indigo-600 hover:text-indigo-900 p-0.5 rounded cursor-pointer"
                                title="Remove doctor linkage"
                              >
                                <X size={12} weight="bold" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Doctor Select Dropdown from existing Doctor's List */}
                      <div className="space-y-2">
                        <select
                          value=""
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            if (selectedId && !formLinkedDoctorIds.includes(selectedId)) {
                              setFormLinkedDoctorIds([...formLinkedDoctorIds, selectedId]);
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-medium text-xs focus:border-blue-600 focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Select from Doctor's List ({doctors.length} available) --</option>
                          {doctors.map(d => (
                            <option key={d.id} value={d.id} disabled={formLinkedDoctorIds.includes(d.id)}>
                              {d.name} &bull; {d.specialty} ({d.clinicName})
                            </option>
                          ))}
                        </select>

                        {/* Inline Custom Doctor Name input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Or type doctor's name (e.g. Dr. Rajesh Sharma)..."
                            value={customDoctorInput}
                            onChange={(e) => setCustomDoctorInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const trimmed = customDoctorInput.trim();
                                if (trimmed && !formLinkedDoctorNames.includes(trimmed)) {
                                  setFormLinkedDoctorNames([...formLinkedDoctorNames, trimmed]);
                                  setCustomDoctorInput('');
                                }
                              }
                            }}
                            className="flex-1 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-medium focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = customDoctorInput.trim();
                              if (trimmed && !formLinkedDoctorNames.includes(trimmed)) {
                                setFormLinkedDoctorNames([...formLinkedDoctorNames, trimmed]);
                                setCustomDoctorInput('');
                              }
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer shrink-0 transition-colors"
                          >
                            + Link Doctor
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] text-blue-900 bg-blue-100/70 p-2 rounded-lg border border-blue-200 flex items-start gap-1.5">
                        <UserCheck size={14} className="text-blue-700 shrink-0 mt-0.5" weight="bold" />
                        <div>
                          <strong>Automatic Bidirectional Linkage:</strong> This pharmacy will be linked against the selected doctor(s) in the <em>Doctor's List</em> section with a dedicated hospital pharmacy badge and direct link.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONDITIONAL POPUP FIELDS FOR CLINIC ATTACHED PHARMACY */}
              {formType === 'clinic_counter' && (
                <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-teal-200/70 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                      <Stethoscope size={18} className="text-teal-600" weight="bold" />
                      <span>Clinic Attached Pharmacy Details & Physician Linkage</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                      2 Pop-up Fields Required
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {/* Field 1: Clinic Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>1. Clinic Name *</span>
                        <span className="text-[10px] text-teal-700 font-semibold">Chamber / Polyclinic Practice</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formClinicName}
                        onChange={(e) => setFormClinicName(e.target.value)}
                        placeholder="e.g. Apex Diabetes & Cardiac Care Chamber"
                        className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl font-medium text-xs text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none shadow-2xs"
                      />
                    </div>

                    {/* Field 2: Doctor / Doctor's Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>2. Doctor / Doctor's Name *</span>
                        <span className="text-[10px] text-teal-700 font-bold flex items-center gap-1">
                          <span>🔗 Links to Doctor's List in Operations Console</span>
                        </span>
                      </label>

                      {/* Selected Doctor Badges */}
                      {(formLinkedDoctorIds.length > 0 || formLinkedDoctorNames.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-white/90 rounded-lg border border-teal-200">
                          {formLinkedDoctorIds.map(docId => {
                            const d = doctors.find(doc => doc.id === docId);
                            return (
                              <span
                                key={docId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900 border border-teal-300 font-bold text-[11px]"
                              >
                                <span>{d ? d.name : docId}</span>
                                <span className="text-teal-700 text-[10px] font-normal">({d?.specialty || 'Doctor'})</span>
                                <button
                                  type="button"
                                  onClick={() => setFormLinkedDoctorIds(formLinkedDoctorIds.filter(id => id !== docId))}
                                  className="text-teal-600 hover:text-teal-900 p-0.5 rounded cursor-pointer"
                                  title="Remove doctor linkage"
                                >
                                  <X size={12} weight="bold" />
                                </button>
                              </span>
                            );
                          })}

                          {formLinkedDoctorNames.map((name, idx) => (
                            <span
                              key={`custom-clinic-${idx}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[11px]"
                            >
                              <span>{name}</span>
                              <span className="text-emerald-700 text-[10px] font-normal">(New Physician)</span>
                              <button
                                type="button"
                                onClick={() => setFormLinkedDoctorNames(formLinkedDoctorNames.filter((_, i) => i !== idx))}
                                className="text-emerald-600 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
                                title="Remove doctor linkage"
                              >
                                <X size={12} weight="bold" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Doctor Select Dropdown */}
                      <div className="space-y-2">
                        <select
                          value=""
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            if (selectedId && !formLinkedDoctorIds.includes(selectedId)) {
                              setFormLinkedDoctorIds([...formLinkedDoctorIds, selectedId]);
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl font-medium text-xs focus:border-teal-600 focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Select from Doctor's List ({doctors.length} available) --</option>
                          {doctors.map(d => (
                            <option key={d.id} value={d.id} disabled={formLinkedDoctorIds.includes(d.id)}>
                              {d.name} &bull; {d.specialty} ({d.clinicName})
                            </option>
                          ))}
                        </select>

                        {/* Inline Custom Doctor Name input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Or type doctor's name (e.g. Dr. Vikramaditya Joshi)..."
                            value={customDoctorInput}
                            onChange={(e) => setCustomDoctorInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const trimmed = customDoctorInput.trim();
                                if (trimmed && !formLinkedDoctorNames.includes(trimmed)) {
                                  setFormLinkedDoctorNames([...formLinkedDoctorNames, trimmed]);
                                  setCustomDoctorInput('');
                                }
                              }
                            }}
                            className="flex-1 px-3 py-1.5 bg-white border border-teal-200 rounded-lg text-xs font-medium focus:border-teal-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = customDoctorInput.trim();
                              if (trimmed && !formLinkedDoctorNames.includes(trimmed)) {
                                setFormLinkedDoctorNames([...formLinkedDoctorNames, trimmed]);
                                setCustomDoctorInput('');
                              }
                            }}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs cursor-pointer shrink-0 transition-colors"
                          >
                            + Link Doctor
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] text-teal-900 bg-teal-100/70 p-2 rounded-lg border border-teal-200 flex items-start gap-1.5">
                        <UserCheck size={14} className="text-teal-700 shrink-0 mt-0.5" weight="bold" />
                        <div>
                          <strong>Automatic Bidirectional Linkage:</strong> This pharmacy counter will be linked against the selected consulting doctor(s) in the <em>Doctor's List</em> section with clinic chamber details.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Person & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contact Person / Pharmacist
                  </label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="e.g. Rajesh Kumar (D.Pharm)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile / WhatsApp Phone
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. +91 98110 54321"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Address, Area, City */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Store Address
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Shop 14, Main Market, Near Civil Hospital"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    placeholder="e.g. Sector 15 / Green Park"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. New Delhi"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Territory & Assigned Rep */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sales Territory
                  </label>
                  <input
                    type="text"
                    value={formTerritory}
                    onChange={(e) => setFormTerritory(e.target.value)}
                    placeholder="e.g. Central & South Medical Belt"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Field Rep Servicing Account
                  </label>
                  <select
                    value={formAssignedRepId}
                    onChange={(e) => setFormAssignedRepId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">Direct Depot Delivery (No Rep)</option>
                    {reps.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.employeeCode})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Regulatory: Drug License No & GSTIN */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-teal-600" />
                  Regulatory Compliance & Tax Credentials
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Drug License Number (DL No.) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formDlNo}
                      onChange={(e) => setFormDlNo(e.target.value)}
                      placeholder="e.g. DL-20B-184920, 21B-184921"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      GSTIN (Tax ID)
                    </label>
                    <input
                      type="text"
                      value={formGstin}
                      onChange={(e) => setFormGstin(e.target.value)}
                      placeholder="e.g. 07AABCS1429F1Z2"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-semibold focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Commercial Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Credit Period (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={formCreditDays}
                    onChange={(e) => setFormCreditDays(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-center focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold font-mono focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Direct Trade Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    step="0.5"
                    value={formDirectDiscount}
                    onChange={(e) => setFormDirectDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-center focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Account Status
                </label>
                <div className="flex gap-2">
                  {(['active', 'high_volume', 'pending_refill'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormStatus(st)}
                      className={`flex-1 py-2 px-2 rounded-xl font-bold text-center border capitalize transition-all cursor-pointer ${
                        formStatus === st
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingStore ? 'Save Changes' : 'Register Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DIRECT STORE ORDER BOOKING MODAL (No Doctor Involved) */}
      {isDirectOrderModalOpen && directOrderStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-teal-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
                  <Receipt size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Book Direct Store Sale Order
                  </h3>
                  <p className="text-xs text-teal-800 font-semibold">
                    Direct Commercial Sale • No Physician Detailing Required
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDirectOrderModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitDirectOrder} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Buyer Chemist Badge */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Direct Store Account</span>
                  <span className="font-bold text-slate-900 text-sm block">{directOrderStore.name}</span>
                  <span className="text-[11px] text-slate-500">
                    DL: {directOrderStore.drugLicenseNo} &bull; GSTIN: {directOrderStore.gstin}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold border border-teal-200">
                  Direct B2B Depot Order
                </span>
              </div>

              {/* Order Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Formulations to Supply</label>
                  <button
                    type="button"
                    onClick={() => {
                      const firstProd = products[0];
                      setDirectOrderItems([
                        ...directOrderItems,
                        {
                          productId: firstProd?.id || '',
                          qty: 10,
                          price: firstProd?.pricingToRetailer || firstProd?.sellingRate || firstProd?.mrp || 100
                        }
                      ]);
                    }}
                    className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} weight="bold" />
                    <span>+ Add Formulation</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {directOrderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const newId = e.target.value;
                            const prod = products.find(p => p.id === newId);
                            const updated = [...directOrderItems];
                            updated[idx] = {
                              ...updated[idx],
                              productId: newId,
                              price: prod?.pricingToRetailer || prod?.sellingRate || prod?.mrp || 100
                            };
                            setDirectOrderItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.packaging}) - PTR: ₹{p.pricingToRetailer || p.mrp || 100}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => {
                            const updated = [...directOrderItems];
                            updated[idx].qty = Number(e.target.value) || 1;
                            setDirectOrderItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs"
                          placeholder="Qty"
                        />
                      </div>

                      <div className="w-24 text-right font-mono font-bold text-slate-800">
                        ₹{(item.qty * item.price).toLocaleString('en-IN')}
                      </div>

                      {directOrderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setDirectOrderItems(directOrderItems.filter((_, i) => i !== idx));
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Commercials: Trade Discount & Payment Terms */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Direct Trade Margin Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={directOrderDiscountPct}
                    onChange={(e) => setDirectOrderDiscountPct(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={directOrderPaymentTerm}
                    onChange={(e) => setDirectOrderPaymentTerm(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                  >
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Immediate UPI / Cash">Immediate UPI / Cash</option>
                    <option value="Cheque on Delivery">Cheque on Delivery</option>
                  </select>
                </div>
              </div>

              {/* Total Calculation Card */}
              {(() => {
                const gross = directOrderItems.reduce((sum, it) => sum + it.qty * it.price, 0);
                const discount = Math.round((gross * directOrderDiscountPct) / 100);
                const finalAmt = Math.max(0, gross - discount);
                return (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Value:</span>
                      <span className="font-mono font-semibold">₹{gross.toLocaleString('en-IN')}</span>
                    </div>
                    {directOrderDiscountPct > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Direct Trade Discount ({directOrderDiscountPct}%):</span>
                        <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                      <span>Total Invoice Payable:</span>
                      <span className="font-mono text-teal-800 text-base">₹{finalAmt.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDirectOrderModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <CheckCircle size={16} weight="bold" />
                  <span>Issue Direct B2B Invoice & Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. BULK MEDICAL STORES EXCEL IMPORT MODAL */}
      <MedicalStoreExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
      />
    </div>
  );
};
