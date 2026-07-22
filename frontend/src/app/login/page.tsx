'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Logo } from '@/components/ui/Logo';
import { BACKEND_URL } from '@/services/api';

// Photos de personnes en contexte de mentorat/apprentissage qui défilent (crossfade) à gauche.
// Images libres d'utilisation (Unsplash License) — remplacez-les par vos propres photos quand vous en aurez.
const AUTH_IMAGES = [
  'https://images.unsplash.com/photo-1573164574048-f968d7ee9f20?w=900&h=1100&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=900&h=1100&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&h=1100&fit=crop&auto=format&q=80',
];

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [formData, setFormData] = useState({
    email: '',
    mot_de_passe: '',
  });
  
  const isSubmitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const redirectTo = searchParams?.get('redirect') ||
                     sessionStorage.getItem('redirectAfterLogin') ||
                     '/dashboard';

  useEffect(() => {
    if (user && user.role) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  // Fait défiler les images de la colonne gauche une par une (crossfade)
  useEffect(() => {
    const interval = setInterval(() => {
      setImgIndex((prev) => (prev + 1) % AUTH_IMAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting.current || loading) return;
    isSubmitting.current = true;
    setLoading(true);

    // Validation
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Veuillez entrer un email valide";
    }
    if (!formData.mot_de_passe) {
      newErrors.password = "Le mot de passe est requis";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    try {
      // URL CORRIGÉE - Utilise BACKEND_URL de vos services
      const loginUrl = `${BACKEND_URL}/api/auth/login`;
      console.log('Login URL:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          mot_de_passe: formData.mot_de_passe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.message || data.error || 'Erreur de connexion';
        if (message.toLowerCase().includes('email') || message.toLowerCase().includes('mail')) {
          setErrors({ email: message });
        } else if (message.toLowerCase().includes('mot de passe') || message.toLowerCase().includes('password')) {
          setErrors({ password: message });
        } else {
          setErrors({ general: message });
        }
        setLoading(false);
        isSubmitting.current = false;
        return;
      }

      // Succès
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectTo;
      } else {
        setErrors({ general: 'Erreur de connexion' });
        setLoading(false);
        isSubmitting.current = false;
      }
    } catch (error: any) {
      console.error('Erreur détaillée:', error);
      setErrors({ general: 'Erreur de connexion au serveur. Vérifiez votre connexion.' });
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  // Gestion Google Login
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
  if (!credentialResponse.credential) {
    setErrors({ general: "Erreur Google" });
    return;
  }

  try {
    // URL CORRIGÉE - Utilise directement localhost
    const googleUrl = `http://localhost:5000/api/auth/google`;
    console.log('Google Auth URL:', googleUrl);
    
    const response = await fetch(googleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: credentialResponse.credential }),
    });

    const data = await response.json();

    if (!response.ok) {
      setErrors({ general: data.message || 'Erreur Google' });
      return;
    }

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.needsRole) {
        window.location.href = '/complete-profile';
      } else {
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectTo;
      }
    }
  } catch (error: any) {
    console.error('Erreur Google:', error);
    setErrors({ general: 'Erreur de connexion Google' });
  }
};

  const handleGoogleError = () => {
    setErrors({ general: "Connexion Google annulée" });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4 order-2 md:order-1">
            {/* Image qui défile (crossfade), au-dessus du texte de bienvenue */}
            <div className="mp-auth-image-card">
              {AUTH_IMAGES.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  loading="lazy"
                  className={`mp-auth-image-img ${i === imgIndex ? 'is-active' : ''}`}
                />
              ))}
            </div>

            <div>
              <Logo size={56} />
              <h1 className="font-display text-4xl md:text-5xl font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>
                Bienvenue sur MentorPath
              </h1>
            </div>
          </div>

          <div className="card order-1 md:order-2 p-8">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Connexion
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>Connectez-vous à votre compte</p>
            </div>

            {errors.general && (
              <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444' }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
                <span className="text-sm" style={{ color: '#EF4444' }}>{errors.general}</span>
              </div>
            )}

            <div className="mb-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme={theme === 'dark' ? 'filled_black' : 'outline'}
                size="large"
                width="320"
                text="continue_with"
                shape="rectangular"
              />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--border)' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-tertiary)' }}>
                  ou
                </span>
              </div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    <input
                      type="email"
                      placeholder="votre@email.com"
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border outline-none transition-all ${errors.email ? 'border-red-500' : ''}`}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: errors.email ? '#EF4444' : 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm flex items-center gap-1" style={{ color: '#EF4444' }}>
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2 rounded-lg border outline-none transition-all ${errors.password ? 'border-red-500' : ''}`}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: errors.password ? '#EF4444' : 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      value={formData.mot_de_passe}
                      onChange={(e) => handleInputChange('mot_de_passe', e.target.value)}
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
                  {errors.password && (
                    <p className="mt-1 text-sm flex items-center gap-1" style={{ color: '#EF4444' }}>
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </p>
                  )}
                  <div className="text-right mt-1">
                    <Link href="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent)', color: theme === 'dark' ? '#06231D' : '#FFFFFF' }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Se connecter
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Pas encore de compte ?{' '}
                <Link href="/register" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                  S'inscrire
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .mp-auth-image-card {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          max-height: 400px;
          border-radius: 24px;
          overflow: hidden;
          background: var(--card-bg);
          box-shadow: 0 20px 50px rgba(0,0,0,0.16), 0 0 0 1px var(--border);
        }
        .mp-auth-image-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transform: scale(1.04);
          transition: opacity 1.1s ease, transform 5s ease;
        }
        .mp-auth-image-img.is-active { opacity: 1; transform: scale(1); }

        @media (prefers-reduced-motion: reduce) {
          .mp-auth-image-img { transition: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}