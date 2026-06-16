'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users, Calendar, MessageCircle, Award, ArrowRight, Sparkles, Shield, Clock, Video, Star, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { publicAPI } from '@/services/api';

export default function Home() {
  const { user } = useAuth();
  const [topMentors, setTopMentors] = useState<any[]>([]);
  const [stats, setStats] = useState({ mentors: 0, sessions: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mentorsRes = await publicAPI.searchMentors({ limit: 6 });
        if (mentorsRes.data?.data) setTopMentors(mentorsRes.data.data);
        setStats({ mentors: mentorsRes.data?.pagination?.total || 0, sessions: 1248 });
      } catch {}
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  const features = [
    { icon: Users, title: 'Matching IA', description: 'Trouvez le mentor parfait grâce à notre algorithme intelligent' },
    { icon: Calendar, title: 'Réservation facile', description: 'Planifiez vos sessions en quelques clics' },
    { icon: MessageCircle, title: 'Chat en temps réel', description: 'Communications instantanées avec votre mentor' },
    { icon: Video, title: 'Visioconférence', description: 'Sessions en ligne avec lien intégré' },
    { icon: Award, title: 'Certification', description: 'Obtenez des certificats de progression' },
    { icon: Shield, title: 'Sécurisé', description: 'Plateforme sécurisée et confidentielle' },
  ];

  const getNoteDisplay = (note: any) => {
    const n = Number(note);
    return isNaN(n) || n === 0 ? 'Nouveau' : n.toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 lg:py-28">
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-xs text-white">Plateforme de mentorat nouvelle génération</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Trouvez le mentor qui
              <br />
              <span className="text-blue-400 bg-white/10 px-3 py-1 rounded-lg inline-block mt-2">vous révélera</span>
            </h1>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Rejoignez notre communauté et accélérez votre apprentissage grâce à un mentorat personnalisé avec matching IA
            </p>

            {/* Boutons d'action */}
            <div className="flex flex-wrap gap-4 justify-center">
              {!user ? (
                <>
                  <Link
                    href="/mentors"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <Search className="w-5 h-5" />
                    Trouver un mentor
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                  >
                    Commencer gratuitement
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/mentors"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <Search className="w-5 h-5" />
                    Trouver un mentor
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                  >
                    Tableau de bord
                  </Link>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.mentors}+</div>
                <div className="text-blue-200 text-sm mt-1">Mentors experts</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.sessions}+</div>
                <div className="text-blue-200 text-sm mt-1">Sessions réalisées</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-blue-200 text-sm mt-1">Taux de satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-blue-200 text-sm mt-1">Support disponible</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-12">
          <svg className="absolute bottom-0 w-full h-12 text-white dark:text-gray-900" preserveAspectRatio="none" viewBox="0 0 1440 48">
            <path fill="currentColor" d="M0 20L120 14C240 8 480 0 720 0C960 0 1200 8 1320 14L1440 20V48H0V20Z" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">Pourquoi choisir notre plateforme ?</h2>
          <p className="text-gray-600 dark:text-gray-400">Une expérience de mentorat complète et innovante</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-800">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Mentors Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">Nos mentors exceptionnels</h2>
            <p className="text-gray-600 dark:text-gray-400">Des experts passionnés prêts à vous accompagner</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topMentors.slice(0, 3).map((mentor: any) => (
              <div key={mentor.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-800 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {mentor.prenom?.[0]}{mentor.nom?.[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{getNoteDisplay(mentor.note_moyenne)}</span>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{mentor.prenom} {mentor.nom}</h3>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-3">{mentor.domaine || 'Expert'}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{mentor.annees_experience || 0} ans</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{mentor.nb_sessions || 0} sessions</span>
                </div>
                <Link href={`/mentors/${mentor.id}`} className="block w-full text-center px-3 py-2 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium text-sm">
                  Voir le profil
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Prêt à commencer votre parcours ?</h2>
          <p className="text-blue-200 mb-6">Rejoignez des milliers d'étudiants qui ont déjà trouvé leur mentor idéal</p>
          {!user ? (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Inscription gratuite <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/mentors"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Search className="w-5 h-5" />
              Trouver un mentor
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">© 2025 Université Adventiste Zurcher — Plateforme de Mentorat Académique</p>
          <p className="text-gray-500 text-xs mt-2">RAMAMONJISOA Sitrakiniaina Tsiatosika — Projet de Fin d'Études</p>
        </div>
      </footer>
    </div>
  );
}
