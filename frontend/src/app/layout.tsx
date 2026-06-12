'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideSidebarPages = ['/login', '/register'];
  const showSidebar = !hideSidebarPages.includes(pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  const sidebarWidth = sidebarCollapsed ? '72px' : '260px';

  return (
    <html lang="fr" className={inter.className} suppressHydrationWarning>
      <body className="antialiased">
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <div className="flex min-h-screen">
                {showSidebar && <Sidebar onCollapseChange={setSidebarCollapsed} />}
                <main 
                  className="flex-1 transition-all duration-300"
                  style={{ marginLeft: showSidebar ? sidebarWidth : '0' }}
                >
                  {children}
                </main>
              </div>
              <Toaster position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
