import React, { useState } from 'react';
import { SalesRep } from '../../types';
import { useApp } from '../../context/AppContext';
import { RepTerritoryModal } from './RepTerritoryModal';
import {
  X,
  Target,
  CurrencyInr,
  CalendarBlank,
  NotePencil,
  Check,
  CheckCircle,
  TrendUp,
  User
} from '@phosphor-icons/react';

interface RepTargetModalProps {
  rep: SalesRep;
  isOpen: boolean;
  onClose: () => void;
}

export const RepTargetModal: React.FC<RepTargetModalProps> = ({
  rep,
  isOpen,
  onClose
}) => {
  const { updateRepTarget } = useApp();

  const [todayTarget, setTodayTarget] = useState<number>(rep.todayTarget || 6);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(rep.monthlyTarget || 120);
  const [monthlyRevenueTarget, setMonthlyRevenueTarget] = useState<number>(
    rep.monthlyRevenueTarget || 250000
  );
  const [targetPeriod, setTargetPeriod] = useState<string>(
    rep.targetPeriod || 'September 2026'
  );
  const [targetNotes, setTargetNotes] = useState<string>(
    rep.targetNotes || 'Prioritize high-turnover counters and key opinion leader physicians.'
  );
  const [isTerritoryModalOpen, setIsTerritoryModalOpen] = useState(false);

  if (!isOpen) return null;

  const currentDailyPct = Math.round(((rep.todayVisitsCompleted || 0) / (todayTarget || 1)) * 100);
  const currentMonthlyPct = Math.round(((rep.monthlyAchieved || 0) / (monthlyTarget || 1)) * 100);
  const revenueAchieved = rep.monthlyRevenueAchieved || 0;
  const currentRevenuePct = Math.round((revenueAchieved / (monthlyRevenueTarget || 1)) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRepTarget(rep.id, {
      todayTarget: Number(todayTarget),
      monthlyTarget: Number(monthlyTarget),
      monthlyRevenueTarget: Number(monthlyRevenueTarget),
      targetPeriod: targetPeriod.trim(),
      targetNotes: targetNotes.trim()
    });
    onClose();
  };

  const applyPreset = (visitsDaily: number, visitsMonthly: number, revenue: number) => {
    setTodayTarget(visitsDaily);
    setMonthlyTarget(visitsMonthly);
    setMonthlyRevenueTarget(revenue);
  };

  return (
    <div
      id="set-target-modal-overlay"
      data-testid="set-target-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="set-target-modal"
        data-testid="set-target-modal"
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Target size={22} weight="bold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                Set Field Targets & Quotas
              </h2>
              <p className="text-xs text-slate-500">
                Configure doctor detailing quota and sales revenue benchmarks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-target-modal-btn"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Rep Identity Banner */}
        <div className="px-6 py-3 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <img
              src={rep.avatarUrl}
              alt={rep.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-lg object-cover border border-blue-200 shadow-2xs"
            />
            <div>
              <div className="text-sm font-bold text-slate-900">{rep.name}</div>
              <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                <span className="font-mono">{rep.employeeCode}</span>
                <span>&bull;</span>
                <span className="font-medium text-slate-800">{rep.territory}</span>
                <button
                  type="button"
                  id={`target-modal-edit-territory-btn-${rep.id}`}
                  data-testid={`target-modal-edit-territory-btn-${rep.id}`}
                  onClick={() => setIsTerritoryModalOpen(true)}
                  className="text-[10px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-1.5 py-0.5 rounded border border-blue-300 transition-colors cursor-pointer"
                  title="Admin Privilege: Assign or Edit Territory"
                >
                  Edit Territory
                </button>
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-100/80 text-blue-800 border border-blue-200">
            {targetPeriod || 'Current Month'}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick Presets */}
          <div>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
              Quick Target Presets
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(5, 100, 200000)}
                className="py-1.5 px-2.5 text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg transition-colors text-slate-700 text-center"
              >
                Standard (100 / ₹2.0L)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(6, 120, 250000)}
                className="py-1.5 px-2.5 text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg transition-colors text-slate-700 text-center"
              >
                Growth (120 / ₹2.5L)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(7, 140, 320000)}
                className="py-1.5 px-2.5 text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg transition-colors text-slate-700 text-center"
              >
                Aggressive (140 / ₹3.2L)
              </button>
            </div>
          </div>

          {/* Daily & Monthly Doctor Visit Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="target-daily-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Daily Doctor Visits Quota <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="target-daily-input"
                  data-testid="target-daily-input"
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={todayTarget}
                  onChange={(e) => setTodayTarget(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 6"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">
                  visits/day
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Current today: {rep.todayVisitsCompleted || 0} visits ({currentDailyPct}%)
              </span>
            </div>

            <div>
              <label
                htmlFor="target-monthly-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Monthly Doctor Visits Quota <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="target-monthly-input"
                  data-testid="target-monthly-input"
                  type="number"
                  min={10}
                  max={300}
                  required
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 120"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">
                  visits/mo
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Achieved so far: {rep.monthlyAchieved || 0} visits ({currentMonthlyPct}%)
              </span>
            </div>
          </div>

          {/* Revenue Target & Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="target-revenue-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Monthly Sales Revenue Quota (₹)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-slate-400">
                  <CurrencyInr size={18} />
                </div>
                <input
                  id="target-revenue-input"
                  data-testid="target-revenue-input"
                  type="number"
                  min={10000}
                  step={5000}
                  value={monthlyRevenueTarget}
                  onChange={(e) => setMonthlyRevenueTarget(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="250000"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Billed this month: ₹{revenueAchieved.toLocaleString('en-IN')} ({currentRevenuePct}%)
              </span>
            </div>

            <div>
              <label
                htmlFor="target-period-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Target Period / Cycle
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-slate-400">
                  <CalendarBlank size={18} />
                </div>
                <input
                  id="target-period-input"
                  data-testid="target-period-input"
                  type="text"
                  value={targetPeriod}
                  onChange={(e) => setTargetPeriod(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="September 2026"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                e.g. September 2026, Q3 2026
              </span>
            </div>
          </div>

          {/* Strategic Target Directives */}
          <div>
            <label
              htmlFor="target-notes-input"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Strategic Detailing Directives & Rep Notes
            </label>
            <div className="relative">
              <textarea
                id="target-notes-input"
                data-testid="target-notes-input"
                rows={3}
                value={targetNotes}
                onChange={(e) => setTargetNotes(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Direct rep towards specific product launches, doctor chambers, or retail accounts..."
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Visible to the medical representative during route check-in and detailing sessions.
            </span>
          </div>

          {/* Summary Metric Preview Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Target Summary & Benchmark Impact</span>
              <span className="text-blue-600 flex items-center gap-1">
                <TrendUp size={14} /> Active Period
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Daily Target</span>
                <span className="font-bold text-slate-800 text-sm">{todayTarget} docs</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Monthly Target</span>
                <span className="font-bold text-slate-800 text-sm">{monthlyTarget} docs</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Revenue Quota</span>
                <span className="font-bold text-blue-700 text-sm">
                  ₹{(monthlyRevenueTarget / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              data-testid="cancel-target-btn"
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-rep-target-btn"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check size={16} weight="bold" />
              <span>Save & Update Targets</span>
            </button>
          </div>
        </form>

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
