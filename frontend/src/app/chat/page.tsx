'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface Session {
  id: string;
  sujet: string;
  date_debut: string;
  statut: string;
  mentor_nom?: string;
  mentor_prenom?: string;
  mentore_nom?: string;
  mentore_prenom?: string;
}

export default function ChatListPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSessions();
  }, [user, router]);

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getAll();
      const allSessions = response.data.sessions || [];
      const activeSessions = allSessions.filter(
        (s: Session) => s.statut === 'confirmee' || s.statut === 'en_cours' || s.statut === 'terminee'
      );
      setSessions(activeSessions);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOtherPerson = (session: Session) => {
    if (user?.role === 'mentor') {
      return `${session.mentore_prenom || ''} ${session.mentore_nom || ''}`;
    }
    return `${session.mentor_prenom || ''} ${session.mentor_nom || ''}`;
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-8">
        <p className="font-mono-data text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
          {t('chat.subtitle')}
        </p>
        <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('chat.title')}
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        {sessions.length === 0 ? (
          <div className="card p-12 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t('chat.no_conversation')}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{t('chat.no_conversation_desc')}</p>
            {user?.role === 'mentore' && (
              <Link
                href="/mentors"
                className="inline-block mt-4 px-4 py-2 rounded-lg font-medium"
                style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
              >
                {t('dashboard.find_mentor')}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Link key={session.id} href={`/chat/${session.id}`} className="block">
                <div className="card card-hover bookmark p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--accent-soft)' }}
                      >
                        <Users className="w-5 h-5" style={{ color: 'var(--accent-text-on-soft)' }} />
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{session.sujet}</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {t('sessions.with')} {getOtherPerson(session)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="font-mono-data text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {formatDate(session.date_debut)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--success)' }}></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}