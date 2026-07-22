'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import AdminGlobalStyles from '@/components/admin/AdminGlobalStyles';
import AdminHeader from '@/components/admin/AdminHeader';
import { AdminSkeletonKpis, AdminSkeletonRows } from '@/components/admin/AdminSkeleton';
import { useCountUp } from '@/hooks/useCountUp';
import {
  Users, GraduationCap, Calendar, MessageCircle,
  FileText, TrendingUp, Star, Activity,
  CheckCircle, XCircle, Clock, ShieldCheck,
  RefreshCw, UserPlus, AlertTriangle,
} from 'lucide-react';

const ACCENT = '#6366F1';

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

const MONTH_LABELS: Record<'fr' | 'en', Record<string, string>> = {
  fr: { '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Août', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc' },
  en: { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' },
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

// Jauge semi-circulaire pour le taux d'annulation (0-180°, gauche → droite)
const gaugeArcPath = (pct: number, r = 40, ir = 26) => {
  const clamped = Math.max(0, Math.min(100, pct));
  const deg = (clamped / 100) * 180;
  const s = -90, e = -90 + deg;
  const large = deg > 180 ? 1 : 0;
  return [
    `M${polarX(s, r)},${polarY(s, r)}`,
    `A${r},${r},0,${large},1,${polarX(e, r)},${polarY(e, r)}`,
    `L${polarX(e, ir)},${polarY(e, ir)}`,
    `A${ir},${ir},0,${large},0,${polarX(s, ir)},${polarY(s, ir)}Z`,
  ].join(' ');
};

const gaugeTrackPath = (r = 40, ir = 26) => {
  const s = -90, e = 90;
  return [
    `M${polarX(s, r)},${polarY(s, r)}`,
    `A${r},${r},0,1,1,${polarX(e, r)},${polarY(e, r)}`,
    `L${polarX(e, ir)},${polarY(e, ir)}`,
    `A${ir},${ir},0,1,0,${polarX(s, ir)},${polarY(s, ir)}Z`,
  ].join(' ');
};

function KpiCard({ label, value, icon: Icon, color, bg, index, isNumeric }: any) {
  const animated = isNumeric ? useCountUp(value) : null;
  return (
    <div
      className="admin-card-hover admin-fade-up"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', ['--i' as any]: index }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="admin-mono text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{isNumeric ? animated : value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const dateLocale = language === 'fr' ? 'fr-FR' : 'en-US';
  const fmt = (d: string) => new Date(d).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const months = MONTH_LABELS[language] || MONTH_LABELS.fr;

  const STATUS_LABEL: Record<string, string> = {
    en_attente: t('admin.status_en_attente'), confirmee: t('admin.status_confirmee'),
    en_cours: t('admin.status_en_cours'), terminee: t('admin.status_terminee'), annulee: t('admin.status_annulee'),
  };

  const totalMentors = stats?.totalMentors || 0;
  const totalMentores = stats?.totalMentores || 0;
  const totalSessions = stats?.totalSessions || 0;
  const totalAvis = stats?.totalAvis || 0;
  const totalMessages = stats?.totalMessages || 0;
  const avgNote = stats?.avgNote || 0;
  const sessionsByStatus = stats?.sessionsByStatus || [];
  const sessionsByMonth = stats?.sessionsByMonth || [];
  const usersByMonth = stats?.usersByMonth || [];
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
    { label: t('admin.status_terminee'), val: terminees, color: 'var(--success)' },
    { label: t('admin.status_en_cours'), val: enCours, color: '#3B82F6' },
    { label: t('admin.status_confirmee'), val: confirmees, color: '#8B5CF6' },
    { label: t('admin.status_en_attente'), val: enAttente, color: 'var(--warm)' },
    { label: t('admin.status_annulee'), val: annulees, color: 'var(--danger)' },
  ].filter(d => d.val > 0);

  const dTotal = donut.reduce((a, d) => a + d.val, 0) || 1;
  let cumul = 0;
  const arcs = donut.map(d => { const start = cumul / dTotal * 360; cumul += d.val; return { ...d, start, end: cumul / dTotal * 360 }; });
  const barMax = Math.max(...donut.map(d => d.val), 1);
  const totalCount = useCountUp(totalSessions);

  // ═══ TAUX D'ANNULATION ═══
  const statusTotal = terminees + enCours + confirmees + enAttente + annulees;
  const cancellationRate = statusTotal > 0 ? (annulees / statusTotal) * 100 : 0;
  const cancellationRounded = useCountUp(Math.round(cancellationRate * 10)); // x10 pour une décimale animée
  const cancellationDisplay = (cancellationRounded / 10).toFixed(1);
  const cancellationColor = cancellationRate < 10 ? 'var(--success)' : cancellationRate <= 20 ? 'var(--warm)' : 'var(--danger)';
  const cancellationLabel = cancellationRate < 10 ? 'Sain' : cancellationRate <= 20 ? 'À surveiller' : 'Élevé';

  const kpiCards = [
    { label: t('admin.kpi_mentors'), value: totalMentors, icon: GraduationCap, color: ACCENT, bg: 'var(--accent-soft)', isNumeric: true },
    { label: t('admin.kpi_mentores'), value: totalMentores, icon: Users, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', isNumeric: true },
    { label: t('admin.kpi_sessions'), value: totalSessions, icon: Calendar, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', isNumeric: true },
    { label: t('admin.kpi_avis'), value: totalAvis, icon: Star, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', isNumeric: true },
    { label: t('admin.kpi_messages'), value: totalMessages, icon: MessageCircle, color: 'var(--warm)', bg: 'var(--warm-soft)', isNumeric: true },
    { label: t('admin.kpi_avg_rating'), value: avgNote > 0 ? avgNote.toFixed(1) + ' ★' : '—', icon: TrendingUp, color: '#EC4899', bg: 'rgba(236,72,153,0.1)', isNumeric: false },
  ];

  const tabs = ['sessions', 'mentors', 'mentores'] as const;
  const tabActiveIndex = tabs.indexOf(tab);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AdminGlobalStyles />
      <AdminHeader
        eyebrow={t('admin.badge')}
        title={t('admin.dashboard_title')}
        subtitle={t('admin.dashboard_subtitle')}
        accent={ACCENT}
        icon={<ShieldCheck size={16} style={{ color: ACCENT }} />}
        right={
          <button
            onClick={handleRefresh}
            className="admin-btn admin-focus text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> {t('admin.refresh')}
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-20 pb-12">
        {loading ? (
          <>
            <AdminSkeletonKpis />
            <AdminSkeletonRows count={4} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {kpiCards.map((k, i) => <KpiCard key={i} {...k} index={i} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Donut */}
              <div className="admin-fade-up" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', ['--i' as any]: 6 }}>
                <h3 className="admin-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Activity size={16} style={{ color: '#8B5CF6' }} /> {t('admin.sessions_distribution')}
                </h3>
                {donut.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <svg viewBox="0 0 100 100" width={140} height={140} style={{ flexShrink: 0, animation: 'adminFadeIn .7s ease .1s both' }}>
                      {arcs.map((a, i) => <path key={i} d={arcPath(a.start, a.end)} fill={a.color} opacity={0.9} />)}
                      <text x="50" y="47" textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text-primary)">{totalCount}</text>
                      <text x="50" y="58" textAnchor="middle" fontSize="7" fill="var(--text-tertiary)">{t('admin.sessions_label')}</text>
                    </svg>
                    <div className="flex-1 space-y-3">
                      {donut.map((d, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} /> {d.label}
                            </span>
                            <span className="admin-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{d.val}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                            <div className="h-full rounded-full" style={{ width: `${(d.val / barMax) * 100}%`, background: d.color, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>{t('admin.no_data')}</p>
                )}
              </div>

              {/* Sessions par mois */}
              <div className="admin-fade-up" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', ['--i' as any]: 7 }}>
                <h3 className="admin-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <TrendingUp size={16} style={{ color: '#06B6D4' }} /> {t('admin.sessions_by_month')}
                </h3>
                <div className="space-y-3">
                  {sessionsByMonth.length > 0 ? sessionsByMonth.map((s, i) => {
                    const maxVal = Math.max(...sessionsByMonth.map(x => x.total), 1);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="admin-mono text-xs w-12" style={{ color: 'var(--text-tertiary)' }}>{months[s.mois.split('-')[1]] || s.mois}</span>
                        <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                          <div
                            className="h-full rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${(s.total / maxVal) * 100}%`, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)', transition: 'width 1s cubic-bezier(.16,1,.3,1)' }}
                          >
                            <span className="text-[10px] font-bold text-white">{s.total}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }) : <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>{t('admin.no_data')}</p>}
                </div>
              </div>
            </div>

            {/* ═══ NOUVELLE RANGÉE : Inscriptions par mois + Taux d'annulation ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Inscriptions par mois */}
              <div className="admin-fade-up" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', ['--i' as any]: 8 }}>
                <h3 className="admin-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <UserPlus size={16} style={{ color: '#10B981' }} /> Inscriptions par mois
                </h3>
                <div className="space-y-3">
                  {usersByMonth.length > 0 ? usersByMonth.map((u, i) => {
                    const maxVal = Math.max(...usersByMonth.map(x => x.total), 1);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="admin-mono text-xs w-12" style={{ color: 'var(--text-tertiary)' }}>{months[u.mois.split('-')[1]] || u.mois}</span>
                        <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                          <div
                            className="h-full rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${(u.total / maxVal) * 100}%`, background: 'linear-gradient(90deg, #10B981, #34D399)', transition: 'width 1s cubic-bezier(.16,1,.3,1)' }}
                          >
                            <span className="text-[10px] font-bold text-white">{u.total}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }) : <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>{t('admin.no_data')}</p>}
                </div>
              </div>

              {/* Taux d'annulation */}
              <div className="admin-fade-up" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', ['--i' as any]: 9 }}>
                <h3 className="admin-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <AlertTriangle size={16} style={{ color: cancellationColor }} /> Taux d'annulation
                </h3>
                {statusTotal > 0 ? (
                  <div className="flex items-center gap-6">
                    <svg viewBox="0 0 100 60" width={160} height={96} style={{ flexShrink: 0, overflow: 'visible' }}>
                      <path d={gaugeTrackPath()} fill="var(--bg-tertiary)" />
                      <path d={gaugeArcPath(cancellationRate)} fill={cancellationColor} opacity={0.9} style={{ transition: 'd 1s cubic-bezier(.16,1,.3,1)' }} />
                      <text x="50" y="48" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--text-primary)">{cancellationDisplay}%</text>
                    </svg>
                    <div className="flex-1 space-y-3">
                      <div>
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full inline-block"
                          style={{ backgroundColor: `${cancellationColor}20`, color: cancellationColor }}
                        >
                          {cancellationLabel}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-secondary)' }}>Sessions annulées</span>
                        <span className="admin-mono font-bold" style={{ color: 'var(--text-primary)' }}>{annulees}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-secondary)' }}>Total sessions</span>
                        <span className="admin-mono font-bold" style={{ color: 'var(--text-primary)' }}>{statusTotal}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                        &lt;10% : matching sain · 10-20% : à surveiller · &gt;20% : revoir le matching
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>{t('admin.no_data')}</p>
                )}
              </div>
            </div>

            {/* Table onglets */}
            <div className="admin-fade-up" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', ['--i' as any]: 10 }}>
              <div className="flex relative" style={{ borderBottom: '1px solid var(--border)' }}>
                {tabs.map(tb => (
                  <button
                    key={tb} onClick={() => setTab(tb)}
                    className="admin-btn admin-focus"
                    style={{
                      flex: 1, padding: '14px 20px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                      background: tab === tb ? 'var(--accent-soft)' : 'transparent',
                      color: tab === tb ? 'var(--accent-text-on-soft)' : 'var(--text-secondary)',
                    }}
                  >
                    {tb === 'sessions' ? t('admin.tab_recent_sessions') : tb === 'mentors' ? t('admin.tab_top_mentors') : t('admin.tab_top_mentees')}
                  </button>
                ))}
                <div
                  className="admin-tab-indicator"
                  style={{ position: 'absolute', bottom: -1, height: 2, background: ACCENT, width: `${100 / tabs.length}%`, left: `${tabActiveIndex * (100 / tabs.length)}%` }}
                />
              </div>

              {tab === 'sessions' && (
                <div className="overflow-x-auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        {[t('admin.table_subject'), t('admin.table_mentor'), t('admin.table_mentee'), t('admin.table_date'), t('admin.table_status')].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentSessions.length > 0 ? recentSessions.map((s, i) => (
                        <tr
                          key={s.id || i}
                          className="admin-row admin-fade-in"
                          style={{ borderTop: '1px solid var(--border)', ['--i' as any]: i, ['--row-accent' as any]: STATUS_COLOR[s.statut] || '#6B7280' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '12px 16px 12px 20px', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sujet}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.mentor_prenom} {s.mentor_nom}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.mentore_prenom} {s.mentore_nom}</td>
                          <td className="admin-mono" style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{fmt(s.date_debut)}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, background: (STATUS_COLOR[s.statut] || '#6B7280') + '20', color: STATUS_COLOR[s.statut] || 'var(--text-secondary)' }}>
                              {s.statut === 'terminee' ? <CheckCircle size={10} /> : s.statut === 'annulee' ? <XCircle size={10} /> : <Clock size={10} />}
                              {STATUS_LABEL[s.statut] || s.statut}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>{t('admin.no_recent_sessions')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'mentors' && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topMentors.length > 0 ? topMentors.map((m, i) => (
                    <div key={m.id || i} className="admin-card-hover admin-fade-up p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', ['--i' as any]: i }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)`, color: '#fff' }}>{m.prenom?.[0]}{m.nom?.[0]}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{m.prenom} {m.nom}</p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.domaine || t('admin.not_defined')}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs mb-2">
                        <span style={{ color: '#F59E0B', fontWeight: 700 }}>★ {Number(m.note_moyenne || 0).toFixed(1)}</span>
                        <span className="admin-mono" style={{ color: 'var(--text-tertiary)' }}>{m.nb_sessions} {t('mentors.sessions')}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(((m.note_moyenne || 0) / 5) * 100, 100)}%`, background: 'linear-gradient(90deg, #F59E0B, #FBBF24)' }} />
                      </div>
                    </div>
                  )) : <p className="text-center py-8 col-span-full" style={{ color: 'var(--text-tertiary)' }}>{t('admin.no_mentors')}</p>}
                </div>
              )}

              {tab === 'mentores' && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topMentores.length > 0 ? topMentores.map((m, i) => (
                    <div key={m.id || i} className="admin-card-hover admin-fade-up p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', ['--i' as any]: i }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', color: '#fff' }}>{m.prenom?.[0]}{m.nom?.[0]}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{m.prenom} {m.nom}</p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.niveau_etude || t('admin.not_defined')}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-tertiary)' }}>{t('admin.total_label')}</span>
                        <span className="admin-mono" style={{ color: 'var(--success)', fontWeight: 700 }}>{m.nb_sessions} {t('mentors.sessions')}</span>
                      </div>
                    </div>
                  )) : <p className="text-center py-8 col-span-full" style={{ color: 'var(--text-tertiary)' }}>{t('admin.no_mentees')}</p>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}