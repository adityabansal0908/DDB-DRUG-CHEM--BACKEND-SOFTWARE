import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SaaSPricingPlan, Organization, PaymentTransaction } from '../../types';
import { DEFAULT_PRICING_PLANS } from '../../data/subscriptionData';
import { StripeCheckoutModal } from './StripeCheckoutModal';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { downloadInvoicePDF } from '../../lib/invoicePdfGenerator';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  PencilSimple,
  Plus,
  ArrowRight,
  Receipt,
  DownloadSimple,
  Sparkle,
  Buildings,
  Users,
  Pill,
  Lock,
  ArrowClockwise,
  Check,
  X,
  MagnifyingGlass,
  Funnel,
  Printer,
  EnvelopeSimple,
  ArrowSquareOut,
  CalendarBlank,
  ChartLineUp,
  Eye,
  FileText
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export const SubscriptionManagement: React.FC = () => {
  const {
    activeOrganization,
    organizations,
    pricingPlans,
    updatePricingPlan,
    resetPricingPlansToDefault,
    paymentTransactions,
    addPaymentTransaction,
    resetPaymentTransactionsToDefault,
    upgradeOrganizationSubscription,
    createOrganization,
    tenantQuotaUsage,
    reps,
    products,
    doctors
  } = useApp();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SaaSPricingPlan | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isNewOrgCheckout, setIsNewOrgCheckout] = useState(false);

  // Tab State: 'plans' vs 'billing_history'
  const [activeTab, setActiveTab] = useState<'plans' | 'billing_history'>('plans');

  // Selected Transaction for Invoice Modal
  const [selectedInvoiceModalTxn, setSelectedInvoiceModalTxn] = useState<PaymentTransaction | null>(null);

  // Billing History Filters & Search
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyOrgFilter, setHistoryOrgFilter] = useState('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historySortBy, setHistorySortBy] = useState<'newest' | 'oldest' | 'highest_amount' | 'lowest_amount'>('newest');

  // Filtered transactions for the Billing History tab
  const filteredTransactions = React.useMemo(() => {
    return paymentTransactions.filter(txn => {
      const query = (historySearchQuery || '').toLowerCase().trim();
      const matchesQuery =
        !query ||
        txn.invoiceNumber.toLowerCase().includes(query) ||
        txn.organizationName.toLowerCase().includes(query) ||
        txn.customerEmail.toLowerCase().includes(query) ||
        txn.stripePaymentIntentId.toLowerCase().includes(query) ||
        txn.planName.toLowerCase().includes(query);

      const matchesOrg = historyOrgFilter === 'ALL' || txn.tenantId === historyOrgFilter;
      const matchesStatus = historyStatusFilter === 'ALL' || txn.status === historyStatusFilter;

      return matchesQuery && matchesOrg && matchesStatus;
    });
  }, [paymentTransactions, historySearchQuery, historyOrgFilter, historyStatusFilter]);

  // Sorted transactions
  const sortedTransactions = React.useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (historySortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (historySortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (historySortBy === 'highest_amount') {
        return b.amount - a.amount;
      }
      if (historySortBy === 'lowest_amount') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [filteredTransactions, historySortBy]);

  // Aggregate metrics for billing history
  const totalRevenue = React.useMemo(() => {
    return paymentTransactions.reduce((acc, t) => acc + (t.status === 'succeeded' ? t.amount : 0), 0);
  }, [paymentTransactions]);

  const paidCount = React.useMemo(() => {
    return paymentTransactions.filter(t => t.status === 'succeeded').length;
  }, [paymentTransactions]);

  const pendingCount = React.useMemo(() => {
    return paymentTransactions.filter(t => t.status === 'pending').length;
  }, [paymentTransactions]);

  const failedCount = React.useMemo(() => {
    return paymentTransactions.filter(t => t.status === 'failed').length;
  }, [paymentTransactions]);

  const uniqueOrgsCount = React.useMemo(() => {
    return new Set(paymentTransactions.map(t => t.tenantId)).size;
  }, [paymentTransactions]);

  // Count transactions per organization for quick filter pills
  const orgCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    paymentTransactions.forEach(t => {
      map[t.tenantId] = (map[t.tenantId] || 0) + 1;
    });
    return map;
  }, [paymentTransactions]);

  // Plan Customization Editor State
  const [editingPlan, setEditingPlan] = useState<SaaSPricingPlan | null>(null);
  const [planForm, setPlanForm] = useState<SaaSPricingPlan | null>(null);

  const handleOpenCheckout = (plan: SaaSPricingPlan, newOrgMode: boolean = false) => {
    setSelectedPlanForCheckout(plan);
    setIsNewOrgCheckout(newOrgMode);
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = async (transaction: PaymentTransaction, provisionedOrg?: Organization) => {
    // 1. Add transaction to ledger
    addPaymentTransaction(transaction);

    // 2. If newly provisioned org, create and switch
    if (provisionedOrg) {
      createOrganization({
        ...provisionedOrg,
        plan: transaction.planId as Organization['plan']
      });
      toast.success(`Organization "${provisionedOrg.name}" created and activated with ${transaction.planName}`);
    } else {
      // 3. Otherwise upgrade the target organization
      await upgradeOrganizationSubscription(transaction.tenantId, transaction.planId, transaction.billingCycle, transaction);
    }
  };

  const handleOpenPlanEditor = (plan: SaaSPricingPlan) => {
    setEditingPlan(plan);
    setPlanForm({ ...plan, features: { ...plan.features } });
  };

  const handleSavePlanEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm) return;

    updatePricingPlan(planForm.id, planForm);
    toast.success(`SaaS plan "${planForm.name}" updated successfully`);
    setEditingPlan(null);
  };

  const handleClearFilters = () => {
    setHistorySearchQuery('');
    setHistoryOrgFilter('ALL');
    setHistoryStatusFilter('ALL');
    setHistorySortBy('newest');
  };

  // Export Billing History to CSV
  const handleExportCSV = () => {
    if (sortedTransactions.length === 0) {
      toast.error('No transactions available to export');
      return;
    }
    const headers = [
      'Invoice Number',
      'Date (ISO)',
      'Organization Name',
      'Tenant ID',
      'Plan Name',
      'Billing Cycle',
      'Amount (INR)',
      'Payment Status',
      'Card Brand',
      'Card Last 4',
      'Stripe Payment Intent ID',
      'Customer Email'
    ];
    const rows = sortedTransactions.map(t => [
      `"${t.invoiceNumber}"`,
      `"${new Date(t.createdAt).toISOString()}"`,
      `"${t.organizationName.replace(/"/g, '""')}"`,
      `"${t.tenantId}"`,
      `"${t.planName.replace(/"/g, '""')}"`,
      `"${t.billingCycle}"`,
      t.amount,
      `"${t.status}"`,
      `"${t.paymentMethod.brand}"`,
      `"${t.paymentMethod.last4}"`,
      `"${t.stripePaymentIntentId}"`,
      `"${t.customerEmail}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ddb_saas_billing_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${sortedTransactions.length} invoices to CSV file`);
  };

  // Download Individual Invoice PDF
  const handleDownloadPDF = (txn: PaymentTransaction) => {
    try {
      const org = organizations.find(o => o.id === txn.tenantId) || activeOrganization;
      const filename = downloadInvoicePDF(txn, org);
      toast.success(`Downloaded "${filename}" successfully!`);
    } catch (err: any) {
      console.error('Failed to generate PDF:', err);
      toast.error('Failed to generate invoice PDF. Please try again.');
    }
  };

  const isFiltered = historySearchQuery !== '' || historyOrgFilter !== 'ALL' || historyStatusFilter !== 'ALL';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <CreditCard size={16} weight="duotone" />
            <span>SaaS Monetization &amp; Stripe Billing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight">
            Subscription &amp; Pricing Management
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Configure pharmaceutical SaaS tier pricing, representative quotas, feature entitlements, and view past invoices and payment status for each organization.
          </p>
        </div>

        {/* Global Quick Actions */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={resetPricingPlansToDefault}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset SaaS pricing tiers and quotas to defaults"
          >
            <ArrowClockwise size={14} />
            <span>Reset Plans</span>
          </button>

          <button
            type="button"
            onClick={resetPaymentTransactionsToDefault}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset sample invoices for all organizations"
          >
            <Receipt size={14} />
            <span>Reset Sample Invoices</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCheckout(pricingPlans[1] || pricingPlans[0], true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} weight="bold" />
            <span>+ Onboard Org via Stripe</span>
          </button>
        </div>
      </div>

      {/* PRIMARY TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`pb-3.5 px-4 text-sm font-heading font-bold border-b-2 flex items-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard size={18} weight={activeTab === 'plans' ? 'fill' : 'regular'} />
          <span>Subscription Plans &amp; Pricing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('billing_history')}
          className={`pb-3.5 px-4 text-sm font-heading font-bold border-b-2 flex items-center gap-2.5 transition-all cursor-pointer relative ${
            activeTab === 'billing_history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt size={18} weight={activeTab === 'billing_history' ? 'fill' : 'regular'} />
          <span>Billing History &amp; Invoices</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
              activeTab === 'billing_history'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {paymentTransactions.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SUBSCRIPTION PLANS & PRICING                                      */}
      {/* ========================================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-8 animate-in fade-in-50 duration-200">
          {/* ACTIVE ORGANIZATION SUBSCRIPTION STATUS BANNER */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-heading font-bold text-xl shadow-xs">
                  <Buildings size={24} weight="duotone" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-black text-lg text-white">{activeOrganization.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {activeOrganization.plan} Plan
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300">
                      Status: {activeOrganization.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Tenant Partition: <code className="font-mono text-white/90 bg-white/10 px-1 py-0.5 rounded">{activeOrganization.id}</code> &bull; Next billing cycle on file via Stripe
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('billing_history')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Receipt size={15} />
                  <span>View Invoices ({orgCounts[activeOrganization.id] || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCheckout(pricingPlans.find(p => p.id === 'enterprise') || pricingPlans[0])}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#635BFF] hover:bg-[#534be0] text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard size={15} weight="bold" />
                  <span>Change Plan / Pay with Stripe</span>
                </button>
              </div>
            </div>

            {/* Quota Utilization Progress Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users size={14} className="text-blue-400" />
                    Sales Reps Allowance
                  </span>
                  <span className="font-bold text-white font-mono">
                    {reps.length} / {activeOrganization.maxReps} Reps
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (reps.length / (activeOrganization.maxReps || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Pill size={14} className="text-indigo-400" />
                    Product Catalog Limit
                  </span>
                  <span className="font-bold text-white font-mono">
                    {products.length} / {activeOrganization.maxProducts} SKUs
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (products.length / (activeOrganization.maxProducts || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    GPS Verification Engine
                  </span>
                  <span className="font-bold text-emerald-400">Strict 50m Geo-Fence</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* BILLING CYCLE SELECTOR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-heading font-black text-slate-900">SaaS Subscription Plans &amp; Tiers</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click &quot;Edit Limits&quot; to adjust pricing, reps allowance, or feature entitlements for any plan.
              </p>
            </div>

            {/* Toggle Monthly / Annual */}
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* PRICING CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map(plan => {
              const isCurrent = activeOrganization.plan === plan.id;
              const displayPrice = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
              const perMonthEquiv = billingCycle === 'annual' ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden relative ${
                    plan.popularBadge
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-white'
                      : isCurrent
                      ? 'border-indigo-300 bg-white shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {plan.popularBadge && (
                    <div className="bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider text-center py-1">
                      Most Popular for Commercial Field Teams
                    </div>
                  )}

                  <div className="p-6 space-y-5">
                    {/* Plan Header */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-heading font-black text-xl text-slate-900">{plan.name}</h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active on Tenant
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                        {plan.tagline}
                      </p>
                    </div>

                    {/* Price Display */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-heading font-black text-slate-900">
                          {plan.currency}{displayPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500">
                          / {billingCycle === 'annual' ? 'year' : 'month'}
                        </span>
                      </div>
                      {billingCycle === 'annual' && (
                        <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                          Equivalent to {plan.currency}{perMonthEquiv.toLocaleString('en-IN')}/mo (billed annually)
                        </span>
                      )}
                    </div>

                    {/* Core Capacity Limits */}
                    <div className="space-y-2 py-1 text-xs">
                      <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">
                        Capacity Quotas
                      </span>
                      <div className="flex items-center justify-between text-slate-700">
                        <span>Medical Representatives:</span>
                        <strong className="text-slate-900 font-mono">{plan.maxReps} Reps</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span>Product Catalog Formulations:</span>
                        <strong className="text-slate-900 font-mono">{plan.maxProducts} SKUs</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span>Target Doctor Directory:</span>
                        <strong className="text-slate-900 font-mono">{plan.maxDoctors.toLocaleString('en-IN')} Doctors</strong>
                      </div>
                    </div>

                    {/* Feature Entitlements */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                      <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">
                        Feature Inclusions
                      </span>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Check size={14} weight="bold" className="text-emerald-600 shrink-0" />
                          <span>GPS 50m Geo-Fence Clinic Verification</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {plan.features.directChemistBilling ? (
                            <Check size={14} weight="bold" className="text-emerald-600 shrink-0" />
                          ) : (
                            <X size={14} weight="bold" className="text-slate-300 shrink-0" />
                          )}
                          <span className={plan.features.directChemistBilling ? 'text-slate-800' : 'text-slate-400'}>
                            Direct Chemist &amp; Store Invoicing
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {plan.features.sampleAuditing ? (
                            <Check size={14} weight="bold" className="text-emerald-600 shrink-0" />
                          ) : (
                            <X size={14} weight="bold" className="text-slate-300 shrink-0" />
                          )}
                          <span className={plan.features.sampleAuditing ? 'text-slate-800' : 'text-slate-400'}>
                            Doctor Sample Stock &amp; Batch Audit
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {plan.features.whiteLabelReporting ? (
                            <Check size={14} weight="bold" className="text-emerald-600 shrink-0" />
                          ) : (
                            <X size={14} weight="bold" className="text-slate-300 shrink-0" />
                          )}
                          <span className={plan.features.whiteLabelReporting ? 'text-slate-800' : 'text-slate-400'}>
                            White-Label Dynamic Brand Reporting
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {plan.features.multiTerritoryTracking ? (
                            <Check size={14} weight="bold" className="text-emerald-600 shrink-0" />
                          ) : (
                            <X size={14} weight="bold" className="text-slate-300 shrink-0" />
                          )}
                          <span className={plan.features.multiTerritoryTracking ? 'text-slate-800' : 'text-slate-400'}>
                            Multi-Territory Live Route Telemetry
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {plan.features.apiErpIntegration ? (
                            <Check size={14} weight="bold" className="text-emerald-600 shrink-0" />
                          ) : (
                            <X size={14} weight="bold" className="text-slate-300 shrink-0" />
                          )}
                          <span className={plan.features.apiErpIntegration ? 'text-slate-800' : 'text-slate-400'}>
                            Custom ERP &amp; API Integration
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-6 pt-0 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(plan, false)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        plan.popularBadge
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : isCurrent
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                      }`}
                    >
                      <CreditCard size={15} weight="bold" />
                      <span>{isCurrent ? 'Renew via Stripe' : 'Pay & Upgrade via Stripe'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenPlanEditor(plan)}
                      className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PencilSimple size={13} />
                      <span>Edit Plan Limits &amp; Pricing</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick link banner to Billing History */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Receipt size={22} weight="duotone" />
              </div>
              <div>
                <h4 className="font-heading font-black text-sm text-slate-900">
                  Looking for past invoices, receipts, and payment statuses?
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  View complete Stripe billing records, GST breakdowns (SAC 998313), and invoice statuses for each organization in your platform.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('billing_history')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-center cursor-pointer"
            >
              <span>View Billing History &amp; Invoices</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BILLING HISTORY & INVOICES                                        */}
      {/* ========================================================================= */}
      {activeTab === 'billing_history' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* SECTION HEADER & SUMMARY KPIS */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-heading font-black text-slate-900 flex items-center gap-2">
                  <Receipt size={22} weight="bold" className="text-blue-600" />
                  <span>Billing History &amp; Invoices</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comprehensive audit trail of past SaaS subscription invoices, payment statuses, and tax receipts across all client organizations.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Download all filtered invoices as CSV"
                >
                  <DownloadSimple size={14} weight="bold" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCheckout(pricingPlans[1] || pricingPlans[0], false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} weight="bold" />
                  <span>+ Process Payment</span>
                </button>
              </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total SaaS Revenue
                </span>
                <div className="text-2xl font-heading font-black text-slate-900">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <CheckCircle size={13} weight="fill" />
                  <span>Gross Volume via Stripe</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Paid Invoices
                </span>
                <div className="text-2xl font-heading font-black text-emerald-600">
                  {paidCount} <span className="text-xs text-slate-400 font-normal">/ {paymentTransactions.length}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {paymentTransactions.length > 0
                    ? `${Math.round((paidCount / paymentTransactions.length) * 100)}% Success Rate`
                    : 'No invoices yet'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Organizations Billed
                </span>
                <div className="text-2xl font-heading font-black text-indigo-600">
                  {uniqueOrgsCount} <span className="text-xs text-slate-400 font-normal">/ {organizations.length}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Active multi-tenant partitions
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Stripe Gateway
                </span>
                <div className="flex items-center gap-1.5 text-lg font-heading font-black text-slate-900 pt-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live &bull; Connected</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  PCI-DSS Level 1 &bull; 18% GST (SAC 998313)
                </div>
              </div>
            </div>
          </div>

          {/* QUICK ORGANIZATION FILTER CHIPS */}
          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Buildings size={14} className="text-blue-600" />
                Filter by Organization:
              </span>
              {historyOrgFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setHistoryOrgFilter('ALL')}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Show All Organizations
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setHistoryOrgFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  historyOrgFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>All Organizations</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  historyOrgFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {paymentTransactions.length}
                </span>
              </button>

              {organizations.map(org => {
                const count = orgCounts[org.id] || 0;
                const isSelected = historyOrgFilter === org.id;

                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setHistoryOrgFilter(org.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{org.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS TOOLBAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by invoice number, organization, customer email, or Stripe ID..."
                value={historySearchQuery}
                onChange={e => setHistorySearchQuery(e.target.value)}
                className="w-full text-xs font-medium pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {historySearchQuery && (
                <button
                  type="button"
                  onClick={() => setHistorySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Dropdowns */}
            <div className="flex items-center flex-wrap gap-2.5 text-xs">
              {/* Org Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] font-semibold">Org:</span>
                <select
                  value={historyOrgFilter}
                  onChange={e => setHistoryOrgFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="ALL">All Organizations</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({orgCounts[org.id] || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] font-semibold">Status:</span>
                <select
                  value={historyStatusFilter}
                  onChange={e => setHistoryStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="succeeded">Succeeded ({paidCount})</option>
                  <option value="pending">Pending ({pendingCount})</option>
                  <option value="failed">Failed ({failedCount})</option>
                </select>
              </div>

              {/* Sort By Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] font-semibold">Sort:</span>
                <select
                  value={historySortBy}
                  onChange={e => setHistorySortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="newest">Newest Date</option>
                  <option value="oldest">Oldest Date</option>
                  <option value="highest_amount">Highest Amount</option>
                  <option value="lowest_amount">Lowest Amount</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* INVOICES & PAYMENT STATUS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-sm text-slate-900">
                  Past Invoices &amp; Payment Ledger
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                  {sortedTransactions.length} of {paymentTransactions.length} displayed
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Click any row or invoice number to view and print the formal tax invoice.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Organization &amp; Tenant</th>
                    <th className="py-3 px-4">Plan &amp; Cycle</th>
                    <th className="py-3 px-4">Amount (INR)</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sortedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                            <Receipt size={24} />
                          </div>
                          <div>
                            <h4 className="font-heading font-bold text-sm text-slate-700">No Invoices Match Criteria</h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {isFiltered
                                ? 'Try changing your search term, organization filter, or status selection.'
                                : 'No payment records exist. Use "+ Process Payment" to create an invoice.'}
                            </p>
                          </div>
                          {isFiltered && (
                            <button
                              type="button"
                              onClick={handleClearFilters}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
                            >
                              Reset All Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedTransactions.map(txn => {
                      const matchedOrg = organizations.find(o => o.id === txn.tenantId);
                      const baseAmount = Math.round(txn.amount / 1.18);
                      const gstAmount = txn.amount - baseAmount;

                      return (
                        <tr
                          key={txn.id}
                          onClick={() => setSelectedInvoiceModalTxn(txn)}
                          className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                        >
                          {/* Invoice # */}
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 group-hover:text-blue-800">
                            <div className="flex items-center gap-1.5">
                              <Receipt size={14} className="text-slate-400 group-hover:text-blue-600" />
                              <span>{txn.invoiceNumber}</span>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            <div className="font-semibold text-slate-800">
                              {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          {/* Organization & Tenant */}
                          <td className="py-3.5 px-4">
                            <div className="font-heading font-bold text-slate-900 flex items-center gap-1.5">
                              <Buildings size={14} className="text-slate-400" />
                              <span>{txn.organizationName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <code className="text-[10px] font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-600">
                                {txn.tenantId}
                              </code>
                              <span className="text-[10px] text-slate-400">&bull;</span>
                              <span className="text-[10px] text-slate-500 truncate max-w-[140px]" title={txn.customerEmail}>
                                {txn.customerEmail}
                              </span>
                            </div>
                          </td>

                          {/* Plan & Cycle */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 block">{txn.planName}</span>
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                              {txn.billingCycle}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-900 text-sm">
                              {txn.currency === 'INR' ? '₹' : '$'}{txn.amount.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              Base: ₹{baseAmount.toLocaleString('en-IN')} + 18% GST
                            </span>
                          </td>

                          {/* Card Used */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-mono text-slate-800 uppercase font-semibold">
                              <CreditCard size={14} className="text-slate-400" />
                              <span>{txn.paymentMethod.brand} •••• {txn.paymentMethod.last4}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[120px]" title={txn.stripePaymentIntentId}>
                              {txn.stripePaymentIntentId}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {txn.status === 'succeeded' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle size={13} weight="fill" className="text-emerald-600" />
                                <span>Paid</span>
                              </span>
                            ) : txn.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                <Clock size={13} weight="bold" className="text-amber-600" />
                                <span>Pending</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                <XCircle size={13} weight="fill" className="text-rose-600" />
                                <span>Failed</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceModalTxn(txn)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="View detailed printable tax invoice"
                              >
                                <Eye size={13} weight="bold" />
                                <span>Invoice</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownloadPDF(txn)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Download formal invoice as a PDF file"
                              >
                                <DownloadSimple size={13} weight="bold" className="text-emerald-700" />
                                <span>PDF</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: INVOICE DETAIL MODAL                                              */}
      {/* ========================================================================= */}
      {selectedInvoiceModalTxn && (
        <InvoiceDetailModal
          isOpen={!!selectedInvoiceModalTxn}
          onClose={() => setSelectedInvoiceModalTxn(null)}
          transaction={selectedInvoiceModalTxn}
          organization={
            organizations.find(o => o.id === selectedInvoiceModalTxn.tenantId) || activeOrganization
          }
        />
      )}

      {/* PLAN CUSTOMIZATION EDITOR MODAL */}
      {editingPlan && planForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setEditingPlan(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-white">
                  Edit Plan: {editingPlan.name}
                </h3>
                <p className="text-xs text-slate-300">
                  Configure subscription price points, quota ceilings, and feature flags
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlanEdits} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Monthly Price ({planForm.currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={planForm.monthlyPrice}
                    onChange={e => setPlanForm({ ...planForm, monthlyPrice: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Annual Price ({planForm.currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={planForm.annualPrice}
                    onChange={e => setPlanForm({ ...planForm, annualPrice: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Max Reps
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={planForm.maxReps}
                    onChange={e => setPlanForm({ ...planForm, maxReps: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Max Products
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={planForm.maxProducts}
                    onChange={e => setPlanForm({ ...planForm, maxProducts: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Max Doctors
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={planForm.maxDoctors}
                    onChange={e => setPlanForm({ ...planForm, maxDoctors: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              {/* Feature Flags */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                  Feature Entitlements
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.features.directChemistBilling}
                      onChange={e =>
                        setPlanForm({
                          ...planForm,
                          features: { ...planForm.features, directChemistBilling: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Direct Chemist Billing</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.features.whiteLabelReporting}
                      onChange={e =>
                        setPlanForm({
                          ...planForm,
                          features: { ...planForm.features, whiteLabelReporting: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>White-Label Branding</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.features.multiTerritoryTracking}
                      onChange={e =>
                        setPlanForm({
                          ...planForm,
                          features: { ...planForm.features, multiTerritoryTracking: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Multi-Territory Tracking</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.features.apiErpIntegration}
                      onChange={e =>
                        setPlanForm({
                          ...planForm,
                          features: { ...planForm.features, apiErpIntegration: e.target.checked }
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>Custom ERP Integration</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Plan Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STRIPE SECURE CHECKOUT MODAL */}
      {selectedPlanForCheckout && (
        <StripeCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          selectedPlan={selectedPlanForCheckout}
          billingCycle={billingCycle}
          activeOrg={activeOrganization}
          allOrgs={organizations}
          isNewOrgMode={isNewOrgCheckout}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
