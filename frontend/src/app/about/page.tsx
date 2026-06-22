'use client';

import Link from 'next/link';
import { ArrowLeft, Users, Target, Heart, Award, Sparkles, BookOpen, GraduationCap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  const values = [
    { icon: Target, title: t('about.val1_title'), description: t('about.val1_desc') },
    { icon: Users, title: t('about.val2_title'), description: t('about.val2_desc') },
    { icon: Award, title: t('about.val3_title'), description: t('about.val3_desc') },
    { icon: Heart, title: t('about.val4_title'), description: t('about.val4_desc') },
  ];

  const features = [
    { icon: Sparkles, title: t('about.feat1_title'), description: t('about.feat1_desc') },
    { icon: BookOpen, title: t('about.feat2_title'), description: t('about.feat2_desc') },
    { icon: GraduationCap, title: t('about.feat3_title'), description: t('about.feat3_desc') },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-4 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('about.back')}
        </Link>
        <p className="font-mono-data text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
          {t('about.subtitle')}
        </p>
        <h1 className="font-display text-4xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('about.title')}
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Présentation */}
        <div className="card p-8 mb-8">
          <h2 className="font-display text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('about.project_title')}
          </h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{t('about.project_p1')}</p>
          <p className="leading-relaxed mt-4" style={{ color: 'var(--text-secondary)' }}>{t('about.project_p2')}</p>
        </div>

        {/* Valeurs */}
        <h2 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
          {t('about.values_title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {values.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="card card-hover p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--accent-soft)' }}
                >
                  <Icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Fonctionnalités */}
        <h2 className="font-display text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
          {t('about.features_title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="card card-hover p-6 text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--warm-soft)' }}
                >
                  <Icon className="w-6 h-6" style={{ color: 'var(--warm)' }} />
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Auteur */}
        <div className="card p-8 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--accent-soft)' }}
          >
            <span className="text-2xl">🎓</span>
          </div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            RAMAMONJISOA Sitrakiniaina Tsiatosika
          </h3>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{t('about.author_role')}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('about.author_year')}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {['Next.js', 'Node.js', 'PostgreSQL', 'Python', 'Tailwind CSS'].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded-full text-xs"
                style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}