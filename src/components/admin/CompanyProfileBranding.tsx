import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanyProfile } from '../../types';
import { CompanyLogo } from '../CompanyLogo';
import {
  Buildings,
  Palette,
  IdentificationCard,
  FileText,
  UploadSimple,
  Trash,
  CheckCircle,
  ArrowClockwise,
  FloppyDisk,
  DownloadSimple,
  Sparkle,
  Globe,
  EnvelopeSimple,
  Phone,
  MapPin,
  ShieldCheck,
  Receipt,
  Users,
  Eye,
  ArrowsClockwise,
  Check,
  WarningCircle
} from '@phosphor-icons/react';
import { toast } from 'sonner';

// Curated enterprise color palettes for pharma / medical brands
const PRESET_BRAND_COLORS = [
  { name: 'Clinical Blue', hex: '#2563eb', desc: 'Classic trustworthy pharma blue' },
  { name: 'Medical Teal', hex: '#0d9488', desc: 'Modern surgical & healthcare teal' },
  { name: 'Bio Emerald', hex: '#059669', desc: 'Natural botanical & therapeutic green' },
  { name: 'Royal Indigo', hex: '#4f46e5', desc: 'Premium enterprise life sciences' },
  { name: 'Amethyst Violet', hex: '#7c3aed', desc: 'Specialty neurology & oncology' },
  { name: 'Healthcare Crimson', hex: '#dc2626', desc: 'Urgent cardiology & vital care' },
  { name: 'Solar Amber', hex: '#d97706', desc: 'Vitamins, nutraceuticals & wellness' },
  { name: 'Slate Corporate', hex: '#334155', desc: 'Understated pharmaceutical holding' }
];

const PRESET_ICONS = [
  { id: 'pill_capsule', label: 'Dual-Action Capsule', desc: 'Two-tone pharmaceutical capsule with medical cross' },
  { id: 'medical_cross', label: 'Shield & Swiss Cross', desc: 'Clinical cross inside a protective rounded shield' },
  { id: 'caduceus', label: 'Asclepius Caduceus', desc: 'Staff of healing & medicine with twin intertwining serpents' },
  { id: 'molecule', label: 'Molecular Formula', desc: 'Hexagonal active pharmaceutical ingredient (API) structure' },
  { id: 'flask', label: 'Laboratory Flask', desc: 'Scientific Erlenmeyer formulation flask with reactive nodes' }
];

