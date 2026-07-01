'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Award, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { matchingAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface Recommendation {
  mentor_id: string;
  mentor_user_id: string;
  mentor_nom: string;
  mentor_domaine: string;
  mentor_note: number;
  score: number;
  score_competences: number;
  score_domaine: number;
  score_reputation: number;
  score_experience: number;
}

export default function MatchingPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [source, setSource] = useState('');
  const [hoveredRec, setHoveredRec] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'mentore') {
      router.push('/dashboard');
      toast.error(t('matching.mentor_only'));
      return;
    }
    fetchRecommendations();
  }, [user, router]);

  const fetchRecommendations = async (forceRecalc = false) => {
    setLoading(true);
    try {
      const response = await matchingAPI.getRecommendations(forceRecalc);
      const recs = response.data.recommendations || response.data.recommandations || [];
      setRecommendations(recs);
      setSource(response.data.source || 'unknown');
      if (recs.length === 0 && !forceRecalc) {
        toast(t('matching.no_results'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('common.error'));
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    await fetchRecommendations(true);
    setRecalculating(false);
    toast.success(t('matching.updated'));
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'var(--success)';
    if (score >= 0.6) return 'var(--warm)';
    if (score >= 0.4) return 'var(--info)';
    return 'var(--text-tertiary)';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return t('matching.excellent');
    if (score >= 0.6) return t('matching.very_good');
    if (score >= 0.4) return t('matching.good');
    return t('matching.potential');
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

  return (
    <div className="min-h-screen matching-ambient" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="matching-orb matching-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
        <div className="matching-orb matching-orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-10 pb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <p className="font-mono-data text-xs uppercase tracking-wide mb-2 flex items-center gap-1 fade-in-up" style={{ color: 'var(--accent)' }}>
              <Sparkles className="w-3.5 h-3.5 sparkle-icon" />
              {t('matching.subtitle')}
            </p>
            <h1 className="font-display text-3xl font-semibold fade-in-up hover-gradient-text" style={{ color: 'var(--text-primary)', animationDelay: '0.05s' }}>
              {t('matching.title')}
            </h1>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-all hover-lift fade-in-up"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', animationDelay: '0.08s' }}
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} style={{ color: 'var(--accent)' }} />
            {recalculating ? t('common.loading') : t('matching.refresh')}
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-8">
        {recommendations.length === 0 ? (
          <div className="card p-12 text-center fade-in-up">
            <Award className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t('matching.no_results')}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{t('matching.no_results_desc')}</p>
            <Link href="/profile" className="inline-block mt-4 px-4 py-2 rounded-lg font-medium hover-btn" style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
              {t('profile.title')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm mb-4 fade-in-up" style={{ color: 'var(--text-secondary)' }}>
              {recommendations.length} {t('matching.mentors_found')}
            </p>
            {recommendations.map((rec, index) => {
              const scoreColor = getScoreColor(rec.score);
              const isHovered = hoveredRec === rec.mentor_id;

              return (
                <div
                  key={rec.mentor_id}
                  className="card p-5 matching-card-hover fade-in-up"
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                  onMouseEnter={() => setHoveredRec(rec.mentor_id)}
                  onMouseLeave={() => setHoveredRec(null)}
                >
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-mono-data font-bold matching-avatar transition-all duration-400 ease-bounce"
                          style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}
                        >
                          #{index + 1}
                        </div>
                        <h3 className="text-lg font-semibold matching-name" style={{ color: isHovered ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {rec.mentor_nom}
                        </h3>
                        <div className="flex items-center gap-1 matching-rating">
                          <Star className="w-4 h-4" style={{ color: 'var(--warm)', fill: 'var(--warm)' }} />
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rec.mentor_note}/5</span>
                        </div>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{rec.mentor_domaine}</p>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('matching.compatibility_score')}</span>
                          <span className="font-mono-data font-bold score-value" style={{ color: scoreColor }}>
                            {Math.round(rec.score * 100)}%
                          </span>
                        </div>
                        <div className="w-full rounded-full h-2 score-bar-bg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <div
                            className="h-2 rounded-full transition-all duration-700 score-bar"
                            style={{ width: `${rec.score * 100}%`, backgroundColor: scoreColor }}
                          />
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{getScoreLabel(rec.score)}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        {[
                          { label: t('matching.competences'), value: rec.score_competences },
                          { label: t('matching.domain'), value: rec.score_domaine },
                          { label: t('matching.reputation'), value: rec.score_reputation },
                          { label: t('matching.experience'), value: rec.score_experience },
                        ].map((item, i) => (
                          <div key={i} className="rounded-lg p-2 text-center score-detail-chip transition-all duration-300" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            <div style={{ color: 'var(--text-tertiary)' }}>{item.label}</div>
                            <div className="font-mono-data font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {Math.round(item.value * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/mentors/${rec.mentor_user_id || rec.mentor_id}`} className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover-btn-primary" style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
                        {t('matching.view_profile')}
                      </Link>
                      <Link href={`/sessions/new?mentor=${rec.mentor_user_id || rec.mentor_id}`} className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover-btn-secondary" style={{ border: '2px solid var(--accent)', color: 'var(--accent)' }}>
                        {t('matching.book')}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        .matching-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          opacity: 0.3;
          will-change: transform;
        }
        .matching-orb-1 { width: 20rem; height: 20rem; top: -6rem; right: -4rem; animation: matchingFloat1 24s ease-in-out infinite; }
        .matching-orb-2 { width: 16rem; height: 16rem; bottom: -4rem; left: -3rem; animation: matchingFloat2 28s ease-in-out infinite; }

        @keyframes matchingFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 25px) scale(1.05); }
        }
        @keyframes matchingFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -15px) scale(1.06); }
        }

        .fade-in-up {
          opacity: 0;
          transform: translateY(12px);
          animation: matchingFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes matchingFadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        /* ─── ANIMATIONS DE SURVOL ─── */
        .sparkle-icon {
          transition: transform 0.4s ease;
        }
        .sparkle-icon:hover {
          transform: rotate(20deg) scale(1.2);
        }

        .hover-gradient-text {
          transition: all 0.4s ease;
          cursor: default;
          display: inline-block;
        }
        .hover-gradient-text:hover {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hover-lift {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .hover-lift:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }

        .hover-btn {
          transition: transform 0.25s ease, filter 0.25s ease, box-shadow 0.25s ease;
        }
        .hover-btn:hover {
          transform: translateY(-3px);
          filter: brightness(1.1);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }

        /* Cartes matching */
        .matching-card-hover {
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .matching-card-hover:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
          border-color: var(--accent) !important;
        }

        .matching-avatar {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .matching-card-hover:hover .matching-avatar {
          transform: scale(1.15);
          box-shadow: 0 6px 18px var(--accent-soft);
        }

        .matching-name {
          transition: color 0.3s ease;
        }

        .matching-rating {
          transition: transform 0.3s ease;
        }
        .matching-card-hover:hover .matching-rating {
          transform: scale(1.08);
        }

        .score-value {
          transition: transform 0.3s ease;
        }
        .matching-card-hover:hover .score-value {
          transform: scale(1.1);
        }

        .score-bar {
          transition: filter 0.3s ease;
        }
        .matching-card-hover:hover .score-bar {
          filter: brightness(1.3);
        }

        .score-detail-chip {
          transition: all 0.3s ease;
        }
        .score-detail-chip:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          background-color: var(--accent-soft) !important;
        }

        /* Boutons */
        .hover-btn-primary {
          transition: all 0.3s ease;
        }
        .hover-btn-primary:hover {
          transform: translateY(-3px);
          filter: brightness(1.1);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }

        .hover-btn-secondary {
          transition: all 0.3s ease;
        }
        .hover-btn-secondary:hover {
          background-color: var(--accent) !important;
          color: #FFFFFF !important;
          transform: translateY(-3px);
        }

        @media (prefers-reduced-motion: reduce) {
          .matching-orb, .fade-in-up,
          .matching-card-hover, .hover-lift, .hover-btn {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}