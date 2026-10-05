import { SaaSPricingPlan, PaymentTransaction } from '../types';

export const DEFAULT_PRICING_PLANS: SaaSPricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter Tier',
    tagline: 'Ideal for regional pharma manufacturers and emerging distributor teams.',
    monthlyPrice: 2999,
    annualPrice: 28790, // ~20% discount
    currency: '₹',
    currencyCode: 'INR',
    popularBadge: false,
    maxReps: 8,
    maxProducts: 100,
    maxDoctors: 500,
    features: {
      fieldTelemetry: true,
      directChemistBilling: false,
      sampleAuditing: true,
      whiteLabelReporting: false,
      multiTerritoryTracking: false,
      customLetterheadInvoices: false,
      apiErpIntegration: false,
      prioritySupport: false
    },
    stripePriceIdMonthly: 'price_starter_monthly_inr',
    stripePriceIdAnnual: 'price_starter_annual_inr',
    recommendedFor: '1-8 Medical Reps, Regional distribution'
  },
  {
    id: 'professional',
    name: 'Professional Growth',
    tagline: 'Complete pharma field force automation with direct chemist billing.',
    monthlyPrice: 7499,
    annualPrice: 71990, // ~20% discount
    currency: '₹',
    currencyCode: 'INR',
    popularBadge: true,
    maxReps: 20,
    maxProducts: 350,
    maxDoctors: 2000,
    features: {
      fieldTelemetry: true,
      directChemistBilling: true,
      sampleAuditing: true,
      whiteLabelReporting: true,
      multiTerritoryTracking: true,
      customLetterheadInvoices: true,
      apiErpIntegration: false,
      prioritySupport: true
    },
    stripePriceIdMonthly: 'price_pro_monthly_inr',
    stripePriceIdAnnual: 'price_pro_annual_inr',
    recommendedFor: 'Growing commercial teams, Multi-state distribution'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Life Sciences',
    tagline: 'Unlimited scalability, multi-state territories, and custom compliance workflows.',
    monthlyPrice: 18999,
    annualPrice: 182390, // ~20% discount
    currency: '₹',
    currencyCode: 'INR',
    popularBadge: false,
    maxReps: 50,
    maxProducts: 1000,
    maxDoctors: 10000,
    features: {
      fieldTelemetry: true,
      directChemistBilling: true,
      sampleAuditing: true,
      whiteLabelReporting: true,
      multiTerritoryTracking: true,
      customLetterheadInvoices: true,
      apiErpIntegration: true,
      prioritySupport: true
    },
    stripePriceIdMonthly: 'price_enterprise_monthly_inr',
    stripePriceIdAnnual: 'price_enterprise_annual_inr',
    recommendedFor: 'National pharma enterprises, 20+ sales territories'
  }
];

