import React, { useState } from 'react';
import { Product, ProductBatch } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Plus, Trash, CheckCircle, Tag, CalendarBlank, Package } from '@phosphor-icons/react';

interface BatchManagementModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BatchManagementModal: React.FC<BatchManagementModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const { updateProduct } = useApp();

  if (!isOpen || !product) return null;

  // Initial batches list
  const initialBatches: ProductBatch[] =
    product.batches && product.batches.length > 0
      ? [...product.batches]
      : [
          {
            batchNumber: product.batchNo || 'BATCH-01',
            expiryDate: product.expiryDate || '12/2027',
            stock: product.stockUnits || 0
          }
        ];

  const [batches, setBatches] = useState<ProductBatch[]>(initialBatches);
  const [newBatchNo, setNewBatchNo] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newStock, setNewStock] = useState<number>(500);

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchNo.trim()) return;

    const newBatch: ProductBatch = {
      id: `batch-${Date.now()}`,
      batchNumber: newBatchNo.trim().toUpperCase(),
      expiryDate: newExpiry.trim() || '12/2028',
      stock: Number(newStock) || 0
    };

    const updated = [...batches, newBatch];
    setBatches(updated);
    setNewBatchNo('');
    setNewExpiry('');
    setNewStock(500);
  };

  const handleDeleteBatch = (index: number) => {
    if (batches.length <= 1) {
      alert('A formulation must have at least one registered batch.');
      return;
    }
    const updated = batches.filter((_, i) => i !== index);
    setBatches(updated);
  };

  const handleSaveBatches = () => {
    const totalStock = batches.reduce((acc, b) => acc + (b.stock || 0), 0);
    const primaryBatch = batches[0];
    const batchSummaryStr = batches.map((b) => b.batchNumber).join(', ');

    const updatedProduct: Product = {
      ...product,
      batches: batches,
      batchNo: batchSummaryStr,
      expiryDate: primaryBatch.expiryDate,
      stockUnits: totalStock > 0 ? totalStock : product.stockUnits,
      status: totalStock === 0 ? 'out_of_stock' : totalStock < 500 ? 'low_stock' : 'active'
    };

    updateProduct(updatedProduct);
    onClose();
  };

  return (
    <div
      id="batch-management-modal-backdrop"
      data-testid="batch-management-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600">
              Multiple Batches & Expiry Control
            </span>
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              {product.name}
            </h3>
            <p className="text-xs text-slate-500">
              {product.genericName} &bull; {product.packaging}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Current Batches List */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Registered Batches ({batches.length})
          </label>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {batches.map((b, idx) => (
              <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold flex items-center justify-center text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <span className="font-mono font-bold text-slate-900 block">
                      {b.batchNumber}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <CalendarBlank size={12} className="text-slate-400" /> Exp: <strong>{b.expiryDate}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-xs font-semibold">
                    {b.stock ?? 0} Units
                  </span>
                  <button
                    onClick={() => handleDeleteBatch(idx)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Remove this batch"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Batch Sub-form */}
        <form onSubmit={handleAddBatch} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Add Another Batch
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                Batch No *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BATCH-02"
                value={newBatchNo}
                onChange={(e) => setNewBatchNo(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                Expiry (MM/YYYY) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 05/2028"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                Batch Units
              </label>
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs tabular-nums"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-1"
          >
            <Plus size={14} weight="bold" />
            <span>Add Batch to List</span>
          </button>
        </form>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveBatches}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <CheckCircle size={15} weight="bold" />
            <span>Save Batches</span>
          </button>
        </div>
      </div>
    </div>
  );
};
