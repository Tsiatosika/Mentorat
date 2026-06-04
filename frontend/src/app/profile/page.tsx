'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, BookOpen, Users, CheckCircle, XCircle } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="w-16 h-16 bg-indigo-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
        <span className="text-3xl">🎓</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-1">Rejoignez MentorIA</h1>
      <p className="text-gray-500 mb-8">Créez votre compte gratuitement</p>

      {/* Toggle Connexion / Inscription */}
      <div className="w-full max-w-md bg-gray-200 rounded-2xl p-1 flex mb-8">
        <Link href="/login" className="flex-1 py-3 text-center font-semibold text-gray-400 hover:text-gray-600 transition-colors">
          Connexion
        </Link>
        <div className="flex-1 bg-white rounded-xl py-3 text-center font-semibold text-gray-900 shadow-sm">
          Inscription
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="w-full max-w-md space-y-5">

        {/* Nom complet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
          <input type="text" placeholder="Jean Dupont" required
            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-900 placeholder-gray-400"
            value={`${formData.prenom} ${formData.nom}`.trim()}
            onChange={(e) => {
              const parts = e.target.value.split(' ');
              setFormData({
                ...formData,
                prenom: parts[0] || '',
                nom:    parts.slice(1).join(' ') || '',
              });
            }}
          />
        </div>

        {/* Choix du rôle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Je suis un(e)</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button"
              onClick={() => setFormData({ ...formData, role: 'mentore' })}
              className={`py-5 px-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                formData.role === 'mentore'
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-200 bg-white hover:border-amber-300'
              }`}>
              <BookOpen className={`w-7 h-7 ${formData.role === 'mentore' ? 'text-amber-500' : 'text-gray-400'}`} />
              <span className={`font-semibold text-sm ${formData.role === 'mentore' ? 'text-gray-900' : 'text-gray-500'}`}>
                Mentoré(e)
              </span>
              <span className="text-xs text-gray-400">Je cherche un mentor</span>
            </button>

            <button type="button"
              onClick={() => setFormData({ ...formData, role: 'mentor' })}
              className={`py-5 px-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                formData.role === 'mentor'
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-200 bg-white hover:border-amber-300'
              }`}>
              <Users className={`w-7 h-7 ${formData.role === 'mentor' ? 'text-amber-500' : 'text-gray-400'}`} />
              <span className={`font-semibold text-sm ${formData.role === 'mentor' ? 'text-gray-900' : 'text-gray-500'}`}>
                Mentor
              </span>
              <span className="text-xs text-gray-400">Je veux partager mes compétences</span>
            </button>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input type="email" placeholder="vous@exemple.com" required
            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-900 placeholder-gray-400"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        {/* Mot de passe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" required
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-900 placeholder-gray-400 pr-12"
              value={formData.mot_de_passe}
              onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.mot_de_passe.length > 0 && (
            <div className="mt-2 space-y-1">
              {passwordRules.map((rule) => (
                <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                  {rule.test(formData.mot_de_passe)
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    : <XCircle    className="w-3.5 h-3.5 text-red-400"   />
                  }
                  <span className={rule.test(formData.mot_de_passe) ? 'text-green-600' : 'text-red-500'}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading || !passwordValid}
          className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base shadow-md">
          {loading
            ? <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            : 'Créer mon compte'
          }
        </button>
      </form>
    </div>
  );
}