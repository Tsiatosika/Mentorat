'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellDot, X, Check, MessageCircle, FileText, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enGB } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

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
      case 'session_confirmee':  return <Check className="w-4 h-4 text-green-500" />;
      case 'session_annulee':    return <X className="w-4 h-4 text-red-500" />;
      case 'nouveau_message':    return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'nouveau_match':      return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'rapport_disponible': return <FileText className="w-4 h-4 text-orange-500" />;
      default:                   return <Bell className="w-4 h-4 text-gray-500" />;
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
      className="relative p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none w-full flex items-center justify-center"
      title={t('notif.title')}
    >
      {unreadCount > 0 ? (
        <>
          <BellDot className="w-5 h-5 text-white" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </>
      ) : (
        <Bell className="w-5 h-5 text-white" />
      )}
    </button>
  );

  const dropdownContent = isOpen && (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="w-4 h-4" />
          {t('notif.title')}
          {unreadCount > 0 && (
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full">
              {unreadCount} {t('notif.unread')}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
          >
            {t('notif.mark_all')}
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('common.loading')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('notif.none')}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{t('notif.none_desc')}</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id, notif.lien)}
              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${
                !notif.lue ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.lue ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {notif.titre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatDate(notif.created_at)}
                  </p>
                </div>
                {!notif.lue && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center">
          <button
            onClick={() => { setIsOpen(false); router.push('/notifications'); }}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
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