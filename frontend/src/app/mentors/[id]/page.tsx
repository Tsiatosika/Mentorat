'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Users, Star, CheckCircle, XCircle, Mail, MessageSquareQuote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicAPI, avisAPI } from '@/services/api';
import { QuickBooking } from '@/components/mentors/QuickBooking';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';

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

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [mentor, setMentor] = useState<any>(null);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setMentor(response.data.mentor);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
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
          <h2 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('mentors.not_found')}
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{error || t('common.error')}</p>
          <button
            onClick={() => router.back()}
            className="inline-block px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const criteriaLabels = [
    { key: 'note_ponctualite' as const, label: t('mentors.criteria_punctuality') },
    { key: 'note_pedagogie' as const, label: t('mentors.criteria_pedagogy') },
    { key: 'note_disponibilite' as const, label: t('mentors.criteria_availability') },
  ];

  return (
    <div className="min-h-screen mentor-detail-page" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="back-btn inline-flex items-center gap-2 mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>

        <div className="card overflow-hidden fade-in-up">
          {/* Header profil */}
          <div className="px-8 py-8 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <div className="detail-glow" style={{ backgroundColor: 'var(--accent-soft)' }} />
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
              <div className="avatar-pop">
                <Avatar photoUrl={mentor.photo_url} prenom={mentor.prenom} nom={mentor.nom} size={128} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {mentor.prenom} {mentor.nom}
                </h1>
                <p className="text-lg" style={{ color: 'var(--accent)' }}>{mentor.domaine || t('mentors.expert')}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 justify-center md:justify-start">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5" style={{ color: 'var(--warm)', fill: 'var(--warm)' }} />
                    <span className="font-mono-data font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {getNoteDisplay(mentor.note_moyenne)}/5
                    </span>
                    {avis.length > 0 && (
                      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>({avis.length} avis)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <Users className="w-5 h-5" />
                    <span>{mentor.nb_sessions || 0} {t('mentors.sessions')}</span>
                  </div>
                  <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <Clock className="w-5 h-5" />
                    <span>{mentor.annees_experience || 0} {t('mentors.years')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {mentor.disponible ? (
                      <><CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} /><span style={{ color: 'var(--text-secondary)' }}>{t('mentors.is_available')}</span></>
                    ) : (
                      <><XCircle className="w-5 h-5" style={{ color: 'var(--danger)' }} /><span style={{ color: 'var(--text-secondary)' }}>{t('mentors.unavailable')}</span></>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="reveal-block" style={{ animationDelay: '0.05s' }}>
                  <h2 className="font-display text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {t('mentors.about')}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                    {mentor.bio || t('mentors.no_bio')}
                  </p>
                </div>

                {mentor.competences && mentor.competences.length > 0 && (
                  <div className="reveal-block" style={{ animationDelay: '0.1s' }}>
                    <h2 className="font-display text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                      {t('matching.competences')}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {mentor.competences.map((comp: string, index: number) => (
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

                {/* Section Avis */}
                <div className="reveal-block" style={{ animationDelay: '0.15s' }}>
                  <h2
                    className="font-display text-xl font-semibold mb-3 flex items-center gap-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <MessageSquareQuote className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    {t('mentors.reviews')} ({avis.length})
                  </h2>

                  {avis.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {t('mentors.no_reviews')}
                    </p>
                  ) : (
                    <>
                      {/* Moyennes par critère */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        {criteriaLabels.map((c, ci) => (
                          <div key={c.key} className="criterion-chip rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--bg-secondary)', animationDelay: `${0.18 + ci * 0.05}s` }}>
                            <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{c.label}</div>
                            <div className="font-mono-data font-semibold flex items-center justify-center gap-1" style={{ color: 'var(--text-primary)' }}>
                              <Star className="w-3.5 h-3.5" style={{ color: 'var(--warm)', fill: 'var(--warm)' }} />
                              {avgCriteria(c.key).toFixed(1)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Liste des avis */}
                      <div className="space-y-4">
                        {avis.map((a, ai) => (
                          <div key={a.id} className="card bookmark p-4 avis-card" style={{ animationDelay: `${0.2 + ai * 0.05}s` }}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                                >
                                  {a.prenom?.[0]}{a.nom?.[0]}
                                </div>
                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                  {a.prenom} {a.nom?.[0]}.
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4" style={{ color: 'var(--warm)', fill: 'var(--warm)' }} />
                                <span className="font-mono-data text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {Number(a.note_globale).toFixed(1)}
                                </span>
                              </div>
                            </div>
                            {a.commentaire && (
                              <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
                                {a.commentaire}
                              </p>
                            )}
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatDate(a.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-6 reveal-block" style={{ animationDelay: '0.1s' }}>
                <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    📅 {t('mentors.book_session')}
                  </h2>
                  {user ? (
                    user.role === 'mentore' ? (
                      <QuickBooking mentorId={mentor.id} mentorName={`${mentor.prenom} ${mentor.nom}`} />
                    ) : (
                      <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                        {t('mentors.mentee_only')}
                      </p>
                    )
                  ) : (
                    <Link
                      href={`/login?redirect=/mentors/${mentor.id}`}
                      className="sidebar-cta block w-full text-center px-4 py-3 rounded-lg font-medium"
                      style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
                    >
                      {t('common.login')}
                    </Link>
                  )}
                </div>

                <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Mail className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    {t('mentors.contact')}
                  </h2>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${mentor.email}`} className="hover:underline" style={{ color: 'inherit' }}>
                      {mentor.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .back-btn {
          transition: transform 0.15s ease, color 0.15s ease;
        }
        .back-btn:hover {
          transform: translateX(-3px);
          color: var(--accent);
        }

        .fade-in-up {
          opacity: 0;
          transform: translateY(14px);
          animation: detailFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes detailFadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .detail-glow {
          position: absolute;
          top: -40%;
          left: 50%;
          transform: translateX(-50%);
          width: 480px;
          height: 280px;
          border-radius: 9999px;
          filter: blur(70px);
          opacity: 0.5;
          pointer-events: none;
          animation: detailGlowPulse 6s ease-in-out infinite;
        }
        @keyframes detailGlowPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.55; }
        }

        .avatar-pop {
          opacity: 0;
          transform: scale(0.85);
          animation: avatarPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s forwards;
        }
        @keyframes avatarPop {
          to { opacity: 1; transform: scale(1); }
        }

        .reveal-block {
          opacity: 0;
          transform: translateY(12px);
          animation: detailFadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .competence-chip {
          opacity: 0;
          transform: scale(0.9);
          animation: chipPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes chipPop {
          to { opacity: 1; transform: scale(1); }
        }

        .criterion-chip, .avis-card {
          opacity: 0;
          transform: translateY(10px);
          animation: detailFadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .sidebar-cta {
          transition: transform 0.18s ease, filter 0.18s ease;
        }
        .sidebar-cta:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
        }

        @media (prefers-reduced-motion: reduce) {
          .fade-in-up, .detail-glow, .avatar-pop, .reveal-block,
          .competence-chip, .criterion-chip, .avis-card {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}