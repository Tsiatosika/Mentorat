'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sessionAPI, messageAPI, BACKEND_URL } from '@/services/api';
import toast from 'react-hot-toast';

interface Session {
  id: string;
  sujet: string;
  date_debut: string;
  statut: string;
  mentor_nom?: string;
  mentor_prenom?: string;
  mentor_photo_url?: string;
  mentore_nom?: string;
  mentore_prenom?: string;
  mentore_photo_url?: string;
}

const AVATAR_COLORS = ['#0A2463', '#1D4ED8', '#7C3AED', '#059669', '#DC2626'];

function colorForName(name: string) {
  const code = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function getFullUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BACKEND_URL}${url}`;
}

const STATUS_LABEL: Record<string, string> = {
  confirmee: 'Confirmée',
  en_cours: 'En cours',
  terminee: 'Terminée',
};

function Avatar({ name, photoUrl, size = 48 }: { name: string; photoUrl?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const bg = colorForName(name || 'x');

  if (photoUrl && !failed) {
    return (
      <img
        src={getFullUrl(photoUrl)}
        alt={name}
        onError={() => setFailed(true)}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.34 }}
    >
      {initials}
    </div>
  );
}

export default function ChatListPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchSessions();
  }, [user, router]);

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getAll();
      const all = response.data.sessions || [];
      const active = all.filter((s: Session) =>
        ['confirmee', 'en_cours', 'terminee'].includes(s.statut)
      );
      setSessions(active);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long' });
    return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short' });
  };

  const getOtherPerson = (s: Session) =>
    user?.role === 'mentor'
      ? `${s.mentore_prenom ?? ''} ${s.mentore_nom ?? ''}`.trim()
      : `${s.mentor_prenom ?? ''} ${s.mentor_nom ?? ''}`.trim();

  const getOtherPhoto = (s: Session) =>
    user?.role === 'mentor' ? s.mentore_photo_url : s.mentor_photo_url;

  const statusDot: Record<string, string> = {
    confirmee: '#22C55E', en_cours: '#3B82F6', terminee: '#9CA3AF',
  };

  const filtered = sessions.filter(s =>
    getOtherPerson(s).toLowerCase().includes(search.toLowerCase()) ||
    s.sujet.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-full flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Messages
        </h1>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-shadow focus:ring-2"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--accent)',
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <MessageCircle className="w-9 h-9" style={{ color: 'var(--text-tertiary)' }} strokeWidth={1.5} />
            </div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Aucune conversation</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Réservez une session pour commencer à discuter
            </p>
            {user?.role === 'mentore' && (
              <Link href="/mentors"
                className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
                Trouver un mentor
              </Link>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((session) => {
              const other = getOtherPerson(session);
              const otherPhoto = getOtherPhoto(session);
              const unread = unreadMap[session.id] ?? 0;

              return (
                <Link key={session.id} href={`/chat/${session.id}`}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-secondary)] active:scale-[0.99]"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <Avatar name={other || '?'} photoUrl={otherPhoto} size={48} />
                      <span
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
                        style={{ backgroundColor: statusDot[session.statut] ?? '#9CA3AF', borderColor: 'var(--bg-primary)' }}
                      />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5 gap-2">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          {other}
                        </p>
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                          {formatDate(session.date_debut)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                          {session.sujet}
                        </p>
                        {unread > 0 ? (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
                            {unread > 9 ? '9+' : unread}
                          </span>
                        ) : (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
                          >
                            {STATUS_LABEL[session.statut] ?? session.statut}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}