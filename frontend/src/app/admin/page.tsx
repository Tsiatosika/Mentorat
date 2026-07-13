'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Calendar, Star, TrendingUp, MessageCircle,
  UserCheck, BookOpen, Award, Clock, ArrowUp, ArrowDown,
  BarChart3, PieChart, Activity, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur chargement statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 rounded-full animate-spin mx-auto" style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }} />
      </div>
    );
  }

  const statCards = [
    { label: 'Mentors', value: stats?.totalMentors || 0, icon: UserCheck, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Mentorés', value: stats?.totalMentores || 0, icon: BookOpen, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Sessions', value: stats?.totalSessions || 0, icon: Calendar, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Avis', value: stats?.totalAvis || 0, icon: Star, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Note Moy.', value: stats?.avgNote || '0.0', icon: TrendingUp, color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
    { label: 'Messages', value: '0', icon: MessageCircle, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
  ];

  const statusColors: Record<string, string> = {
    terminee: '#10B981',
    en_cours: '#3B82F6',
    confirmee: '#F59E0B',
    en_attente: '#8B5CF6',
    annulee: '#EF4444',
  };

  const statusLabels: Record<string, string> = {
    terminee: 'Terminée',
    en_cours: 'En cours',
    confirmee: 'Confirmée',
    en_attente: 'En attente',
    annulee: 'Annulée',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E3A5F, #3B82F6)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white" style={{ filter: 'blur(60px)' }} />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white" style={{ filter: 'blur(80px)' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-200 mb-1">Administration</p>
              <h1 className="text-3xl font-bold text-white">Tableau de Bord</h1>
              <p className="text-blue-200 mt-2">Vue d'ensemble de la plateforme MentorIPath</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">
                Retour au site
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-20">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((card, idx) => (
            <div
              key={idx}
              className="card p-4 hover:-translate-y-1 transition-all cursor-default"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono-data" style={{ color: 'var(--text-primary)' }}>
                {card.value}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions par statut */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <PieChart className="w-5 h-5" style={{ color: '#3B82F6' }} />
              Sessions par statut
            </h3>
            <div className="space-y-3">
              {stats?.sessionsByStatus?.map((s: any) => (
                <div key={s.statut} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[s.statut] || '#94A3B8' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{statusLabels[s.statut] || s.statut}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-data text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.total}</span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      ({stats?.totalSessions > 0 ? Math.round((s.total / stats.totalSessions) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sessions par mois */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Activity className="w-5 h-5" style={{ color: '#10B981' }} />
              Sessions par mois
            </h3>
            <div className="space-y-3">
              {stats?.sessionsByMonth?.map((s: any) => (
                <div key={s.mois} className="flex items-center gap-3">
                  <span className="text-xs font-mono-data w-16" style={{ color: 'var(--text-tertiary)' }}>{s.mois}</span>
                  <div className="flex-1 h-6 rounded-full relative overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-full rounded-full absolute left-0 top-0"
                      style={{
                        width: `${Math.min((s.total / (stats?.totalSessions || 1)) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                        transition: 'width 1s ease'
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono-data font-semibold w-8 text-right" style={{ color: 'var(--text-primary)' }}>{s.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Répartition par domaine */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <BarChart3 className="w-5 h-5" style={{ color: '#8B5CF6' }} />
              Par domaine
            </h3>
            <div className="space-y-2">
              {stats?.domainDistribution?.slice(0, 6).map((d: any) => (
                <div key={d.domaine} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{d.domaine}</span>
                  <span className="font-mono-data font-semibold" style={{ color: 'var(--text-primary)' }}>{d.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Mentors & Mentorés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Top Mentors */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Award className="w-5 h-5" style={{ color: '#F59E0B' }} />
              Top 5 Mentors
            </h3>
            <div className="space-y-4">
              {stats?.topMentors?.map((m: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}>
                      {m.prenom?.[0]}{m.nom?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.prenom} {m.nom}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.domaine || 'Non défini'}</p>
                    </div>
                  </div>
                  <span className="font-mono-data text-sm font-semibold" style={{ color: 'var(--accent)' }}>{m.nb_sessions} sessions</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Mentorés */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Users className="w-5 h-5" style={{ color: '#10B981' }} />
              Top 5 Mentorés
            </h3>
            <div className="space-y-4">
              {stats?.topMentores?.map((m: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}>
                      {m.prenom?.[0]}{m.nom?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.prenom} {m.nom}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.niveau_etude || 'Non défini'}</p>
                    </div>
                  </div>
                  <span className="font-mono-data text-sm font-semibold" style={{ color: 'var(--success)' }}>{m.nb_sessions} sessions</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Derniers inscrits & Sessions récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-8">
          {/* Derniers inscrits */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Clock className="w-5 h-5" style={{ color: '#3B82F6' }} />
              Derniers inscrits
            </h3>
            <div className="space-y-3">
              {stats?.recentUsers?.slice(0, 5).map((u: any) => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                      {u.prenom?.[0]}{u.nom?.[0]}
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{u.prenom} {u.nom}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{u.email}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{
                    backgroundColor: u.role === 'mentor' ? 'var(--accent-soft)' : 'var(--success-soft)',
                    color: u.role === 'mentor' ? 'var(--accent-text-on-soft)' : 'var(--success)'
                  }}>
                    {u.role === 'mentor' ? 'Mentor' : 'Mentoré'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sessions récentes */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="w-5 h-5" style={{ color: '#F59E0B' }} />
              Sessions récentes
            </h3>
            <div className="space-y-3">
              {stats?.recentSessions?.slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{s.sujet}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {s.mentor_prenom} {s.mentor_nom} → {s.mentore_prenom} {s.mentore_nom}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full ml-2" style={{
                    backgroundColor: statusColors[s.statut] ? `${statusColors[s.statut]}20` : 'var(--bg-tertiary)',
                    color: statusColors[s.statut] || 'var(--text-secondary)'
                  }}>
                    {statusLabels[s.statut] || s.statut}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .card {
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          transition: all 0.3s ease;
        }
        .card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}