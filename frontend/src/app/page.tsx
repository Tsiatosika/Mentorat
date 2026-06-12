'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users, Calendar, MessageCircle, Award, ArrowRight, Sparkles, Shield, Clock, Video, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicAPI } from '@/services/api';

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
    { icon: Users, titleKey: 'home.feature_matching', descriptionKey: 'home.feature_matching_desc' },
    { icon: Calendar, titleKey: 'home.feature_booking', descriptionKey: 'home.feature_booking_desc' },
    { icon: MessageCircle, titleKey: 'home.feature_chat', descriptionKey: 'home.feature_chat_desc' },
    { icon: Video, titleKey: 'home.feature_video', descriptionKey: 'home.feature_video_desc' },
    { icon: Award, titleKey: 'home.feature_certification', descriptionKey: 'home.feature_certification_desc' },
    { icon: Shield, titleKey: 'home.feature_security', descriptionKey: 'home.feature_security_desc' },
  ];

  const getNoteDisplay = (note: any) => {
    const n = Number(note);
    return isNaN(n) || n === 0 ? t('common.new') : n.toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 lg:py-28">
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-xs text-white">{t('home.badge')}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {t('home.hero_title')}
              <br />
              <span className="text-blue-400 bg-white/10 px-3 py-1 rounded-lg inline-block mt-2">{t('home.hero_subtitle')}</span>
            </h1>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">{t('home.hero_description')}</p>
            {!user && (
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
                  {t('home.start_free')} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/mentors" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                  {t('home.view_mentors')}
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.mentors}+</div>
                <div className="text-blue-200 text-sm mt-1">{t('home.stats_mentors')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.sessions}+</div>
                <div className="text-blue-200 text-sm mt-1">{t('home.stats_sessions')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-blue-200 text-sm mt-1">{t('home.stats_satisfaction')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-blue-200 text-sm mt-1">{t('home.stats_support')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-12">
          <svg className="absolute bottom-0 w-full h-12 text-white" preserveAspectRatio="none" viewBox="0 0 1440 48">
            <path fill="currentColor" d="M0 20L120 14C240 8 480 0 720 0C960 0 1200 8 1320 14L1440 20V48H0V20Z" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{t('home.why_choose_us')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('home.why_choose_us_desc')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="rounded-xl border p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t(f.titleKey)}</h3>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{t(f.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">{t('home.cta_title')}</h2>
          <p className="text-blue-200 mb-6">{t('home.cta_description')}</p>
          {!user && (
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
              {t('home.cta_button')} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8" style={{ backgroundColor: '#1f2937' }}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">© 2025 Université Adventiste Zurcher — {t('footer.title')}</p>
          <p className="text-gray-500 text-xs mt-2">RAMAMONJISOA Sitrakiniaina Tsiatosika — {t('footer.project')}</p>
        </div>
      </footer>
    </div>
  );
}
