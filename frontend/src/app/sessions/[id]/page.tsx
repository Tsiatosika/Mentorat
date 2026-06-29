'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, FileText, CheckCircle, XCircle, Clock, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
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
      setError(error.response?.data?.message || 'Erreur lors du chargement');
      toast.error('Session non trouvée');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const statusConfig: Record<string, { bg: string; fg: string; icon: any; label: string }> = {
    terminee:   { bg: 'var(--success-soft)', fg: 'var(--success)',         icon: CheckCircle, label: 'Terminée'   },
    en_cours:   { bg: 'var(--info-soft)',    fg: 'var(--info)',             icon: Clock,       label: 'En cours'   },
    annulee:    { bg: 'var(--danger-soft)',  fg: 'var(--danger)',           icon: XCircle,     label: 'Annulée'    },
    confirmee:  { bg: 'var(--warm-soft)',    fg: 'var(--warm-text-on-soft)',icon: CheckCircle, label: 'Confirmée'  },
    en_attente: { bg: 'var(--bg-tertiary)', fg: 'var(--text-secondary)',   icon: Clock,       label: 'En attente' },
  };

  const getStatutBadge = (statut: string) => {
    const c = statusConfig[statut] || statusConfig.en_attente;
    const Icon = c.icon;
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
        style={{ backgroundColor: c.bg, color: c.fg }}>
        <Icon className="w-4 h-4" /> {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="card p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Session non trouvée
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            {error || "Cette session n'existe pas ou a été supprimée."}
          </p>
          <Link href="/sessions" className="inline-block px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
            Retour aux sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto">

        <Link href="/sessions"
          className="inline-flex items-center gap-2 mb-6 transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-4 h-4" /> Retour aux sessions
        </Link>

        <div className="card overflow-hidden">

          {/* Header */}
          <div className="p-6"
            style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {session.sujet}
                </h1>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Session de mentorat</p>
              </div>
              {getStatutBadge(session.statut)}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">

            {/* Dates + participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Date de début</p>
                  <p className="font-mono-data font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {formatDate(session.date_debut)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Date de fin</p>
                  <p className="font-mono-data font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {formatDate(session.date_fin)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Mentor</p>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {session.mentor_prenom} {session.mentor_nom}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Mentoré</p>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {session.mentore_prenom} {session.mentore_nom}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {session.description && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2"
                  style={{ color: 'var(--text-secondary)' }}>
                  <FileText className="w-4 h-4" /> Description
                </h3>
                <p className="rounded-lg p-4 text-sm leading-relaxed"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                  {session.description}
                </p>
              </div>
            )}

            {/* CORRECTION : balise <a> manquante pour le lien visio */}
            {session.lien_visio && (
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Lien visioconférence
                </h3>
                <a
                  href={session.lien_visio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline break-all text-sm"
                  style={{ color: 'var(--accent)' }}
                >
                  {session.lien_visio}
                </a>
              </div>
            )}

            {/* Notes si terminée */}
            {session.statut === 'terminee' && (session.notes_mentor || session.notes_mentore) && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Évaluations</h3>
                {session.notes_mentor && (
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      Note du mentor ({session.note_du_mentore ?? '—'}/5)
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{session.notes_mentor}</p>
                  </div>
                )}
                {session.notes_mentore && (
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      Note du mentoré ({session.note_du_mentor ?? '—'}/5)
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{session.notes_mentore}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <Link href={`/chat/${session.id}`}
                className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm"
                style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
                <MessageCircle className="w-4 h-4" /> Chat
              </Link>

              {session.statut === 'en_cours' && (
                <button
                  className="px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                  style={{ backgroundColor: 'var(--success)', color: '#fff' }}
                  onClick={() => toast('Utilisez le bouton Évaluer depuis la liste des sessions.')}
                >
                  Terminer la session
                </button>
              )}

              {(session.statut === 'en_attente' || session.statut === 'confirmee') && (
                <button
                  className="px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                  style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
                  onClick={async () => {
                    if (!confirm('Êtes-vous sûr de vouloir annuler cette session ?')) return;
                    try {
                      await sessionAPI.cancel(session.id);
                      toast.success('Session annulée');
                      router.push('/sessions');
                    } catch {
                      toast.error("Erreur lors de l'annulation");
                    }
                  }}
                >
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