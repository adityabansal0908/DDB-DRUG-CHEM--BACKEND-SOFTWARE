import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditLog } from '../../types';
import {
  ClockCounterClockwise,
  ArrowCounterClockwise,
  MagnifyingGlass,
  Funnel,
  Buildings,
  CheckCircle,
  PencilSimple,
  Trash,
  Plus,
  FileXls,
  ShieldCheck,
  User,
  EyeSlash,
  Eye,
  Info
} from '@phosphor-icons/react';
import { EditAdminModal } from '../EditAdminModal';
import { UserAvatar } from '../UserAvatar';

export const AuditHistory: React.FC = () => {
  const {
    auditLogs,
    canUndo,
    canRedo,
    undoProductAction,
    redoProductAction,
    reps,
    users
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.targetItemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'ALL' || log.actionType === filterAction;
    const matchesModule = filterModule === 'ALL' || log.module === filterModule;

    return matchesSearch && matchesAction && matchesModule;
  });

  const getActionBadge = (action: AuditLog['actionType']) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Plus size={12} weight="bold" /> Created
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <PencilSimple size={12} weight="bold" /> Updated
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <Trash size={12} weight="bold" /> Deleted
          </span>
        );
      case 'IMPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <FileXls size={12} weight="bold" /> Bulk Import
          </span>
        );
      case 'UNDO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <ArrowCounterClockwise size={12} weight="bold" /> Reverted / Undo
          </span>
        );
      case 'CLEAR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <Trash size={12} weight="bold" /> Cleared Catalog
          </span>
        );
      case 'LOGIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
            <ShieldCheck size={12} weight="bold" /> Logged In
          </span>
        );
      case 'LOGOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            Logged Out
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  return (
    <div
      id="audit-history-page"
      data-testid="audit-history-page"
      className="p-3 sm:p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-4 sm:space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-blue-600 block mb-1">
            OPERATIONS CONSOLE &bull; AUDIT TRAIL
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 font-heading">
            Change History & User Activity
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Restricted Admin ledger tracking who changed what, formulation revisions, and session tracking.
          </p>
        </div>

        {/* Quick Undo & Redo Bar */}
        <div className="flex items-center gap-2.5">
          <button
            id="audit-undo-btn"
            data-testid="audit-undo-btn"
            onClick={undoProductAction}
            disabled={!canUndo}
            title={canUndo ? 'Undo last product catalog change' : 'No changes to undo'}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
              canUndo
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs cursor-pointer active:scale-95'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
            }`}
          >
            <ArrowCounterClockwise size={18} weight="bold" />
            <span>Undo Last Action</span>
          </button>

          <button
            id="audit-redo-btn"
            data-testid="audit-redo-btn"
            onClick={redoProductAction}
            disabled={!canRedo}
            title={canRedo ? 'Redo previously undone change' : 'No changes to redo'}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
              canRedo
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300 shadow-xs cursor-pointer active:scale-95'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
            }`}
          >
            <span>Redo</span>
          </button>
        </div>
      </div>

      {/* Online Reps & Active Personnel Overview */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h2 className="text-lg font-bold tracking-tight text-white">Live Field Force & User Presence</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Live status indicator showing who is currently logged in or logged out (15-minute inactivity timeout enabled).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium">
              {users.filter(u => u.isOnline).length} Active Online
            </span>
            <span className="text-xs bg-slate-700/60 text-slate-300 px-2.5 py-1 rounded-full font-medium">
              {users.filter(u => !u.isOnline).length} Offline
            </span>
          </div>
        </div>

        {/* User Presence Chips Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {users.map((u) => {
            const isRep = u.role === 'sales_rep';
            return (
              <div
                key={u.id}
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
              >
                <div className="relative">
                  <UserAvatar
                    name={u.name}
                    avatarUrl={u.avatarUrl}
                    avatarType={u.avatarType}
                    className="w-10 h-10 border border-white/20"
                    textClassName="text-xs font-bold font-heading"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                      u.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                    title={u.isOnline ? 'Currently Logged In' : 'Logged Out'}
                  ></span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-sm text-white truncate">{u.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {u.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => setIsEditAdminOpen(true)}
                          className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold border border-white/20 transition-colors flex items-center gap-0.5"
                          title="Edit Admin credentials"
                        >
                          <PencilSimple size={10} weight="bold" />
                          <span>Edit</span>
                        </button>
                      )}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          u.isOnline
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {u.isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 truncate">{u.email}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                    {u.role === 'admin' ? 'Administrator' : 'Sales Representative'}
                    {u.lastLoginTime && ` &bull; In: ${u.lastLoginTime}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product, operator name, or change details..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Action:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Created</option>
              <option value="UPDATE">Updated</option>
              <option value="DELETE">Deleted</option>
              <option value="IMPORT">Imported</option>
              <option value="UNDO">Undone</option>
              <option value="CLEAR">Cleared</option>
              <option value="LOGIN">Logins</option>
            </select>
          </div>

          {/* Module Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Module:</span>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Modules</option>
              <option value="Product Catalog">Product Catalog</option>
              <option value="Authentication">Authentication</option>
              <option value="Doctors">Doctors</option>
              <option value="Orders">Orders</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium pl-2">
            Showing {filteredLogs.length} entries
          </span>
        </div>
      </div>

      {/* History Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ClockCounterClockwise size={28} />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No History Logs Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Changes made to products, pricing, manufacturer companies, or logins will appear automatically in this audit log.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              id="audit-history-table"
              data-testid="audit-history-table"
              className="w-full text-left text-xs sm:text-sm border-collapse"
            >
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
                  <th className="py-3.5 px-4 whitespace-nowrap">Timestamp</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Changed By</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Role</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Action</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Target Item</th>
                  <th className="py-3.5 px-4 min-w-[300px]">Change Summary & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-xs">
                      <div className="font-semibold text-slate-900">{log.formattedTime}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                          {log.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 leading-tight">
                            {log.userName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {log.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          log.userRole === 'admin'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {log.userRole === 'admin' ? 'Admin' : 'Sales Rep'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getActionBadge(log.actionType)}
                    </td>

                    {/* Target Item */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      <span className="font-semibold text-slate-900">{log.targetItemName}</span>
                      <span className="text-[11px] text-slate-500 block">{log.module}</span>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 text-slate-700 text-xs">
                      <p className="leading-relaxed">{log.details}</p>
                      {log.previousStateSnippet && log.newStateSnippet && (
                        <div className="mt-1.5 p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-600 space-y-0.5">
                          <div className="text-red-700 truncate">
                            <span className="font-bold text-red-500 mr-1">- Before:</span> {log.previousStateSnippet}
                          </div>
                          <div className="text-emerald-700 truncate">
                            <span className="font-bold text-emerald-500 mr-1">+ After:</span> {log.newStateSnippet}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Admin Modal */}
      <EditAdminModal
        isOpen={isEditAdminOpen}
        onClose={() => setIsEditAdminOpen(false)}
      />
    </div>
  );
};
