'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, MessageCircle, FileText, Users, TrendingUp, Clock, Mail, Award } from 'lucide-react';
import { sessionAPI, messageAPI, mentoreAPI } from '@/services/api';

// CORRECTION 1 : stats réelles depuis l'API au lieu de valeurs statiques "-" et "0"
export default function DashboardPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [stats, setStats] = useState({
    prochaineSessions: '-',
    progression: '0%',
    messagesNonLus: '0',
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchStats();
  }, [user, router]);

  const fetchStats = async () => {
    try {
      // Sessions à venir (en_attente ou confirmee)
      const sessionsRes = await sessionAPI.getAll({ statut: 'confirmee' });
      const prochaine   = sessionsRes.data.sessions?.length ?? 0;

      // Messages non lus
      const msgRes     = await messageAPI.getUnreadCount();
      const nonLus     = msgRes.data.unread_count ?? 0;

      // Progression (mentoré uniquement)
      let progression = '—';
      if (user?.role === 'mentore') {
        const progRes = await mentoreAPI.getProgression();
        progression   = `${progRes.data.progression?.progression ?? 0}%`;
      }

      setStats({
        prochaineSessions: String(prochaine),
        progression,
        messagesNonLus:   String(nonLus),
      });
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  };

  if (!user) return null;

  const isMentor = user.role === 'mentor';

  const statsCards = [
    { title: 'Sessions confirmées', value: stats.prochaineSessions, icon: Calendar,     color: 'bg-indigo-500' },
    { title: 'Progression',         value: stats.progression,       icon: TrendingUp,   color: 'bg-green-500'  },
    { title: 'Messages non lus',    value: stats.messagesNonLus,    icon: Mail,         color: 'bg-blue-500'   },
  ];

  const menuItems = [
    { title: 'Mes sessions',  icon: Calendar,       href: '/sessions', color: 'bg-indigo-500', description: 'Voir et gérer vos sessions' },
    { title: 'Messagerie',    icon: MessageCircle,  href: '/chat',     color: 'bg-blue-500',   description: 'Discuter avec vos contacts' },
    { title: 'Rapports PDF',  icon: FileText,       href: '/reports',  color: 'bg-green-500',  description: 'Télécharger vos rapports'   },
  ];

  if (isMentor) {
    menuItems.unshift({ title: 'Mes disponibilités', icon: Clock, href: '/disponibilites', color: 'bg-purple-500', description: 'Gérer vos créneaux' });
  } else {
    menuItems.unshift({ title: 'Trouver un mentor',   icon: Users, href: '/mentors',  color: 'bg-pink-500',   description: 'Rechercher des mentors'       });
    menuItems.push({   title: 'Recommandations IA',   icon: Award, href: '/matching', color: 'bg-orange-500', description: 'Mentors suggérés pour vous'    });
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <p className="text-indigo-100 mt-1">
            {user.prenom} {user.nom} • {isMentor ? 'Mentor' : 'Mentoré'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Bienvenue, {user.prenom} ! 👋</h2>
          <p className="text-gray-600 mt-1">
            Vous êtes connecté en tant que {isMentor ? 'mentor' : 'mentoré'}.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((card, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-800">{card.value}</span>
              </div>
              <h3 className="text-gray-600 text-sm">{card.title}</h3>
            </div>
          ))}
        </div>

        {/* Accès rapide */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Accès rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item, i) => (
            <Link key={i} href={item.href}
              className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}