'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import { usePathname } from 'next/navigation';

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
  // Pages où la navbar ne doit pas s'afficher
  const hideNavbarPages = ['/login', '/register'];
  const showNavbar = !hideNavbarPages.includes(pathname);

  return (
    <html lang="fr" className={inter.className}>
      <body className="antialiased">
        <AuthProvider>
          {showNavbar && <Navbar />}
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}