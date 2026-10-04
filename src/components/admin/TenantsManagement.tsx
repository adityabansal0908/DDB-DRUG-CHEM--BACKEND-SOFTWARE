import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Organization, TenantPlan } from '../../types';
import {
  Buildings,
  Plus,
  ShieldCheck,
  CheckCircle,
  ArrowSquareOut,
  Users,
  Pill,
  MapPin,
  EnvelopeSimple,
  Phone,
  IdentificationCard,
  CreditCard,
  LockKey,
  Database,
  ChartPieSlice,
  Gear,
  Check,
  X,
  Sparkle,
  Globe,
  Trash,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export const TenantsManagement: React.FC = () => {
  const {
    organizations,
    activeOrganization,
    switchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    products,
    doctors,
    reps,
    orders,
    retailCounters,
    currentUser,
    tenantQuotaUsage
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  // New Organization Form State
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgLegalName, setNewOrgLegalName] = useState('');
  const [newOrgTagline, setNewOrgTagline] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState<TenantPlan>('professional');
  const [newOrgPrimaryColor, setNewOrgPrimaryColor] = useState('#2563eb');
  const [newOrgCity, setNewOrgCity] = useState('');
  const [newOrgState, setNewOrgState] = useState('');
  const [newOrgEmail, setNewOrgEmail] = useState('');
  const [newOrgPhone, setNewOrgPhone] = useState('');
  const [newOrgDrugLicense, setNewOrgDrugLicense] = useState('');
  const [newOrgGstin, setNewOrgGstin] = useState('');
  const [newOrgSeedData, setNewOrgSeedData] = useState(true);

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setNewOrgName(val);
    if (!newOrgSlug || newOrgSlug === newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setNewOrgSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) {
      toast.error('Organization name is required');
      return;
    }
    const cleanSlug = (newOrgSlug || newOrgName).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!cleanSlug) {
      toast.error('Organization code/slug is required');
      return;
    }

    const created = createOrganization({
      name: newOrgName.trim(),
      slug: cleanSlug,
      legalName: newOrgLegalName.trim() || `${newOrgName.trim()} Private Limited`,
      tagline: newOrgTagline.trim() || 'Pharmaceutical Formulation & Healthcare Distribution',
      plan: newOrgPlan,
      primaryColor: newOrgPrimaryColor,
      city: newOrgCity.trim() || 'Mumbai',
      state: newOrgState.trim() || 'Maharashtra',
      contactEmail: newOrgEmail.trim() || currentUser?.email || 'admin@pharma.com',
      contactPhone: newOrgPhone.trim() || '+91 98000 00000',
      drugLicenseNo: newOrgDrugLicense.trim() || `DL-20B/21B-${cleanSlug.slice(0, 3).toUpperCase()}-2026-001`,
      gstin: newOrgGstin.trim() || '27AAACZ0000A1Z5',
      seedStarterData: newOrgSeedData
    });

    setIsCreateModalOpen(false);
    resetForm();
    toast.success(`Organization "${created.name}" provisioned and activated successfully!`);
  };

  const resetForm = () => {
    setNewOrgName('');
    setNewOrgSlug('');
    setNewOrgLegalName('');
    setNewOrgTagline('');
    setNewOrgPlan('professional');
    setNewOrgPrimaryColor('#2563eb');
    setNewOrgCity('');
    setNewOrgState('');
    setNewOrgEmail('');
    setNewOrgPhone('');
    setNewOrgDrugLicense('');
    setNewOrgGstin('');
    setNewOrgSeedData(true);
  };

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch =
      (org.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (org.slug || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (org.city || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (org.id || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesPlan = selectedPlanFilter === 'all' || org.plan === selectedPlanFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Buildings size={24} weight="duotone" />
            </span>
            <h1 className="text-2xl font-bold font-heading text-slate-900">
              Multi-Tenancy & Organization Isolation
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Enterprise B2B SaaS tenant boundary partitioning. Every pharmaceutical client operates inside a dedicated, 
            mathematically segregated tenant partition with isolated product catalogs, doctors, medical reps, telemetry, and billing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-medium text-sm transition-all shadow-sm cursor-pointer"
          >
            <Plus size={18} weight="bold" />
            <span>Provision New Tenant</span>
          </button>
        </div>
      </div>

      {/* Active Organization Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Partition Banner */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-slate-700 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Buildings size={220} weight="fill" />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck size={14} weight="bold" />
                  Active Tenant Partition
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {activeOrganization.plan.toUpperCase()} TIER
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Tenant Key: {activeOrganization.id}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs text-lg"
                  style={{ backgroundColor: activeOrganization.primaryColor || '#2563eb' }}
                >
                  {activeOrganization.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-heading text-white tracking-tight">
                    {activeOrganization.name}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {activeOrganization.legalName || activeOrganization.name} • {activeOrganization.city}, {activeOrganization.state}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 italic">
                "{activeOrganization.tagline || 'Quality Formulations & Healthcare Distribution'}"
              </p>
            </div>

            {/* Partition Security Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-700/60">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Isolated Products</span>
                <span className="text-lg font-bold text-white font-heading">{products.length}</span>
                <span className="text-[10px] text-slate-400 block">Formulations</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Assigned Doctors</span>
                <span className="text-lg font-bold text-white font-heading">{doctors.length}</span>
                <span className="text-[10px] text-slate-400 block">Target chambers</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Medical Reps</span>
                <span className="text-lg font-bold text-white font-heading">{reps.length}</span>
                <span className="text-[10px] text-slate-400 block">Seat capacity: {activeOrganization.maxReps}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Medical Stores</span>
                <span className="text-lg font-bold text-white font-heading">{retailCounters.length}</span>
                <span className="text-[10px] text-slate-400 block">Direct accounts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tenant Isolation Guard Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-3">
              <LockKey size={18} weight="bold" className="text-emerald-600" />
              <span>Multi-Tenant Security Architecture</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Strict Row-Level Segregation:</strong> All data queries enforce immutable <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">tenantId</code> filtering at the context boundary.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Zero Cross-Tenant Leakage:</strong> Formulations, price points, doctor notes, and medical rep locations remain completely invisible to other organizations.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Custom Brand Identity:</strong> Header logos, brand primary colors, invoice prefixes, and legal credentials dynamically adapt per tenant.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Seat Quota Utilization</span>
              <span className="font-semibold text-slate-700">
                {reps.length} of {activeOrganization.maxReps} Reps ({Math.round((reps.length / activeOrganization.maxReps) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, (reps.length / activeOrganization.maxReps) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Organizations Directory & Filtering */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search organizations, slugs, cities..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <Buildings size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            <select
              value={selectedPlanFilter}
              onChange={e => setSelectedPlanFilter(e.target.value)}
              className="py-2 px-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="all">All Plan Tiers</option>
              <option value="starter">Starter Plan</option>
              <option value="professional">Professional Plan</option>
              <option value="enterprise">Enterprise Plan</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredOrgs.length}</strong> of {organizations.length} Organizations
          </div>
        </div>

        {/* Organizations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Organization & Brand</th>
                <th className="py-3 px-4">Tenant Code / ID</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Jurisdiction & City</th>
                <th className="py-3 px-4">Drug License & GSTIN</th>
                <th className="py-3 px-4">Quota Capacity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrgs.map(org => {
                const isActive = org.id === activeOrganization.id;
                return (
                  <tr
                    key={org.id}
                    className={`transition-colors hover:bg-slate-50/60 ${
                      isActive ? 'bg-blue-50/40 font-medium' : ''
                    }`}
                  >
                    {/* Organization & Brand */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-2xs"
                          style={{ backgroundColor: org.primaryColor || '#2563eb' }}
                        >
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{org.name}</span>
                            {isActive && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 block truncate max-w-xs">
                            {org.legalName || org.tagline}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Slug / ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-slate-700 bg-slate-100 inline-block px-2 py-1 rounded border border-slate-200">
                        {org.id}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                        slug: /{org.slug}
                      </span>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          org.plan === 'enterprise'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : org.plan === 'professional'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {org.plan}
                      </span>
                    </td>

                    {/* Jurisdiction */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1 text-slate-800 font-medium">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{org.city || 'Delhi NCR'}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{org.state || 'India'}</span>
                    </td>

                    {/* Drug License */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="font-mono text-[11px] text-slate-800">
                        {org.drugLicenseNo || 'DL-PENDING'}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        GST: {org.gstin || '—'}
                      </span>
                    </td>

                    {/* Quota */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>
                        Max Reps: <strong className="text-slate-800">{org.maxReps}</strong>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Max Products: {org.maxProducts}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold px-3 py-1 bg-blue-50 rounded-lg">
                          <Check size={14} weight="bold" />
                          Current Partition
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => switchOrganization(org.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                        >
                          <ArrowsClockwise size={13} weight="bold" />
                          <span>Switch Tenant</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New Tenant Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Buildings size={22} weight="bold" />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900">
                    Provision New Organization
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create an isolated multi-tenant instance with its own catalog, sales force, and telemetry.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. NovaCare Laboratories"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tenant Slug (URL code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrgSlug}
                    onChange={e => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                    placeholder="novacare-pharma"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Corporate Legal Entity
                </label>
                <input
                  type="text"
                  value={newOrgLegalName}
                  onChange={e => setNewOrgLegalName(e.target.value)}
                  placeholder="e.g. NovaCare Healthcare & Lifesciences Pvt. Ltd."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SaaS Subscription Plan
                  </label>
                  <select
                    value={newOrgPlan}
                    onChange={e => setNewOrgPlan(e.target.value as TenantPlan)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="starter">Starter (Max 8 Reps, 100 Products)</option>
                    <option value="professional">Professional (Max 15 Reps, 200 Products)</option>
                    <option value="enterprise">Enterprise (Max 25+ Reps, 500 Products)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Brand Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newOrgPrimaryColor}
                      onChange={e => setNewOrgPrimaryColor(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newOrgPrimaryColor}
                      onChange={e => setNewOrgPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newOrgCity}
                    onChange={e => setNewOrgCity(e.target.value)}
                    placeholder="e.g. Ahmedabad, Bengaluru"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={newOrgState}
                    onChange={e => setNewOrgState(e.target.value)}
                    placeholder="e.g. Gujarat, Karnataka"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wholesale Drug License (20B/21B)
                  </label>
                  <input
                    type="text"
                    value={newOrgDrugLicense}
                    onChange={e => setNewOrgDrugLicense(e.target.value)}
                    placeholder="DL-20B/21B-GUJ-2026-9921"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={newOrgGstin}
                    onChange={e => setNewOrgGstin(e.target.value)}
                    placeholder="24AAACN9921D1ZB"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-900 block">
                    Seed Starter Pharma Data
                  </span>
                  <span className="text-[11px] text-blue-700 block">
                    Pre-populate with initial starter catalog formulations, sample doctor champer route, and test rep.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newOrgSeedData}
                  onChange={e => setNewOrgSeedData(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-sm rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Provision & Switch to Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
