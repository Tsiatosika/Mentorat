'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Users, Star, CheckCircle, XCircle, Mail, MessageSquareQuote, Quote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicAPI, avisAPI, BACKEND_URL } from '@/services/api';
import { QuickBooking } from '@/components/mentors/QuickBooking';
import toast from 'react-hot-toast';

interface Avis {
  id: string;
  note_globale: number;
  note_ponctualite: number;
  note_pedagogie: number;
  note_disponibilite: number;
  commentaire: string | null;
  created_at: string;
  nom: string;
  prenom: string;
}

// ═══════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════
function getCompName(comp: any): string {
  if (!comp) return '';
  if (typeof comp === 'string') return comp;
  if (typeof comp === 'object' && comp.nom) return String(comp.nom);
  return '';
}

function getCompNiveau(comp: any): string {
  if (typeof comp === 'object' && comp.niveau) return String(comp.niveau);
  return '';
}

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [mentor, setMentor] = useState<any>(null);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredAvis, setHoveredAvis] = useState<string | null>(null);

  const mentorId = params.id as string;

  useEffect(() => {
    if (mentorId) {
      fetchMentor();
      fetchAvis();
    }
  }, [mentorId]);

  const fetchMentor = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await publicAPI.getMentorById(mentorId);
      if (response.data.success && response.data.mentor) {
        const mentorData = response.data.mentor;
        if (mentorData.competences) {
          mentorData.competences = mentorData.competences.map((c: any) => {
            if (typeof c === 'string') return c;
            if (typeof c === 'object' && c.nom) return c.nom;
            return '';
          }).filter(Boolean);
        }
        setMentor(mentorData);
      } else {
        setError(t('common.error'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError(t('common.error'));
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAvis = async () => {
    try {
      const response = await avisAPI.getByMentor(mentorId);
      setAvis(response.data.avis || []);
    } catch (error) {
      console.error('Erreur chargement avis:', error);
    }
  };

  const getNoteDisplay = (note: any) => {
    if (!note || note === 0) return t('common.new');
    const numNote = typeof note === 'string' ? parseFloat(note) : note;
    if (isNaN(numNote) || numNote === 0) return t('common.new');
    return numNote.toFixed(1);
  };

  const avgCriteria = (key: keyof Avis) => {
    if (avis.length === 0) return 0;
    const sum = avis.reduce((acc, a) => acc + Number(a[key]), 0);
    return sum / avis.length;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // ═══ CORRECTION : Accepter string | null | undefined ═══
  const getPhotoUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    const baseUrl = BACKEND_URL.replace(/\/api\/?$/, '');
    return `${baseUrl}${url}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="card p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t('mentors.not_found')}</h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{error || t('common.error')}</p>
          <button onClick={() => router.back()} className="inline-block px-4 py-2 rounded-lg font-medium hover-btn" style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  // Normaliser les compétences
  const competences = (mentor.competences || []).map((c: any) => {
    if (typeof c === 'string') return c;
    if (typeof c === 'object' && c.nom) return c.nom;
    return '';
  }).filter(Boolean);

  const criteriaLabels = [
    { key: 'note_ponctualite' as const, label: t('mentors.criteria_punctuality') },
    { key: 'note_pedagogie' as const, label: t('mentors.criteria_pedagogy') },
    { key: 'note_disponibilite' as const, label: t('mentors.criteria_availability') },
  ];

  // ═══ CORRECTION : Photo URL sécurisée ═══
  const photoUrl = getPhotoUrl(mentor.photo_url);
  const overallAvg = avis.length > 0 ? avgCriteria('note_globale') : 0;

  return (
    <div className="min-h-screen mentor-detail-page" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="back-btn inline-flex items-center gap-2 mb-6" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>

        {/* ═══════════ HERO BANNER ═══════════ */}
        <div className="hero-banner fade-in-up relative rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="hero-band" style={{ background: 'linear-gradient(135deg, var(--accent-soft), transparent 70%)' }} />
          <div className="hero-band hero-band-2" style={{ background: 'linear-gradient(315deg, var(--accent-soft), transparent 60%)' }} />

          <div className="relative z-10 pt-10 pb-6 px-8 flex flex-col items-center text-center">
            <div className="hero-avatar-ring avatar-pop">
              <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                {photoUrl ? (
                  <img src={photoUrl} alt={`${mentor.prenom} ${mentor.nom}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold" style={{ color: 'var(--accent-text-on-soft)' }}>
                    {mentor.prenom?.[0]}{mentor.nom?.[0]}
                  </span>
                )}
              </div>
            </div>

            <h1 className="font-display text-3xl font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>
              {mentor.prenom} {mentor.nom}
            </h1>
            <p className="text-lg mt-0.5" style={{ color: 'var(--accent)' }}>{mentor.domaine || t('mentors.expert')}</p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              <span className="hero-pill" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <Star className="w-4 h-4" style={{ color: 'var(--warm)', fill: 'var(--warm)' }} />
                <span className="font-mono-data font-semibold" style={{ color: 'var(--text-primary)' }}>{getNoteDisplay(mentor.note_moyenne)}/5</span>
                {avis.length > 0 && <span style={{ color: 'var(--text-tertiary)' }}>· {avis.length} avis</span>}
              </span>
              <span className="hero-pill" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <Users className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                {mentor.nb_sessions || 0} {t('mentors.sessions')}
              </span>
              <span className="hero-pill" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <Clock className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                {mentor.annees_experience || 0} {t('mentors.years')}
              </span>
              <span className="hero-pill" style={{ backgroundColor: mentor.disponible ? 'var(--success-soft)' : 'var(--bg-primary)', border: `1px solid ${mentor.disponible ? 'var(--success)' : 'var(--border)'}`, color: mentor.disponible ? 'var(--success)' : 'var(--text-secondary)' }}>
                {mentor.disponible ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {mentor.disponible ? t('mentors.is_available') : t('mentors.unavailable')}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════ CONTENU ═══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mt-8 items-start">
          <div className="space-y-8 min-w-0">
            {/* Bio */}
            <div className="reveal-block" style={{ animationDelay: '0.05s' }}>
              <h2 className="font-display text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{t('mentors.about')}</h2>
              <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">{mentor.bio || t('mentors.no_bio')}</p>
            </div>

            {/* Compétences */}
            {competences.length > 0 && (
              <div className="reveal-block" style={{ animationDelay: '0.1s' }}>
                <h2 className="font-display text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{t('matching.competences')}</h2>
                <div className="flex flex-wrap gap-2">
                  {competences.map((comp: string, index: number) => (
                    <span
                      key={index}
                      className="competence-chip px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)', animationDelay: `${0.12 + index * 0.03}s` }}
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Avis */}
            <div className="reveal-block" style={{ animationDelay: '0.15s' }}>
              <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <MessageSquareQuote className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                {t('mentors.reviews')} ({avis.length})
              </h2>

              {avis.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('mentors.no_reviews')}</p>
              ) : (
                <>
                  {/* Barres de notation — élément signature */}
                  <div className="rating-panel rounded-xl p-5 mb-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="font-display text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{overallAvg.toFixed(1)}</span>
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>/ 5 · moyenne globale</span>
                    </div>
                    <div className="space-y-3">
                      {criteriaLabels.map((c, ci) => {
                        const value = avgCriteria(c.key);
                        const widthPct = Math.min(100, (value / 5) * 100);
                        return (
                          <div key={c.key} className="rating-row" style={{ animationDelay: `${0.05 + ci * 0.06}s` }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                              <span className="font-mono-data text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value.toFixed(1)}</span>
                            </div>
                            <div className="rating-track rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                              <div className="rating-fill rounded-full" style={{ width: `${widthPct}%`, backgroundColor: 'var(--accent)' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {avis.map((a, ai) => {
                      const isAvisHovered = hoveredAvis === a.id;
                      return (
                        <div
                          key={a.id}
                          className="avis-block relative pl-5"
                          style={{ animationDelay: `${0.2 + ai * 0.05}s`, borderLeft: `2px solid ${isAvisHovered ? 'var(--accent)' : 'var(--border)'}` }}
                          onMouseEnter={() => setHoveredAvis(a.id)}
                          onMouseLeave={() => setHoveredAvis(null)}
                        >
                          <Quote className="quote-mark w-4 h-4 absolute -left-[9px] top-0" style={{ color: isAvisHovered ? 'var(--accent)' : 'var(--text-tertiary)', backgroundColor: 'var(--bg-primary)' }} />
                          <div className="flex justify-between items-start mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                {a.prenom?.[0]}{a.nom?.[0]}
                              </div>
                              <span className="text-sm font-medium" style={{ color: isAvisHovered ? 'var(--accent)' : 'var(--text-primary)' }}>
                                {a.prenom} {a.nom?.[0]}.
                              </span>
                              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>· {formatDate(a.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5" style={{ color: 'var(--warm)', fill: 'var(--warm)' }} />
                              <span className="font-mono-data text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{Number(a.note_globale).toFixed(1)}</span>
                            </div>
                          </div>
                          {a.commentaire && (
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a.commentaire}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ═══════════ SIDEBAR DROITE ═══════════ */}
          <div className="space-y-5 lg:sticky lg:top-8 reveal-block" style={{ animationDelay: '0.1s' }}>
            <div className="rounded-xl p-6 sidebar-card" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>📅 {t('mentors.book_session')}</h2>
              {user ? (
                user.role === 'mentore' ? (
                  <QuickBooking mentorId={mentor.id} mentorName={`${mentor.prenom} ${mentor.nom}`} />
                ) : (
                  <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>{t('mentors.mentee_only')}</p>
                )
              ) : (
                <Link href={`/login?redirect=/mentors/${mentor.id}`} className="sidebar-cta block w-full text-center px-4 py-3 rounded-lg font-medium" style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
                  {t('common.login')}
                </Link>
              )}
            </div>

            <div className="rounded-xl p-6 sidebar-card" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Mail className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                {t('mentors.contact')}
              </h2>
              <div className="flex items-center gap-2 text-sm hover-email" style={{ color: 'var(--text-secondary)' }}>
                <Mail className="w-4 h-4" />
                <a href={`mailto:${mentor.email}`} className="hover:underline" style={{ color: 'inherit' }}>{mentor.email}</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .back-btn { transition: transform 0.15s ease, color 0.15s ease; }
        .back-btn:hover { transform: translateX(-3px); color: var(--accent); }

        .fade-in-up { opacity: 0; transform: translateY(14px); animation: detailFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes detailFadeUp { to { opacity: 1; transform: translateY(0); } }

        .hero-banner { position: relative; }
        .hero-band {
          position: absolute;
          inset: 0;
          filter: blur(50px);
          opacity: 0.6;
          pointer-events: none;
        }
        .hero-band-2 { animation: heroBandDrift 8s ease-in-out infinite alternate; }
        @keyframes heroBandDrift { from { transform: translateX(0); } to { transform: translateX(-24px); } }

        .hero-avatar-ring {
          padding: 4px;
          border-radius: 9999px;
          background: linear-gradient(135deg, var(--accent), var(--accent-soft));
        }
        .avatar-pop { opacity: 0; transform: scale(0.85); animation: avatarPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.05s forwards; }
        @keyframes avatarPop { to { opacity: 1; transform: scale(1); } }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.9rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .hero-pill:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }

        .reveal-block { opacity: 0; transform: translateY(12px); animation: detailFadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        .competence-chip {
          opacity: 0; transform: scale(0.9);
          animation: chipPop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
          transition: all 0.3s ease; cursor: default;
        }
        @keyframes chipPop { to { opacity: 1; transform: scale(1); } }
        .competence-chip:hover { transform: translateY(-4px) scale(1.1) !important; box-shadow: 0 6px 16px rgba(0,0,0,0.12); filter: brightness(1.1); }

        .rating-panel { opacity: 0; transform: translateY(10px); animation: detailFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        .rating-row { opacity: 0; transform: translateX(-8px); animation: ratingRowIn 0.4s ease forwards; }
        @keyframes ratingRowIn { to { opacity: 1; transform: translateX(0); } }
        .rating-track { height: 8px; overflow: hidden; }
        .rating-fill { height: 100%; transition: width 0.8s cubic-bezier(0.16,1,0.3,1); }

        .avis-block { opacity: 0; transform: translateY(10px); animation: detailFadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; transition: border-color 0.3s ease; }
        .quote-mark { transition: color 0.3s ease; padding: 1px; border-radius: 9999px; }

        .sidebar-card { transition: all 0.3s ease; }
        .sidebar-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.1); }
        .sidebar-cta { transition: transform 0.25s ease, filter 0.25s ease, box-shadow 0.25s ease; }
        .sidebar-cta:hover { transform: translateY(-3px); filter: brightness(1.08); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
        .hover-email { transition: color 0.3s ease, transform 0.3s ease; }
        .hover-email:hover { color: var(--accent) !important; transform: translateX(2px); }
        .hover-btn { transition: transform 0.25s ease, filter 0.25s ease; }
        .hover-btn:hover { transform: translateY(-3px); filter: brightness(1.1); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }

        @media (prefers-reduced-motion: reduce) {
          .fade-in-up, .hero-band-2, .avatar-pop, .reveal-block,
          .competence-chip, .rating-panel, .rating-row, .rating-fill,
          .avis-block, .hover-btn, .hover-email { animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}