'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/Logo';
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
      <div className="card max-w-md w-full p-8 animate-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={64} />
          </div>
          <h2 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
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
            className="py-4 rounded-lg border-2 transition-all"
            style={{
              borderColor: selectedRole === 'mentore' ? 'var(--accent)' : 'var(--border)',
              backgroundColor: selectedRole === 'mentore' ? 'var(--accent-soft)' : 'transparent',
              color: selectedRole === 'mentore' ? 'var(--accent-text-on-soft)' : 'var(--text-secondary)',
            }}
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
            className="py-4 rounded-lg border-2 transition-all"
            style={{
              borderColor: selectedRole === 'mentor' ? 'var(--accent)' : 'var(--border)',
              backgroundColor: selectedRole === 'mentor' ? 'var(--accent-soft)' : 'transparent',
              color: selectedRole === 'mentor' ? 'var(--accent-text-on-soft)' : 'var(--text-secondary)',
            }}
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
          className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
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