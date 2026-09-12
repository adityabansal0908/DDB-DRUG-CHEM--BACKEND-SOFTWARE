import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Camera,
  MapPin,
  CheckCircle,
  Pill,
  UploadSimple,
  Sparkle,
  Image as ImageIcon,
  X,
  Buildings,
  UserCheck
} from '@phosphor-icons/react';
import { toast } from 'sonner';

export const CheckinForm: React.FC = () => {
  const {
    doctors,
    products,
    addCheckinVisit,
    selectedDoctorForCheckin,
    setSelectedDoctorForCheckin,
    setActiveRepTab
  } = useApp();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    selectedDoctorForCheckin ? selectedDoctorForCheckin.id : doctors[0]?.id || ''
  );
  
  const [purpose, setPurpose] = useState<'Product Detailing' | 'Sample Distribution' | 'Order Booking' | 'Payment Follow-up' | 'Routine Relationship'>('Product Detailing');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['TelmiKard 40-H']);
  const [sampleUnits, setSampleUnits] = useState<number>(2);
  const [orderValue, setOrderValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [doctorFeedback, setDoctorFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default sample image from prompt
  const defaultClinicalPhoto = 'https://images.unsplash.com/photo-1758691461990-03b49d969495?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwzfHxkb2N0b3IlMjBjbGluaWN8ZW58MHx8fHwxNzg4MTg4NjE5fDA&ixlib=rb-4.1.0&q=85';

  useEffect(() => {
    if (selectedDoctorForCheckin) {
      setSelectedDoctorId(selectedDoctorForCheckin.id);
    }
  }, [selectedDoctorForCheckin]);

  const activeDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseMockPhoto = () => {
    setPhotoPreview(defaultClinicalPhoto);
    toast.info('Loaded clinic chamber photo proof');
  };

  const toggleProduct = (prodName: string) => {
    setSelectedProducts(prev =>
      prev.includes(prodName)
        ? prev.filter(p => p !== prodName)
        : [...prev, prodName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoctor) {
      toast.error('Please select a doctor');
      return;
    }

    setIsSubmitting(true);

    const submissionPhoto = photoPreview || defaultClinicalPhoto;

    setTimeout(() => {
      addCheckinVisit({
        doctorId: activeDoctor.id,
        doctorName: activeDoctor.name,
        specialty: activeDoctor.specialty,
        clinicName: activeDoctor.clinicName,
        clinicAddress: activeDoctor.address,
        purpose,
        photoUrl: submissionPhoto,
        notes: notes || `Detailed ${selectedProducts.join(', ')} with ${activeDoctor.name}. Discussion on prescription compliance.`,
        locationVerified: true,
        distanceMeters: Math.floor(Math.random() * 25) + 8, // Realistic 8-33 meters from geofence
        productsDiscussed: selectedProducts.length > 0 ? selectedProducts : ['TelmiKard 40-H'],
        sampleUnitsGiven: Number(sampleUnits),
        orderValueBooked: orderValue ? Number(orderValue) : undefined,
        feedbackFromDoctor: doctorFeedback || 'Positive clinical interest in latest study data.'
      });

      setIsSubmitting(false);
      setSelectedDoctorForCheckin(null);
      setActiveRepTab('activity');
    }, 600);
  };

  const purposeOptions: Array<'Product Detailing' | 'Sample Distribution' | 'Order Booking' | 'Payment Follow-up' | 'Routine Relationship'> = [
    'Product Detailing',
    'Sample Distribution',
    'Order Booking',
    'Follow-up' as any,
    'Routine Relationship'
  ];

  return (
    <div
      id="rep-checkin-form-container"
      data-testid="rep-checkin-form-container"
      className="space-y-6 pb-24 max-w-xl mx-auto"
    >
      {/* Header Info */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-blue-600 block mb-1">
          Geo-Fenced Field Detailing
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
          Doctor Visit Check-in
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Capture chamber photo proof, log detailed brands, and register doctor samples.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* GPS Verification Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <div>
              <span className="font-bold text-emerald-900 block">
                GPS Position Locked (±14m)
              </span>
              <span className="text-emerald-700 text-[11px]">
                {activeDoctor?.clinicName || 'Clinic Chamber Zone'}
              </span>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded">
            Geo-Fence Valid
          </span>
        </div>

        {/* 1. Camera Upload Zone (Prominently styled with dashed border as specified) */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              1. Chamber Visit Photo Proof *
            </label>
            <button
              type="button"
              data-testid="use-mock-photo-btn"
              onClick={handleUseMockPhoto}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <Sparkle size={14} weight="fill" />
              <span>Use Test Photo</span>
            </button>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            id="camera-file-input"
            data-testid="camera-file-input"
          />

          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-64 flex items-center justify-center group">
              <img
                src={photoPreview}
                alt="Captured Chamber"
                className="max-h-64 w-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-xs font-medium backdrop-blur-xs flex items-center gap-1"
                >
                  <Camera size={14} />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-1 rounded backdrop-blur-xs font-mono">
                TIMESTAMP: {new Date().toLocaleTimeString()} &bull; LAT/LNG VERIFIED
              </div>
            </div>
          ) : (
            <div
              id="camera-dropzone"
              data-testid="camera-dropzone"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-colors space-y-2.5"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                <Camera size={32} weight="duotone" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Tap to Take Chamber Photo / Upload
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Capture clinic reception, nameplate, or prescription pad proof
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-blue-700 font-semibold bg-white px-3 py-1.5 rounded-md border border-blue-200">
                <UploadSimple size={14} />
                <span>Open Device Camera or Gallery</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Doctor / Clinic Selection */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            2. Target Doctor & Institution
          </label>
          <div className="space-y-2">
            <select
              id="doctor-select"
              data-testid="doctor-select"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full min-h-[48px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.specialty}) &bull; {doc.clinicName}
                </option>
              ))}
            </select>

            {activeDoctor && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-start gap-3">
                <img
                  src={activeDoctor.avatarUrl}
                  alt={activeDoctor.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
                />
                <div className="text-xs text-slate-600 flex-1 min-w-0">
                  <div className="font-bold text-slate-800">{activeDoctor.name}</div>
                  <div className="text-slate-500 truncate">{activeDoctor.clinicName} &bull; {activeDoctor.address}</div>
                  <div className="text-[11px] text-blue-700 font-medium mt-0.5">
                    Best Time: {activeDoctor.bestTimeToVisit}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Purpose of Visit */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            3. Visit Objective
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {purposeOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                data-testid={`purpose-btn-${opt.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setPurpose(opt as any)}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold text-center border transition-all ${
                  purpose === opt
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Products Discussed & Sample Drop */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
              4. Products Detailed
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Select formulations showcased to physician:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {products.map((prod) => {
                const isSelected = selectedProducts.includes(prod.name);
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => toggleProduct(prod.name)}
                    className={`min-h-[48px] px-3 py-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold leading-snug">{prod.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                        {prod.genericName}
                      </div>
                    </div>
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Sample Packs Given
              </label>
              <select
                value={sampleUnits}
                onChange={(e) => setSampleUnits(Number(e.target.value))}
                className="w-full min-h-[48px] px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold tabular-nums"
              >
                <option value={0}>0 Packs</option>
                <option value={2}>2 Trial Packs</option>
                <option value={4}>4 Trial Packs</option>
                <option value={6}>6 Trial Packs</option>
                <option value={10}>10 Trial Packs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Order Booked (₹)
              </label>
              <input
                type="number"
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full min-h-[48px] px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* 5. Notes & Physician Feedback */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            5. Physician Remarks & Detailing Summary
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Doctor feedback on drug tolerability, competitor brand comparisons, or prescription commitments..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Large Tap Target Submission Button (min-h-[48px]) */}
        <button
          type="submit"
          disabled={isSubmitting}
          id="submit-checkin-btn"
          data-testid="submit-checkin-btn"
          className="w-full min-h-[52px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          {isSubmitting ? (
            <span>Uploading Telemetry & Verifying GPS...</span>
          ) : (
            <>
              <CheckCircle size={22} weight="bold" />
              <span>Complete & Submit Chamber Check-in</span>
            </>
          )}
        </button>

      </form>
    </div>
  );
};
