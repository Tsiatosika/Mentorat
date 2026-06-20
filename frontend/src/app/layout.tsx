'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      setIsCheckingAuth(false);
    }
  }, [loading]);

  const publicPages = ['/', '/login', '/register', '/mentors', '/complete-profile'];
  const isPublicPage = publicPages.some(page => pathname === page || pathname.startsWith('/mentors/'));

  const hideSidebarPages = ['/login', '/register', '/complete-profile'];
  const isAuthPage = hideSidebarPages.includes(pathname);

  useEffect(() => {
    if (!loading && !isCheckingAuth) {
      if (!user && !isPublicPage) {
        sessionStorage.setItem('redirectAfterLogin', pathname);
        router.push('/login');
      }
    }
  }, [user, loading, isCheckingAuth, isPublicPage, pathname, router]);

  // Redirige vers complete-profile si l'utilisateur Google n'a pas encore de rôle
  useEffect(() => {
    if (user && !user.role && pathname !== '/complete-profile') {
      router.push('/complete-profile');
    }
  }, [user, pathname, router]);

  useEffect(() => {
    if (user && user.role && pathname === '/login') {
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectTo);
    }
  }, [user, pathname, router]);

  // Sidebar visible uniquement si l'utilisateur est connecté ET a un rôle confirmé
  const showSidebar = !isAuthPage && !!user && !!user.role;

  const sidebarWidth = sidebarCollapsed ? '72px' : '260px';

  if (loading || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // Bloque le rendu du contenu protégé tant que l'utilisateur n'a pas de rôle,
  // sauf sur la page complete-profile elle-même — évite tout appel API prématuré
  const isWaitingForRole = !!user && !user.role && pathname !== '/complete-profile';
  if (isWaitingForRole) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <TopNavbar />

      <div className="flex">
        {showSidebar && <Sidebar onCollapseChange={setSidebarCollapsed} />}
        <main
          className="flex-1 transition-all duration-300"
          style={{ marginLeft: showSidebar ? sidebarWidth : '0' }}
        >
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.className} suppressHydrationWarning>
      <body className="antialiased">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <LayoutContent>{children}</LayoutContent>
                <Toaster position="top-right" />
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}