'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, MessageCircle, FileText, Users, TrendingUp, Clock, Mail, Award, Activity, Target, BarChart3 } from 'lucide-react';
import { mentorAPI, mentoreAPI, sessionAPI } from '@/services/api';
import { ProgressChart, ActivityChart, StatsGrid } from '@/components/dashboard/ProgressChart';
import { SkillsRadar } from '@/components/dashboard/SkillsRadar';
import toast from 'react-hot-toast';

interface Session {
  id: string;
  sujet: string;
  date_debut: string;
  statut: string;
  note_du_mentor?: number;
  note_du_mentore?: number;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<{ date: string; score: number; sessions: number }[]>([]);
  const [activityData, setActivityData] = useState<{ date: string; count: number }[]>([]);

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
      const allSessions = sessionsResponse.data.sessions || [];
      setSessions(allSessions);

      // Préparer les données pour les graphiques
      prepareChartData(allSessions);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (sessionsData: Session[]) => {
    // Grouper par mois
    const sessionsByMonth: Record<string, { count: number; scores: number[] }> = {};
    
    sessionsData.forEach(session => {
      const date = new Date(session.date_debut);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      
      if (!sessionsByMonth[monthKey]) {
        sessionsByMonth[monthKey] = { count: 0, scores: [] };
      }
      sessionsByMonth[monthKey].count++;
      
      // Récupérer la note
      const note = session.note_du_mentor || session.note_du_mentore || 0;
      if (note > 0) {
        sessionsByMonth[monthKey].scores.push(note * 20); // Convertir note/5 en pourcentage
      }
    });

    // Calculer la progression moyenne par mois
    let cumulativeScore = 0;
    let cumulativeSessions = 0;
    const progressChartData = Object.entries(sessionsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => {
        cumulativeSessions += data.count;
        const avgScore = data.scores.length > 0 
          ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          : cumulativeScore;
        cumulativeScore = avgScore;
        
        return {
          date: key,
          score: Math.round(cumulativeScore),
          sessions: cumulativeSessions
        };
      });

    setProgressData(progressChartData);

    // Données d'activité (derniers 6 mois)
    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      
      last6Months.push({
        date: monthName,
        count: sessionsByMonth[monthKey]?.count || 0
      });
    }
    setActivityData(last6Months);
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
  
  // Statistiques
  const sessionsTerminees = sessions.filter(s => s.statut === 'terminee').length;
  const sessionsEnCours = sessions.filter(s => s.statut === 'en_cours').length;
  const sessionsAnnulees = sessions.filter(s => s.statut === 'annulee').length;
  const tauxReussite = sessions.length > 0 ? Math.round((sessionsTerminees / sessions.length) * 100) : 0;

  // Calcul de la note moyenne
  const notes = sessions
    .filter(s => s.note_du_mentor || s.note_du_mentore)
    .map(s => s.note_du_mentor || s.note_du_mentore || 0);
  const noteMoyenne = notes.length > 0 
    ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1)
    : 'N/A';

  const stats = [
    { label: 'Sessions terminées', value: sessionsTerminees, color: 'bg-green-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Sessions en cours', value: sessionsEnCours, color: 'bg-blue-500', icon: <Clock className="w-5 h-5 text-white" /> },
    { label: 'Taux de réussite', value: `${tauxReussite}%`, color: 'bg-indigo-500', icon: <Target className="w-5 h-5 text-white" /> },
    { label: 'Note moyenne', value: noteMoyenne, color: 'bg-yellow-500', icon: <Star className="w-5 h-5 text-white" /> },
  ];

  // Données radar pour les compétences
  const skillsData = profile?.competences?.map((comp: any) => ({
    subject: comp.nom,
    value: comp.niveau === 'avance' ? 80 : comp.niveau === 'intermediaire' ? 60 : 40,
    fullMark: 100
  })) || [];

  const menuItems = [
    { title: 'Mes sessions', icon: Calendar, href: '/sessions', color: 'bg-indigo-500', description: 'Voir et gérer vos sessions' },
    { title: 'Messagerie', icon: MessageCircle, href: '/chat', color: 'bg-blue-500', description: 'Discuter avec vos contacts' },
    { title: 'Rapports PDF', icon: FileText, href: '/reports', color: 'bg-green-500', description: 'Télécharger vos rapports' },
  ];

  if (isMentor) {
    menuItems.unshift({ title: 'Mes disponibilités', icon: Clock, href: '/disponibilites', color: 'bg-purple-500', description: 'Gérer vos créneaux' });
  } else {
    menuItems.unshift({ title: 'Trouver un mentor', icon: Users, href: '/mentors', color: 'bg-pink-500', description: 'Rechercher des mentors' });
    menuItems.push({ title: 'Recommandations IA', icon: Award, href: '/matching', color: 'bg-orange-500', description: 'Mentors suggérés' });
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎓</span>
              <span className="text-xl font-bold text-gray-900">Tableau de bord</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{userName} ({isMentor ? 'Mentor' : 'Mentoré'})</span>
              <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Bienvenue, {user.prenom} ! 👋</h1>
          <p className="text-indigo-100 text-lg">Voici votre activité en un coup d'œil</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistiques */}
        <div className="mb-8">
          <StatsGrid stats={stats} />
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ProgressChart data={progressData} title="Évolution de votre progression" />
          <ActivityChart data={activityData} />
        </div>

        {/* Radar des compétences (pour mentoré) */}
        {!isMentor && skillsData.length > 0 && (
          <div className="mb-8">
            <SkillsRadar data={skillsData} title="Compétences en développement" />
          </div>
        )}

        {/* Accès rapide */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Accès rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
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

// Composants d'icônes supplémentaires
const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Star = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);
