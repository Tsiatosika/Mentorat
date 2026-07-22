'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserCheck, UserX, RefreshCw, Users as UsersIcon, X, Trash2, Calendar, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api, BACKEND_URL } from '@/services/api';
import toast from 'react-hot-toast';

const ACCENT = '#8B5CF6';
const ACCENT_2 = '#D946EF';

interface UserRow {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  actif: boolean;
  photo_url?: string;
  created_at: string;
}

interface UserDetail {
  user: UserRow;
  sessions: any[];
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('tous');
  const [filterActif, setFilterActif] = useState('tous');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    fetchUsers();
  }, [user]);

  useEffect(() => {
    setPage(1);
  }, [filter, filterActif, dateFrom, dateTo, search]);

  useEffect(() => {
    fetchUsers();
  }, [filter, filterActif, dateFrom, dateTo, page]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchUsers(), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: {
          page,
          limit,
          role: filter === 'tous' ? '' : filter,
          actif: filterActif === 'tous' ? '' : (filterActif === 'actif' ? 'true' : 'false'),
          search,
          dateFrom,
          dateTo,
        },
      });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch {
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

  const openDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      if (res.data.success) setDetail(res.data);
    } catch {
      toast.error('Erreur chargement du détail');
      setSelectedUserId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      toast.success('Compte supprimé définitivement');
      setDeleteTarget(null);
      setSelectedUserId(null);
      fetchUsers();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const getPhotoUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

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

  const STATUS_LABEL_SESSION: Record<string, string> = {
    en_attente: 'En attente', confirmee: 'Confirmée', en_cours: 'En cours', terminee: 'Terminée', annulee: 'Annulée',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <style>{`
        .uz-tabs { position: relative; display: flex; gap: 1px; padding: 4px; background: var(--bg-secondary); border-radius: 14px; }
        .uz-tab-indicator { position: absolute; top: 4px; bottom: 4px; left: 4px; border-radius: 11px; z-index: 0; background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_2}); box-shadow: 0 4px 14px -4px ${ACCENT}99; transition: transform .38s cubic-bezier(.22,1,.36,1); }
        .uz-tab-btn { position: relative; z-index: 1; transition: color .25s ease; padding: 8px 16px; border-radius: 11px; font-size: 0.8rem; font-weight: 600; border: none; cursor: pointer; background: transparent; }
        .uz-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); background: var(--accent-soft); }
        .uz-avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; background: linear-gradient(135deg, ${ACCENT}, ${ACCENT_2}); color: #fff; }
        .uz-row { transition: background .2s ease; cursor: pointer; }
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
              <UsersIcon size={12} /> {total} utilisateurs
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative pb-12">
        {/* Filtres combinés */}
        <div className="card p-4 mb-6 flex flex-col gap-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
          <div className="flex flex-wrap items-center gap-4">
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

          <div className="flex flex-wrap items-center gap-3">
            <select value={filterActif} onChange={e => setFilterActif(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
              <option value="tous">Statut : tous</option>
              <option value="actif">Actifs uniquement</option>
              <option value="inactif">Inactifs uniquement</option>
            </select>
            <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Inscrit entre</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>et</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            {(dateFrom || dateTo || filterActif !== 'tous') && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setFilterActif('tous'); }} className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Tableau */}
        {loading ? (
          <div className="card p-8 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <div className="w-10 h-10 rounded-full animate-spin mx-auto" style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }} />
          </div>
        ) : users.length === 0 ? (
          <div className="card p-12 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <UsersIcon size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Aucun utilisateur trouvé</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Essayez de modifier vos filtres de recherche.</p>
          </div>
        ) : (
          <>
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
                    {users.map((u) => {
                      const photoUrl = getPhotoUrl(u.photo_url);
                      return (
                        <tr key={u.id} className="uz-row" style={{ borderBottom: '1px solid var(--border)' }} onClick={() => openDetail(u.id)}>
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
                          <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleActif(u.id, u.actif)}
                                title={u.actif ? 'Désactiver' : 'Activer'}
                                style={{ padding: '7px 11px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: u.actif ? 'var(--danger-soft)' : 'var(--success-soft)', color: u.actif ? 'var(--danger)' : 'var(--success)', fontSize: '0.75rem' }}
                              >
                                {u.actif ? <UserX size={14} /> : <UserCheck size={14} />}
                              </button>
                              <button
                                onClick={() => setDeleteTarget(u)}
                                title="Supprimer définitivement"
                                style={{ padding: '7px 11px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', color: 'var(--danger)', fontSize: '0.75rem' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Page {page} sur {totalPages} — {total} résultat{total > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-2 rounded-lg disabled:opacity-40" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-2 rounded-lg disabled:opacity-40" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL DÉTAIL UTILISATEUR */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setSelectedUserId(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Détail utilisateur</h3>
              <button onClick={() => setSelectedUserId(null)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]" style={{ color: 'var(--text-secondary)' }}><X className="w-5 h-5" /></button>
            </div>

            {detailLoading || !detail ? (
              <div className="p-12 flex justify-center"><div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  {getPhotoUrl(detail.user.photo_url) ? (
                    <img src={getPhotoUrl(detail.user.photo_url)} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="uz-avatar-placeholder" style={{ width: 64, height: 64, fontSize: '1.2rem' }}>{detail.user.prenom?.[0]}{detail.user.nom?.[0]}</div>
                  )}
                  <div>
                    <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{detail.user.prenom} {detail.user.nom}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{detail.user.email}</p>
                    <div className="flex items-center gap-2 mt-1">{roleBadge(detail.user.role)}</div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    Sessions ({detail.sessions.length})
                  </p>
                  {detail.sessions.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Aucune session</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {detail.sessions.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                            <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{s.sujet}</span>
                          </div>
                          <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{STATUS_LABEL_SESSION[s.statut] || s.statut}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => setDeleteTarget(detail.user)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}>
                    <Trash2 className="w-4 h-4" /> Supprimer ce compte
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--danger-soft)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Supprimer définitivement ?</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Cette action supprimera <strong>{deleteTarget.prenom} {deleteTarget.nom}</strong> ainsi que toutes ses sessions et messages associés. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                Annuler
              </button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--danger)', color: '#fff' }}>
                {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}