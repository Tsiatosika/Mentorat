'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import {
  Home, LayoutDashboard, Users, Calendar, MessageCircle, FileText,
  Brain, UserCircle, Clock, LogOut, ChevronLeft, ChevronRight,
  Menu, X
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
          className="sidebar-menu-item"
          data-active={active}
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
      {/* Burger menu mobile */}
      <button
        aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
        className="sidebar-burger"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay mobile */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'is-visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`sidebar-aside ${mobileOpen ? 'is-open' : ''}`}
        style={{ width: sidebarWidth }}
      >
        {/* En-tête avec logo et bouton toggle */}
        <div className="sidebar-header">
          <button
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'}
            className="sidebar-toggle-btn"
            title={collapsed ? 'Agrandir' : 'Réduire'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Menu principal */}
        <div className="sidebar-menu-section">
          {!collapsed && (
            <div className="sidebar-section-title">Accueil</div>
          )}
          {menuItems.map(renderItem)}
        </div>

        {/* Outils */}
        <div className="sidebar-tools-section">
          {!collapsed && toolItems.length > 0 && (
            <div className="sidebar-section-title">MATCHING IA</div>
          )}
          {toolItems.map(renderItem)}
        </div>

        {/* Profil utilisateur */}
        <div className="sidebar-profile">
          <div className="sidebar-profile-inner">
            <div className="sidebar-profile-avatar">
              <Avatar photoUrl={user?.photo_url} prenom={user?.prenom} nom={user?.nom} size={collapsed ? 36 : 38} />
              {!collapsed && (
                <div className="sidebar-profile-info">
                  <div className="sidebar-profile-name">
                    {user ? `${user.prenom} ${user.nom}` : 'Invité'}
                  </div>
                  <div className="sidebar-profile-role">
                    {user?.role === 'mentor' ? 'Mentor' : 'Mentoré(e)'}
                  </div>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={logout}
                className="sidebar-logout-btn"
                title="Déconnexion"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={logout}
              className="sidebar-logout-collapsed"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      <style jsx>{`
        .sidebar-aside {
          min-height: 100vh;
          background-color: var(--card-bg);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 40;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .sidebar-header {
          padding: ${collapsed ? '16px 10px' : '16px 16px'};
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          min-height: 72px;
          gap: 8px;
        }

        .sidebar-logo-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex: 1;
          overflow: hidden;
          min-width: 0;
        }

        .sidebar-brand-text {
          overflow: hidden;
          white-space: nowrap;
        }

        .sidebar-brand-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .sidebar-brand-subtitle {
          font-size: 9px;
          color: var(--text-tertiary);
        }

        /* Bouton de toggle - BIEN VISIBLE */
        .sidebar-toggle-btn {
          display: flex !important;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background-color: var(--card-bg);
          color: var(--text-secondary);
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s ease;
          position: relative;
          z-index: 10;
        }

        .sidebar-toggle-btn:hover {
          background-color: var(--accent-soft);
          color: var(--accent);
          border-color: var(--accent);
          transform: scale(1.1);
        }

        .sidebar-toggle-btn:active {
          transform: scale(0.95);
        }

        .sidebar-menu-section {
          padding: ${collapsed ? '12px 6px' : '16px 12px'};
          flex: 1;
          overflow-y: auto;
        }

        .sidebar-menu-section::-webkit-scrollbar {
          width: 3px;
        }

        .sidebar-menu-section::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: 3px;
        }

        .sidebar-section-title {
          font-size: 10px;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          padding: 0 10px 12px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .sidebar-tools-section {
          padding: ${collapsed ? '8px 6px' : '12px 12px'};
          border-top: 1px solid var(--border);
          margin-top: 4px;
        }

        .sidebar-profile {
          padding: ${collapsed ? '12px 10px' : '16px 16px'};
          border-top: 1px solid var(--border);
        }

        .sidebar-profile-inner {
          display: flex;
          align-items: center;
          justify-content: ${collapsed ? 'center' : 'space-between'};
          gap: ${collapsed ? '0' : '12px'};
          padding: ${collapsed ? '4px 0' : '10px'};
          border-radius: 12px;
          background-color: ${collapsed ? 'transparent' : 'var(--bg-secondary)'};
        }

        .sidebar-profile-avatar {
          display: flex;
          align-items: center;
          gap: ${collapsed ? '0' : '12px'};
          flex: ${collapsed ? 'none' : 1};
          min-width: 0;
        }

        .sidebar-profile-info {
          flex: 1;
          min-width: 0;
        }

        .sidebar-profile-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-profile-role {
          font-size: 10px;
          color: var(--text-tertiary);
        }

        .sidebar-logout-btn {
          background: var(--danger-soft);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          padding: 6px 10px;
          color: var(--danger);
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-logout-btn:hover {
          opacity: 0.7;
        }

        .sidebar-logout-collapsed {
          width: 100%;
          margin-top: 8px;
          background: var(--danger-soft);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--danger);
        }

        .sidebar-logout-collapsed:hover {
          opacity: 0.7;
        }

        /* Styles pour le menu burger mobile */
        .sidebar-burger {
          display: none;
          position: fixed;
          top: 16px;
          left: 16px;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background-color: var(--card-bg);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          z-index: 60;
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }

        .sidebar-overlay {
          display: none;
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

        @media (max-width: 640px) {
          .sidebar-burger {
            display: flex;
          }

          .sidebar-overlay {
            display: block;
          }

          .sidebar-aside {
            width: ${MOBILE_DRAWER_WIDTH}px !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease, width 0.3s ease !important;
          }

          .sidebar-aside.is-open {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
          }

          /* Cacher le bouton de toggle sur mobile car on a le burger */
          .sidebar-toggle-btn {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}