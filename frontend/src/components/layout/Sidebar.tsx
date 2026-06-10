'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';
import {
  IconHome,
  IconLayoutDashboard,
  IconUsers,
  IconCalendar,
  IconMessageCircle,
  IconFileText,
  IconBrain,
  IconUserCircle,
  IconLogout,
  IconChevronLeft,
  IconChevronRight,
  IconSchool,
  IconSun,
  IconMoon,
} from '@tabler/icons-react';

const menuItems = [
  { label: 'Accueil', href: '/', icon: IconHome },
  { label: 'Dashboard', href: '/dashboard', icon: IconLayoutDashboard },
  { label: 'Mentors', href: '/mentors', icon: IconUsers },
  { label: 'Sessions', href: '/sessions', icon: IconCalendar },
  { label: 'Chat', href: '/chat', icon: IconMessageCircle },
  { label: 'Rapports', href: '/reports', icon: IconFileText },
];

const toolItems = [
  { label: 'Matching IA', href: '/matching', icon: IconBrain },
  { label: 'Mon profil', href: '/profile', icon: IconUserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    setCollapsed(saved === 'true');
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const initials = user ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() : '??';

  if (!mounted) return null;

  const ThemeIcon = theme === 'dark' ? IconMoon : IconSun;

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-blue-900 to-indigo-900 transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center p-4' : 'justify-between p-5'} flex-shrink-0`}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <IconSchool className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-white font-bold text-sm">MentorIPath</div>
              <div className="text-blue-200 text-[10px]">UAZ — Informatique</div>
            </div>
          )}
        </Link>
        <button onClick={toggleSidebar} className="text-white/70 hover:text-white">
          {collapsed ? <IconChevronRight className="w-5 h-5" /> : <IconChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu principal - prend tout l'espace disponible */}
      <div className="flex-1 overflow-y-auto">
        {/* Theme Toggle */}
        <div className={`${collapsed ? 'px-3 py-2 flex justify-center' : 'px-5 py-2'}`}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <ThemeIcon className="w-5 h-5" />
            {!collapsed && <span className="text-sm">{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>}
          </button>
        </div>

        {/* Menu Navigation */}
        <div className="mt-4 px-3">
          {!collapsed && <div className="text-blue-200 text-[10px] uppercase tracking-wider px-3 mb-2">Navigation</div>}
          {menuItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${active ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-white/10'}`}>
                  <Icon className="w-5 h-5" />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Outils IA */}
        <div className="mt-6 px-3">
          {!collapsed && <div className="text-blue-200 text-[10px] uppercase tracking-wider px-3 mb-2">Outils IA</div>}
          {toolItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${active ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-white/10'}`}>
                  <Icon className="w-5 h-5" />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Section basse - Notification et Profil */}
      <div className="flex-shrink-0 border-t border-white/10">
        {/* Notification */}
        <div className={`${collapsed ? 'py-3 flex justify-center' : 'px-5 py-3'}`}>
          <NotificationBell collapsed={collapsed} />
        </div>

        {/* User profile */}
        <div className={`p-4 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{user?.prenom} {user?.nom}</div>
                  <div className="text-blue-200 text-xs">{user?.role === 'mentor' ? 'Mentor' : 'Mentoré'}</div>
                </div>
                <button onClick={logout} className="text-white/70 hover:text-white">
                  <IconLogout className="w-5 h-5" />
                </button>
              </>
            )}
            {collapsed && (
              <button onClick={logout} className="text-white/70 hover:text-white">
                <IconLogout className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
