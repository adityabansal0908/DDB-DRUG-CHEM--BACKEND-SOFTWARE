import React, { useState } from 'react';
import { SalesRep } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  MapPin,
  ShieldCheck,
  Check,
  Buildings,
  Storefront,
  User,
  ArrowRight,
  ArrowsClockwise,
  Info,
  Sparkle
} from '@phosphor-icons/react';

interface RepTerritoryModalProps {
  rep: SalesRep;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_TERRITORIES = [
  {
    name: 'Central & South Medical Belt',
    zone: 'South Zone',
    description: 'KEM, Nair, Hinduja, JJ Hospital, Marine Lines, and Colaba corridors'
  },
  {
    name: 'East District & Civil Lines',
    zone: 'East Zone',
    description: 'Ghatkopar, Mulund, Chembur, Kurla, and Vikhroli medical clusters'
  },
  {
    name: 'West Suburbs & SuperSpecialty Hub',
    zone: 'West Zone',
    description: 'Bandra, Andheri, Juhu, Goregaon, and Santa Cruz polyclinic belt'
  },
  {
    name: 'North Medical Zone',
    zone: 'North Zone',
    description: 'Borivali, Kandivali, Malad, and Dahisar hospital & dispensary network'
  },
  {
    name: 'Thane & Navi Mumbai Corridor',
    zone: 'Metropolitan Belt',
    description: 'Vashi, Belapur, Airoli, Kopar Khairane, and Thane Civil hospital routes'
  },
  {
    name: 'Pune West - Deccan & Kothrud',
    zone: 'Pune Region',
    description: 'Deccan Gymkhana, Karve Road, Paud Road, and Bharati Vidyapeeth hospitals'
  },
  {
    name: 'Ahmedabad Central - Ellisbridge & Navrangpura',
    zone: 'Gujarat Region',
    description: 'VS Hospital, Ashram Road, CG Road, and Paldi clinic centers'
  },
  {
    name: 'Delhi NCR - Central & South Medical Hub',
    zone: 'North Region',
    description: 'AIIMS, Safdarjung, Connaught Place, and South Extension health hubs'
  },
  {
    name: 'Bengaluru Central - Indiranagar & Koramangala',
    zone: 'South Region',
    description: 'Manipal Hospital, Victoria, Old Airport Road, and HSR Layout network'
  }
];

export const RepTerritoryModal: React.FC<RepTerritoryModalProps> = ({
  rep,
  isOpen,
  onClose
}) => {
  const { updateRepTerritory, doctors, retailCounters } = useApp();

  const [selectedTerritory, setSelectedTerritory] = useState<string>(rep.territory);
  const [customTerritory, setCustomTerritory] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(() => {
    return !PRESET_TERRITORIES.some(t => t.name.toLowerCase() === rep.territory.toLowerCase());
  });
  const [syncCounters, setSyncCounters] = useState<boolean>(true);
  const [reason, setReason] = useState<string>('Quarterly Route & Coverage Restructuring');

  if (!isOpen) return null;

  // Counts of associated entities
  const repDoctorsCount = doctors.filter(
    d => (d.assignedRepIds && d.assignedRepIds.includes(rep.id)) ||
         (rep.assignedDoctorIds && rep.assignedDoctorIds.includes(d.id))
  ).length;

  const repCountersCount = retailCounters.filter(
    c => c.assignedRepId === rep.id || c.assignedRepName.toLowerCase() === rep.name.toLowerCase()
  ).length;

  const activeNewTerritory = isCustom ? customTerritory.trim() : selectedTerritory;
  const isChanged = activeNewTerritory && activeNewTerritory.toLowerCase() !== rep.territory.toLowerCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNewTerritory) return;

    updateRepTerritory(rep.id, activeNewTerritory, {
      reason: reason.trim() || 'Administrative Route Realignment',
      syncRetailCounters: syncCounters
    });

