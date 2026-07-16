'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Download, FileText, Calendar, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [rapports, setRapports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    fetchRapports();
  }, [user]);

  const fetchRapports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports');
      setRapports(res.data.rapports || []);
    } catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  const downloadRapport = async (sessionId: string) => {
    try {
      const res = await api.get(`/rapports/session/${sessionId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `rapport_${sessionId}.pdf`;
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch { toast.error(t('admin.reports_download_error')); }
  };

  const filtered = rapports.filter((r: any) => {
    const q = search.toLowerCase();
    return (r.session_sujet || '').toLowerCase().includes(q) || (r.session_id || '').toLowerCase().includes(q);
  });

  const dateLocale = language === 'fr' ? 'fr-FR' : 'en-US';

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}><div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }} /></div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A5F, #3B82F6)', padding: '32px 24px' }}>
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white mb-4"><ArrowLeft size={16} /> {t('common.back')}</Link>
          <h1 className="text-3xl font-bold text-white">{t('admin.reports_title')}</h1>
          <p className="text-blue-200 mt-1">{t('admin.reports_subtitle')}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-6 relative z-20 pb-12">
        <div className="card p-4 mb-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <div className="relative">
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input type="text" placeholder={t('admin.reports_search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((r: any) => (
            <div key={r.id} className="card p-5 flex items-center justify-between flex-wrap gap-3" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px' }}>
              <div className="flex items-center gap-3">
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{r.session_sujet || t('admin.reports_untitled')}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {t('admin.reports_session_label')}: {r.session_id?.substring(0, 8)}... • {new Date(r.genere_le).toLocaleDateString(dateLocale)}
                  </p>
                </div>
              </div>
              <button onClick={() => downloadRapport(r.session_id)} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Download size={16} /> {t('reports.download')}
              </button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>{t('admin.reports_no_results')}</p>}
        </div>
      </div>
    </div>
  );
}