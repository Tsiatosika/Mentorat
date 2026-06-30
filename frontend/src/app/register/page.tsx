'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, Sparkles, Shield, Target, FileText } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Logo } from '@/components/ui/Logo';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    role: 'mentore',
  });
  const [passwordStrength, setPasswordStrength] = useState({ length: false, uppercase: false, number: false });

  useEffect(() => {
    if (user && user.role) router.push('/dashboard');
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
      toast.error(t('auth.fields_required'));
      return;
    }

    if (!passwordStrength.length || !passwordStrength.uppercase || !passwordStrength.number) {
      toast.error(t('auth.password_requirements'));
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
      toast.success(t('auth.register_success'));
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('auth.register_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error(t('auth.google_error'));
      return;
    }

    setGoogleLoading(true);
    try {
      const { needsRole } = await loginWithGoogle(credentialResponse.credential);
      if (needsRole) {
        router.push('/complete-profile');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      // déjà géré dans loginWithGoogle (toast)
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error(t('auth.google_cancelled'));
  };

  const features = [
    { icon: Sparkles, title: t('auth.feat1_title'), desc: t('auth.feat1_desc') },
    { icon: Target, title: t('auth.feat2_title'), desc: t('auth.feat2_desc') },
    { icon: Shield, title: t('auth.feat3_title'), desc: t('auth.feat3_desc') },
    { icon: FileText, title: t('auth.feat4_title'), desc: t('auth.feat4_desc') },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Colonne gauche - Features */}
          <div className="space-y-6 order-2 md:order-1 animate-in">
            <div>
              <Logo size={56} />
              <h1
                className="font-display text-4xl md:text-5xl font-semibold mt-6 mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('auth.register_hero_title')}
              </h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                {t('auth.register_hero_desc')}
              </p>
            </div>

            <div className="space-y-3">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--accent-soft)' }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne droite - Formulaire */}
          <div className="card order-1 md:order-2 p-8 animate-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('auth.register_title')}
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('auth.register_subtitle')}</p>
            </div>

            <div className="mb-6 flex justify-center">
              {googleLoading ? (
                <div
                  className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                />
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme={theme === 'dark' ? 'filled_black' : 'outline'}
                  size="large"
                  width="320"
                  text="signup_with"
                  shape="rectangular"
                />
              )}
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--border)' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-tertiary)' }}>
                  {t('auth.or')}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {t('auth.lastname')}
                  </label>
                  <input
                    type="text"
                    placeholder="Rakoto"
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {t('auth.firstname')}
                  </label>
                  <input
                    type="text"
                    placeholder="Jean"
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  placeholder="jean@exemple.com"
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent outline-none transition-all"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 pr-10 rounded-lg border focus:ring-2 focus:border-transparent outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
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
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    ) : (
                      <Eye className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    )}
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs flex items-center gap-1" style={{ color: passwordStrength.length ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                    {passwordStrength.length ? '✓' : '○'} {t('auth.password_min_length')}
                  </p>
                  <p className="text-xs flex items-center gap-1" style={{ color: passwordStrength.uppercase ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                    {passwordStrength.uppercase ? '✓' : '○'} {t('auth.password_uppercase')}
                  </p>
                  <p className="text-xs flex items-center gap-1" style={{ color: passwordStrength.number ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                    {passwordStrength.number ? '✓' : '○'} {t('auth.password_number')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t('auth.i_am')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'mentore' })}
                    className="py-3 rounded-lg border-2 transition-all"
                    style={{
                      borderColor: formData.role === 'mentore' ? 'var(--accent)' : 'var(--border)',
                      backgroundColor: formData.role === 'mentore' ? 'var(--accent-soft)' : 'transparent',
                      color: formData.role === 'mentore' ? 'var(--accent-text-on-soft)' : 'var(--text-secondary)',
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xl mb-1">👨‍🎓</span>
                      <span className="text-sm font-medium">{t('auth.role_mentee')}</span>
                      <span className="text-xs">{t('auth.role_mentee_desc')}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'mentor' })}
                    className="py-3 rounded-lg border-2 transition-all"
                    style={{
                      borderColor: formData.role === 'mentor' ? 'var(--accent)' : 'var(--border)',
                      backgroundColor: formData.role === 'mentor' ? 'var(--accent-soft)' : 'transparent',
                      color: formData.role === 'mentor' ? 'var(--accent-text-on-soft)' : 'var(--text-secondary)',
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xl mb-1">👨‍🏫</span>
                      <span className="text-sm font-medium">{t('auth.role_mentor')}</span>
                      <span className="text-xs">{t('auth.role_mentor_desc')}</span>
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: theme === 'dark' ? '#06231D' : '#FFFFFF' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    {t('auth.register_button')}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('auth.have_account')}{' '}
                <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                  {t('auth.login_link')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}