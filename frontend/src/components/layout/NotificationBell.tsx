'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
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
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          padding: collapsed ? '10px' : '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          width: collapsed ? '36px' : '36px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
      >
        <i className="ti ti-bell" style={{ fontSize: '18px', color: '#fff' }} aria-hidden="true" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#EF4444',
            color: '#fff',
            fontSize: '9px',
            fontWeight: 'bold',
            padding: '2px 5px',
            borderRadius: '20px',
            minWidth: '16px',
            textAlign: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: '45px',
            left: collapsed ? '60px' : '240px',
            width: '320px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 999,
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              background: '#fff',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    fontSize: '11px',
                    color: '#4f46e5',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Tout marquer lu
                </button>
              )}
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
                  Aucune notification
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id, notif.lien)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      background: notif.lue ? '#fff' : '#eef2ff',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = notif.lue ? '#fff' : '#eef2ff'}
                  >
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>{getIcon(notif.type)}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: '#1f2937', marginBottom: '2px' }}>
                          {notif.titre}
                        </p>
                        <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                          {notif.message}
                        </p>
                        <p style={{ fontSize: '10px', color: '#9ca3af' }}>
                          {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {!notif.lue && (
                        <div style={{ width: '8px', height: '8px', background: '#4f46e5', borderRadius: '50%', marginTop: '6px' }} />
                      )}
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
