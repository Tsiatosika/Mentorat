'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Calendar, User, RefreshCw } from 'lucide-react';
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
  const { user }  = useAuth();
  const router    = useRouter();
  const [sessions,   setSessions]   = useState<Session[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [downloading,setDownloading]= useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchSessions();
  }, [user, router]);

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getAll({ statut: 'terminee' });
      setSessions(response.data.sessions || []);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // CORRECTION 1 : générer d'abord, puis télécharger en blob
  // window.open() ne fonctionne pas pour les fichiers protégés par auth
  const handleGenerate = async (sessionId: string) => {
    setGenerating(sessionId);
    try {
      await rapportAPI.generateSession(sessionId);
      toast.success('Rapport généré !');
      // Enchaîner le téléchargement
      await handleDownload(sessionId);
    } catch {
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setGenerating(null);
    }
  };

  // CORRECTION 2 : téléchargement PDF via blob (responseType: 'blob' dans api.ts)
  const handleDownload = async (sessionId: string) => {
    setDownloading(sessionId);
    try {
      const response = await rapportAPI.downloadSession(sessionId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `rapport_session_${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Si le rapport n'existe pas encore → générer d'abord
      toast.error('Rapport non disponible. Cliquez sur "Générer".');
    } finally {
      setDownloading(null);
    }
  };

  // CORRECTION 3 : rapport de progression (mentoré uniquement)
  const handleProgressionReport = async () => {
    setGenerating('progression');
    try {
      const response = await rapportAPI.generateProgression();
      if (response.data.rapport?.url) {
        // Même logique blob
        const dl = await rapportAPI.downloadSession('progression'); // non utilisé
        toast.success('Rapport de progression généré !');
        window.open(
          `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${response.data.rapport.url}`,
          '_blank'
        );
      }
    } catch {
      toast.error('Erreur lors de la génération du rapport de progression');
    } finally {
      setGenerating(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

  const getOtherPerson = (session: Session) =>
    user?.role === 'mentor'
      ? `${session.mentore_prenom ?? ''} ${session.mentore_nom ?? ''}`.trim()
      : `${session.mentor_prenom  ?? ''} ${session.mentor_nom  ?? ''}`.trim();

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
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mes rapports</h1>
            <p className="text-indigo-100 mt-1">Téléchargez les rapports de vos sessions terminées</p>
          </div>
          {/* CORRECTION 3 : bouton rapport de progression pour les mentorés */}
          {user?.role === 'mentore' && (
            <button
              onClick={handleProgressionReport}
              disabled={generating === 'progression'}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${generating === 'progression' ? 'animate-spin' : ''}`} />
              Rapport de progression global
            </button>
          )}
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
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-gray-900">{session.sujet}</h3>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.date_debut)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          avec {getOtherPerson(session)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {/* Générer + télécharger en une étape */}
                      <button
                        onClick={() => handleGenerate(session.id)}
                        disabled={generating === session.id || downloading === session.id}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
                      >
                        {generating === session.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {generating === session.id ? 'Génération...' : 'Générer et télécharger'}
                      </button>

                      {/* Télécharger directement si déjà généré */}
                      <button
                        onClick={() => handleDownload(session.id)}
                        disabled={downloading === session.id}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                      >
                        {downloading === session.id ? (
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Retélécharger
                      </button>
                    </div>
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