'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserCheck, UserX, RefreshCw, Users as UsersIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import AdminGlobalStyles from '@/components/admin/AdminGlobalStyles';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import { AdminSkeletonRows } from '@/components/admin/AdminSkeleton';

// Signature accent — violet → fuchsia thread, this page's identity color
const ACCENT = '#8B5CF6';
const ACCENT_2 = '#D946EF';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('tous');

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { limit: 100, role: filter === 'tous' ? '' : filter } });
      setUsers(res.data.users || []);
    } catch (error) {
      toast.error(t('admin.users_load_error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleActif = async (userId: string, actif: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/toggle`, { actif: !actif });
      toast.success(actif ? t('admin.users_deactivated') : t('admin.users_activated'));
      fetchUsers();
    } catch { toast.error(t('common.error')); }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return u.nom?.toLowerCase().includes(q) || u.prenom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const roleTokens: any = {
    admin: { grad: 'linear-gradient(135deg,#8B5CF6,#D946EF)', soft: 'rgba(139,92,246,0.14)', c: '#A78BFA', label: t('admin.users_role_admin') },
    mentor: { grad: 'linear-gradient(135deg,#06B6D4,#3B82F6)', soft: 'rgba(6,182,212,0.14)', c: '#38BDF8', label: t('admin.users_role_mentor') },
    mentore: { grad: 'linear-gradient(135deg,#10B981,#34D399)', soft: 'rgba(16,185,129,0.14)', c: '#34D399', label: t('admin.users_role_mentee') },
  };

  const roleBadge = (role: string) => {
    const s = roleTokens[role] || roleTokens.mentore;
    return (
      <span className="uz-badge" style={{ backgroundColor: s.soft, color: s.c }}>
        <span className="uz-badge-dot" style={{ background: s.grad }} />
        {s.label}
      </span>
    );
  };

  const filterOptions = ['tous', 'mentor', 'mentore', 'admin'];
  const filterLabels: Record<string, string> = {
    tous: t('admin.users_filter_all'),
    mentor: t('admin.users_filter_mentors'),
    mentore: t('admin.users_filter_mentees'),
    admin: t('admin.users_filter_admins'),
  };
  const activeIndex = filterOptions.indexOf(filter);
  const dateLocale = language === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <div className="min-h-screen uz-scope" style={{ backgroundColor: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <AdminGlobalStyles />
      <style>{`
        .uz-scope { --uz-a: ${ACCENT}; --uz-a2: ${ACCENT_2}; }
        .uz-orb { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.28; pointer-events: none; z-index: 0; }
        .uz-orb1 { width: 480px; height: 480px; top: -220px; right: -140px; background: radial-gradient(circle, var(--uz-a), transparent 70%); animation: uzFloat1 22s ease-in-out infinite; }
        .uz-orb2 { width: 380px; height: 380px; bottom: -180px; left: -120px; background: radial-gradient(circle, var(--uz-a2), transparent 70%); animation: uzFloat2 26s ease-in-out infinite; }
        @keyframes uzFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-40px, 50px) scale(1.08); } }
        @keyframes uzFloat2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-40px) scale(1.1); } }
        @media (prefers-reduced-motion: reduce) { .uz-orb1, .uz-orb2, .uz-row, .uz-badge-dot { animation: none !important; } }

        .uz-panel { position: relative; z-index: 1; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: color-mix(in srgb, var(--card-bg) 88%, transparent); border: 1px solid var(--border); border-radius: 20px; box-shadow: 0 8px 30px -12px rgba(0,0,0,0.25); }

        .uz-search { transition: box-shadow .25s ease, border-color .25s ease; }
        .uz-search:focus-within { border-color: var(--uz-a) !important; box-shadow: 0 0 0 4px color-mix(in srgb, var(--uz-a) 18%, transparent); }

        .uz-tabs { position: relative; }
        .uz-tab-indicator { position: absolute; top: 4px; bottom: 4px; left: 4px; border-radius: 11px; z-index: 0; background: linear-gradient(135deg, var(--uz-a), var(--uz-a2)); box-shadow: 0 4px 14px -4px color-mix(in srgb, var(--uz-a) 60%, transparent); transition: transform .38s cubic-bezier(.22,1,.36,1); }
        .uz-tab-btn { position: relative; z-index: 1; transition: color .25s ease, transform .2s ease; }
        .uz-tab-btn:active { transform: scale(0.96); }

        .uz-refresh { transition: transform .5s cubic-bezier(.22,1,.36,1), background .2s ease, color .2s ease; }
        .uz-refresh:hover { background: var(--uz-a); color: #fff !important; transform: rotate(180deg); }

        .uz-row { opacity: 0; transform: translateY(14px); animation: uzRowIn .5s cubic-bezier(.22,1,.36,1) forwards; animation-delay: calc(var(--i) * 45ms); transition: background .2s ease, box-shadow .25s ease; position: relative; }
        @keyframes uzRowIn { to { opacity: 1; transform: translateY(0); } }
        .uz-row:hover { box-shadow: inset 0 0 0 9999px color-mix(in srgb, var(--row-accent) 6%, transparent); }

        .uz-avatar-ring { position: relative; width: 40px; height: 40px; border-radius: 50%; padding: 2px; background: var(--uz-a-grad); flex-shrink: 0; }
        .uz-avatar-inner { width: 100%; height: 100%; border-radius: 50%; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 700; color: var(--text-primary); }

        .uz-name-thread { position: relative; display: inline-block; }
        .uz-name-thread::after { content: ''; position: absolute; left: 0; bottom: -3px; height: 2px; width: 0; background: linear-gradient(90deg, var(--uz-a), var(--uz-a2)); transition: width .35s cubic-bezier(.22,1,.36,1); border-radius: 2px; }
        .uz-row:hover .uz-name-thread::after { width: 100%; }

        .uz-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.7rem; padding: 3px 10px 3px 8px; border-radius: 999px; font-weight: 600; letter-spacing: .01em; }
        .uz-badge-dot { width: 6px; height: 6px; border-radius: 50%; }

        .uz-status-dot { animation: uzPulse 2s ease-in-out infinite; }
        @keyframes uzPulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 currentColor; } 50% { opacity: .55; box-shadow: 0 0 0 4px transparent; } }

        .uz-toggle { transition: transform .3s cubic-bezier(.34,1.56,.64,1), background .2s ease, box-shadow .2s ease; }
        .uz-toggle:hover { transform: scale(1.12) rotate(-4deg); box-shadow: 0 6px 16px -6px rgba(0,0,0,0.35); }
        .uz-toggle:active { transform: scale(0.92); }

        .uz-count-badge { position: relative; overflow: hidden; }
        .uz-count-badge::after { content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent); transform: translateX(-100%); animation: uzShine 4s ease-in-out infinite; }
        @keyframes uzShine { 0%,80%,100% { transform: translateX(-100%); } 90% { transform: translateX(150%); } }
      `}</style>

      <div className="uz-orb uz-orb1" />
      <div className="uz-orb uz-orb2" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <AdminHeader
          eyebrow={t('admin.badge')}
          title={t('admin.users_title')}
          subtitle={t('admin.users_subtitle')}
          accent={ACCENT}
          icon={<UsersIcon size={16} style={{ color: ACCENT }} />}
          right={
            <span
              className="uz-count-badge admin-mono text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(217,70,239,0.18))', color: ACCENT, border: '1px solid rgba(139,92,246,0.25)' }}
            >
              <Sparkles size={12} />
              {users.length} {t('admin.users_col_user').toLowerCase()}{users.length !== 1 ? 's' : ''}
            </span>
          }
        />

        <div className="max-w-7xl mx-auto px-6 -mt-6 relative pb-12">
          {/* Filtres */}
          <div className="uz-panel p-4 mb-6 flex flex-wrap items-center gap-4">
            <div className="uz-search relative flex-1 min-w-[200px] rounded-[10px] border" style={{ borderColor: 'var(--border)' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text" placeholder={t('admin.users_search_placeholder')} value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div className="uz-tabs flex gap-1 p-1" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '14px' }}>
              <div
                className="uz-tab-indicator"
                style={{ width: `calc(${100 / filterOptions.length}% - 4px)`, transform: `translateX(${activeIndex * 100}%)` }}
              />
              {filterOptions.map(f => (
                <button
                  key={f} onClick={() => { setFilter(f); fetchUsers(); }}
                  className="uz-tab-btn admin-focus"
                  style={{ padding: '8px 16px', borderRadius: '11px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'transparent', color: filter === f ? '#fff' : 'var(--text-secondary)' }}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
            <button onClick={fetchUsers} className="uz-refresh admin-focus p-2.5 rounded-xl" style={{ color: 'var(--text-secondary)' }} title={t('admin.refresh')}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <AdminSkeletonRows count={6} />
          ) : filteredUsers.length === 0 ? (
            <div className="uz-panel">
              <AdminEmptyState
                icon={<UsersIcon size={26} />}
                title={t('mentors.no_results')}
                description={t('admin.users_empty_desc')}
                accent={ACCENT}
              />
            </div>
          ) : (
            <div className="uz-panel" style={{ overflow: 'hidden' }}>
              <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {[t('admin.users_col_user'), t('admin.users_col_email'), t('admin.users_col_role'), t('admin.table_status'), t('admin.users_registered_on'), t('admin.users_actions')].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => {
                      const rt = roleTokens[u.role] || roleTokens.mentore;
                      return (
                        <tr
                          key={u.id}
                          className="uz-row"
                          style={{ borderBottom: '1px solid var(--border)', ['--i' as any]: i, ['--row-accent' as any]: u.actif ? 'var(--success)' : 'var(--danger)', ['--uz-a-grad' as any]: rt.grad }}
                        >
                          <td style={{ padding: '13px 16px 13px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="uz-avatar-ring">
                              <div className="uz-avatar-inner">{u.prenom?.[0]}{u.nom?.[0]}</div>
                            </div>
                            <span className="uz-name-thread" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.prenom} {u.nom}</span>
                          </td>
                          <td style={{ padding: '13px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                          <td style={{ padding: '13px 16px' }}>{roleBadge(u.role)}</td>
                          <td style={{ padding: '13px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', padding: '3px 10px', borderRadius: '999px', backgroundColor: u.actif ? 'var(--success-soft)' : 'var(--danger-soft)', color: u.actif ? 'var(--success)' : 'var(--danger)' }}>
                              <span className="uz-status-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                              {u.actif ? t('admin.users_active') : t('admin.users_inactive')}
                            </span>
                          </td>
                          <td className="admin-mono" style={{ padding: '13px 16px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                            {new Date(u.created_at).toLocaleDateString(dateLocale)}
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            <button
                              onClick={() => toggleActif(u.id, u.actif)}
                              title={u.actif ? t('admin.users_deactivate') : t('admin.users_activate')}
                              className="uz-toggle admin-focus"
                              style={{ padding: '7px 11px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: u.actif ? 'var(--danger-soft)' : 'var(--success-soft)', color: u.actif ? 'var(--danger)' : 'var(--success)', fontSize: '0.75rem' }}
                            >
                              {u.actif ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}