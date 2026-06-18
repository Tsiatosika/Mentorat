'use client';

import Link from 'next/link';
import { ArrowLeft, Users, Target, Heart, Award, Sparkles, BookOpen, GraduationCap } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Notre mission',
      description: 'Faciliter l\'accès au mentorat académique pour tous les étudiants grâce à l\'intelligence artificielle et à une mise en relation intelligente.'
    },
    {
      icon: Users,
      title: 'Notre communauté',
      description: 'Une communauté de mentors passionnés et d\'étudiants motivés, unis pour la réussite de tous et le partage de connaissances.'
    },
    {
      icon: Award,
      title: 'Notre expertise',
      description: 'Des algorithmes de matching IA avancés pour des recommandations toujours plus pertinentes et personnalisées.'
    },
    {
      icon: Heart,
      title: 'Nos valeurs',
      description: 'Excellence, bienveillance, innovation et accessibilité au cœur de notre plateforme de mentorat.'
    }
  ];

  const features = [
    {
      icon: Sparkles,
      title: 'Matching IA intelligent',
      description: 'Notre algorithme analyse les compétences, disponibilités et objectifs pour vous proposer le mentor idéal.'
    },
    {
      icon: BookOpen,
      title: 'Suivi de progression',
      description: 'Visualisez votre évolution grâce à des rapports détaillés et des statistiques personnalisées.'
    },
    {
      icon: GraduationCap,
      title: 'Accompagnement personnalisé',
      description: 'Des sessions de mentorat adaptées à vos besoins avec des experts dans votre domaine.'
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-bold">À propos</h1>
          <p className="text-indigo-100 mt-2 text-lg">Plateforme de Mentorat Académique avec Matching IA</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Présentation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📖 Notre projet</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Ce projet de fin d'études vise à concevoir et développer une plateforme numérique de mentorat
            académique intégrant un algorithme d'intelligence artificielle pour le matching automatique
            entre mentors et mentorés.
          </p>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
            La plateforme permet aux étudiants de trouver des mentors adaptés à leurs besoins spécifiques
            en se basant sur leurs compétences, leurs disponibilités et leurs objectifs d'apprentissage.
            L'objectif général est de faciliter l'accompagnement académique, d'améliorer la réussite
            des étudiants et de valoriser l'expertise des mentors au sein de la communauté universitaire.
          </p>
        </div>

        {/* Valeurs */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🎯 Nos valeurs</h2>
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

        {/* Fonctionnalités clés */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">⚡ Fonctionnalités clés</h2>
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
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Projet de Fin d'Études — Université Adventiste Zurcher
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
            Mention Informatique — Année académique 2025-2026
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
              Next.js
            </span>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
              Node.js
            </span>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
              PostgreSQL
            </span>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
              Python
            </span>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
              Tailwind CSS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
