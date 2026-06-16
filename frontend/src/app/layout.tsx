'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  // Pages où le sidebar ne s'affiche pas
  const hideSidebarPages = ['/login', '/register'];
  const isAuthPage = hideSidebarPages.includes(pathname);
  
  // Afficher le sidebar seulement si:
  // 1. Ce n'est pas une page d'authentification
  // 2. L'utilisateur est connecté
  const showSidebar = !isAuthPage && !!user;

  const sidebarWidth = sidebarCollapsed ? '72px' : '260px';

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
