'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellDot, X, Check, MessageCircle, FileText, UserPlus, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enGB } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  lien?: string;
  lue: boolean;
  created_at: string;
}

export function NotificationBell({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur réseau');
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.lue).length || 0);
      }
    } catch (error) {
      console.error('Erreur notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, lien?: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (lien) {
        setIsOpen(false);
        router.push(lien);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'session_confirmee':  return <Check className="w-4 h-4" style={{ color: 'var(--success)' }} />;
      case 'session_annulee':    return <X className="w-4 h-4" style={{ color: 'var(--danger)' }} />;
      case 'nouveau_message':    return <MessageCircle className="w-4 h-4" style={{ color: '#3B82F6' }} />;
      case 'nouveau_match':      return <Star className="w-4 h-4" style={{ color: '#8B5CF6' }} />;
      case 'rapport_disponible': return <FileText className="w-4 h-4" style={{ color: 'var(--warm)' }} />;
      default:                   return <Bell className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'session_confirmee':  return 'var(--success-soft)';
      case 'session_annulee':    return 'var(--danger-soft)';
      case 'nouveau_message':    return 'rgba(59,130,246,0.12)';
      case 'nouveau_match':      return 'rgba(139,92,246,0.12)';
      case 'rapport_disponible': return 'var(--warm-soft)';
      default:                   return 'var(--bg-secondary)';
    }
  };

  const formatDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: language === 'fr' ? fr : enGB,
      });
    } catch {
      return language === 'fr' ? 'récemment' : 'recently';
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) fetchNotifications();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-lg transition-all hover:bg-[var(--bg-secondary)] hover:scale-105 active:scale-95"
        style={{ color: 'var(--text-secondary)' }}
        title={t('notif.title')}
      >
        {unreadCount > 0 ? (
          <>
            <BellDot className="w-5 h-5" style={{ color: 'var(--warm)' }} />
            <span
              className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse"
              style={{ backgroundColor: 'var(--danger)' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <Bell className="w-5 h-5" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in-up"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Bell className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              {t('notif.title')}
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}>
                  {unreadCount}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                Tout lire
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <Bell className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Aucune notification</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Vous êtes à jour !</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id, notif.lien)}
                  className="px-4 py-3 cursor-pointer transition-all relative flex items-start gap-3 hover:bg-[var(--bg-secondary)]"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  {!notif.lue && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                  )}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: getIconBg(notif.type) }}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>{notif.titre}</p>
                      {!notif.lue && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: 'var(--accent)' }} />}
                    </div>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{notif.message}</p>
                    <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-tertiary)' }}>{formatDate(notif.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 text-center" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => { setIsOpen(false); router.push('/notifications'); }}
                className="text-xs font-medium hover:underline w-full py-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}