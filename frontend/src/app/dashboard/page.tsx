'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Calendar, MessageCircle, FileText, Users, TrendingUp, Clock, Mail, Award } from 'lucide-react';
import { mentorAPI, mentoreAPI, sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

/** Anime un nombre de 0 jusqu'à sa valeur finale (compteur progressif). */
function useCountUp(target: number, durationMs = 900, startWhen = true) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startWhen || startedRef.current) return;
    startedRef.current = true;

    if (!target || isNaN(target)) {
      setValue(target || 0);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, durationMs, startWhen]);

  return value;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      if (user?.role === 'mentor') {
        const response = await mentorAPI.getProfile();
        setProfile(response.data.profile);
      } else {
        const response = await mentoreAPI.getProfile();
        setProfile(response.data.profile);
      }

      const sessionsResponse = await sessionAPI.getAll();
      setSessions(sessionsResponse.data.sessions || []);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatNote = (note: any) => {
    if (!note || note === 0 || note === '0' || note === '0.00') return '0.0';
    const numNote = typeof note === 'string' ? parseFloat(note) : note;
    if (isNaN(numNote)) return '0.0';
    return numNote.toFixed(1);
  };

  // --- Valeurs dérivées (calculées même pendant le chargement, avec des
  // valeurs par défaut sûres) afin que les hooks ci-dessous soient TOUJOURS
  // appelés dans le même ordre, peu importe l'état de chargement. ---
  const isMentor = user?.role === 'mentor';
  const sessionsTerminees = sessions.filter(s => s.statut === 'terminee').length;
  const totalSessions = sessions.length;
  const progression = Number(profile?.progression) || 0;
  const noteMoyenne = parseFloat(formatNote(profile?.note_moyenne));

  // Compteurs animés — ces hooks doivent être appelés avant tout `return`
  // conditionnel pour respecter les règles des hooks React.
  const animatedSessions = useCountUp(totalSessions, 800, !loading);
  const animatedProgression = useCountUp(progression, 900, !loading);
  const animatedNoteTenths = useCountUp(Math.round(noteMoyenne * 10), 900, !loading); // anime en dixièmes puis on reformate

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const statsCards = [
    {
      title: t('dashboard.sessions'),
      value: animatedSessions,
      icon: Calendar,
      accent: 'accent',
      subtitle: `${sessionsTerminees} terminées`,
    },
    {
      title: isMentor ? t('profile.note') : t('profile.progression'),
      value: isMentor ? (animatedNoteTenths / 10).toFixed(1) : `${animatedProgression}%`,
      icon: TrendingUp,
      accent: 'warm',
      subtitle: isMentor ? `${profile?.nb_sessions || 0} sessions` : `${sessionsTerminees}/${totalSessions} sessions`,
    },
    {
      title: t('dashboard.messages'),
      value: '0',
      icon: Mail,
      accent: 'info',
      subtitle: 'Non lus',
    },
  ];

  const menuItems = [
    { title: t('dashboard.sessions'), icon: Calendar, href: '/sessions', accent: 'accent', description: t('dashboard.sessions_desc') },
    { title: t('dashboard.messages'), icon: MessageCircle, href: '/chat', accent: 'info', description: t('dashboard.messages_desc') },
    { title: t('dashboard.reports'), icon: FileText, href: '/reports', accent: 'success', description: t('dashboard.reports_desc') },
  ];

  if (isMentor) {
    menuItems.unshift({ title: t('profile.disponibilites'), icon: Clock, href: '/disponibilites', accent: 'warm', description: t('profile.disponibilites_desc') });
  } else {
    menuItems.unshift({ title: t('dashboard.find_mentor'), icon: Users, href: '/mentors', accent: 'warm', description: t('dashboard.find_mentor_desc') });
    menuItems.push({ title: t('dashboard.recommendations'), icon: Award, href: '/matching', accent: 'accent', description: t('dashboard.recommendations_desc') });
  }

  const accentColors: Record<string, { bg: string; fg: string }> = {
    accent: { bg: 'var(--accent-soft)', fg: 'var(--accent-text-on-soft)' },
    warm: { bg: 'var(--warm-soft)', fg: 'var(--warm-text-on-soft)' },
    info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
    success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  };

  const statusConfig: Record<string, { bg: string; fg: string; label: string }> = {
    terminee: { bg: 'var(--success-soft)', fg: 'var(--success)', label: 'Terminée' },
    en_cours: { bg: 'var(--info-soft)', fg: 'var(--info)', label: 'En cours' },
    annulee: { bg: 'var(--danger-soft)', fg: 'var(--danger)', label: 'Annulée' },
    confirmee: { bg: 'var(--warm-soft)', fg: 'var(--warm-text-on-soft)', label: 'Confirmée' },
    en_attente: { bg: 'var(--bg-tertiary)', fg: 'var(--text-secondary)', label: 'En attente' },
  };

  return (
    <div className="min-h-screen relative dash-ambient" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Fond ambiant discret */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="dash-orb dash-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
        <div className="dash-orb dash-orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-10 pb-8 max-w-7xl mx-auto">
        <p className="font-mono-data text-xs uppercase tracking-wide mb-2 fade-in-up" style={{ color: 'var(--accent)' }}>
          {t('dashboard.activity')}
        </p>
        <h1
          className="font-display text-3xl md:text-4xl font-semibold fade-in-up"
          style={{ color: 'var(--text-primary)', animationDelay: '0.06s' }}
        >
          {t('dashboard.welcome')}, {user.prenom}{' '}
          <span className="wave-emoji inline-block">👋</span>
        </h1>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((card, index) => {
            const colors = accentColors[card.accent];
            return (
              <div
                key={index}
                className="card card-hover stat-card-in p-6"
                style={{ animationDelay: `${0.1 + index * 0.07}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center icon-pop"
                    style={{ backgroundColor: colors.bg, animationDelay: `${0.2 + index * 0.07}s` }}
                  >
                    <card.icon className="w-5 h-5" style={{ color: colors.fg }} />
                  </div>
                  <span className="font-mono-data text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {card.value}
                  </span>
                </div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{card.title}</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{card.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Sessions récentes */}
        {sessions.length > 0 && (
          <div className="mb-8 fade-in-up" style={{ animationDelay: '0.32s' }}>
            <h2 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Sessions récentes
            </h2>
            <div className="space-y-3">
              {sessions.slice(0, 3).map((session, i) => {
                const cfg = statusConfig[session.statut] || statusConfig.en_attente;
                return (
                  <div
                    key={session.id}
                    className="card bookmark p-4 flex justify-between items-center session-row-in"
                    style={{ animationDelay: `${0.4 + i * 0.06}s` }}
                  >
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{session.sujet}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(session.date_debut).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB')}
                      </p>
                    </div>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: cfg.bg, color: cfg.fg }}
                    >
                      {session.statut === 'en_cours' && (
                        <span className="live-dot" style={{ backgroundColor: cfg.fg }} />
                      )}
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Accès rapide */}
        <h2
          className="font-display text-xl font-semibold mb-4 fade-in-up"
          style={{ color: 'var(--text-primary)', animationDelay: '0.46s' }}
        >
          {t('dashboard.quick_access')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => {
            const colors = accentColors[item.accent];
            return (
              <Link
                key={index}
                href={item.href}
                className="block menu-card-in"
                style={{ animationDelay: `${0.5 + index * 0.06}s` }}
              >
                <div className="card card-hover menu-card p-6 h-full">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 menu-icon"
                    style={{ backgroundColor: colors.bg }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: colors.fg }} />
                  </div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        /* ---------- Fond ambiant (très discret, contrairement au hero) ---------- */
        .dash-ambient {
          overflow: hidden;
        }
        .dash-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          opacity: 0.35;
          will-change: transform;
        }
        .dash-orb-1 { width: 22rem; height: 22rem; top: -8rem; right: -6rem; animation: dashFloat1 26s ease-in-out infinite; }
        .dash-orb-2 { width: 18rem; height: 18rem; bottom: -6rem; left: -4rem; animation: dashFloat2 30s ease-in-out infinite; }

        @keyframes dashFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-30px, 30px) scale(1.06); }
        }
        @keyframes dashFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(25px, -20px) scale(1.08); }
        }

        /* ---------- Entrées séquencées ---------- */
        .fade-in-up {
          opacity: 0;
          transform: translateY(12px);
          animation: dashFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes dashFadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .stat-card-in {
          opacity: 0;
          transform: translateY(16px) scale(0.98);
          animation: dashCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes dashCardIn {
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .icon-pop {
          opacity: 0;
          transform: scale(0.6);
          animation: dashIconPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes dashIconPop {
          to { opacity: 1; transform: scale(1); }
        }

        .session-row-in {
          opacity: 0;
          transform: translateX(-10px);
          animation: dashRowIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes dashRowIn {
          to { opacity: 1; transform: translateX(0); }
        }

        .menu-card-in {
          opacity: 0;
          transform: translateY(14px);
          animation: dashFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* ---------- Micro-interactions menu ---------- */
        .menu-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .menu-card:hover {
          transform: translateY(-3px);
        }
        .menu-icon {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .menu-card:hover .menu-icon {
          transform: scale(1.1) rotate(-4deg);
        }

        /* ---------- Salut animé ---------- */
        .wave-emoji {
          animation: wave 2.2s ease-in-out 0.6s 1;
          transform-origin: 70% 70%;
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          15%      { transform: rotate(16deg); }
          30%      { transform: rotate(-8deg); }
          45%      { transform: rotate(14deg); }
          60%      { transform: rotate(-4deg); }
          75%      { transform: rotate(8deg); }
        }

        /* ---------- Pastille "en cours" ---------- */
        .live-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-right: 5px;
          animation: dashPulseDot 1.6s ease-in-out infinite;
        }
        @keyframes dashPulseDot {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }

        /* ---------- Reduced motion ---------- */
        @media (prefers-reduced-motion: reduce) {
          .dash-orb, .fade-in-up, .stat-card-in, .icon-pop, .session-row-in,
          .menu-card-in, .wave-emoji, .live-dot {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}