'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, Video, CheckCircle, XCircle,
  MessageCircle, FileText, Play, Star
} from 'lucide-react';
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
  note_du_mentor?: number | null;
  note_du_mentore?: number | null;
  notes_mentor?: string;
  notes_mentore?: string;
}

// CORRECTION 6 : modal d'évaluation pour terminer une session
function EvaluationModal({
  sessionId,
  onClose,
  onSuccess,
}: {
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [note, setNote]   = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await sessionAPI.complete(sessionId, { note, notes });
      const msg = res.data.terminee
        ? 'Session terminée ! Rapport en cours de génération.'
        : 'Note enregistrée. En attente de l\'autre participant.';
      toast.success(msg);
      onSuccess();
      onClose();
    } catch {
      toast.error('Erreur lors de l\'évaluation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Évaluer la session</h2>

        {/* Étoiles */}
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-2 block">Note</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setNote(n)}>
                <Star className={`w-8 h-8 transition-colors ${
                  n <= note ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Commentaire */}
        <div className="mb-6">
          <label className="text-sm text-gray-600 mb-1 block">Commentaire (optionnel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Votre retour sur cette session..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
            {loading ? 'Envoi...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [sessions,      setSessions]      = useState<Session[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState('tous');
  const [evalSessionId, setEvalSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchSessions();
  }, [user, router]);

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getAll();
      setSessions(response.data.sessions || []);
    } catch {
      toast.error('Erreur lors du chargement des sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette session ?')) return;
    try {
      await sessionAPI.cancel(id);
      toast.success('Session annulée');
      fetchSessions();
    } catch {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await sessionAPI.confirm(id);
      toast.success('Session confirmée !');
      fetchSessions();
    } catch {
      toast.error('Erreur lors de la confirmation');
    }
  };

  const handleStart = async (id: string) => {
    try {
      await sessionAPI.start(id);
      toast.success('Session démarrée !');
      fetchSessions();
    } catch {
      toast.error('Erreur lors du démarrage');
    }
  };

  const getStatutBadge = (statut: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      en_attente: { cls: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      confirmee:  { cls: 'bg-blue-100   text-blue-800',   label: 'Confirmée'  },
      en_cours:   { cls: 'bg-green-100  text-green-800',  label: 'En cours'   },
      terminee:   { cls: 'bg-gray-100   text-gray-800',   label: 'Terminée'   },
      annulee:    { cls: 'bg-red-100    text-red-800',    label: 'Annulée'    },
    };
    return map[statut] ?? { cls: 'bg-gray-100 text-gray-800', label: statut };
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const filteredSessions = sessions.filter(
    (s) => filter === 'tous' || s.statut === filter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {evalSessionId && (
        <EvaluationModal
          sessionId={evalSessionId}
          onClose={() => setEvalSessionId(null)}
          onSuccess={fetchSessions}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mes sessions</h1>
            <p className="text-indigo-100 mt-1">Gérez toutes vos sessions de mentorat</p>
          </div>
          {user?.role === 'mentore' && (
            <Link href="/mentors"
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              + Nouvelle session
            </Link>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'tous',       label: 'Toutes'      },
            { value: 'en_attente', label: 'En attente'  },
            { value: 'confirmee',  label: 'Confirmées'  },
            { value: 'en_cours',   label: 'En cours'    },
            { value: 'terminee',   label: 'Terminées'   },
            { value: 'annulee',    label: 'Annulées'    },
          ].map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune session</h3>
            <p className="text-gray-500">
              {user?.role === 'mentore'
                ? 'Vous n\'avez pas encore de sessions. Commencez par réserver un mentor !'
                : 'Attendez qu\'un mentoré vous contacte.'}
            </p>
            {user?.role === 'mentore' && (
              <Link href="/mentors"
                className="inline-block mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                Explorer les mentors
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const badge    = getStatutBadge(session.statut);
              const isMentor = user?.role === 'mentor';
              const other    = isMentor
                ? `${session.mentore_prenom ?? ''} ${session.mentore_nom ?? ''}`.trim()
                : `${session.mentor_prenom  ?? ''} ${session.mentor_nom  ?? ''}`.trim();

              // CORRECTION 7 : afficher si l'utilisateur a déjà noté ou non
              const dejaNote = isMentor
                ? session.note_du_mentore != null
                : session.note_du_mentor  != null;

              return (
                <div key={session.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                          {other && (
                            <span className="text-sm text-gray-500">Avec {other}</span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.sujet}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> {formatDate(session.date_debut)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {Math.round(
                              (new Date(session.date_fin).getTime() - new Date(session.date_debut).getTime()) / 60000
                            )} min
                          </span>
                        </div>
                        {session.description && (
                          <p className="text-gray-600 text-sm mt-3 line-clamp-2">{session.description}</p>
                        )}
                        {/* Indication évaluation */}
                        {session.statut === 'en_cours' && (
                          <p className="text-xs mt-2 text-indigo-600">
                            {dejaNote ? '✓ Vous avez déjà évalué cette session' : 'Évaluation en attente'}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {session.statut === 'en_attente' && isMentor && (
                          <button onClick={() => handleConfirm(session.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                            <CheckCircle className="w-4 h-4" /> Confirmer
                          </button>
                        )}

                        {(session.statut === 'en_attente' || session.statut === 'confirmee') && (
                          <button onClick={() => handleCancel(session.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                            <XCircle className="w-4 h-4" /> Annuler
                          </button>
                        )}

                        {session.statut === 'confirmee' && isMentor && (
                          <button onClick={() => handleStart(session.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            <Play className="w-4 h-4" /> Démarrer
                          </button>
                        )}

                        {/* CORRECTION 8 : bouton terminer/évaluer si session en_cours et pas encore noté */}
                        {session.statut === 'en_cours' && !dejaNote && (
                          <button onClick={() => setEvalSessionId(session.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                            <Star className="w-4 h-4" /> Évaluer
                          </button>
                        )}

                        <Link href={`/chat/${session.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                          <MessageCircle className="w-4 h-4" /> Chat
                        </Link>

                        {session.statut === 'terminee' && (
                          <Link href={`/reports/${session.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                            <FileText className="w-4 h-4" /> Rapport
                          </Link>
                        )}

                        {session.lien_visio &&
                          (session.statut === 'confirmee' || session.statut === 'en_cours') && (
                          <a href={session.lien_visio} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                            <Video className="w-4 h-4" /> Visio
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