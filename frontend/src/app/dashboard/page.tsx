'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, MessageCircle, FileText, Users, TrendingUp, Clock, Mail, Award } from 'lucide-react';
import { mentorAPI, mentoreAPI, sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      if (user?.role === 'mentor') {
        const response = await mentorAPI.getProfile();
        setProfile(response.data.profile);
      } else {
        const response = await mentoreAPI.getProfile();
        setProfile(response.data.profile);
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isMentor = user.role === 'mentor';
  const userName = `${user.prenom} ${user.nom}`;

  const statsCards = [
    { title: t('dashboard.sessions'), value: '-', icon: Calendar, color: 'bg-indigo-500' },
    { title: t('profile.progression'), value: profile?.progression ? `${profile.progression}%` : '0%', icon: TrendingUp, color: 'bg-green-500' },
    { title: t('dashboard.messages'), value: '0', icon: Mail, color: 'bg-blue-500' },
  ];

  if (isMentor && profile) {
    statsCards[0].value = profile.nb_sessions || 0;
    statsCards[1].value = `${Math.round(profile.note_moyenne || 0)}/5`;
  }

  const menuItems = [
    { title: t('dashboard.sessions'), icon: Calendar, href: '/sessions', color: 'bg-indigo-500', description: t('dashboard.sessions_desc') },
    { title: t('dashboard.messages'), icon: MessageCircle, href: '/chat', color: 'bg-blue-500', description: t('dashboard.messages_desc') },
    { title: t('dashboard.reports'), icon: FileText, href: '/reports', color: 'bg-green-500', description: t('dashboard.reports_desc') },
  ];

  if (isMentor) {
    menuItems.unshift({ title: t('profile.disponibilites'), icon: Clock, href: '/disponibilites', color: 'bg-purple-500', description: t('profile.disponibilites_desc') });
  } else {
    menuItems.unshift({ title: t('dashboard.find_mentor'), icon: Users, href: '/mentors', color: 'bg-pink-500', description: t('dashboard.find_mentor_desc') });
    menuItems.push({ title: t('dashboard.recommendations'), icon: Award, href: '/matching', color: 'bg-orange-500', description: t('dashboard.recommendations_desc') });
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎓</span>
              <span className="text-xl font-bold text-gray-900">{t('nav.dashboard')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{userName} ({isMentor ? 'Mentor' : 'Mentoré'})</span>
              <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('dashboard.welcome')}, {user.prenom} ! 👋</h1>
          <p className="text-indigo-100 text-lg">{t('dashboard.activity')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((card, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-md p-6">
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

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard.quick_access')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="p-6">
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
