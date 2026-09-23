import React, { useState } from 'react';

export function getInitials(name?: string): string {
  if (!name) return 'A';
  let cleaned = name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s+/i, '').trim();
  if (!cleaned) cleaned = name.trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string;
  avatarType?: 'image' | 'monogram';
  className?: string;
  textClassName?: string;
  monogramBg?: string; // Optional custom background classes
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'Admin',
  avatarUrl,
  avatarType,
  className = 'w-10 h-10',
  textClassName = 'text-xs font-bold',
  monogramBg = 'bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950'
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);

  // Check if monogram should be shown
  const isMonogram =
    avatarType === 'monogram' ||
    !avatarUrl ||
    avatarUrl === 'monogram' ||
    imageError;

  if (isMonogram) {
    return (
      <div
        data-testid="user-monogram-avatar"
        className={`${className} ${monogramBg} rounded-full flex items-center justify-center text-white select-none shadow-xs border border-white/20 tracking-wider shrink-0 font-heading`}
        title={name}
      >
        <span className={textClassName}>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setImageError(true)}
      className={`${className} rounded-full object-cover shrink-0 select-none`}
    />
  );
};
