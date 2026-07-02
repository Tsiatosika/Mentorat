'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MessageCircle, Users, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sessionAPI, messageAPI, BACKEND_URL } from '@/services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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

const AVATAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444', '#3B82F6'];

function colorForName(name: string) {
  const code = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function getFullUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BACKEND_URL}${url}`;
}

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
        className="rounded-full object-cover flex-shrink-0 ring-2 ring-[var(--border)]"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-[var(--border)]"
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
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const STATUS_LABEL: Record<string, { label: string; color: string; dot: string }> = {
    confirmee: { label: 'Confirmée', color: '#10B981', dot: 'bg-green-500' },
    en_cours: { label: 'En cours', color: '#3B82F6', dot: 'bg-blue-500' },
    terminee: { label: 'Terminée', color: '#9CA3AF', dot: 'bg-gray-400' },
  };

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
    if (diffDays === 1) return t('chat.yesterday');
    if (diffDays < 7) return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long' });
    return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short' });
  };

  const getOtherPerson = (s: Session) =>
    user?.role === 'mentor'
      ? `${s.mentore_prenom ?? ''} ${s.mentore_nom ?? ''}`.trim()
      : `${s.mentor_prenom ?? ''} ${s.mentor_nom ?? ''}`.trim();

  const getOtherPhoto = (s: Session) =>
    user?.role === 'mentor' ? s.mentore_photo_url : s.mentor_photo_url;

  const filtered = sessions
    .filter(s => {
      const match = getOtherPerson(s).toLowerCase().includes(search.toLowerCase()) ||
                    s.sujet.toLowerCase().includes(search.toLowerCase());
      if (filter === 'active') return match && s.statut !== 'terminee';
      if (filter === 'completed') return match && s.statut === 'terminee';
      return match;
    })
    .sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime());

  if (loading) {
    return (
      <div className="h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-full flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* Header amélioré */}
      <div className="px-5 pt-8 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('chat.title')}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {sessions.length} conversations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-full transition-all hover:bg-[var(--bg-secondary)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search amélioré */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder={t('chat.search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--accent)',
            } as React.CSSProperties}
          />
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mt-3">
          {['all', 'active', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: filter === f ? 'var(--accent)' : 'var(--bg-secondary)',
                color: filter === f ? '#06231D' : 'var(--text-secondary)',
              }}
            >
              {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Terminés'}
            </button>
          ))}
        </div>
      </div>

      {/* Liste améliorée */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center px-6"
            >
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <MessageCircle className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                {search ? 'Aucun résultat' : t('chat.no_conversation')}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {search ? 'Essayez de modifier votre recherche' : t('chat.no_conversations_desc_alt')}
              </p>
              {user?.role === 'mentore' && !search && (
                <Link href="/mentors"
                  className="mt-5 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-md"
                  style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
                  Trouver un mentor
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="space-y-1">
              {filtered.map((session, idx) => {
                const other = getOtherPerson(session);
                const otherPhoto = getOtherPhoto(session);
                const unread = unreadMap[session.id] ?? 0;
                const status = STATUS_LABEL[session.statut] || { label: session.statut, color: '#9CA3AF', dot: 'bg-gray-400' };

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Link href={`/chat/${session.id}`}>
                      <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-[var(--bg-secondary)] active:scale-[0.98] cursor-pointer"
                        style={{ 
                          border: '1px solid transparent',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                      >
                        {/* Avatar amélioré */}
                        <div className="relative flex-shrink-0">
                          <Avatar name={other || '?'} photoUrl={otherPhoto} size={52} />
                          <div
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 ${status.dot}`}
                            style={{ borderColor: 'var(--bg-primary)' }}
                          />
                        </div>

                        {/* Contenu amélioré */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5 gap-2">
                            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                              {other}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {formatDate(session.date_debut)}
                              </span>
                              <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                              {session.sujet}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className="text-xs px-2.5 py-0.5 rounded-full"
                                style={{ 
                                  backgroundColor: `${status.color}15`, 
                                  color: status.color,
                                }}
                              >
                                {status.label}
                              </span>
                              {unread > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center animate-pulse"
                                  style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
                                  {unread > 9 ? '9+' : unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}