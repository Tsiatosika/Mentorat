'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconBell, IconBellFilled } from '@tabler/icons-react';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.lue).length || 0);
      }
    } catch (error) {
      console.error('Erreur notifications:', error);
    }
  };

  const markAsRead = async (id: string, lien?: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
      if (lien) router.push(lien);
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'session_confirmee': return '✅';
      case 'session_annulee': return '❌';
      case 'nouveau_message': return '💬';
      case 'nouveau_match': return '🎯';
      case 'rapport_disponible': return '📄';
      default: return '🔔';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors w-full flex items-center justify-center"
      >
        {unreadCount > 0 ? (
          <>
            <IconBellFilled className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <IconBell className="w-5 h-5 text-white" />
        )}
        {!collapsed && <span className="ml-2 text-sm text-white">Notifications</span>}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Aucune notification
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id, notif.lien)}
                    className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notif.lue ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                  >
                    <div className="flex gap-2">
                      <span className="text-lg">{getIcon(notif.type)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.titre}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(notif.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      {!notif.lue && <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
