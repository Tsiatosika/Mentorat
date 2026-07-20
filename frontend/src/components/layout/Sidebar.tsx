'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import {
  Home, LayoutDashboard, Users, Calendar, MessageCircle, FileText,
  Brain, UserCircle, Clock, LogOut, ChevronLeft, ChevronRight,
  Menu, X, BarChart3, Wrench, ScrollText
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

const MOBILE_DRAWER_WIDTH = 280;

export default function Sidebar({ onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMentor = user?.role === 'mentor';
  const isMentore = user?.role === 'mentore';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    const isCollapsed = saved === 'true';
    setCollapsed(isCollapsed);
    if (onCollapseChange) onCollapseChange(isCollapsed);
    setMounted(true);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
      window.addEventListener('keydown', onKeyDown);
      return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKeyDown); };
    }
    document.body.style.overflow = '';
  }, [mobileOpen]);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
    if (onCollapseChange) onCollapseChange(newState);
  };

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  const sidebarWidth = collapsed ? '72px' : '260px';

  if (!mounted) return null;

  // ═══ ADMIN MENUS ═══
  let adminItems: { label: string; href: string; icon: any }[] = [];
  if (isAdmin) {
    adminItems = [
      { label: 'Dashboard Admin', href: '/admin', icon: BarChart3 },
      { label: 'Utilisateurs', href: '/admin/users', icon: Users },
      { label: 'Sessions', href: '/admin/sessions', icon: Calendar },
      { label: 'Compétences', href: '/admin/competences', icon: Wrench },
      { label: 'Rapports', href: '/admin/reports', icon: ScrollText },
    ];
  }

  // ═══ MENUS NORMAUX ═══
  let menuItems = [
    { label: t('nav.home'), href: '/', icon: Home },
    { label: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
  ];

  if (!isAdmin) {
    if (isMentore) {
      menuItems.push({ label: t('nav.mentors'), href: '/mentors', icon: Users });
    }
    if (isMentor) {
      menuItems.push({ label: t('tools.disponibilites'), href: '/disponibilites', icon: Clock });
    }
    menuItems = [
      ...menuItems,
      { label: t('nav.sessions'), href: '/sessions', icon: Calendar },
      { label: t('nav.chat'), href: '/chat', icon: MessageCircle },
      { label: t('nav.reports'), href: '/reports', icon: FileText },
    ];
  }

  let toolItems = [
    { label: t('tools.profile'), href: '/profile', icon: UserCircle },
  ];

  if (isMentore && !isAdmin) {
    toolItems.push({ label: t('tools.matching'), href: '/matching', icon: Brain });
  }

  const renderItem = (item: { label: string; href: string; icon: any }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
        <div
          style={{
            position: 'relative', display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? '0' : '12px', padding: collapsed ? '12px' : '10px 12px',
            borderRadius: '10px', marginBottom: '4px',
            backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
            color: active ? 'var(--accent-text-on-soft)' : 'var(--text-secondary)',
            transition: 'background-color 0.2s, color 0.2s', cursor: 'pointer',
          }}
          onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
          onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {active && (
            <span style={{ position: 'absolute', left: 0, top: '8px', bottom: '8px', width: '3px', borderRadius: '0 3px 3px 0', backgroundColor: 'var(--accent)' }} />
          )}
          <Icon className="w-5 h-5" style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</span>}
        </div>
      </Link>
    );
  };

  const getRoleLabel = () => {
    if (user?.role === 'admin') return 'Admin';
    if (user?.role === 'mentor') return 'Mentor';
    return 'Mentoré(e)';
  };

  return (
    <>
      <button
        aria-label={mobileOpen ? 'Fermer' : 'Ouvrir'} aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
        style={{
          display: 'none', position: 'fixed', top: '16px', left: '16px', width: '40px', height: '40px',
          borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 60, cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
        }}
        className="sidebar-burger"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div
        onClick={() => setMobileOpen(false)} aria-hidden="true"
        style={{
          display: 'none', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)', zIndex: 39, opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none', transition: 'opacity 0.3s ease',
        }}
        className="sidebar-overlay"
      />

      <aside
        style={{
          width: sidebarWidth, minHeight: '100vh', backgroundColor: 'var(--card-bg)',
          borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
          flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden',
        }}
      >
        <div style={{
          padding: collapsed ? '16px 10px' : '16px 16px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)', minHeight: '72px', gap: '8px',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <Logo size={32} />
            {!collapsed && (
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>MentorIPath</div>
                <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>UAZ — Informatique</div>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar} aria-label={collapsed ? 'Agrandir' : 'Réduire'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '30px', height: '30px', borderRadius: '8px',
              border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)',
              color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.2s ease', zIndex: 10,
            }}
            title={collapsed ? 'Agrandir' : 'Réduire'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '8px 6px' : '12px 12px' }}>
          {isAdmin && (
            <>
              {!collapsed && (
                <div style={{ fontSize: '10px', letterSpacing: '0.05em', color: '#8B5CF6', padding: '0 10px 8px', textTransform: 'uppercase', fontWeight: 600 }}>
                  ADMINISTRATION
                </div>
              )}
              {adminItems.map(renderItem)}
            </>
          )}

          {!isAdmin && (
            <>
              {!collapsed && (
                <div style={{ fontSize: '10px', letterSpacing: '0.05em', color: 'var(--text-tertiary)', padding: '0 10px 8px', textTransform: 'uppercase', fontWeight: 600 }}>
                  MENU
                </div>
              )}
              {menuItems.map(renderItem)}

              <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0', paddingTop: collapsed ? '4px' : '8px' }}>
                {!collapsed && (
                  <div style={{ fontSize: '10px', letterSpacing: '0.05em', color: 'var(--text-tertiary)', padding: '0 10px 8px', textTransform: 'uppercase', fontWeight: 600 }}>
                    OUTILS
                  </div>
                )}
                {toolItems.map(renderItem)}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: collapsed ? '12px 10px' : '16px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
            gap: collapsed ? '0' : '12px', padding: collapsed ? '4px 0' : '10px',
            borderRadius: '12px', backgroundColor: collapsed ? 'transparent' : 'var(--bg-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '12px', flex: collapsed ? 'none' : 1, minWidth: 0 }}>
              <Avatar photoUrl={user?.photo_url} prenom={user?.prenom} nom={user?.nom} size={collapsed ? 36 : 38} />
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user ? `${user.prenom} ${user.nom}` : 'Invité'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{getRoleLabel()}</div>
                </div>
              )}
            </div>
            {!collapsed && (
              <button onClick={logout} style={{ background: 'var(--danger-soft)', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '6px 10px', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Déconnexion">
                <LogOut size={16} />
              </button>
            )}
          </div>
          {collapsed && (
            <button onClick={logout} style={{ width: '100%', marginTop: '8px', background: 'var(--danger-soft)', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }} title="Déconnexion">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      <style jsx global>{`
        .sidebar-toggle-btn:hover { background-color: var(--accent-soft) !important; color: var(--accent) !important; border-color: var(--accent) !important; transform: scale(1.1); }
        @media (max-width: 640px) {
          .sidebar-burger { display: flex !important; }
          .sidebar-overlay { display: block !important; }
          .sidebar-aside { width: ${MOBILE_DRAWER_WIDTH}px !important; transform: translateX(-100%); transition: transform 0.3s ease !important; }
          .sidebar-aside.is-open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.18); }
          .sidebar-toggle-btn { display: none !important; }
        }
      `}</style>
    </>
  );
}