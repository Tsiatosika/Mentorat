'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Trash2, Wrench } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import AdminGlobalStyles from '@/components/admin/AdminGlobalStyles';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import { AdminSkeletonBar } from '@/components/admin/AdminSkeleton';

// Signature accent — teal → emerald, the "growth" color
const ACCENT = '#14B8A6';
const ACCENT_2 = '#34D399';

export default function AdminCompetencesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [competences, setCompetences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComp, setNewComp] = useState('');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    fetchCompetences();
  }, [user]);

  const fetchCompetences = async () => {
    setLoading(true);
    try {
      const res = await api.get('/competences');
      setCompetences(res.data.competences || res.data.data || []);
    } catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  const addCompetence = async () => {
    if (!newComp.trim()) return;
    setAdding(true);
    try {
      await api.post('/admin/competences', { nom: newComp.trim() });
      toast.success(t('admin.competences_added'));
      setNewComp('');
      fetchCompetences();
    } catch { toast.error(t('common.error')); }
    finally { setAdding(false); }
  };

  const deleteCompetence = async (id: string) => {
    if (!confirm(t('admin.competences_delete_confirm'))) return;
    try {
      await api.delete(`/admin/competences/${id}`);
      toast.success(t('admin.competences_deleted'));
      fetchCompetences();
    } catch { toast.error(t('common.error')); }
  };

  const filtered = competences.filter((c: any) => c.nom?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen cz-scope" style={{ backgroundColor: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <AdminGlobalStyles />
      <style>{`
        .cz-scope { --cz-a: ${ACCENT}; --cz-a2: ${ACCENT_2}; }
        .cz-orb { position: absolute; border-radius: 50%; filter: blur(75px); opacity: 0.26; pointer-events: none; z-index: 0; }
        .cz-orb1 { width: 420px; height: 420px; top: -170px; left: 10%; background: radial-gradient(circle, var(--cz-a), transparent 70%); animation: czFloat 23s ease-in-out infinite; }
        .cz-orb2 { width: 360px; height: 360px; bottom: -160px; right: 5%; background: radial-gradient(circle, var(--cz-a2), transparent 70%); animation: czFloat 19s ease-in-out infinite reverse; }
        @keyframes czFloat { 0%,100% { transform: translate(0,0); } 50% { transform: translate(25px,-30px) scale(1.08); } }
        @media (prefers-reduced-motion: reduce) { .cz-orb1,.cz-orb2,.cz-chip,.cz-add-pulse { animation: none !important; } }

        .cz-panel { position: relative; z-index: 1; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: color-mix(in srgb, var(--card-bg) 88%, transparent); border: 1px solid var(--border); border-radius: 20px; }

        .cz-search, .cz-add-input { transition: box-shadow .25s ease, border-color .25s ease; }
        .cz-search:focus-within, .cz-add-input:focus-within { border-color: var(--cz-a) !important; box-shadow: 0 0 0 4px color-mix(in srgb, var(--cz-a) 18%, transparent); }

        .cz-add-btn { position: relative; overflow: hidden; transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease; }
        .cz-add-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.03); box-shadow: 0 10px 22px -8px color-mix(in srgb, var(--cz-a) 60%, transparent); }
        .cz-add-btn:active:not(:disabled) { transform: scale(.94); }

        .cz-chip { opacity: 0; transform: translateY(10px) scale(.9); animation: czChipIn .45s cubic-bezier(.34,1.56,.64,1) forwards; animation-delay: calc(var(--i) * 35ms); transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease, background .2s ease; }
        @keyframes czChipIn { to { opacity: 1; transform: translateY(0) scale(1); } }
        .cz-chip:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 10px 22px -10px color-mix(in srgb, var(--cz-a) 55%, transparent); background: color-mix(in srgb, var(--cz-a) 20%, transparent) !important; }

        .cz-chip-del { transition: transform .2s cubic-bezier(.34,1.56,.64,1), background .2s ease; }
        .cz-chip-del:hover { transform: scale(1.25) rotate(8deg); }

        .cz-count-badge { position: relative; overflow: hidden; }
        .cz-count-badge::after { content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent); transform: translateX(-100%); animation: czShine 4s ease-in-out infinite; }
        @keyframes czShine { 0%,80%,100% { transform: translateX(-100%); } 90% { transform: translateX(150%); } }
      `}</style>

      <div className="cz-orb cz-orb1" />
      <div className="cz-orb cz-orb2" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <AdminHeader
          eyebrow={t('admin.badge')}
          title={t('admin.competences_title')}
          subtitle={t('admin.competences_subtitle')}
          accent={ACCENT}
          icon={<Wrench size={16} style={{ color: ACCENT }} />}
          right={
            <span
              className="cz-count-badge admin-mono text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.18), rgba(52,211,153,0.18))', color: ACCENT, border: '1px solid rgba(20,184,166,0.25)' }}
            >
              {competences.length}
            </span>
          }
        />

        <div className="max-w-4xl mx-auto px-6 -mt-6 relative pb-12">
          <div className="cz-panel p-4 mb-6 flex flex-wrap items-center gap-3">
            <div className="cz-search relative flex-1 min-w-[200px] rounded-[10px] border" style={{ borderColor: 'var(--border)' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text" placeholder={t('admin.competences_search_placeholder')} value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div className="flex gap-2 flex-1 min-w-[250px]">
              <div className="cz-add-input flex-1 rounded-[10px] border" style={{ borderColor: 'var(--border)' }}>
                <input
                  type="text" placeholder={t('admin.competences_new_placeholder')} value={newComp} onChange={e => setNewComp(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCompetence()}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <button
                onClick={addCompetence}
                disabled={adding || !newComp.trim()}
                className="cz-add-btn admin-focus"
                style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`, color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', opacity: adding || !newComp.trim() ? 0.55 : 1 }}
              >
                <Plus size={16} /> {t('disponibilites.add')}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <AdminSkeletonBar key={i} width={70 + (i % 4) * 20} height={32} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="cz-panel">
              <AdminEmptyState
                icon={<Wrench size={26} />}
                title={t('admin.competences_no_results')}
                description={t('admin.competences_empty_desc')}
                accent={ACCENT}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filtered.map((c: any, i: number) => (
                <span
                  key={c.id}
                  className="cz-chip flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium group"
                  style={{ backgroundColor: 'rgba(20,184,166,0.12)', color: '#0F766E', ['--i' as any]: i }}
                >
                  {c.nom}
                  <button
                    onClick={() => deleteCompetence(c.id)}
                    className="cz-chip-del admin-focus opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-red-100"
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}