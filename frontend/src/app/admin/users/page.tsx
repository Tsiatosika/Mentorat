'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Shield, UserCheck, UserX, Trash2, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

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

  const roleBadge = (role: string) => {
    const styles: any = {
      admin: { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6', label: t('admin.users_role_admin') },
      mentor: { bg: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)', label: t('admin.users_role_mentor') },
      mentore: { bg: 'var(--success-soft)', color: 'var(--success)', label: t('admin.users_role_mentee') },
    };
    const s = styles[role] || styles.mentore;
    return <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: '999px', fontWeight: 500, backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
  };

  const filterLabels: Record<string, string> = {
    tous: t('admin.users_filter_all'),
    mentor: t('admin.users_filter_mentors'),
    mentore: t('admin.users_filter_mentees'),
    admin: t('admin.users_filter_admins'),
  };

  const dateLocale = language === 'fr' ? 'fr-FR' : 'en-US';

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}><div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }} /></div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A5F, #3B82F6)', padding: '32px 24px' }}>
        <div className="max-w-7xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white mb-4 transition-colors"><ArrowLeft size={16} /> {t('admin.users_back')}</Link>
          <h1 className="text-3xl font-bold text-white">{t('admin.users_title')}</h1>
          <p className="text-blue-200 mt-1">{t('admin.users_subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-20 pb-12">
        {/* Filtres */}
        <div className="card p-4 mb-6 flex flex-wrap items-center gap-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input type="text" placeholder={t('admin.users_search_placeholder')} value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>
          <div className="flex gap-2">
            {['tous', 'mentor', 'mentore', 'admin'].map(f => (
              <button key={f} onClick={() => { setFilter(f); fetchUsers(); }}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 500, border: 'none', cursor: 'pointer', backgroundColor: filter === f ? 'var(--accent)' : 'var(--bg-secondary)', color: filter === f ? '#fff' : 'var(--text-secondary)' }}>
                {filterLabels[f]}
              </button>
            ))}
          </div>
          <button onClick={fetchUsers} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--text-secondary)' }} title={t('admin.refresh')}>
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Tableau */}
        <div className="card" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[t('admin.users_col_user'), t('admin.users_col_email'), t('admin.users_col_role'), t('admin.table_status'), t('admin.users_registered_on'), t('admin.users_actions')].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-text-on-soft)' }}>
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.prenom} {u.nom}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>{roleBadge(u.role)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '999px', backgroundColor: u.actif ? 'var(--success-soft)' : 'var(--danger-soft)', color: u.actif ? 'var(--success)' : 'var(--danger)' }}>
                        {u.actif ? t('admin.users_active') : t('admin.users_inactive')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                      {new Date(u.created_at).toLocaleDateString(dateLocale)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => toggleActif(u.id, u.actif)} title={u.actif ? t('admin.users_deactivate') : t('admin.users_activate')}
                          style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: u.actif ? 'var(--danger-soft)' : 'var(--success-soft)', color: u.actif ? 'var(--danger)' : 'var(--success)', fontSize: '0.75rem', transition: 'opacity 0.2s' }}>
                          {u.actif ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}