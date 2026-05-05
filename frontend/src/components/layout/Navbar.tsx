'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Users, Calendar, MessageCircle, FileText, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation pour tous les utilisateurs
  const publicNavItems = [
    { href: '/', label: 'Accueil', icon: Home },
    { href: '/mentors', label: 'Mentors', icon: Users },
  ];

  // Navigation pour utilisateur connecté
  const privateNavItems = user ? [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/sessions', label: 'Sessions', icon: Calendar },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/reports', label: 'Rapports', icon: FileText },
  ] : [];

  const navItems = [...publicNavItems, ...privateNavItems];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - à gauche */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-lg">🎓</span>
            </div>
            <span className="font-bold text-lg text-gray-800">Mentorat</span>
          </Link>

          {/* Navigation Links - desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Boutons - à droite */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {user.prenom?.[0]}{user.nom?.[0]}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">
                    {user.prenom} {user.nom}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({user.role === 'mentor' ? 'Mentor' : 'Mentoré'})
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                  Inscription
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
                    active
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 mt-2"
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </button>
            ) : (
              <div className="flex flex-col gap-2 px-4 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-lg text-center text-gray-600 hover:bg-gray-100"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-lg text-center bg-indigo-600 text-white"
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