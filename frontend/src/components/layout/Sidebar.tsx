'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { 
  Home, LayoutDashboard, Users, Calendar, MessageCircle, FileText, 
  Brain, UserCircle, Clock, LogOut, ChevronLeft, ChevronRight, 
  GraduationCap
} from 'lucide-react';

const menuItems = [
  { label: 'Accueil', href: '/', icon: Home },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Mentors', href: '/mentors', icon: Users },
  { label: 'Sessions', href: '/sessions', icon: Calendar },
  { label: 'Chat', href: '/chat', icon: MessageCircle },
  { label: 'Rapports', href: '/reports', icon: FileText },
];

const toolItems = [
  { label: 'Matching IA', href: '/matching', icon: Brain },
  { label: 'Mon profil', href: '/profile', icon: UserCircle },
];

// Pour les mentors uniquement
const mentorItems = [
  { label: 'Mes disponibilités', href: '/disponibilites', icon: Clock },
];

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapseChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isMentor = user?.role === 'mentor';

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

  return (
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
      bottom: 0,
      zIndex: 40,
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.08)',
      overflowX: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 12px' : '20px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '0.5px solid rgba(255,255,255,0.12)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'rgba(59, 130, 246, 0.9)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>MentorIPath</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.45)' }}>UAZ — Informatique</div>
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
          }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <div style={{ padding: collapsed ? '16px 8px' : '20px 12px', flex: 1, overflowY: 'auto' }}>
        {!collapsed && (
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', padding: '0 10px 12px' }}>
            Navigation
          </div>
        )}
        {menuItems.map(item => {
          const Icon = item.icon;
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
                marginBottom: '4px',
                background: active ? 'rgba(59, 130, 246, 0.9)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Outils IA */}
      <div style={{ padding: collapsed ? '8px 8px' : '12px 12px' }}>
        {!collapsed && (
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', padding: '0 10px 12px' }}>
            Outils IA
          </div>
        )}
        {toolItems.map(item => {
          const Icon = item.icon;
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
                marginBottom: '4px',
                background: active ? 'rgba(59, 130, 246, 0.9)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s',
              }}>
                <Icon className="w-5 h-5" />
                {!collapsed && <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</span>}
              </div>
            </Link>
          );
        })}
        
        {/* Menu pour les mentors */}
        {isMentor && (
          <>
            {!collapsed && (
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', padding: '0 10px 12px', marginTop: '12px' }}>
                Mentor
              </div>
            )}
            {mentorItems.map(item => {
              const Icon = item.icon;
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
                    marginBottom: '4px',
                    background: active ? 'rgba(59, 130, 246, 0.9)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.2s',
                  }}>
                    <Icon className="w-5 h-5" />
                    {!collapsed && <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>

      {/* User profile + logout */}
      <div style={{
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
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '12px', flex: collapsed ? 'none' : 1 }}>
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
            }}>
              {initials}
            </div>
            {!collapsed && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                  {user ? `${user.prenom} ${user.nom}` : 'Invité'}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                  {user?.role === 'mentor' ? 'Mentor' : 'Mentoré(e)'}
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={logout} style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '6px 10px',
              color: '#F87171',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={logout} style={{
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
          }}>
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
