import { Code2, Megaphone, Palette, Calculator, Briefcase, Stethoscope, Globe2, BookOpen, LucideIcon } from 'lucide-react';

export interface DomaineConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  accent: 'accent' | 'warm' | 'info' | 'success';
  keywords: string[];
}

export const DOMAINES: DomaineConfig[] = [
  {
    key: 'informatique',
    label: 'Informatique',
    icon: Code2,
    accent: 'accent',
    keywords: ['informatique', 'dev', 'développeur', 'programmation', 'web', 'logiciel', 'data', 'ia', 'intelligence artificielle'],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    accent: 'warm',
    keywords: ['marketing', 'communication', 'vente', 'commercial', 'publicité'],
  },
  {
    key: 'design',
    label: 'Design',
    icon: Palette,
    accent: 'info',
    keywords: ['design', 'graphisme', 'ux', 'ui', 'créatif', 'illustration'],
  },
  {
    key: 'gestion',
    label: 'Gestion & Finance',
    icon: Calculator,
    accent: 'success',
    keywords: ['gestion', 'finance', 'comptabilité', 'économie', 'audit'],
  },
  {
    key: 'business',
    label: 'Business & Entrepreneuriat',
    icon: Briefcase,
    accent: 'accent',
    keywords: ['business', 'entrepreneuriat', 'management', 'stratégie', 'rh', 'ressources humaines'],
  },
  {
    key: 'sante',
    label: 'Santé',
    icon: Stethoscope,
    accent: 'warm',
    keywords: ['santé', 'médecine', 'infirmier', 'pharmacie', 'paramédical'],
  },
  {
    key: 'langues',
    label: 'Langues',
    icon: Globe2,
    accent: 'info',
    keywords: ['langue', 'anglais', 'français', 'traduction', 'linguistique'],
  },
  {
    key: 'autre',
    label: 'Autres domaines',
    icon: BookOpen,
    accent: 'success',
    keywords: [],
  },
];

export const ACCENT_COLORS: Record<string, { bg: string; fg: string }> = {
  accent: { bg: 'var(--accent-soft)', fg: 'var(--accent-text-on-soft)' },
  warm: { bg: 'var(--warm-soft)', fg: 'var(--warm-text-on-soft)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
  success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
};

/**
 * Détermine à quelle catégorie visuelle appartient un domaine texte libre.
 * Retourne toujours une catégorie (fallback "autre" si rien ne matche).
 */
export function matchDomaine(domaineTexte: string | null | undefined): DomaineConfig {
  if (!domaineTexte) return DOMAINES[DOMAINES.length - 1];
  const normalized = domaineTexte.toLowerCase();
  for (const d of DOMAINES) {
    if (d.keywords.some((kw) => normalized.includes(kw))) {
      return d;
    }
  }
  return DOMAINES[DOMAINES.length - 1];
}