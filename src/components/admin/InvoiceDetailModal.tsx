import React from 'react';
import { PaymentTransaction, Organization } from '../../types';
import {
  X,
  Printer,
  DownloadSimple,
  CheckCircle,
  Receipt,
  Buildings,
  ShieldCheck,
  CreditCard
} from '@phosphor-icons/react';
import { downloadInvoicePDF } from '../../lib/invoicePdfGenerator';
import { toast } from 'sonner';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction | null;
  organization?: Organization;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  organization
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    try {
      const filename = downloadInvoicePDF(transaction, organization);
      toast.success(`Downloaded ${filename} successfully!`);
    } catch (err: any) {
      console.error('Failed to download invoice PDF:', err);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const baseAmount = Math.round(transaction.amount / 1.18);
  const totalTax = transaction.amount - baseAmount;
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;

  const invoiceDate = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200 text-slate-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Toolbar (hidden when printing) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <Receipt size={20} className="text-blue-400" />
            <div>
              <span className="font-heading font-black text-sm text-white">Tax Invoice Details</span>
              <span className="text-[11px] text-slate-400 block font-mono">{transaction.invoiceNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download formal invoice as a PDF file"
            >
              <DownloadSimple size={14} weight="bold" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} weight="bold" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Formal Invoice Document */}
        <div id="printable-tax-invoice" className="p-6 sm:p-8 space-y-6 text-xs text-slate-700">
          {/* Top Brand & Invoice Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
                PHARMACEUTICAL CLOUD PLATFORM
              </span>
              <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tight">
                DDB DRUG CHEM
              </h2>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                DDB Pharma Life Sciences Pvt. Ltd.<br />
                Commercial Tower, 4th Floor, BKC, Mumbai - 400051<br />
                GSTIN: <strong>27AAACN0000A1Z5</strong> &bull; PAN: <strong>AAACN0000A</strong><br />
                Drug Lic: <strong>DL-20B/21B-MH-MUM-2026-001</strong>
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                &bull; Payment Succeeded
              </span>
              <div className="text-slate-900 font-mono font-bold text-sm pt-1">
                {transaction.invoiceNumber}
              </div>
              <p className="text-[11px] text-slate-500">
                Invoice Date: <strong className="text-slate-700">{invoiceDate}</strong><br />
                SAC Code: <strong className="text-slate-700">998313 (SaaS Cloud Services)</strong>
              </p>
            </div>
          </div>

          {/* Billed To / Subscriber Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Subscriber / Billed To:
              </span>
              <h4 className="font-heading font-bold text-sm text-slate-900">
                {transaction.organizationName}
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {organization?.legalName || `${transaction.organizationName} Pvt. Ltd.`}<br />
                Billing Email: <strong className="text-slate-800">{transaction.customerEmail}</strong><br />
                Location: {organization?.city || 'Mumbai'}, {organization?.state || 'Maharashtra'}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Subscription &amp; Payment Gateway:
              </span>
              <p className="text-[11px] text-slate-600 space-y-0.5">
                <span>Tenant ID: <code className="font-mono text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">{transaction.tenantId}</code></span><br />
                <span>GSTIN / Tax ID: <strong className="text-slate-800">{organization?.gstin || '27AAACN0000A1Z5'}</strong></span><br />
                <span>Payment Method: <strong className="text-slate-800 uppercase">{transaction.paymentMethod.brand} •••• {transaction.paymentMethod.last4}</strong></span><br />
                <span>Stripe Intent ID: <code className="font-mono text-[10px] text-slate-700">{transaction.stripePaymentIntentId}</code></span>
              </p>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Item &amp; Description</th>
                  <th className="py-2.5 px-4 text-center">Billing Cycle</th>
                  <th className="py-2.5 px-4 text-center">SAC Code</th>
                  <th className="py-2.5 px-4 text-right">Taxable Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-3 px-4">
                    <strong className="text-slate-900 block font-semibold">
                      Pharma SaaS Cloud Platform — {transaction.planName} Tier
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Full access to medical rep GPS tracking, doctor registry, e-detailing, and isolated database storage.
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center capitalize text-slate-700">
                    {transaction.billingCycle}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-600">
                    998313
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {transaction.currency === 'INR' ? '₹' : '$'}{baseAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Grand Total */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal (Net Amount):</span>
                <span className="font-mono font-semibold text-slate-800">
                  {transaction.currency === 'INR' ? '₹' : '$'}{baseAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>CGST (9%):</span>
                <span className="font-mono font-semibold text-slate-800">
                  {transaction.currency === 'INR' ? '₹' : '$'}{cgst.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>SGST (9%):</span>
                <span className="font-mono font-semibold text-slate-800">
                  {transaction.currency === 'INR' ? '₹' : '$'}{sgst.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
                <span>Grand Total Paid:</span>
                <span className="text-emerald-700 font-heading">
                  {transaction.currency === 'INR' ? '₹' : '$'}{transaction.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Regulatory Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} weight="fill" className="text-emerald-600" />
              <span>Electronically authorized tax invoice generated via Stripe Billing.</span>
            </div>
            <span>This is a computer-generated tax receipt. No physical signature required.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <DownloadSimple size={15} weight="bold" />
            <span>Download Invoice PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
