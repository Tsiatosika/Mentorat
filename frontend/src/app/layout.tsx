'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    setCollapsed(saved === 'true');
  }, []);

  // Pages où on n'affiche pas le sidebar
  const hideSidebarPages = ['/login', '/register'];
  const hideSidebar = hideSidebarPages.includes(pathname);
  
  // Pages où on affiche la navbar publique (tout le monde, même sur login/register)
  const publicPages = ['/', '/mentors', '/login', '/register'];
  const isPublicPage = publicPages.includes(pathname) || pathname.startsWith('/mentors/');
  const showPublicNavbar = !user && isPublicPage;
  
  const sidebarWidth = collapsed ? '72px' : '260px';

  // Si utilisateur connecté et pas sur login/register -> afficher sidebar
  if (user && !hideSidebar) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 transition-all duration-300" style={{ marginLeft: sidebarWidth }}>
          {children}
        </main>
      </div>
    );
  }

  // Si page publique (inclut login/register) -> afficher navbar publique
  if (showPublicNavbar) {
    return (
      <>
        <PublicNavbar />
        <main>{children}</main>
      </>
    );
  }

  // Sinon -> afficher juste le contenu
  return <main>{children}</main>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
