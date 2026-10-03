import React, { useMemo } from 'react';
import { OrderOrSampleRequest, Product } from '../../types';
import { calculateFifoPlan, ProductFifoPlan } from '../../utils/fifoHelper';
import {
  Package,
  Calendar,
  Clock,
  Warning,
  CheckCircle,
  X,
  ArrowRight,
  ShieldCheck,
  Sparkle,
  Info
} from '@phosphor-icons/react';

interface FifoBatchDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderOrSampleRequest | null;
  products: Product[];
  onConfirmDispatch: (orderId: string, applyFifo: boolean) => void;
}

export const FifoBatchDispatchModal: React.FC<FifoBatchDispatchModalProps> = ({
  isOpen,
  onClose,
  order,
  products,
  onConfirmDispatch
}) => {
  if (!isOpen || !order) return null;

  // Compute FIFO plan for all line items in order
  const plans: { item: typeof order.items[0]; plan: ProductFifoPlan | null }[] = useMemo(() => {
    return (order.items || []).map(item => {
      const prod = products.find(
        p => (item.productId && p.id === item.productId) ||
             (p.name && item.productName && p.name.trim().toLowerCase() === item.productName.trim().toLowerCase())
      );
      if (!prod) return { item, plan: null };
      const plan = calculateFifoPlan(prod, item.qty || 0);
      return { item, plan };
    });
  }, [order, products]);

  const hasMultipleBatchesInAny = plans.some(
    p => p.plan && (p.plan.allocations.length > 1 || (p.plan.totalBatchStock > 0 && p.plan.allocations.length > 0))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Package size={22} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  FIFO Batch Dispatch Advisory
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                  {order.id}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Recommended stock deduction from batches closest to expiration date
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Friendly Non-compulsory Advisory Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs">
              <Info size={16} weight="fill" className="text-amber-600 shrink-0" />
              <span>FIFO (First-In, First-Out) Inventory Reminder</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-amber-800">
              To minimize expiration losses and ensure fresh inventory rotation, the system suggests deducting stock
              from batches closest to their expiry date first. <strong>This recommendation is optional:</strong> you can
              confirm the suggested FIFO batch allocations, or proceed with standard warehouse dispatch.
            </p>
          </div>

          {/* Destination Details */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Recipient / Doctor</span>
              <span className="font-semibold text-slate-800 text-xs block truncate">{order.doctorName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Institution / Chemist</span>
              <span className="font-semibold text-slate-800 text-xs block truncate">{order.clinicName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Order Value</span>
              <span className="font-bold text-blue-700 text-xs block tabular-nums">
                ₹{order.totalAmount.toLocaleString('en-IN')} ({order.type})
              </span>
            </div>
          </div>

          {/* Formulations Batch Deduction Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Suggested Batch Allocation Plan</span>
              <span className="text-[11px] font-normal text-slate-400">
                Sorted: Earliest Expiry First
              </span>
            </h4>

            <div className="space-y-2.5">
              {plans.map(({ item, plan }, idx) => (
                <div
                  key={`${item.productName}-${idx}`}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        {item.productName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Requested Quantity: <strong className="text-slate-800">{item.qty} units</strong>
                      </span>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                      ₹{((item.qty || 0) * (item.price || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Allocations Table/Badges */}
                  {plan && plan.allocations.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {plan.allocations.map((alloc, aIdx) => (
                        <div
                          key={`${alloc.batchNumber}-${aIdx}`}
                          className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                            alloc.isExpiringSoon
                              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                              {alloc.batchNumber}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <Calendar size={12} />
                              Exp: <strong className="text-slate-700">{alloc.expiryDate}</strong>
                            </span>
                            {alloc.isExpiringSoon && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                <Warning size={10} weight="bold" />
                                Near Expiry (Priority)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 tabular-nums">
                            <span className="text-slate-500">Stock: {alloc.stockBefore}</span>
                            <ArrowRight size={12} className="text-slate-400" />
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Deduct: {alloc.allocatedQty}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              (rem: {alloc.stockAfter})
                            </span>
                          </div>
                        </div>
                      ))}

                      {plan.unfulfilledQty > 0 && (
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center justify-between">
                          <span>⚠️ Insufficient batch stock!</span>
                          <span className="font-bold">Unfulfilled: {plan.unfulfilledQty} units</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-50 text-slate-500 text-[11px] italic">
                      No explicit batch records configured for this product. Default master stock will be deducted.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Audit trail log will record chosen batch dispatch method</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* Standard Dispatch (Non-compulsory / Skip FIFO) */}
            <button
              type="button"
              id="btn-standard-dispatch"
              data-testid="btn-standard-dispatch"
              onClick={() => {
                onConfirmDispatch(order.id, false);
                onClose();
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Dispatch normally without adjusting batch records"
            >
              Standard Dispatch (Skip FIFO)
            </button>

            {/* Recommended: Apply FIFO Allocation */}
            <button
              type="button"
              id="btn-apply-fifo-dispatch"
              data-testid="btn-apply-fifo-dispatch"
              onClick={() => {
                onConfirmDispatch(order.id, true);
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Sparkle size={14} weight="fill" />
              <span>Apply FIFO & Dispatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