export const INITIAL_PAYMENT_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: 'txn_1001_ddb_ent',
    tenantId: 'tenant-ddb-01',
    organizationName: 'DDB DRUG CHEM',
    amount: 182390,
    currency: 'INR',
    planId: 'enterprise',
    planName: 'Enterprise Life Sciences',
    billingCycle: 'annual',
    status: 'succeeded',
    stripePaymentIntentId: 'pi_3N9q8k2eZvKYlo2C1gH7eQ9m',
    stripeReceiptUrl: 'https://pay.stripe.com/receipts/acct_1032D92eZvKYlo2C/ch_3N9q8k2eZvKYlo2C1gH7eQ9m/rcpt_O2K3p09k8',
    paymentMethod: {
      brand: 'visa',
      last4: '4242',
      expMonth: 8,
      expYear: 2028
    },
    customerEmail: 'adityabansal0810@gmail.com',
    invoiceNumber: 'INV-STRIPE-2026-001',
    createdAt: '2026-09-15T10:30:00Z'
  },
  {
    id: 'txn_1002_apex_pro',
    tenantId: 'tenant-apex-02',
    organizationName: 'Apex Life Sciences',
    amount: 7499,
    currency: 'INR',
    planId: 'professional',
    planName: 'Professional Growth',
    billingCycle: 'monthly',
    status: 'succeeded',
    stripePaymentIntentId: 'pi_3N8x7j1bXvJYlm1B0fG6dP8l',
    stripeReceiptUrl: 'https://pay.stripe.com/receipts/acct_1032D92eZvKYlo2C/ch_3N8x7j1bXvJYlm1B0fG6dP8l/rcpt_N1J2o98j7',
    paymentMethod: {
      brand: 'mastercard',
      last4: '5555',
      expMonth: 12,
      expYear: 2027
    },
    customerEmail: 'operations@apexlife.io',
    invoiceNumber: 'INV-STRIPE-2026-002',
    createdAt: '2026-10-01T09:15:00Z'
  },
  {
    id: 'txn_1003_zenith_sta',
    tenantId: 'tenant-zenith-03',
    organizationName: 'Zenith Healthcare Labs',
    amount: 28790,
    currency: 'INR',
    planId: 'starter',
    planName: 'Starter Tier',
    billingCycle: 'annual',
    status: 'succeeded',
    stripePaymentIntentId: 'pi_3N7w6i0aWuIXkl0A9eF5cO7k',
    stripeReceiptUrl: 'https://pay.stripe.com/receipts/acct_1032D92eZvKYlo2C/ch_3N7w6i0aWuIXkl0A9eF5cO7k/rcpt_M0I1n87i6',
    paymentMethod: {
      brand: 'visa',
      last4: '1881',
      expMonth: 5,
      expYear: 2029
    },
    customerEmail: 'contact@zenithlabs.in',
    invoiceNumber: 'INV-STRIPE-2026-003',
    createdAt: '2026-08-20T14:45:00Z'
  },
  {
    id: 'txn_1004_ddb_prev',
    tenantId: 'tenant-ddb-01',
    organizationName: 'DDB DRUG CHEM',
    amount: 7499,
    currency: 'INR',
    planId: 'professional',
    planName: 'Professional Growth',
    billingCycle: 'monthly',
    status: 'succeeded',
    stripePaymentIntentId: 'pi_3N6v5h9zVtHWjk9Z8dE4bN6j',
    stripeReceiptUrl: 'https://pay.stripe.com/receipts/acct_1032D92eZvKYlo2C/ch_3N6v5h9zVtHWjk9Z8dE4bN6j/rcpt_L9H0m76h5',
    paymentMethod: {
      brand: 'visa',
      last4: '4242',
      expMonth: 8,
      expYear: 2028
    },
    customerEmail: 'adityabansal0810@gmail.com',
    invoiceNumber: 'INV-STRIPE-2026-004',
    createdAt: '2026-08-15T11:00:00Z'
  },
  {
    id: 'txn_1005_apex_ren',
    tenantId: 'tenant-apex-02',
    organizationName: 'Apex Life Sciences',
    amount: 7499,
    currency: 'INR',
    planId: 'professional',
    planName: 'Professional Growth',
    billingCycle: 'monthly',
    status: 'succeeded',
    stripePaymentIntentId: 'pi_3N5u4g8yUsGVij8Y7cD3aM5i',
    stripeReceiptUrl: 'https://pay.stripe.com/receipts/acct_1032D92eZvKYlo2C/ch_3N5u4g8yUsGVij8Y7cD3aM5i/rcpt_K8G9l65g4',
    paymentMethod: {
      brand: 'mastercard',
      last4: '5555',
      expMonth: 12,
      expYear: 2027
    },
    customerEmail: 'operations@apexlife.io',
    invoiceNumber: 'INV-STRIPE-2026-005',
    createdAt: '2026-09-01T10:00:00Z'
  },
  {
    id: 'txn_1006_zenith_ren',
    tenantId: 'tenant-zenith-03',
    organizationName: 'Zenith Healthcare Labs',
    amount: 2999,
    currency: 'INR',
    planId: 'starter',
    planName: 'Starter Tier',
    billingCycle: 'monthly',
    status: 'pending',
    stripePaymentIntentId: 'pi_3N4t3f7xTrFThi7X6bC2zL4h',
    stripeReceiptUrl: '',
    paymentMethod: {
      brand: 'visa',
      last4: '1881',
      expMonth: 5,
      expYear: 2029
    },
    customerEmail: 'contact@zenithlabs.in',
    invoiceNumber: 'INV-STRIPE-2026-006',
    createdAt: '2026-10-04T16:20:00Z'
  }
];

export const STRIPE_TEST_CARDS = [
  { label: 'Visa (Success)', number: '4242 •••• •••• 4242', raw: '4242424242424242', brand: 'visa' },
  { label: 'Mastercard (Success)', number: '5555 •••• •••• 4444', raw: '5555555555554444', brand: 'mastercard' },
  { label: 'Amex (Success)', number: '3782 •••••• ••••5', raw: '378282246310005', brand: 'amex' }
];

export function detectCardBrand(cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'generic' {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  return 'generic';
}

export function formatCardNumber(value: string): string {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(' ');
  } else {
    return value;
  }
}

export function formatExpiry(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length >= 2) {
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
  }
  return clean;
}
