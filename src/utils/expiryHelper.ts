import { Product, ProductBatch } from '../types';

export type ExpiryUrgency = 'expired' | 'critical' | 'near_term' | 'approaching' | 'safe';

export interface BatchExpiryInfo {
  batchNumber: string;
  expiryDateStr: string;
  expiryDate: Date | null;
  daysRemaining: number;
  monthsRemaining: number;
  urgency: ExpiryUrgency;
  stock: number;
  productName: string;
  productId: string;
  packaging?: string;
  category?: string;
  sellingRate?: number;
  mrp?: number;
}

export interface ProductExpirySummary {
  product: Product;
  earliestBatch: BatchExpiryInfo | null;
  batches: BatchExpiryInfo[];
  hasExpiredBatches: boolean;
  hasNearTermBatches: boolean;
  highestUrgency: ExpiryUrgency;
  atRiskStockUnits: number;
  atRiskEstimatedValue: number;
}

export interface CatalogExpiryMetrics {
  totalBatchesTracked: number;
  expiredBatchesCount: number;
  criticalBatchesCount: number; // <= 30 days
  nearTermBatchesCount: number; // 31-90 days
  approachingBatchesCount: number; // 91-180 days
  totalNearTermOrExpiredBatches: number; // <= 90 days or expired
  totalAtRiskUnits: number;
  totalAtRiskValue: number;
  productsWithNearTermExpiry: Product[];
}

/**
 * Parses diverse expiry date formats:
 * - "MM/YYYY" e.g. "11/2026", "10/2026"
 * - "YYYY-MM" or "YYYY-MM-DD"
 * - "MM-YYYY" or "M/YYYY"
 * - "MM/YY"
 */
export function parseExpiryDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();
  if (!clean || clean === '-' || clean.toLowerCase() === 'n/a') return null;

  // Format: MM/YYYY or M/YYYY or MM-YYYY
  const slashMatch = clean.match(/^(\d{1,2})[\/\-](\d{2,4})$/);
  if (slashMatch) {
    let month = parseInt(slashMatch[1], 10);
    let year = parseInt(slashMatch[2], 10);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12) {
      // Expiry is typically the last day of the stated month at 23:59:59
      return new Date(year, month, 0, 23, 59, 59);
    }
  }

  // Format: YYYY-MM or YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[\/\-](\d{1,2})(?:[\/\-](\d{1,2}))?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = isoMatch[3] ? parseInt(isoMatch[3], 10) : undefined;
    if (month >= 1 && month <= 12) {
      if (day) {
        return new Date(year, month - 1, day, 23, 59, 59);
      }
      return new Date(year, month, 0, 23, 59, 59);
    }
  }

  // Fallback direct Date parse
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

/**
 * Calculates days remaining from a reference date (defaults to current date).
 */
export function calculateDaysRemaining(expiry: Date, referenceDate: Date = new Date()): number {
  const diffTime = expiry.getTime() - referenceDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Classifies the urgency of expiration based on remaining days.
 */
export function classifyExpiryUrgency(daysRemaining: number): ExpiryUrgency {
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 30) return 'critical';
  if (daysRemaining <= 90) return 'near_term';
  if (daysRemaining <= 180) return 'approaching';
  return 'safe';
}

/**
 * Evaluates a single batch for expiry status.
 */
export function evaluateBatchExpiry(
  batch: ProductBatch,
  product: Product,
  referenceDate: Date = new Date()
): BatchExpiryInfo {
  const safeBatch = batch || { batchNumber: 'BATCH-01', expiryDate: '12/2027', stock: 0 };
  const safeProd: Product = product || { id: 'unknown', name: 'Unknown Formulation', genericName: '', packaging: '', form: 'Tablet', mrp: 0 };
  const expiryDate = parseExpiryDate(safeBatch.expiryDate || safeProd.expiryDate);
  const stock = typeof safeBatch.stock === 'number' ? safeBatch.stock : (safeProd.stockUnits ?? 0);
  const daysRemaining = expiryDate ? calculateDaysRemaining(expiryDate, referenceDate) : 9999;
  const monthsRemaining = Math.round(daysRemaining / 30.4);
  const urgency = expiryDate ? classifyExpiryUrgency(daysRemaining) : 'safe';

  return {
    batchNumber: safeBatch.batchNumber || safeProd.batchNo || 'BATCH-01',
    expiryDateStr: safeBatch.expiryDate || safeProd.expiryDate || 'N/A',
    expiryDate,
    daysRemaining: isNaN(daysRemaining) ? 9999 : daysRemaining,
    monthsRemaining: isNaN(monthsRemaining) ? 99 : monthsRemaining,
    urgency,
    stock: isNaN(stock) ? 0 : stock,
    productName: safeProd.name || 'Unknown Formulation',
    productId: safeProd.id || 'unknown',
    packaging: safeProd.packaging,
    category: safeProd.category,
    sellingRate: typeof safeProd.sellingRate === 'number' ? safeProd.sellingRate : undefined,
    mrp: typeof safeProd.mrp === 'number' ? safeProd.mrp : undefined
  };
}

/**
 * Evaluates all batches for a single product.
 */
