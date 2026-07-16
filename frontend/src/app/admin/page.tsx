'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import {
  Users, GraduationCap, Calendar, MessageCircle,
  FileText, TrendingUp, Star, Activity,
  CheckCircle, XCircle, Clock, ShieldCheck,
  ArrowUpRight, RefreshCw,
} from 'lucide-react';

interface DashboardStats {
  totalMentors: number;
  totalMentores: number;
  totalUsers: number;
  totalSessions: number;
  totalAvis: number;
  totalMessages: number;
  avgNote: number;
  sessionsByStatus: { statut: string; total: number }[];
  sessionsByMonth: { mois: string; total: number }[];
  usersByMonth: { mois: string; total: number }[];
  topMentors: { id: string; nom: string; prenom: string; photo_url: string; domaine: string; nb_sessions: number; note_moyenne: number }[];
  topMentores: { id: string; nom: string; prenom: string; photo_url: string; niveau_etude: string; nb_sessions: number }[];
  domainDistribution: { domaine: string; total: number }[];
  recentUsers: { id: string; nom: string; prenom: string; email: string; role: string; photo_url: string; created_at: string }[];
  recentSessions: { id: string; sujet: string; statut: string; date_debut: string; mentor_nom: string; mentor_prenom: string; mentore_nom: string; mentore_prenom: string }[];
}

const STATUS_COLOR: Record<string, string> = {
  en_attente: '#F59E0B', confirmee: '#6366F1', en_cours: '#10B981',
  terminee: '#6B7280', annulee: '#EF4444',
};
const STATUS_LABEL: Record<string, string> = {
  en_attente: 'En attente', confirmee: 'Confirmée', en_cours: 'En cours',
  terminee: 'Terminée', annulee: 'Annulée',
};
const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
  '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Août',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
};

