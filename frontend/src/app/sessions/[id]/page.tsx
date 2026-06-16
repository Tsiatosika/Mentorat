'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User, FileText, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSession();
  }, [user, router]);

  const fetchSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await sessionAPI.getById(params.id as string);
      if (response.data.success) {
        setSession(response.data.session);
      } else {
        setError('Session non trouvée');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      setError(error.response?.data?.message || 'Erreur lors du chargement');
      toast.error('Session non trouvée');
    } finally {
      setLoading(false);
    }
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

  const getStatutBadge = (statut: string) => {
    const config: Record<string, { bg: string; text: string; icon: any }> = {
      terminee: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      en_cours: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
      annulee: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      confirmee: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: CheckCircle },
      en_attente: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
    };
    const c = config[statut] || config.en_attente;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${c.bg} ${c.text}`}>
        <Icon className="w-4 h-4" />
        {statut === 'terminee' ? 'Terminée' : statut === 'en_cours' ? 'En cours' : statut === 'annulee' ? 'Annulée' : statut === 'confirmee' ? 'Confirmée' : 'En attente'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Session non trouvée</h2>
          <p className="text-gray-600 mb-4">{error || 'Cette session n\'existe pas ou a été supprimée.'}</p>
          <Link href="/sessions" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Retour aux sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/sessions" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour aux sessions
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{session.sujet}</h1>
                <p className="text-indigo-100 mt-1">Session de mentorat</p>
              </div>
              {getStatutBadge(session.statut)}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date de début</p>
                  <p className="font-medium">{formatDate(session.date_debut)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date de fin</p>
                  <p className="font-medium">{formatDate(session.date_fin)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Mentor</p>
                  <p className="font-medium">{session.mentor_prenom} {session.mentor_nom}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Mentoré</p>
                  <p className="font-medium">{session.mentore_prenom} {session.mentore_nom}</p>
                </div>
              </div>
            </div>

            {session.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </h3>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{session.description}</p>
              </div>
            )}

            {session.lien_visio && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Lien visioconférence</h3>
                <a href={session.lien_visio} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  {session.lien_visio}
                </a>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Link href={`/chat/${session.id}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat
              </Link>
              {session.statut === 'en_cours' && (
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Terminer la session
                </button>
              )}
              {(session.statut === 'en_attente' || session.statut === 'confirmee') && (
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Annuler la session
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
