import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  Pill,
  Printer,
  FileText
} from '@phosphor-icons/react';

export const OrdersApprovals: React.FC = () => {
  const { orders, approveOrder, rejectOrder } = useApp();

  return (
    <div
      id="orders-approvals-page"
      data-testid="orders-approvals-page"
      className="p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-blue-600 block mb-1">
            Fulfillment & Invoicing
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 font-heading">
            Pharmacy Orders & Sample Dispatches
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Review booked purchase orders and physician sample trial allocations for depot dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg tabular-nums">
            {orders.filter(o => o.status === 'pending').length} Pending Dispatch
          </span>
        </div>
      </div>

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
              {orders.map((order) => (
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
                    <span className="text-[11px] text-slate-500">North Territory</span>
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
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {order.status === 'approved' && <CheckCircle size={13} weight="fill" />}
                      {order.status === 'rejected' && <XCircle size={13} weight="fill" />}
                      {order.status === 'pending' && <Clock size={13} weight="bold" />}
                      {order.status === 'approved' ? 'Approved' : order.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </td>

                  <td className="py-4 px-5 text-right">
                    {order.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          data-testid={`approve-order-${order.id}`}
                          onClick={() => approveOrder(order.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          data-testid={`reject-order-${order.id}`}
                          onClick={() => rejectOrder(order.id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
