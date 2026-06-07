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
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchSessions();
  }, [user, router]);

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getAll();
      const all = response.data.sessions || [];
      const active = all.filter(
        (s: Session) => s.statut === 'confirmee' || s.statut === 'en_cours' || s.statut === 'terminee'
      );
      setSessions(active);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });

  const getOtherPerson = (session: Session) => {
    if (user?.role === 'mentor') {
      return `${session.mentore_prenom || ''} ${session.mentore_nom || ''}`.trim();
    }
    return `${session.mentor_prenom || ''} ${session.mentor_nom || ''}`.trim();
  };

  const getInitials = (session: Session) => {
    const name = getOtherPerson(session);
    const parts = name.split(' ');
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  };

  const getStatutConfig = (statut: string) => {
    switch (statut) {
      case 'confirmee':  return { label: 'Confirmée', dot: 'bg-[#3B82F6]', text: 'text-[#3B82F6]' };
      case 'en_cours':   return { label: 'En cours',  dot: 'bg-[#22C55E]', text: 'text-[#22C55E]' };
      case 'terminee':   return { label: 'Terminée',  dot: 'bg-[#6B82A4]', text: 'text-[#6B82A4]' };
      default:           return { label: statut,      dot: 'bg-[#6B82A4]', text: 'text-[#6B82A4]' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB]">

      {/* Header */}
      <div className="bg-white border-b border-[#E5EAF2]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Messagerie</h1>
          <p className="text-[#6B82A4] mt-1 text-sm">
            Discutez avec vos mentors et mentorés
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5EAF2] p-12 text-center">
            <div className="w-14 h-14 bg-[#F5F7FB] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-[#6B82A4]" />
            </div>
            <h3 className="text-base font-bold text-[#1E3A5F] mb-2">Aucune conversation</h3>
            <p className="text-sm text-[#6B82A4]">Vous n'avez pas encore de sessions actives.</p>
            {user?.role === 'mentore' && (
              <Link
                href="/mentors"
                className="inline-block mt-5 bg-[#3B82F6] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2563EB] transition-colors"
              >
                Trouver un mentor
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const config = getStatutConfig(session.statut);
              return (
                <Link
                  key={session.id}
                  href={`/chat/${session.id}`}
                  className="block bg-white rounded-xl border border-[#E5EAF2] hover:border-[#3B82F6] hover:shadow-md transition-all"
                >
                  <div className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#0A3B8A] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">{getInitials(session)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-[#1E3A5F] truncate">{session.sujet}</h3>
                      <p className="text-xs text-[#6B82A4] mt-0.5">avec {getOtherPerson(session)}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Clock className="w-3 h-3 text-[#6B82A4]" />
                        <span className="text-xs text-[#6B82A4]">{formatDate(session.date_debut)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                      <span className={`text-xs font-semibold ${config.text}`}>{config.label}</span>
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