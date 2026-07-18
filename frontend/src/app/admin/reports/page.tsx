'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, FileText, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import AdminGlobalStyles from '@/components/admin/AdminGlobalStyles';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import { AdminSkeletonRows } from '@/components/admin/AdminSkeleton';

// Signature accent — amber → orange, the "archive" glow
const ACCENT = '#F59E0B';
const ACCENT_2 = '#FB923C';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [rapports, setRapports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

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
    setDownloadingId(sessionId);
    try {
      const res = await api.get(`/rapports/session/${sessionId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `rapport_${sessionId}.pdf`;
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
      setDoneId(sessionId);
      setTimeout(() => setDoneId(null), 1600);
    } catch { toast.error(t('admin.reports_download_error')); }
    finally { setDownloadingId(null); }
  };

  const filtered = rapports.filter((r: any) => {
    const q = search.toLowerCase();
    return (r.session_sujet || '').toLowerCase().includes(q) || (r.session_id || '').toLowerCase().includes(q);
  });

  const dateLocale = language === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <div className="min-h-screen rz-scope" style={{ backgroundColor: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <AdminGlobalStyles />
      <style>{`
        .rz-scope { --rz-a: ${ACCENT}; --rz-a2: ${ACCENT_2}; }
        .rz-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.24; pointer-events: none; z-index: 0; }
        .rz-orb1 { width: 440px; height: 440px; top: -180px; right: -120px; background: radial-gradient(circle, var(--rz-a), transparent 70%); animation: rzFloat 25s ease-in-out infinite; }
        .rz-orb2 { width: 360px; height: 360px; bottom: -150px; left: -100px; background: radial-gradient(circle, var(--rz-a2), transparent 70%); animation: rzFloat 21s ease-in-out infinite reverse; }
        @keyframes rzFloat { 0%,100% { transform: translate(0,0); } 50% { transform: translate(35px,-35px) scale(1.08); } }
        @media (prefers-reduced-motion: reduce) { .rz-orb1,.rz-orb2,.rz-card,.rz-dl-ring { animation: none !important; } }

        .rz-panel { position: relative; z-index: 1; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: color-mix(in srgb, var(--card-bg) 88%, transparent); border: 1px solid var(--border); border-radius: 20px; }

        .rz-search { transition: box-shadow .25s ease, border-color .25s ease; }
        .rz-search:focus-within { border-color: var(--rz-a) !important; box-shadow: 0 0 0 4px color-mix(in srgb, var(--rz-a) 18%, transparent); }

        .rz-card { opacity: 0; transform: translateY(16px) scale(.98); animation: rzCardIn .5s cubic-bezier(.22,1,.36,1) forwards; animation-delay: calc(var(--i) * 55ms); transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease, border-color .25s ease; }
        @keyframes rzCardIn { to { opacity: 1; transform: translateY(0) scale(1); } }
        .rz-card:hover { transform: translateY(-4px) rotate(-0.2deg); box-shadow: 0 16px 34px -16px color-mix(in srgb, var(--rz-a) 55%, transparent); border-color: color-mix(in srgb, var(--rz-a) 40%, var(--border)) !important; }

        .rz-icon-box { transition: transform .3s cubic-bezier(.34,1.56,.64,1); }
        .rz-card:hover .rz-icon-box { transform: rotate(-6deg) scale(1.06); }

        .rz-dl-btn { position: relative; overflow: hidden; transition: transform .2s ease, box-shadow .2s ease; }
        .rz-dl-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 18px -8px color-mix(in srgb, var(--rz-a) 60%, transparent); }
        .rz-dl-btn:active { transform: translateY(0) scale(.97); }
        .rz-dl-ring { animation: rzSpin .9s linear infinite; }
        @keyframes rzSpin { to { transform: rotate(360deg); } }

        .rz-count-badge { position: relative; overflow: hidden; }
        .rz-count-badge::after { content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent); transform: translateX(-100%); animation: rzShine 4s ease-in-out infinite; }
        @keyframes rzShine { 0%,80%,100% { transform: translateX(-100%); } 90% { transform: translateX(150%); } }
      `}</style>

      <div className="rz-orb rz-orb1" />
      <div className="rz-orb rz-orb2" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <AdminHeader
          eyebrow={t('admin.badge')}
          title={t('admin.reports_title')}
          subtitle={t('admin.reports_subtitle')}
          accent={ACCENT}
          icon={<FileText size={16} style={{ color: ACCENT }} />}
          right={
            <span
              className="rz-count-badge admin-mono text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(251,146,60,0.18))', color: ACCENT, border: '1px solid rgba(245,158,11,0.25)' }}
            >
              {rapports.length} {t('reports.title').toLowerCase()}
            </span>
          }
        />

        <div className="max-w-6xl mx-auto px-6 -mt-6 relative pb-12">
          <div className="rz-panel p-4 mb-6">
            <div className="rz-search relative rounded-[10px] border" style={{ borderColor: 'var(--border)' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text" placeholder={t('admin.reports_search_placeholder')} value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>

          {loading ? (
            <AdminSkeletonRows count={6} />
          ) : filtered.length === 0 ? (
            <div className="rz-panel">
              <AdminEmptyState
                icon={<FileText size={26} />}
                title={t('admin.reports_no_results')}
                description={t('admin.reports_empty_desc')}
                accent={ACCENT}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r: any, i: number) => {
                const isDownloading = downloadingId === r.session_id;
                const isDone = doneId === r.session_id;
                return (
                  <div
                    key={r.id}
                    className="rz-card rz-panel p-5 flex items-center justify-between flex-wrap gap-3"
                    style={{ ['--i' as any]: i }}
                  >
                    <div className="flex items-center gap-3 pl-1">
                      <div className="rz-icon-box" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245,158,11,0.16), rgba(251,146,60,0.10))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} style={{ color: ACCENT }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{r.session_sujet || t('admin.reports_untitled')}</p>
                        <p className="admin-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {t('admin.reports_session_label')}: {r.session_id?.substring(0, 8)}... • {new Date(r.genere_le).toLocaleDateString(dateLocale)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadRapport(r.session_id)}
                      disabled={isDownloading}
                      className="rz-dl-btn admin-focus"
                      style={{
                        padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        backgroundColor: isDone ? 'var(--success-soft)' : 'rgba(245,158,11,0.12)',
                        color: isDone ? 'var(--success)' : ACCENT,
                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem',
                        opacity: isDownloading ? 0.75 : 1,
                      }}
                    >
                      {isDone ? <Check size={16} /> : isDownloading ? <RefreshRing /> : <Download size={16} />}
                      {t('reports.download')}
                    </button>
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

function RefreshRing() {
  return (
    <span
      className="rz-dl-ring"
      style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', display: 'inline-block' }}
    />
  );
}