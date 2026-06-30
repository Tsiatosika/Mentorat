'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, Calendar, User, Search, ArrowLeft, Plus, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sessionAPI, rapportAPI } from '@/services/api';
import toast from 'react-hot-toast';

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
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSessions();
    if (sessionIdFromUrl) {
      loadRapportsForSession(sessionIdFromUrl);
    }
  }, [user, router, sessionIdFromUrl]);

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getAll();
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Erreur fetchSessions:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadRapportsForSession = async (sessionId: string) => {
    try {
      const response = await rapportAPI.getSessionRapports(sessionId);
      if (response.data.success) {
        setRapports(response.data.rapports || []);
      }
    } catch (error: any) {
      console.error('Erreur loadRapportsForSession:', error);
      // Si 404, c'est normal s'il n'y a pas encore de rapport
      if (error.response?.status !== 404) {
        toast.error(t('common.error'));
      }
      setRapports([]);
    }
  };

  const handleGenerateRapport = async (sessionId: string) => {
    setGenerating(sessionId);
    try {
      toast.loading(t('reports.generating'), { id: 'report-generate' });
      
      const response = await rapportAPI.generateSession(sessionId);
      
      if (response.data.success) {
        toast.success(t('reports.generated'), { id: 'report-generate' });
        // Recharger la liste des rapports
        await loadRapportsForSession(sessionId);
      } else {
        toast.error(response.data.message || t('common.error'), { id: 'report-generate' });
      }
    } catch (error: any) {
      console.error('Erreur generateRapport:', error);
      toast.error(
        error.response?.data?.message || t('common.error'), 
        { id: 'report-generate' }
      );
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadRapport = async (sessionId: string) => {
    try {
      toast.loading(t('reports.downloading'), { id: 'report-download' });
      
      const downloadResponse = await rapportAPI.downloadRapport(sessionId);
      
      const blob = new Blob([downloadResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_session_${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(t('reports.downloaded'), { id: 'report-download' });
    } catch (error: any) {
      console.error('Erreur downloadRapport:', error);
      toast.error(
        error.response?.data?.message || t('common.error'), 
        { id: 'report-download' }
      );
    }
  };

  const formatDateBadge = (date: string) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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
        <div className="w-12 h-12 rounded-full animate-spin mx-auto"
          style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }} />
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // VUE DÉTAIL : Rapports d'une session
  // ═══════════════════════════════════════════
  if (sessionIdFromUrl) {
    const session = sessions.find(s => s.id === sessionIdFromUrl);
    const hasRapports = rapports.length > 0;
    
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Fond animé */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="reports-orb reports-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
          <div className="reports-orb reports-orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8">
          {/* Retour */}
          <Link 
            href="/reports"
            className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--accent)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back_to_reports')}
          </Link>

          {/* Infos de la session */}
          <div className="mb-8 p-6 rounded-2xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-soft)' }}>
                <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {session?.sujet || t('reports.session_report')}
                </h1>
                {session && (
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {formatDateBadge(session.date_debut)}
                  </p>
                )}
              </div>
            </div>
            {session?.description && (
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                {session.description}
              </p>
            )}
          </div>

          {/* Section : Générer un rapport */}
          {!hasRapports ? (
            <div className="text-center py-12 px-6 rounded-2xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--accent-soft)' }}>
                <Plus className="w-10 h-10" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('reports.no_reports_yet')}
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {t('reports.no_reports_desc')}
              </p>
              <button
                onClick={() => handleGenerateRapport(sessionIdFromUrl)}
                disabled={generating === sessionIdFromUrl}
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
              >
                {generating === sessionIdFromUrl ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t('reports.generating')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t('reports.generate_report')}
                  </span>
                )}
              </button>
            </div>
          ) : (
            /* Section : Rapports existants */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {t('reports.existing_reports')} ({rapports.length})
                </h2>
                <button
                  onClick={() => handleGenerateRapport(sessionIdFromUrl)}
                  disabled={generating === sessionIdFromUrl}
                  className="px-4 py-2 rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {generating === sessionIdFromUrl ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {t('reports.regenerate')}
                </button>
              </div>

              <div className="space-y-4">
                {rapports.map((rapport) => (
                  <div 
                    key={rapport.id}
                    className="p-5 rounded-xl transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--success-soft)' }}>
                          <FileText className="w-5 h-5" style={{ color: 'var(--success)' }} />
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {t('reports.report')} PDF
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {new Date(rapport.genere_le).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-GB', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadRapport(sessionIdFromUrl)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:opacity-80"
                        style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}
                      >
                        <Download className="w-4 h-4" />
                        {t('reports.download')}
                      </button>
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

  // ═══════════════════════════════════════════
  // VUE LISTE : Toutes les sessions terminées
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Fond animé */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="reports-orb reports-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
        <div className="reports-orb reports-orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('reports.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {t('reports.subtitle')}
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('reports.search_placeholder')}
              className="w-full pl-12 pr-4 py-3 rounded-xl outline-none"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Liste des sessions terminées */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-2xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {sessionsTerminees.length === 0 ? t('reports.no_sessions') : t('reports.no_search_results')}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {sessionsTerminees.length === 0 ? t('reports.no_sessions_desc') : t('reports.no_search_results_desc')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((session) => {
              const authorName = session.mentor_prenom
                ? `${session.mentor_prenom} ${session.mentor_nom ?? ''}`.trim()
                : `${session.mentore_prenom ?? ''} ${session.mentore_nom ?? ''}`.trim();
              const authorRole = session.mentor_prenom ? t('sessions.label_mentor') : t('sessions.label_mentee');

              return (
                <div
                  key={session.id}
                  className="p-5 rounded-xl transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                      {formatDateBadge(session.date_debut)}
                    </span>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-soft)' }}>
                      <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {session.sujet}
                  </h3>

                  <div className="flex items-center gap-1.5 mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <User className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    <span>{authorRole}: {authorName}</span>
                  </div>

                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {session.description || t('reports.no_summary')}
                  </p>

                  <div style={{ borderTop: '1px solid var(--border)' }} className="pt-4 flex items-center justify-between">
                    <Link
                      href={`/reports?sessionId=${session.id}`}
                      className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-80"
                      style={{ color: 'var(--accent)' }}
                    >
                      {t('reports.view_details')}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleGenerateRapport(session.id)}
                      disabled={generating === session.id}
                      className="p-2 rounded-lg transition-all disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800"
                      style={{ color: 'var(--text-secondary)' }}
                      title={t('reports.generate_quick')}
                    >
                      {generating === session.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        .reports-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(70px);
          opacity: 0.4;
          will-change: transform;
        }
        .reports-orb-1 { width: 460px; height: 460px; top: -180px; right: -100px; }
        .reports-orb-2 { width: 360px; height: 360px; bottom: 20px; left: -100px; }

        @media (prefers-reduced-motion: reduce) {
          .reports-orb {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

// Wrapper avec Suspense (obligatoire pour useSearchParams)
export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 rounded-full animate-spin mx-auto"
          style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }} />
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}