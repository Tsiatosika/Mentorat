'use client';

import Link from 'next/link';
import { ArrowLeft, Users, Target, Heart, Award, Sparkles, BookOpen, GraduationCap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  const values = [
    { icon: Target, title: t('about.val1_title'), description: t('about.val1_desc') },
    { icon: Users,  title: t('about.val2_title'), description: t('about.val2_desc') },
    { icon: Award,  title: t('about.val3_title'), description: t('about.val3_desc') },
    { icon: Heart,  title: t('about.val4_title'), description: t('about.val4_desc') },
  ];

  const features = [
    { icon: Sparkles,     title: t('about.feat1_title'), description: t('about.feat1_desc') },
    { icon: BookOpen,     title: t('about.feat2_title'), description: t('about.feat2_desc') },
    { icon: GraduationCap, title: t('about.feat3_title'), description: t('about.feat3_desc') },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('about.back')}
          </Link>
          <h1 className="text-4xl font-bold">{t('about.title')}</h1>
          <p className="text-indigo-100 mt-2 text-lg">{t('about.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Présentation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('about.project_title')}</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('about.project_p1')}</p>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-4">{t('about.project_p2')}</p>
        </div>

        {/* Valeurs */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('about.values_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {values.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Fonctionnalités */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('about.features_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Auteur */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">🎓</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">RAMAMONJISOA Sitrakiniaina Tsiatosika</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t('about.author_role')}</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">{t('about.author_year')}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {['Next.js', 'Node.js', 'PostgreSQL', 'Python', 'Tailwind CSS'].map((tech) => (
              <span key={tech} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}