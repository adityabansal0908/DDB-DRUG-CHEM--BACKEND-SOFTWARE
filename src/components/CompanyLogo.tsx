import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CompanyProfile } from '../types';
import { INITIAL_COMPANY_PROFILE } from '../data/mockData';

interface CompanyLogoProps {
  className?: string;
  size?: number | string;
  overrideProfile?: Partial<CompanyProfile>;
  title?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = 'w-10 h-10',
  size,
  overrideProfile,
  title
}) => {
  let contextProfile: CompanyProfile = INITIAL_COMPANY_PROFILE;
  try {
    const app = useApp();
    if (app && app.companyProfile) {
      contextProfile = app.companyProfile;
    }
  } catch {
    // If rendered outside AppProvider, use fallback
  }

  const profile: CompanyProfile = {
    ...contextProfile,
    ...overrideProfile
  };

  const [imgError, setImgError] = useState(false);

  const brandColor = profile.primaryColor || '#2563eb';
  const brandName = profile.name || 'Pharma Enterprise';
  const logoUrl = profile.logoUrl?.trim();
  const logoType = profile.logoType || (logoUrl ? 'custom_image' : 'preset_icon');
  const presetId = profile.presetIconId || 'pill_capsule';

  // Extract up to 3 uppercase initials for monogram
  const monogram = brandName
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 3)
    .join('')
    .toUpperCase() || 'RX';

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs overflow-hidden shrink-0 select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title={title || brandName}
    >
      {/* 1. Custom Image / Uploaded Logo */}
      {logoUrl && !imgError && logoType === 'custom_image' ? (
        <img
          src={logoUrl}
          alt={brandName}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain p-1 mix-blend-multiply"
          onError={() => setImgError(true)}
        />
      ) : logoType === 'monogram' ? (
        /* 2. Geometric Monogram */
        <div
          className="w-full h-full flex items-center justify-center font-heading font-black text-white tracking-wider"
          style={{
            background: `linear-gradient(135deg, ${brandColor} 0%, #1e1b4b 100%)`,
            fontSize: monogram.length > 2 ? '36%' : '44%'
          }}
        >
          {monogram}
        </div>
      ) : (
        /* 3. Preset Pharmaceutical SVG Emblems */
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {presetId === 'medical_cross' ? (
            /* Medical Cross Shield */
            <g>
              <rect x="10" y="10" width="80" height="80" rx="20" fill={brandColor} fillOpacity="0.12" />
              <path
                d="M 50 15 C 70 15 82 25 82 45 C 82 70 50 87 50 87 C 50 87 18 70 18 45 C 18 25 30 15 50 15 Z"
                fill={brandColor}
              />
              <path
                d="M 43 32 H 57 V 43 H 68 V 57 H 57 V 68 H 43 V 57 H 32 V 43 H 43 Z"
                fill="#ffffff"
              />
            </g>
          ) : presetId === 'caduceus' ? (
            /* Caduceus / Healing Rod */
            <g>
              <rect x="8" y="8" width="84" height="84" rx="20" fill={brandColor} fillOpacity="0.12" />
              <path d="M 50 18 L 50 82" stroke={brandColor} strokeWidth="6" strokeLinecap="round" />
              <circle cx="50" cy="18" r="6" fill={brandColor} />
              <path
                d="M 28 36 C 42 24 58 48 50 62 C 44 72 32 60 48 48"
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 72 36 C 58 24 42 48 50 62 C 56 72 68 60 52 48"
                stroke="#0284c7"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : presetId === 'molecule' ? (
            /* Molecular Chemistry Hexagon */
            <g>
              <rect x="8" y="8" width="84" height="84" rx="20" fill={brandColor} fillOpacity="0.12" />
              {/* Central Hexagon */}
              <polygon
                points="50,22 74,36 74,64 50,78 26,64 26,36"
                stroke={brandColor}
                strokeWidth="5"
                fill="none"
              />
              {/* Inner Bonds */}
              <line x1="50" y1="22" x2="50" y2="40" stroke={brandColor} strokeWidth="4" />
              <line x1="74" y1="64" x2="60" y2="54" stroke={brandColor} strokeWidth="4" />
              <line x1="26" y1="64" x2="40" y2="54" stroke={brandColor} strokeWidth="4" />
              {/* Atom nodes */}
              <circle cx="50" cy="22" r="5" fill="#3b82f6" />
              <circle cx="74" cy="36" r="5" fill="#10b981" />
              <circle cx="74" cy="64" r="5" fill="#8b5cf6" />
              <circle cx="50" cy="78" r="5" fill="#f59e0b" />
              <circle cx="26" cy="64" r="5" fill="#ec4899" />
              <circle cx="26" cy="36" r="5" fill="#06b6d4" />
              <circle cx="50" cy="50" r="7" fill={brandColor} />
            </g>
          ) : presetId === 'flask' ? (
            /* Science Laboratory Flask */
            <g>
              <rect x="8" y="8" width="84" height="84" rx="20" fill={brandColor} fillOpacity="0.12" />
              <path
                d="M 44 20 H 56 V 38 L 74 68 C 77 74 73 80 66 80 H 34 C 27 80 23 74 26 68 L 44 38 Z"
                fill={brandColor}
              />
              <path
                d="M 33 66 L 40 54 C 44 57 56 57 60 54 L 67 66 C 70 71 67 76 61 76 H 39 C 33 76 30 71 33 66 Z"
                fill="#ffffff"
                fillOpacity="0.8"
              />
              <circle cx="48" cy="68" r="3" fill={brandColor} />
              <circle cx="56" cy="64" r="2" fill={brandColor} />
              <circle cx="42" cy="62" r="1.5" fill={brandColor} />
            </g>
          ) : (
            /* Default: Stylized Dual-Action Pharma Capsule */
            <g>
              {/* Capsule Left/Top Half in Brand Color */}
              <path
                d="M 24 42 C 24 28 36 16 50 16 C 64 16 76 28 76 42 L 76 50 L 24 50 Z"
                fill={brandColor}
              />
              {/* Capsule Right/Bottom Half in Complementary White/Slate with Cross */}
              <path
                d="M 24 50 L 76 50 L 76 58 C 76 72 64 84 50 84 C 36 84 24 72 24 58 Z"
                fill="#0f172a"
              />
              {/* Cross symbol in the lower half */}
              <rect x="47" y="60" width="6" height="16" rx="2" fill="#ffffff" />
              <rect x="42" y="65" width="16" height="6" rx="2" fill="#ffffff" />
              {/* Specular Capsule Highlight line */}
              <path
                d="M 34 26 C 38 22 44 20 50 20"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeOpacity="0.75"
              />
            </g>
          )}
        </svg>
      )}
    </div>
  );
};
