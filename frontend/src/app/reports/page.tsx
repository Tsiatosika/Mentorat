'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, Calendar, User, Search, ArrowLeft, Plus, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sessionAPI, rapportAPI } from '@/services/api';
import toast from 'react-hot-toast';

const ACCENT = '#6366F1';
const ACCENT_2 = '#8B5CF6';

function ReportsContent() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams?.get('sessionId') || null;

  const [sessions, setSessions] = useState<any[]>([]);
  const [rapports, setRapports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchSessions();
    if (sessionIdFromUrl) { loadRapportsForSession(sessionIdFromUrl); }
  }, [user, router, sessionIdFromUrl]);

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getAll();
      setSessions(response.data.sessions || []);
    } catch (error) { console.error('Erreur fetchSessions:', error); toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  const loadRapportsForSession = async (sessionId: string) => {
    try {
      const response = await rapportAPI.getSessionRapports(sessionId);
      if (response.data.success) { setRapports(response.data.rapports || []); }
    } catch (error: any) {
      console.error('Erreur loadRapportsForSession:', error);
      if (error.response?.status !== 404) { toast.error(t('common.error')); }
      setRapports([]);
    }
  };

  const handleGenerateRapport = async (sessionId: string) => {
    setGenerating(sessionId);
    try {
      toast.loading(t('reports.generating'), { id: 'report-generate' });
      const response = await rapportAPI.generateSession(sessionId);
      if (response.data.success) { toast.success(t('reports.generated'), { id: 'report-generate' }); await loadRapportsForSession(sessionId); }
      else { toast.error(response.data.message || t('common.error'), { id: 'report-generate' }); }
    } catch (error: any) { toast.error(error.response?.data?.message || t('common.error'), { id: 'report-generate' }); }
    finally { setGenerating(null); }
  };

  const handleDownloadRapport = async (sessionId: string) => {
    setDownloadingId(sessionId);
    try {
      toast.loading(t('reports.downloading'), { id: 'report-download' });
      const downloadResponse = await rapportAPI.downloadRapport(sessionId);
      const blob = new Blob([downloadResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `rapport_session_${sessionId}.pdf`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success(t('reports.downloaded'), { id: 'report-download' });
    } catch (error: any) { toast.error(error.response?.data?.message || t('common.error'), { id: 'report-download' }); }
    finally { setTimeout(() => setDownloadingId(null), 800); }
  };

  const formatDateBadge = (date: string) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const sessionsTerminees = sessions.filter(s => s.statut === 'terminee');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessionsTerminees;
    return sessionsTerminees.filter((s) => {
      const author = (s.mentor_prenom || s.mentore_prenom || '') + ' ' + (s.mentor_nom || s.mentore_nom || '');
      return s.sujet?.toLowerCase().includes(q) || author.toLowerCase().includes(q);
    });
  }, [sessions, search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 rounded-full animate-spin mx-auto" style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }} />
      </div>
    );
  }

  // ═══ VUE DÉTAIL ═══
  if (sessionIdFromUrl) {
    const session = sessions.find(s => s.id === sessionIdFromUrl);
    const hasRapports = rapports.length > 0;
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="reports-orb reports-orb-1" style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }} />
          <div className="reports-orb reports-orb-2" style={{ background: `radial-gradient(circle, ${ACCENT_2}, transparent 70%)` }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8">
          <Link href="/reports" className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-all hover-back-link" style={{ color: 'var(--accent)' }}>
            <ArrowLeft className="w-4 h-4" />
            {t('reports.back_to_reports')}
          </Link>

          <div className="mb-8 p-6 rounded-2xl report-detail-card" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center report-detail-icon" style={{ background: `linear-gradient(135deg, ${ACCENT}22, ${ACCENT_2}22)` }}>
                  <FileText className="w-5 h-5" style={{ color: ACCENT }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{session?.sujet || t('reports.session_report')}</h1>
                  {session && (
                    <div className="flex items-center gap-3 mt-0.5 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDateBadge(session.date_debut)}</span>
                      {(session.mentor_prenom || session.mentore_prenom) && (
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />
                          {session.mentor_prenom ? `${session.mentor_prenom} ${session.mentor_nom ?? ''}` : `${session.mentore_prenom ?? ''} ${session.mentore_nom ?? ''}`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Session terminée
              </span>
            </div>
            {session?.description && <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{session.description}</p>}
          </div>

          {!hasRapports ? (
            <div className="text-center py-14 px-6 rounded-2xl report-empty-card" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 report-empty-icon" style={{ background: `linear-gradient(135deg, ${ACCENT}22, ${ACCENT_2}22)` }}>
                <Sparkles className="w-9 h-9" style={{ color: ACCENT }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t('reports.no_reports_yet')}</h3>
              <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>{t('reports.no_reports_desc')}</p>
              <button onClick={() => handleGenerateRapport(sessionIdFromUrl)} disabled={generating === sessionIdFromUrl} className="px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 hover-generate-btn" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`, color: '#FFFFFF' }}>
                {generating === sessionIdFromUrl ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />{t('reports.generating')}</span>
                ) : (
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4" />{t('reports.generate_report')}</span>
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('reports.existing_reports')} ({rapports.length})</h2>
                <button onClick={() => handleGenerateRapport(sessionIdFromUrl)} disabled={generating === sessionIdFromUrl} className="px-4 py-2 rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center gap-2 hover-regenerate-btn" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {generating === sessionIdFromUrl ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  {t('reports.regenerate')}
                </button>
              </div>
              <div className="space-y-4">
                {rapports.map((rapport) => (
                  <div key={rapport.id} className="rounded-xl overflow-hidden report-file-card" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                    {/* Aperçu miniature façon page PDF */}
                    <div className="flex items-stretch">
                      <div className="w-20 flex-shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${ACCENT}18, ${ACCENT_2}10)`, borderRight: '1px solid var(--border)' }}>
                        <div className="w-11 h-14 rounded-sm relative" style={{ backgroundColor: 'var(--card-bg)', border: `1.5px solid ${ACCENT}55`, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                          <div className="absolute top-1.5 left-1.5 right-1.5 h-1 rounded-full" style={{ backgroundColor: `${ACCENT}55` }} />
                          <div className="absolute top-3.5 left-1.5 right-2.5 h-0.5 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                          <div className="absolute top-5 left-1.5 right-3.5 h-0.5 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                          <div className="absolute top-6.5 left-1.5 right-2 h-0.5 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                        </div>
                      </div>
                      <div className="flex-1 p-5 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('reports.report')} PDF</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {new Date(rapport.genere_le).toLocaleString(language==='fr'?'fr-FR':'en-GB',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownloadRapport(sessionIdFromUrl)}
                          disabled={downloadingId === sessionIdFromUrl}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover-download-btn"
                          style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}
                        >
                          {downloadingId === sessionIdFromUrl ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                          {t('reports.download')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══ VUE LISTE ═══
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="reports-orb reports-orb-1" style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }} />
        <div className="reports-orb reports-orb-2" style={{ background: `radial-gradient(circle, ${ACCENT_2}, transparent 70%)` }} />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="mb-8 fade-in-up flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} style={{ color: ACCENT }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: ACCENT }}>Comptes-rendus</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 hover-gradient-text" style={{ color: 'var(--text-primary)' }}>{t('reports.title')}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{t('reports.subtitle')}</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
            {sessionsTerminees.length} session{sessionsTerminees.length > 1 ? 's' : ''} terminée{sessionsTerminees.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="mb-8 fade-in-up" style={{ animationDelay: '0.08s' }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('reports.search_placeholder')} className="w-full pl-12 pr-4 py-3 rounded-xl outline-none reports-search-input" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-2xl fade-in-up" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{sessionsTerminees.length === 0 ? t('reports.no_sessions') : t('reports.no_search_results')}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{sessionsTerminees.length === 0 ? t('reports.no_sessions_desc') : t('reports.no_search_results_desc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((session, i) => {
              const authorName = session.mentor_prenom ? `${session.mentor_prenom} ${session.mentor_nom??''}`.trim() : `${session.mentore_prenom??''} ${session.mentore_nom??''}`.trim();
              const authorRole = session.mentor_prenom ? t('sessions.label_mentor') : t('sessions.label_mentee');
              const isHovered = hoveredCard === session.id;
              return (
                <div key={session.id} className="p-5 rounded-xl transition-all report-list-card fade-in-up" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderColor: isHovered ? `${ACCENT}55` : 'var(--border)', transform: isHovered ? 'translateY(-4px)' : 'translateY(0)', boxShadow: isHovered ? `0 12px 28px ${ACCENT}22` : 'var(--shadow-card)', animationDelay: `${i * 40}ms` }} onMouseEnter={() => setHoveredCard(session.id)} onMouseLeave={() => setHoveredCard(null)}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-xs px-3 py-1 rounded-full flex items-center gap-1.5" style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}>
                      <CheckCircle2 className="w-3 h-3" /> {formatDateBadge(session.date_debut)}
                    </span>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center report-list-icon" style={{ background: `linear-gradient(135deg, ${ACCENT}22, ${ACCENT_2}22)`, transform: isHovered ? 'scale(1.1) rotate(-6deg)' : 'scale(1) rotate(0deg)' }}>
                      <FileText className="w-5 h-5" style={{ color: ACCENT }} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: isHovered ? ACCENT : 'var(--text-primary)' }}>{session.sujet}</h3>
                  <div className="flex items-center gap-1.5 mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <User className="w-4 h-4" style={{ color: ACCENT }} />
                    <span>{authorRole}: {authorName}</span>
                  </div>
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{session.description || t('reports.no_summary')}</p>
                  <div style={{ borderTop: '1px solid var(--border)' }} className="pt-4 flex items-center justify-between">
                    <Link href={`/reports?sessionId=${session.id}`} className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 hover-link-arrow" style={{ color: ACCENT }}>
                      {t('reports.view_details')}<ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => handleGenerateRapport(session.id)} disabled={generating === session.id} className="p-2 rounded-lg transition-all disabled:opacity-50 hover-download-icon" style={{ color: 'var(--text-secondary)' }} title={t('reports.generate_quick')}>
                      {generating === session.id ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style jsx global>{`
        .reports-orb { position: absolute; border-radius: 9999px; filter: blur(70px); opacity: 0.3; will-change: transform; }
        .reports-orb-1 { width: 460px; height: 460px; top: -180px; right: -100px; animation: reportsFloat 24s ease-in-out infinite; }
        .reports-orb-2 { width: 360px; height: 360px; bottom: 20px; left: -100px; animation: reportsFloat 20s ease-in-out infinite reverse; }
        @keyframes reportsFloat { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,-25px) scale(1.06); } }
        .fade-in-up { opacity: 0; transform: translateY(12px); animation: reportsFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes reportsFadeUp { to { opacity: 1; transform: translateY(0); } }

        .hover-gradient-text { transition: all 0.4s ease; cursor: default; display: inline-block; }
        .hover-gradient-text:hover { background: linear-gradient(135deg,#3B82F6,#8B5CF6,#EC4899); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .hover-back-link { transition: all 0.3s ease; }
        .hover-back-link:hover { transform: translateX(-4px); }
        .reports-search-input { transition: all 0.3s ease; }
        .reports-search-input:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--accent-soft); }

        .report-detail-card { transition: all 0.35s ease; }
        .report-detail-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(0,0,0,0.1); }
        .report-detail-icon { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .report-detail-card:hover .report-detail-icon { transform: scale(1.15) rotate(-8deg); }

        .report-empty-card { transition: all 0.35s ease; }
        .report-empty-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(0,0,0,0.1); }
        .report-empty-icon { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .report-empty-card:hover .report-empty-icon { transform: scale(1.1); }
        .hover-generate-btn { transition: all 0.3s ease; }
        .hover-generate-btn:hover:not(:disabled) { transform: translateY(-3px); filter: brightness(1.1); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }

        .hover-regenerate-btn { transition: all 0.3s ease; }
        .hover-regenerate-btn:hover:not(:disabled) { transform: translateY(-2px); background-color: var(--accent) !important; color: #FFFFFF !important; }

        .report-file-card { transition: all 0.3s ease; }
        .report-file-card:hover { transform: translateX(4px); border-color: var(--accent) !important; }
        .hover-download-btn { transition: all 0.3s ease; }
        .hover-download-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

        .report-list-card { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
        .report-list-icon { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .hover-link-arrow { transition: all 0.3s ease; }
        .hover-link-arrow:hover { gap: 0.5rem; }
        .hover-download-icon { transition: all 0.3s ease; }
        .hover-download-icon:hover:not(:disabled) { background-color: var(--accent-soft); color: var(--accent); transform: translateY(-2px); }

        @media (prefers-reduced-motion:reduce) { .reports-orb,.fade-in-up{animation:none!important;transition:none!important;opacity:1!important;transform:none!important} }
      `}</style>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{backgroundColor:'var(--bg-primary)'}}><div className="w-12 h-12 rounded-full animate-spin mx-auto" style={{border:'3px solid var(--accent-soft)',borderTop:'3px solid var(--accent)'}}/></div>}>
      <ReportsContent />
    </Suspense>
  );
}