'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Plus, Trash2, RefreshCw, Wrench } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export default function AdminCompetencesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [competences, setCompetences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComp, setNewComp] = useState('');
  const [search, setSearch] = useState('');

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
    try {
      await api.post('/admin/competences', { nom: newComp.trim() });
      toast.success(t('admin.competences_added'));
      setNewComp('');
      fetchCompetences();
    } catch { toast.error(t('common.error')); }
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

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}><div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }} /></div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A5F, #3B82F6)', padding: '32px 24px' }}>
        <div className="max-w-4xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white mb-4"><ArrowLeft size={16} /> {t('common.back')}</Link>
          <h1 className="text-3xl font-bold text-white">{t('admin.competences_title')}</h1>
          <p className="text-blue-200 mt-1">{t('admin.competences_subtitle')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-6 relative z-20 pb-12">
        <div className="card p-4 mb-6 flex flex-wrap items-center gap-3" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input type="text" placeholder={t('admin.competences_search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>
          <div className="flex gap-2 flex-1 min-w-[250px]">
            <input type="text" placeholder={t('admin.competences_new_placeholder')} value={newComp} onChange={e => setNewComp(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCompetence()}
              style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
            <button onClick={addCompetence} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: 'var(--accent)', color: '#fff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> {t('disponibilites.add')}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filtered.map((c: any) => (
            <span key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium group" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)', transition: 'all 0.2s' }}>
              {c.nom}
              <button onClick={() => deleteCompetence(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-red-100" style={{ color: 'var(--danger)' }}>
                <Trash2 size={12} />
              </button>
            </span>
          ))}
          {filtered.length === 0 && <p style={{ color: 'var(--text-tertiary)' }}>{t('admin.competences_no_results')}</p>}
        </div>
      </div>
    </div>
  );
}