export function evaluateProductExpiry(
  product: Product,
  referenceDate: Date = new Date()
): ProductExpirySummary {
  if (!product) {
    const dummyProduct: Product = { id: 'unknown', name: 'Unknown', genericName: '', packaging: '', form: 'Tablet', mrp: 0 };
    return {
      product: dummyProduct,
      earliestBatch: null,
      batches: [],
      hasExpiredBatches: false,
      hasNearTermBatches: false,
      highestUrgency: 'safe',
      atRiskStockUnits: 0,
      atRiskEstimatedValue: 0
    };
  }

  const rawBatchList = Array.isArray(product.batches) && product.batches.length > 0 ? product.batches : null;
  const batchList: ProductBatch[] = rawBatchList
    ? rawBatchList.filter(Boolean)
    : [
        {
          batchNumber: product.batchNo || 'BATCH-01',
          expiryDate: product.expiryDate || '12/2027',
          stock: product.stockUnits || 0
        }
      ];

  const batchInfos = batchList.map((b) => evaluateBatchExpiry(b, product, referenceDate));

  // Sort batches by earliest expiration
  batchInfos.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const earliestBatch = batchInfos[0] || null;

  const hasExpiredBatches = batchInfos.some((b) => b.urgency === 'expired');
  const hasNearTermBatches = batchInfos.some((b) => b.urgency === 'critical' || b.urgency === 'near_term');

  // Determine highest urgency
  let highestUrgency: ExpiryUrgency = 'safe';
  if (hasExpiredBatches) highestUrgency = 'expired';
  else if (batchInfos.some((b) => b.urgency === 'critical')) highestUrgency = 'critical';
  else if (batchInfos.some((b) => b.urgency === 'near_term')) highestUrgency = 'near_term';
  else if (batchInfos.some((b) => b.urgency === 'approaching')) highestUrgency = 'approaching';

  // Calculate at-risk units (batches expired or expiring within 90 days)
  const atRiskBatches = batchInfos.filter(
    (b) => b.urgency === 'expired' || b.urgency === 'critical' || b.urgency === 'near_term'
  );
  const atRiskStockUnits = atRiskBatches.reduce((acc, b) => acc + (b.stock || 0), 0);
  const unitRate = Number(product.sellingRate) || Number(product.mrp) || 0;
  const atRiskEstimatedValue = atRiskStockUnits * (isNaN(unitRate) ? 0 : unitRate);

  return {
    product,
    earliestBatch,
    batches: batchInfos,
    hasExpiredBatches,
    hasNearTermBatches,
    highestUrgency,
    atRiskStockUnits,
    atRiskEstimatedValue: isNaN(atRiskEstimatedValue) ? 0 : atRiskEstimatedValue
  };
}

/**
 * Aggregates catalog-wide expiry metrics across all products and batches.
 */
export function aggregateCatalogExpiryMetrics(
  products: Product[],
  referenceDate: Date = new Date()
): CatalogExpiryMetrics {
  let totalBatchesTracked = 0;
  let expiredBatchesCount = 0;
  let criticalBatchesCount = 0;
  let nearTermBatchesCount = 0;
  let approachingBatchesCount = 0;
  let totalAtRiskUnits = 0;
  let totalAtRiskValue = 0;
  const nearTermProductsSet = new Set<string>();

  (products || []).forEach((p) => {
    if (!p) return;
    const summary = evaluateProductExpiry(p, referenceDate);
    (summary.batches || []).forEach((b) => {
      totalBatchesTracked++;
      const rate = Number(p.sellingRate) || Number(p.mrp) || 0;
      const safeRate = isNaN(rate) ? 0 : rate;
      const lineVal = (b.stock || 0) * safeRate;
      const safeLineVal = isNaN(lineVal) ? 0 : lineVal;
      if (b.urgency === 'expired') {
        expiredBatchesCount++;
        totalAtRiskUnits += b.stock || 0;
        totalAtRiskValue += safeLineVal;
        if (p.id) nearTermProductsSet.add(p.id);
      } else if (b.urgency === 'critical') {
        criticalBatchesCount++;
        totalAtRiskUnits += b.stock || 0;
        totalAtRiskValue += safeLineVal;
        if (p.id) nearTermProductsSet.add(p.id);
      } else if (b.urgency === 'near_term') {
        nearTermBatchesCount++;
        totalAtRiskUnits += b.stock || 0;
        totalAtRiskValue += safeLineVal;
        if (p.id) nearTermProductsSet.add(p.id);
      } else if (b.urgency === 'approaching') {
        approachingBatchesCount++;
      }
    });
  });

  const productsWithNearTermExpiry = (products || []).filter((p) => p && p.id && nearTermProductsSet.has(p.id));

  return {
    totalBatchesTracked,
    expiredBatchesCount,
    criticalBatchesCount,
    nearTermBatchesCount,
    approachingBatchesCount,
    totalNearTermOrExpiredBatches: expiredBatchesCount + criticalBatchesCount + nearTermBatchesCount,
    totalAtRiskUnits,
    totalAtRiskValue: isNaN(totalAtRiskValue) ? 0 : totalAtRiskValue,
    productsWithNearTermExpiry
  };
}
