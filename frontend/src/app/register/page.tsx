'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Logo } from '@/components/ui/Logo';
import { BACKEND_URL } from '@/services/api';

// Photos de personnes en contexte de mentorat/apprentissage qui défilent (crossfade) à gauche.
// Images libres d'utilisation (Unsplash License) — remplacez-les par vos propres photos quand vous en aurez.
const AUTH_IMAGES = [
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&h=1100&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1573496546038-82f9c39f6365?w=900&h=1100&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1758270705518-b61b40527e76?w=900&h=1100&fit=crop&auto=format&q=80',
];

export default function RegisterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [errors, setErrors] = useState<{
    nom?: string;
    prenom?: string;
    email?: string;
    mot_de_passe?: string;
    general?: string;
  }>({});
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    role: 'mentore',
  });
  const [passwordStrength, setPasswordStrength] = useState({ length: false, uppercase: false, number: false });

  const isSubmitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (user && user.role) {
      router.push('/dashboard');
    }
  }, [user, router]);

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

  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
    });
    if (errors.mot_de_passe) {
      setErrors(prev => ({ ...prev, mot_de_passe: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting.current || loading) return;
    isSubmitting.current = true;
    setLoading(true);

    const newErrors: typeof errors = {};
    
    if (!formData.nom) {
      newErrors.nom = "Le nom est requis";
    } else if (formData.nom.length < 2) {
      newErrors.nom = "Le nom doit contenir au moins 2 caractères";
    }
    
    if (!formData.prenom) {
      newErrors.prenom = "Le prénom est requis";
    } else if (formData.prenom.length < 2) {
      newErrors.prenom = "Le prénom doit contenir au moins 2 caractères";
    }
    
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Veuillez entrer un email valide";
    }
    
    if (!formData.mot_de_passe) {
      newErrors.mot_de_passe = "Le mot de passe est requis";
    } else if (!passwordStrength.length || !passwordStrength.uppercase || !passwordStrength.number) {
      newErrors.mot_de_passe = "Le mot de passe ne respecte pas les critères";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    try {
      // URL CORRIGÉE
      const registerUrl = `${BACKEND_URL}/api/auth/register`;
      console.log('Register URL:', registerUrl);
      
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          mot_de_passe: formData.mot_de_passe,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.message || data.error || "Erreur d'inscription";
        if (message.toLowerCase().includes('email') || message.toLowerCase().includes('mail')) {
          setErrors({ email: message });
        } else if (message.toLowerCase().includes('nom')) {
          setErrors({ nom: message });
        } else if (message.toLowerCase().includes('prénom')) {
          setErrors({ prenom: message });
        } else if (message.toLowerCase().includes('mot de passe') || message.toLowerCase().includes('password')) {
          setErrors({ mot_de_passe: message });
        } else {
          setErrors({ general: message });
        }
        setLoading(false);
        isSubmitting.current = false;
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error('Erreur détaillée:', error);
      setErrors({ general: "Erreur d'inscription. Vérifiez votre connexion." });
      setLoading(false);
      isSubmitting.current = false;
    }
  };

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
        window.location.href = '/dashboard';
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
                Rejoignez MentorPath
              </h1>
            </div>
          </div>

          <div className="card order-1 md:order-2 p-8">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Inscription
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>Créez votre compte gratuitement</p>
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
                text="signup_with"
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                      Nom <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Rakoto"
                      className={`w-full px-4 py-2 rounded-lg border outline-none transition-all ${errors.nom ? 'border-red-500' : ''}`}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: errors.nom ? '#EF4444' : 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      value={formData.nom}
                      onChange={(e) => handleInputChange('nom', e.target.value)}
                    />
                    {errors.nom && (
                      <p className="mt-1 text-sm flex items-center gap-1" style={{ color: '#EF4444' }}>
                        <AlertCircle className="w-4 h-4" />
                        {errors.nom}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                      Prénom <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Jean"
                      className={`w-full px-4 py-2 rounded-lg border outline-none transition-all ${errors.prenom ? 'border-red-500' : ''}`}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: errors.prenom ? '#EF4444' : 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      value={formData.prenom}
                      onChange={(e) => handleInputChange('prenom', e.target.value)}
                    />
                    {errors.prenom && (
                      <p className="mt-1 text-sm flex items-center gap-1" style={{ color: '#EF4444' }}>
                        <AlertCircle className="w-4 h-4" />
                        {errors.prenom}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Email <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="jean@exemple.com"
                    className={`w-full px-4 py-2 rounded-lg border outline-none transition-all ${errors.email ? 'border-red-500' : ''}`}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: errors.email ? '#EF4444' : 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm flex items-center gap-1" style={{ color: '#EF4444' }}>
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Mot de passe <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`w-full px-4 py-2 pr-10 rounded-lg border outline-none transition-all ${errors.mot_de_passe ? 'border-red-500' : ''}`}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: errors.mot_de_passe ? '#EF4444' : 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      value={formData.mot_de_passe}
                      onChange={(e) => {
                        handleInputChange('mot_de_passe', e.target.value);
                        checkPasswordStrength(e.target.value);
                      }}
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
                  {errors.mot_de_passe && (
                    <p className="mt-1 text-sm flex items-center gap-1" style={{ color: '#EF4444' }}>
                      <AlertCircle className="w-4 h-4" />
                      {errors.mot_de_passe}
                    </p>
                  )}
                  <div className="mt-2 space-y-1">
                    <p className="text-xs flex items-center gap-1" style={{ color: passwordStrength.length ? '#10B981' : 'var(--text-tertiary)' }}>
                      {passwordStrength.length ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 inline-block">○</span>}
                      8 caractères minimum
                    </p>
                    <p className="text-xs flex items-center gap-1" style={{ color: passwordStrength.uppercase ? '#10B981' : 'var(--text-tertiary)' }}>
                      {passwordStrength.uppercase ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 inline-block">○</span>}
                      Une majuscule
                    </p>
                    <p className="text-xs flex items-center gap-1" style={{ color: passwordStrength.number ? '#10B981' : 'var(--text-tertiary)' }}>
                      {passwordStrength.number ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 h-3 inline-block">○</span>}
                      Un chiffre
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Je suis <span style={{ color: '#EF4444' }}>*</span>
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
                        <span className="text-sm font-medium">Mentoré</span>
                        <span className="text-xs">Je cherche à apprendre</span>
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
                        <span className="text-sm font-medium">Mentor</span>
                        <span className="text-xs">Je veux partager mes connaissances</span>
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
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      S'inscrire
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Déjà un compte ?{' '}
                <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                  Se connecter
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