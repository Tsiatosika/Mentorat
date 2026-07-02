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
  variable: '--font-inter',
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Initialisation
  useEffect(() => {
    setMounted(true);
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

  // Pages publiques (accessibles sans connexion)
  const publicPages = ['/', '/login', '/register', '/mentors', '/about', '/domaines'];
  const isPublicPage = publicPages.some(
    page => pathname === page || pathname.startsWith('/mentors/')
  );

  // Pages d'authentification (sans sidebar)
  const authPages = ['/login', '/register', '/complete-profile'];
  const isAuthPage = authPages.includes(pathname);

  // Redirection si non connecté
  useEffect(() => {
    if (!loading && !isCheckingAuth && !user && !isPublicPage) {
      sessionStorage.setItem('redirectAfterLogin', pathname);
      router.push('/login');
    }
  }, [user, loading, isCheckingAuth, isPublicPage, pathname, router]);

  // Redirection vers complete-profile si pas de rôle
  useEffect(() => {
    if (user && !user.role && pathname !== '/complete-profile') {
      router.push('/complete-profile');
    }
  }, [user, pathname, router]);

  // Redirection après connexion
  useEffect(() => {
    if (user && user.role && pathname === '/login') {
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectTo);
    }
  }, [user, pathname, router]);

  // Sidebar visible uniquement si connecté avec rôle
  const showSidebar = !isAuthPage && !!user && !!user.role;
  const sidebarWidth = sidebarCollapsed ? '72px' : '260px';

  // État de chargement
  if (!mounted || loading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div 
            className="w-12 h-12 rounded-full animate-spin mx-auto mb-4"
            style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirection si en attente de rôle
  const isWaitingForRole = !!user && !user.role && pathname !== '/complete-profile';
  if (isWaitingForRole) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div 
            className="w-12 h-12 rounded-full animate-spin mx-auto mb-4"
            style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Configuration de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* TopNavbar */}
      <div 
        className="transition-all duration-300"
        style={{ 
          marginLeft: showSidebar ? sidebarWidth : '0',
        }}
      >
        <TopNavbar />
      </div>

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar onCollapseChange={setSidebarCollapsed} />
        )}

        {/* Contenu principal */}
        <main
          className="flex-1 transition-all duration-300 min-h-[calc(100vh-64px)]"
          style={{ 
            marginLeft: showSidebar ? sidebarWidth : '0',
          }}
        >
          <div className="p-4 sm:p-6 lg:p-8">
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
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <LayoutContent>{children}</LayoutContent>
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-xl)',
                      padding: '14px 16px',
                      fontSize: '14px',
                    },
                    success: {
                      iconTheme: {
                        primary: 'var(--success)',
                        secondary: 'white',
                      },
                      style: {
                        borderLeft: '4px solid var(--success)',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: 'var(--danger)',
                        secondary: 'white',
                      },
                      style: {
                        borderLeft: '4px solid var(--danger)',
                      },
                    },
                  }}
                />
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}