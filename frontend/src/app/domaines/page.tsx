'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicAPI } from '@/services/api';
import { DOMAINES, ACCENT_COLORS, matchDomaine } from '@/lib/domaines';

interface DomaineCount {
  key: string;
  label: string;
  icon: any;
  accent: string;
  total: number;
}

export default function DomainesPage() {
  const { t } = useLanguage();
  const [domaineCounts, setDomaineCounts] = useState<DomaineCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await publicAPI.getDomainesStats();
      const rawDomaines: { domaine: string; total: number }[] = response.data.domaines || [];

      // Regroupe les domaines texte libre en catégories visuelles
      const counts = new Map<string, number>();
      rawDomaines.forEach((d) => {
        const category = matchDomaine(d.domaine);
        counts.set(category.key, (counts.get(category.key) || 0) + d.total);
      });

      const result = DOMAINES.map((d) => ({
        key: d.key,
        label: d.label,
        icon: d.icon,
        accent: d.accent,
        total: counts.get(d.key) || 0,
      })).filter((d) => d.total > 0);

      setDomaineCounts(result);
    } catch (error) {
      console.error('Erreur chargement domaines:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-4 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
        <p className="font-mono-data text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
          Trouvez votre domaine
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Explorer par domaine
        </h1>
        <p className="mt-3 text-lg" style={{ color: 'var(--text-secondary)' }}>
          Parcourez nos mentors classés par domaine d'expertise
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : domaineCounts.length === 0 ? (
          <div className="card p-12 text-center">
            <p style={{ color: 'var(--text-secondary)' }}>Aucun domaine disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {domaineCounts.map((d) => {
              const colors = ACCENT_COLORS[d.accent];
              const Icon = d.icon;
              return (
                <Link key={d.key} href={`/mentors?domaine=${encodeURIComponent(d.key)}`} className="block">
                  <div className="card card-hover bookmark p-6 h-full">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: colors.bg }}
                    >
                      <Icon className="w-7 h-7" style={{ color: colors.fg }} />
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {d.label}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <Users className="w-4 h-4" />
                      <span className="font-mono-data">{d.total}</span>
                      <span>mentor{d.total > 1 ? 's' : ''} disponible{d.total > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}