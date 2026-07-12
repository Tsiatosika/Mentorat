'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, MessageCircle, FileText, UserPlus, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  lien?: string;
  lu: boolean;
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

  // Marque comme lu SANS naviguer — reste sur la page
  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lu: true } : n)
      );
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Ouvre le lien associé (action explicite et séparée)
  const openLink = (id: string, lien: string) => {
    markAsRead(id);
    router.push(lien);
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      toast.success(t('notif.mark_all_success'));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('common.error'));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'session_confirmee': return <Check className="w-5 h-5" style={{ color: 'var(--success)' }} />;
      case 'session_annulee':   return <X className="w-5 h-5" style={{ color: 'var(--danger)' }} />;
      case 'nouveau_message':   return <MessageCircle className="w-5 h-5" style={{ color: 'var(--info)' }} />;
      case 'nouveau_match':     return <UserPlus className="w-5 h-5" style={{ color: 'var(--accent)' }} />;
      case 'rapport_disponible':return <FileText className="w-5 h-5" style={{ color: 'var(--warm)' }} />;
      default:                  return <Bell className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />;
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
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.lu).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Bell className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              {t('notif.title')}
            </h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              {notifications.length} notification{notifications.length > 1 ? 's' : ''}
              {unreadCount > 0 && ` • ${unreadCount} ${t('notif.unread')}`}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}
            >
              {t('notif.mark_all')}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        {notifications.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('notif.none')}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{t('notif.none_desc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.lu && markAsRead(notif.id)}
                className={`card p-4 transition-all relative ${!notif.lu ? 'bookmark cursor-pointer' : ''}`}
              >
                <div className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-medium"
                      style={{ color: 'var(--text-primary)', fontWeight: !notif.lu ? 600 : 500 }}
                    >
                      {notif.titre}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {formatDate(notif.created_at)}
                      </p>
                      {notif.lien && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLink(notif.id, notif.lien!);
                          }}
                          className="text-xs font-medium flex items-center gap-1 hover:underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          Voir
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  {!notif.lu && (
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 rounded-full mt-2" style={{ backgroundColor: 'var(--accent)' }} />
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