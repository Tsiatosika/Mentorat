'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Calendar, MessageCircle, FileText, Users, TrendingUp, Clock, Mail, Award, ArrowRight } from 'lucide-react';
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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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

  const isMentor = user?.role === 'mentor';
  const sessionsTerminees = sessions.filter(s => s.statut === 'terminee').length;
  const totalSessions = sessions.length;
  const progression = Number(profile?.progression) || 0;
  const noteMoyenne = parseFloat(formatNote(profile?.note_moyenne));

  const animatedSessions = useCountUp(totalSessions, 800, !loading);
  const animatedProgression = useCountUp(progression, 900, !loading);
  const animatedNoteTenths = useCountUp(Math.round(noteMoyenne * 10), 900, !loading);

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
      id: 'sessions',
      title: t('dashboard.sessions'),
      value: animatedSessions,
      icon: Calendar,
      accent: 'accent',
      subtitle: `${sessionsTerminees} terminées`,
      gradient: 'linear-gradient(135deg, var(--accent-soft), var(--info-soft))',
    },
    {
      id: isMentor ? 'note' : 'progression',
      title: isMentor ? t('profile.note') : t('profile.progression'),
      value: isMentor ? (animatedNoteTenths / 10).toFixed(1) : `${animatedProgression}%`,
      icon: TrendingUp,
      accent: 'warm',
      subtitle: isMentor ? `${profile?.nb_sessions || 0} sessions` : `${sessionsTerminees}/${totalSessions} sessions`,
      gradient: 'linear-gradient(135deg, var(--warm-soft), var(--accent-soft))',
    },
    {
      id: 'messages',
      title: t('dashboard.messages'),
      value: '0',
      icon: Mail,
      accent: 'info',
      subtitle: t('dashboard.unread'),
      gradient: 'linear-gradient(135deg, var(--info-soft), var(--success-soft))',
    },
  ];

  const menuItems = [
    { id: 'sessions', title: t('dashboard.sessions'), icon: Calendar, href: '/sessions', accent: 'accent', description: t('dashboard.sessions_desc'), gradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' },
    { id: 'messages', title: t('dashboard.messages'), icon: MessageCircle, href: '/chat', accent: 'info', description: t('dashboard.messages_desc'), gradient: 'linear-gradient(135deg, #06B6D4, #3B82F6)' },
    { id: 'reports', title: t('dashboard.reports'), icon: FileText, href: '/reports', accent: 'success', description: t('dashboard.reports_desc'), gradient: 'linear-gradient(135deg, #10B981, #06B6D4)' },
  ];

  if (isMentor) {
    menuItems.unshift({ id: 'disponibilites', title: t('profile.disponibilites'), icon: Clock, href: '/disponibilites', accent: 'warm', description: t('profile.disponibilites_desc'), gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)' });
  } else {
    menuItems.unshift({ id: 'mentors', title: t('dashboard.find_mentor'), icon: Users, href: '/mentors', accent: 'warm', description: t('dashboard.find_mentor_desc'), gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)' });
    menuItems.push({ id: 'matching', title: t('dashboard.recommendations'), icon: Award, href: '/matching', accent: 'accent', description: t('dashboard.recommendations_desc'), gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899)' });
  }

  const accentColors: Record<string, { bg: string; fg: string }> = {
    accent: { bg: 'var(--accent-soft)', fg: 'var(--accent-text-on-soft)' },
    warm: { bg: 'var(--warm-soft)', fg: 'var(--warm-text-on-soft)' },
    info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
    success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  };

  const statusConfig: Record<string, { bg: string; fg: string; label: string }> = {
    terminee: { bg: 'var(--success-soft)', fg: 'var(--success)', label: t('sessions.completed') },
    en_cours: { bg: 'var(--info-soft)', fg: 'var(--info)', label: t('sessions.in_progress') },
    annulee: { bg: 'var(--danger-soft)', fg: 'var(--danger)', label: t('sessions.cancelled') },
    confirmee: { bg: 'var(--warm-soft)', fg: 'var(--warm-text-on-soft)', label: t('sessions.confirmed') },
    en_attente: { bg: 'var(--bg-tertiary)', fg: 'var(--text-secondary)', label: t('sessions.pending') },
  };

  return (
    <div className="min-h-screen relative dash-ambient" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Fond ambiant */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="dash-orb dash-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
        <div className="dash-orb dash-orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
        {/* Particules flottantes */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="dash-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              backgroundColor: i % 2 === 0 ? 'var(--accent)' : 'var(--warm)',
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-10 pb-8 max-w-7xl mx-auto">
        <p className="font-mono-data text-xs uppercase tracking-wide mb-2 fade-in-up" style={{ color: 'var(--accent)' }}>
          {t('dashboard.activity')}
        </p>
        <h1
          className="font-display text-3xl md:text-4xl font-semibold fade-in-up group inline-block"
          style={{ color: 'var(--text-primary)', animationDelay: '0.06s' }}
        >
          <span className="relative inline-block transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600">
            {t('dashboard.welcome')}, {user.prenom}
          </span>{' '}
        </h1>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((card, index) => {
            const colors = accentColors[card.accent];
            const isHovered = hoveredCard === card.id;
            return (
              <div
                key={index}
                className="stat-card-wrapper"
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className="card stat-card-in p-6 relative overflow-hidden transition-all duration-500"
                  style={{
                    animationDelay: `${0.1 + index * 0.07}s`,
                    transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                    boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.12)' : 'var(--shadow-card)',
                  }}
                >
                  {/* Fond gradient au survol */}
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-500"
                    style={{
                      background: card.gradient,
                      opacity: isHovered ? 0.08 : 0,
                    }}
                  />
                  
                  <div className="relative z-10 flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center icon-pop transition-all duration-300"
                      style={{
                        backgroundColor: colors.bg,
                        transform: isHovered ? 'scale(1.15) rotate(-6deg)' : 'scale(1) rotate(0deg)',
                      }}
                    >
                      <card.icon
                        className="w-5 h-5 transition-all duration-300"
                        style={{
                          color: colors.fg,
                          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                        }}
                      />
                    </div>
                    <span
                      className="font-mono-data text-2xl font-semibold transition-all duration-300"
                      style={{
                        color: 'var(--text-primary)',
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {card.value}
                    </span>
                  </div>
                  <h3
                    className="text-sm font-medium relative z-10 transition-all duration-300"
                    style={{
                      color: 'var(--text-primary)',
                      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="text-xs mt-1 relative z-10 transition-all duration-300"
                    style={{
                      color: 'var(--text-tertiary)',
                      opacity: isHovered ? 0.8 : 1,
                    }}
                  >
                    {card.subtitle}
                  </p>
                  
                  {/* Ligne décorative au survol */}
                  <div
                    className="absolute bottom-0 left-0 h-0.5 transition-all duration-500"
                    style={{
                      background: card.gradient,
                      width: isHovered ? '100%' : '0%',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sessions récentes */}
        {sessions.length > 0 && (
          <div className="mb-8 fade-in-up" style={{ animationDelay: '0.32s' }}>
            <h2 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('dashboard.recent_sessions')}
            </h2>
            <div className="space-y-3">
              {sessions.slice(0, 3).map((session, i) => {
                const cfg = statusConfig[session.statut] || statusConfig.en_attente;
                const sessionId = `session-${session.id}`;
                const isSessionHovered = hoveredCard === sessionId;
                return (
                  <div
                    key={session.id}
                    className="card p-4 flex justify-between items-center session-row-in transition-all duration-300 cursor-pointer"
                    style={{
                      animationDelay: `${0.4 + i * 0.06}s`,
                      transform: isSessionHovered ? 'translateX(6px)' : 'translateX(0)',
                      borderLeft: isSessionHovered ? '3px solid var(--accent)' : '3px solid transparent',
                    }}
                    onMouseEnter={() => setHoveredCard(sessionId)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="transition-all duration-300" style={{ transform: isSessionHovered ? 'translateX(2px)' : 'translateX(0)' }}>
                      <h3
                        className="font-semibold transition-all duration-300"
                        style={{
                          color: isSessionHovered ? 'var(--accent)' : 'var(--text-primary)',
                        }}
                      >
                        {session.sujet}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(session.date_debut).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB')}
                      </p>
                    </div>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium transition-all duration-300"
                      style={{
                        backgroundColor: cfg.bg,
                        color: cfg.fg,
                        transform: isSessionHovered ? 'scale(1.05)' : 'scale(1)',
                      }}
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
            const isMenuHovered = hoveredCard === item.id;
            return (
              <Link
                key={index}
                href={item.href}
                className="block menu-card-wrapper"
                style={{ animationDelay: `${0.5 + index * 0.06}s` }}
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className="card menu-card p-6 h-full menu-card-in relative overflow-hidden transition-all duration-500"
                  style={{
                    transform: isMenuHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
                    boxShadow: isMenuHovered ? '0 16px 32px rgba(0,0,0,0.1)' : 'var(--shadow-card)',
                  }}
                >
                  {/* Fond gradient au survol */}
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-500"
                    style={{
                      background: item.gradient,
                      opacity: isMenuHovered ? 0.06 : 0,
                    }}
                  />
                  
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 menu-icon relative z-10 transition-all duration-500"
                    style={{
                      backgroundColor: colors.bg,
                      transform: isMenuHovered ? 'scale(1.15) rotate(-8deg)' : 'scale(1) rotate(0deg)',
                    }}
                  >
                    <item.icon
                      className="w-6 h-6 transition-all duration-300"
                      style={{
                        color: colors.fg,
                        transform: isMenuHovered ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  </div>
                  <h3
                    className="font-semibold relative z-10 transition-all duration-300"
                    style={{
                      color: 'var(--text-primary)',
                      transform: isMenuHovered ? 'translateX(3px)' : 'translateX(0)',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-sm relative z-10 transition-all duration-300"
                    style={{
                      color: 'var(--text-secondary)',
                      opacity: isMenuHovered ? 1 : 0.8,
                    }}
                  >
                    {item.description}
                  </p>
                  
                  {/* Flèche qui apparaît au survol */}
                  <div
                    className="absolute bottom-4 right-4 transition-all duration-300"
                    style={{
                      opacity: isMenuHovered ? 1 : 0,
                      transform: isMenuHovered ? 'translateX(0)' : 'translateX(-10px)',
                    }}
                  >
                    <ArrowRight className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  </div>
                  
                  {/* Barre supérieure colorée au survol */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 transition-all duration-500"
                    style={{
                      background: item.gradient,
                      opacity: isMenuHovered ? 1 : 0,
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        /* ---------- Fond ambiant ---------- */
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

        /* Particules */
        .dash-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: particleFloat linear infinite;
        }
        @keyframes particleFloat {
          0%   { opacity: 0; transform: translateY(0) scale(0); }
          20%  { opacity: 0.6; }
          80%  { opacity: 0.2; }
          100% { opacity: 0; transform: translateY(-60px) scale(1.5); }
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

        /* ---------- Effets de survol ---------- */
        .stat-card-wrapper,
        .menu-card-wrapper {
          transition: transform 0.3s ease;
        }

        .card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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

        /* ---------- Texte gradient au survol du titre ---------- */
        .group:hover .hover\:text-transparent {
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          background-image: linear-gradient(135deg, #3B82F6, #8B5CF6);
        }

        /* ---------- Reduced motion ---------- */
        @media (prefers-reduced-motion: reduce) {
          .dash-orb, .dash-particle, .fade-in-up, .stat-card-in, .icon-pop, .session-row-in,
          .menu-card-in, .wave-emoji, .live-dot, .card, .stat-card-wrapper, .menu-card-wrapper {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}