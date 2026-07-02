'use client';

import { Toaster } from 'react-hot-toast';

export function ToastConfig() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--card-bg)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          padding: '1rem',
          fontSize: '0.875rem',
        },
        success: {
          iconTheme: {
            primary: 'var(--success)',
            secondary: 'white',
          },
          style: {
            borderLeft: '4px solid var(--success)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--danger)',
            secondary: 'white',
          },
          style: {
            borderLeft: '4px solid var(--danger)',
          },
        },
        loading: {
          style: {
            borderLeft: '4px solid var(--accent)',
          },
        },
      }}
    />
  );
}