import { Code2, Briefcase, MessageCircle, Scale, Globe2, Stethoscope, LucideIcon } from 'lucide-react';

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
    key: 'gestion',
    label: 'Gestion',
    icon: Briefcase,
    accent: 'warm',
    keywords: ['gestion', 'management', 'finance', 'comptabilité', 'économie', 'business', 'entrepreneuriat', 'stratégie', 'rh', 'ressources humaines', 'audit'],
  },
  {
    key: 'communication',
    label: 'Communication',
    icon: MessageCircle,
    accent: 'info',
    keywords: ['communication', 'médias', 'journalisme', 'relations publiques', 'publicité', 'marketing', 'vente', 'commercial'],
  },
  {
    key: 'droit',
    label: 'Droit',
    icon: Scale,
    accent: 'success',
    keywords: ['droit', 'juridique', 'loi', 'avocat', 'notaire', 'justice'],
  },
  {
    key: 'langue',
    label: 'Langue Anglophone',
    icon: Globe2,
    accent: 'accent',
    keywords: ['langue', 'anglais', 'français', 'traduction', 'linguistique', 'anglophone'],
  },
  {
    key: 'medecine',
    label: 'Médecine',
    icon: Stethoscope,
    accent: 'warm',
    keywords: ['santé', 'médecine', 'infirmier', 'pharmacie', 'paramédical', 'médical'],
  },
];

export const ACCENT_COLORS: Record<string, { bg: string; fg: string }> = {
  accent: { bg: 'var(--accent-soft)', fg: 'var(--accent-text-on-soft)' },
  warm: { bg: 'var(--warm-soft)', fg: 'var(--warm-text-on-soft)' },
  info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
  success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
};

export function matchDomaine(domaineTexte: string | null | undefined): DomaineConfig {
  if (!domaineTexte) return DOMAINES[0];
  const normalized = domaineTexte.toLowerCase();
  for (const d of DOMAINES) {
    if (d.keywords.some((kw) => normalized.includes(kw))) {
      return d;
    }
  }
  return DOMAINES[0];
}