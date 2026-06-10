'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users, Calendar, MessageCircle, Award, ArrowRight, Sparkles, Shield, Clock, Video, Star } from 'lucide-react';
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
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
            {!user && (
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
                  Commencer gratuitement <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/mentors"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                  Voir les mentors
                </Link>
              </div>
            )}

            {/* Stats */}
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
            <div key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Prêt à commencer votre parcours ?</h2>
          <p className="text-blue-200 mb-6">Rejoignez des milliers d'étudiants qui ont déjà trouvé leur mentor idéal</p>
          {!user && (
            <Link href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
              Inscription gratuite <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">© 2025 Université Adventiste Zurcher — Plateforme de Mentorat Académique</p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">RAMAMONJISOA Sitrakiniaina Tsiatosika — Projet de Fin d'Études</p>
        </div>
      </footer>
    </div>
  );
}
