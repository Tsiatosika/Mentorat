'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Video, CheckCircle, XCircle, Clock as ClockIcon, MessageCircle, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface Session {
  id: string;
  sujet: string;
  description: string;
  date_debut: string;
  date_fin: string;
  statut: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';
  lien_visio: string | null;
  mentor_nom?: string;
  mentor_prenom?: string;
  mentore_nom?: string;
  mentore_prenom?: string;
  note_du_mentor?: number;
  note_du_mentore?: number;
}

export default function SessionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('tous');

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
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (sessionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette session ?')) {
      try {
        await sessionAPI.cancel(sessionId);
        toast.success('Session annulée');
        fetchSessions();
      } catch (error) {
        toast.error('Erreur lors de l\'annulation');
      }
    }
  };

  const handleConfirm = async (sessionId: string) => {
    try {
      await sessionAPI.confirm(sessionId);
      toast.success('Session confirmée');
      fetchSessions();
    } catch (error) {
      toast.error('Erreur lors de la confirmation');
    }
  };

  const handleStart = async (sessionId: string) => {
    try {
      await sessionAPI.start(sessionId);
      toast.success('Session démarrée');
      fetchSessions();
    } catch (error) {
      toast.error('Erreur lors du démarrage');
    }
  };

  const getStatutBadge = (statut: string) => {
    const badges = {
      en_attente: 'bg-yellow-100 text-yellow-800',
      confirmee: 'bg-blue-100 text-blue-800',
      en_cours: 'bg-green-100 text-green-800',
      terminee: 'bg-gray-100 text-gray-800',
      annulee: 'bg-red-100 text-red-800',
    };
    const labels = {
      en_attente: 'En attente',
      confirmee: 'Confirmée',
      en_cours: 'En cours',
      terminee: 'Terminée',
      annulee: 'Annulée',
    };
    return { className: badges[statut as keyof typeof badges] || 'bg-gray-100', label: labels[statut as keyof typeof labels] || statut };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'tous') return true;
    return session.statut === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Mes sessions</h1>
              <p className="text-indigo-100 mt-1">Gérez toutes vos sessions de mentorat</p>
            </div>
            {user?.role === 'mentore' && (
              <Link
                href="/mentors"
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                + Nouvelle session
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'tous', label: 'Toutes' },
            { value: 'en_attente', label: 'En attente' },
            { value: 'confirmee', label: 'Confirmées' },
            { value: 'en_cours', label: 'En cours' },
            { value: 'terminee', label: 'Terminées' },
            { value: 'annulee', label: 'Annulées' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des sessions */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune session</h3>
            <p className="text-gray-500">
              {user?.role === 'mentore' 
                ? 'Vous n\'avez pas encore de sessions. Commencez par réserver un mentor !'
                : 'Vous n\'avez pas encore de sessions. Attendez qu\'un mentoré vous contacte.'}
            </p>
            {user?.role === 'mentore' && (
              <Link
                href="/mentors"
                className="inline-block mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
              >
                Explorer les mentors
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const badge = getStatutBadge(session.statut);
              const isMentor = user?.role === 'mentor';
              const otherPerson = isMentor 
                ? `${session.mentore_prenom || ''} ${session.mentore_nom || ''}`
                : `${session.mentor_prenom || ''} ${session.mentor_nom || ''}`;
              
              return (
                <div key={session.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            Avec {otherPerson}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.sujet}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(session.date_debut)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Durée: {Math.round((new Date(session.date_fin).getTime() - new Date(session.date_debut).getTime()) / 60000)} min
                          </div>
                        </div>
                        {session.description && (
                          <p className="text-gray-600 text-sm mt-3 line-clamp-2">{session.description}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {session.statut === 'en_attente' && isMentor && (
                          <button
                            onClick={() => handleConfirm(session.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirmer
                          </button>
                        )}
                        {(session.statut === 'en_attente' || session.statut === 'confirmee') && (
                          <button
                            onClick={() => handleCancel(session.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                            Annuler
                          </button>
                        )}
                        {session.statut === 'confirmee' && isMentor && (
                          <button
                            onClick={() => handleStart(session.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Play className="w-4 h-4" />
                            Démarrer
                          </button>
                        )}
                        <Link
                          href={`/chat/${session.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat
                        </Link>
                        {session.statut === 'terminee' && (
                          <Link
                            href={`/reports/${session.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                          >
                            <FileText className="w-4 h-4" />
                            Rapport
                          </Link>
                        )}
                        {session.lien_visio && (session.statut === 'confirmee' || session.statut === 'en_cours') && (
                          <a
                            href={session.lien_visio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                          >
                            <Video className="w-4 h-4" />
                            Visio
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Composant Play pour le bouton démarrer
const Play = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);