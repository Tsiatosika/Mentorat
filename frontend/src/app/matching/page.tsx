'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Award, TrendingUp, Sparkles, RefreshCw, User } from 'lucide-react';
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
      console.log('Réponse API:', response.data);
      
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
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-gray-500';
  };

  const getBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-600';
    if (score >= 0.6) return 'bg-yellow-500';
    if (score >= 0.4) return 'bg-orange-500';
    return 'bg-gray-400';
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
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                {t('matching.title')}
              </h1>
              <p className="text-indigo-100 mt-1">{t('matching.subtitle')}</p>
              {source && (
                <p className="text-indigo-200 text-xs mt-2">
                  🤖 {source === 'python-ia' ? t('matching.python_ia') : t('matching.algorithm')}
                </p>
              )}
            </div>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? t('common.loading') : t('matching.refresh')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {recommendations.length === 0 ? (
          <div className="rounded-xl shadow-md p-12 text-center" style={{ backgroundColor: 'var(--card-bg)' }}>
            <Award className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t('matching.no_results')}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{t('matching.no_results_desc')}</p>
            <Link
              href="/profile"
              className="inline-block mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              {t('profile.title')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {recommendations.length} {t('matching.mentors_found')}
            </p>
            {recommendations.map((rec, index) => (
              <div key={rec.mentor_id} className="rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className="p-5">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          #{index + 1}
                        </div>
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{rec.mentor_nom}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rec.mentor_note}/5</span>
                        </div>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{rec.mentor_domaine}</p>
                      
                      {/* Barre de score */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('matching.compatibility_score')}</span>
                          <span className={`font-bold ${getScoreColor(rec.score)}`}>
                            {Math.round(rec.score * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${getBgColor(rec.score)} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${rec.score * 100}%` }}
                          />
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{getScoreLabel(rec.score)}</p>
                      </div>

                      {/* Détails des scores */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="rounded-lg p-2 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <div style={{ color: 'var(--text-tertiary)' }}>{t('matching.competences')}</div>
                          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{Math.round(rec.score_competences * 100)}%</div>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <div style={{ color: 'var(--text-tertiary)' }}>{t('matching.domain')}</div>
                          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{Math.round(rec.score_domaine * 100)}%</div>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <div style={{ color: 'var(--text-tertiary)' }}>{t('matching.reputation')}</div>
                          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{Math.round(rec.score_reputation * 100)}%</div>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <div style={{ color: 'var(--text-tertiary)' }}>{t('matching.experience')}</div>
                          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{Math.round(rec.score_experience * 100)}%</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link
                        href={`/mentors/${rec.mentor_user_id || rec.mentor_id}`}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                      >
                        {t('matching.view_profile')}
                      </Link>
                      <Link
                        href={`/sessions/new?mentor=${rec.mentor_user_id || rec.mentor_id}`}
                        className="px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm"
                      >
                        {t('matching.book')}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
