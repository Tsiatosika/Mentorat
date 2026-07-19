'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserCheck, UserX, RefreshCw, Users as UsersIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api, BACKEND_URL } from '@/services/api';
import toast from 'react-hot-toast';

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

  // ⚠️ Recharger quand le filtre change
  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { limit: 100, role: filter === 'tous' ? '' : filter } });
      setUsers(res.data.users || []);
    } catch (error) {
      toast.error('Erreur chargement utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const toggleActif = async (userId: string, actif: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/toggle`, { actif: !actif });
      toast.success(actif ? 'Utilisateur désactivé' : 'Utilisateur activé');
      fetchUsers();
    } catch { toast.error('Erreur'); }
  };

  const getPhotoUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return u.nom?.toLowerCase().includes(q) || u.prenom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const roleBadge = (role: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      admin: { bg: 'rgba(139,92,246,0.14)', color: '#A78BFA', label: 'Admin' },
      mentor: { bg: 'rgba(6,182,212,0.14)', color: '#38BDF8', label: 'Mentor' },
      mentore: { bg: 'rgba(16,185,129,0.14)', color: '#34D399', label: 'Mentoré' },
    };
    const s = styles[role] || styles.mentore;
    return (
      <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '999px', fontWeight: 600, backgroundColor: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  const filterOptions = ['tous', 'mentor', 'mentore', 'admin'];
  const filterLabels: Record<string, string> = { tous: 'Tous', mentor: 'Mentors', mentore: 'Mentorés', admin: 'Admins' };
  const activeIndex = filterOptions.indexOf(filter);
  const dateLocale = language === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <style>{`
        .uz-tabs { position: relative; display: flex; gap: 1px; padding: 4px; background: var(--bg-secondary); border-radius: 14px; }
        .uz-tab-indicator { position: absolute; top: 4px; bottom: 4px; left: 4px; border-radius: 11px; z-index: 0; background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_2}); box-shadow: 0 4px 14px -4px ${ACCENT}99; transition: transform .38s cubic-bezier(.22,1,.36,1); }
        .uz-tab-btn { position: relative; z-index: 1; transition: color .25s ease; padding: 8px 16px; border-radius: 11px; font-size: 0.8rem; font-weight: 600; border: none; cursor: pointer; background: transparent; }
        .uz-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); background: var(--accent-soft); }
        .uz-avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_2}); color: #fff; }
        .uz-row { transition: background .2s ease; }
        .uz-row:hover { background: var(--bg-secondary); }
        @media (prefers-reduced-motion: reduce) { .uz-tab-indicator { transition: none !important; } }
      `}</style>

      {/* Header */}
      <div className="admin-header" style={{ background: 'linear-gradient(135deg, #1E3A5F, #3B82F6)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UsersIcon size={16} style={{ color: '#A78BFA' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A78BFA' }}>Administration</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Utilisateurs</h1>
              <p className="text-blue-200 mt-1">Gérer les mentors, mentorés et administrateurs</p>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
              <UsersIcon size={12} /> {users.length} utilisateurs
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative pb-12">
        {/* Filtres */}
        <div className="card p-4 mb-6 flex flex-wrap items-center gap-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text" placeholder="Rechercher un utilisateur..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <div className="uz-tabs">
            <div className="uz-tab-indicator" style={{ width: `calc(${100 / filterOptions.length}% - 4px)`, transform: `translateX(${activeIndex * 100}%)` }} />
            {filterOptions.map(f => (
              <button key={f} onClick={() => setFilter(f)} className="uz-tab-btn" style={{ color: filter === f ? '#fff' : 'var(--text-secondary)' }}>
                {filterLabels[f]}
              </button>
            ))}
          </div>
          <button onClick={fetchUsers} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" style={{ color: 'var(--text-secondary)' }} title="Actualiser">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tableau */}
        {loading ? (
          <div className="card p-8 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <div className="w-10 h-10 rounded-full animate-spin mx-auto" style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="card p-12 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <UsersIcon size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Aucun utilisateur trouvé</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Essayez de modifier vos filtres de recherche.</p>
          </div>
        ) : (
          <div className="card" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                    {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => {
                    const photoUrl = getPhotoUrl(u.photo_url);
                    return (
                      <tr key={u.id} className="uz-row" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {photoUrl ? (
                            <img src={photoUrl} alt={`${u.prenom} ${u.nom}`} className="uz-avatar" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="uz-avatar-placeholder">{u.prenom?.[0]}{u.nom?.[0]}</div>
                          )}
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.prenom} {u.nom}</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                        <td style={{ padding: '12px 16px' }}>{roleBadge(u.role)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', padding: '4px 10px', borderRadius: '999px', backgroundColor: u.actif ? 'var(--success-soft)' : 'var(--danger-soft)', color: u.actif ? 'var(--success)' : 'var(--danger)' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                            {u.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="font-mono-data" style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                          {new Date(u.created_at).toLocaleDateString(dateLocale)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => toggleActif(u.id, u.actif)}
                            title={u.actif ? 'Désactiver' : 'Activer'}
                            style={{ padding: '7px 11px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: u.actif ? 'var(--danger-soft)' : 'var(--success-soft)', color: u.actif ? 'var(--danger)' : 'var(--success)', fontSize: '0.75rem', transition: 'all 0.2s' }}
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
  );
}