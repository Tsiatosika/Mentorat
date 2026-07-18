'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, Calendar, CheckCircle, XCircle, Clock, CalendarClock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import AdminGlobalStyles from '@/components/admin/AdminGlobalStyles';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import { AdminSkeletonRows } from '@/components/admin/AdminSkeleton';

// Signature accent — cyan → blue, the "live connection" color
const ACCENT = '#06B6D4';
const ACCENT_2 = '#3B82F6';

export default function AdminSessionsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sessions', { params: { limit: 200 } });
      setSessions(res.data.sessions || []);
    } catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  const STATUS_ICON: Record<string, any> = { terminee: CheckCircle, annulee: XCircle, en_cours: Clock, confirmee: Clock, en_attente: Clock };

  const statusStyle = (statut: string) => {
    const m: Record<string, { bg: string; c: string; l: string }> = {
      terminee: { bg: 'var(--success-soft)', c: 'var(--success)', l: t('admin.status_terminee') },
      en_cours: { bg: 'rgba(6,182,212,0.15)', c: '#06B6D4', l: t('admin.status_en_cours') },
      confirmee: { bg: 'rgba(245,158,11,0.15)', c: '#F59E0B', l: t('admin.status_confirmee') },
      en_attente: { bg: 'rgba(139,92,246,0.15)', c: '#8B5CF6', l: t('admin.status_en_attente') },
      annulee: { bg: 'var(--danger-soft)', c: 'var(--danger)', l: t('admin.status_annulee') },
    };
    return m[statut] || m.en_attente;
  };

  const filtered = sessions.filter(s => s.sujet?.toLowerCase().includes(search.toLowerCase()));
  const dateLocale = language === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <div className="min-h-screen sz-scope" style={{ backgroundColor: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <AdminGlobalStyles />
      <style>{`
        .sz-scope { --sz-a: ${ACCENT}; --sz-a2: ${ACCENT_2}; }
        .sz-orb { position: absolute; border-radius: 50%; filter: blur(75px); opacity: 0.26; pointer-events: none; z-index: 0; }
        .sz-orb1 { width: 460px; height: 460px; top: -200px; left: -150px; background: radial-gradient(circle, var(--sz-a), transparent 70%); animation: szFloat1 24s ease-in-out infinite; }
        .sz-orb2 { width: 380px; height: 380px; bottom: -160px; right: -120px; background: radial-gradient(circle, var(--sz-a2), transparent 70%); animation: szFloat2 20s ease-in-out infinite; }
        @keyframes szFloat1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(40px,40px) scale(1.06); } }
        @keyframes szFloat2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-30px,-30px) scale(1.1); } }
        @media (prefers-reduced-motion: reduce) { .sz-orb1,.sz-orb2,.sz-thread-dash,.sz-status-dot,.sz-card { animation: none !important; } }

        .sz-panel { position: relative; z-index: 1; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: color-mix(in srgb, var(--card-bg) 88%, transparent); border: 1px solid var(--border); border-radius: 20px; }

        .sz-search { transition: box-shadow .25s ease, border-color .25s ease; }
        .sz-search:focus-within { border-color: var(--sz-a) !important; box-shadow: 0 0 0 4px color-mix(in srgb, var(--sz-a) 18%, transparent); }

        .sz-refresh { transition: transform .5s cubic-bezier(.22,1,.36,1), background .2s ease, color .2s ease; }
        .sz-refresh:hover { background: var(--sz-a); color: #fff !important; transform: rotate(180deg); }

        .sz-card { opacity: 0; transform: translateY(16px); animation: szCardIn .5s cubic-bezier(.22,1,.36,1) forwards; animation-delay: calc(var(--i) * 55ms); transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease, border-color .25s ease; }
        @keyframes szCardIn { to { opacity: 1; transform: translateY(0); } }
        .sz-card:hover { transform: translateY(-3px); box-shadow: 0 14px 32px -14px color-mix(in srgb, var(--row-accent) 55%, transparent); border-color: color-mix(in srgb, var(--row-accent) 45%, var(--border)) !important; }

        /* Signature: the mentoring thread — an animated flowing connector between mentor and mentee */
        .sz-thread { position: relative; display: flex; align-items: center; gap: 6px; }
        .sz-thread-line { position: relative; width: 34px; height: 2px; border-radius: 2px; overflow: hidden; background: color-mix(in srgb, var(--sz-a) 20%, transparent); }
        .sz-thread-dash { position: absolute; inset: 0; width: 40%; background: linear-gradient(90deg, transparent, var(--sz-a), var(--sz-a2), transparent); animation: szThreadFlow 2.6s linear infinite; }
        @keyframes szThreadFlow { 0% { transform: translateX(-100%); } 100% { transform: translateX(280%); } }

        .sz-badge-pop { transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
        .sz-card:hover .sz-badge-pop { transform: scale(1.06); }

        .sz-count-badge { position: relative; overflow: hidden; }
        .sz-count-badge::after { content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent); transform: translateX(-100%); animation: szShine 4s ease-in-out infinite; }
        @keyframes szShine { 0%,80%,100% { transform: translateX(-100%); } 90% { transform: translateX(150%); } }
      `}</style>

      <div className="sz-orb sz-orb1" />
      <div className="sz-orb sz-orb2" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <AdminHeader
          eyebrow={t('admin.badge')}
          title={t('admin.sessions_title')}
          subtitle={t('admin.sessions_subtitle')}
          accent={ACCENT}
          icon={<CalendarClock size={16} style={{ color: ACCENT }} />}
          right={
            <span
              className="sz-count-badge admin-mono text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(59,130,246,0.18))', color: ACCENT, border: '1px solid rgba(6,182,212,0.25)' }}
            >
              {sessions.length} {t('sessions.total').toLowerCase()}
            </span>
          }
        />

        <div className="max-w-7xl mx-auto px-6 -mt-6 relative pb-12">
          <div className="sz-panel p-4 mb-6 flex items-center gap-4">
            <div className="sz-search relative flex-1 rounded-[10px] border" style={{ borderColor: 'var(--border)' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text" placeholder={t('admin.sessions_search_placeholder')} value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <button onClick={fetchSessions} className="sz-refresh admin-focus p-2.5 rounded-xl" style={{ color: 'var(--text-secondary)' }} title={t('admin.refresh')}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <AdminSkeletonRows count={6} />
          ) : filtered.length === 0 ? (
            <div className="sz-panel">
              <AdminEmptyState
                icon={<CalendarClock size={26} />}
                title={t('admin.sessions_no_results')}
                description={t('admin.sessions_empty_desc')}
                accent={ACCENT}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((s, i) => {
                const st = statusStyle(s.statut);
                const StIcon = STATUS_ICON[s.statut] || Clock;
                return (
                  <div
                    key={s.id}
                    className="sz-card sz-panel p-5"
                    style={{ ['--i' as any]: i, ['--row-accent' as any]: st.c }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-0 pl-1">
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.sujet}</h3>
                        <div className="flex items-center gap-4 mt-1.5 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(s.date_debut).toLocaleDateString(dateLocale)}</span>
                          <span className="sz-thread">
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{s.mentor_prenom || '?'}</span>
                            <span className="sz-thread-line"><span className="sz-thread-dash" /></span>
                            <ArrowRight size={11} style={{ color: 'var(--sz-a2)' }} />
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{s.mentore_prenom || '?'}</span>
                          </span>
                        </div>
                      </div>
                      <span className="sz-badge-pop" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', padding: '3px 10px', borderRadius: '999px', fontWeight: 600, backgroundColor: st.bg, color: st.c }}>
                        <StIcon size={11} /> {st.l}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}