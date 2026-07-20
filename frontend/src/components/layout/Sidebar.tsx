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

export default function Sidebar({ onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isMentor = user?.role === 'mentor';
  const isMentore = user?.role === 'mentore';
  const isAdmin = user?.role === 'admin';

  const homeLink = isAdmin ? '/admin' : isMentor ? '/dashboard' : '/';

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
  const sidebarWidth = collapsed ? '76px' : '260px';

  if (!mounted) return null;

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

  let menuItems = [
    { label: t('nav.home'), href: '/', icon: Home },
    { label: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
  ];

  if (!isAdmin) {
    if (isMentore) menuItems.push({ label: t('nav.mentors'), href: '/mentors', icon: Users });
    if (isMentor) menuItems.push({ label: t('tools.disponibilites'), href: '/disponibilites', icon: Clock });
    menuItems = [
      ...menuItems,
      { label: t('nav.sessions'), href: '/sessions', icon: Calendar },
      { label: t('nav.chat'), href: '/chat', icon: MessageCircle },
      { label: t('nav.reports'), href: '/reports', icon: FileText },
    ];
  }

  let toolItems = [{ label: t('tools.profile'), href: '/profile', icon: UserCircle }];
  if (isMentore && !isAdmin) toolItems.push({ label: t('tools.matching'), href: '/matching', icon: Brain });

  const renderItem = (item: { label: string; href: string; icon: any }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
        <div
          className="sb-item"
          data-active={active}
          onMouseEnter={() => setHoveredItem(item.href)}
          onMouseLeave={() => setHoveredItem(null)}
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          {active && <span className="sb-item-indicator" />}
          <Icon className="w-[19px] h-[19px]" style={{ flexShrink: 0 }} />
          {!collapsed && <span className="sb-item-label">{item.label}</span>}
          {collapsed && hoveredItem === item.href && (
            <span className="sb-tooltip">{item.label}</span>
          )}
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
        aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
        className="sidebar-burger"
      >
        {mobileOpen ? <X size={19} /> : <Menu size={19} />}
      </button>

      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className="sidebar-overlay"
        style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? 'auto' : 'none' }}
      />

      <aside
        className={`sidebar-aside ${mobileOpen ? 'is-open' : ''}`}
        style={{ width: sidebarWidth }}
      >
        <div className="sb-header" style={{ padding: collapsed ? '16px 10px' : '16px 16px' }}>
          <Link href={homeLink} className="sb-logo-link">
            <Logo size={32} />
            {!collapsed && (
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div className="sb-brand-name">MentorIPath</div>
                <div className="sb-brand-sub">UAZ — Informatique</div>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button onClick={toggleSidebar} aria-label="Réduire" className="sb-collapse-btn" title="Réduire">
              <ChevronLeft size={17} />
            </button>
          )}
        </div>

        {collapsed && (
          <button onClick={toggleSidebar} aria-label="Agrandir" className="sb-expand-btn" title="Agrandir">
            <ChevronRight size={15} />
          </button>
        )}

        <div className="sb-nav" style={{ padding: collapsed ? '10px 8px' : '14px 12px' }}>
          {isAdmin && (
            <>
              {!collapsed && <div className="sb-section-label sb-section-label-admin">Administration</div>}
              {adminItems.map(renderItem)}
            </>
          )}

          {!isAdmin && (
            <>
              {!collapsed && <div className="sb-section-label">Menu</div>}
              {menuItems.map(renderItem)}

              <div className="sb-divider" style={{ paddingTop: collapsed ? '6px' : '10px' }}>
                {!collapsed && <div className="sb-section-label">Outils</div>}
                {toolItems.map(renderItem)}
              </div>
            </>
          )}
        </div>

        <div className="sb-footer" style={{ padding: collapsed ? '12px 8px' : '14px 14px' }}>
          <div className="sb-user-card" style={{ justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '4px 0' : '9px 10px' }}>
            <div className="sb-user-info" style={{ flex: collapsed ? 'none' : 1 }}>
              <Avatar photoUrl={user?.photo_url} prenom={user?.prenom} nom={user?.nom} size={collapsed ? 36 : 38} />
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sb-user-name">{user ? `${user.prenom} ${user.nom}` : 'Invité'}</div>
                  <div className="sb-user-role">{getRoleLabel()}</div>
                </div>
              )}
            </div>
            {!collapsed && (
              <button onClick={logout} className="sb-logout-btn" title="Déconnexion">
                <LogOut size={16} />
              </button>
            )}
          </div>
          {collapsed && (
            <button onClick={logout} className="sb-logout-btn-full" title="Déconnexion">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      <style jsx global>{`
        .sidebar-aside {
          min-height: 100vh; background-color: var(--card-bg); border-right: 1px solid var(--border);
          display: flex; flex-direction: column; flex-shrink: 0;
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 40;
          transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
        }

        .sb-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); min-height: 72px; gap: 8px; }
        .sb-logo-link { display: flex; align-items: center; gap: 10px; text-decoration: none; flex: 1; overflow: hidden; min-width: 0; transition: opacity .2s ease; }
        .sb-logo-link:hover { opacity: 0.85; }
        .sb-brand-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
        .sb-brand-sub { font-size: 9px; color: var(--text-tertiary); letter-spacing: .03em; }

        .sb-collapse-btn, .sb-expand-btn {
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px; border: 1px solid var(--border); background-color: var(--card-bg);
          color: var(--text-secondary); cursor: pointer; flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .sb-collapse-btn { width: 30px; height: 30px; }
        .sb-collapse-btn:hover, .sb-expand-btn:hover { background-color: var(--accent-soft); color: var(--accent); border-color: var(--accent); }
        .sb-expand-btn { width: 26px; height: 26px; margin: 8px auto 0; }

        .sb-nav { flex: 1; overflow-y: auto; }
        .sb-section-label { font-size: 10px; letter-spacing: 0.06em; color: var(--text-tertiary); padding: 4px 10px 8px; text-transform: uppercase; font-weight: 700; }
        .sb-section-label-admin { color: #8B5CF6; }

        .sb-item {
          position: relative; display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 11px; margin-bottom: 3px; cursor: pointer;
          color: var(--text-secondary); background-color: transparent;
          transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .sb-item:hover { background-color: var(--bg-tertiary); transform: translateX(2px); }
        .sb-item[data-active="true"] { background-color: var(--accent-soft); color: var(--accent-text-on-soft); font-weight: 600; transform: none; }
        .sb-item[data-active="true"]:hover { transform: none; }
        .sb-item-indicator { position: absolute; left: -12px; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background-color: var(--accent); }
        .sb-item-label { font-size: 13px; font-weight: 500; white-space: nowrap; }

        .sb-tooltip {
          position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%);
          background-color: var(--text-primary); color: var(--bg-primary, #fff);
          font-size: 12px; font-weight: 500; padding: 5px 10px; border-radius: 7px;
          white-space: nowrap; z-index: 50; pointer-events: none;
          box-shadow: 0 6px 16px rgba(0,0,0,0.18);
          animation: sbTooltipIn .12s ease;
        }
        @keyframes sbTooltipIn { from { opacity: 0; transform: translateY(-50%) translateX(-4px); } to { opacity: 1; transform: translateY(-50%) translateX(0); } }

        .sb-divider { border-top: 1px solid var(--border); margin-top: 8px; }

        .sb-footer { border-top: 1px solid var(--border); }
        .sb-user-card { display: flex; align-items: center; border-radius: 12px; background-color: var(--bg-secondary); transition: background-color .2s ease; }
        .sb-user-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .sb-user-name { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sb-user-role { font-size: 10px; color: var(--text-tertiary); }
        .sb-logout-btn { background: var(--danger-soft); border: none; border-radius: 8px; cursor: pointer; padding: 7px 10px; color: var(--danger); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: filter .2s ease; }
        .sb-logout-btn:hover { filter: brightness(0.95); }
        .sb-logout-btn-full { width: 100%; margin-top: 8px; background: var(--danger-soft); border: none; border-radius: 9px; cursor: pointer; padding: 9px; display: flex; align-items: center; justify-content: center; color: var(--danger); transition: filter .2s ease; }
        .sb-logout-btn-full:hover { filter: brightness(0.95); }

        .sidebar-burger {
          display: none; position: fixed; top: 16px; left: 16px; width: 40px; height: 40px;
          border-radius: 10px; border: 1px solid var(--border); background-color: var(--card-bg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08); z-index: 60; cursor: pointer;
          align-items: center; justify-content: center; color: var(--text-primary);
        }
        .sidebar-overlay {
          display: none; position: fixed; inset: 0; background-color: rgba(0,0,0,0.45);
          backdrop-filter: blur(2px); z-index: 39; transition: opacity 0.3s ease;
        }

        @media (max-width: 640px) {
          .sidebar-burger { display: flex !important; }
          .sidebar-overlay { display: block !important; }
          .sidebar-aside { width: 280px !important; transform: translateX(-100%); transition: transform 0.3s cubic-bezier(.4,0,.2,1) !important; }
          .sidebar-aside.is-open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.18); }
        }
      `}</style>
    </>
  );
}