'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, MessageCircle, FileText, Users, TrendingUp, Clock, Mail, Award, BarChart3, Target, CheckCircle, XCircle } from 'lucide-react';
import { mentorAPI, mentoreAPI, sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
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
      // Récupérer le profil
      if (user?.role === 'mentor') {
        const response = await mentorAPI.getProfile();
        setProfile(response.data.profile);
      } else {
        const response = await mentoreAPI.getProfile();
        setProfile(response.data.profile);
      }

      // Récupérer les sessions
      const sessionsResponse = await sessionAPI.getAll();
      setSessions(sessionsResponse.data.sessions || []);
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isMentor = user.role === 'mentor';
  const userName = `${user.prenom} ${user.nom}`;

  // Statistiques
  const sessionsTerminees = sessions.filter(s => s.statut === 'terminee').length;
  const sessionsEnCours = sessions.filter(s => s.statut === 'en_cours').length;
  const sessionsEnAttente = sessions.filter(s => s.statut === 'en_attente').length;
  const sessionsAnnulees = sessions.filter(s => s.statut === 'annulee').length;
  const totalSessions = sessions.length;

  const statsCards = [
    { 
      title: t('dashboard.sessions'), 
      value: totalSessions, 
      icon: Calendar, 
      color: 'bg-indigo-500',
      subtitle: `${sessionsTerminees} terminées`
    },
    { 
      title: isMentor ? t('profile.note') : t('profile.progression'), 
      value: isMentor ? profile?.note_moyenne?.toFixed(1) || '0.0' : `${profile?.progression || 0}%`, 
      icon: TrendingUp, 
      color: 'bg-green-500',
      subtitle: isMentor ? `${profile?.nb_sessions || 0} sessions` : `${sessionsTerminees}/${totalSessions} sessions`
    },
    { 
      title: t('dashboard.messages'), 
      value: '0', 
      icon: Mail, 
      color: 'bg-blue-500',
      subtitle: 'Non lus'
    },
  ];

  // Menu items
  const menuItems = [
    { 
      title: t('dashboard.sessions'), 
      icon: Calendar, 
      href: '/sessions', 
      color: 'bg-indigo-500', 
      description: t('dashboard.sessions_desc') 
    },
    { 
      title: t('dashboard.messages'), 
      icon: MessageCircle, 
      href: '/chat', 
      color: 'bg-blue-500', 
      description: t('dashboard.messages_desc') 
    },
    { 
      title: t('dashboard.reports'), 
      icon: FileText, 
      href: '/reports', 
      color: 'bg-green-500', 
      description: t('dashboard.reports_desc') 
    },
  ];

  if (isMentor) {
    menuItems.unshift({ 
      title: t('profile.disponibilites'), 
      icon: Clock, 
      href: '/disponibilites', 
      color: 'bg-purple-500', 
      description: t('profile.disponibilites_desc') 
    });
  } else {
    menuItems.unshift({ 
      title: t('dashboard.find_mentor'), 
      icon: Users, 
      href: '/mentors', 
      color: 'bg-pink-500', 
      description: t('dashboard.find_mentor_desc') 
    });
    menuItems.push({ 
      title: t('dashboard.recommendations'), 
      icon: Award, 
      href: '/matching', 
      color: 'bg-orange-500', 
      description: t('dashboard.recommendations_desc') 
    });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎓</span>
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('nav.dashboard')}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {t('dashboard.welcome')}, {user.prenom} ! 👋
          </h1>
          <p className="text-indigo-100 text-lg">{t('dashboard.activity')}</p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((card, index) => (
            <div key={index} className="rounded-2xl shadow-md p-6" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{card.value}</span>
              </div>
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{card.title}</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{card.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Sessions récentes */}
        {sessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              📋 Sessions récentes
            </h2>
            <div className="space-y-3">
              {sessions.slice(0, 3).map((session) => {
                const statusColors: Record<string, string> = {
                  terminee: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                  en_cours: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                  annulee: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
                  confirmee: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                  en_attente: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                };
                const statusLabels: Record<string, string> = {
                  terminee: 'Terminée',
                  en_cours: 'En cours',
                  annulee: 'Annulée',
                  confirmee: 'Confirmée',
                  en_attente: 'En attente',
                };
                
                return (
                  <div key={session.id} className="rounded-xl shadow-md p-4 flex justify-between items-center" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{session.sujet}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(session.date_debut).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[session.statut]}`}>
                      {statusLabels[session.statut] || session.statut}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Accès rapide */}
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          🚀 {t('dashboard.quick_access')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href} className="block">
              <div className="rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 p-6" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
