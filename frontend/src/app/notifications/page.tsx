'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, MessageCircle, FileText, UserPlus, ArrowUpRight, Star, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
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
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) setNotifications(res.data.notifications || []);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const openLink = (id: string, lien: string) => {
    markAsRead(id);
    router.push(lien);
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      toast.success('Tout est lu !');
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'session_confirmee':  return <Check className="w-5 h-5" style={{ color: 'var(--success)' }} />;
      case 'session_annulee':    return <X className="w-5 h-5" style={{ color: 'var(--danger)' }} />;
      case 'nouveau_message':    return <MessageCircle className="w-5 h-5" style={{ color: '#3B82F6' }} />;
      case 'nouveau_match':      return <Star className="w-5 h-5" style={{ color: '#8B5CF6' }} />;
      case 'rapport_disponible': return <FileText className="w-5 h-5" style={{ color: 'var(--warm)' }} />;
      default:                   return <Bell className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />;
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'session_confirmee':  return 'Session confirmée';
      case 'session_annulee':    return 'Session annulée';
      case 'nouveau_message':    return 'Message';
      case 'nouveau_match':      return 'Nouveau match';
      case 'rapport_disponible': return 'Rapport disponible';
      default:                   return 'Notification';
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return `Aujourd'hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diff === 1) return `Hier à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.lu) : notifications;
  const unreadCount = notifications.filter(n => !n.lu).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="admin-header" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bell size={16} style={{ color: '#C4B5FD' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#C4B5FD' }}>Centre de notifications</span>
              </div>
              <h1 className="text-3xl font-bold text-white">{t('notif.title')}</h1>
              <p className="text-purple-200 mt-1">
                {notifications.length} notification{notifications.length > 1 ? 's' : ''}
                {unreadCount > 0 && ` • ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
              </p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-6 relative pb-12">
        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{ backgroundColor: filter === f ? 'var(--accent)' : 'var(--card-bg)', color: filter === f ? '#fff' : 'var(--text-secondary)', border: filter === f ? 'none' : '1px solid var(--border)' }}>
              {f === 'all' ? 'Toutes' : `Non lues (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="card p-12 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <Bell className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {filter === 'unread' ? 'Vous avez tout lu !' : 'Vous recevrez des notifications ici.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.lu && markAsRead(notif.id)}
                className="card p-4 transition-all cursor-pointer relative overflow-hidden group"
                style={{
                  backgroundColor: !notif.lu ? 'var(--accent-soft)' : 'var(--card-bg)',
                  border: `1px solid ${!notif.lu ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '16px',
                }}
              >
                {!notif.lu && (
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: 'var(--accent)' }} />
                )}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: getIconBg(notif.type) }}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: getIconBg(notif.type), color: 'var(--text-secondary)' }}>
                            {getTypeLabel(notif.type)}
                          </span>
                          {!notif.lu && (
                            <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }}>Nouveau</span>
                          )}
                        </div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{notif.titre}</p>
                      </div>
                      <span className="text-xs flex items-center gap-1 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                        <Clock className="w-3 h-3" />
                        {formatDate(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{notif.message}</p>
                    {notif.lien && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openLink(notif.id, notif.lien!); }}
                        className="text-xs font-medium flex items-center gap-1 mt-2 hover:underline transition-all hover:gap-2"
                        style={{ color: 'var(--accent)' }}
                      >
                        Voir <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}