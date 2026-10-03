import React from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle, Warning, MapPin } from '@phosphor-icons/react';

export const PhotoModal: React.FC = () => {
  const { previewPhotoUrl, setPreviewPhotoUrl, visits, products } = useApp();

  if (!previewPhotoUrl) return null;

  // Find associated visit if exists
  const associatedVisit = visits.find(v => v.photoUrl === previewPhotoUrl);
  // Find associated product if exists
  const associatedProduct = products.find(
    p => p.imageUrl === previewPhotoUrl || (p.photos && p.photos.includes(previewPhotoUrl))
  );

  return (
    <div
      id="photo-modal-backdrop"
      data-testid="photo-preview-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setPreviewPhotoUrl(null)}
    >
      <div
        id="photo-modal-card"
        className="relative max-w-2xl w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2">
            {associatedProduct ? (
              <>
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Product Catalog Photo
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  {associatedProduct.category || 'Pharmaceutical Formulation'}
                </span>
              </>
            ) : (
              <>
                <span className="text-xs font-bold tracking-[0.15em] uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  Field Visit Verification
                </span>
                {associatedVisit && (
                  <span className="text-xs text-slate-500 font-medium">
                    {associatedVisit.timestamp}
                  </span>
                )}
              </>
            )}
          </div>
          <button
            id="close-photo-modal-btn"
            data-testid="close-photo-modal-btn"
            onClick={() => setPreviewPhotoUrl(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="relative bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
          <img
            src={previewPhotoUrl}
            alt={associatedProduct ? associatedProduct.name : 'Field Check-in Evidence'}
            className="max-h-[70vh] w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {associatedVisit && (
          <div className="p-5 bg-white space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-semibold text-slate-900 font-heading">
                  {associatedVisit.doctorName}
                </h4>
                <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <MapPin size={16} className="text-blue-600 shrink-0" weight="duotone" />
                  {associatedVisit.clinicName} &bull; {associatedVisit.clinicAddress}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Logged by</span>
                <span className="text-sm font-semibold text-slate-800">{associatedVisit.repName}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                <CheckCircle size={14} weight="fill" />
                GPS Verified (±{associatedVisit.distanceMeters}m from clinic geo-fence)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                Purpose: {associatedVisit.purpose}
              </span>
            </div>
            
            {associatedVisit.notes && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Rep Notes</span>
                "{associatedVisit.notes}"
              </div>
            )}
          </div>
        )}

        {associatedProduct && !associatedVisit && (
          <div className="p-5 bg-white space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-900 font-heading">
                    {associatedProduct.name}
                  </h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {associatedProduct.form}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">
                  {associatedProduct.genericName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Packaging: <span className="font-medium text-slate-700">{associatedProduct.packaging}</span> &bull; Company: <span className="font-medium text-slate-700">{associatedProduct.company || 'DDB DRUG CHEM'}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 block">MRP / Selling Rate</span>
                <span className="text-base font-bold text-slate-900">₹{associatedProduct.mrp?.toFixed(2)}</span>
                {associatedProduct.sellingRate && (
                  <span className="text-xs text-emerald-700 block font-semibold">Rate: ₹{associatedProduct.sellingRate?.toFixed(2)}</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                <CheckCircle size={14} weight="fill" />
                Verified Admin Commercial Photo
              </span>
              {associatedProduct.stockUnits !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                  Stock: {associatedProduct.stockUnits} units
                </span>
              )}
              {associatedProduct.batchNo && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                  Batch: {associatedProduct.batchNo}
                </span>
              )}
              {associatedProduct.expiryDate && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                  Exp: {associatedProduct.expiryDate}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
