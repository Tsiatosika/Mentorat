'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, CheckCircle, XCircle, BookOpen, Users, Sparkles, Brain, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const passwordRules = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: '1 lettre majuscule',   test: (p: string) => /[A-Z]/.test(p) },
  { label: '1 chiffre',            test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', mot_de_passe: '', role: 'mentore',
  });

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const passwordValid = passwordRules.every(r => r.test(formData.mot_de_passe));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.prenom || !formData.email || !formData.mot_de_passe) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (!passwordValid) {
      toast.error('Le mot de passe ne respecte pas les critères de sécurité');
      return;
    }
    setLoading(true);
    try {
      await register(formData);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Brain,      label: 'Matching IA intelligent',         desc: 'Trouvez le mentor idéal selon vos objectifs' },
    { icon: Sparkles,   label: 'Recommandations personnalisées',   desc: 'Suggestions basées sur vos compétences' },
    { icon: TrendingUp, label: 'Suivi de progression',            desc: 'Mesurez votre évolution à chaque session' },
    { icon: Award,      label: 'Rapports PDF automatiques',        desc: 'Export de vos résultats en un clic' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex">

      {/* ── Panneau gauche ── */}
      <div className="hidden lg:flex w-[460px] bg-[#0A3B8A] flex-col justify-between p-10 flex-shrink-0">
        <div>
          <div className="w-12 h-12 bg-[#3B82F6] rounded-xl flex items-center justify-center mb-8">
            <span className="text-2xl">🎓</span>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Rejoignez la communauté de mentorat intelligente
          </h1>
          <p className="text-blue-200 mt-4 text-sm leading-relaxed">
            Créez votre compte gratuitement et connectez-vous avec des experts de votre domaine grâce à notre algorithme de matching par Intelligence Artificielle.
          </p>
        </div>

        <div className="space-y-2">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <f.icon className="w-4 h-4 text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-sm text-white font-medium">{f.label}</p>
                <p className="text-xs text-blue-300 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-blue-300/60 mt-6">
          Université Adventiste Zurcher — Plateforme MentorIQ
        </p>
      </div>

      {/* ── Panneau droit ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0A3B8A] rounded-xl flex items-center justify-center">
              <span className="text-xl">🎓</span>
            </div>
            <span className="text-xl font-bold text-[#1E3A5F]">MentorIQ</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5EAF2] p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#1E3A5F] mb-1">Inscription</h2>
            <p className="text-sm text-[#6B82A4] mb-7">Créez votre compte gratuitement</p>

            <form onSubmit={handleSubmit} noValidate>

              {/* Nom / Prénom */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1E3A5F] mb-1.5">Nom</label>
                  <input
                    type="text"
                    placeholder="Rakoto"
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E5EAF2] bg-[#F5F7FB] focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm text-[#1E3A5F] placeholder:text-[#6B82A4]"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1E3A5F] mb-1.5">Prénom</label>
                  <input
                    type="text"
                    placeholder="Jean"
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E5EAF2] bg-[#F5F7FB] focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm text-[#1E3A5F] placeholder:text-[#6B82A4]"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#1E3A5F] mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="jean@exemple.mg"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5EAF2] bg-[#F5F7FB] focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm text-[#1E3A5F] placeholder:text-[#6B82A4]"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Mot de passe */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-[#1E3A5F] mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    className="w-full pr-10 px-3 py-2.5 rounded-lg border border-[#E5EAF2] bg-[#F5F7FB] focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all text-sm text-[#1E3A5F] placeholder:text-[#6B82A4]"
                    value={formData.mot_de_passe}
                    onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B82A4] hover:text-[#1E3A5F]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.mot_de_passe.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordRules.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                        {rule.test(formData.mot_de_passe)
                          ? <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
                          : <XCircle    className="w-3.5 h-3.5 text-[#EF4444]" />
                        }
                        <span className={rule.test(formData.mot_de_passe) ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rôle */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#1E3A5F] mb-2">Je suis</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'mentore' })}
                    className={`py-4 px-4 rounded-xl border-2 transition-all text-left ${
                      formData.role === 'mentore'
                        ? 'border-[#3B82F6] bg-blue-50'
                        : 'border-[#E5EAF2] bg-[#F5F7FB] hover:border-[#3B82F6]/40'
                    }`}
                  >
                    <BookOpen className={`w-6 h-6 mb-1.5 ${formData.role === 'mentore' ? 'text-[#3B82F6]' : 'text-[#6B82A4]'}`} />
                    <div className={`font-semibold text-sm ${formData.role === 'mentore' ? 'text-[#1E3A5F]' : 'text-[#6B82A4]'}`}>
                      Mentoré(e)
                    </div>
                    <div className="text-xs text-[#6B82A4] mt-0.5">Je cherche un mentor</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'mentor' })}
                    className={`py-4 px-4 rounded-xl border-2 transition-all text-left ${
                      formData.role === 'mentor'
                        ? 'border-[#3B82F6] bg-blue-50'
                        : 'border-[#E5EAF2] bg-[#F5F7FB] hover:border-[#3B82F6]/40'
                    }`}
                  >
                    <Users className={`w-6 h-6 mb-1.5 ${formData.role === 'mentor' ? 'text-[#3B82F6]' : 'text-[#6B82A4]'}`} />
                    <div className={`font-semibold text-sm ${formData.role === 'mentor' ? 'text-[#1E3A5F]' : 'text-[#6B82A4]'}`}>
                      Mentor
                    </div>
                    <div className="text-xs text-[#6B82A4] mt-0.5">Je veux partager mes compétences</div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !passwordValid}
                className="w-full bg-[#0A3B8A] text-white py-3 rounded-lg font-semibold hover:bg-[#0d4aa8] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><UserPlus className="w-4 h-4" />Créer mon compte</>
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
              Déjà un compte ?{' '}
              <Link href="/login" className="font-semibold text-[#3B82F6] hover:text-[#2563EB] transition-colors">
                Connectez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}