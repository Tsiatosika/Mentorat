'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, completeProfile, loading: authLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'mentor' | 'mentore' | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Ne redirige vers /dashboard QUE quand user.role est confirmé mis à jour dans le contexte
  useEffect(() => {
    if (submitted && user && user.role) {
      router.push('/dashboard');
    }
  }, [submitted, user, router]);

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error('Veuillez choisir un rôle');
      return;
    }

    setLoading(true);
    try {
      await completeProfile(selectedRole);
      setSubmitted(true);
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full rounded-2xl shadow-2xl p-8" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🎓</span>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Bienvenue {user?.prenom} !
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Pour finaliser votre inscription, dites-nous qui vous êtes
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('mentore')}
            disabled={loading}
            className={`py-4 rounded-lg border-2 transition-all ${
              selectedRole === 'mentore'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-2">👨‍🎓</span>
              <span className="text-sm font-medium">Mentoré(e)</span>
              <span className="text-xs mt-1">Je cherche un mentor</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('mentor')}
            disabled={loading}
            className={`py-4 rounded-lg border-2 transition-all ${
              selectedRole === 'mentor'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-300'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-2">👨‍🏫</span>
              <span className="text-sm font-medium">Mentor</span>
              <span className="text-xs mt-1">Je partage mes compétences</span>
            </div>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !selectedRole}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Continuer'
          )}
        </button>
      </div>
    </div>
  );
}