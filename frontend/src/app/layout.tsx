'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const AUTH_ROUTES = ['/login', '/register'];

const getSidebarCollapsed = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  }
  return false;
};

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(getSidebarCollapsed());
    const handleStorageChange = () => {
      setSidebarCollapsed(getSidebarCollapsed());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const protectedRoutes = ['/dashboard', '/sessions', '/chat', '/reports', '/profile', '/matching', '/disponibilites'];
  const isProtected = protectedRoutes.some(r => pathname === r || pathname.startsWith(r + '/'));

  useEffect(() => {
    if (!loading) {
      if (isProtected && !user) {
        sessionStorage.setItem('redirectAfterLogin', pathname);
        router.push('/login');
      }
      if (user && isAuthRoute) {
        const to = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(to);
      }
    }
  }, [user, loading, pathname, router, isProtected, isAuthRoute]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Utilisateur CONNECTÉ : Sidebar
  if (user) {
    const marginLeft = sidebarCollapsed ? '72px' : '260px';
    return (
      <div className="min-h-screen bg-gray-50" style={{ display: 'flex' }}>
        <Sidebar />
        <main className="flex-1" style={{ marginLeft, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Utilisateur NON CONNECTÉ
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.className}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="m-0 p-0 bg-gray-50">
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}