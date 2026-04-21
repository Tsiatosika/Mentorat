'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { publicAPI } from '@/services/api';

export default function Home() {
  const { user } = useAuth();
  const [topMentors, setTopMentors] = useState([]);
  const [stats, setStats] = useState({ mentors: 0, sessions: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mentorsRes = await publicAPI.searchMentors({ limit: 6 });
        setTopMentors(mentorsRes.data.data || []);
        setStats({
          mentors: mentorsRes.data.pagination?.total || 0,
          sessions: 0,
        });
      } catch (error) {
        console.error('Erreur chargement:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">
                🎓 Mentorat Académique
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600">
                    Tableau de bord
                  </Link>
                  <Link href="/profile" className="text-gray-700 hover:text-indigo-600">
                    {user.prenom} {user.nom}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-indigo-600">
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Trouvez le mentor idéal pour réussir
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Plateforme de mentorat académique avec matching intelligent
          </p>
          {!user && (
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700"
            >
              Commencer maintenant
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">{stats.mentors}+</div>
            <div className="text-gray-600 mt-2">Mentors disponibles</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">100%</div>
            <div className="text-gray-600 mt-2">Satisfaction</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">24/7</div>
            <div className="text-gray-600 mt-2">Support</div>
          </div>
        </div>

        {/* Top Mentors */}
        {topMentors.length > 0 && (
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Meilleurs mentors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topMentors.map((mentor: any) => (
                <div key={mentor.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-indigo-600">
                          {mentor.prenom?.[0]}{mentor.nom?.[0]}
                        </span>
                      </div>
                      <div className="text-yellow-500">
                        {'★'.repeat(Math.floor(mentor.note_moyenne || 0))}
                        {'☆'.repeat(5 - Math.floor(mentor.note_moyenne || 0))}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {mentor.prenom} {mentor.nom}
                    </h3>
                    <p className="text-gray-600 mt-1">{mentor.domaine || 'Domaine non spécifié'}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {mentor.nb_sessions || 0} sessions • {mentor.annees_experience || 0} ans d'expérience
                    </p>
                    <Link
                      href={`/mentors/${mentor.id}`}
                      className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
                    >
                      Voir le profil →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}