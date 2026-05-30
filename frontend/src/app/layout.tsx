'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

// Composant pour protéger les routes
function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Routes publiques
  const publicRoutes = ['/', '/login', '/register', '/mentors'];
  
  // Vérifier si la route actuelle est publique
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/mentors/');
  
  // Routes protégées
  const protectedRoutes = ['/dashboard', '/sessions', '/chat', '/reports', '/profile', '/matching'];
  const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  useEffect(() => {
    if (!loading) {
      // Si route protégée et pas d'utilisateur connecté
      if (isProtectedRoute && !user) {
        // Sauvegarder la page pour rediriger après connexion
        sessionStorage.setItem('redirectAfterLogin', pathname);
        router.push('/login');
      }
      
      // Si déjà connecté sur page login/register
      if (user && (pathname === '/login' || pathname === '/register')) {
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectTo);
      }
    }
  }, [user, loading, pathname, router, isProtectedRoute]);

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNavbarPages = ['/login', '/register'];
  const showNavbar = !hideNavbarPages.includes(pathname);

  return (
    <html lang="fr" className={inter.className}>
      <body className="antialiased">
        <AuthProvider>
          <RouteGuard>
            {showNavbar && <Navbar />}
            {children}
            <Toaster position="top-right" />
          </RouteGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
