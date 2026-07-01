'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users, Calendar, MessageCircle, Award, ArrowRight, Sparkles, Shield, Clock, Video, Star, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicAPI } from '@/services/api';
import { Logo } from '@/components/ui/Logo';
import { DOMAINES, ACCENT_COLORS } from '@/lib/domaines';

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [topMentors, setTopMentors] = useState<any[]>([]);
  const [stats, setStats] = useState({ mentors: 0, sessions: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const [hoveredMentor, setHoveredMentor] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mentorsRes = await publicAPI.searchMentors({ limit: 6 });
        if (mentorsRes.data?.data) setTopMentors(mentorsRes.data.data);
        setStats({ mentors: mentorsRes.data?.pagination?.total || 0, sessions: 1248 });
      } catch {}
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isLoading]);

  const features = [
    { icon: Users, titleKey: 'home.feature_matching', descKey: 'home.feature_matching_desc', accent: 'accent', gradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' },
    { icon: Calendar, titleKey: 'home.feature_booking', descKey: 'home.feature_booking_desc', accent: 'warm', gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)' },
    { icon: MessageCircle, titleKey: 'home.feature_chat', descKey: 'home.feature_chat_desc', accent: 'info', gradient: 'linear-gradient(135deg, #06B6D4, #3B82F6)' },
    { icon: Video, titleKey: 'home.feature_video', descKey: 'home.feature_video_desc', accent: 'accent', gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899)' },
    { icon: Award, titleKey: 'home.feature_certification', descKey: 'home.feature_certification_desc', accent: 'warm', gradient: 'linear-gradient(135deg, #10B981, #F59E0B)' },
    { icon: Shield, titleKey: 'home.feature_security', descKey: 'home.feature_security_desc', accent: 'success', gradient: 'linear-gradient(135deg, #10B981, #06B6D4)' },
  ];

  const accentColors: Record<string, { bg: string; fg: string }> = {
    accent: { bg: 'var(--accent-soft)', fg: 'var(--accent)' },
    warm: { bg: 'var(--warm-soft)', fg: 'var(--warm)' },
    info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
    success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  };

  const getNoteDisplay = (note: any) => {
    const n = Number(note);
    return isNaN(n) || n === 0 ? t('common.new') : n.toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden hero-mesh" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="absolute inset-0 hero-grid pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
          <div className="orb orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
          <div className="orb orb-3" style={{ backgroundColor: 'var(--info-soft)' }} />
        </div>
        <div className="absolute inset-0 pointer-events-none particles">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={`particle particle-${(i % 7) + 1}`} style={{ backgroundColor: 'var(--accent)' }} />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 lg:py-28">
          <div className="text-center">
            <div className="fade-up hover-logo" style={{ animationDelay: '0s' }}>
              <Logo size={56} />
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full mt-6 mb-6 fade-up glow-pulse hover-glow" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', animationDelay: '0.08s' }}>
              <Sparkles className="w-4 h-4 mr-2 sparkle-icon" style={{ color: 'var(--warm)' }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('home.badge')}</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-semibold mb-6 leading-tight fade-up" style={{ color: 'var(--text-primary)', animationDelay: '0.16s' }}>
              <span className="hover-gradient-text">{t('home.hero_title')}</span>
              <br />
              <span className="px-3 py-1 rounded-lg inline-block mt-2 shimmer hover-shimmer" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}>
                {t('home.hero_subtitle')}
              </span>
            </h1>
            <p className="text-lg mb-8 max-w-2xl mx-auto fade-up" style={{ color: 'var(--text-secondary)', animationDelay: '0.24s' }}>
              {t('home.hero_description')}
            </p>

            <div className="flex flex-wrap gap-4 justify-center fade-up" style={{ animationDelay: '0.32s' }}>
              {!user ? (
                <>
                  <Link href="/mentors" className="btn-hero-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-lg hover-lift" style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
                    <Search className="w-5 h-5" />
                    {t('home.find_mentor')}
                  </Link>
                  <Link href="/register" className="btn-hero-secondary inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold hover-lift" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    {t('home.start_free')}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/mentors" className="btn-hero-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-lg hover-lift" style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
                    <Search className="w-5 h-5" />
                    {t('home.find_mentor')}
                  </Link>
                  <Link href="/dashboard" className="btn-hero-secondary inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold hover-lift" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    {t('nav.dashboard')}
                  </Link>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 fade-up" style={{ animationDelay: '0.4s' }}>
              {[
                { value: `${stats.mentors}+`, label: t('home.stats_mentors'), icon: '👥' },
                { value: `${stats.sessions}+`, label: t('home.stats_sessions'), icon: '📅' },
                { value: '98%', label: t('home.stats_satisfaction'), icon: '⭐' },
                { value: '24/7', label: t('home.stats_support'), icon: '🕐' },
              ].map((stat, i) => (
                <div key={i} className="text-center stat-pop hover-stat" style={{ animationDelay: `${0.4 + i * 0.08}s` }}>
                  <div className="text-2xl mb-1 stat-emoji">{stat.icon}</div>
                  <div className="font-mono-data text-3xl font-semibold stat-value" style={{ color: 'var(--text-primary)' }}>
                    {stat.value}
                  </div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-primary))' }} />
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12 reveal-on-scroll">
          <h2 className="font-display text-3xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('home.why_choose_us')}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('home.why_choose_us_desc')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const colors = accentColors[f.accent];
            const isHovered = hoveredFeature === i;
            return (
              <div
                key={i}
                className="card p-6 reveal-on-scroll feature-card"
                style={{ transitionDelay: `${i * 0.05}s` }}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="relative overflow-hidden">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 feature-icon" style={{ backgroundColor: colors.bg }}>
                    <f.icon className="w-5 h-5" style={{ color: colors.fg }} />
                  </div>
                  <h3 className="text-base font-semibold mb-2 feature-title" style={{ color: 'var(--text-primary)' }}>{t(f.titleKey)}</h3>
                  <p className="text-sm feature-desc" style={{ color: 'var(--text-secondary)' }}>{t(f.descKey)}</p>
                  <div className="feature-line" style={{ background: f.gradient }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Domaines */}
      <div className="max-w-6xl mx-auto px-4 py-16" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex justify-between items-end mb-8 flex-wrap gap-4 reveal-on-scroll">
          <div>
            <h2 className="font-display text-3xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Explorer par domaine
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Trouvez un mentor dans votre domaine d'intérêt</p>
          </div>
          <Link href="/domaines" className="text-sm font-medium flex items-center gap-1 transition-colors group hover-link" style={{ color: 'var(--accent)' }}>
            Voir tous les domaines
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DOMAINES.slice(0, 4).map((d, i) => {
            const colors = ACCENT_COLORS[d.accent];
            const Icon = d.icon;
            const isDomainHovered = hoveredDomain === d.key;
            return (
              <Link
                key={d.key}
                href={`/mentors?domaine=${encodeURIComponent(d.key)}`}
                className="block reveal-on-scroll"
                style={{ transitionDelay: `${i * 0.05}s` }}
                onMouseEnter={() => setHoveredDomain(d.key)}
                onMouseLeave={() => setHoveredDomain(null)}
              >
                <div className="card p-5 text-center h-full domain-card">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 domain-icon" style={{ backgroundColor: colors.bg }}>
                    <Icon className="w-6 h-6" style={{ color: colors.fg }} />
                  </div>
                  <h3 className="text-sm font-semibold domain-title" style={{ color: 'var(--text-primary)' }}>{d.label}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Top Mentors */}
      <div className="py-16" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 reveal-on-scroll">
            <h2 className="font-display text-3xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              {t('mentors.top_mentors')}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>{t('mentors.top_mentors_desc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topMentors.slice(0, 3).map((mentor: any, i: number) => {
              const isMentorHovered = hoveredMentor === mentor.id;
              return (
                <div
                  key={mentor.id}
                  className="card p-5 reveal-on-scroll mentor-card"
                  style={{ transitionDelay: `${i * 0.06}s` }}
                  onMouseEnter={() => setHoveredMentor(mentor.id)}
                  onMouseLeave={() => setHoveredMentor(null)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mentor-avatar" style={{ backgroundColor: 'var(--accent-soft)' }}>
                      <span className="text-lg font-bold" style={{ color: 'var(--accent-text-on-soft)' }}>
                        {mentor.prenom?.[0]}{mentor.nom?.[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mentor-rating">
                      <Star className="w-4 h-4" style={{ color: 'var(--warm)', fill: 'var(--warm)' }} />
                      <span className="font-mono-data font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {getNoteDisplay(mentor.note_moyenne)}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold mb-1 mentor-name" style={{ color: 'var(--text-primary)' }}>
                    {mentor.prenom} {mentor.nom}
                  </h3>
                  <p className="text-sm font-medium mb-3" style={{ color: 'var(--accent)' }}>
                    {mentor.domaine || t('mentors.expert')}
                  </p>
                  <div className="flex items-center gap-4 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{mentor.annees_experience || 0} {t('mentors.years')}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{mentor.nb_sessions || 0} {t('mentors.sessions')}</span>
                  </div>
                  <Link
                    href={`/mentors/${mentor.id}`}
                    className="block w-full text-center px-3 py-2 rounded-lg font-medium text-sm transition-all mentor-btn"
                    style={{ border: '2px solid var(--accent)', color: 'var(--accent)' }}
                  >
                    {t('mentors.view_profile')}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16 relative overflow-hidden cta-mesh" style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb orb-cta" style={{ backgroundColor: 'var(--accent-soft)' }} />
        </div>
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10 reveal-on-scroll">
          <h2 className="font-display text-3xl font-semibold mb-3 hover-cta-title" style={{ color: 'var(--text-primary)' }}>
            {t('home.cta_title')}
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{t('home.cta_description')}</p>
          {!user ? (
            <Link href="/register" className="btn-hero-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-lg hover-lift" style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
              {t('home.cta_button')} <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link href="/mentors" className="btn-hero-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-lg hover-lift" style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
              <Search className="w-5 h-5" />
              {t('home.find_mentor')}
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                © 2025 Université Adventiste Zurcher — {t('footer.title')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('footer.project')}</p>
            </div>
            <div className="flex gap-6">
              <Link href="/about" className="text-sm transition-colors hover-footer-link" style={{ color: 'var(--text-secondary)' }}>
                {t('common.about')}
              </Link>
              <Link href="/mentors" className="text-sm transition-colors hover-footer-link" style={{ color: 'var(--text-secondary)' }}>
                {t('nav.mentors')}
              </Link>
              {!user && (
                <>
                  <Link href="/login" className="text-sm transition-colors hover-footer-link" style={{ color: 'var(--text-secondary)' }}>
                    {t('common.login')}
                  </Link>
                  <Link href="/register" className="text-sm transition-colors hover-footer-link" style={{ color: 'var(--text-secondary)' }}>
                    {t('common.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        /* ---------- Hero ---------- */
        .hero-mesh {
          background-image:
            radial-gradient(circle at 15% 20%, var(--accent-soft) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, var(--warm-soft) 0%, transparent 45%);
          background-size: 200% 200%;
          animation: meshDrift 22s ease-in-out infinite alternate;
        }
        @keyframes meshDrift {
          0%   { background-position: 0% 0%, 100% 100%; }
          100% { background-position: 30% 20%, 70% 80%; }
        }

        .hero-grid {
          background-image:
            linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px);
          background-size: 48px 48px;
          opacity: 0.25;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 100%);
        }

        .orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(60px);
          opacity: 0.55;
          will-change: transform;
        }
        .orb-1 { width: 18rem; height: 18rem; top: 5%;  left: 5%;  animation: floatA 16s ease-in-out infinite; }
        .orb-2 { width: 22rem; height: 22rem; bottom: 0%; right: 5%; animation: floatB 20s ease-in-out infinite; }
        .orb-3 { width: 14rem; height: 14rem; top: 45%; left: 55%; animation: floatC 18s ease-in-out infinite; opacity: 0.35; }
        .orb-cta { width: 30rem; height: 30rem; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.4; animation: pulseSlow 8s ease-in-out infinite; }

        @keyframes floatA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(40px, 30px) scale(1.08); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-30px, -40px) scale(1.1); }
        }
        @keyframes floatC {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-20px, 25px) scale(0.95); }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.5; transform: translate(-50%, -50%) scale(1.12); }
        }

        /* Particles */
        .particle {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          opacity: 0.5;
          animation: particleRise linear infinite;
        }
        .particle-1 { left: 8%;  bottom: -10px; animation-duration: 14s; animation-delay: 0s; }
        .particle-2 { left: 18%; bottom: -10px; animation-duration: 18s; animation-delay: 2s; }
        .particle-3 { left: 32%; bottom: -10px; animation-duration: 12s; animation-delay: 1s; }
        .particle-4 { left: 48%; bottom: -10px; animation-duration: 20s; animation-delay: 3s; }
        .particle-5 { left: 63%; bottom: -10px; animation-duration: 15s; animation-delay: 0.5s; }
        .particle-6 { left: 78%; bottom: -10px; animation-duration: 17s; animation-delay: 4s; }
        .particle-7 { left: 90%; bottom: -10px; animation-duration: 13s; animation-delay: 2.5s; }

        @keyframes particleRise {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.5; }
          50%  { transform: translateY(-160px) translateX(15px); }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-340px) translateX(-10px); opacity: 0; }
        }

        /* Entrance */
        .fade-up {
          opacity: 0;
          transform: translateY(18px);
          animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .stat-pop {
          opacity: 0;
          transform: scale(0.92);
          animation: statPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes statPop {
          to { opacity: 1; transform: scale(1); }
        }

        .glow-pulse {
          animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards, glowPulse 3s ease-in-out 1s infinite;
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--accent-soft); }
          50%      { box-shadow: 0 0 14px 2px var(--accent-soft); }
        }

        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: -150%;
          width: 60%;
          height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
          animation: shimmerSlide 3.5s ease-in-out 1.2s infinite;
        }
        @keyframes shimmerSlide {
          0%   { left: -150%; }
          60%  { left: 150%; }
          100% { left: 150%; }
        }

        /* ─── ANIMATIONS DE SURVOL ─── */
        .hover-logo { transition: transform 0.3s ease; cursor: pointer; }
        .hover-logo:hover { transform: scale(1.08) rotate(-3deg); }

        .hover-glow:hover { box-shadow: 0 0 20px 4px var(--accent-soft) !important; }

        .sparkle-icon { transition: transform 0.4s ease; }
        .hover-glow:hover .sparkle-icon { transform: rotate(20deg) scale(1.2); }

        .hover-gradient-text {
          transition: all 0.4s ease;
          cursor: default;
        }
        .hover-gradient-text:hover {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hover-shimmer::after { animation: shimmerSlide 1.5s ease-in-out infinite; }

        .hover-lift {
          transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
        }
        .hover-lift:hover {
          transform: translateY(-3px) scale(1.03);
          filter: brightness(1.1);
          box-shadow: 0 12px 28px rgba(0,0,0,0.18);
        }

        .hover-stat {
          transition: transform 0.3s ease;
          cursor: default;
        }
        .hover-stat:hover {
          transform: translateY(-6px) scale(1.05);
        }
        .hover-stat:hover .stat-emoji {
          animation: bounce 0.6s ease;
        }
        .hover-stat:hover .stat-value {
          background: linear-gradient(135deg, var(--accent), var(--warm));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        /* Feature cards */
        .feature-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }
        .feature-icon {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .feature-card:hover .feature-icon {
          transform: scale(1.2) rotate(-10deg);
        }
        .feature-title {
          transition: color 0.3s ease, transform 0.3s ease;
        }
        .feature-card:hover .feature-title {
          color: var(--accent) !important;
          transform: translateX(4px);
        }
        .feature-desc {
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .feature-card:hover .feature-desc {
          transform: translateX(2px);
          opacity: 0.9;
        }
        .feature-line {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          width: 0;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 0 0 12px 12px;
        }
        .feature-card:hover .feature-line {
          width: 100%;
        }

        /* Domain cards */
        .domain-card {
          transition: all 0.35s ease;
        }
        .domain-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(0,0,0,0.1);
        }
        .domain-icon {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .domain-card:hover .domain-icon {
          transform: scale(1.15) rotate(-6deg);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .domain-title {
          transition: color 0.3s ease;
        }
        .domain-card:hover .domain-title {
          color: var(--accent) !important;
        }

        /* Mentor cards */
        .mentor-card {
          transition: all 0.35s ease;
        }
        .mentor-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(0,0,0,0.1);
        }
        .mentor-avatar {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .mentor-card:hover .mentor-avatar {
          transform: scale(1.1);
          box-shadow: 0 8px 20px var(--accent-soft);
        }
        .mentor-rating {
          transition: transform 0.3s ease;
        }
        .mentor-card:hover .mentor-rating {
          transform: scale(1.1);
        }
        .mentor-name {
          transition: color 0.3s ease;
        }
        .mentor-card:hover .mentor-name {
          color: var(--accent) !important;
        }
        .mentor-btn {
          transition: all 0.3s ease;
        }
        .mentor-btn:hover {
          background-color: var(--accent) !important;
          color: #FFFFFF !important;
          transform: translateY(-2px);
        }

        /* CTA */
        .hover-cta-title {
          transition: all 0.4s ease;
          cursor: default;
        }
        .hover-cta-title:hover {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          transform: scale(1.03);
        }

        .hover-link {
          transition: gap 0.3s ease, color 0.3s ease;
        }
        .hover-link:hover {
          gap: 0.75rem;
        }

        .hover-footer-link {
          transition: color 0.3s ease, transform 0.3s ease;
          display: inline-block;
        }
        .hover-footer-link:hover {
          color: var(--accent) !important;
          transform: translateY(-2px);
        }

        /* Scroll reveal */
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-mesh, .orb, .particle, .fade-up, .stat-pop, .glow-pulse, .shimmer::after,
          .hover-logo, .hover-glow, .hover-stat, .feature-card, .domain-card, .mentor-card {
            animation: none !important;
            transition: none !important;
          }
          .reveal-on-scroll {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}