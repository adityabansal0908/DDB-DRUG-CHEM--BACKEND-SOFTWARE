import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderOrSampleRequest } from '../../types';
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  Pill,
  Printer,
  FileText,
  Plus,
  MagnifyingGlass,
  Funnel,
  Package,
  CurrencyInr,
  CaretDown,
  ArrowCounterClockwise,
  Sparkle
} from '@phosphor-icons/react';
import { CreateOrderModal } from './CreateOrderModal';
import { FifoBatchDispatchModal } from './FifoBatchDispatchModal';

export const OrdersApprovals: React.FC = () => {
  const { orders, products, approveOrder, rejectOrder, dispatchOrder } = useApp();
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [orderForFifoDispatch, setOrderForFifoDispatch] = useState<OrderOrSampleRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'dispatched' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Order' | 'Sample'>('all');

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const term = (searchTerm || '').toLowerCase().trim();
      const matchesSearch =
        !term ||
        (order.id || '').toLowerCase().includes(term) ||
        (order.doctorName || '').toLowerCase().includes(term) ||
        (order.clinicName || '').toLowerCase().includes(term) ||
        (order.repName || '').toLowerCase().includes(term) ||
        (Array.isArray(order.items) && order.items.some((i) => (i?.productName || '').toLowerCase().includes(term)));

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesType = typeFilter === 'all' || order.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [orders, searchTerm, statusFilter, typeFilter]);

  // Metrics
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const approvedCount = orders.filter((o) => o.status === 'approved').length;
  const dispatchedCount = orders.filter((o) => o.status === 'dispatched').length;
  const rejectedCount = orders.filter((o) => o.status === 'rejected').length;
  const totalCommercialRevenue = orders
    .filter((o) => o.type === 'Order')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div
      id="orders-approvals-page"
      data-testid="orders-approvals-page"
      className="p-3 sm:p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-4 sm:space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-blue-600 block mb-1">
            Fulfillment & Invoicing
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 font-heading">
            Pharmacy Orders & Sample Dispatches
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Review booked purchase orders, track warehouse dispatch pipelines, or book direct depot orders.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
            <Sparkle size={14} weight="fill" className="text-emerald-600" />
            <span>FIFO Batch Advisory Active</span>
          </span>
          <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-2 rounded-xl tabular-nums">
            {pendingCount} Pending Dispatch
          </span>
          <button
            type="button"
            id="create-order-open-btn"
            data-testid="create-order-open-btn"
            onClick={() => setIsCreateOrderOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold tracking-wide shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Orders</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-1 block">
            {orders.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Logged in system</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">Pending</span>
          <span className="text-xl sm:text-2xl font-bold text-amber-700 font-mono mt-1 block">
            {pendingCount}
          </span>
          <span className="text-[11px] text-amber-600/80 mt-0.5 block">Awaiting approval</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Approved</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono mt-1 block">
            {approvedCount}
          </span>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block">Ready for dispatch</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">Dispatched</span>
          <span className="text-xl sm:text-2xl font-bold text-blue-700 font-mono mt-1 block">
            {dispatchedCount}
          </span>
          <span className="text-[11px] text-blue-600/80 mt-0.5 block">Fulfilled & invoiced</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">Order Value</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-1 block">
            ₹{totalCommercialRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Gross commercial volume</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID, Doctor, Clinic, Rep, or Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Controls (Status Dropdown, Type Dropdown, and Quick Status Pills) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="order-status-dropdown"
              className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0"
            >
              <Funnel size={14} className="text-blue-600" weight="bold" />
              <span>Status:</span>
            </label>
            <div className="relative">
              <select
                id="order-status-dropdown"
                data-testid="order-status-dropdown"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors shadow-2xs"
              >
                <option value="all">All Statuses ({orders.length})</option>
                <option value="pending">Pending ({pendingCount})</option>
                <option value="approved">Approved ({approvedCount})</option>
                <option value="dispatched">Dispatched ({dispatchedCount})</option>
                <option value="rejected">Declined ({rejectedCount})</option>
              </select>
              <CaretDown size={12} weight="bold" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Quick Status Selection Pills */}
          <div className="hidden lg:inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                statusFilter === 'approved' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('dispatched')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                statusFilter === 'dispatched' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dispatched ({dispatchedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer text-xs ${
                statusFilter === 'rejected' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Declined ({rejectedCount})
            </button>
          </div>

          {/* Type Dropdown */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="order-type-dropdown" className="text-xs font-semibold text-slate-500">
              Type:
            </label>
            <div className="relative">
              <select
                id="order-type-dropdown"
                data-testid="order-type-dropdown"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="appearance-none pl-3 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="Order">Commercial Orders</option>
                <option value="Sample">Physician Samples</option>
              </select>
              <CaretDown size={11} weight="bold" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Clear Filter Button */}
          {(statusFilter !== 'all' || typeFilter !== 'all' || searchTerm.trim()) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
                setSearchTerm('');
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 cursor-pointer"
            >
              <ArrowCounterClockwise size={12} weight="bold" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                <th className="py-3.5 px-5">Order ID & Date</th>
                <th className="py-3.5 px-4">Physician & Institution</th>
                <th className="py-3.5 px-4">Sales Representative</th>
                <th className="py-3.5 px-4">Line Items</th>
                <th className="py-3.5 px-4 text-right">Order Value</th>
                <th className="py-3.5 px-4 text-center">Type</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <ShoppingCart size={20} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">No orders found</p>
                      <p className="text-xs text-slate-500">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                          ? `No orders match filter "${statusFilter !== 'all' ? statusFilter : 'criteria'}".`
                          : 'No orders have been recorded yet. Click Create Order to book a clinic order.'}
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        {(statusFilter !== 'all' || typeFilter !== 'all' || searchTerm) && (
                          <button
                            type="button"
                            onClick={() => {
                              setStatusFilter('all');
                              setTypeFilter('all');
                              setSearchTerm('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            <ArrowCounterClockwise size={13} weight="bold" />
                            <span>Show All Orders</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsCreateOrderOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <Plus size={14} weight="bold" />
                          <span>Create Order</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    id={`order-row-${order.id}`}
                    data-testid={`order-row-${order.id}`}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-900 font-mono text-xs">
                        {order.id}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{order.date}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">{order.doctorName}</div>
                      <div className="text-xs text-slate-500">{order.clinicName}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-slate-800">{order.repName}</div>
                      <span className="text-[11px] text-slate-500">
                        {order.repId === 'rep-admin' ? 'Direct Depot' : 'Field Sales'}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs text-slate-700 flex items-center gap-2">
                            <span className="font-semibold">{item.qty}x</span>
                            <span>{item.productName}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right tabular-nums font-bold text-slate-900 text-base">
                      {order.type === 'Sample' ? (
                        <span className="text-xs font-semibold text-slate-400">Complimentary</span>
                      ) : (
                        `₹${order.totalAmount.toLocaleString('en-IN')}`
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                          order.type === 'Order'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {order.type}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        data-testid={`order-status-badge-${order.id}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors shadow-2xs ${
                          order.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : order.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : order.status === 'dispatched'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {order.status === 'approved' && <CheckCircle size={14} weight="fill" className="text-emerald-600 shrink-0" />}
                        {order.status === 'pending' && <Clock size={14} weight="bold" className="text-amber-600 shrink-0" />}
                        {order.status === 'dispatched' && <Package size={14} weight="fill" className="text-blue-600 shrink-0" />}
                        {order.status === 'rejected' && <XCircle size={14} weight="fill" className="text-rose-600 shrink-0" />}
                        <span>
                          {order.status === 'approved'
                            ? 'Approved'
                            : order.status === 'pending'
                            ? 'Pending'
                            : order.status === 'dispatched'
                            ? 'Dispatched'
                            : 'Declined'}
                        </span>
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      {order.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            data-testid={`approve-order-${order.id}`}
                            onClick={() => approveOrder(order.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <CheckCircle size={13} weight="bold" />
                            <span>Approve</span>
                          </button>
                          <button
                            data-testid={`reject-order-${order.id}`}
                            onClick={() => rejectOrder(order.id)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {order.status === 'approved' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            data-testid={`dispatch-order-${order.id}`}
                            onClick={() => setOrderForFifoDispatch(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                            title="Review FIFO batch suggestion & dispatch"
                          >
                            <Package size={14} weight="bold" />
                            <span>Dispatch</span>
                          </button>
                          <button
                            data-testid={`reject-order-${order.id}`}
                            onClick={() => rejectOrder(order.id)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            title="Decline order"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {order.status === 'dispatched' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-md border border-blue-200 shadow-2xs">
                            <Package size={13} weight="fill" className="text-blue-600" />
                            <span>Fulfilled</span>
                          </span>
                        </div>
                      )}

                      {order.status === 'rejected' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            data-testid={`reopen-order-${order.id}`}
                            onClick={() => approveOrder(order.id)}
                            className="px-2.5 py-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            Reopen
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
      />

      {/* FIFO Batch Dispatch Suggestion / Advisory Modal */}
      <FifoBatchDispatchModal
        isOpen={!!orderForFifoDispatch}
        onClose={() => setOrderForFifoDispatch(null)}
        order={orderForFifoDispatch}
        products={products}
        onConfirmDispatch={(orderId, applyFifo) => {
          dispatchOrder(orderId, applyFifo);
          setOrderForFifoDispatch(null);
        }}
      />
    </div>
  );
};


