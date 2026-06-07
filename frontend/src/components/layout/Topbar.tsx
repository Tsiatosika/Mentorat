'use client';

import { useAuth } from '@/contexts/AuthContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: React.ReactNode;
}

export default function Topbar({ title, subtitle, icon = 'ti-layout-dashboard', action }: TopbarProps) {
  const { user } = useAuth();

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : '??';

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <header style={{
      height: '56px', background: '#fff', borderBottom: '0.5px solid #E5EAF2',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <i className={`ti ${icon}`} style={{ fontSize: '18px', color: '#3B82F6' }} aria-hidden="true" />
        <div style={{ width: '1px', height: '16px', background: '#E5EAF2' }} />
        <div>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#1E3A5F' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '11px', color: '#6B7280' }}>{subtitle}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {action}
        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{todayCapitalized}</span>
        <button aria-label="Notifications" style={{
          width: '34px', height: '34px', borderRadius: '8px',
          border: '0.5px solid #E5EAF2', background: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6B7280', position: 'relative',
        }}>
          <i className="ti ti-bell" style={{ fontSize: '17px' }} aria-hidden="true" />
          <span style={{ position: 'absolute', top: '7px', right: '7px', width: '7px', height: '7px', background: '#EF4444', borderRadius: '50%', border: '1.5px solid #fff' }} />
        </button>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0A3B8A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 500, color: '#fff' }}>
          {initials}
        </div>
      </div>
    </header>
  );
}