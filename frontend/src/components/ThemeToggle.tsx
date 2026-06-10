'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)'
      }}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
