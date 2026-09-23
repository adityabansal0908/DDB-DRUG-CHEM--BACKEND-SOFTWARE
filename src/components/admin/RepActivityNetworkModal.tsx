import React, { useState, useMemo } from 'react';
import { SalesRep, Doctor, RetailCounter, Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { RepTerritoryModal } from './RepTerritoryModal';
import {
  X,
  User,
  Storefront,
  Pill,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  CalendarCheck,
  CurrencyInr,
  MagnifyingGlass,
  Plus,
  Tag,
  ShieldCheck,
  Receipt,
  FileText,
  ArrowsLeftRight,
  CaretRight,
  Sparkle
} from '@phosphor-icons/react';

interface RepActivityNetworkModalProps {
  rep: SalesRep;
  isOpen: boolean;
  onClose: () => void;
}

export const RepActivityNetworkModal: React.FC<RepActivityNetworkModalProps> = ({
  rep,
  isOpen,
  onClose
}) => {
  const { doctors, retailCounters, products, visits, orders, addRetailCounter } = useApp();

  const [activeTab, setActiveTab] = useState<'doctors' | 'counters' | 'products'>('doctors');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddCounterOpen, setIsAddCounterOpen] = useState(false);

  // New counter form state
  const [newCounterName, setNewCounterName] = useState('');
  const [newCounterType, setNewCounterType] = useState<RetailCounter['type']>('retail_chemist');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newDrugLicense, setNewDrugLicense] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [newCreditDays, setNewCreditDays] = useState(21);
  const [selectedProductsForCounter, setSelectedProductsForCounter] = useState<string[]>([]);
  const [isTerritoryModalOpen, setIsTerritoryModalOpen] = useState(false);

  // Doctors meeting with this rep
  const repDoctors = useMemo(() => {
    return doctors.filter(doc => {
      if (doc.assignedRepIds && doc.assignedRepIds.includes(rep.id)) {
        return true;
      }
      if (rep.assignedDoctorIds && rep.assignedDoctorIds.includes(doc.id)) {
        return true;
      }
      // Or visits logged by this rep
      const hasVisited = visits.some(v => v.repId === rep.id && v.doctorName.toLowerCase() === doc.name.toLowerCase());
      return hasVisited;
    });
  }, [doctors, rep.id, rep.assignedDoctorIds, visits]);

  // Retail counters assigned to or serviced by this rep
  const repCounters = useMemo(() => {
    return retailCounters.filter(
      c => c.assignedRepId === rep.id || c.assignedRepName.toLowerCase() === rep.name.toLowerCase()
    );
  }, [retailCounters, rep.id, rep.name]);

  // All unique products showcased by this rep
  const showcasedProductsData = useMemo(() => {
    const productMap = new Map<
      string,
      {
        product: Product | null;
        productName: string;
        genericName?: string;
        category?: string;
        doctorsShowcasedTo: Doctor[];
        countersStocking: { counter: RetailCounter; units: number; monthlyValue: number }[];
        totalUnits: number;
        totalValue: number;
      }
    >();

    // 1. From Doctors targetedProducts
    repDoctors.forEach(doc => {
      (doc.targetedProducts || []).forEach(prodName => {
        const found = products.find(p => p.name.toLowerCase() === prodName.toLowerCase());
        const entry = productMap.get(prodName) || {
          product: found || null,
          productName: prodName,
          genericName: found?.genericName,
          category: found?.category || 'General Formulations',
          doctorsShowcasedTo: [],
          countersStocking: [],
          totalUnits: 0,
          totalValue: 0
        };
        if (!entry.doctorsShowcasedTo.some(d => d.id === doc.id)) {
          entry.doctorsShowcasedTo.push(doc);
        }
        productMap.set(prodName, entry);
      });
    });

    // 2. From Retail Counters productsSold
    repCounters.forEach(counter => {
      (counter.productsSold || []).forEach(sold => {
        const found = products.find(p => p.name.toLowerCase() === sold.productName.toLowerCase());
        const entry = productMap.get(sold.productName) || {
          product: found || null,
          productName: sold.productName,
          genericName: sold.genericName || found?.genericName,
          category: found?.category || 'General Formulations',
          doctorsShowcasedTo: [],
          countersStocking: [],
          totalUnits: 0,
          totalValue: 0
        };
        const counterValue = (sold.monthlyUnitsSold || 0) * (sold.billingRate || found?.pricingToRetailer || 0);
        entry.countersStocking.push({
          counter,
          units: sold.monthlyUnitsSold || 0,
          monthlyValue: counterValue
        });
        entry.totalUnits += sold.monthlyUnitsSold || 0;
        entry.totalValue += counterValue;
        productMap.set(sold.productName, entry);
      });
    });

    return Array.from(productMap.values());
  }, [repDoctors, repCounters, products]);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return repDoctors.filter(doc => {
      const matchSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        doc.clinicName.toLowerCase().includes(q) ||
        doc.area.toLowerCase().includes(q) ||
        (doc.targetedProducts || []).some(tp => tp.toLowerCase().includes(q));

      const matchCategory =
        selectedCategory === 'all' ||
        (doc.targetedProducts || []).some(tp => {
          const prod = products.find(p => p.name.toLowerCase() === tp.toLowerCase());
          return prod?.category === selectedCategory;
        });

      return matchSearch && matchCategory;
    });
  }, [repDoctors, searchQuery, selectedCategory, products]);

  // Filtered Retail Counters
  const filteredCounters = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return repCounters.filter(counter => {
      const matchSearch =
        !q ||
        counter.name.toLowerCase().includes(q) ||
        counter.contactPerson.toLowerCase().includes(q) ||
        counter.address.toLowerCase().includes(q) ||
        counter.area.toLowerCase().includes(q) ||
        counter.drugLicenseNo.toLowerCase().includes(q) ||
        (counter.productsSold || []).some(p => p.productName.toLowerCase().includes(q));

      const matchCategory =
        selectedCategory === 'all' ||
        (counter.productsSold || []).some(ps => {
          const prod = products.find(p => p.name.toLowerCase() === ps.productName.toLowerCase());
          return prod?.category === selectedCategory;
        });

      return matchSearch && matchCategory;
    });
  }, [repCounters, searchQuery, selectedCategory, products]);

  // Filtered Showcased Products
  const filteredShowcasedProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return showcasedProductsData.filter(item => {
      const matchSearch =
        !q ||
        item.productName.toLowerCase().includes(q) ||
        (item.genericName && item.genericName.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [showcasedProductsData, searchQuery, selectedCategory]);

  // Total counter revenue
  const totalCounterRevenue = useMemo(() => {
    return repCounters.reduce((acc, curr) => acc + (curr.totalMonthlyRevenue || 0), 0);
  }, [repCounters]);

  // Available categories for filter pills
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    showcasedProductsData.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [showcasedProductsData]);

  const handleCreateCounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounterName.trim()) return;

    const productsSoldList = selectedProductsForCounter.map(pName => {
      const p = products.find(item => item.name === pName);
      return {
        productName: pName,
        genericName: p?.genericName,
        monthlyUnitsSold: 50,
        billingRate: p?.pricingToRetailer || p?.sellingRate || 100,
        lastOrderDate: 'Just Added',
        lastOrderAmount: (p?.pricingToRetailer || 100) * 50
      };
    });

    const calculatedRevenue = productsSoldList.reduce(
      (acc, curr) => acc + curr.monthlyUnitsSold * curr.billingRate,
      0
    );

    addRetailCounter({
      name: newCounterName.trim(),
      type: newCounterType,
      contactPerson: newContactPerson.trim() || 'Store Manager',
      phone: newPhone.trim() || rep.phone,
      address: newAddress.trim() || `${newArea || 'Market Area'}, ${newCity || 'Main City'}`,
      area: newArea.trim() || 'Central',
      city: newCity.trim() || 'Metro',
      territory: rep.territory,
      assignedRepId: rep.id,
      assignedRepName: rep.name,
      drugLicenseNo: newDrugLicense.trim() || `20B/21B-${Math.floor(100000 + Math.random() * 900000)}`,
      gstin: newGstin.trim() || '27AAACB0000A1Z5',
      productsSold: productsSoldList,
      totalMonthlyRevenue: calculatedRevenue,
      creditDays: Number(newCreditDays) || 21,
      status: 'active'
    });

    // Reset and close
    setNewCounterName('');
    setNewContactPerson('');
    setNewPhone('');
    setNewAddress('');
    setNewArea('');
    setNewCity('');
    setNewDrugLicense('');
    setNewGstin('');
    setSelectedProductsForCounter([]);
    setIsAddCounterOpen(false);
  };

  const toggleProductSelection = (productName: string) => {
    setSelectedProductsForCounter(prev =>
      prev.includes(productName) ? prev.filter(p => p !== productName) : [...prev, productName]
    );
  };

  if (!isOpen) return null;

  return (
    <div
      id="rep-activity-network-modal-overlay"
      data-testid="rep-activity-network-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="rep-activity-network-modal"
        data-testid="rep-activity-network-modal"
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={rep.avatarUrl}
              alt={rep.name}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                  {rep.name}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-semibold">
                  {rep.employeeCode}
                </span>
                <button
                  type="button"
                  id={`activity-modal-edit-territory-btn-${rep.id}`}
                  data-testid={`activity-modal-edit-territory-btn-${rep.id}`}
                  onClick={() => setIsTerritoryModalOpen(true)}
                  title="Admin Privilege: Assign or Edit Territory"
                  className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <MapPin size={12} weight="bold" />
                  <span>{rep.territory}</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1 rounded ml-0.5">Edit Territory</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-blue-600" />
                  {rep.phone}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin size={13} className="text-emerald-600" />
                  {rep.currentLocationName}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="close-rep-activity-modal-btn"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0"
          >
            <X size={22} />
          </button>
        </div>

        {/* Top Summary Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 sm:px-6 py-3 bg-slate-100/70 border-b border-slate-200/80 shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5 shadow-2xs">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <User size={18} weight="bold" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Doctors Meeting With
              </span>
              <span className="text-base font-bold text-slate-900 font-heading">
                {repDoctors.length} <span className="text-xs font-normal text-slate-500">Physicians</span>
              </span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5 shadow-2xs">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Storefront size={18} weight="bold" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Retail Chemist Counters
              </span>
              <span className="text-base font-bold text-slate-900 font-heading">
                {repCounters.length} <span className="text-xs font-normal text-slate-500">Outlets</span>
              </span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5 shadow-2xs">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <Pill size={18} weight="bold" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Showcased Medicines
              </span>
              <span className="text-base font-bold text-slate-900 font-heading">
                {showcasedProductsData.length} <span className="text-xs font-normal text-slate-500">Formulations</span>
              </span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-2.5 shadow-2xs">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <CurrencyInr size={18} weight="bold" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Monthly Counter Sales
              </span>
              <span className="text-base font-bold text-emerald-700 font-heading">
                ₹{totalCounterRevenue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Controls */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 bg-white">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              type="button"
              data-testid="tab-doctors-meeting-with"
              onClick={() => setActiveTab('doctors')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'doctors'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <User size={16} weight={activeTab === 'doctors' ? 'bold' : 'regular'} />
              <span>Doctors Meeting With ({repDoctors.length})</span>
            </button>

            <button
              type="button"
              data-testid="tab-retail-counters-selling-to"
              onClick={() => setActiveTab('counters')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'counters'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Storefront size={16} weight={activeTab === 'counters' ? 'bold' : 'regular'} />
              <span>Retail Counters Selling To ({repCounters.length})</span>
            </button>

            <button
              type="button"
              data-testid="tab-products-showcased-matrix"
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Pill size={16} weight={activeTab === 'products' ? 'bold' : 'regular'} />
              <span>Showcased Portfolio ({showcasedProductsData.length})</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {activeTab === 'counters' && (
              <button
                type="button"
                data-testid="add-new-retail-counter-btn"
                onClick={() => setIsAddCounterOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus size={15} weight="bold" />
                <span>Add Retail Counter</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Filter Filter Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'doctors'
                  ? 'Search by doctor name, specialty, clinic, or showcased medicine...'
                  : activeTab === 'counters'
                  ? 'Search by chemist name, DL number, address, or products sold...'
                  : 'Search by medicine name, generic composition, or category...'
              }
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>
            {availableCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: DOCTORS MEETING WITH */}
          {activeTab === 'doctors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Physician Detailing Route & Showcased Formulations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Doctors {rep.name} meets for detailing visits, along with the specific medicines showcased to each doctor.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  Showing {filteredDoctors.length} of {repDoctors.length} Doctors
                </span>
              </div>

              {filteredDoctors.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <User size={36} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No doctors match your query</p>
                  <p className="text-xs text-slate-400 mt-1">Try clearing search filters or changing category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredDoctors.map(doctor => {
                    const targetedList = doctor.targetedProducts || [];
                    const doctorVisits = visits.filter(
                      v => v.repId === rep.id && v.doctorName.toLowerCase() === doctor.name.toLowerCase()
                    );
                    const lastVisit = doctorVisits[0];

                    return (
                      <div
                        key={doctor.id}
                        id={`rep-doctor-card-${doctor.id}`}
                        data-testid={`rep-doctor-card-${doctor.id}`}
                        className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:border-blue-300 transition-all space-y-4"
                      >
                        {/* Doctor Main Row */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <img
                              src={doctor.avatarUrl}
                              alt={doctor.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base font-bold text-slate-900 font-heading">
                                  {doctor.name}
                                </h4>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                  {doctor.specialty}
                                </span>
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    doctor.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : doctor.status === 'in_progress'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                                >
                                  {doctor.status === 'completed'
                                    ? 'Visited Today'
                                    : doctor.status === 'in_progress'
                                    ? 'In Progress'
                                    : 'Scheduled Visit'}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 mt-1 flex items-center gap-3 flex-wrap">
                                <span className="font-semibold text-slate-800">{doctor.clinicName}</span>
                                <span className="text-slate-300">&bull;</span>
                                <span className="flex items-center gap-1 text-slate-500">
                                  <MapPin size={12} className="text-blue-500" />
                                  {doctor.address}, {doctor.city}
                                </span>
                                <span className="text-slate-300">&bull;</span>
                                <span className="flex items-center gap-1 text-slate-600">
                                  <Clock size={12} className="text-slate-400" />
                                  Best Window: {doctor.bestTimeToVisit}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                            <span className="text-[11px] text-slate-500">Monthly Detailing Quota</span>
                            <span className="text-xs font-bold text-slate-800">
                              {doctor.visitsCompletedThisMonth} / {doctor.targetVisitsPerMonth} visits completed
                            </span>
                            {doctor.phone && (
                              <span className="text-xs font-mono text-blue-700 flex items-center gap-1">
                                <Phone size={11} />
                                {doctor.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Products Showcased Section */}
                        <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200/70 space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                              <Pill size={16} className="text-blue-600" weight="bold" />
                              <span>Medicines Showcased / Targeted to {doctor.name.split(' ')[1] || doctor.name}</span>
                            </div>
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                              {targetedList.length} Formulations in Call Detailing
                            </span>
                          </div>

                          {targetedList.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No specific medicines tagged for detailing yet.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {targetedList.map((prodName, idx) => {
                                const prod = products.find(p => p.name.toLowerCase() === prodName.toLowerCase());
                                return (
                                  <div
                                    key={idx}
                                    className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs space-y-1.5 hover:border-blue-300 transition-all"
                                  >
                                    <div className="flex items-start justify-between gap-1">
                                      <span className="text-xs font-bold text-slate-900 leading-tight">
                                        {prodName}
                                      </span>
                                      {prod?.category && (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                                          {prod.category}
                                        </span>
                                      )}
                                    </div>

                                    {prod?.genericName && (
                                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                                        {prod.genericName}
                                      </p>
                                    )}

                                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                      <span>{prod?.packaging || 'Standard Pack'} &bull; {prod?.form || 'Tablet'}</span>
                                      <span className="font-bold text-slate-800">
                                        MRP: ₹{prod?.mrp || 'N/A'}
                                      </span>
                                    </div>

                                    {prod?.pricingToRetailer && (
                                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                                        <span>PTR: ₹{prod.pricingToRetailer}</span>
                                        <span>PTS: ₹{prod.pricingToStockist || 'N/A'}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {doctor.adminRemarks && (
                            <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-start gap-2">
                              <Sparkle size={15} className="text-amber-500 shrink-0 mt-0.5" weight="fill" />
                              <div>
                                <span className="font-bold text-slate-800">Physician Detailing Directives: </span>
                                <span>{doctor.adminRemarks}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RETAIL COUNTERS SELLING TO */}
          {activeTab === 'counters' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Retail Chemist Counters & Pharmacy Points
                  </h3>
                  <p className="text-xs text-slate-500">
                    Retail pharmacies, clinic dispensaries, and hospital chemist points where {rep.name} sells medicines.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                    Total Revenue: ₹{totalCounterRevenue.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                    {filteredCounters.length} Counters
                  </span>
                </div>
              </div>

              {filteredCounters.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Storefront size={36} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No retail counters found</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">You can register a new retail chemist counter for this sales representative.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddCounterOpen(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus size={15} weight="bold" />
                    <span>Register New Retail Counter</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredCounters.map(counter => {
                    const productsList = counter.productsSold || [];
                    return (
                      <div
                        key={counter.id}
                        id={`rep-counter-card-${counter.id}`}
                        data-testid={`rep-counter-card-${counter.id}`}
                        className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:border-emerald-300 transition-all space-y-4"
                      >
                        {/* Counter Profile Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                              <Storefront size={24} weight="bold" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base font-bold text-slate-900 font-heading">
                                  {counter.name}
                                </h4>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
                                  {counter.type.replace('_', ' ')}
                                </span>
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    counter.status === 'high_volume'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : counter.status === 'active'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {counter.status === 'high_volume'
                                    ? 'High Turnover Account'
                                    : counter.status === 'active'
                                    ? 'Active Account'
                                    : 'Refill Pending'}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 mt-1 flex items-center gap-3 flex-wrap">
                                <span className="font-semibold text-slate-800">
                                  Contact: {counter.contactPerson}
                                </span>
                                <span className="text-slate-300">&bull;</span>
                                <span className="flex items-center gap-1 text-slate-600">
                                  <Phone size={12} className="text-emerald-600" />
                                  {counter.phone}
                                </span>
                                <span className="text-slate-300">&bull;</span>
                                <span className="flex items-center gap-1 text-slate-500">
                                  <MapPin size={12} className="text-slate-400" />
                                  {counter.address} ({counter.territory})
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                              Monthly Sales Billed
                            </span>
                            <span className="text-base font-bold text-emerald-700 font-heading">
                              ₹{counter.totalMonthlyRevenue.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Payment Terms: {counter.creditDays} Days Credit
                            </span>
                          </div>
                        </div>

                        {/* Regulatory Licenses Strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-blue-600 shrink-0" weight="bold" />
                            <span className="text-slate-500">Drug License No:</span>
                            <span className="font-mono font-semibold text-slate-800">{counter.drugLicenseNo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Receipt size={16} className="text-purple-600 shrink-0" weight="bold" />
                            <span className="text-slate-500">GSTIN:</span>
                            <span className="font-mono font-semibold text-slate-800">{counter.gstin}</span>
                          </div>
                        </div>

                        {/* Medicines Sold & Showcased at this Counter */}
                        <div className="bg-emerald-50/40 rounded-xl p-3 sm:p-4 border border-emerald-100 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                              <Pill size={16} className="text-emerald-700" weight="bold" />
                              <span>Medicines Showcased & Sold at {counter.name}</span>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                              {productsList.length} Active SKUs Sold Here
                            </span>
                          </div>

                          {productsList.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No products registered at this counter yet.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-emerald-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-2 px-2">Showcased Medicine</th>
                                    <th className="py-2 px-2">Generic Composition</th>
                                    <th className="py-2 px-2 text-right">Monthly Units Sold</th>
                                    <th className="py-2 px-2 text-right">Billing Rate (PTR)</th>
                                    <th className="py-2 px-2 text-right">Total Invoiced</th>
                                    <th className="py-2 px-2 text-right">Last Order</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-100/70 font-medium text-slate-800">
                                  {productsList.map((item, idx) => {
                                    const totalItemVal = item.monthlyUnitsSold * item.billingRate;
                                    return (
                                      <tr key={idx} className="hover:bg-emerald-50/60 transition-colors">
                                        <td className="py-2 px-2 font-bold text-slate-900">
                                          {item.productName}
                                        </td>
                                        <td className="py-2 px-2 text-slate-600 text-[11px] max-w-[220px] truncate">
                                          {item.genericName || 'Standard formulation'}
                                        </td>
                                        <td className="py-2 px-2 text-right font-bold text-slate-800">
                                          {item.monthlyUnitsSold} units
                                        </td>
                                        <td className="py-2 px-2 text-right font-mono text-slate-700">
                                          ₹{item.billingRate.toFixed(2)}
                                        </td>
                                        <td className="py-2 px-2 text-right font-bold text-emerald-700 font-mono">
                                          ₹{totalItemVal.toLocaleString('en-IN')}
                                        </td>
                                        <td className="py-2 px-2 text-right text-slate-500 text-[11px]">
                                          {item.lastOrderDate} (₹{item.lastOrderAmount.toLocaleString('en-IN')})
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ALL SHOWCASED PRODUCTS MATRIX */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Total Formulations Showcased by {rep.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive cross-reference of medicines showcased to doctors vs. retail counters stocking them.
                  </p>
                </div>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md">
                  {filteredShowcasedProducts.length} Formulations Active
                </span>
              </div>

              {filteredShowcasedProducts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Pill size={36} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No products match your filter</p>
                  <p className="text-xs text-slate-400 mt-1">Try selecting 'All Categories' or resetting search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredShowcasedProducts.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-purple-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900 font-heading">
                              {item.productName}
                            </h4>
                            {item.category && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                {item.category}
                              </span>
                            )}
                          </div>
                          {item.genericName && (
                            <p className="text-xs text-slate-600 mt-0.5 font-medium">
                              {item.genericName}
                            </p>
                          )}
                        </div>

                        {item.totalValue > 0 && (
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Chemist Sales
                            </span>
                            <span className="text-xs font-bold text-emerald-700 font-mono">
                              ₹{item.totalValue.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Doctor Detailing Reach */}
                      <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs space-y-1.5">
                        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                          <User size={13} weight="bold" />
                          Physicians Detailed To ({item.doctorsShowcasedTo.length}):
                        </span>
                        {item.doctorsShowcasedTo.length === 0 ? (
                          <span className="text-slate-400 text-[11px] block">No doctors specifically tagged</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {item.doctorsShowcasedTo.map(doc => (
                              <span
                                key={doc.id}
                                className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-slate-800 text-[11px] font-medium"
                              >
                                {doc.name} ({doc.specialty.split(' ')[0]})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Retail Counter Selling Reach */}
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs space-y-1.5">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                          <Storefront size={13} weight="bold" />
                          Retail Chemist Accounts Stocking ({item.countersStocking.length}):
                        </span>
                        {item.countersStocking.length === 0 ? (
                          <span className="text-slate-400 text-[11px] block">No retail chemist orders registered yet</span>
                        ) : (
                          <div className="space-y-1">
                            {item.countersStocking.map(({ counter, units, monthlyValue }, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex items-center justify-between bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-[11px]"
                              >
                                <span className="font-medium text-slate-800">{counter.name}</span>
                                <span className="font-bold text-emerald-700">
                                  {units} units &bull; ₹{monthlyValue.toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Rep: <strong className="text-slate-800">{rep.name}</strong></span>
            <span>&bull;</span>
            <span>Territory: <strong className="text-slate-800">{rep.territory}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            Close Activity View
          </button>
        </div>

        {/* ADD RETAIL COUNTER MODAL SUB-VIEW */}
        {isAddCounterOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <Storefront size={20} weight="bold" />
                  <h3 className="text-base text-slate-900 font-heading">Register New Retail Counter</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCounterOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCounter} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chemist / Pharmacy Shop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCounterName}
                    onChange={(e) => setNewCounterName(e.target.value)}
                    placeholder="e.g. Metro Lifeline Medicos"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Counter Type
                    </label>
                    <select
                      value={newCounterType}
                      onChange={(e) => setNewCounterType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="retail_chemist">Retail Chemist</option>
                      <option value="hospital_pharmacy">Hospital Pharmacy</option>
                      <option value="clinic_counter">Clinic Attached Counter</option>
                      <option value="chain_pharmacy">Chain Pharmacy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={newContactPerson}
                      onChange={(e) => setNewContactPerson(e.target.value)}
                      placeholder="e.g. Mr. Rajesh Patel"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Direct Mobile
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+91 98200 XXXXX"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Payment Credit Days
                    </label>
                    <input
                      type="number"
                      value={newCreditDays}
                      onChange={(e) => setNewCreditDays(Number(e.target.value))}
                      placeholder="21"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Shop Address & Locality
                  </label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Shop No. 4, Opposite Civil Hospital"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Drug License No.
                    </label>
                    <input
                      type="text"
                      value={newDrugLicense}
                      onChange={(e) => setNewDrugLicense(e.target.value)}
                      placeholder="20B/21B-MH-102938"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      value={newGstin}
                      onChange={(e) => setNewGstin(e.target.value)}
                      placeholder="27AABCM1234F1Z8"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Showcased Medicines to Supply */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medicines Showcased & Supplied to this Counter
                  </label>
                  <div className="border border-slate-200 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-slate-50">
                    {products.map(p => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 text-xs text-slate-800 hover:bg-slate-100 p-1 rounded-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProductsForCounter.includes(p.name)}
                          onChange={() => toggleProductSelection(p.name)}
                          className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-bold">{p.name}</span>
                        <span className="text-slate-500 text-[11px]">({p.category || 'General'})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddCounterOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                  >
                    Save & Assign Counter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* MODAL: Edit Territory Triggered from Network Modal */}
        {isTerritoryModalOpen && (
          <RepTerritoryModal
            rep={rep}
            isOpen={isTerritoryModalOpen}
            onClose={() => setIsTerritoryModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