export const CompanyProfileBranding: React.FC = () => {
  const {
    companyProfile,
    updateCompanyProfile,
    resetCompanyProfileToDefault,
    reps,
    currentUser,
    activeOrganization,
    activeTenantId,
    setActiveAdminTab
  } = useApp();

  // Local form state for unsaved edits
  const [formData, setFormData] = useState<CompanyProfile>(() => ({ ...companyProfile }));
  const [isDirty, setIsDirty] = useState(false);
  const [previewTab, setPreviewTab] = useState<'desktop_header' | 'mobile_header' | 'po_letterhead'>('desktop_header');
  const [activeFormSection, setActiveFormSection] = useState<'brand' | 'regulatory' | 'contact' | 'commercial' | 'saas'>('brand');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);

  // Sync if context updates from external source (like reset)
  useEffect(() => {
    setFormData({ ...companyProfile });
    setIsDirty(false);
  }, [companyProfile]);

  const handleChange = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    setIsDirty(true);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Brand trading name cannot be empty');
      return;
    }
    updateCompanyProfile(formData);
    setIsDirty(false);
  };

  const handleResetToSaved = () => {
    setFormData({ ...companyProfile });
    setIsDirty(false);
    toast.info('Discarded unsaved changes');
  };

  const handleFactoryReset = () => {
    resetCompanyProfileToDefault();
    setIsDirty(false);
    toast.success('Reset company branding to default pharmaceutical profile');
  };

  // Handle custom image logo upload (converts to high-quality base64 URI)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, SVG, or WebP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image size should be less than 3 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setFormData(prev => ({
          ...prev,
          logoUrl: base64,
          logoType: 'custom_image'
        }));
        setIsDirty(true);
        toast.success('Custom brand logo uploaded and applied to preview');
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so re-uploading the same file triggers change
    e.target.value = '';
  };

  const handleRemoveCustomLogo = () => {
    setFormData(prev => ({
      ...prev,
      logoUrl: '',
      logoType: 'preset_icon',
      presetIconId: prev.presetIconId || 'pill_capsule'
    }));
    setIsDirty(true);
    toast.info('Custom logo removed. Switched to preset emblem');
  };

  // Export company profile JSON (for multi-tenant export/backup)
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_branding_config.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Company branding profile exported as JSON');
  };

  // Import company profile JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed.name === 'string') {
          setFormData(prev => ({ ...prev, ...parsed, updatedAt: new Date().toISOString() }));
          setIsDirty(true);
          toast.success(`Successfully loaded profile for "${parsed.name}". Click Save to persist.`);
        } else {
          toast.error('Invalid company profile JSON structure');
        }
      } catch (err) {
        toast.error('Could not parse configuration file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Extract initials for monogram
  const monogram = formData.name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 3)
    .join('')
    .toUpperCase() || 'RX';

  return (
    <div id="company-profile-branding-page" data-testid="company-profile-branding-page" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Hidden file inputs for upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLogoUpload}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={jsonImportRef}
        onChange={handleImportJSON}
        accept=".json,application/json"
        className="hidden"
      />

      {/* TOP HERO HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <Buildings size={16} weight="duotone" />
            <span>SaaS White-Labeling & Multi-Tenancy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight">
            Company Profile &amp; Dynamic Branding
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Configure your pharmaceutical enterprise identity, custom logo, corporate credentials, and brand theme. All changes update instantly across desktop, mobile rep apps, and official invoice letterheads.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          {/* Discard Unsaved */}
          {isDirty && (
            <button
              type="button"
              id="btn-discard-branding"
              data-testid="btn-discard-branding"
              onClick={handleResetToSaved}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowsClockwise size={14} />
              <span>Discard Changes</span>
            </button>
          )}

          {/* Backup / Export Config */}
          <button
            type="button"
            id="btn-export-branding-json"
            data-testid="btn-export-branding-json"
            onClick={handleExportJSON}
            title="Download this company setup as a portable JSON configuration file"
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <DownloadSimple size={15} weight="bold" />
            <span>Export JSON</span>
          </button>

          {/* Import Config */}
          <button
            type="button"
            id="btn-import-branding-json"
            data-testid="btn-import-branding-json"
            onClick={() => jsonImportRef.current?.click()}
            title="Import an existing company branding JSON configuration"
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UploadSimple size={15} weight="bold" />
            <span>Import JSON</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            id="btn-save-branding"
            data-testid="btn-save-branding"
            onClick={() => handleSave()}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
              isDirty
                ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 ring-2 ring-blue-500/30'
                : 'bg-slate-800 hover:bg-slate-900'
            }`}
          >
            <FloppyDisk size={16} weight="bold" />
            <span>{isDirty ? 'Save Profile & Branding*' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* ACTIVE TENANT ORGANIZATION CONTEXT BANNER */}
      <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 to-blue-50/90 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Buildings size={20} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{activeOrganization.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
                {activeOrganization.plan} Plan
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <ShieldCheck size={13} weight="fill" />
                Partition Isolated
              </span>
            </div>
            <p className="text-slate-600 mt-0.5">
              Tenant ID: <code className="text-slate-800 font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200">{activeTenantId}</code> — Branding settings configured here apply exclusively to this organization's field reps, catalog, and invoice letterheads.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveAdminTab('tenants')}
          className="self-start sm:self-center px-3 py-1.5 rounded-xl font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 shadow-2xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
        >
          <span>Multi-Tenant Console</span>
          <span className="text-indigo-400">➔</span>
        </button>
      </div>

      {/* UN-SAVED BANNER ALERT */}
      {isDirty && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <WarningCircle size={18} weight="fill" className="text-amber-600 shrink-0" />
            <span>
              <strong>Unsaved branding modifications.</strong> Your changes are actively rendering in the live preview below, but require saving to persist across sessions and exports.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
          >
            Save Now
          </button>
        </div>
      )}

      {/* LIVE MULTI-VIEW REAL-TIME PREVIEW CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye size={17} weight="bold" className="text-blue-600" />
            <span className="font-heading font-bold text-sm text-slate-900">Real-Time SaaS Render Preview</span>
            <span className="text-[11px] text-slate-500 hidden md:inline">&bull; See how your company branding looks across user touchpoints</span>
          </div>

          {/* Segmented Controls for preview mode (anti-pill interactive tabs) */}
          <div className="flex items-center p-1 bg-slate-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => setPreviewTab('desktop_header')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                previewTab === 'desktop_header'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Desktop Navigation Bar
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab('mobile_header')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                previewTab === 'mobile_header'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Field Rep Mobile App
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab('po_letterhead')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                previewTab === 'po_letterhead'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Formal PO Letterhead
            </button>
          </div>
        </div>

        {/* PREVIEW CONTAINER */}
        <div className="p-6 bg-slate-100/70 flex items-center justify-center min-h-[170px]">
          {/* 1. Desktop Global Header Preview */}
          {previewTab === 'desktop_header' && (
            <div className="w-full max-w-4xl bg-white rounded-xl border border-slate-200 shadow-md p-3 px-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                  &lt;
                </div>
                <div className="flex items-center gap-2.5">
                  <CompanyLogo
                    className="w-10 h-10 shadow-xs"
                    overrideProfile={formData}
                  />
                  <div>
                    <span className="font-heading font-extrabold text-slate-900 text-lg tracking-tight block leading-none">
                      {formData.name || 'COMPANY NAME'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                      {formData.tagline || 'Pharmaceutical Distribution'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-2xs"
                  style={{ backgroundColor: formData.primaryColor || '#2563eb' }}
                >
                  Admin Console
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold">
                  AB
                </div>
              </div>
            </div>
          )}

          {/* 2. Mobile Field Rep App Bar Preview */}
          {previewTab === 'mobile_header' && (
            <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-slate-300 shadow-lg overflow-hidden">
              <div className="bg-slate-900 text-white px-4 py-1 text-[10px] flex items-center justify-between">
                <span>9:41 AM</span>
                <span>5G &bull; 100%</span>
              </div>
              <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white/95">
                <div className="flex items-center gap-2.5">
                  <CompanyLogo
                    className="w-8 h-8 shadow-xs"
                    overrideProfile={formData}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-slate-900 text-xs">
                        {formData.name || 'COMPANY NAME'}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <p className="text-[10px] text-slate-500">Amitabh Sen &bull; South Mumbai Route</p>
                  </div>
                </div>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: formData.primaryColor || '#2563eb' }}
                >
                  LIVE GPS
                </span>
              </div>
              <div className="p-4 bg-slate-50 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          )}

          {/* 3. Formal PO / Invoice Letterhead Preview */}
          {previewTab === 'po_letterhead' && (
            <div className="w-full max-w-3xl bg-white rounded-lg border border-slate-300 shadow-md p-6 font-sans">
              <div className="flex items-start justify-between border-b-2 pb-4" style={{ borderColor: formData.primaryColor || '#2563eb' }}>
                <div className="flex items-center gap-3">
                  <CompanyLogo
                    className="w-14 h-14"
                    overrideProfile={formData}
                  />
                  <div>
                    <h2 className="font-heading font-black text-xl text-slate-900 tracking-tight leading-none">
                      {formData.legalName || formData.name || 'PHARMACEUTICAL ENTERPRISE LTD.'}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 font-medium">{formData.tagline}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formData.headOfficeAddress}, {formData.city}, {formData.state} - {formData.pincode}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                  <p><strong className="text-slate-900">Drug License:</strong> {formData.drugLicenseNo || 'DL-20B/21B-XXXX'}</p>
                  <p><strong className="text-slate-900">GSTIN:</strong> {formData.gstin || '07AAAAA0000A1Z5'}</p>
                  {formData.cin && <p><strong className="text-slate-900">CIN:</strong> {formData.cin}</p>}
                  <p className="text-slate-500">{formData.contactEmail} &bull; {formData.contactPhone}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Default Document Prefix: <strong className="font-mono text-slate-800">{formData.invoicePrefix || 'INV'}-2026-0001</strong></span>
                <span>Currency: <strong className="text-slate-800">{formData.currencySymbol || '₹'} ({formData.id})</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONFIGURATION TABS & EDITING FORMS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar for Form Sections */}
        <div className="lg:col-span-1 space-y-2">
          <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <button
              type="button"
              onClick={() => setActiveFormSection('brand')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2.5 cursor-pointer ${
                activeFormSection === 'brand'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Palette size={17} weight={activeFormSection === 'brand' ? 'bold' : 'regular'} />
              <span>Brand Identity &amp; Logo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormSection('regulatory')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2.5 cursor-pointer ${
                activeFormSection === 'regulatory'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <IdentificationCard size={17} weight={activeFormSection === 'regulatory' ? 'bold' : 'regular'} />
              <span>Drug License &amp; Taxes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormSection('contact')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2.5 cursor-pointer ${
                activeFormSection === 'contact'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <MapPin size={17} weight={activeFormSection === 'contact' ? 'bold' : 'regular'} />
              <span>Head Office &amp; Contact</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormSection('commercial')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2.5 cursor-pointer ${
                activeFormSection === 'commercial'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Receipt size={17} weight={activeFormSection === 'commercial' ? 'bold' : 'regular'} />
              <span>Invoicing &amp; Documents</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormSection('saas')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2.5 cursor-pointer ${
                activeFormSection === 'saas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck size={17} weight={activeFormSection === 'saas' ? 'bold' : 'regular'} />
              <span>SaaS Workspace &amp; Plan</span>
            </button>
          </div>

          {/* Quick Stats Summary Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Workspace Status</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle size={14} weight="fill" /> Active
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Licensed Rep Seats</span>
              <span className="font-bold text-slate-900">{reps.length} / {formData.maxRepsAllowed || 25}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Tenant ID</span>
              <span className="font-mono text-[11px] text-slate-700">{formData.id}</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                id="btn-factory-reset-branding"
                data-testid="btn-factory-reset-branding"
                onClick={handleFactoryReset}
                className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowClockwise size={14} weight="bold" />
                <span>Reset to Factory Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form Body Area */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            {/* SECTION 1: BRAND IDENTITY & LOGO */}
            {activeFormSection === 'brand' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900">Brand Identity &amp; Visual Appearance</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define how your company is named and styled across web navigation, reps&apos; smartphones, and printed material.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Brand Trading Name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Brand Name (Trading / Display Name) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="company-name-input"
                      data-testid="company-name-input"
                      value={formData.name}
                      onChange={e => handleChange('name', e.target.value)}
                      placeholder="e.g. DDB DRUG CHEM or NOVACARE PHARMA"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900"
                    />
                    <p className="text-[11px] text-slate-500">
                      Appears on the top header, field rep app, and system notifications.
                    </p>
                  </div>

                  {/* Registered Legal Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Registered Legal Entity Name
                    </label>
                    <input
                      type="text"
                      id="company-legal-name-input"
                      data-testid="company-legal-name-input"
                      value={formData.legalName || ''}
                      onChange={e => handleChange('legalName', e.target.value)}
                      placeholder="e.g. DDB Drug Chem & Pharmaceuticals Pvt. Ltd."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                    />
                    <p className="text-[11px] text-slate-500">
                      Printed on tax invoices, wholesale purchase orders, and legal affidavits.
                    </p>
                  </div>

                  {/* Tagline / Mission */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Corporate Tagline / Motto
                    </label>
                    <input
                      type="text"
                      id="company-tagline-input"
                      data-testid="company-tagline-input"
                      value={formData.tagline}
                      onChange={e => handleChange('tagline', e.target.value)}
                      placeholder="e.g. Quality Formulations & Healthcare Distribution Network"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                    />
                  </div>
                </div>

                {/* PRIMARY BRAND COLOR PICKER */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Primary Brand Accent Theme</h4>
                      <p className="text-[11px] text-slate-500">Sets the primary accent for buttons, badges, headers, and reports.</p>
                    </div>
                    {/* Custom Color Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="brand-color-picker"
                        data-testid="brand-color-picker"
                        value={formData.primaryColor || '#2563eb'}
                        onChange={e => handleChange('primaryColor', e.target.value)}
                        className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                        title="Pick custom hex color"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor || '#2563eb'}
                        onChange={e => handleChange('primaryColor', e.target.value)}
                        className="w-24 px-2 py-1.5 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg text-slate-800"
                        placeholder="#2563EB"
                      />
                    </div>
                  </div>

                  {/* Palettes Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {PRESET_BRAND_COLORS.map(palette => {
                      const isSelected = formData.primaryColor?.toLowerCase() === palette.hex.toLowerCase();
                      return (
                        <button
                          key={palette.hex}
                          type="button"
                          onClick={() => handleChange('primaryColor', palette.hex)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-lg shrink-0 shadow-2xs flex items-center justify-center text-white"
                            style={{ backgroundColor: palette.hex }}
                          >
                            {isSelected && <Check size={13} weight="bold" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-800 block truncate">{palette.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{palette.hex}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* LOGO SELECTION & CUSTOMIZATION */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Company Logo &amp; Emblems</h4>
                    <p className="text-[11px] text-slate-500">Choose a vector pharma icon, generate a modern geometric monogram, or upload your official company logo.</p>
                  </div>

                  {/* Logo Mode Selection Tabs */}
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleChange('logoType', 'preset_icon')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formData.logoType === 'preset_icon' || (!formData.logoType && !formData.logoUrl)
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Preset Vector Emblem
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('logoType', 'monogram')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formData.logoType === 'monogram'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Geometric Monogram
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('logoType', 'custom_image')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formData.logoType === 'custom_image'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Custom Image Upload
                    </button>
                  </div>

                  {/* 1. If Preset Icon is active */}
                  {(formData.logoType === 'preset_icon' || (!formData.logoType && !formData.logoUrl)) && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {PRESET_ICONS.map(icon => {
                          const isSelected = (formData.presetIconId || 'pill_capsule') === icon.id;
                          return (
                            <button
                              key={icon.id}
                              type="button"
                              onClick={() => handleChange('presetIconId', icon.id)}
                              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <CompanyLogo
                                className="w-9 h-9"
                                overrideProfile={{
                                  ...formData,
                                  logoType: 'preset_icon',
                                  presetIconId: icon.id
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-slate-900 block truncate">{icon.label}</span>
                                <span className="text-[10px] text-slate-500 line-clamp-1">{icon.desc}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. If Monogram is active */}
                  {formData.logoType === 'monogram' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                      <CompanyLogo
                        className="w-14 h-14 shadow-sm"
                        overrideProfile={{
                          ...formData,
                          logoType: 'monogram'
                        }}
                      />
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-900">Dynamic Monogram: &quot;{monogram}&quot;</span>
                        <p className="text-[11px] text-slate-500 max-w-md">
                          Automatically formulated from the uppercase initials of your brand name (&quot;{formData.name}&quot;) combined with your primary theme color.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 3. If Custom Image is active */}
                  {formData.logoType === 'custom_image' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <CompanyLogo
                            className="w-14 h-14"
                            overrideProfile={{
                              ...formData,
                              logoType: 'custom_image'
                            }}
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {formData.logoUrl ? 'Custom Image Active' : 'No Custom Image Uploaded'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Accepts high-res PNG, JPG, WebP, or SVG vector. Max 3 MB.
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            id="btn-upload-logo-file"
                            data-testid="btn-upload-logo-file"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <UploadSimple size={15} weight="bold" />
                            <span>Upload Image File</span>
                          </button>

                          {formData.logoUrl && (
                            <button
                              type="button"
                              id="btn-remove-custom-logo"
                              data-testid="btn-remove-custom-logo"
                              onClick={handleRemoveCustomLogo}
                              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Remove custom image and revert to preset emblem"
                            >
                              <Trash size={14} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Direct URL input option */}
                      <div className="pt-3 border-t border-slate-200/80">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Or Enter Direct Image URL
                        </label>
                        <input
                          type="url"
                          id="company-logo-url-input"
                          data-testid="company-logo-url-input"
                          value={formData.logoUrl || ''}
                          onChange={e => {
                            handleChange('logoUrl', e.target.value);
                            handleChange('logoType', 'custom_image');
                          }}
                          placeholder="https://example.com/assets/logo.png"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 2: STATUTORY & REGULATORY CREDENTIALS */}
            {activeFormSection === 'regulatory' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900">Drug License &amp; Statutory Credentials</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Critical compliance identifiers required under the Drugs and Cosmetics Act for wholesale distribution and tax invoices.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Drug License Number */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Wholesale Drug License Number (Form 20B / 21B) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="company-drug-license-input"
                      data-testid="company-drug-license-input"
                      value={formData.drugLicenseNo}
                      onChange={e => handleChange('drugLicenseNo', e.target.value)}
                      placeholder="e.g. DL-20B/21B-DLH-2024-9842"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono font-bold text-slate-900"
                    />
                    <p className="text-[11px] text-slate-500">
                      Mandatory for pharmaceutical trade. Automatically printed on invoices and sales representative order slips.
                    </p>
                  </div>

                  {/* GSTIN */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      GSTIN (Goods &amp; Services Tax ID) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="company-gstin-input"
                      data-testid="company-gstin-input"
                      value={formData.gstin}
                      onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                      placeholder="e.g. 07AABCD1234E1Z5"
                      required
                      maxLength={15}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono font-bold text-slate-900 uppercase"
                    />
                  </div>

                  {/* PAN */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Permanent Account Number (PAN)
                    </label>
                    <input
                      type="text"
                      id="company-pan-input"
                      data-testid="company-pan-input"
                      value={formData.panNo || ''}
                      onChange={e => handleChange('panNo', e.target.value.toUpperCase())}
                      placeholder="e.g. AABCD1234E"
                      maxLength={10}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono text-slate-900 uppercase"
                    />
                  </div>

                  {/* CIN */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Corporate Identity Number (CIN)
                    </label>
                    <input
                      type="text"
                      id="company-cin-input"
                      data-testid="company-cin-input"
                      value={formData.cin || ''}
                      onChange={e => handleChange('cin', e.target.value.toUpperCase())}
                      placeholder="e.g. U24239DL2018PTC339841"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono text-slate-900 uppercase"
                    />
                  </div>

                  {/* FSSAI License No */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      FSSAI Food &amp; Nutraceutical License No
                    </label>
                    <input
                      type="text"
                      id="company-fssai-input"
                      data-testid="company-fssai-input"
                      value={formData.fssaiLicenseNo || ''}
                      onChange={e => handleChange('fssaiLicenseNo', e.target.value)}
                      placeholder="e.g. 10019011006542"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: HEAD OFFICE & CONTACT */}
            {activeFormSection === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900">Registered Office &amp; Contact Details</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Corporate headquarters address and communication channels for wholesale inquiries and customer support.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Street Address */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Head Office Address Line <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="company-address-input"
                      data-testid="company-address-input"
                      value={formData.headOfficeAddress}
                      onChange={e => handleChange('headOfficeAddress', e.target.value)}
                      placeholder="e.g. Plot No. 42, Okhla Industrial Area, Phase-III"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="company-city-input"
                      data-testid="company-city-input"
                      value={formData.city}
                      onChange={e => handleChange('city', e.target.value)}
                      placeholder="e.g. New Delhi"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      State / Territory <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="company-state-input"
                      data-testid="company-state-input"
                      value={formData.state}
                      onChange={e => handleChange('state', e.target.value)}
                      placeholder="e.g. Delhi, Maharashtra, Karnataka"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
                    />
                  </div>

                  {/* PIN Code */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Postal Code / PIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="company-pincode-input"
                      data-testid="company-pincode-input"
                      value={formData.pincode}
                      onChange={e => handleChange('pincode', e.target.value)}
                      placeholder="e.g. 110020"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
                    />
                  </div>

                  {/* Official Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Official Contact / Billing Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="company-email-input"
                      data-testid="company-email-input"
                      value={formData.contactEmail}
                      onChange={e => handleChange('contactEmail', e.target.value)}
                      placeholder="e.g. contact@yourpharma.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
                    />
                  </div>

                  {/* Official Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Helpline / Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="company-phone-input"
                      data-testid="company-phone-input"
                      value={formData.contactPhone}
                      onChange={e => handleChange('contactPhone', e.target.value)}
                      placeholder="e.g. +91 98101 23456"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
                    />
                  </div>

                  {/* Website */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Corporate Website URL
                    </label>
                    <input
                      type="url"
                      id="company-website-input"
                      data-testid="company-website-input"
                      value={formData.website || ''}
                      onChange={e => handleChange('website', e.target.value)}
                      placeholder="e.g. https://yourpharma.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: INVOICING & DOCUMENTS */}
            {activeFormSection === 'commercial' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900">Commercial Invoicing &amp; Documents</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure document serial number prefixes, monetary currency formats, and standard order disclaimers.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Invoice / Order Prefix */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Invoice &amp; Dispatch Number Prefix
                    </label>
                    <input
                      type="text"
                      id="company-invoice-prefix-input"
                      data-testid="company-invoice-prefix-input"
                      value={formData.invoicePrefix || 'INV'}
                      onChange={e => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                      placeholder="e.g. DDB or INV"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono font-bold uppercase text-slate-900"
                    />
                    <p className="text-[11px] text-slate-500">
                      Generated documents will be formatted like: <code>{formData.invoicePrefix || 'INV'}-2026-0042</code>
                    </p>
                  </div>

                  {/* Currency Symbol */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Currency Symbol
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['₹', '$', '€', '£'].map(sym => (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => handleChange('currencySymbol', sym)}
                          className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                            (formData.currencySymbol || '₹') === sym
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {sym}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Standard Terms & Disclaimers */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Invoice Legal Terms &amp; Footer Disclaimer
                    </label>
                    <textarea
                      id="company-disclaimer-input"
                      data-testid="company-disclaimer-input"
                      rows={3}
                      value={formData.footerDisclaimer || ''}
                      onChange={e => handleChange('footerDisclaimer', e.target.value)}
                      placeholder="e.g. All pharmaceutical products supplied in accordance with Schedule H and M of Drugs & Cosmetics Rules..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-500">
                      Printed at the footer of monthly representative audits, PDF reports, and medical store dispatch slips.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: SAAS WORKSPACE & PLAN */}
            {activeFormSection === 'saas' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900">SaaS Multi-Tenant Workspace Configuration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Commercial subscriber tenancy identifiers, active subscription plan, and license seat allocations.
                  </p>
                </div>

                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <Sparkle size={16} weight="fill" className="text-blue-600" />
                    <span>Commercial Multi-Tenant Architecture</span>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    By making this company profile editable, any pharmaceutical distributor or manufacturer can license this software as their own branded portal without altering core codebase logic.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tenant ID */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Workspace Tenant Identifier (Immutable ID)
                    </label>
                    <input
                      type="text"
                      value={formData.id}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono text-sm text-slate-600 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-slate-500">Unique tenant partition key in multi-tenant databases.</p>
                  </div>

                  {/* Plan Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Subscription Plan Tier
                    </label>
                    <input
                      type="text"
                      id="company-plan-input"
                      data-testid="company-plan-input"
                      value={formData.planName || 'Enterprise Growth Tier'}
                      onChange={e => handleChange('planName', e.target.value)}
                      placeholder="e.g. Enterprise Growth Tier"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-900"
                    />
                  </div>

                  {/* Max Reps Allowed */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Maximum Field Rep Seat Quota
                    </label>
                    <input
                      type="number"
                      id="company-max-reps-input"
                      data-testid="company-max-reps-input"
                      value={formData.maxRepsAllowed || 25}
                      onChange={e => handleChange('maxRepsAllowed', parseInt(e.target.value) || 25)}
                      min={1}
                      max={500}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 font-mono"
                    />
                    <p className="text-[11px] text-slate-500">
                      Currently using {reps.length} active seat(s) of {formData.maxRepsAllowed || 25} available.
                    </p>
                  </div>

                  {/* Founded Year */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Established / Founded Year
                    </label>
                    <input
                      type="text"
                      id="company-founded-year-input"
                      data-testid="company-founded-year-input"
                      value={formData.foundedYear || ''}
                      onChange={e => handleChange('foundedYear', e.target.value)}
                      placeholder="e.g. 2018"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Form Action Buttons */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle size={15} className="text-emerald-600" weight="fill" />
                <span>Last updated: {formData.updatedAt ? new Date(formData.updatedAt).toLocaleDateString() : 'Just now'}</span>
              </div>

              <div className="flex items-center gap-2.5">
                {isDirty && (
                  <button
                    type="button"
                    onClick={handleResetToSaved}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                  >
                    Discard
                  </button>
                )}
                <button
                  type="submit"
                  id="btn-bottom-save-branding"
                  data-testid="btn-bottom-save-branding"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>Save Profile &amp; Branding</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