    onClose();
  };

  return (
    <div
      id="rep-territory-modal-overlay"
      data-testid="rep-territory-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="rep-territory-modal"
        data-testid="rep-territory-modal"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <MapPin size={22} weight="bold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                Assign Sales Territory
              </h2>
              <p className="text-xs text-slate-500">
                Allocate official territory boundaries and field beat jurisdiction
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            id="close-territory-modal-btn"
            data-testid="close-territory-modal-btn"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Admin-Only Security Privilege Strip */}
        <div className="px-5 py-2.5 bg-blue-50/80 border-b border-blue-200/60 flex items-center gap-2 text-xs text-blue-900 font-medium">
          <ShieldCheck size={18} className="text-blue-600 shrink-0" weight="fill" />
          <span>
            <strong>ADMIN PRIVILEGE ONLY:</strong> Field representatives cannot edit their own beat or territory. Only system administrators can assign or reallocate sales jurisdictions.
          </span>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Representative Profile Summary */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={rep.avatarUrl}
                alt={rep.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {rep.name}
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-semibold">
                    {rep.employeeCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phone: <span className="font-mono text-slate-700 font-medium">{rep.phone}</span> &bull; Current Beat: <span className="font-semibold text-slate-800">{rep.territory}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end text-xs">
              <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                {repDoctorsCount} Doctors
              </span>
              <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-emerald-700 font-medium">
                {repCountersCount} Chemist Counters
              </span>
            </div>
          </div>

          {/* Current vs Proposed Territory Comparison */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Territory Realignment Summary
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs">
              <div className="flex-1 p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Existing Territory</span>
                <span className="font-semibold text-slate-800">{rep.territory}</span>
              </div>

              <div className="hidden sm:flex items-center justify-center text-slate-400">
                <ArrowRight size={18} weight="bold" />
              </div>

              <div className={`flex-1 p-2.5 rounded-lg border ${
                isChanged ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <span className="text-[10px] text-slate-500 block">New Assigned Territory</span>
                <span className="font-bold">
                  {activeNewTerritory || 'Please select or enter territory'}
                </span>
              </div>
            </div>
          </div>

          {/* Territory Choice Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Select Standard Medical Territory
              </label>
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <Sparkle size={13} weight="fill" />
                <span>{isCustom ? 'Choose from Presets' : '+ Enter Custom Territory'}</span>
              </button>
            </div>

            {!isCustom ? (
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {PRESET_TERRITORIES.map((t) => {
                  const isSelected = selectedTerritory === t.name;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      id={`territory-preset-${t.name.replace(/\s+/g, '-').toLowerCase()}`}
                      data-testid={`territory-preset-${t.name.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => setSelectedTerritory(t.name)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-1 ring-blue-500 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm leading-snug">{t.name}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700">
                            {t.zone}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {t.description}
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check size={12} weight="bold" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-xs font-semibold text-slate-700 block">
                  Custom Territory Name & Coverage Scope
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    id="custom-territory-input"
                    data-testid="custom-territory-input"
                    required
                    value={customTerritory}
                    onChange={(e) => setCustomTerritory(e.target.value)}
                    placeholder="e.g. North Zone - Super-Specialty Medical Belt"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Provide a clear geographical or clinical hospital corridor name for this representative's beat.
                </p>
              </div>
            )}
          </div>

          {/* Options & Reason */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Administrative Reassignment Reason / Memo
              </label>
              <select
                id="territory-reason-select"
                data-testid="territory-reason-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="Quarterly Route & Coverage Restructuring">Quarterly Route & Coverage Restructuring</option>
                <option value="Field Workload Rebalancing & Capacity Optimization">Field Workload Rebalancing & Capacity Optimization</option>
                <option value="New Hospital Corridors & Super-Specialty Belt Expansion">New Hospital Corridors & Super-Specialty Belt Expansion</option>
                <option value="Representative Promotion / Senior Territory Allocation">Representative Promotion / Senior Territory Allocation</option>
                <option value="Physician Detailing Coverage Realignment">Physician Detailing Coverage Realignment</option>
              </select>
            </div>

            {/* Sync Retail Chemist Counters Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                id="sync-counters-checkbox"
                data-testid="sync-counters-checkbox"
                checked={syncCounters}
                onChange={(e) => setSyncCounters(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  Synchronize Associated Retail Counters
                </span>
                <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                  Automatically update territory on {repCountersCount} retail chemist counters mapped to {rep.name} to match this newly assigned territory.
                </span>
              </div>
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            id="cancel-territory-btn"
            data-testid="cancel-territory-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            id="save-territory-btn"
            data-testid="save-territory-btn"
            onClick={handleSubmit}
            disabled={!activeNewTerritory}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck size={16} weight="bold" />
            <span>Assign Territory</span>
          </button>
        </div>
      </div>
    </div>
  );
};
