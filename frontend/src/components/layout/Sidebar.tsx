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

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isMentor = user?.role === 'mentor';
  const isMentore = user?.role === 'mentore';

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    const isCollapsed = saved === 'true';
    setCollapsed(isCollapsed);
    if (onCollapseChange) onCollapseChange(isCollapsed);
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
    if (onCollapseChange) onCollapseChange(newState);
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : '??';

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
    <aside
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
        overflowX: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '20px 12px' : '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border)',
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
        <button
          onClick={toggleSidebar}
          style={{
            background: 'var(--bg-secondary)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
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

      {/* Outils */}
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

      {/* User profile + logout */}
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
            <div
              style={{
                width: collapsed ? '36px' : '38px',
                height: collapsed ? '36px' : '38px',
                borderRadius: '12px',
                backgroundColor: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: collapsed ? '12px' : '14px',
                fontWeight: 600,
                color: 'var(--accent-text-on-soft)',
              }}
            >
              {initials}
            </div>
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
  );
}