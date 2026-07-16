'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, RefreshCw, Calendar, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

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

  const statusBadge = (statut: string) => {
    const m: any = {
      terminee: { bg: 'var(--success-soft)', c: 'var(--success)', l: t('admin.status_terminee') },
      en_cours: { bg: 'var(--accent-soft)', c: 'var(--accent-text-on-soft)', l: t('admin.status_en_cours') },
      confirmee: { bg: 'rgba(245,158,11,0.15)', c: '#F59E0B', l: t('admin.status_confirmee') },
      en_attente: { bg: 'rgba(139,92,246,0.15)', c: '#8B5CF6', l: t('admin.status_en_attente') },
      annulee: { bg: 'var(--danger-soft)', c: 'var(--danger)', l: t('admin.status_annulee') },
    };
    const s = m[statut] || m.en_attente;
    return <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: '999px', fontWeight: 500, backgroundColor: s.bg, color: s.c }}>{s.l}</span>;
  };

  const filtered = sessions.filter(s => s.sujet?.toLowerCase().includes(search.toLowerCase()));

  const dateLocale = language === 'fr' ? 'fr-FR' : 'en-US';

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}><div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }} /></div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A5F, #3B82F6)', padding: '32px 24px' }}>
        <div className="max-w-7xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white mb-4 transition-colors"><ArrowLeft size={16} /> {t('common.back')}</Link>
          <h1 className="text-3xl font-bold text-white">{t('admin.sessions_title')}</h1>
          <p className="text-blue-200 mt-1">{t('admin.sessions_subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-20 pb-12">
        <div className="card p-4 mb-6 flex items-center gap-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <div className="relative flex-1">
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input type="text" placeholder={t('admin.sessions_search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>
          <button onClick={fetchSessions} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" style={{ color: 'var(--text-secondary)' }}><RefreshCw size={18} /></button>
        </div>

        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="card p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', transition: 'all 0.2s' }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.sujet}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(s.date_debut).toLocaleDateString(dateLocale)}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {s.mentor_prenom || '?'} → {s.mentore_prenom || '?'}</span>
                  </div>
                </div>
                {statusBadge(s.statut)}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>{t('admin.sessions_no_results')}</p>}
        </div>
      </div>
    </div>
  );
}