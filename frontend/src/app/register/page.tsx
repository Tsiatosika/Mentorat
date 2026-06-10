'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Sparkles, Shield, Target, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    role: 'mentore',
  });
  const [passwordStrength, setPasswordStrength] = useState({ length: false, uppercase: false, number: false });

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.prenom || !formData.email || !formData.mot_de_passe) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!passwordStrength.length || !passwordStrength.uppercase || !passwordStrength.number) {
      toast.error('Le mot de passe doit respecter les critères de sécurité');
      return;
    }

    setLoading(true);
    try {
      await register({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        mot_de_passe: formData.mot_de_passe,
        role: formData.role
      });
      toast.success('Inscription réussie !');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, title: 'Matching IA intelligent', desc: 'Trouvez le mentor idéal selon vos objectifs' },
    { icon: Target, title: 'Recommandations personnalisées', desc: 'Suggestions basées sur vos compétences' },
    { icon: Shield, title: 'Suivi de progression', desc: 'Mesurez votre évolution à chaque session' },
    { icon: FileText, title: 'Rapports PDF automatiques', desc: 'Téléchargez vos rapports de progression' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Colonne gauche - Features */}
          <div className="space-y-6 order-2 md:order-1">
            <div>
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-3xl">🎓</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Rejoignez la communauté de mentorat intelligente
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Créez votre compte gratuitement et connectez-vous avec des experts de votre domaine
                grâce à notre algorithme de matching par Intelligence Artificielle.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne droite - Formulaire */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 order-1 md:order-2">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inscription</h2>
              <p className="text-gray-600 dark:text-gray-400">Créez votre compte gratuitement</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                  <input
                    type="text"
                    placeholder="Rakoto"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
                  <input
                    type="text"
                    placeholder="Jean"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="jean@exemple.com"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.mot_de_passe}
                    onChange={(e) => {
                      setFormData({ ...formData, mot_de_passe: e.target.value });
                      checkPasswordStrength(e.target.value);
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <p className={`text-xs flex items-center gap-1 ${passwordStrength.length ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordStrength.length ? '✓' : '○'} 8 caractères minimum
                  </p>
                  <p className={`text-xs flex items-center gap-1 ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordStrength.uppercase ? '✓' : '○'} 1 lettre majuscule
                  </p>
                  <p className={`text-xs flex items-center gap-1 ${passwordStrength.number ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordStrength.number ? '✓' : '○'} 1 chiffre
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Je suis</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'mentore' })}
                    className={`py-3 rounded-lg border-2 transition-all ${
                      formData.role === 'mentore'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xl mb-1">👨‍🎓</span>
                      <span className="text-sm font-medium">Mentoré(e)</span>
                      <span className="text-xs">Je cherche un mentor</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'mentor' })}
                    className={`py-3 rounded-lg border-2 transition-all ${
                      formData.role === 'mentor'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xl mb-1">👨‍🏫</span>
                      <span className="text-sm font-medium">Mentor</span>
                      <span className="text-xs">Je partage mes compétences</span>
                    </div>
                  </button>
                </div>
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
                    <UserPlus className="w-5 h-5" />
                    S'inscrire
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Déjà un compte ?{' '}
                <Link href="/login" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  Connectez-vous
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
