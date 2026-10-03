import { Product, ProductBatch } from '../types';
import { parseExpiryDate } from './expiryHelper';

export interface BatchAllocation {
  batchNumber: string;
  expiryDate: string;
  stockBefore: number;
  allocatedQty: number;
  stockAfter: number;
  expiryTimestamp: number;
  isExpiringSoon: boolean;
}

export interface ProductFifoPlan {
  productId: string;
  productName: string;
  quantityNeeded: number;
  totalBatchStock: number;
  allocations: BatchAllocation[];
  isFullyCovered: boolean;
  unfulfilledQty: number;
  earliestBatchNumber?: string;
  earliestBatchExpiry?: string;
}

/**
 * Calculates a FIFO / FEFO allocation plan for a product given a requested quantity.
 * Batches are sorted ascending by expiry date (earliest expiring batches allocated first).
 */
export function calculateFifoPlan(product: Product, quantityNeeded: number): ProductFifoPlan {
  const batches = Array.isArray(product.batches) && product.batches.length > 0
    ? [...product.batches]
    : [
        {
          batchNumber: product.batchNo || 'STD-BATCH-01',
          expiryDate: product.expiryDate || '12/2027',
          stock: product.stockUnits ?? 0
        }
      ];

  // Parse and sort batches by expiry date
  const parsedBatches = batches.map(b => {
    const d = parseExpiryDate(b.expiryDate);
    return {
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate,
      stock: Number(b.stock) || 0,
      expiryTimestamp: d ? d.getTime() : Number.MAX_SAFE_INTEGER
    };
  });

  // Sort earliest expiry first
  parsedBatches.sort((a, b) => a.expiryTimestamp - b.expiryTimestamp);

  let remainingNeeded = quantityNeeded;
  const allocations: BatchAllocation[] = [];
  const now = new Date().getTime();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  for (const b of parsedBatches) {
    if (remainingNeeded <= 0) break;
    if (b.stock <= 0) continue;

    const qtyToTake = Math.min(b.stock, remainingNeeded);
    const isExpiringSoon = b.expiryTimestamp - now <= ninetyDaysMs;

    allocations.push({
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate,
      stockBefore: b.stock,
      allocatedQty: qtyToTake,
      stockAfter: b.stock - qtyToTake,
      expiryTimestamp: b.expiryTimestamp,
      isExpiringSoon
    });

    remainingNeeded -= qtyToTake;
  }

  const totalBatchStock = batches.reduce((sum, b) => sum + (Number(b.stock) || 0), 0);

  return {
    productId: product.id,
    productName: product.name,
    quantityNeeded,
    totalBatchStock,
    allocations,
    isFullyCovered: remainingNeeded === 0,
    unfulfilledQty: Math.max(0, remainingNeeded),
    earliestBatchNumber: allocations[0]?.batchNumber || parsedBatches[0]?.batchNumber,
    earliestBatchExpiry: allocations[0]?.expiryDate || parsedBatches[0]?.expiryDate
  };
}

/**
 * Applies FIFO deduction to product batches and updates overall stock.
 * Deducts starting from earliest expiring batch.
 */
export function applyFifoDeduction(product: Product, quantityNeeded: number): Product {
  const plan = calculateFifoPlan(product, quantityNeeded);

  // Map of batchNumber -> stockAfter
  const allocatedMap = new Map<string, number>();
  plan.allocations.forEach(a => {
    allocatedMap.set(a.batchNumber, a.stockAfter);
  });

  let updatedBatches: ProductBatch[];

  if (Array.isArray(product.batches) && product.batches.length > 0) {
    updatedBatches = product.batches.map(b => {
      if (allocatedMap.has(b.batchNumber)) {
        return {
          ...b,
          stock: allocatedMap.get(b.batchNumber)!
        };
      }
      return b;
    });
  } else {
    // If no batch list existed, create one updated batch
    const singleStock = Math.max(0, (product.stockUnits ?? 0) - quantityNeeded);
    updatedBatches = [
      {
        batchNumber: product.batchNo || 'STD-BATCH-01',
        expiryDate: product.expiryDate || '12/2027',
        stock: singleStock
      }
    ];
  }

  const newTotalStock = Math.max(0, (product.stockUnits ?? 0) - quantityNeeded);
  const reorderThreshold = product.reorderLevel ?? 500;
  const newStatus =
    newTotalStock === 0
      ? 'out_of_stock'
      : newTotalStock <= reorderThreshold
      ? 'low_stock'
      : 'active';

  return {
    ...product,
    stockUnits: newTotalStock,
    status: newStatus as any,
    batches: updatedBatches
  };
}
