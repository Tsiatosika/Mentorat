'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎓</span>
              <span className="text-xl font-bold text-gray-900">Tableau de bord</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                {user.prenom} {user.nom} ({user.role === 'mentor' ? '👨‍🏫 Mentor' : '👨‍🎓 Mentoré'})
              </span>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Bienvenue, {user.prenom} !
          </h1>
          <p className="text-gray-600 mb-6">
            Vous êtes connecté en tant que {user.role === 'mentor' ? 'mentor' : 'mentoré'}.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">Prochaines sessions</div>
              <div className="text-sm opacity-90">Aucune session prévue</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">Progression</div>
              <div className="text-sm opacity-90">0% complété</div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">Messages</div>
              <div className="text-sm opacity-90">0 non lus</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}