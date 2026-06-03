'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Award, TrendingUp, Sparkles, RefreshCw, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { matchingAPI } from '@/services/api';
import toast from 'react-hot-toast';

// CORRECTION 2 : interface alignée sur la réponse réelle du microservice IA Python
interface Recommendation {
  mentor_id:         string;
  nom:               string;
  prenom:            string;
  photo_url:         string | null;
  domaine:           string | null;
  note_moyenne:      number;
  nb_sessions:       number;
  competences:       string[];
  score:             number;
  score_competences: number;
  score_dispo:       number;       // ← "score_disponibilites" dans l'ancien code était incorrect
  score_objectifs:   number;
  score_reputation:  number;
}

export default function MatchingPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [recalculating,    setRecalculating]    = useState(false);
  const [fromCache,        setFromCache]        = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role === 'mentor') {
      router.push('/dashboard');
      toast.error('Le matching IA est réservé aux mentorés');
      return;
    }
    fetchRecommendations();
  }, [user, router]);

  const fetchRecommendations = async (forceRecalc = false) => {
    setLoading(true);
    try {
      const response = await matchingAPI.getRecommendations(forceRecalc);
      // CORRECTION 3 : le microservice retourne "recommandations" (pas "recommendations")
      setRecommendations(response.data.recommandations || []);
      setFromCache(response.data.depuis_cache ?? false);
    } catch (error: any) {
      console.error('Erreur matching:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des recommandations');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await fetchRecommendations(true);
      toast.success('Recommandations mises à jour');
    } finally {
      setRecalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent match !';
    if (score >= 0.6) return 'Très bon match';
    if (score >= 0.4) return 'Bon match';
    return 'Match potentiel';
  };

  const getBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-600';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Analyse des meilleurs mentors pour vous...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                Recommandations IA
              </h1>
              <p className="text-indigo-100 mt-1">
                {fromCache ? 'Résultats depuis le cache' : 'Résultats recalculés à l\'instant'}
                {recommendations.length > 0 && ` · ${recommendations.length} mentor(s) trouvé(s)`}
              </p>
            </div>
            <button onClick={handleRecalculate} disabled={recalculating}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 disabled:opacity-60">
              <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recalcul...' : 'Actualiser'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {recommendations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune recommandation disponible</h3>
            <p className="text-gray-500">Complétez votre profil et vos objectifs pour recevoir des recommandations personnalisées.</p>
            <Link href="/profile"
              className="inline-block mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Compléter mon profil
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {recommendations.map((rec, index) => (
              <div key={rec.mentor_id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all">
                <div className="p-6">
                  {/* En-tête : rang + identité + score */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        {rec.photo_url
                          ? <img src={rec.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                          : <span className="text-lg font-bold text-white">{index + 1}</span>
                        }
                      </div>
                      <div>
                        {/* CORRECTION 4 : nom + prenom depuis le microservice IA */}
                        <h3 className="text-lg font-semibold text-gray-900">{rec.prenom} {rec.nom}</h3>
                        <p className="text-sm text-gray-500">{rec.domaine || 'Expert'}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-gray-500">
                            {rec.note_moyenne.toFixed(1)}/5 · {rec.nb_sessions} session(s)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-2xl font-bold ${getScoreColor(rec.score)}`}>
                        {Math.round(rec.score * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">{getScoreLabel(rec.score)}</div>
                    </div>
                  </div>

                  {/* Barre de score globale */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`${getBgColor(rec.score)} h-2 rounded-full transition-all duration-700`}
                        style={{ width: `${rec.score * 100}%` }} />
                    </div>
                  </div>

                  {/* Compétences */}
                  {rec.competences?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {rec.competences.slice(0, 5).map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{c}</span>
                      ))}
                      {rec.competences.length > 5 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">+{rec.competences.length - 5}</span>
                      )}
                    </div>
                  )}

                  {/* Détails des 4 scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                    {[
                      { label: 'Compétences',  value: rec.score_competences },
                      // CORRECTION 5 : score_dispo (et non score_disponibilites)
                      { label: 'Disponibilité', value: rec.score_dispo },
                      { label: 'Objectifs',    value: rec.score_objectifs },
                      { label: 'Réputation',   value: rec.score_reputation },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <div className="text-xs text-gray-500 mb-1">{label}</div>
                        <div className={`font-semibold text-sm ${getScoreColor(value)}`}>
                          {Math.round(value * 100)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div className={`${getBgColor(value)} h-1 rounded-full`}
                            style={{ width: `${value * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-3">
                    <Link href={`/mentors/${rec.mentor_id}`}
                      className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      Voir le profil
                    </Link>
                    <Link href={`/sessions/new?mentor=${rec.mentor_id}`}
                      className="flex-1 text-center px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                      Réserver
                    </Link>
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