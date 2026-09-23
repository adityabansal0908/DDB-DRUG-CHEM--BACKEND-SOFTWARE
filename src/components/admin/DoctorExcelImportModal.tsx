import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { parseDoctorExcelFile, downloadDoctorExcelTemplate, ParsedDoctorRow } from '../../utils/doctorExcelHelper';
import {
  FileXls,
  UploadSimple,
  X,
  CheckCircle,
  WarningCircle,
  DownloadSimple,
  ArrowsClockwise,
  ListBullets,
  Cake,
  Pill,
  ShieldCheck,
  Building,
  MapPin,
  Clock,
  Calendar,
  Phone
} from '@phosphor-icons/react';

interface DoctorExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DoctorExcelImportModal: React.FC<DoctorExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { products, addMultipleDoctors } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedDoctorRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  if (!isOpen) return null;

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    setErrors([]);

    try {
      const result = await parseDoctorExcelFile(selectedFile);
      setParsedData(result.doctors);
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

    const doctorsToSave = parsedData.map((d) => ({
      name: d.name,
      specialty: d.specialty || 'Consultant Physician',
      clinicName: d.clinicName || 'Physician Chamber',
      address: d.address || `${d.clinicName}, ${d.area}, ${d.city}`,
      city: d.city || 'Mumbai',
      area: d.area || 'Central District',
      phone: d.phone || '+91 98200 00000',
      bestTimeToVisit: d.bestTimeToVisit || '10:30 AM - 01:00 PM',
      visitingDays: d.visitingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      visitingSlots: d.visitingSlots || [],
      targetVisitsPerMonth: Number(d.targetVisitsPerMonth) || 4,
      avatarUrl: `https://images.unsplash.com/photo-1622253692010-333f2da6031d?crop=entropy&cs=srgb&fm=jpg&w=150`,
      dateOfBirth: d.dateOfBirth || '',
      targetedProducts: d.targetedProducts || [],
      adminRemarks: d.adminRemarks || '',
      coordinates: { lat: 19.0760, lng: 72.8777 },
      status: 'pending' as const
    }));

    addMultipleDoctors(doctorsToSave, importMode);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      id="doctor-excel-import-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="doctor-excel-import-modal"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileXls size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                Import Doctors Directory via Excel
              </h2>
              <p className="text-xs text-slate-500">
                Bulk register physicians with chambers, city, DOB, targeted formulations & admin remarks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Step 1: Download Template Callout */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <DownloadSimple size={16} className="text-blue-600" />
                Step 1: Download Physician Directory Excel Template
              </span>
              <p className="text-xs text-blue-700 max-w-xl">
                The spreadsheet template contains 13 pre-configured columns including dedicated <strong>Visiting Days</strong> (e.g., Mon, Tue, Wed, Thu, Fri, Sat) and <strong>Multiple Visiting Time Slots</strong> (e.g., Morning: 10:00 AM - 01:00 PM; Evening: 06:00 PM - 08:30 PM separated by semicolons).
              </p>
            </div>
            <button
              id="download-doctor-excel-template-btn"
              data-testid="download-doctor-excel-template-btn"
              onClick={() => downloadDoctorExcelTemplate(products)}
              className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <DownloadSimple size={15} weight="bold" />
              Download Template (.xlsx)
            </button>
          </div>

          {/* Step 2: Upload Zone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Step 2: Upload Spreadsheet (.xlsx, .xls, .csv)
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  <UploadSimple size={24} weight="bold" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {file ? file.name : 'Click to browse or drag and drop spreadsheet here'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="py-8 flex flex-col items-center justify-center space-y-3">
              <ArrowsClockwise size={32} className="animate-spin text-emerald-600" />
              <p className="text-sm font-semibold text-slate-700">Validating & parsing physician rows...</p>
            </div>
          )}

          {/* Error Notices */}
          {errors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <WarningCircle size={18} weight="fill" className="text-amber-600" />
                <span>Notice / Skipped Rows ({errors.length}):</span>
              </div>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside max-h-32 overflow-y-auto">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Parsed Physicians Preview ({parsedData.length} Valid Entries)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    Ready to Commit
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Clear & choose different file
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Doctor Name & Specialty</th>
                      <th className="py-2.5 px-3">Chamber & City</th>
                      <th className="py-2.5 px-3">Area & Contact</th>
                      <th className="py-2.5 px-3">Visiting Days & Slots</th>
                      <th className="py-2.5 px-3">Birth Date</th>
                      <th className="py-2.5 px-3">Marketed Products</th>
                      <th className="py-2.5 px-3">Admin Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.map((d, index) => (
                      <tr key={index} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{index + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <div>{d.name}</div>
                          <div className="text-[11px] font-normal text-blue-700">{d.specialty}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <div className="font-medium text-slate-800">{d.clinicName}</div>
                          <div className="text-[11px] text-emerald-700 font-semibold">{d.city}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <div>{d.area}</div>
                          <div className="text-[11px] text-slate-400">{d.phone}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 min-w-[200px]">
                          <div className="space-y-1">
                            {d.visitingDays && d.visitingDays.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md w-fit">
                                <Calendar size={11} className="shrink-0" />
                                <span>{d.visitingDays.join(', ')}</span>
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              {d.visitingSlots && d.visitingSlots.length > 0 ? (
                                d.visitingSlots.map((slot, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded font-mono"
                                  >
                                    <Clock size={11} className="text-blue-600 shrink-0" />
                                    <span className="font-semibold text-slate-800">{slot.slotName || `Slot ${sIdx + 1}`}:</span>
                                    <span>{slot.startTime}{slot.endTime ? ` - ${slot.endTime}` : ''}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-slate-700">{d.bestTimeToVisit}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {d.dateOfBirth ? (
                            <span className="inline-flex items-center gap-1 font-mono text-slate-700">
                              <Cake size={13} className="text-amber-500" />
                              {d.dateOfBirth}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not set</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {d.targetedProducts && d.targetedProducts.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {d.targetedProducts.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={d.adminRemarks}>
                          {d.adminRemarks ? (
                            <span className="text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 text-[11px]">
                              {d.adminRemarks}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Mode Selection */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Import Mode</span>
                  <p className="text-xs text-slate-500">
                    Choose whether to append these physicians or replace existing physician records.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="doctorImportMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold">Append to Directory</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="doctorImportMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-amber-700">Replace Entire Directory</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              id="confirm-import-doctors-btn"
              data-testid="confirm-import-doctors-btn"
              disabled={parsedData.length === 0}
              onClick={handleCommit}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                parsedData.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle size={16} weight="bold" />
              Commit & Import {parsedData.length} Physicians
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
