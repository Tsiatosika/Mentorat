'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, Target, Shield, FileText, Sun, Moon } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Logo } from '@/components/ui/Logo';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    mot_de_passe: '',
  });

  const redirectTo = searchParams.get('redirect') ||
                     sessionStorage.getItem('redirectAfterLogin') ||
                     '/dashboard';

  useEffect(() => {
    if (user && user.role) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.mot_de_passe) {
      toast.error(t('auth.fields_required'));
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.mot_de_passe);
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectTo);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('auth.login_error'));
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
      sessionStorage.removeItem('redirectAfterLogin');

      if (needsRole) {
        router.push('/complete-profile');
      } else {
        router.push(redirectTo);
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
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-primary)' }}>

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
                {t('auth.login_hero_title')}
              </h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                {t('auth.login_hero_desc')}
              </p>
            </div>

            <div className="space-y-3">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                  style={{ backgroundColor: 'transparent' }}
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
          <div
            className="card order-1 md:order-2 p-8 animate-in"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('auth.login_title')}
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('auth.login_subtitle')}</p>
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
                  text="continue_with"
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
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 rounded-lg border focus:ring-2 focus:border-transparent outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    value={formData.mot_de_passe}
                    onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
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
                <div className="text-right mt-1">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    {t('auth.forgot_password')}
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: theme === 'dark' ? '#06231D' : '#FFFFFF' }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--accent)')}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    {t('auth.login_button')}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('auth.no_account')}{' '}
                <Link href="/register" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                  {t('auth.register_link')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}