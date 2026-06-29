'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import {
  Home, LayoutDashboard, Users, Calendar, MessageCircle, FileText,
  Brain, UserCircle, Clock, LogOut, ChevronLeft, ChevronRight,
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

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    const isCollapsed = saved === 'true';
    setCollapsed(isCollapsed);
    if (onCollapseChange) onCollapseChange(isCollapsed);
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileOpen(false);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKeyDown);
      };
    }
    document.body.style.overflow = '';
  }, [mobileOpen]);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
    if (onCollapseChange) onCollapseChange(newState);
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const sidebarWidth = collapsed ? '72px' : '260px';

  if (!mounted) return null;

  let menuItems = [
    { label: t('nav.home'), href: '/', icon: Home },
    { label: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
  ];

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

  let toolItems = [
    { label: t('tools.profile'), href: '/profile', icon: UserCircle },
  ];

  if (isMentore) {
    toolItems.push({ label: t('tools.matching'), href: '/matching', icon: Brain });
  }

  const renderItem = (item: { label: string; href: string; icon: any }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
        <div
          className="bookmark"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? '0' : '12px',
            padding: collapsed ? '12px' : '10px 12px',
            borderRadius: '10px',
            marginBottom: '4px',
            backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
            color: active ? 'var(--accent-text-on-soft)' : 'var(--text-secondary)',
            transition: 'background-color 0.2s, color 0.2s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }}
          onMouseLeave={(e) => {
            if (!active) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {active && (
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: '8px',
                bottom: '8px',
                width: '3px',
                borderRadius: '0 3px 3px 0',
                backgroundColor: 'var(--accent)',
              }}
            />
          )}
          <Icon className="w-5 h-5" style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</span>}
        </div>
      </Link>
    );
  };

  return (
    <>
      <button
        aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
        className={`sidebar-burger ${mobileOpen ? 'is-open' : ''}`}
        style={{
          left: mobileOpen ? `${MOBILE_DRAWER_WIDTH - 52}px` : '16px',
        }}
      >
        <span className="sidebar-burger-line" />
        <span className="sidebar-burger-line" />
        <span className="sidebar-burger-line" />
      </button>

      <div
        className={`sidebar-overlay ${mobileOpen ? 'is-visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`sidebar-aside ${mobileOpen ? 'is-open' : ''}`}
        style={{
          width: sidebarWidth,
          minHeight: '100vh',
          backgroundColor: 'var(--card-bg)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s',
          overflow: 'visible',
        }}
      >
        {/* Bouton flottant de réduction (desktop) — version moderne : cercle plus grand, devient plein bleu en état réduit */}
        <button
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'}
          className={`sidebar-collapse-btn ${collapsed ? 'is-collapsed' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div
          style={{
            padding: collapsed ? '20px 12px' : '20px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            borderBottom: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <Logo size={36} />
            {!collapsed && (
              <div>
                <div className="font-display" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  MentorIPath
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>UAZ — Informatique</div>
              </div>
            )}
          </Link>
        </div>

        <div style={{ padding: collapsed ? '16px 8px' : '20px 12px', flex: 1, overflowY: 'auto' }}>
          {!collapsed && (
            <div
              className="font-mono-data"
              style={{ fontSize: '10px', letterSpacing: '0.05em', color: 'var(--text-tertiary)', padding: '0 10px 12px', textTransform: 'uppercase' }}
            >
              {t('nav.home')}
            </div>
          )}
          {menuItems.map(renderItem)}
        </div>

        <div style={{ padding: collapsed ? '8px 8px' : '12px 12px' }}>
          {!collapsed && toolItems.length > 0 && (
            <div
              className="font-mono-data"
              style={{ fontSize: '10px', letterSpacing: '0.05em', color: 'var(--text-tertiary)', padding: '0 10px 12px', textTransform: 'uppercase' }}
            >
              {t('tools.matching')}
            </div>
          )}
          {toolItems.map(renderItem)}
        </div>

        <div style={{ padding: collapsed ? '12px 12px' : '16px 16px', borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              gap: collapsed ? '0' : '12px',
              padding: collapsed ? '0' : '10px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '12px', flex: collapsed ? 'none' : 1 }}>
              <Avatar photoUrl={user?.photo_url} prenom={user?.prenom} nom={user?.nom} size={collapsed ? 36 : 38} />
              {!collapsed && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user ? `${user.prenom} ${user.nom}` : 'Invité'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    {user?.role === 'mentor' ? 'Mentor' : 'Mentoré(e)'}
                  </div>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={logout}
                style={{
                  background: 'var(--danger-soft)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  color: 'var(--danger)',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={logout}
              style={{
                width: '100%',
                marginTop: '12px',
                background: 'var(--danger-soft)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
              }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      <style jsx global>{`
        .sidebar-burger {
          display: none;
          position: fixed;
          top: 16px;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background-color: var(--card-bg);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          z-index: 60;
          cursor: pointer;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s;
        }
        .sidebar-burger-line {
          display: block;
          width: 18px;
          height: 2px;
          border-radius: 2px;
          background-color: var(--text-primary);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s, width 0.3s;
        }
        .sidebar-burger.is-open .sidebar-burger-line:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }
        .sidebar-burger.is-open .sidebar-burger-line:nth-child(2) {
          opacity: 0;
          width: 0;
        }
        .sidebar-burger.is-open .sidebar-burger-line:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(2px);
          z-index: 39;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .sidebar-overlay.is-visible {
          opacity: 1;
          pointer-events: auto;
        }

        /* ====== Bouton de réduction — version moderne ======
           Couleurs forcées en dur (pas de var() de thème) pour garantir
           un contraste visible que le thème soit clair ou sombre. */
        .sidebar-collapse-btn {
          display: flex;
          position: absolute;
          top: 80px;
          right: -15px;
          width: 30px;
          height: 30px;
          border-radius: 9999px;
          border: 1.5px solid #CBD5E1;
          background-color: #FFFFFF;
          color: #475569;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 200;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease,
            color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
        }
        .sidebar-collapse-btn:hover {
          transform: scale(1.15);
          color: #fff;
          background-color: #3B82F6;
          border-color: #3B82F6;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.45);
        }
        .sidebar-collapse-btn:active {
          transform: scale(0.95);
        }
        .sidebar-collapse-btn.is-collapsed {
          background-color: #3B82F6;
          border-color: #3B82F6;
          color: #fff;
          box-shadow: 0 3px 12px rgba(59, 130, 246, 0.45);
        }
        .sidebar-collapse-btn.is-collapsed:hover {
          transform: scale(1.15);
          color: #fff;
          background-color: #2563EB;
          border-color: #2563EB;
          box-shadow: 0 5px 16px rgba(59, 130, 246, 0.55);
        }

        @media (max-width: 640px) {
          .sidebar-burger {
            display: flex;
          }
          .sidebar-collapse-btn {
            display: none !important;
          }
          .sidebar-aside {
            width: ${MOBILE_DRAWER_WIDTH}px !important;
            transform: translateX(-100%) !important;
            box-shadow: 0 0 0 rgba(0, 0, 0, 0);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .sidebar-aside.is-open {
            transform: translateX(0) !important;
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sidebar-burger-line,
          .sidebar-aside,
          .sidebar-overlay,
          .sidebar-collapse-btn {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}