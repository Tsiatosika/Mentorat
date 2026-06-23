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

  const features = [
    { icon: Users, titleKey: 'home.feature_matching', descKey: 'home.feature_matching_desc', accent: 'accent' },
    { icon: Calendar, titleKey: 'home.feature_booking', descKey: 'home.feature_booking_desc', accent: 'warm' },
    { icon: MessageCircle, titleKey: 'home.feature_chat', descKey: 'home.feature_chat_desc', accent: 'info' },
    { icon: Video, titleKey: 'home.feature_video', descKey: 'home.feature_video_desc', accent: 'accent' },
    { icon: Award, titleKey: 'home.feature_certification', descKey: 'home.feature_certification_desc', accent: 'warm' },
    { icon: Shield, titleKey: 'home.feature_security', descKey: 'home.feature_security_desc', accent: 'success' },
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
          <div
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl"
            style={{ backgroundColor: 'var(--accent-soft)', opacity: 0.6 }}
          />
          <div
            className="absolute bottom-20 right-10 w-80 h-80 rounded-full blur-3xl"
            style={{ backgroundColor: 'var(--warm-soft)', opacity: 0.5 }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 lg:py-28">
          <div className="text-center">
            <Logo size={56} />
            <div
              className="inline-flex items-center px-3 py-1 rounded-full mt-6 mb-6"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
              <Sparkles className="w-4 h-4 mr-2" style={{ color: 'var(--warm)' }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('home.badge')}</span>
            </div>
            <h1
              className="font-display text-4xl md:text-6xl font-semibold mb-6 leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('home.hero_title')}
              <br />
              <span
                className="px-3 py-1 rounded-lg inline-block mt-2"
                style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}
              >
                {t('home.hero_subtitle')}
              </span>
            </h1>
            <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              {t('home.hero_description')}
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              {!user ? (
                <>
                  <Link
                    href="/mentors"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg"
                    style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
                  >
                    <Search className="w-5 h-5" />
                    {t('home.find_mentor')}
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors"
                    style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  >
                    {t('home.start_free')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/mentors"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg"
                    style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
                  >
                    <Search className="w-5 h-5" />
                    {t('home.find_mentor')}
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors"
                    style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  >
                    {t('nav.dashboard')}
                  </Link>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {[
                { value: `${stats.mentors}+`, label: t('home.stats_mentors') },
                { value: `${stats.sessions}+`, label: t('home.stats_sessions') },
                { value: '98%', label: t('home.stats_satisfaction') },
                { value: '24/7', label: t('home.stats_support') },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="font-mono-data text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {stat.value}
                  </div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('home.why_choose_us')}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('home.why_choose_us_desc')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const colors = accentColors[f.accent];
            return (
              <div key={i} className="card card-hover p-6">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: colors.bg }}
                >
                  <f.icon className="w-5 h-5" style={{ color: colors.fg }} />
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t(f.titleKey)}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t(f.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explorer par domaine */}
      <div className="max-w-6xl mx-auto px-4 py-16" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Explorer par domaine
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Trouvez un mentor dans votre domaine d'intérêt</p>
          </div>
          <Link
            href="/domaines"
            className="text-sm font-medium flex items-center gap-1 transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            Voir tous les domaines
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DOMAINES.slice(0, 4).map((d) => {
            const colors = ACCENT_COLORS[d.accent];
            const Icon = d.icon;
            return (
              <Link key={d.key} href={`/mentors?domaine=${encodeURIComponent(d.key)}`} className="block">
                <div className="card card-hover p-5 text-center h-full">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: colors.bg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: colors.fg }} />
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.label}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Top Mentors */}
      <div className="py-16" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              {t('mentors.top_mentors')}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>{t('mentors.top_mentors_desc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topMentors.slice(0, 3).map((mentor: any) => (
              <div key={mentor.id} className="card card-hover p-5">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--accent-soft)' }}
                  >
                    <span className="text-lg font-bold" style={{ color: 'var(--accent-text-on-soft)' }}>
                      {mentor.prenom?.[0]}{mentor.nom?.[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" style={{ color: 'var(--warm)', fill: 'var(--warm)' }} />
                    <span className="font-mono-data font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {getNoteDisplay(mentor.note_moyenne)}
                    </span>
                  </div>
                </div>
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
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
                  className="block w-full text-center px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                  style={{ border: '2px solid var(--accent)', color: 'var(--accent)' }}
                >
                  {t('mentors.view_profile')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16" style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('home.cta_title')}
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{t('home.cta_description')}</p>
          {!user ? (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg"
              style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
            >
              {t('home.cta_button')} <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/mentors"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg"
              style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
            >
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
              <Link href="/about" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                {t('common.about')}
              </Link>
              <Link href="/mentors" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                {t('nav.mentors')}
              </Link>
              {!user && (
                <>
                  <Link href="/login" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    {t('common.login')}
                  </Link>
                  <Link href="/register" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    {t('common.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}