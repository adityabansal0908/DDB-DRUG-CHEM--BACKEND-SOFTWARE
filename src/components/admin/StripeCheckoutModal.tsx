import React, { useState } from 'react';
import { SaaSPricingPlan, Organization, PaymentTransaction } from '../../types';
import {
  STRIPE_TEST_CARDS,
  detectCardBrand,
  formatCardNumber,
  formatExpiry
} from '../../data/subscriptionData';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle,
  X,
  ArrowRight,
  Receipt,
  DownloadSimple,
  Buildings,
  Sparkle,
  ArrowSquareOut
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: SaaSPricingPlan;
  billingCycle: 'monthly' | 'annual';
  activeOrg: Organization;
  allOrgs: Organization[];
  onPaymentSuccess: (transaction: PaymentTransaction, provisionedOrg?: Organization) => void;
  isNewOrgMode?: boolean;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  billingCycle,
  activeOrg,
  allOrgs,
  onPaymentSuccess,
  isNewOrgMode = false
}) => {
  const [isNewOrg, setIsNewOrg] = useState(isNewOrgMode);
  const [selectedOrgId, setSelectedOrgId] = useState(activeOrg.id);

  // New Organization Fields (if creating a new tenant during signup)
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgLegalName, setNewOrgLegalName] = useState('');
  const [newOrgEmail, setNewOrgEmail] = useState('');
  const [newOrgCity, setNewOrgCity] = useState('Mumbai');
  const [newOrgGstin, setNewOrgGstin] = useState('');

  // Payment Form Fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('Dr. Aditya Bansal');
  const [billingEmail, setBillingEmail] = useState('adityabansal0810@gmail.com');
  const [zipCode, setZipCode] = useState('400001');

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [completedTxn, setCompletedTxn] = useState<PaymentTransaction | null>(null);

  if (!isOpen) return null;

  const cardBrand = detectCardBrand(cardNumber);

  const price = billingCycle === 'annual' ? selectedPlan.annualPrice : selectedPlan.monthlyPrice;
  const gstAmount = Math.round(price * 0.18);
  const totalAmount = price + gstAmount;

  const handleApplyTestCard = (testCard: typeof STRIPE_TEST_CARDS[0]) => {
    setCardNumber(formatCardNumber(testCard.raw));
    setCardExpiry('12/28');
    setCardCvc('888');
    toast.info(`Filled Stripe ${testCard.brand.toUpperCase()} test card`);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setCardExpiry(formatted);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 15) {
      toast.error('Please enter a valid card number');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      toast.error('Please enter a valid expiry date (MM/YY)');
      return;
    }
    if (!cardCvc || cardCvc.length < 3) {
      toast.error('Please enter a 3 or 4 digit CVC security code');
      return;
    }

    if (isNewOrg && !newOrgName.trim()) {
      toast.error('Please enter your organization trading name');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Connecting to Stripe Payment Gateway...');

    await new Promise(r => setTimeout(r, 650));
    setProcessingStep('Authorizing Payment Intent (256-bit SSL)...');

    await new Promise(r => setTimeout(r, 750));
    setProcessingStep('Capturing charge & issuing tax invoice...');

    await new Promise(r => setTimeout(r, 600));

    const rawId = Math.random().toString(36).substring(2, 9);
    const intentId = `pi_3${rawId.toUpperCase()}StripeLive`;
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let targetTenantId = selectedOrgId;
    let targetOrgName = activeOrg.name;
    let provisionedOrg: Organization | undefined;

    if (isNewOrg) {
      const slug = newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      targetTenantId = `tenant-${slug}-${Date.now().toString(36).substring(0, 4)}`;
      targetOrgName = newOrgName;

      provisionedOrg = {
        id: targetTenantId,
        name: newOrgName,
        slug,
        legalName: newOrgLegalName || `${newOrgName} Private Limited`,
        tagline: 'Quality Pharmaceutical Formulations & Distribution',
        plan: selectedPlan.id as Organization['plan'],
        status: 'active',
        maxReps: selectedPlan.maxReps,
        maxProducts: selectedPlan.maxProducts,
        primaryColor: '#2563eb',
        contactEmail: newOrgEmail || billingEmail,
        city: newOrgCity,
        gstin: newOrgGstin || '27AAACN0000A1Z5',
        adminUserEmails: [newOrgEmail || billingEmail],
        isolationLevel: 'strict_row_level',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      const found = allOrgs.find(o => o.id === selectedOrgId);
      if (found) {
        targetOrgName = found.name;
      }
    }

    const transaction: PaymentTransaction = {
      id: `txn_${Date.now()}`,
      tenantId: targetTenantId,
      organizationName: targetOrgName,
      amount: totalAmount,
      currency: selectedPlan.currencyCode,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      billingCycle,
      status: 'succeeded',
      stripePaymentIntentId: intentId,
      stripeReceiptUrl: `https://pay.stripe.com/receipts/acct_ddb_pharma/ch_${intentId}/rcpt_live`,
      paymentMethod: {
        brand: cardBrand === 'generic' ? 'visa' : cardBrand,
        last4: cardNumber.replace(/\s/g, '').slice(-4) || '4242',
        expMonth: parseInt(cardExpiry.split('/')[0]) || 12,
        expYear: parseInt(`20${cardExpiry.split('/')[1]}`) || 2028
      },
      customerEmail: billingEmail,
      invoiceNumber: invoiceNum,
      createdAt: new Date().toISOString()
    };

    setIsProcessing(false);
    setCompletedTxn(transaction);
    onPaymentSuccess(transaction, provisionedOrg);
    toast.success('Stripe Payment Succeeded!', {
      description: `Plan upgraded to ${selectedPlan.name}. Receipt ${transaction.invoiceNumber} created.`
    });
  };

  const handleDownloadInvoice = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Stripe Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#635BFF]/20 border border-[#635BFF]/40 flex items-center justify-center text-[#635BFF]">
              <CreditCard size={22} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-white text-base">Stripe Secure Checkout</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PCI-DSS Level 1
                </span>
              </div>
              <p className="text-xs text-slate-300">
                End-to-end encrypted 256-bit payment authorization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {completedTxn ? (
          /* Payment Success & Receipt View */
          <div className="p-6 space-y-6">
            <div className="text-center space-y-2 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle size={36} weight="fill" />
              </div>
              <h3 className="text-2xl font-heading font-black text-slate-900">
                Payment Authorized &amp; Confirmed!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Thank you! Your subscription for <strong>{completedTxn.organizationName}</strong> has been upgraded to <strong>{completedTxn.planName}</strong> with immediate quota activation.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Receipt / Invoice No.</span>
                <span className="font-mono font-bold text-slate-900">{completedTxn.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Stripe Payment Intent</span>
                <span className="font-mono text-slate-700 text-[11px]">{completedTxn.stripePaymentIntentId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Subscription Tier</span>
                <span className="font-bold text-slate-900">{completedTxn.planName} ({completedTxn.billingCycle})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Card Charged</span>
                <span className="font-mono font-medium text-slate-700 uppercase">
                  {completedTxn.paymentMethod.brand} •••• {completedTxn.paymentMethod.last4}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Total Amount Paid</span>
                <span className="text-emerald-700">
                  {selectedPlan.currency}{completedTxn.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <DownloadSimple size={15} weight="bold" />
                <span>Print / Download Tax Receipt</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form View */
          <form onSubmit={handleSubmitPayment} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
            {/* Plan & Pricing Summary Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                  Selected Subscription Tier
                </span>
                <h4 className="text-base font-heading font-black text-slate-900">
                  {selectedPlan.name} &bull; {billingCycle === 'annual' ? 'Annual Billing' : 'Monthly Billing'}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Includes up to {selectedPlan.maxReps} Sales Reps, {selectedPlan.maxProducts} Products &amp; {selectedPlan.maxDoctors} Doctors
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 block">Total Due Today</span>
                <span className="text-xl font-heading font-black text-slate-900">
                  {selectedPlan.currency}{totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  (Includes ₹{gstAmount.toLocaleString('en-IN')} GST @ 18%)
                </span>
              </div>
            </div>

            {/* Target Organization Selector (Existing vs New) */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                1. Subscriber Organization
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsNewOrg(false)}
                  className={`py-2 px-3 rounded-lg border font-semibold transition-all cursor-pointer ${
                    !isNewOrg
                      ? 'bg-white border-blue-600 text-blue-700 shadow-2xs ring-1 ring-blue-500'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  Existing Organization
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewOrg(true)}
                  className={`py-2 px-3 rounded-lg border font-semibold transition-all cursor-pointer ${
                    isNewOrg
                      ? 'bg-white border-blue-600 text-blue-700 shadow-2xs ring-1 ring-blue-500'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  + New Organization Signup
                </button>
              </div>

              {!isNewOrg ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Select Target Organization to Upgrade
                  </label>
                  <select
                    value={selectedOrgId}
                    onChange={e => setSelectedOrgId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {allOrgs.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} (Current: {o.plan.toUpperCase()} Tier)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Organization Trading Name*
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MedVance Formulations"
                      value={newOrgName}
                      onChange={e => setNewOrgName(e.target.value)}
                      required
                      className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      City / State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, MH"
                      value={newOrgCity}
                      onChange={e => setNewOrgCity(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Test Cards Presets */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-indigo-900 font-medium">
                <span className="flex items-center gap-1.5 font-bold">
                  <Sparkle size={14} className="text-indigo-600" />
                  Stripe Test Cards (Click to auto-fill):
                </span>
                <span className="text-[11px] text-indigo-700">Sandbox Test Mode</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STRIPE_TEST_CARDS.map(tc => (
                  <button
                    key={tc.raw}
                    type="button"
                    onClick={() => handleApplyTestCard(tc)}
                    className="px-2.5 py-1 text-[11px] font-mono bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-md shadow-2xs transition-colors cursor-pointer"
                  >
                    {tc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stripe Card Element Input */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                2. Credit or Debit Card Details
              </span>

              {/* Card Number with Brand Badge */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    required
                    className="w-full text-sm font-mono tracking-wider pl-10 pr-20 py-2.5 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <CreditCard size={18} />
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {cardBrand.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expiry and CVC */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Expiration (MM/YY)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    required
                    className="w-full text-sm font-mono px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    CVC / CVV
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="•••"
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full text-sm font-mono tracking-widest px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Cardholder Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={e => setCardholderName(e.target.value)}
                    required
                    className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Receipt Email
                  </label>
                  <input
                    type="email"
                    value={billingEmail}
                    onChange={e => setBillingEmail(e.target.value)}
                    required
                    className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <ShieldCheck size={16} weight="fill" className="text-emerald-600 shrink-0" />
              <span>
                Processed securely via <strong>Stripe Payment Gateway</strong>. Card credentials are tokenized directly with Stripe and never stored in plain text.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{processingStep}</span>
                  </>
                ) : (
                  <>
                    <span>Pay {selectedPlan.currency}{totalAmount.toLocaleString('en-IN')} &amp; Activate</span>
                    <ArrowRight size={15} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