const polarX = (deg: number, r: number) => 50 + r * Math.cos((deg - 90) * Math.PI / 180);
const polarY = (deg: number, r: number) => 50 + r * Math.sin((deg - 90) * Math.PI / 180);
const arcPath = (s: number, e: number, r = 38, ir = 24) => {
  const large = (e - s) > 180 ? 1 : 0;
  return [
    `M${polarX(s, r)},${polarY(s, r)}`,
    `A${r},${r},0,${large},1,${polarX(e, r)},${polarY(e, r)}`,
    `L${polarX(e, ir)},${polarY(e, ir)}`,
    `A${ir},${ir},0,${large},0,${polarX(s, ir)},${polarY(s, ir)}Z`,
  ].join(' ');
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // ⚠️ Correction : ajouter 'mentores' dans le type
  const [tab, setTab] = useState<'sessions' | 'mentors' | 'mentores'>('sessions');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'admin') { router.push('/dashboard'); return; }
    fetchDashboard();
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      if (response.data.success) setStats(response.data.stats);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => { setRefreshing(true); fetchDashboard(); };
  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full animate-spin mx-auto mb-4" style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const totalMentors = stats?.totalMentors || 0;
  const totalMentores = stats?.totalMentores || 0;
  const totalSessions = stats?.totalSessions || 0;
  const totalAvis = stats?.totalAvis || 0;
  const totalMessages = stats?.totalMessages || 0;
  const avgNote = stats?.avgNote || 0;
  const sessionsByStatus = stats?.sessionsByStatus || [];
  const sessionsByMonth = stats?.sessionsByMonth || [];
  const topMentors = stats?.topMentors || [];
  const topMentores = stats?.topMentores || [];
  const recentSessions = stats?.recentSessions || [];

  const statusMap = new Map(sessionsByStatus.map(s => [s.statut, s.total]));
  const terminees = statusMap.get('terminee') || 0;
  const enCours = statusMap.get('en_cours') || 0;
  const confirmees = statusMap.get('confirmee') || 0;
  const enAttente = statusMap.get('en_attente') || 0;
  const annulees = statusMap.get('annulee') || 0;

  const donut = [
    { label: 'Terminées', val: terminees, color: 'var(--success)' },
    { label: 'En cours', val: enCours, color: '#3B82F6' },
    { label: 'Confirmées', val: confirmees, color: '#8B5CF6' },
    { label: 'En attente', val: enAttente, color: 'var(--warm)' },
    { label: 'Annulées', val: annulees, color: 'var(--danger)' },
  ].filter(d => d.val > 0);

  const dTotal = donut.reduce((a, d) => a + d.val, 0) || 1;
  let cumul = 0;
  const arcs = donut.map(d => { const start = cumul / dTotal * 360; cumul += d.val; return { ...d, start, end: cumul / dTotal * 360 }; });
  const barMax = Math.max(...donut.map(d => d.val), 1);

  const kpiCards = [
    { label: 'Mentors', value: totalMentors, icon: GraduationCap, color: 'var(--accent)', bg: 'var(--accent-soft)' },
    { label: 'Mentorés', value: totalMentores, icon: Users, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Sessions', value: totalSessions, icon: Calendar, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
    { label: 'Avis', value: totalAvis, icon: Star, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Messages', value: totalMessages, icon: MessageCircle, color: 'var(--warm)', bg: 'var(--warm-soft)' },
    { label: 'Note moy.', value: avgNote > 0 ? avgNote.toFixed(1) + ' ★' : '—', icon: TrendingUp, color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ background: 'linear-gradient(135deg, #1E3A5F, #3B82F6)', padding: '32px 24px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} style={{ color: '#A78BFA' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A78BFA' }}>Administration</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
              <p className="text-blue-200 mt-1">Vue d'ensemble de MentorIPath</p>
            </div>
            <button onClick={handleRefresh} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-20 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {kpiCards.map((k, i) => (
            <div key={i} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: k.bg }}><k.icon size={18} style={{ color: k.color }} /></div>
              </div>
              <div className="text-2xl font-bold font-mono-data" style={{ color: 'var(--text-primary)' }}>{k.value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Activity size={16} style={{ color: '#8B5CF6' }} /> Répartition des sessions</h3>
            <div className="flex items-center gap-6">
              <svg viewBox="0 0 100 100" width={140} height={140} style={{ flexShrink: 0 }}>
                {arcs.map((a, i) => <path key={i} d={arcPath(a.start, a.end)} fill={a.color} opacity={0.9} />)}
                <text x="50" y="47" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text-primary)">{totalSessions}</text>
                <text x="50" y="58" textAnchor="middle" fontSize="7" fill="var(--text-tertiary)">sessions</text>
              </svg>
              <div className="flex-1 space-y-3">
                {donut.map((d, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} /> {d.label}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{d.val}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}><div className="h-full rounded-full" style={{ width: `${(d.val / barMax) * 100}%`, background: d.color }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><TrendingUp size={16} style={{ color: '#06B6D4' }} /> Sessions par mois</h3>
            <div className="space-y-3">
              {sessionsByMonth.length > 0 ? sessionsByMonth.map((s, i) => {
                const maxVal = Math.max(...sessionsByMonth.map(x => x.total), 1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-mono-data w-12" style={{ color: 'var(--text-tertiary)' }}>{MONTH_LABELS[s.mois.split('-')[1]] || s.mois}</span>
                    <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${(s.total / maxVal) * 100}%`, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)' }}>
                        <span className="text-[10px] font-bold text-white">{s.total}</span>
                      </div>
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Aucune donnée</p>}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
          <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
            {(['sessions', 'mentors', 'mentores'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '14px 20px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, background: tab === t ? 'var(--accent-soft)' : 'transparent', color: tab === t ? 'var(--accent-text-on-soft)' : 'var(--text-secondary)', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all 0.15s' }}>
                {t === 'sessions' ? '📅 Sessions récentes' : t === 'mentors' ? '🏆 Top mentors' : '🎓 Top mentorés'}
              </button>
            ))}
          </div>

          {tab === 'sessions' && (
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: 'var(--bg-secondary)' }}>{['Sujet','Mentor','Mentoré','Date','Statut'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {recentSessions.length > 0 ? recentSessions.map((s, i) => (
                    <tr key={s.id || i} style={{ borderTop: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sujet}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.mentor_prenom} {s.mentor_nom}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.mentore_prenom} {s.mentore_nom}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{fmt(s.date_debut)}</td>
                      <td style={{ padding: '12px 16px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, background: (STATUS_COLOR[s.statut]||'#6B7280')+'20', color: STATUS_COLOR[s.statut]||'var(--text-secondary)' }}>{s.statut==='terminee'?<CheckCircle size={10}/>:s.statut==='annulee'?<XCircle size={10}/>:<Clock size={10}/>}{STATUS_LABEL[s.statut]||s.statut}</span></td>
                    </tr>
                  )) : <tr><td colSpan={5} className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>Aucune session récente</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'mentors' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topMentors.length > 0 ? topMentors.map((m, i) => (
                <div key={m.id || i} className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, var(--accent), #8B5CF6)', color: '#fff' }}>{m.prenom?.[0]}{m.nom?.[0]}</div>
                    <div className="min-w-0"><p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{m.prenom} {m.nom}</p><p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.domaine || 'Non défini'}</p></div>
                  </div>
                  <div className="flex justify-between text-xs mb-2"><span style={{ color: '#F59E0B', fontWeight: 700 }}>★ {Number(m.note_moyenne || 0).toFixed(1)}</span><span style={{ color: 'var(--text-tertiary)' }}>{m.nb_sessions} sessions</span></div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}><div className="h-full rounded-full" style={{ width: `${Math.min(((m.note_moyenne||0)/5)*100,100)}%`, background: 'linear-gradient(90deg, #F59E0B, #FBBF24)' }} /></div>
                </div>
              )) : <p className="text-center py-8 col-span-full" style={{ color: 'var(--text-tertiary)' }}>Aucun mentor</p>}
            </div>
          )}

          {tab === 'mentores' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topMentores.length > 0 ? topMentores.map((m, i) => (
                <div key={m.id || i} className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', color: '#fff' }}>{m.prenom?.[0]}{m.nom?.[0]}</div>
                    <div className="min-w-0"><p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{m.prenom} {m.nom}</p><p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.niveau_etude || 'Non défini'}</p></div>
                  </div>
                  <div className="flex justify-between text-xs"><span style={{ color: 'var(--text-tertiary)' }}>Total</span><span style={{ color: 'var(--success)', fontWeight: 700 }}>{m.nb_sessions} sessions</span></div>
                </div>
              )) : <p className="text-center py-8 col-span-full" style={{ color: 'var(--text-tertiary)' }}>Aucun mentoré</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}