'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, Star, EyeOff, Eye, Trash2, AlertTriangle, MessageSquareWarning, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import AdminGlobalStyles from '@/components/admin/AdminGlobalStyles';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import { AdminSkeletonRows } from '@/components/admin/AdminSkeleton';

const ACCENT = '#F59E0B';
const ACCENT_2 = '#EF4444';

interface AvisRow {
  id: string;
  note_globale: number;
  note_ponctualite: number;
  note_pedagogie: number;
  note_disponibilite: number;
  commentaire: string | null;
  visible: boolean;
  motif_masquage: string | null;
  created_at: string;
  mentor_id: string;
  mentor_nom: string;
  mentor_prenom: string;
  mentore_id: string;
  mentore_nom: string;
  mentore_prenom: string;
  session_sujet: string | null;
}

export default function AdminAvisPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [avis, setAvis] = useState<AvisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibleFilter, setVisibleFilter] = useState('tous');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [maskTarget, setMaskTarget] = useState<AvisRow | null>(null);
  const [motif, setMotif] = useState('');
  const [masking, setMasking] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AvisRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    fetchAvis();
  }, [user]);

  useEffect(() => { setPage(1); }, [visibleFilter, search]);
  useEffect(() => { fetchAvis(); }, [visibleFilter, page]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchAvis(), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchAvis = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/avis', {
        params: {
          page,
          limit,
          visible: visibleFilter === 'tous' ? '' : (visibleFilter === 'visible' ? 'true' : 'false'),
          search,
        },
      });
      setAvis(res.data.avis || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      toast.error('Erreur chargement des avis');
    } finally {
      setLoading(false);
    }
  };

  const openMask = (a: AvisRow) => {
    setMaskTarget(a);
    setMotif('');
  };

  const confirmToggleVisibility = async (targetVisible: boolean) => {
    if (!maskTarget) return;
    setMasking(true);
    try {
      await api.put(`/admin/avis/${maskTarget.id}/toggle-visibility`, {
        visible: targetVisible,
        motif: targetVisible ? undefined : (motif.trim() || undefined),
      });
      toast.success(targetVisible ? 'Avis rendu visible' : 'Avis masqué');
      setMaskTarget(null);
      setMotif('');
      fetchAvis();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setMasking(false);
    }
  };

  const unmaskDirect = async (a: AvisRow) => {
    try {
      await api.put(`/admin/avis/${a.id}/toggle-visibility`, { visible: true });
      toast.success('Avis rendu visible');
      fetchAvis();
    } catch {
      toast.error('Erreur');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/avis/${deleteTarget.id}`);
      toast.success('Avis supprimé définitivement');
      setDeleteTarget(null);
      fetchAvis();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const dateLocale = language === 'fr' ? 'fr-FR' : 'en-US';

  const filterOptions = ['tous', 'visible', 'masque'];
  const filterLabels: Record<string, string> = { tous: 'Tous', visible: 'Visibles', masque: 'Masqués' };

  return (
    <div className="min-h-screen az-scope" style={{ backgroundColor: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <AdminGlobalStyles />
      <style>{`
        .az-scope { --az-a: ${ACCENT}; --az-a2: ${ACCENT_2}; }
        .az-orb { position: absolute; border-radius: 50%; filter: blur(75px); opacity: 0.22; pointer-events: none; z-index: 0; }
        .az-orb1 { width: 460px; height: 460px; top: -200px; right: -150px; background: radial-gradient(circle, var(--az-a), transparent 70%); }
        .az-orb2 { width: 380px; height: 380px; bottom: -160px; left: -120px; background: radial-gradient(circle, var(--az-a2), transparent 70%); }

        .az-panel { position: relative; z-index: 1; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: color-mix(in srgb, var(--card-bg) 88%, transparent); border: 1px solid var(--border); border-radius: 20px; }

        .az-tabs { position: relative; display: flex; gap: 1px; padding: 4px; background: var(--bg-secondary); border-radius: 14px; }
        .az-tab-indicator { position: absolute; top: 4px; bottom: 4px; left: 4px; border-radius: 11px; z-index: 0; background: linear-gradient(135deg, var(--az-a), var(--az-a2)); transition: transform .38s cubic-bezier(.22,1,.36,1); }
        .az-tab-btn { position: relative; z-index: 1; padding: 8px 16px; border-radius: 11px; font-size: 0.8rem; font-weight: 600; border: none; cursor: pointer; background: transparent; transition: color .25s ease; }

        .az-card { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s ease, border-color .25s ease; }
        .az-card:hover { transform: translateY(-2px); box-shadow: 0 12px 28px -16px rgba(15, 23, 42, 0.25); }
        .az-card.az-masked { opacity: 0.6; }

        @media (prefers-reduced-motion: reduce) { .az-tab-indicator, .az-card { transition: none !important; } }
      `}</style>

      <div className="az-orb az-orb1" />
      <div className="az-orb az-orb2" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <AdminHeader
          eyebrow="Administration"
          title="Modération des avis"
          subtitle="Masquer ou supprimer les avis problématiques"
          accent={ACCENT}
          icon={<MessageSquareWarning size={16} style={{ color: ACCENT }} />}
          right={
            <span
              className="admin-mono text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(239,68,68,0.18))', color: ACCENT, border: '1px solid rgba(245,158,11,0.25)' }}
            >
              {total} avis
            </span>
          }
        />

        <div className="max-w-7xl mx-auto px-6 -mt-6 relative pb-12">
          <div className="az-panel p-4 mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text" placeholder="Rechercher dans les commentaires..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div className="az-tabs">
              <div className="az-tab-indicator" style={{ width: `calc(${100 / filterOptions.length}% - 4px)`, transform: `translateX(${filterOptions.indexOf(visibleFilter) * 100}%)` }} />
              {filterOptions.map(f => (
                <button key={f} onClick={() => setVisibleFilter(f)} className="az-tab-btn" style={{ color: visibleFilter === f ? '#fff' : 'var(--text-secondary)' }}>
                  {filterLabels[f]}
                </button>
              ))}
            </div>
            <button onClick={fetchAvis} className="admin-focus p-2.5 rounded-xl" style={{ color: 'var(--text-secondary)' }} title="Actualiser">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <AdminSkeletonRows count={6} />
          ) : avis.length === 0 ? (
            <div className="az-panel">
              <AdminEmptyState
                icon={<MessageSquareWarning size={26} />}
                title="Aucun avis trouvé"
                description="Essayez de modifier vos filtres de recherche."
                accent={ACCENT}
              />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {avis.map((a) => (
                  <div key={a.id} className={`az-card az-panel p-5 ${!a.visible ? 'az-masked' : ''}`}>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <div className="flex items-center gap-1">
                            <Star size={14} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{a.note_globale}/5</span>
                          </div>
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {a.mentore_prenom} {a.mentore_nom} → {a.mentor_prenom} {a.mentor_nom}
                          </span>
                          {a.session_sujet && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                              {a.session_sujet}
                            </span>
                          )}
                          {!a.visible && (
                            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}>
                              <EyeOff size={10} /> Masqué
                            </span>
                          )}
                        </div>
                        {a.commentaire && (
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{a.commentaire}</p>
                        )}
                        {!a.visible && a.motif_masquage && (
                          <p className="text-xs mt-1.5 px-2 py-1 rounded-lg inline-block" style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}>
                            Motif : {a.motif_masquage}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          <span>Ponctualité : {a.note_ponctualite}/5</span>
                          <span>Pédagogie : {a.note_pedagogie}/5</span>
                          <span>Disponibilité : {a.note_disponibilite}/5</span>
                          <span>{new Date(a.created_at).toLocaleDateString(dateLocale)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {a.visible ? (
                          <button
                            onClick={() => openMask(a)}
                            className="p-2 rounded-lg hover:bg-[var(--danger-soft)]"
                            style={{ color: 'var(--danger)' }}
                            title="Masquer cet avis"
                          >
                            <EyeOff size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => unmaskDirect(a)}
                            className="p-2 rounded-lg hover:bg-[var(--success-soft)]"
                            style={{ color: 'var(--success)' }}
                            title="Rendre visible"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(a)}
                          className="p-2 rounded-lg hover:bg-[var(--danger-soft)]"
                          style={{ color: 'var(--danger)' }}
                          title="Supprimer définitivement"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Page {page} sur {totalPages} — {total} résultat{total > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    Précédent
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    Suivant
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL MASQUAGE (avec motif) */}
      {maskTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => !masking && setMaskTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--danger-soft)' }}>
                  <EyeOff className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Masquer cet avis ?</h3>
              </div>
              <button onClick={() => setMaskTarget(null)} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)]" style={{ color: 'var(--text-secondary)' }}><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              L'avis sera caché du profil public du mentor et retiré du calcul de sa note moyenne. Cette action est réversible.
            </p>
            <textarea
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Motif du masquage (optionnel, usage interne)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-4 resize-none"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-3">
              <button onClick={() => setMaskTarget(null)} disabled={masking} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                Annuler
              </button>
              <button onClick={() => confirmToggleVisibility(false)} disabled={masking} className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--danger)', color: '#fff' }}>
                {masking ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <EyeOff className="w-4 h-4" />}
                Masquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION DÉFINITIVE */}
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
              Cet avis sera supprimé pour toujours et la note moyenne du mentor sera recalculée. Cette action est irréversible — préférez le masquage si possible.
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