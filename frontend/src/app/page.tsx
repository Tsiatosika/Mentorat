'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Fraunces } from 'next/font/google';
import { Users, Calendar, MessageCircle, Award, ArrowRight, Sparkles, Shield, Clock, Video, Star, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicAPI, BACKEND_URL } from '@/services/api';
import { Logo } from '@/components/ui/Logo';
import { DOMAINES, ACCENT_COLORS } from '@/lib/domaines';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [topMentors, setTopMentors] = useState<any[]>([]);
  const [stats, setStats] = useState({ mentors: 0, sessions: 0 });
  const [isLoading, setIsLoading] = useState(true);
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

  const getPhotoUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    const baseUrl = BACKEND_URL.replace(/\/api\/?$/, '');
    return `${baseUrl}${url}`;
  };

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  };

  const features = [
    { icon: Users, titleKey: 'home.feature_matching', descKey: 'home.feature_matching_desc' },
    { icon: Calendar, titleKey: 'home.feature_booking', descKey: 'home.feature_booking_desc' },
    { icon: MessageCircle, titleKey: 'home.feature_chat', descKey: 'home.feature_chat_desc' },
    { icon: Video, titleKey: 'home.feature_video', descKey: 'home.feature_video_desc' },
    { icon: Award, titleKey: 'home.feature_certification', descKey: 'home.feature_certification_desc' },
    { icon: Shield, titleKey: 'home.feature_security', descKey: 'home.feature_security_desc' },
  ];

  const getNoteDisplay = (note: any) => {
    const n = Number(note);
    return isNaN(n) || n === 0 ? t('common.new') : n.toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--mp-bg)' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--mp-gold)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--mp-text-soft)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fraunces.variable} min-h-screen mp-root`}>
      {/* ============ HERO ============ */}
      <div className="relative overflow-hidden mp-hero">
        {/* Photo de fond — remplacez /images/hero-mentoring.jpg par une vraie photo (mentor + étudiant, campus, session de travail) */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-mentoring.jpg"
            alt=""
            fill
            priority
            className="object-cover mp-hero-photo"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 mp-hero-scrim" />
        </div>

        {/* Signature : le "chemin" mentor -> mentoré, tracé et animé */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none mp-path-svg" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true">
          <path
            className="mp-path-line"
            d="M -50 460 C 220 460, 260 200, 480 220 C 700 240, 720 60, 980 90 C 1080 100, 1150 60, 1260 40"
            fill="none"
            stroke="var(--mp-gold)"
            strokeWidth="2"
            strokeDasharray="2 14"
            strokeLinecap="round"
          />
          <circle cx="-50" cy="460" r="6" fill="var(--mp-teal)" className="mp-node mp-node-a" />
          <circle cx="1260" cy="40" r="6" fill="var(--mp-gold)" className="mp-node mp-node-b" />
        </svg>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 lg:py-32">
          <div className="text-center">
            <div className="fade-up mp-logo-badge" style={{ animationDelay: '0s' }}>
              <Logo size={52} />
            </div>

            <div className="inline-flex items-center px-3 py-1.5 rounded-full mt-7 mb-7 fade-up mp-eyebrow" style={{ animationDelay: '0.08s' }}>
              <Sparkles className="w-3.5 h-3.5 mr-2" style={{ color: 'var(--mp-gold)' }} />
              <span className="text-xs tracking-wide" style={{ color: 'var(--mp-text-soft)' }}>{t('home.badge')}</span>
            </div>

            <h1 className={`${fraunces.className} text-4xl md:text-6xl font-medium mb-6 leading-[1.08] fade-up mp-hero-title`} style={{ animationDelay: '0.16s' }}>
              {t('home.hero_title')}
              <br />
              <em className="mp-hero-title-accent not-italic">{t('home.hero_subtitle')}</em>
            </h1>

            <p className="text-lg mb-9 max-w-xl mx-auto fade-up" style={{ color: 'var(--mp-text-soft)', animationDelay: '0.24s' }}>
              {t('home.hero_description')}
            </p>

            <div className="flex flex-wrap gap-4 justify-center fade-up" style={{ animationDelay: '0.32s' }}>
              <Link href="/mentors" className="mp-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold hover-lift">
                <Search className="w-4.5 h-4.5" />
                {t('home.find_mentor')}
              </Link>
              {!user ? (
                <Link href="/register" className="mp-btn-ghost inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold hover-lift">
                  {t('home.start_free')}
                </Link>
              ) : (
                <Link href="/dashboard" className="mp-btn-ghost inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold hover-lift">
                  {t('nav.dashboard')}
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 fade-up" style={{ animationDelay: '0.4s' }}>
              {[
                { value: `${stats.mentors}+`, label: t('home.stats_mentors') },
                { value: `${stats.sessions}+`, label: t('home.stats_sessions') },
                { value: '98%', label: t('home.stats_satisfaction') },
                { value: '24/7', label: t('home.stats_support') },
              ].map((stat, i) => (
                <div key={i} className="text-center stat-pop mp-stat" style={{ animationDelay: `${0.4 + i * 0.08}s` }}>
                  <div className={`${fraunces.className} text-3xl font-medium mp-stat-value`}>{stat.value}</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--mp-text-faint)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none mp-hero-fade" />
      </div>

      {/* ============ FEATURES ============ */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14 reveal-on-scroll">
          <span className="mp-section-eyebrow">Sur la plateforme</span>
          <h2 className={`${fraunces.className} text-3xl font-medium mb-3 mt-2`} style={{ color: 'var(--mp-text)' }}>
            {t('home.why_choose_us')}
          </h2>
          <p style={{ color: 'var(--mp-text-soft)' }}>{t('home.why_choose_us_desc')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="mp-card p-6 reveal-on-scroll mp-feature-card" style={{ transitionDelay: `${i * 0.05}s` }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 mp-feature-icon">
                <f.icon className="w-5 h-5" style={{ color: 'var(--mp-gold-ink)' }} />
              </div>
              <h3 className={`${fraunces.className} text-lg font-medium mb-2`} style={{ color: 'var(--mp-text)' }}>{t(f.titleKey)}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--mp-text-soft)' }}>{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </div>

            {/* ============ DOMAINES ============ */}
      <div className="max-w-6xl mx-auto px-4 py-20 mp-divider">
        <div className="flex justify-between items-end mb-9 flex-wrap gap-4 reveal-on-scroll">
          <div>
            <span className="mp-section-eyebrow">Par domaine</span>
            <h2 className={`${fraunces.className} text-3xl font-medium mt-2`} style={{ color: 'var(--mp-text)' }}>
              Explorez votre voie
            </h2>
          </div>
          <Link href="/domaines" className="text-sm font-medium flex items-center gap-1.5 mp-link">
            Tous les domaines <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DOMAINES.map((d: any, i: number) => {
            const Icon = d.icon;
            return (
              <Link key={d.key} href={`/mentors?domaine=${encodeURIComponent(d.key)}`} className="block reveal-on-scroll" style={{ transitionDelay: `${i * 0.05}s` }}>
                <div className="mp-card p-5 text-center h-full mp-domain-card">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 mp-domain-icon">
                    <Icon className="w-6 h-6" style={{ color: 'var(--mp-teal-ink)' }} />
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--mp-text)' }}>{d.label}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ============ TOP MENTORS ============ */}
      <div className="py-20 mp-section-alt relative overflow-hidden">
        {/* Texture de fond — remplacez /images/mentors-texture.jpg par une photo discrète (campus, bibliothèque, travail en binôme) */}
        <div className="absolute inset-0 mp-section-photo-wrap">
          <Image
            src="/images/mentors-texture.jpg"
            alt=""
            fill
            className="object-cover mp-section-photo"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 mp-section-photo-scrim" />
        </div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-14 reveal-on-scroll">
            <span className="mp-section-eyebrow">Ils accompagnent déjà</span>
            <h2 className={`${fraunces.className} text-3xl font-medium mb-3 mt-2`} style={{ color: 'var(--mp-text)' }}>
              {t('mentors.top_mentors')}
            </h2>
            <p style={{ color: 'var(--mp-text-soft)' }}>{t('mentors.top_mentors_desc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {topMentors.slice(0, 3).map((mentor: any, i: number) => {
              const photoUrl = getPhotoUrl(mentor.photo_url);
              const initials = getInitials(mentor.prenom, mentor.nom);
              return (
                <div
                  key={mentor.id}
                  className="mp-card overflow-hidden reveal-on-scroll mp-mentor-card"
                  style={{ transitionDelay: `${i * 0.06}s` }}
                  onMouseEnter={() => setHoveredMentor(mentor.id)}
                  onMouseLeave={() => setHoveredMentor(null)}
                >
                  <div className="mp-mentor-banner" />
                  <div className="p-5 -mt-8">
                    <div className="flex items-end justify-between mb-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden mp-mentor-avatar">
                        {photoUrl ? (
                          <img src={photoUrl} alt={`${mentor.prenom} ${mentor.nom}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{ color: 'var(--mp-gold-ink)' }}>
                            {initials}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-4 h-4" style={{ color: 'var(--mp-gold)', fill: 'var(--mp-gold)' }} />
                        <span className="font-semibold text-sm" style={{ color: 'var(--mp-text)' }}>{getNoteDisplay(mentor.note_moyenne)}</span>
                      </div>
                    </div>
                    <h3 className={`${fraunces.className} text-base font-medium mb-1`} style={{ color: 'var(--mp-text)' }}>
                      {mentor.prenom} {mentor.nom}
                    </h3>
                    <p className="text-sm font-medium mb-3" style={{ color: 'var(--mp-teal-ink)' }}>{mentor.domaine || t('mentors.expert')}</p>
                    <div className="flex items-center gap-4 text-sm mb-4" style={{ color: 'var(--mp-text-soft)' }}>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{mentor.annees_experience || 0} {t('mentors.years')}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{mentor.nb_sessions || 0} {t('mentors.sessions')}</span>
                    </div>
                    <Link href={`/mentors/${mentor.id}`} className="block w-full text-center px-3 py-2.5 rounded-xl font-medium text-sm mp-mentor-btn">
                      {t('mentors.view_profile')}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============ CTA ============ */}
      <div className="py-24 relative overflow-hidden mp-divider mp-cta">
        {/* Photo de fond — remplacez /images/cta-mentoring.jpg par une photo qui incarne la réussite (diplôme, poignée de main, célébration) */}
        <div className="absolute inset-0">
          <Image
            src="/images/cta-mentoring.jpg"
            alt=""
            fill
            className="object-cover mp-cta-photo"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 mp-cta-scrim" />
        </div>
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10 reveal-on-scroll">
          <h2 className={`${fraunces.className} text-3xl font-medium mb-3`} style={{ color: 'var(--mp-text)' }}>
            {t('home.cta_title')}
          </h2>
          <p className="mb-7" style={{ color: 'var(--mp-text-soft)' }}>{t('home.cta_description')}</p>
          <Link href={user ? '/mentors' : '/register'} className="mp-btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold hover-lift">
            {user ? <><Search className="w-5 h-5" />{t('home.find_mentor')}</> : <>{t('home.cta_button')} <ArrowRight className="w-4 h-4" /></>}
          </Link>
        </div>
      </div>

      {/* ============ FOOTER ============ */}
      <footer className="py-8 mp-divider">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm" style={{ color: 'var(--mp-text-soft)' }}>© 2025 Université Adventiste Zurcher — {t('footer.title')}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--mp-text-faint)' }}>{t('footer.project')}</p>
            </div>
            <div className="flex gap-6">
              <Link href="/about" className="text-sm mp-link">{t('common.about')}</Link>
              <Link href="/mentors" className="text-sm mp-link">{t('nav.mentors')}</Link>
              {!user && (
                <>
                  <Link href="/login" className="text-sm mp-link">{t('common.login')}</Link>
                  <Link href="/register" className="text-sm mp-link">{t('common.register')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        /* ---- Surfaces et texte : alignés sur le système de thème global existant ---- */
        :root {
          --mp-bg: var(--bg-primary);
          --mp-card: var(--card-bg);
          --mp-border: var(--border);
          --mp-text: var(--text-primary);
          --mp-text-soft: var(--text-secondary);
          --mp-text-faint: var(--text-tertiary);

          /* Couleurs de marque de la page d'accueil — restent identiques dans les deux thèmes */
          --mp-gold: #E3A73E;
          --mp-gold-soft: rgba(227,167,62,0.16);
          --mp-gold-ink: #96650C;
          --mp-teal: #2FAE8C;
          --mp-teal-soft: rgba(47,174,140,0.14);
          --mp-teal-ink: #157A60;
          --mp-hero-photo-opacity: 0.5;
          --mp-section-photo-opacity: 0.14;
        }

        /* ---- Variante des couleurs de marque pour rester lisibles sur fond sombre ---- */
        .dark, [data-theme='dark'] {
          --mp-gold-soft: rgba(227,167,62,0.14);
          --mp-gold-ink: #E3A73E;
          --mp-teal-soft: rgba(63,199,166,0.12);
          --mp-teal-ink: #3FC7A6;
          --mp-hero-photo-opacity: 0.34;
          --mp-section-photo-opacity: 0.10;
        }

        /* ---- Repli si aucun toggle explicite n'est présent : suit les préférences système ---- */
        @media (prefers-color-scheme: dark) {
          :root:not(.light):not([data-theme='light']):not(.dark):not([data-theme='dark']) {
            --mp-gold-soft: rgba(227,167,62,0.14);
            --mp-gold-ink: #E3A73E;
            --mp-teal-soft: rgba(63,199,166,0.12);
            --mp-teal-ink: #3FC7A6;
            --mp-hero-photo-opacity: 0.34;
            --mp-section-photo-opacity: 0.10;
          }
        }

        .mp-root { background: var(--mp-bg); transition: background .3s ease; }

        .mp-hero { min-height: 640px; }
        .mp-hero-photo { opacity: var(--mp-hero-photo-opacity); filter: saturate(0.85); }
        .mp-hero-scrim {
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--mp-bg) 45%, transparent) 0%, color-mix(in srgb, var(--mp-bg) 90%, transparent) 70%, var(--mp-bg) 100%),
            radial-gradient(ellipse 70% 55% at 50% 15%, color-mix(in srgb, var(--mp-gold) 12%, transparent) 0%, transparent 60%);
        }
        .mp-hero-fade { background: linear-gradient(to bottom, transparent, var(--mp-bg)); }

        .mp-path-svg { z-index: 1; opacity: 0.8; }
        .mp-path-line { stroke-dashoffset: 0; animation: mp-dash-flow 6s linear infinite; }
        @keyframes mp-dash-flow { to { stroke-dashoffset: -160; } }
        .mp-node { filter: drop-shadow(0 0 6px currentColor); animation: mp-node-pulse 2.4s ease-in-out infinite; }
        .mp-node-a { animation-delay: 0s; }
        .mp-node-b { animation-delay: 1.2s; }
        @keyframes mp-node-pulse { 0%,100% { r: 5; opacity: 0.7; } 50% { r: 7.5; opacity: 1; } }

        .mp-logo-badge { opacity: 0; transform: translateY(18px); animation: fadeUp .7s cubic-bezier(.16,1,.3,1) forwards; }
        .mp-eyebrow { background: color-mix(in srgb, var(--mp-text) 5%, transparent); border: 1px solid var(--mp-border); backdrop-filter: blur(6px); }
        .mp-hero-title { color: var(--mp-text); }
        .mp-hero-title-accent { color: var(--mp-gold-ink); }

        .mp-section-eyebrow { font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mp-teal-ink); font-weight: 600; }

        .mp-btn-primary { background: var(--mp-gold); color: #1A1200; }
        .mp-btn-ghost { background: color-mix(in srgb, var(--mp-text) 4%, transparent); color: var(--mp-text); border: 1px solid var(--mp-border); }
        .hover-lift { transition: transform .25s ease, filter .25s ease; }
        .hover-lift:hover { transform: translateY(-2px); filter: brightness(1.06); }

        .mp-stat-value { color: var(--mp-text); }

        .mp-card { background: var(--mp-card); border: 1px solid var(--mp-border); border-radius: 18px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .mp-feature-card { transition: transform .35s cubic-bezier(.4,0,.2,1), border-color .35s ease; }
        .mp-feature-card:hover { transform: translateY(-6px); border-color: color-mix(in srgb, var(--mp-gold) 35%, var(--mp-border)); }
        .mp-feature-icon { background: var(--mp-gold-soft); }

        .mp-domain-card { transition: transform .3s ease, border-color .3s ease; }
        .mp-domain-card:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--mp-teal) 35%, var(--mp-border)); }
        .mp-domain-icon { background: var(--mp-teal-soft); }

        .mp-section-alt { background: color-mix(in srgb, var(--mp-text) 2%, transparent); border-top: 1px solid var(--mp-border); border-bottom: 1px solid var(--mp-border); }
        .mp-section-photo-wrap { z-index: 0; }
        .mp-section-photo { opacity: var(--mp-section-photo-opacity); filter: saturate(0.7); }
        .mp-section-photo-scrim { background: linear-gradient(180deg, var(--mp-bg) 0%, color-mix(in srgb, var(--mp-bg) 75%, transparent) 40%, var(--mp-bg) 100%); }

        .mp-mentor-card { transition: transform .3s ease, border-color .3s ease; }
        .mp-mentor-card:hover { transform: translateY(-5px); border-color: color-mix(in srgb, var(--mp-gold) 30%, var(--mp-border)); }
        .mp-mentor-banner { height: 56px; background: linear-gradient(120deg, var(--mp-gold-soft), var(--mp-teal-soft)); }
        .mp-mentor-avatar { background: var(--mp-card); border: 3px solid var(--mp-card); box-shadow: 0 0 0 1px var(--mp-border); }
        .mp-mentor-btn { border: 1.5px solid var(--mp-gold-ink); color: var(--mp-gold-ink); transition: all .25s ease; }
        .mp-mentor-btn:hover { background: var(--mp-gold); border-color: var(--mp-gold); color: #1A1200; }

        .mp-cta { background: var(--mp-bg); }
        .mp-cta-photo { opacity: var(--mp-section-photo-opacity); filter: saturate(0.75); }
        .mp-cta-scrim {
          background:
            linear-gradient(180deg, var(--mp-bg) 0%, color-mix(in srgb, var(--mp-bg) 70%, transparent) 45%, var(--mp-bg) 100%),
            radial-gradient(ellipse 60% 70% at 50% 50%, color-mix(in srgb, var(--mp-teal) 8%, transparent) 0%, transparent 65%);
        }

        .mp-link { color: var(--mp-text-soft); transition: color .25s ease; display: inline-flex; align-items: center; gap: 0.35rem; }
        .mp-link:hover { color: var(--mp-gold-ink); }
        .mp-divider { border-top: 1px solid var(--mp-border); }

        .fade-up { opacity: 0; transform: translateY(18px); animation: fadeUp .7s cubic-bezier(.16,1,.3,1) forwards; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .stat-pop { opacity: 0; transform: scale(.92); animation: statPop .5s cubic-bezier(.34,1.56,.64,1) forwards; }
        @keyframes statPop { to { opacity: 1; transform: scale(1); } }
        .reveal-on-scroll { opacity: 0; transform: translateY(24px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
        .reveal-on-scroll.is-visible { opacity: 1; transform: translateY(0); }

        @media (prefers-reduced-motion: reduce) {
          .mp-path-line, .mp-node, .fade-up, .stat-pop, .mp-feature-card, .mp-domain-card, .mp-mentor-card { animation: none !important; transition: none !important; }
          .reveal-on-scroll { opacity: 1; transform: none; transition: none; }
        }
      `}</style>
    </div>
  );
}