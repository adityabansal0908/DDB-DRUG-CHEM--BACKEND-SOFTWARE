import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  EnvelopeSimple,
  Lock,
  FloppyDisk,
  ShieldCheck,
  Eye,
  EyeSlash,
  UploadSimple,
  Trash,
  IdentificationBadge,
  Image as ImageIcon,
  CheckCircle
} from '@phosphor-icons/react';
import { getInitials } from './UserAvatar';

interface EditAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditAdminModal: React.FC<EditAdminModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserDetails } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarType, setAvatarType] = useState<'monogram' | 'image'>('monogram');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setNewPassword('');
      setUploadError(null);

      if (currentUser.avatarType === 'monogram' || currentUser.avatarUrl === 'monogram' || !currentUser.avatarUrl) {
        setAvatarType('monogram');
        setUploadedImage('');
      } else {
        setAvatarType('image');
        setUploadedImage(currentUser.avatarUrl);
      }
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  // Process and optimize image file to Base64 data URL
  const handleFileProcess = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP, or SVG).');
      return;
    }

    // Limit to 5MB max
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      // Create an image element to downscale if it's too large
      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/jpeg', 0.88);
            setUploadedImage(optimized);
            setAvatarType('image');
            return;
          }
        }

        setUploadedImage(result);
        setAvatarType('image');
      };
      img.onerror = () => {
        setUploadedImage(result);
        setAvatarType('image');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      return;
    }

    const success = updateUserDetails({
      name: name.trim(),
      email: email.trim(),
      avatarType,
      avatarUrl: avatarType === 'monogram' ? 'monogram' : (uploadedImage || 'monogram'),
      newPassword: newPassword.trim() || undefined
    });

    if (success) {
      onClose();
    }
  };

  const currentInitials = getInitials(name || 'Admin');

  const modalContent = (
    <div
      id="edit-admin-modal-overlay"
      data-testid="edit-admin-modal-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="edit-admin-modal-card"
        data-testid="edit-admin-modal-card"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[min(90vh,680px)] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
              <ShieldCheck size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white">Edit Admin Details</h2>
              <p className="text-xs text-blue-200">Update name, email, profile picture or monogram</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close edit modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Avatar Option: Upload Picture vs Monogram */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Profile Display (Upload Photo or Keep Monogram)
            </label>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 mb-3">
              <button
                type="button"
                id="avatar-mode-monogram-btn"
                data-testid="avatar-mode-monogram-btn"
                onClick={() => setAvatarType('monogram')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  avatarType === 'monogram'
                    ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <IdentificationBadge size={16} weight={avatarType === 'monogram' ? 'fill' : 'regular'} />
                <span>Keep Just Monogram</span>
              </button>

              <button
                type="button"
                id="avatar-mode-upload-btn"
                data-testid="avatar-mode-upload-btn"
                onClick={() => {
                  setAvatarType('image');
                  if (!uploadedImage) {
                    fileInputRef.current?.click();
                  }
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  avatarType === 'image'
                    ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadSimple size={16} weight={avatarType === 'image' ? 'bold' : 'regular'} />
                <span>Upload Profile Picture</span>
              </button>
            </div>

            {/* Mode 1: Monogram View */}
            {avatarType === 'monogram' ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                <div
                  id="admin-monogram-preview"
                  data-testid="admin-monogram-preview"
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-center font-heading font-bold text-xl tracking-wider shadow-md border-2 border-white ring-2 ring-blue-100 shrink-0"
                >
                  {currentInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                    <CheckCircle size={16} className="text-blue-600" weight="fill" />
                    <span>Monogram Selected</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Uses your clean initials (<strong className="text-slate-800">{currentInitials}</strong>) in the header and console with no external or stock image.
                  </p>
                </div>
              </div>
            ) : (
              /* Mode 2: Upload Profile Picture */
              <div className="space-y-3">
                {uploadedImage ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                    <img
                      src={uploadedImage}
                      alt="Uploaded profile"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 ring-2 ring-blue-100 shadow-md shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900">Custom Profile Picture Active</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Your custom photo is ready. You can change it or clear it to use monogram.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <UploadSimple size={13} weight="bold" />
                          <span>Change Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedImage('');
                            setAvatarType('monogram');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash size={13} weight="bold" />
                          <span>Switch to Monogram</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-200'
                        : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50/70 bg-slate-50/40'
                    }`}
                  >
                    <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                      <UploadSimple size={20} weight="bold" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload profile photo or drag and drop
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      PNG, JPG, WebP or SVG (max 5MB)
                    </p>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-red-600 font-medium">{uploadError}</p>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Admin Full Name
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Aditya Bansal"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Email ID */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <EnvelopeSimple size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@ddbdrugchem.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono"
              />
            </div>
          </div>

          {/* Password (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Change Password (Optional)
              </label>
              <span className="text-[10px] text-slate-400">Leave blank to keep unchanged</span>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 4 characters)..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-admin-details-btn"
              data-testid="save-admin-details-btn"
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <FloppyDisk size={16} weight="bold" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
