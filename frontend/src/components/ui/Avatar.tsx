'use client';

import { useState } from 'react';
import { BACKEND_URL } from '@/services/api';

interface AvatarProps {
  photoUrl?: string | null;
  prenom?: string;
  nom?: string;
  size?: number;
  rounded?: 'full' | 'xl' | 'lg';
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
}

export function Avatar({ 
  photoUrl, 
  prenom, 
  nom, 
  size = 40, 
  rounded = 'full', 
  className = '',
  showStatus = false,
  isOnline = false
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase() || '?';
  
  const getPhotoUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = BACKEND_URL.replace(/\/api\/?$/, '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const imageUrl = getPhotoUrl(photoUrl);
  
  const roundedClass = rounded === 'xl' ? 'rounded-xl' : rounded === 'lg' ? 'rounded-lg' : 'rounded-full';
  const fontSize = size <= 40 ? 'text-sm' : size <= 56 ? 'text-lg' : size <= 80 ? 'text-xl' : 'text-2xl';

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <div
        className={`${roundedClass} overflow-hidden flex-shrink-0 flex items-center justify-center ${className}`}
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: 'var(--accent-soft)',
          border: '2px solid var(--accent-soft)',
          transition: 'all var(--transition-bounce)'
        }}
        title={`${prenom || ''} ${nom || ''}`}
      >
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={`${prenom || ''} ${nom || ''}`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span className={`font-bold ${fontSize}`} style={{ color: 'var(--accent-text-on-soft)' }}>
            {initials}
          </span>
        )}
      </div>
      
      {showStatus && (
        <span
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
          style={{ 
            backgroundColor: isOnline ? 'var(--success)' : 'var(--text-tertiary)',
            transition: 'background-color var(--transition-fast)'
          }}
        />
      )}
    </div>
  );
}