'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home, Users, Calendar, MessageCircle, FileText,
  LogOut, Menu, X, LayoutDashboard, UserCircle, Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { BACKEND_URL } from '@/services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getPhotoUrl = (url: string) =>
    url.startsWith('http') ? url : `${BACKEND_URL}${url}`;

  const publicNavItems = [
    { href: '/',        label: 'Accueil', icon: Home },
    { href: '/mentors', label: 'Mentors', icon: Users },
  ];

  const privateNavItems = user ? [
    { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
    { href: '/sessions',  label: 'Sessions',   icon: Calendar },
    { href: '/chat',      label: 'Chat',        icon: MessageCircle },
    { href: '/reports',   label: 'Rapports',   icon: FileText },
    { href: '/matching',  label: 'Matching IA', icon: Sparkles },
    { href: '/profile',   label: 'Profil',      icon: UserCircle },
  ] : [];

  const navItems = [...publicNavItems, ...privateNavItems];
  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-white border-b border-[#E5EAF2] sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 bg-[#0A3B8A] rounded-lg flex items-center justify-center">
              <span className="text-lg">🎓</span>
            </div>
            <span className="font-bold text-lg text-[#1E3A5F]">MentorIA</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    active
                      ? 'bg-blue-50 text-[#3B82F6] border border-blue-100'
                      : 'text-[#6B82A4] hover:bg-[#F5F7FB] hover:text-[#1E3A5F]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F7FB] border border-[#E5EAF2] rounded-full">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[#0A3B8A] flex items-center justify-center flex-shrink-0">
                    {user.photo_url
                      ? <img src={getPhotoUrl(user.photo_url)} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xs font-bold text-white">{user.prenom?.[0]}{user.nom?.[0]}</span>
                    }
                  </div>
                  <span className="text-sm font-medium text-[#1E3A5F]">{user.prenom} {user.nom}</span>
                  <span className="text-xs text-[#6B82A4]">
                    ({user.role === 'mentor' ? 'Mentor' : 'Mentoré'})
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[#1E3A5F] hover:bg-[#F5F7FB] border border-[#E5EAF2] transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm bg-[#0A3B8A] text-white font-semibold hover:bg-[#0d4aa8] transition-colors"
                >
                  Inscription
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#6B82A4] hover:bg-[#F5F7FB]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#E5EAF2]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-[#3B82F6]'
                      : 'text-[#6B82A4] hover:bg-[#F5F7FB] hover:text-[#1E3A5F]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            {user ? (
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-red-500 hover:bg-red-50 mt-2 font-medium"
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </button>
            ) : (
              <div className="flex gap-2 px-4 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-center text-sm font-medium text-[#1E3A5F] border border-[#E5EAF2] hover:bg-[#F5F7FB]"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-center text-sm font-semibold bg-[#0A3B8A] text-white"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 