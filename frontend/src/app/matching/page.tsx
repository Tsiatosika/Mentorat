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
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <p className="font-mono-data text-xs uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              <Sparkles className="w-3.5 h-3.5" />
              {t('matching.subtitle')}
            </p>
            <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('matching.title')}
            </h1>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} style={{ color: 'var(--accent)' }} />
            {recalculating ? t('common.loading') : t('matching.refresh')}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {recommendations.length === 0 ? (
          <div className="card p-12 text-center">
            <Award className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t('matching.no_results')}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{t('matching.no_results_desc')}</p>
            <Link
              href="/profile"
              className="inline-block mt-4 px-4 py-2 rounded-lg font-medium"
              style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
            >
              {t('profile.title')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {recommendations.length} {t('matching.mentors_found')}
            </p>
            {recommendations.map((rec, index) => {
              const scoreColor = getScoreColor(rec.score);
              return (
                <div key={rec.mentor_id} className="card card-hover bookmark p-5">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-mono-data font-bold"
                          style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}
                        >
                          #{index + 1}
                        </div>
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{rec.mentor_nom}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" style={{ color: 'var(--warm)', fill: 'var(--warm)' }} />
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rec.mentor_note}/5</span>
                        </div>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{rec.mentor_domaine}</p>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('matching.compatibility_score')}</span>
                          <span className="font-mono-data font-bold" style={{ color: scoreColor }}>
                            {Math.round(rec.score * 100)}%
                          </span>
                        </div>
                        <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <div
                            className="h-2 rounded-full transition-all duration-500"
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
                          <div key={i} className="rounded-lg p-2 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            <div style={{ color: 'var(--text-tertiary)' }}>{item.label}</div>
                            <div className="font-mono-data font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {Math.round(item.value * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/mentors/${rec.mentor_user_id || rec.mentor_id}`}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
                      >
                        {t('matching.view_profile')}
                      </Link>
                      <Link
                        href={`/sessions/new?mentor=${rec.mentor_user_id || rec.mentor_id}`}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{ border: '2px solid var(--accent)', color: 'var(--accent)' }}
                      >
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
    </div>
  );
}