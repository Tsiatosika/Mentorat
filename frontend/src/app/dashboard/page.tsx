'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { sessionAPI } from '@/services/api';
import Topbar from '@/components/layout/Topbar';

interface Stats { sessions_confirmees: number; sessions_en_attente: number; messages_non_lus: number; progression?: number; note_moyenne?: number; }

const QUICK = [
  { label: 'Disponibilités', sub: 'Gérer vos créneaux',  href: '/profile#disponibilites', icon: 'ti-clock',         bg: '#EFF6FF', color: '#3B82F6' },
  { label: 'Sessions',       sub: 'Voir et gérer',        href: '/sessions',               icon: 'ti-calendar',      bg: '#0A3B8A', color: '#fff'    },
  { label: 'Rapports PDF',   sub: 'Télécharger',          href: '/reports',                icon: 'ti-file-text',     bg: '#F0FDF4', color: '#22C55E' },
  { label: 'Matching IA',    sub: 'Recommandations',      href: '/matching',               icon: 'ti-brain',         bg: '#FFFBEB', color: '#F59E0B' },
];

const STATUT_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  en_attente: { label: 'En attente', bg: '#FFFBEB', color: '#92400E' },
  confirmee:  { label: 'Confirmée',  bg: '#EFF6FF', color: '#1D4ED8' },
  en_cours:   { label: 'En cours',   bg: '#F0FDF4', color: '#166534' },
  terminee:   { label: 'Terminée',   bg: '#F5F7FB', color: '#6B7280' },
  annulee:    { label: 'Annulée',    bg: '#FEF2F2', color: '#991B1B' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats]       = useState<Stats>({ sessions_confirmees: 0, sessions_en_attente: 0, messages_non_lus: 0 });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await sessionAPI.getAll();
        const all: any[] = res.data.sessions || [];
        setSessions(all.slice(0, 4));
        setStats({
          sessions_confirmees:  all.filter(s => s.statut === 'confirmee').length,
          sessions_en_attente:  all.filter(s => s.statut === 'en_attente').length,
          messages_non_lus:     4,
          note_moyenne:         user?.role === 'mentor' ? 4.8 : undefined,
          progression:          user?.role === 'mentore' ? 68 : undefined,
        });
      } catch {}
      finally { setLoading(false); }
    };
    if (user) load();
  }, [user]);

  const initials = user ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase() : '??';
  const getOther = (s: any) => user?.role === 'mentor'
    ? `${s.mentore_prenom ?? ''} ${s.mentore_nom ?? ''}`.trim()
    : `${s.mentor_prenom  ?? ''} ${s.mentor_nom  ?? ''}`.trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar title="Tableau de bord" icon="ti-layout-dashboard" />

      <main style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Hero banner */}
        <div style={{ background: '#0A3B8A', borderRadius: '16px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
              Bonjour, {user?.prenom} ! 👋
            </h1>
            <p style={{ fontSize: '13px', color: '#93C5FD' }}>
              {user?.role === 'mentor'
                ? `Vous avez ${stats.sessions_en_attente} session(s) en attente de confirmation`
                : `Continuez sur votre lancée — progression en cours`}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            {user?.role === 'mentor' && stats.note_moyenne && (
              <>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{stats.note_moyenne}</div>
                <div style={{ fontSize: '11px', color: '#93C5FD', marginTop: '4px' }}>Note moyenne</div>
              </>
            )}
            {user?.role === 'mentore' && stats.progression !== undefined && (
              <>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{stats.progression}%</div>
                <div style={{ fontSize: '11px', color: '#93C5FD', marginTop: '4px' }}>Progression</div>
              </>
            )}
          </div>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { icon: 'ti-calendar-check', bg: '#EFF6FF', color: '#3B82F6', val: stats.sessions_confirmees, label: 'Sessions confirmées', trend: '+2', trendUp: true },
            { icon: 'ti-clock',          bg: '#FFFBEB', color: '#F59E0B', val: stats.sessions_en_attente, label: 'En attente',          trend: '',   trendUp: false },
            { icon: 'ti-mail',           bg: '#FEF2F2', color: '#EF4444', val: stats.messages_non_lus,    label: 'Messages non lus',    trend: '',   trendUp: false },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #E5EAF2', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: '20px', color: s.color }} aria-hidden="true" />
                </div>
                {s.trend && (
                  <div style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <i className="ti ti-arrow-up" style={{ fontSize: '10px' }} aria-hidden="true" /> {s.trend}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 600, color: '#1E3A5F', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Sessions + Accès rapide */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Sessions récentes */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #E5EAF2', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E3A5F' }}>Sessions récentes</span>
              <Link href="/sessions" style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none' }}>Voir tout →</Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: '13px' }}>Chargement...</div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <i className="ti ti-calendar-off" style={{ fontSize: '32px', color: '#E5EAF2' }} aria-hidden="true" />
                <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '8px' }}>Aucune session pour l'instant</p>
              </div>
            ) : (
              <div>
                {sessions.map((s, i) => {
                  const cfg = STATUT_CONFIG[s.statut] ?? STATUT_CONFIG.terminee;
                  const other = getOther(s);
                  const initOther = other.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < sessions.length - 1 ? '0.5px solid #F5F7FB' : 'none' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#3B82F6', flexShrink: 0 }}>
                        {initOther}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E3A5F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {other || 'Inconnu'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.sujet}
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', background: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Accès rapide */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #E5EAF2', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E3A5F', marginBottom: '16px' }}>Accès rapide</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {QUICK.map(q => (
                <Link key={q.href} href={q.href} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', border: '0.5px solid #E5EAF2', borderRadius: '12px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: q.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${q.icon}`} style={{ fontSize: '18px', color: q.color }} aria-hidden="true" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E3A5F' }}>{q.label}</div>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '1px' }}>{q.sub}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}