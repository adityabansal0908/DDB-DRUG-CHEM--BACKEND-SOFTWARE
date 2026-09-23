import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Doctor, DoctorVisitingSlot } from '../../types';
import { DoctorExcelImportModal } from './DoctorExcelImportModal';
import {
  downloadDoctorExcelTemplate,
  parseVisitingSlotsString,
  formatVisitingSummary,
  ALL_WEEK_DAYS,
  STANDARD_WORK_DAYS
} from '../../utils/doctorExcelHelper';
import {
  MagnifyingGlass,
  Plus,
  Trash,
  Phone,
  Clock,
  CalendarCheck,
  Calendar,
  CheckCircle,
  Stethoscope,
  X,
  Buildings,
  NavigationArrow,
  MapPin,
  FileXls,
  DownloadSimple,
  Cake,
  Pill,
  ShieldCheck,
  PencilSimple,
  CaretDown,
  Check,
  Tag,
  Info,
  CaretLeft
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export const DoctorManagement: React.FC = () => {
  const {
    doctors,
    products,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    setSelectedDoctorForCheckin,
    setRole,
    setActiveRepTab,
    canGoBack,
    goBack,
    previousScreenName
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  // Multi-product dropdown state in modals
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Doctor Form Initial State
  const initialFormState = {
    name: '',
    specialty: 'Consultant Physician (MBBS, MD)',
    clinicName: '',
    address: '',
    city: 'Mumbai',
    area: 'Central Zone',
    phone: '',
    visitingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as string[],
    visitingSlots: [
      {
        id: 'slot-1',
        slotName: 'Morning Chamber',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      },
      {
        id: 'slot-2',
        slotName: 'Evening Clinic',
        startTime: '06:00 PM',
        endTime: '08:30 PM',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      }
    ] as DoctorVisitingSlot[],
    bestTimeToVisit: 'Mon - Sat • Morning Chamber (10:00 AM - 01:00 PM); Evening Clinic (06:00 PM - 08:30 PM)',
    targetVisitsPerMonth: 4,
    dateOfBirth: '',
    targetedProducts: [] as string[],
    adminRemarks: '',
    lat: 19.0760,
    lng: 72.8777
  };

  const [doctorForm, setDoctorForm] = useState(initialFormState);

  // Helper methods for visiting slots and days
  const handleAddVisitingSlot = () => {
    setDoctorForm((prev) => {
      const nextIdx = prev.visitingSlots.length + 1;
      const newSlot: DoctorVisitingSlot = {
        id: `slot-${Date.now()}`,
        slotName: nextIdx === 3 ? 'Afternoon Clinic' : `Slot ${nextIdx}`,
        startTime: '02:00 PM',
        endTime: '04:30 PM',
        days: [...prev.visitingDays]
      };
      const updatedSlots = [...prev.visitingSlots, newSlot];
      return {
        ...prev,
        visitingSlots: updatedSlots,
        bestTimeToVisit: formatVisitingSummary(prev.visitingDays, updatedSlots)
      };
    });
  };

  const handleRemoveVisitingSlot = (slotIndex: number) => {
    setDoctorForm((prev) => {
      if (prev.visitingSlots.length <= 1) {
        toast.info('At least one visiting slot is required');
        return prev;
      }
      const updatedSlots = prev.visitingSlots.filter((_, idx) => idx !== slotIndex);
      return {
        ...prev,
        visitingSlots: updatedSlots,
        bestTimeToVisit: formatVisitingSummary(prev.visitingDays, updatedSlots)
      };
    });
  };

  const handleUpdateVisitingSlot = (slotIndex: number, field: keyof DoctorVisitingSlot, value: any) => {
    setDoctorForm((prev) => {
      const updatedSlots = prev.visitingSlots.map((slot, idx) => {
        if (idx === slotIndex) {
          return { ...slot, [field]: value };
        }
        return slot;
      });
      return {
        ...prev,
        visitingSlots: updatedSlots,
        bestTimeToVisit: formatVisitingSummary(prev.visitingDays, updatedSlots)
      };
    });
  };

  const toggleVisitingDay = (day: string) => {
    setDoctorForm((prev) => {
      const exists = prev.visitingDays.includes(day);
      let newDays: string[];
      if (exists) {
        if (prev.visitingDays.length <= 1) {
          toast.info('Please keep at least one visiting day');
          return prev;
        }
        newDays = prev.visitingDays.filter((d) => d !== day);
      } else {
        newDays = ALL_WEEK_DAYS.filter((d) => prev.visitingDays.includes(d) || d === day);
      }
      return {
        ...prev,
        visitingDays: newDays,
        bestTimeToVisit: formatVisitingSummary(newDays, prev.visitingSlots)
      };
    });
  };

  const setVisitingDaysPreset = (preset: 'all' | 'mon-sat' | 'mon-fri' | 'mwf' | 'tts') => {
    let days: string[];
    switch (preset) {
      case 'all':
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        break;
      case 'mon-sat':
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        break;
      case 'mon-fri':
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        break;
      case 'mwf':
        days = ['Mon', 'Wed', 'Fri'];
        break;
      case 'tts':
        days = ['Tue', 'Thu', 'Sat'];
        break;
    }
    setDoctorForm((prev) => ({
      ...prev,
      visitingDays: days,
      bestTimeToVisit: formatVisitingSummary(days, prev.visitingSlots)
    }));
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const specialties = [
    'All',
    'Cardiologist (MD, DM)',
    'Gastroenterologist (MD, DM)',
    'Pulmonologist & Chest Specialist',
    'Consultant Diabetologist & Endocrinologist',
    'General Physician (MD)',
    'Pediatrician (MD)'
  ];

  // Derive unique cities
  const uniqueCities = Array.from(
    new Set(doctors.map((d) => d.city).filter((c): c is string => Boolean(c?.trim())))
  );

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpecialty =
      selectedSpecialty === 'All' ||
      doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());

    const matchesCity =
      selectedCity === 'All' ||
      (doc.city && doc.city.toLowerCase() === selectedCity.toLowerCase());

    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      doc.name.toLowerCase().includes(query) ||
      doc.clinicName.toLowerCase().includes(query) ||
      (doc.city && doc.city.toLowerCase().includes(query)) ||
      doc.area.toLowerCase().includes(query) ||
      doc.specialty.toLowerCase().includes(query) ||
      (doc.targetedProducts && doc.targetedProducts.some((p) => p.toLowerCase().includes(query))) ||
      (doc.adminRemarks && doc.adminRemarks.toLowerCase().includes(query));

    return matchesSpecialty && matchesCity && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setDoctorForm(initialFormState);
    setIsProductDropdownOpen(false);
    setProductSearchQuery('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (doc: Doctor) => {
    setEditingDoctorId(doc.id);
    const visitingDays =
      doc.visitingDays && doc.visitingDays.length > 0
        ? doc.visitingDays
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const visitingSlots =
      doc.visitingSlots && doc.visitingSlots.length > 0
        ? doc.visitingSlots
        : parseVisitingSlotsString(doc.bestTimeToVisit, visitingDays);

    setDoctorForm({
      name: doc.name,
      specialty: doc.specialty,
      clinicName: doc.clinicName,
      address: doc.address,
      city: doc.city || 'Mumbai',
      area: doc.area,
      phone: doc.phone,
      visitingDays,
      visitingSlots,
      bestTimeToVisit: formatVisitingSummary(visitingDays, visitingSlots),
      targetVisitsPerMonth: doc.targetVisitsPerMonth || 4,
      dateOfBirth: doc.dateOfBirth || '',
      targetedProducts: doc.targetedProducts || [],
      adminRemarks: doc.adminRemarks || '',
      lat: doc.coordinates?.lat || 19.0760,
      lng: doc.coordinates?.lng || 72.8777
    });
    setIsProductDropdownOpen(false);
    setProductSearchQuery('');
    setIsEditModalOpen(true);
  };

  const toggleProductSelection = (productName: string) => {
    setDoctorForm((prev) => {
      const exists = prev.targetedProducts.includes(productName);
      if (exists) {
        return {
          ...prev,
          targetedProducts: prev.targetedProducts.filter((p) => p !== productName)
        };
      } else {
        return {
          ...prev,
          targetedProducts: [...prev.targetedProducts, productName]
        };
      }
    });
  };

  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.name.trim() || !doctorForm.clinicName.trim()) {
      toast.error('Doctor name and clinic chamber are required');
      return;
    }

    const doctorName = doctorForm.name.startsWith('Dr.') ? doctorForm.name : `Dr. ${doctorForm.name}`;
    const compositeSchedule = formatVisitingSummary(doctorForm.visitingDays, doctorForm.visitingSlots);

    addDoctor({
      name: doctorName,
      specialty: doctorForm.specialty,
      clinicName: doctorForm.clinicName,
      address: doctorForm.address || `${doctorForm.clinicName}, ${doctorForm.area}, ${doctorForm.city}`,
      city: doctorForm.city.trim() || 'Mumbai',
      area: doctorForm.area,
      phone: doctorForm.phone || '+91 98201 00000',
      bestTimeToVisit: compositeSchedule,
      visitingDays: doctorForm.visitingDays,
      visitingSlots: doctorForm.visitingSlots,
      targetVisitsPerMonth: Number(doctorForm.targetVisitsPerMonth) || 4,
      avatarUrl: `https://images.unsplash.com/photo-${1622253692010 + Math.floor(Math.random() * 50)}?crop=entropy&cs=srgb&fm=jpg&w=150`,
      dateOfBirth: doctorForm.dateOfBirth,
      targetedProducts: doctorForm.targetedProducts,
      adminRemarks: doctorForm.adminRemarks,
      coordinates: {
        lat: Number(doctorForm.lat) || 19.0760,
        lng: Number(doctorForm.lng) || 72.8777
      },
      scheduledTime: doctorForm.visitingSlots[0]?.startTime || '11:00 AM',
      status: 'pending'
    });

    setIsAddModalOpen(false);
  };

  const handleUpdateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctorId) return;

    const doctorName = doctorForm.name.startsWith('Dr.') ? doctorForm.name : `Dr. ${doctorForm.name}`;
    const compositeSchedule = formatVisitingSummary(doctorForm.visitingDays, doctorForm.visitingSlots);

    updateDoctor(editingDoctorId, {
      name: doctorName,
      specialty: doctorForm.specialty,
      clinicName: doctorForm.clinicName,
      address: doctorForm.address,
      city: doctorForm.city.trim() || 'Mumbai',
      area: doctorForm.area,
      phone: doctorForm.phone,
      bestTimeToVisit: compositeSchedule,
      visitingDays: doctorForm.visitingDays,
      visitingSlots: doctorForm.visitingSlots,
      targetVisitsPerMonth: Number(doctorForm.targetVisitsPerMonth) || 4,
      dateOfBirth: doctorForm.dateOfBirth,
      targetedProducts: doctorForm.targetedProducts,
      adminRemarks: doctorForm.adminRemarks,
      coordinates: {
        lat: Number(doctorForm.lat) || 19.0760,
        lng: Number(doctorForm.lng) || 72.8777
      }
    });

    setIsEditModalOpen(false);
    setEditingDoctorId(null);
  };

  const handleAssignCheckin = (doc: Doctor) => {
    setSelectedDoctorForCheckin(doc);
    setRole('sales_rep');
    setActiveRepTab('checkin');
  };

  // Filtered product catalogue for multi-select dropdown
  const filteredProductsForDropdown = products.filter((p) => {
    if (!productSearchQuery) return true;
    const q = productSearchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.genericName.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  return (
    <div
      id="doctors-management-page"
      data-testid="doctors-management-page"
      className="p-3 sm:p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-4 sm:space-y-6"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {canGoBack && (
            <button
              type="button"
              id="doctor-management-back-btn"
              data-testid="doctor-management-back-btn"
              onClick={goBack}
              title={`Go back to ${previousScreenName} (<)`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition-colors cursor-pointer group"
            >
              <CaretLeft size={14} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to {previousScreenName}</span>
            </button>
          )}
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-blue-600 block mb-1">
            Operations Console
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 font-heading">
            Doctor's Directory
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Physician chambers, city belts, birth dates, targeted product detailing & confidential admin remarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Download Template */}
          <button
            id="download-doctor-template-header-btn"
            data-testid="download-doctor-template-header-btn"
            onClick={() => downloadDoctorExcelTemplate(products)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            title="Download Excel template with visiting days, multiple visiting time slots, and doctor details"
          >
            <DownloadSimple size={16} weight="bold" />
            <span className="hidden sm:inline">Excel Template</span>
          </button>

          {/* Import Excel Button */}
          <button
            id="import-doctor-excel-btn"
            data-testid="import-doctor-excel-btn"
            onClick={() => setIsExcelImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <FileXls size={18} weight="bold" />
            <span>Import Excel</span>
          </button>

          {/* Add New Doctor Button */}
          <button
            id="add-doctor-btn"
            data-testid="add-doctor-btn"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus size={18} weight="bold" />
            <span>Add New Doctor</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Registered Doctors</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{doctors.length}</p>
          <span className="text-xs text-blue-600 font-medium">Mapped to territory routes</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Cities Covered</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{uniqueCities.length || 1}</p>
          <span className="text-xs text-slate-500">Across medical belts</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Visits Completed This Month</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {doctors.reduce((sum, d) => sum + (d.visitsCompletedThisMonth || 0), 0)}
          </p>
          <span className="text-xs text-slate-500">Across all chambers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Formulations Marketed</span>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {new Set(doctors.flatMap((d) => d.targetedProducts || [])).size}
          </p>
          <span className="text-xs text-slate-500">Active catalog linkages</span>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            data-testid="doctor-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search doctor, clinic, city, product, remarks..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* City Filter */}
          {uniqueCities.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">City:</span>
              <select
                data-testid="doctor-city-filter"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Cities</option>
                {uniqueCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Specialty Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Specialty:</span>
            <select
              data-testid="doctor-specialty-filter"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctor Cards / Table */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Stethoscope size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-heading">No Doctors Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {searchTerm || selectedSpecialty !== 'All' || selectedCity !== 'All'
              ? 'No physicians match your search criteria. Try modifying your filters.'
              : 'The doctor directory is currently empty. Add doctor profiles or import an Excel spreadsheet to begin tracking rep detailing.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsExcelImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <FileXls size={16} weight="bold" />
              <span>Import from Excel</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus size={16} weight="bold" />
              <span>Add Doctor</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table
              id="doctors-table"
              data-testid="doctors-table"
              className="w-full text-left text-sm border-collapse"
            >
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">Doctor & Specialty</th>
                  <th className="py-3.5 px-4">Chamber & City</th>
                  <th className="py-3.5 px-4">Territory & Contact</th>
                  <th className="py-3.5 px-4">Visiting Schedule (Days & Slots)</th>
                  <th className="py-3.5 px-4">Marketed Products</th>
                  <th className="py-3.5 px-4">Admin Remarks</th>
                  <th className="py-3.5 px-4 text-center">Monthly Quota</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoctors.map((doc) => {
                  const target = doc.targetVisitsPerMonth || 4;
                  const completed = doc.visitsCompletedThisMonth || 0;
                  const progressPct = Math.min(100, Math.round((completed / target) * 100));

                  return (
                    <tr
                      key={doc.id}
                      data-testid={`doctor-row-${doc.id}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Doctor Profile & DOB */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={doc.avatarUrl}
                            alt={doc.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block font-heading">
                              {doc.name}
                            </span>
                            <span className="text-xs text-blue-700 font-medium block">
                              {doc.specialty}
                            </span>
                            {/* Doctor Birth Date */}
                            {doc.dateOfBirth ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 mt-1">
                                <Cake size={12} className="text-amber-600" />
                                <span>DOB: {doc.dateOfBirth}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic block mt-0.5">
                                DOB not set
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Clinic Info & City */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm">
                            <Buildings size={14} className="text-slate-400 shrink-0" />
                            {doc.clinicName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {/* City Badge */}
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {doc.city || 'Mumbai'}
                            </span>
                            <span className="text-xs text-slate-500 truncate max-w-[180px]">
                              {doc.address}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Area & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-medium">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            {doc.area}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone size={11} className="shrink-0" /> {doc.phone}
                          </span>
                        </div>
                      </td>

                      {/* Visiting Schedule (Visiting Days & Multiple Slots) */}
                      <td className="py-3.5 px-4 min-w-[210px]">
                        <div className="space-y-1.5">
                          {/* Visiting Days Badge */}
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md w-fit">
                            <Calendar size={12} className="text-indigo-600 shrink-0" />
                            <span>
                              {doc.visitingDays && doc.visitingDays.length > 0
                                ? doc.visitingDays.length === 7
                                  ? 'All Week (Mon-Sun)'
                                  : doc.visitingDays.length === 6 && !doc.visitingDays.includes('Sun')
                                  ? 'Mon - Sat'
                                  : doc.visitingDays.length === 5 && !doc.visitingDays.includes('Sat') && !doc.visitingDays.includes('Sun')
                                  ? 'Mon - Fri'
                                  : doc.visitingDays.join(', ')
                                : 'Mon - Sat'}
                            </span>
                          </div>

                          {/* Time Slots List */}
                          <div className="flex flex-col gap-1">
                            {doc.visitingSlots && doc.visitingSlots.length > 0 ? (
                              doc.visitingSlots.map((slot, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md font-mono w-fit"
                                >
                                  <Clock size={12} className="text-blue-600 shrink-0" />
                                  <span className="font-semibold text-slate-900">{slot.slotName || `Slot ${sIdx + 1}`}:</span>
                                  <span>{slot.startTime}{slot.endTime ? ` - ${slot.endTime}` : ''}</span>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-md w-fit">
                                <Clock size={13} className="text-blue-600 shrink-0" />
                                <span className="font-medium">{doc.bestTimeToVisit}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Marketed Products List */}
                      <td className="py-3.5 px-4">
                        {doc.targetedProducts && doc.targetedProducts.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {doc.targetedProducts.map((p, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                title={`Product marketed: ${p}`}
                              >
                                <Pill size={11} className="text-blue-500" />
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No products assigned</span>
                        )}
                      </td>

                      {/* Admin Remarks (Admin Only) */}
                      <td className="py-3.5 px-4">
                        {doc.adminRemarks ? (
                          <div
                            className="bg-purple-50/80 border border-purple-200/80 rounded-lg p-2 text-xs text-purple-900 max-w-[200px]"
                            title={doc.adminRemarks}
                          >
                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 mb-0.5">
                              <ShieldCheck size={12} weight="bold" />
                              <span>Admin Remark</span>
                            </div>
                            <p className="line-clamp-2 text-[11px] leading-tight">
                              {doc.adminRemarks}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Quota Progress */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-800 tabular-nums">
                            {completed} / {target} visits
                          </span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                progressPct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            doc.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {doc.status === 'completed' ? (
                            <>
                              <CheckCircle size={13} weight="fill" />
                              Visited
                            </>
                          ) : (
                            <>
                              <CalendarCheck size={13} weight="fill" />
                              Upcoming
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Detail in sales rep */}
                          <button
                            onClick={() => handleAssignCheckin(doc)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                            title="Open in Sales Rep Check-in"
                          >
                            <NavigationArrow size={12} weight="fill" />
                            <span>Detail</span>
                          </button>

                          {/* Edit Doctor */}
                          <button
                            data-testid={`edit-doctor-btn-${doc.id}`}
                            onClick={() => handleOpenEditModal(doc)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit physician profile"
                          >
                            <PencilSimple size={15} />
                          </button>

                          {/* Delete Doctor */}
                          <button
                            data-testid={`delete-doctor-btn-${doc.id}`}
                            onClick={() => deleteDoctor(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove doctor"
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT DOCTOR MODAL */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div
          id="doctor-form-modal-backdrop"
          data-testid="doctor-form-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="doctor-modal-back-btn"
                  data-testid="doctor-modal-back-btn"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  title="Go back to Doctor Directory (<)"
                  aria-label="Back to Doctor Directory"
                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <CaretLeft size={18} weight="bold" />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-heading">
                    {isEditModalOpen ? 'Edit Doctor Profile' : 'Add Doctor to Directory'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Register physician chamber, city, birth date, marketed formulations & admin remarks.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={isEditModalOpen ? handleUpdateDoctor : handleCreateDoctor}
              className="space-y-4 overflow-y-auto pr-1 flex-1"
            >
              {/* Row 1: Doctor Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  required
                  data-testid="doctor-name-input"
                  placeholder="e.g. Dr. Anand Verma"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Row 2: Specialty & Territory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Specialty / Degree *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="doctor-specialty-input"
                    placeholder="e.g. Cardiologist (MD, DM)"
                    value={doctorForm.specialty}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Territory / Area *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="doctor-area-input"
                    placeholder="e.g. South Zone / Bandra"
                    value={doctorForm.area}
                    onChange={(e) => setDoctorForm({ ...doctorForm, area: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 3: Requirement 1 - Box specifying City & Clinic Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                    <span>City *</span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Field 1: City
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="doctor-city-input"
                    placeholder="e.g. Mumbai, New Delhi, Pune, Ahmedabad"
                    value={doctorForm.city}
                    onChange={(e) => setDoctorForm({ ...doctorForm, city: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Clinic / Hospital Chamber *
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="doctor-clinic-input"
                    placeholder="e.g. City Life Multispecialty Clinic"
                    value={doctorForm.clinicName}
                    onChange={(e) => setDoctorForm({ ...doctorForm, clinicName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 4: Chamber Address & Contact Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Chamber Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 204, Doctor Chambers, Opp. Civil Hospital"
                    value={doctorForm.address}
                    onChange={(e) => setDoctorForm({ ...doctorForm, address: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98200 12345"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 5: Doctor Chamber Visiting Schedule (Visiting Days & Multiple Time Slots) */}
              <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Clock size={16} weight="bold" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Doctor Visiting Schedule & Slots
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Configure visiting days and multiple consultation time slots
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/90 px-2 py-0.5 rounded-md">
                    Multi-Slot Support
                  </span>
                </div>

                {/* 1. Visiting Days Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Calendar size={14} className="text-indigo-600" />
                      <span>Visiting Days ({doctorForm.visitingDays.length} Selected)</span>
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setVisitingDaysPreset('mon-sat')}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium cursor-pointer"
                      >
                        Mon - Sat
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setVisitingDaysPreset('mon-fri')}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium cursor-pointer"
                      >
                        Mon - Fri
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setVisitingDaysPreset('all')}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium cursor-pointer"
                      >
                        All Week
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setVisitingDaysPreset('mwf')}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium cursor-pointer"
                      >
                        M-W-F
                      </button>
                    </div>
                  </div>

                  {/* Day Pills */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {ALL_WEEK_DAYS.map((day) => {
                      const isSelected = doctorForm.visitingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleVisitingDay(day)}
                          className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/70'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Multiple Visiting Time Slots */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Clock size={14} className="text-blue-600" />
                      <span>Visiting Time Slots ({doctorForm.visitingSlots.length})</span>
                    </label>
                    <button
                      type="button"
                      id="add-visiting-slot-modal-btn"
                      onClick={handleAddVisitingSlot}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus size={13} weight="bold" />
                      <span>Add Another Slot</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {doctorForm.visitingSlots.map((slot, sIdx) => (
                      <div
                        key={slot.id || sIdx}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shadow-2xs"
                      >
                        {/* Slot label */}
                        <div className="w-full sm:w-5/12">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Slot Name / Chamber
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Morning Chamber, Evening Clinic"
                            value={slot.slotName || ''}
                            onChange={(e) => handleUpdateVisitingSlot(sIdx, 'slotName', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Start Time */}
                        <div className="w-full sm:w-3/12">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Start Time
                          </label>
                          <input
                            type="text"
                            placeholder="10:00 AM"
                            value={slot.startTime}
                            onChange={(e) => handleUpdateVisitingSlot(sIdx, 'startTime', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        {/* End Time */}
                        <div className="w-full sm:w-4/12">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            End Time
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="01:00 PM"
                              value={slot.endTime}
                              onChange={(e) => handleUpdateVisitingSlot(sIdx, 'endTime', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                            {doctorForm.visitingSlots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveVisitingSlot(sIdx)}
                                title="Remove this visiting slot"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                              >
                                <Trash size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary preview badge */}
                  <div className="mt-2.5 text-[11px] text-slate-600 bg-white border border-slate-200/80 rounded-lg p-2.5 flex items-start gap-2">
                    <Info size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700">Combined Field Schedule: </span>
                      <span className="text-slate-800 font-medium">{doctorForm.bestTimeToVisit}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 6: Requirement 2 - Doctor's Birth Date & Target Visits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Cake size={14} className="text-amber-600" />
                      Doctor's Birth Date
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                      Field 2: Birth Date
                    </span>
                  </label>
                  <input
                    type="date"
                    data-testid="doctor-birthdate-input"
                    value={doctorForm.dateOfBirth}
                    onChange={(e) => setDoctorForm({ ...doctorForm, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Used for doctor birthday greetings & relationship milestone tracking
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Monthly Target Visits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={doctorForm.targetVisitsPerMonth}
                    onChange={(e) =>
                      setDoctorForm({
                        ...doctorForm,
                        targetVisitsPerMonth: parseInt(e.target.value) || 4
                      })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Target detailing calls required per calendar month
                  </span>
                </div>
              </div>

              {/* Row 7: Requirement 3 - Multi-Product List-Down Box Fetching from Product Catalogue */}
              <div className="space-y-1.5" ref={productDropdownRef}>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Pill size={14} className="text-blue-600" />
                    Targeted Formulations (Products Marketed to Doctor)
                  </span>
                  <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                    Field 3: Fetched from Catalogue ({products.length} Available)
                  </span>
                </label>

                {/* Selected Products Badges */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {doctorForm.targetedProducts.length === 0 ? (
                    <span className="text-xs text-slate-400 py-0.5">
                      No formulations selected yet. Click the list-down box below to assign products.
                    </span>
                  ) : (
                    doctorForm.targetedProducts.map((prodName) => (
                      <span
                        key={prodName}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        <Pill size={12} className="text-blue-600" />
                        <span>{prodName}</span>
                        <button
                          type="button"
                          onClick={() => toggleProductSelection(prodName)}
                          className="text-blue-500 hover:text-blue-800 p-0.5 rounded-full hover:bg-blue-200/60"
                        >
                          <X size={12} weight="bold" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Dropdown Toggle Button */}
                <div className="relative">
                  <button
                    type="button"
                    data-testid="product-dropdown-toggle-btn"
                    onClick={() => setIsProductDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <Tag size={15} className="text-blue-600" />
                      <span>
                        {doctorForm.targetedProducts.length > 0
                          ? `${doctorForm.targetedProducts.length} Formulations Selected`
                          : 'Select products marketed to this doctor...'}
                      </span>
                    </span>
                    <CaretDown
                      size={15}
                      className={`transition-transform duration-200 ${
                        isProductDropdownOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isProductDropdownOpen && (
                    <div
                      id="product-catalogue-dropdown-menu"
                      data-testid="product-catalogue-dropdown-menu"
                      className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                    >
                      {/* Search Inside Dropdown */}
                      <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                          <MagnifyingGlass size={15} className="absolute left-2.5 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search catalog by name, salt, or category..."
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 p-1">
                        {products.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 space-y-1">
                            <Info size={18} className="mx-auto text-blue-500 mb-1" />
                            <p className="font-semibold text-slate-700">Product catalogue is empty</p>
                            <p>Import products in Product Management to populate this list.</p>
                          </div>
                        ) : filteredProductsForDropdown.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No matching formulations found for "{productSearchQuery}"
                          </div>
                        ) : (
                          filteredProductsForDropdown.map((p) => {
                            const isSelected = doctorForm.targetedProducts.includes(p.name);
                            return (
                              <div
                                key={p.id}
                                onClick={() => toggleProductSelection(p.name)}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                  isSelected ? 'bg-blue-50/70 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                      isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isSelected && <Check size={12} weight="bold" />}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{p.name}</div>
                                    <div className="text-[11px] text-slate-500">
                                      {p.genericName} {p.category ? `• ${p.category}` : ''}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                  MRP ₹{p.mrp}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Dropdown Quick Actions */}
                      <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">
                          {doctorForm.targetedProducts.length} selected
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setDoctorForm((prev) => ({
                                ...prev,
                                targetedProducts: products.map((p) => p.name)
                              }))
                            }
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() =>
                              setDoctorForm((prev) => ({
                                ...prev,
                                targetedProducts: []
                              }))
                            }
                            className="text-slate-500 hover:text-slate-700"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 8: Requirement 4 - Box for Remarks to be Filled by Admin Only */}
              <div className="space-y-1.5 bg-purple-50/50 border border-purple-200/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                    <ShieldCheck size={16} weight="bold" className="text-purple-700" />
                    <span>Admin Remarks (Admin Only)</span>
                  </label>
                  <span className="text-[10px] text-purple-800 font-bold bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                    Confidential • Internal Admin Notes
                  </span>
                </div>
                <textarea
                  rows={2}
                  data-testid="doctor-admin-remarks-input"
                  placeholder="Enter private administrative observations, prescription volume notes, key opinion leader status, or preferred visit guidance..."
                  value={doctorForm.adminRemarks}
                  onChange={(e) => setDoctorForm({ ...doctorForm, adminRemarks: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <span className="text-[11px] text-purple-700 block">
                  Remarks are visible strictly on the operations console and cannot be modified by field reps.
                </span>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-doctor-submit-btn"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
                >
                  {isEditModalOpen ? 'Save Changes' : 'Save Doctor Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCTOR EXCEL IMPORT MODAL */}
      <DoctorExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
      />
    </div>
  );
};
