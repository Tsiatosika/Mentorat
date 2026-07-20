'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { NotificationBell } from './NotificationBell';
import { LogOut, Sun, Moon, Globe, ChevronDown, Shield } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';

export function TopNavbar({ style }: { style?: React.CSSProperties }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const homeLink = user?.role === 'admin' ? '/admin' : user?.role === 'mentor' ? '/dashboard' : '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangDropdown(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 nav-shell ${scrolled ? 'nav-shell-scrolled' : ''}`}
      style={{ ...style }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={homeLink} className="flex items-center space-x-2.5 nav-brand">
            <Logo size={30} />
            <span className="font-display text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              MentorIPath
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {user?.role === 'admin' && (
              <Link href="/admin" className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium nav-admin-link" title="Administration">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            <div className="relative" ref={langRef}>
              <button
                onClick={() => setShowLangDropdown((v) => !v)}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm nav-icon-btn"
                aria-expanded={showLangDropdown}
                aria-label="Changer de langue"
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium text-xs">{language.toUpperCase()}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl overflow-hidden nav-dropdown">
                  {[
                    { code: 'fr', label: 'Français', flag: '🇫🇷' },
                    { code: 'en', label: 'English', flag: '🇬🇧' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLanguage(l.code as 'fr' | 'en'); setShowLangDropdown(false); }}
                      className="w-full px-3.5 py-2.5 text-sm text-left flex items-center gap-2 nav-dropdown-item"
                      data-active={language === l.code}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg nav-icon-btn relative overflow-hidden"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              aria-label="Changer de thème"
            >
              <Sun className={`w-[18px] h-[18px] theme-icon theme-icon-sun ${theme === 'dark' ? 'theme-icon-hidden' : ''}`} />
              <Moon className={`w-[18px] h-[18px] theme-icon theme-icon-moon ${theme === 'dark' ? '' : 'theme-icon-hidden'}`} />
            </button>

            {user && <NotificationBell />}

            {!user && (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/login" className="px-3.5 py-2 rounded-lg text-sm font-medium nav-icon-btn">
                  {t('common.login')}
                </Link>
                <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-semibold nav-cta">
                  {t('common.register')}
                </Link>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-2 ml-2 pl-2 nav-user-block">
                <Avatar photoUrl={user.photo_url} prenom={user.prenom} nom={user.nom} size={32} />
                <span className="text-sm hidden sm:inline font-medium" style={{ color: 'var(--text-primary)' }}>
                  {user.prenom}
                </span>
                <button onClick={logout} className="p-2 rounded-lg nav-logout-btn" title="Déconnexion" aria-label="Déconnexion">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .nav-shell {
          background-color: color-mix(in srgb, var(--card-bg) 88%, transparent);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          border-bottom: 1px solid transparent;
          transition: border-color .25s ease, box-shadow .25s ease;
        }
        .nav-shell-scrolled {
          border-bottom-color: var(--border);
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }

        .nav-brand { transition: opacity .2s ease, transform .2s ease; }
        .nav-brand:hover { opacity: 0.85; transform: translateY(-1px); }

        .nav-icon-btn { color: var(--text-secondary); transition: background-color .2s ease, color .2s ease; }
        .nav-icon-btn:hover { background-color: var(--bg-tertiary); color: var(--text-primary); }

        .nav-admin-link { color: #8B5CF6; transition: background-color .2s ease; }
        .nav-admin-link:hover { background-color: rgba(139,92,246,0.1); }

        .theme-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(0deg) scale(1); transition: transform .35s cubic-bezier(.34,1.56,.64,1), opacity .25s ease; }
        .theme-icon-sun { color: var(--warm); }
        .theme-icon-moon { color: var(--text-secondary); }
        .theme-icon-hidden { opacity: 0; transform: translate(-50%,-50%) rotate(-70deg) scale(0.4); }

        .nav-dropdown {
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
          animation: navDropdownIn .18s cubic-bezier(.16,1,.3,1);
        }
        @keyframes navDropdownIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .nav-dropdown-item { color: var(--text-secondary); transition: background-color .15s ease; }
        .nav-dropdown-item:hover { background-color: var(--bg-tertiary); }
        .nav-dropdown-item[data-active="true"] { background-color: var(--accent-soft); color: var(--accent-text-on-soft); font-weight: 600; }

        .nav-cta { background-color: var(--accent); color: var(--accent-text-on-soft, #06231D); transition: filter .2s ease, transform .2s ease; }
        .nav-cta:hover { filter: brightness(1.08); transform: translateY(-1px); }

        .nav-user-block { border-left: 1px solid var(--border); }
        .nav-logout-btn { color: var(--danger); transition: background-color .2s ease; }
        .nav-logout-btn:hover { background-color: var(--danger-soft); }
      `}</style>
    </nav>
  );
}