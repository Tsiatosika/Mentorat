'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sessionAPI, avisAPI } from '@/services/api';
import { ReviewModal } from '@/components/sessions/ReviewModal';
import toast from 'react-hot-toast';

interface Session {
  id: string; sujet: string; description: string; date_debut: string; date_fin: string;
  statut: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';
  lien_visio: string | null;
  mentor_nom?: string; mentor_prenom?: string; mentore_nom?: string; mentore_prenom?: string;
  mentor_id?: string;
}

export default function SessionsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('tous');
  const [reviewedSessionIds, setReviewedSessionIds] = useState<Set<string>>(new Set());
  const [reviewModal, setReviewModal] = useState<{ sessionId: string; mentorName: string } | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    load();
  }, [user]);

  const load = async () => {
    try {
      const r = await sessionAPI.getAll();
      const allSessions = r.data.sessions || [];
      setSessions(allSessions);

      // Un seul appel groupé au lieu d'un appel par session terminée
      if (user?.role === 'mentore') {
        const notedRes = await avisAPI.getMesSessionsNotees();
        setReviewedSessionIds(new Set(notedRes.data.sessionIds || []));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => { try { await sessionAPI.confirm(id); toast.success(t('sessions.confirmed')); load(); } catch { toast.error(t('common.error')); } };
  const handleCancel = async (id: string) => { if (!confirm(t('sessions.cancel_confirm'))) return; try { await sessionAPI.cancel(id); toast.success(t('sessions.cancelled')); load(); } catch { toast.error(t('common.error')); } };
  const handleStart = async (id: string) => { try { await sessionAPI.start(id); toast.success(t('sessions.started')); load(); } catch { toast.error(t('common.error')); } };

  const counts = {
    tous: sessions.length,
    en_attente: sessions.filter(s => s.statut === 'en_attente').length,
    confirmee: sessions.filter(s => s.statut === 'confirmee').length,
    en_cours: sessions.filter(s => s.statut === 'en_cours').length,
    terminee: sessions.filter(s => s.statut === 'terminee').length,
    annulee: sessions.filter(s => s.statut === 'annulee').length,
  };

  const filters = [
    { key: 'tous', label: t('sessions.all'), count: counts.tous },
    { key: 'en_attente', label: t('sessions.pending'), count: counts.en_attente },
    { key: 'confirmee', label: t('sessions.confirmed'), count: counts.confirmee },
    { key: 'en_cours', label: t('sessions.in_progress'), count: counts.en_cours },
    { key: 'terminee', label: t('sessions.completed'), count: counts.terminee },
    { key: 'annulee', label: t('sessions.cancelled'), count: counts.annulee },
  ];

  const filtered = sessions.filter(s => filter === 'tous' || s.statut === filter);
  const fmt = (d: string) => new Date(d).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const other = (s: Session) => user?.role === 'mentor'
    ? `${s.mentore_prenom || ''} ${s.mentore_nom || ''}`.trim()
    : `${s.mentor_prenom || ''} ${s.mentor_nom || ''}`.trim();

  const statusConfig: Record<string, { bg: string; fg: string }> = {
    en_attente: { bg: 'var(--warm-soft)', fg: 'var(--warm-text-on-soft)' },
    confirmee: { bg: 'var(--info-soft)', fg: 'var(--info)' },
    en_cours: { bg: 'var(--success-soft)', fg: 'var(--success)' },
    terminee: { bg: 'var(--bg-tertiary)', fg: 'var(--text-secondary)' },
    annulee: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <h1 className="font-display text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {t('sessions.title')}
      </h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              filter === f.key
                ? { backgroundColor: 'var(--accent)', color: '#06231D' }
                : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>{t('sessions.no_sessions')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const isMentor = user?.role === 'mentor';
            const isMentore = user?.role === 'mentore';
            const otherName = other(s);
            const cfg = statusConfig[s.statut] || statusConfig.en_attente;
            const statusText = filters.find(f => f.key === s.statut)?.label || s.statut;
            const canReview = isMentore && s.statut === 'terminee' && !reviewedSessionIds.has(s.id);
            const alreadyReviewed = isMentore && s.statut === 'terminee' && reviewedSessionIds.has(s.id);

            return (
              <div key={s.id} className="card bookmark p-4 flex flex-wrap justify-between items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <strong style={{ color: 'var(--text-primary)' }}>{s.sujet}</strong>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.fg }}>
                      {statusText}
                    </span>
                    {alreadyReviewed && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: 'var(--warm-soft)', color: 'var(--warm-text-on-soft)' }}
                      >
                        <Star className="w-3 h-3" style={{ fill: 'currentColor' }} />
                        Noté
                      </span>
                    )}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div>{t('sessions.with')} {otherName}</div>
                    <div className="font-mono-data text-xs mt-0.5">{fmt(s.date_debut)}</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {s.statut === 'en_attente' && isMentor && (
                    <button
                      onClick={() => handleConfirm(s.id)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: 'var(--success)', color: '#fff' }}
                    >
                      {t('sessions.confirm')}
                    </button>
                  )}
                  {(s.statut === 'en_attente' || s.statut === 'confirmee') && (
                    <button
                      onClick={() => handleCancel(s.id)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
                    >
                      {t('sessions.cancel')}
                    </button>
                  )}
                  {s.statut === 'confirmee' && isMentor && (
                    <button
                      onClick={() => handleStart(s.id)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: 'var(--info)', color: '#fff' }}
                    >
                      {t('sessions.start')}
                    </button>
                  )}
                  {canReview && (
                    <button
                      onClick={() => setReviewModal({ sessionId: s.id, mentorName: otherName })}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5"
                      style={{ backgroundColor: 'var(--warm)', color: '#2A1700' }}
                    >
                      <Star className="w-3.5 h-3.5" />
                      Noter
                    </button>
                  )}
                  <Link
                    href={`/chat/${s.id}`}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
                  >
                    {t('sessions.chat')}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewModal && (
        <ReviewModal
          isOpen={true}
          onClose={() => setReviewModal(null)}
          sessionId={reviewModal.sessionId}
          mentorName={reviewModal.mentorName}
          onSubmitted={() => {
            load();
            setTimeout(() => setReviewModal(null), 1500);
          }}
        />
      )}
    </div>
  );
}