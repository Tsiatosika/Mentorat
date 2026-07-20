'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { NotificationBell } from './NotificationBell';
import { LogOut, Sun, Moon, Globe, ChevronDown, Info, Shield } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';

export function TopNavbar({ style }: { style?: React.CSSProperties }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border)', ...style }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Logo size={32} />
            <span className="font-display text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>MentorIPath</span>
            <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>UAZ — Informatique</span>
          </Link>

          <div className="flex items-center space-x-2">
            {/* Admin link */}
            {user?.role === 'admin' && (
              <Link href="/admin" className="hidden md:flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ color: '#8B5CF6' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.1)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')} title="Administration">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            <Link href="/about" className="hidden md:flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')} title={t('nav.about')}>
              <Info className="w-4 h-4" />
              <span>{t('nav.about')}</span>
            </Link>

            <div className="relative">
              <button onClick={() => setShowLangDropdown(!showLangDropdown)} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <Globe className="w-4 h-4" />
                <span className="font-medium">{language.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-32 rounded-lg shadow-lg z-50 overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                  <button onClick={() => { setLanguage('fr'); setShowLangDropdown(false); }} className="w-full px-4 py-2 text-sm text-left transition-colors" style={{ backgroundColor: language === 'fr' ? 'var(--accent-soft)' : 'transparent', color: language === 'fr' ? 'var(--accent-text-on-soft)' : 'var(--text-secondary)' }}>🇫🇷 Français</button>
                  <button onClick={() => { setLanguage('en'); setShowLangDropdown(false); }} className="w-full px-4 py-2 text-sm text-left transition-colors" style={{ backgroundColor: language === 'en' ? 'var(--accent-soft)' : 'transparent', color: language === 'en' ? 'var(--accent-text-on-soft)' : 'var(--text-secondary)' }}>🇬🇧 English</button>
                </div>
              )}
            </div>

            <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
              {theme === 'dark' ? <Sun className="w-5 h-5" style={{ color: 'var(--warm)' }} /> : <Moon className="w-5 h-5" />}
            </button>

            {user && <NotificationBell />}

            {!user && (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>Connexion</Link>
                <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm" style={{ backgroundColor: 'var(--accent)', color: theme === 'dark' ? '#06231D' : '#FFFFFF' }}>Inscription</Link>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-2 ml-2">
                <Avatar photoUrl={user.photo_url} prenom={user.prenom} nom={user.nom} size={32} />
                <span className="text-sm hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>{user.prenom}</span>
                <button onClick={logout} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--danger)' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-soft)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')} title="Déconnexion">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}