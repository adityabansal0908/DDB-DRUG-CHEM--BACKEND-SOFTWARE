import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

export const DdbLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10', size }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs overflow-hidden shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="DDB DRUG CHEM"
    >
      {!imgError ? (
        <img
          src="/ddb_logo.jpg"
          alt="DDB DRUG CHEM"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain p-0.5 mix-blend-multiply"
          onError={() => setImgError(true)}
        />
      ) : (
        /* Precise SVG fallback aligning directly with the brand's letterform */
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Blue 'B' glyph */}
          {/* Left Serif Stem */}
          <path
            d="M 18 14 L 32 14 C 29 20 29 24 29 28 L 29 72 C 29 76 29 80 32 86 L 18 86 C 21 80 21 76 21 72 L 21 28 C 21 24 21 20 18 14 Z"
            fill="#30388B"
          />
          {/* Upper Outer Curve of 'B' */}
          <path
            d="M 30 14 C 54 14 74 22 74 38 C 74 44 71 49 65 52 C 60 48 48 48 30 48 L 30 42 C 46 42 66 43 66 36 C 66 22 48 20 30 20 Z"
            fill="#30388B"
          />
          {/* Lower Outer Curve of 'B' */}
          <path
            d="M 30 48 C 48 48 60 48 65 52 C 75 56 78 62 78 66 C 78 80 56 86 30 86 L 30 80 C 50 80 70 77 70 66 C 70 58 50 54 30 54 Z"
            fill="#30388B"
          />

          {/* Upper Magenta 'D' */}
          <path
            d="M 38 22 L 48 22 C 60 22 66 27 66 35 C 66 43 60 48 48 48 L 38 48 Z M 44 28 L 44 42 L 48 42 C 55 42 59 39 59 35 C 59 31 55 28 48 28 Z"
            fill="#E5127D"
          />

          {/* Lower Magenta 'D' */}
          <path
            d="M 38 52 L 48 52 C 60 52 66 57 66 65 C 66 73 60 78 48 78 L 38 78 Z M 44 58 L 44 72 L 48 72 C 55 72 59 69 59 65 C 59 61 55 58 48 58 Z"
            fill="#E5127D"
          />
        </svg>
      )}
    </div>
  );
};
