import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShoppingCart,
  Plus,
  Trash,
  User,
  Buildings,
  Pill,
  CheckCircle,
  Clock,
  Package,
  Calendar,
  CurrencyInr,
  Sparkle
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OrderItemDraft {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  price: number;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose }) => {
  const { doctors, reps, products, addOrder } = useApp();

  // Form states
  const [orderType, setOrderType] = useState<'Order' | 'Sample'>('Order');
  const [initialStatus, setInitialStatus] = useState<'pending' | 'approved' | 'dispatched'>('pending');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [customDoctorName, setCustomDoctorName] = useState<string>('');
  const [customClinicName, setCustomClinicName] = useState<string>('');
  const [isManualCustomer, setIsManualCustomer] = useState<boolean>(false);
  const [selectedRepId, setSelectedRepId] = useState<string>('admin-direct');
  const [orderDate, setOrderDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [adminNotes, setAdminNotes] = useState<string>('');

  // Initial line items
  const [items, setItems] = useState<OrderItemDraft[]>(() => {
    const firstProd = products[0];
    return [
      {
        id: 'item-1',
        productId: firstProd ? firstProd.id : '',
        productName: firstProd ? firstProd.name : '',
        qty: 10,
        price: firstProd ? (firstProd.sellingRate || firstProd.pricingToRetailer || firstProd.mrp || 100) : 100
      }
    ];
  });

  // When a registered doctor is selected, update clinic name and check assigned rep
  const handleDoctorSelect = (docId: string) => {
    setSelectedDoctorId(docId);
    if (!docId) {
      setCustomDoctorName('');
      setCustomClinicName('');
      return;
    }
    const doc = doctors.find(d => d.id === docId);
    if (doc) {
      setCustomDoctorName(doc.name);
      setCustomClinicName(doc.clinicName || `${doc.name}'s Clinic`);
      // Auto-suggest assigned rep if available
      if (doc.assignedRepIds && doc.assignedRepIds.length > 0) {
        setSelectedRepId(doc.assignedRepIds[0]);
      }
    }
  };

  // Item handlers
  const handleAddItem = () => {
    const available = products.find(p => !items.some(i => i.productName === p.name)) || products[0];
    const newItem: OrderItemDraft = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: available ? available.id : '',
      productName: available ? available.name : '',
      qty: 10,
      price: orderType === 'Sample' ? 0 : (available ? (available.sellingRate || available.pricingToRetailer || available.mrp || 100) : 100)
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error('At least one item is required in the order');
      return;
    }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleProductChange = (itemId: string, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            productId: prodId,
            productName: prod ? prod.name : item.productName,
            price: orderType === 'Sample' ? 0 : (prod ? (prod.sellingRate || prod.pricingToRetailer || prod.mrp || 100) : item.price)
          };
        }
        return item;
      })
    );
  };

  const handleQtyChange = (itemId: string, qtyVal: number) => {
    const qty = Math.max(1, isNaN(qtyVal) ? 1 : qtyVal);
    setItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, qty } : item))
    );
  };

  const handlePriceChange = (itemId: string, priceVal: number) => {
    const price = Math.max(0, isNaN(priceVal) ? 0 : priceVal);
    setItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, price } : item))
    );
  };

  // Total order value
  const totalAmount = useMemo(() => {
    if (orderType === 'Sample') return 0;
    return items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  }, [items, orderType]);

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.qty || 0), 0);
  }, [items]);

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalDoctorName = isManualCustomer
      ? customDoctorName.trim()
      : (doctors.find(d => d.id === selectedDoctorId)?.name || customDoctorName.trim());

    const finalClinicName = isManualCustomer
      ? customClinicName.trim()
      : (doctors.find(d => d.id === selectedDoctorId)?.clinicName || customClinicName.trim() || `${finalDoctorName}'s Clinic`);

    if (!finalDoctorName) {
      toast.error('Please specify a doctor or hospital/clinic pharmacy');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    for (const itm of items) {
      if (!itm.productName.trim()) {
        toast.error('All order items must have a valid product name');
        return;
      }
      if (itm.qty <= 0) {
        toast.error('Item quantities must be greater than zero');
        return;
      }
    }

    // Determine sales rep attribution
    let repName = 'Head Office (Admin Direct)';
    let repId = 'rep-admin';
    if (selectedRepId && selectedRepId !== 'admin-direct') {
      const rep = reps.find(r => r.id === selectedRepId);
      if (rep) {
        repName = rep.name;
        repId = rep.id;
      }
    }

    // Format human-friendly date string
    const formattedDate = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateDisplay = orderDate
      ? `${new Date(orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${formattedDate}`
      : `Today, ${formattedDate}`;

    const orderPayload = {
      repId,
      repName,
      doctorName: finalDoctorName,
      clinicName: finalClinicName || 'General OPD Pharmacy',
      date: dateDisplay,
      isoDate: new Date().toISOString(),
      items: items.map(i => ({
        productName: i.productName,
        qty: Number(i.qty),
        price: orderType === 'Sample' ? 0 : Number(i.price)
      })),
      totalAmount,
      type: orderType,
      status: initialStatus
    };

    addOrder(orderPayload);

    toast.success(
      initialStatus === 'dispatched'
        ? 'Order created and marked as Dispatched & Invoiced!'
        : initialStatus === 'approved'
        ? 'Order created and pre-approved for dispatch!'
        : `Order #${Date.now().toString().slice(-4)} booked and queued as pending!`
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="create-order-modal"
        data-testid="create-order-modal"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <ShoppingCart size={22} weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 font-heading">
                  Create New Pharmacy Order
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                  Admin Direct
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Book purchase orders or complimentary doctor trial allocations for depot fulfillment.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {/* Row 1: Order Type & Immediate Approval Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Order Classification
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('Order');
                    setItems(prev => prev.map(item => {
                      const prod = products.find(p => p.id === item.productId);
                      return {
                        ...item,
                        price: prod ? (prod.sellingRate || prod.pricingToRetailer || prod.mrp || 100) : 100
                      };
                    }));
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    orderType === 'Order'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingCart size={15} weight={orderType === 'Order' ? 'fill' : 'regular'} />
                  <span>Commercial Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('Sample');
                    setItems(prev => prev.map(item => ({ ...item, price: 0 })));
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    orderType === 'Sample'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Package size={15} weight={orderType === 'Sample' ? 'fill' : 'regular'} />
                  <span>Physician Sample</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Dispatch Status Upon Creation
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setInitialStatus('pending')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    initialStatus === 'pending'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Clock size={14} weight="bold" />
                  <span>Pending</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInitialStatus('approved')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    initialStatus === 'approved'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle size={14} weight="fill" />
                  <span>Approved</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInitialStatus('dispatched')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    initialStatus === 'dispatched'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Package size={14} weight="fill" />
                  <span>Dispatched</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Customer / Doctor & Clinic Details */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <User size={15} className="text-blue-600" />
                Target Physician & Clinic Pharmacy
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsManualCustomer(!isManualCustomer);
                  if (!isManualCustomer) {
                    setSelectedDoctorId('');
                  }
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                {isManualCustomer ? '← Choose from Directory' : '+ Enter Custom Doctor / Hospital'}
              </button>
            </div>

            {!isManualCustomer ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Select Doctor
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => handleDoctorSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Choose Registered Physician --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} • {doc.specialty} ({doc.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Clinic / Pharmacy Name
                  </label>
                  <input
                    type="text"
                    value={customClinicName}
                    onChange={(e) => setCustomClinicName(e.target.value)}
                    placeholder="e.g. Apex Heart Centre Pharmacy"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Doctor / Prescriber Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customDoctorName}
                    onChange={(e) => setCustomDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Harish Mehta"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Clinic / Hospital / Chemist Name
                  </label>
                  <input
                    type="text"
                    value={customClinicName}
                    onChange={(e) => setCustomClinicName(e.target.value)}
                    placeholder="e.g. Metro Care Hospital Pharmacy"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Sales Rep & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Attributed Sales Representative
              </label>
              <select
                value={selectedRepId}
                onChange={(e) => setSelectedRepId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="admin-direct">Head Office (Admin Direct / No Field Rep)</option>
                {reps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name} ({rep.employeeCode} - {rep.territory})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Booking Date
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 4: Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Pill size={15} className="text-blue-600" />
                <span>Formulation Line Items ({items.length})</span>
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={13} weight="bold" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Item Number */}
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Product Selection */}
                    <div className="flex-1 min-w-[200px]">
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(item.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name} • {prod.packaging || prod.form} (₹{prod.sellingRate || prod.pricingToRetailer || prod.mrp})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-24 shrink-0">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value, 10))}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-mono"
                          placeholder="Qty"
                        />
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">pk</span>
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="w-28 shrink-0">
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          disabled={orderType === 'Sample'}
                          value={orderType === 'Sample' ? 0 : item.price}
                          onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value))}
                          className="w-full pl-5 pr-2 py-1.5 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          placeholder="Rate"
                        />
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="w-24 text-right shrink-0">
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {orderType === 'Sample' ? 'Free' : `₹${(item.qty * item.price).toLocaleString('en-IN')}`}
                      </span>
                    </div>

                    {/* Remove Action */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Remove formulation"
                      >
                        <Trash size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Calculation Strip */}
              <div className="bg-slate-50 border-t border-slate-200 p-3 px-4 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  Total Order Quantity: <strong className="text-slate-900">{totalQuantity} units</strong> across {items.length} line items
                </span>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">
                    Total Order Value
                  </span>
                  <span className="text-base font-bold text-blue-700 font-mono">
                    {orderType === 'Sample' ? 'Complimentary Sample' : `₹${totalAmount.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Notes / PO Reference */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Internal Remarks / Depot Dispatch Instructions (Optional)
            </label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Urgent cold-chain packaging required; PO Reference #HO-8891"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-create-order-btn"
              data-testid="confirm-create-order-btn"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold tracking-wide shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShoppingCart size={16} weight="bold" />
              <span>
                {initialStatus === 'dispatched'
                  ? 'Create & Dispatch Immediately'
                  : initialStatus === 'approved'
                  ? 'Create & Pre-Approve Order'
                  : 'Create & Queue Order'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
