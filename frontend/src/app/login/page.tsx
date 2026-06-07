'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, Calendar, FileText, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
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

  const features = [
    { icon: Sparkles,  label: 'Matching IA personnalisé' },
    { icon: Calendar,  label: 'Sessions planifiées facilement' },
    { icon: FileText,  label: 'Rapports PDF automatiques' },
    { icon: Shield,    label: 'Données sécurisées' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex">

      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] bg-[#0A3B8A] flex-col justify-between p-10 flex-shrink-0">
        <div>
          <div className="w-12 h-12 bg-[#3B82F6] rounded-xl flex items-center justify-center mb-8">
            <span className="text-2xl">🎓</span>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            La plateforme de mentorat intelligente
          </h1>
          <p className="text-blue-200 mt-4 text-sm leading-relaxed">
            Connectez-vous avec des experts de votre domaine pour accélérer votre carrière et atteindre vos objectifs.
          </p>
        </div>
        <div className="space-y-3">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-white/10">
              <f.icon className="w-5 h-5 text-[#3B82F6] flex-shrink-0" />
              <span className="text-sm text-white/80 font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0A3B8A] rounded-xl flex items-center justify-center">
              <span className="text-xl">🎓</span>
            </div>
            <span className="text-xl font-bold text-[#1E3A5F]">MentorIA</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5EAF2] p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#1E3A5F] mb-1">Connexion</h2>
            <p className="text-sm text-[#6B82A4] mb-8">Accédez à votre espace de mentorat</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-[#1E3A5F] mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B82A4] w-4 h-4" />
                  <input
                    type="email"
                    placeholder="vous@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#E5EAF2] bg-[#F5F7FB] focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm text-[#1E3A5F] placeholder:text-[#6B82A4]"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mb-7">
                <label className="block text-sm font-semibold text-[#1E3A5F] mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B82A4] w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-[#E5EAF2] bg-[#F5F7FB] focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm text-[#1E3A5F] placeholder:text-[#6B82A4]"
                    value={formData.mot_de_passe}
                    onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B82A4] hover:text-[#1E3A5F] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3B82F6] text-white py-3 rounded-lg font-semibold hover:bg-[#2563EB] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><LogIn className="w-4 h-4" />Se connecter</>
                }
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5EAF2]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-[#6B82A4]">ou</span>
              </div>
            </div>

            <p className="text-center text-sm text-[#6B82A4]">
              Pas encore de compte ?{' '}
              <Link href="/register" className="font-semibold text-[#3B82F6] hover:text-[#2563EB] transition-colors">
                Inscription gratuite
              </Link>
            </p>

          
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}