'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, MessageCircle, Calendar, FileText, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  lien?: string;
  lue: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchNotifications();
  }, [user, router]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('common.error'));
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
      if (lien) {
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
      toast.success(t('notif.mark_all_success'));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('common.error'));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'session_confirmee': return <Check className="w-5 h-5 text-green-500" />;
      case 'session_annulee':   return <X className="w-5 h-5 text-red-500" />;
      case 'nouveau_message':   return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'nouveau_match':     return <UserPlus className="w-5 h-5 text-purple-500" />;
      case 'rapport_disponible':return <FileText className="w-5 h-5 text-orange-500" />;
      default:                  return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.lue).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="w-6 h-6" />
                {t('notif.title')}
              </h1>
              <p className="text-indigo-100 mt-1">
                {notifications.length} notification{notifications.length > 1 ? 's' : ''}
                {unreadCount > 0 && ` • ${unreadCount} ${t('notif.unread')}`}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                {t('notif.mark_all')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {notifications.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'var(--card-bg)' }}>
            <Bell className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('notif.none')}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('notif.none_desc')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id, notif.lien)}
                className={`rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-all ${
                  !notif.lue ? 'border-l-4 border-indigo-500' : ''
                }`}
                style={{ backgroundColor: 'var(--card-bg)' }}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${!notif.lue ? 'font-semibold' : ''}`} style={{ color: 'var(--text-primary)' }}>
                      {notif.titre}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {notif.message}
                    </p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(notif.created_at)}
                    </p>
                  </div>
                  {!notif.lue && (
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-indigo-600 rounded-full mt-2" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}