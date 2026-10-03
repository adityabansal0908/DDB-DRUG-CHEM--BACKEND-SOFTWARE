import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  parseMedicalStoreExcelFile,
  downloadMedicalStoreExcelTemplate,
  ParsedMedicalStoreRow
} from '../../utils/medicalStoreExcelHelper';
import {
  FileXls,
  UploadSimple,
  X,
  CheckCircle,
  WarningCircle,
  DownloadSimple,
  ArrowsClockwise,
  Storefront,
  Buildings,
  Package,
  Stethoscope,
  Phone,
  ShieldCheck,
  UserCheck
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface MedicalStoreExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MedicalStoreExcelImportModal: React.FC<MedicalStoreExcelImportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { addMultipleRetailCounters, doctors, updateDoctor, addDoctor } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedMedicalStoreRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  if (!isOpen) return null;

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    setErrors([]);

    try {
      const result = await parseMedicalStoreExcelFile(selectedFile);
      setParsedData(result.stores);
      setErrors(result.errors);
    } catch (err: any) {
      setErrors([err?.message || 'Failed to read file. Please ensure it is a valid Excel (.xlsx, .xls) or CSV file.']);
      setParsedData([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleCommit = () => {
    if (parsedData.length === 0) return;

    const storesToSave = parsedData.map((s) => ({
      name: s.name,
      type: s.type,
      contactPerson: s.contactPerson || 'Pharmacist in-Charge',
      phone: s.phone || '+91 98000 00000',
      address: s.address || 'Commercial Market',
      area: s.area || 'Central District',
      city: s.city || 'Mumbai',
      territory: s.territory || 'Central & South Medical Belt',
      assignedRepId: s.assignedRepId || '',
      assignedRepName: s.assignedRepName || 'Direct Depot Delivery (No Rep)',
      drugLicenseNo: s.drugLicenseNo || 'DL-20B-PENDING',
      gstin: s.gstin || '',
      hospitalName: s.hospitalName,
      clinicName: s.clinicName,
      linkedDoctorNames: s.linkedDoctorNames || [],
      creditDays: s.creditDays || 15,
      creditLimit: s.creditLimit || 100000,
      directDiscountPct: s.directDiscountPct ?? (s.type === 'wholesale_chemist' ? 10 : 5),
      preferredPaymentTerms: s.preferredPaymentTerms || `Net ${s.creditDays || 15} Days`,
      notes: s.notes || '',
      status: s.status || 'active',
      isDirectSaleEligible: true,
      productsSold: [],
      totalMonthlyRevenue: 0
    }));

    // Save stores via AppContext
    if (addMultipleRetailCounters) {
      addMultipleRetailCounters(storesToSave, importMode);
    }

    // Bidirectional link: update or register linked doctors in Doctor Directory
    storesToSave.forEach((store) => {
      if (
        (store.type === 'hospital_pharmacy' || store.type === 'clinic_counter') &&
        store.linkedDoctorNames &&
        store.linkedDoctorNames.length > 0
      ) {
        store.linkedDoctorNames.forEach((docName) => {
          const trimmed = docName.trim();
          if (!trimmed) return;
          const existing = doctors.find((d) => d.name.toLowerCase() === trimmed.toLowerCase());
          if (existing) {
            updateDoctor(existing.id, {
              attachedPharmacyName: store.name,
              attachedPharmacyType: store.type,
              attachedHospitalName: store.type === 'hospital_pharmacy' ? store.hospitalName : undefined,
              attachedClinicName: store.type === 'clinic_counter' ? store.clinicName : undefined
            });
          } else {
            // Auto-register physician
            addDoctor({
              name: trimmed,
              specialty: store.type === 'hospital_pharmacy' ? 'Hospital Consultant (MD)' : 'Consultant Physician (MBBS, MD)',
              clinicName: store.hospitalName || store.clinicName || 'Medical Center Chamber',
              address: store.address || 'Medical Facility Campus',
              city: store.city || 'Mumbai',
              area: store.area || 'Central Zone',
              phone: store.phone || '+91 98000 00000',
              bestTimeToVisit: 'Mon - Sat • 10:00 AM - 01:00 PM',
              visitingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
              targetVisitsPerMonth: 4,
              avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?crop=entropy&cs=srgb&fm=jpg&q=80&w=200',
              coordinates: { lat: 19.076, lng: 72.8777 },
              attachedPharmacyName: store.name,
              attachedPharmacyType: store.type,
              attachedHospitalName: store.type === 'hospital_pharmacy' ? store.hospitalName : undefined,
              attachedClinicName: store.type === 'clinic_counter' ? store.clinicName : undefined
            });
          }
        });
      }
    });

    toast.success(`Successfully uploaded ${storesToSave.length} medical stores!`, {
      description: importMode === 'replace' ? 'Replaced current store registry' : 'Appended to existing store registry'
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <FileXls size={24} weight="bold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                Bulk Upload Medical Stores
              </h2>
              <p className="text-xs text-slate-500">
                Import wholesale chemists, hospital pharmacies, clinic counters, and retail druggists via Excel (.xlsx)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-modal-download-template"
              onClick={downloadMedicalStoreExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Download Excel Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-teal-500 bg-teal-50/50'
                : 'border-slate-300 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/20'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-3">
              <UploadSimple size={24} weight="bold" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {file ? file.name : 'Click to upload or drag and drop your completed Excel template'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports .xlsx, .xls, and .csv files. Use the template with all 19 standardized columns.
            </p>
          </div>

          {/* Parsing State */}
          {isParsing && (
            <div className="flex items-center justify-center py-6 gap-2 text-teal-600">
              <ArrowsClockwise size={20} className="animate-spin" />
              <span className="text-sm font-semibold">Reading workbook and verifying store records...</span>
            </div>
          )}

          {/* Validation Warnings */}
          {errors.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <WarningCircle size={16} className="text-amber-600" />
                <span>Notice / Inconsistencies ({errors.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px] max-h-24 overflow-y-auto pr-1">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                  <span className="text-sm font-bold text-slate-900">
                    Parsed {parsedData.length} Medical Stores Ready to Import
                  </span>
                </div>

                {/* Import Mode Toggle */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-semibold">Import Strategy:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setImportMode('append')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        importMode === 'append' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Append (+ Add)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        importMode === 'replace' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Replace All
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Store Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Hospital / Clinic Info</th>
                      <th className="py-2.5 px-3">Linked Doctors</th>
                      <th className="py-2.5 px-3">City / Territory</th>
                      <th className="py-2.5 px-3">License & GSTIN</th>
                      <th className="py-2.5 px-3 text-right">Credit / Terms</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {s.name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.type === 'wholesale_chemist'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : s.type === 'hospital_pharmacy'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : s.type === 'clinic_counter'
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : s.type === 'chain_pharmacy'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {s.type === 'wholesale_chemist' && <Package size={11} />}
                            {s.type === 'hospital_pharmacy' && <Buildings size={11} />}
                            {s.type === 'clinic_counter' && <Stethoscope size={11} />}
                            {s.type === 'retail_chemist' && <Storefront size={11} />}
                            {s.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {s.hospitalName ? (
                            <span className="text-blue-800 font-semibold block">🏥 {s.hospitalName}</span>
                          ) : s.clinicName ? (
                            <span className="text-teal-800 font-semibold block">🩺 {s.clinicName}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {s.linkedDoctorNames && s.linkedDoctorNames.length > 0 ? (
                            <span className="text-slate-800 font-medium flex items-center gap-1">
                              <UserCheck size={12} className="text-blue-600" />
                              <span>{s.linkedDoctorNames.join(', ')}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600">
                          {s.city} &bull; {s.territory}
                        </td>
                        <td className="py-2.5 px-3 text-[10px] font-mono text-slate-600">
                          DL: {s.drugLicenseNo}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[11px] font-semibold text-slate-800">
                          {s.creditDays}d &bull; {s.directDiscountPct}% disc
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parsedData.length > 0 ? (
              <span>
                Ready to commit <strong>{parsedData.length}</strong> store accounts into active B2B database.
              </span>
            ) : (
              <span>Download the template first if you haven't formatted your list.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200/80 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-modal-commit-import"
              disabled={parsedData.length === 0}
              onClick={handleCommit}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <CheckCircle size={16} weight="bold" />
              <span>Import {parsedData.length > 0 ? `${parsedData.length} Stores` : 'Data'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
