'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
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
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">Messagerie</h1>
          <p className="text-indigo-100 mt-1">Discutez avec vos mentors et mentorés</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {sessions.length === 0 ? (
          <div className="rounded-xl shadow-md p-12 text-center" style={{ backgroundColor: 'var(--card-bg)' }}>
            <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Aucune conversation</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Vous n'avez pas encore de sessions actives.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Link key={session.id} href={`/chat/${session.id}`} className="block">
                <div className="rounded-xl shadow-md p-4 hover:shadow-lg transition-all" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{session.sujet}</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>avec {getOtherPerson(session)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatDate(session.date_debut)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
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
