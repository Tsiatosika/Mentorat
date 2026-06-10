'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, Shield, Target, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', mot_de_passe: '' });

  const redirectTo = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (user) router.push(redirectTo);
  }, [user, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.mot_de_passe) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      await login(formData.email, formData.mot_de_passe);
      toast.success('Connexion réussie !');
      router.push(redirectTo);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Users, title: 'Mentorat personnalisé', desc: 'Connectez-vous avec des experts de votre domaine' },
    { icon: Target, title: 'Matching intelligent', desc: 'Trouvez le mentor idéal grâce à notre IA' },
    { icon: Clock, title: 'Gain de temps', desc: 'Réservation simplifiée en quelques clics' },
    { icon: Shield, title: 'Sécurisé', desc: 'Plateforme fiable et confidentielle' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Colonne gauche - Texte et bénéfices */}
          <div className="space-y-8">
            <div>
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-3xl">🎓</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Heureux de vous revoir !
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Connectez-vous pour continuer votre parcours de mentorat et accéder à vos sessions.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{benefit.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne droite - Formulaire */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connexion</h2>
              <p className="text-gray-600 dark:text-gray-400">Accédez à votre compte</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.mot_de_passe}
                    onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pas encore de compte ?{' '}
                <Link href="/register" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  Inscrivez-vous gratuitement
                </Link>
              </p>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> Comptes de démonstration
              </p>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 text-center">
                <p>👨‍🏫 Mentor: faneva@test.mg / Password123</p>
                <p>👨‍🎓 Mentoré: miora@test.mg / Password123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
