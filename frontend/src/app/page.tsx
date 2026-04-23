'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  Award, 
  ArrowRight, 
  Sparkles,
  Shield,
  Clock,
  Video
} from 'lucide-react';
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
        if (mentorsRes.data && mentorsRes.data.data) {
          setTopMentors(mentorsRes.data.data);
        }
        setStats({
          mentors: mentorsRes.data?.pagination?.total || 0,
          sessions: 1248,
        });
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setIsLoading(false);
      }
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

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Fonction pour afficher la note
  const getNoteDisplay = (note: any) => {
    if (note === null || note === undefined) return 'Nouveau';
    const numNote = Number(note);
    if (isNaN(numNote)) return 'Nouveau';
    return numNote.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")',
          }}
        />
        
        {/* Simple decorative blurs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">🎓</span>
                </div>
                <span className="text-xl font-bold text-white">Mentorat Académique</span>
              </div>
              <div className="flex items-center space-x-4">
                {user ? (
                  <Link 
                    href="/dashboard" 
                    className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                  >
                    Tableau de bord
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                      Connexion
                    </Link>
                    <Link 
                      href="/register" 
                      className="px-4 py-2 rounded-lg bg-white text-indigo-600 hover:bg-gray-100 transition-colors font-medium"
                    >
                      Inscription gratuite
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm text-white">Plateforme de mentorat nouvelle génération</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Trouvez le mentor qui
              <span className="bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                {' '}vous révélera
              </span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Rejoignez notre communauté et accélérez votre apprentissage grâce à un mentorat personnalisé avec matching IA
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {!user && (
                <Link 
                  href="/register" 
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-indigo-600 hover:bg-gray-100 transition-colors font-medium text-lg"
                >
                  Commencer maintenant
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              <Link 
                href="/mentors" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white text-white hover:bg-white/10 transition-colors font-medium text-lg"
              >
                Explorer les mentors
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.mentors}+</div>
                <div className="text-gray-300 text-sm">Mentors experts</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.sessions}+</div>
                <div className="text-gray-300 text-sm">Sessions réalisées</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-gray-300 text-sm">Taux de satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-gray-300 text-sm">Support disponible</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="relative h-16">
          <svg className="absolute bottom-0 w-full h-16 text-white" preserveAspectRatio="none" viewBox="0 0 1440 54">
            <path fill="currentColor" d="M0 22L120 16.7C240 11 480 0 720 0C960 0 1200 11 1320 16.7L1440 22V54H1320C1200 54 960 54 720 54C480 54 240 54 120 54H0V22Z" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pourquoi choisir notre plateforme ?
          </h2>
          <p className="text-xl text-gray-600">
            Une expérience de mentorat complète et innovante
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-xl overflow-hidden p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Mentors Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nos mentors exceptionnels
            </h2>
            <p className="text-xl text-gray-600">
              Des experts passionnés prêts à vous accompagner
            </p>
          </div>

          {topMentors.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement des mentors...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topMentors.map((mentor: any) => (
                <div key={mentor.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-white">
                          {mentor.prenom?.charAt(0) || ''}{mentor.nom?.charAt(0) || ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold">
                          {getNoteDisplay(mentor.note_moyenne)}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {mentor.prenom || ''} {mentor.nom || ''}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">{mentor.domaine || 'Expert'}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {mentor.annees_experience || 0} ans exp.
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {mentor.nb_sessions || 0} sessions
                      </span>
                    </div>
                    <Link 
                      href={`/mentors/${mentor.id}`}
                      className="block w-full text-center px-4 py-2 rounded-lg border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
                    >
                      Voir le profil
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à commencer votre parcours ?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Rejoignez des milliers d'étudiants qui ont déjà trouvé leur mentor idéal
          </p>
          {!user && (
            <Link 
              href="/register" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-indigo-600 hover:bg-gray-100 transition-colors font-medium text-lg"
            >
              Inscription gratuite
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2025 Université Adventiste Zurcher - Plateforme de Mentorat Académique
            </p>
            <p className="text-gray-500 text-sm mt-2">
              RAMAMONJISOA Sitrakiniaina Tsiatosika - Projet de Fin d'Études
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}