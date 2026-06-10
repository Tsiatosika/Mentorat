'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { sessionAPI } from '@/services/api';
import { Calendar, Clock, MessageCircle, CheckCircle, XCircle, Play, Plus } from 'lucide-react';
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
}

const STATUT_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  en_attente: { label: 'En attente', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400', icon: Clock },
  confirmee: { label: 'Confirmée', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', icon: CheckCircle },
  en_cours: { label: 'En cours', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', icon: Play },
  terminee: { label: 'Terminée', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: CheckCircle },
  annulee: { label: 'Annulée', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', icon: XCircle },
};

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
    load();
  }, [user]);

  const load = async () => {
    try {
      const r = await sessionAPI.getAll();
      setSessions(r.data.sessions || []);
    } catch {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await sessionAPI.confirm(id);
      toast.success('Session confirmée !');
      load();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Annuler cette session ?')) return;
    try {
      await sessionAPI.cancel(id);
      toast.success('Session annulée');
      load();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleStart = async (id: string) => {
    try {
      await sessionAPI.start(id);
      toast.success('Session démarrée !');
      load();
    } catch {
      toast.error('Erreur');
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

  const getOtherPerson = (session: Session) => {
    if (user?.role === 'mentor') {
      return `${session.mentore_prenom || ''} ${session.mentore_nom || ''}`.trim();
    }
    return `${session.mentor_prenom || ''} ${session.mentor_nom || ''}`.trim();
  };

  const counts = {
    tous: sessions.length,
    en_attente: sessions.filter(s => s.statut === 'en_attente').length,
    confirmee: sessions.filter(s => s.statut === 'confirmee').length,
    en_cours: sessions.filter(s => s.statut === 'en_cours').length,
    terminee: sessions.filter(s => s.statut === 'terminee').length,
    annulee: sessions.filter(s => s.statut === 'annulee').length,
  };

  const filtered = filter === 'tous' 
    ? sessions 
    : sessions.filter(s => s.statut === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Mes sessions</h1>
        {user?.role === 'mentore' && (
          <Link
            href="/mentors"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle session
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === key
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {key === 'tous' ? 'Toutes' : STATUT_CONFIG[key]?.label || key} ({count})
          </button>
        ))}
      </div>

      {/* Liste des sessions */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <p className="text-gray-500 dark:text-gray-400">Aucune session trouvée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((session) => {
            const config = STATUT_CONFIG[session.statut];
            const Icon = config?.icon || Clock;
            const otherName = getOtherPerson(session);
            
            return (
              <div key={session.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{session.sujet}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config?.bg} ${config?.text}`}>
                        <Icon className="w-3 h-3" />
                        {config?.label}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.date_debut)}
                      </div>
                      <div>Avec {otherName}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {session.statut === 'en_attente' && user?.role === 'mentor' && (
                      <button
                        onClick={() => handleConfirm(session.id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        Confirmer
                      </button>
                    )}
                    {(session.statut === 'en_attente' || session.statut === 'confirmee') && (
                      <button
                        onClick={() => handleCancel(session.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                    {session.statut === 'confirmee' && user?.role === 'mentor' && (
                      <button
                        onClick={() => handleStart(session.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Démarrer
                      </button>
                    )}
                    <Link
                      href={`/chat/${session.id}`}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
