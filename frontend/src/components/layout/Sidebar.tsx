'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

// Icônes Tabler
const icons = {
  home: 'ti-home',
  dashboard: 'ti-layout-dashboard',
  users: 'ti-users',
  calendar: 'ti-calendar',
  message: 'ti-message-circle',
  file: 'ti-file-text',
  brain: 'ti-brain',
  user: 'ti-user-circle',
  clock: 'ti-clock',
  logout: 'ti-logout',
  menu: 'ti-menu-2',
  chevronLeft: 'ti-chevron-left',
  chevronRight: 'ti-chevron-right',
  school: 'ti-school',
};

const menuItems = [
  { label: 'Accueil',    href: '/',          icon: icons.home },
  { label: 'Dashboard',  href: '/dashboard', icon: icons.dashboard },
  { label: 'Mentors',    href: '/mentors',   icon: icons.users },
  { label: 'Sessions',   href: '/sessions',  icon: icons.calendar, badge: 'sessions' },
  { label: 'Chat',       href: '/chat',      icon: icons.message, badge: 'messages' },
  { label: 'Rapports',   href: '/reports',   icon: icons.file },
];

const toolItems = [
  { label: 'Matching IA', href: '/matching', icon: icons.brain },
  { label: 'Mon profil',  href: '/profile',  icon: icons.user },
];

// Stocker l'état du collapse dans localStorage
const getInitialCollapsed = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  }
  return false;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(getInitialCollapsed());
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : '??';

  const sidebarWidth = collapsed ? '72px' : '260px';

  return (
    <>
      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0A3B8A 0%, #0d4aa8 100%)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.08)',
      }}>

        {/* Logo + toggle button */}
        <div style={{
          padding: collapsed ? '20px 12px' : '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: collapsed ? '0' : '12px',
          borderBottom: '0.5px solid rgba(255,255,255,0.12)',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flex: 1 }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'rgba(59, 130, 246, 0.9)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            }}>
              <i className={`ti ${icons.school}`} style={{ fontSize: '18px', color: '#fff' }} aria-hidden="true" />
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', letterSpacing: '-0.3px' }}>MentorIPath</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>UAZ — Informatique</div>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <i className={`ti ${collapsed ? icons.chevronRight : icons.chevronLeft}`} style={{ fontSize: '16px' }} aria-hidden="true" />
          </button>
        </div>

        {/* Navigation principale */}
        <div style={{ padding: collapsed ? '16px 8px' : '20px 12px', flex: 1 }}>
          {!collapsed && (
            <div style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0 10px 12px',
            }}>
              Navigation
            </div>
          )}
          {menuItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? '0' : '12px',
                  padding: collapsed ? '12px' : '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  transition: 'all 0.2s',
                  background: active ? 'rgba(59, 130, 246, 0.9)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: '18px', flexShrink: 0 }} aria-hidden="true" />
                  {!collapsed && (
                    <>
                      <span style={{ fontSize: '13px', fontWeight: 500, flex: 1 }}>{item.label}</span>
                      {item.badge === 'messages' && (
                        <span style={{
                          background: '#EF4444',
                          color: '#fff',
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '20px',
                          fontWeight: 600,
                        }}>3</span>
                      )}
                      {item.badge === 'sessions' && (
                        <span style={{
                          background: '#F59E0B',
                          color: '#fff',
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '20px',
                          fontWeight: 600,
                        }}>2</span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '8px',
                      height: '8px',
                      background: '#EF4444',
                      borderRadius: '50%',
                    }} />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Outils */}
        <div style={{ padding: collapsed ? '8px 8px' : '12px 12px' }}>
          {!collapsed && (
            <div style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0 10px 12px',
            }}>
              Outils IA
            </div>
          )}
          {toolItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? '0' : '12px',
                  padding: collapsed ? '12px' : '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  transition: 'all 0.2s',
                  background: active ? 'rgba(59, 130, 246, 0.9)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: '18px', flexShrink: 0 }} aria-hidden="true" />
                  {!collapsed && <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </div>

        {/* User profile + logout */}
        <div style={{
          marginTop: 'auto',
          padding: collapsed ? '12px 12px' : '16px 16px',
          borderTop: '0.5px solid rgba(255,255,255,0.12)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: collapsed ? '0' : '12px',
            padding: collapsed ? '0' : '10px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.06)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? '0' : '12px',
              flex: collapsed ? 'none' : 1,
            }}>
              <div style={{
                width: collapsed ? '36px' : '38px',
                height: collapsed ? '36px' : '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: collapsed ? '12px' : '14px',
                fontWeight: 600,
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                {initials}
              </div>
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {user ? `${user.prenom} ${user.nom}` : 'Invité'}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '2px',
                  }}>
                    {user?.role === 'mentor' ? 'Mentor' : 'Mentoré(e)'}
                  </div>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={logout}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#F87171',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
              >
                <i className={`ti ${icons.logout}`} style={{ fontSize: '14px' }} aria-hidden="true" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={logout}
              style={{
                width: '100%',
                marginTop: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F87171',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            >
              <i className={`ti ${icons.logout}`} style={{ fontSize: '18px' }} aria-hidden="true" />
            </button>
          )}
        </div>
      </aside>

      {/* Overlay pour mobile quand sidebar est ouverte */}
      {!collapsed && window.innerWidth < 768 && (
        <div
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}
    </>
  );
}