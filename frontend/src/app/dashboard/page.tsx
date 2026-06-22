'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, MessageCircle, FileText, Users, TrendingUp, Clock, Mail, Award } from 'lucide-react';
import { mentorAPI, mentoreAPI, sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      if (user?.role === 'mentor') {
        const response = await mentorAPI.getProfile();
        setProfile(response.data.profile);
      } else {
        const response = await mentoreAPI.getProfile();
        setProfile(response.data.profile);
      }

      const sessionsResponse = await sessionAPI.getAll();
      setSessions(sessionsResponse.data.sessions || []);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatNote = (note: any) => {
    if (!note || note === 0 || note === '0' || note === '0.00') return '0.0';
    const numNote = typeof note === 'string' ? parseFloat(note) : note;
    if (isNaN(numNote)) return '0.0';
    return numNote.toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isMentor = user.role === 'mentor';

  const sessionsTerminees = sessions.filter(s => s.statut === 'terminee').length;
  const totalSessions = sessions.length;

  const statsCards = [
    {
      title: t('dashboard.sessions'),
      value: totalSessions,
      icon: Calendar,
      accent: 'accent',
      subtitle: `${sessionsTerminees} terminées`,
    },
    {
      title: isMentor ? t('profile.note') : t('profile.progression'),
      value: isMentor ? formatNote(profile?.note_moyenne) : `${profile?.progression || 0}%`,
      icon: TrendingUp,
      accent: 'warm',
      subtitle: isMentor ? `${profile?.nb_sessions || 0} sessions` : `${sessionsTerminees}/${totalSessions} sessions`,
    },
    {
      title: t('dashboard.messages'),
      value: '0',
      icon: Mail,
      accent: 'info',
      subtitle: 'Non lus',
    },
  ];

  const menuItems = [
    { title: t('dashboard.sessions'), icon: Calendar, href: '/sessions', accent: 'accent', description: t('dashboard.sessions_desc') },
    { title: t('dashboard.messages'), icon: MessageCircle, href: '/chat', accent: 'info', description: t('dashboard.messages_desc') },
    { title: t('dashboard.reports'), icon: FileText, href: '/reports', accent: 'success', description: t('dashboard.reports_desc') },
  ];

  if (isMentor) {
    menuItems.unshift({ title: t('profile.disponibilites'), icon: Clock, href: '/disponibilites', accent: 'warm', description: t('profile.disponibilites_desc') });
  } else {
    menuItems.unshift({ title: t('dashboard.find_mentor'), icon: Users, href: '/mentors', accent: 'warm', description: t('dashboard.find_mentor_desc') });
    menuItems.push({ title: t('dashboard.recommendations'), icon: Award, href: '/matching', accent: 'accent', description: t('dashboard.recommendations_desc') });
  }

  const accentColors: Record<string, { bg: string; fg: string }> = {
    accent: { bg: 'var(--accent-soft)', fg: 'var(--accent-text-on-soft)' },
    warm: { bg: 'var(--warm-soft)', fg: 'var(--warm-text-on-soft)' },
    info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
    success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  };

  const statusConfig: Record<string, { bg: string; fg: string; label: string }> = {
    terminee: { bg: 'var(--success-soft)', fg: 'var(--success)', label: 'Terminée' },
    en_cours: { bg: 'var(--info-soft)', fg: 'var(--info)', label: 'En cours' },
    annulee: { bg: 'var(--danger-soft)', fg: 'var(--danger)', label: 'Annulée' },
    confirmee: { bg: 'var(--warm-soft)', fg: 'var(--warm-text-on-soft)', label: 'Confirmée' },
    en_attente: { bg: 'var(--bg-tertiary)', fg: 'var(--text-secondary)', label: 'En attente' },
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-8 max-w-7xl mx-auto">
        <p className="font-mono-data text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
          {t('dashboard.activity')}
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('dashboard.welcome')}, {user.prenom} 👋
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((card, index) => {
            const colors = accentColors[card.accent];
            return (
              <div key={index} className="card card-hover animate-in p-6" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.bg }}
                  >
                    <card.icon className="w-5 h-5" style={{ color: colors.fg }} />
                  </div>
                  <span className="font-mono-data text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {card.value}
                  </span>
                </div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{card.title}</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{card.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Sessions récentes */}
        {sessions.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Sessions récentes
            </h2>
            <div className="space-y-3">
              {sessions.slice(0, 3).map((session) => {
                const cfg = statusConfig[session.statut] || statusConfig.en_attente;
                return (
                  <div key={session.id} className="card bookmark p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{session.sujet}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(session.date_debut).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB')}
                      </p>
                    </div>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: cfg.bg, color: cfg.fg }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Accès rapide */}
        <h2 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {t('dashboard.quick_access')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => {
            const colors = accentColors[item.accent];
            return (
              <Link key={index} href={item.href} className="block">
                <div className="card card-hover p-6 h-full">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: colors.bg }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: colors.fg }} />
                  </div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}