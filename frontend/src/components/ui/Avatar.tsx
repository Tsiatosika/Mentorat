'use client';

import { resolvePhotoUrl } from '@/lib/photo';

interface AvatarProps {
  photoUrl?: string | null;
  prenom?: string;
  nom?: string;
  size?: number;
  rounded?: 'full' | 'xl' | 'lg';
  className?: string;
}

const ROUNDED_MAP = { full: 'rounded-full', xl: 'rounded-xl', lg: 'rounded-lg' };

export function Avatar({ photoUrl, prenom, nom, size = 40, rounded = 'full', className = '' }: AvatarProps) {
  const resolvedUrl = resolvePhotoUrl(photoUrl);
  const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  const shapeClass = ROUNDED_MAP[rounded];

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={`${prenom} ${nom}`}
        className={`${shapeClass} object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`${shapeClass} flex items-center justify-center flex-shrink-0 font-bold ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: 'var(--accent-soft)',
        color: 'var(--accent-text-on-soft)',
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </div>
  );
}