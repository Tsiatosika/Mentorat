'use client';

export function AdminSkeletonBar({ width = '100%', height = 14 }: { width?: string | number; height?: number }) {
  return <div className="admin-skeleton" style={{ width, height }} />;
}

export function AdminSkeletonKpis({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px' }}>
          <div className="admin-skeleton" style={{ width: 40, height: 40, borderRadius: 12, marginBottom: 14 }} />
          <div className="admin-skeleton" style={{ width: '60%', height: 22, marginBottom: 8 }} />
          <div className="admin-skeleton" style={{ width: '80%', height: 10 }} />
        </div>
      ))}
    </div>
  );
}

export function AdminSkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <div className="flex items-center justify-between gap-4">
            <div style={{ flex: 1 }}>
              <div className="admin-skeleton" style={{ width: '40%', height: 16, marginBottom: 10 }} />
              <div className="admin-skeleton" style={{ width: '25%', height: 10 }} />
            </div>
            <div className="admin-skeleton" style={{ width: 80, height: 24, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}