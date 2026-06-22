'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellDot, X, Check, MessageCircle, FileText, UserPlus } from 'lucide-react';
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
      if (!token) {
        setLoading(false);
        return;
      }

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

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lue: true } : n)
      );
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
      case 'nouveau_message':    return <MessageCircle className="w-4 h-4" style={{ color: 'var(--info)' }} />;
      case 'nouveau_match':      return <UserPlus className="w-4 h-4" style={{ color: 'var(--accent)' }} />;
      case 'rapport_disponible': return <FileText className="w-4 h-4" style={{ color: 'var(--warm)' }} />;
      default:                   return <Bell className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />;
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

  const buttonContent = (
    <button
      onClick={toggleDropdown}
      className="relative p-2 rounded-lg transition-colors focus:outline-none w-full flex items-center justify-center"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      title={t('notif.title')}
    >
      {unreadCount > 0 ? (
        <>
          <BellDot className="w-5 h-5" style={{ color: 'var(--warm)' }} />
          <span
            className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
            style={{ backgroundColor: 'var(--danger)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </>
      ) : (
        <Bell className="w-5 h-5" />
      )}
    </button>
  );

  const dropdownContent = isOpen && (
    <div
      className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl z-50 overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center p-4"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Bell className="w-4 h-4" />
          {t('notif.title')}
          {unreadCount > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}
            >
              {unreadCount} {t('notif.unread')}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-medium hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            {t('notif.mark_all')}
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('notif.none')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('notif.none_desc')}</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id, notif.lien)}
              className="p-4 cursor-pointer transition-colors relative"
              style={{
                borderBottom: '1px solid var(--border)',
                backgroundColor: !notif.lue ? 'var(--accent-soft)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (notif.lue) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                if (notif.lue) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {!notif.lue && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    backgroundColor: 'var(--accent)',
                  }}
                />
              )}
              <div className="flex gap-3">
                <div
                  className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm"
                    style={{
                      fontWeight: !notif.lue ? 600 : 400,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {notif.titre}
                  </p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {notif.message}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {formatDate(notif.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div
          className="p-2 text-center"
          style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <button
            onClick={() => { setIsOpen(false); router.push('/notifications'); }}
            className="text-xs font-medium hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            {t('notif.see_all')}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {buttonContent}
      {dropdownContent}
    </div>
  );
}