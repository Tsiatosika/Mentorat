'use client';

import { ReactNode } from 'react';

interface AdminEmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  accent?: string;
  action?: ReactNode;
}

export default function AdminEmptyState({ icon, title, description, accent = 'var(--accent)', action }: AdminEmptyStateProps) {
  return (
    <div className="admin-fade-up flex flex-col items-center justify-center text-center py-16 px-6">
      <div
        style={{
          width: 64, height: 64, borderRadius: '20px',
          background: `color-mix(in srgb, ${accent} 12%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent, marginBottom: 16,
        }}
      >
        {icon}
      </div>
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      {description && (
        <p className="text-sm mt-1.5 max-w-sm" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}