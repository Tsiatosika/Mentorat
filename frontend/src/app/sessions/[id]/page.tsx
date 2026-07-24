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
      <span className="sd-status-badge inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
        style={{ backgroundColor: c.bg, color: c.fg }}>
        <Icon className="w-4 h-4" /> {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="skeleton-block h-5 w-32 rounded-md mb-6" />
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="skeleton-block h-7 w-56 rounded-md mb-2" />
              <div className="skeleton-block h-4 w-40 rounded-md" />
            </div>
            <div className="p-6 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="skeleton-block h-12 rounded-lg" />
                <div className="skeleton-block h-12 rounded-lg" />
                <div className="skeleton-block h-12 rounded-lg" />
                <div className="skeleton-block h-12 rounded-lg" />
              </div>
              <div className="skeleton-block h-20 w-full rounded-lg" />
            </div>
          </div>
        </div>
        <style jsx global>{`
          .skeleton-block {
            background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border) 37%, var(--bg-tertiary) 63%);
            background-size: 400% 100%;
            animation: skeletonShimmer 1.6s ease-in-out infinite;
          }
          @keyframes skeletonShimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        `}</style>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="card p-8 max-w-md text-center sd-error-in">
          <div className="text-5xl mb-4 sd-error-shake">⚠️</div>
          <h2 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Session non trouvée
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            {error || "Cette session n'existe pas ou a été supprimée."}
          </p>
          <Link href="/sessions" className="sd-hover-btn inline-block px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
            Retour aux sessions
          </Link>
        </div>
        <style jsx global>{`
          .sd-error-in { opacity: 0; transform: scale(0.94); animation: sdErrorIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
          @keyframes sdErrorIn { to { opacity: 1; transform: scale(1); } }
          .sd-error-shake { display: inline-block; animation: sdShake 0.6s ease 0.2s; }
          @keyframes sdShake {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(-8deg); }
            40% { transform: rotate(8deg); }
            60% { transform: rotate(-5deg); }
            80% { transform: rotate(5deg); }
          }
          .sd-hover-btn { transition: transform 0.2s ease, filter 0.2s ease; }
          .sd-hover-btn:hover { transform: translateY(-2px); filter: brightness(1.08); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto">

        <Link href="/sessions"
          className="sd-back-btn inline-flex items-center gap-2 mb-6 transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-4 h-4" /> Retour aux sessions
        </Link>

        <div className="card overflow-hidden sd-card-in">

          {/* Header */}
          <div className="p-6"
            style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex justify-between items-start gap-4">
              <div className="sd-title-in">
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
              {[
                { icon: Calendar, label: 'Date de début', value: formatDate(session.date_debut) },
                { icon: Calendar, label: 'Date de fin', value: formatDate(session.date_fin) },
                { icon: User, label: 'Mentor', value: `${session.mentor_prenom} ${session.mentor_nom}` },
                { icon: User, label: 'Mentoré', value: `${session.mentore_prenom} ${session.mentore_nom}` },
              ].map((item, ii) => {
                const ItemIcon = item.icon;
                return (
                  <div key={ii} className="flex items-center gap-3 sd-info-row" style={{ animationDelay: `${ii * 0.05}s` }}>
                    <ItemIcon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.label}</p>
                      <p className={ii < 2 ? 'font-mono-data font-medium text-sm' : 'font-medium text-sm'} style={{ color: 'var(--text-primary)' }}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Description */}
            {session.description && (
              <div className="sd-info-row" style={{ animationDelay: '0.2s' }}>
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

            {session.lien_visio && (
              <div className="sd-info-row" style={{ animationDelay: '0.25s' }}>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Lien visioconférence
                </h3>
                <a
                  href={session.lien_visio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sd-link hover:underline break-all text-sm"
                  style={{ color: 'var(--accent)' }}
                >
                  {session.lien_visio}
                </a>
              </div>
            )}

            {/* Notes si terminée */}
            {session.statut === 'terminee' && (session.notes_mentor || session.notes_mentore) && (
              <div className="space-y-3 sd-info-row" style={{ animationDelay: '0.3s' }}>
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
            <div className="flex flex-wrap gap-3 pt-4 sd-info-row" style={{ borderTop: '1px solid var(--border)', animationDelay: '0.35s' }}>
              <Link href={`/chat/${session.id}`}
                className="sd-action-btn px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm"
                style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
                <MessageCircle className="w-4 h-4" /> Chat
              </Link>

              {session.statut === 'en_cours' && (
                <button
                  className="sd-action-btn px-4 py-2 rounded-lg font-medium text-sm"
                  style={{ backgroundColor: 'var(--success)', color: '#fff' }}
                  onClick={() => toast('Utilisez le bouton Évaluer depuis la liste des sessions.')}
                >
                  Terminer la session
                </button>
              )}

              {(session.statut === 'en_attente' || session.statut === 'confirmee') && (
                <button
                  className="sd-action-btn px-4 py-2 rounded-lg font-medium text-sm"
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

      <style jsx global>{`
        .sd-back-btn { transition: transform 0.15s ease, color 0.15s ease; }
        .sd-back-btn:hover { transform: translateX(-3px); color: var(--accent); }

        .sd-card-in {
          opacity: 0;
          transform: translateY(16px) scale(0.99);
          animation: sdCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes sdCardIn { to { opacity: 1; transform: translateY(0) scale(1); } }

        .sd-title-in {
          opacity: 0;
          transform: translateX(-8px);
          animation: sdTitleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
        }
        @keyframes sdTitleIn { to { opacity: 1; transform: translateX(0); } }

        .sd-status-badge {
          opacity: 0;
          transform: scale(0.85);
          animation: sdBadgeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s forwards;
          transition: transform 0.2s ease;
        }
        @keyframes sdBadgeIn { to { opacity: 1; transform: scale(1); } }
        .sd-status-badge:hover { transform: scale(1.05); }

        .sd-info-row {
          opacity: 0;
          transform: translateY(10px);
          animation: sdInfoRowIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes sdInfoRowIn { to { opacity: 1; transform: translateY(0); } }

        .sd-link { transition: color 0.2s ease; }

        .sd-action-btn { transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease; }
        .sd-action-btn:hover { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 6px 14px rgba(0,0,0,0.12); }
        .sd-action-btn:active { transform: scale(0.96); }

        @media (prefers-reduced-motion: reduce) {
          .sd-card-in, .sd-title-in, .sd-status-badge, .sd-info-row, .sd-action-btn {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}