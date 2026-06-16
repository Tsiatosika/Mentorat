'use client';

import { Inter } from 'next/font/google';
import './globals.css';
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

  // Vérifier l'authentification une fois que le chargement est terminé
  useEffect(() => {
    if (!loading) {
      setIsCheckingAuth(false);
    }
  }, [loading]);

  // Pages publiques (accessibles sans authentification)
  const publicPages = ['/', '/login', '/register', '/mentors'];
  const isPublicPage = publicPages.some(page => pathname === page || pathname.startsWith('/mentors/'));

  // Pages où le sidebar ne s'affiche pas
  const hideSidebarPages = ['/login', '/register'];
  const isAuthPage = hideSidebarPages.includes(pathname);

  // Rediriger vers login si non connecté sur une page protégée
  useEffect(() => {
    if (!loading && !isCheckingAuth) {
      if (!user && !isPublicPage) {
        // Sauvegarder la page pour rediriger après connexion
        sessionStorage.setItem('redirectAfterLogin', pathname);
        router.push('/login');
      }
    }
  }, [user, loading, isCheckingAuth, isPublicPage, pathname, router]);

  // Si l'utilisateur est connecté, ne pas rediriger vers login depuis l'accueil
  useEffect(() => {
    if (user && pathname === '/login') {
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectTo);
    }
  }, [user, pathname, router]);

  // Afficher le sidebar seulement si:
  // 1. Ce n'est pas une page d'authentification
  // 2. L'utilisateur est connecté
  const showSidebar = !isAuthPage && !!user;

  const sidebarWidth = sidebarCollapsed ? '72px' : '260px';

  // Ne pas afficher le contenu pendant la vérification
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Top Navbar - toujours visible */}
      <TopNavbar />
      
      {/* Sidebar + Content */}
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
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <LayoutContent>{children}</LayoutContent>
              <Toaster position="top-right" />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
