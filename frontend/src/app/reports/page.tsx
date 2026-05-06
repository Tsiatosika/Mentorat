'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, FileJson, Calendar, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionAPI, rapportAPI } from '@/services/api';
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

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

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
      // Filtrer les sessions terminées
      const completedSessions = allSessions.filter(
        (s: Session) => s.statut === 'terminee'
      );
      setSessions(completedSessions);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (sessionId: string) => {
    setGenerating(sessionId);
    try {
      const response = await rapportAPI.generateSession(sessionId);
      if (response.data.success) {
        toast.success('Rapport généré avec succès');
        // Télécharger le rapport
        window.open(response.data.rapport.url, '_blank');
      }
    } catch (error) {
      toast.error('Erreur lors de la génération');
    } finally {
      setGenerating(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
          <h1 className="text-2xl font-bold">Mes rapports</h1>
          <p className="text-indigo-100 mt-1">Téléchargez les rapports de vos sessions</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun rapport disponible</h3>
            <p className="text-gray-500">
              Les rapports apparaîtront ici une fois que vous aurez terminé des sessions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-gray-900">{session.sujet}</h3>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.date_debut)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          avec {getOtherPerson(session)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => generateReport(session.id)}
                      disabled={generating === session.id}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {generating === session.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Télécharger PDF
                    </button>
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
