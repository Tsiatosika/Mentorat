'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Calendar, User, Search, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sessionAPI, rapportAPI, BACKEND_URL } from '@/services/api';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
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
  }, [user, router]);

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getAll();
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAndDownload = async (sessionId: string) => {
    setGenerating(sessionId);
    try {
      toast.loading(t('reports.generating'), { id: 'report' });
      const response = await rapportAPI.generateSession(sessionId);
      if (response.data.success) {
        const fileUrl = response.data.rapport.url;
        const fullUrl = `${BACKEND_URL}${fileUrl}`;
        const downloadResponse = await fetch(fullUrl);
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_session_${sessionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(t('reports.downloaded'), { id: 'report' });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('common.error'), { id: 'report' });
    } finally {
      setGenerating(null);
    }
  };

  const formatDateBadge = (date: string) => {
    // Format type "2026-06-25" comme dans la maquette
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="reports-page min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* ── Fond animé : orbes + particules, même esprit que Sessions ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="reports-orb reports-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
        <div className="reports-orb reports-orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
        {mounted && [...Array(14)].map((_, i) => (
          <div key={i} className="absolute rounded-full reports-particle"
            style={{
              width: Math.random() * 3 + 1, height: Math.random() * 3 + 1,
              top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
              backgroundColor: i % 2 === 0 ? 'var(--accent)' : 'var(--info)',
              opacity: Math.random() * 0.4 + 0.15,
              animationDelay: `${Math.random() * 3}s`, animationDuration: `${Math.random() * 2 + 2}s`,
            }} />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8">

        {/* ── Header imposant, façon maquette ── */}
        <div className="mb-8 fade-in-up">
          <h1
            className="font-display text-4xl md:text-5xl font-bold mb-3 shimmer-text"
            style={{ lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            {t('reports.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {t('reports.subtitle')}
          </p>
        </div>

        {/* ── Barre de recherche ── */}
        <div className="mb-8 fade-in-up" style={{ animationDelay: '0.08s' }}>
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('reports.search_placeholder')}
              className="reports-search-input w-full pl-12 pr-4 py-4 rounded-2xl outline-none text-base"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-card)',
              }}
            />
          </div>
        </div>

        {/* ── Liste / état vide ── */}
        {filtered.length === 0 ? (
          <div className="card p-12 text-center fade-in-up" style={{ animationDelay: '0.14s' }}>
            <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {sessionsTerminees.length === 0 ? t('reports.no_sessions') : t('reports.no_search_results')}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {sessionsTerminees.length === 0 ? t('reports.no_sessions_desc') : t('reports.no_search_results_desc')}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((session, idx) => {
              const authorName = session.mentor_prenom
                ? `${session.mentor_prenom} ${session.mentor_nom ?? ''}`.trim()
                : `${session.mentore_prenom ?? ''} ${session.mentore_nom ?? ''}`.trim();
              const authorRole = session.mentor_prenom ? t('sessions.label_mentor') : t('sessions.label_mentee');

              return (
                <div
                  key={session.id}
                  className="report-card-in card report-card relative p-6"
                  style={{ animationDelay: `${0.16 + idx * 0.07}s` }}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <span
                      className="font-mono-data text-xs px-3 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
                    >
                      {formatDateBadge(session.date_debut)}
                    </span>
                    <div
                      className="report-icon-pop w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--accent-soft)' }}
                    >
                      <FileText className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} />
                    </div>
                  </div>

                  <h3 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {session.sujet}
                  </h3>

                  <div className="flex items-center gap-1.5 mb-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    <User className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    {t('reports.by_author').replace('{role}', authorRole).replace('{name}', authorName)}
                  </div>

                  <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
                    {session.description || t('reports.no_summary')}
                  </p>

                  <div style={{ borderTop: '1px solid var(--border)' }} className="pt-4 flex items-center justify-between">
                    <button
                      onClick={() => generateAndDownload(session.id)}
                      disabled={generating === session.id}
                      className="report-link-btn flex items-center gap-1.5 text-sm font-semibold disabled:opacity-50"
                      style={{ color: 'var(--accent)' }}
                    >
                      {t('reports.view_full')}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => generateAndDownload(session.id)}
                      disabled={generating === session.id}
                      className="report-download-icon-btn p-2 rounded-lg disabled:opacity-50"
                      style={{ color: 'var(--text-secondary)' }}
                      title={t('reports.download')}
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
          opacity: 0.5;
          will-change: transform;
        }
        .reports-orb-1 { width: 460px; height: 460px; top: -180px; right: -100px; animation: reportsFloat1 24s ease-in-out infinite; }
        .reports-orb-2 { width: 360px; height: 360px; bottom: 20px; left: -100px; animation: reportsFloat2 28s ease-in-out infinite; }

        @keyframes reportsFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 25px) scale(1.07); }
        }
        @keyframes reportsFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -20px) scale(1.05); }
        }

        .reports-particle {
          animation: reportsParticlePulse ease-in-out infinite;
        }
        @keyframes reportsParticlePulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.5; }
        }

        .fade-in-up {
          opacity: 0;
          transform: translateY(14px);
          animation: reportsFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes reportsFadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .shimmer-text {
          background-image: linear-gradient(100deg, var(--text-primary) 40%, var(--accent) 50%, var(--text-primary) 60%);
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: reportsShimmer 5s ease-in-out 1s infinite;
        }
        @keyframes reportsShimmer {
          0%   { background-position: 100% 0; }
          50%  { background-position: 0% 0; }
          100% { background-position: 100% 0; }
        }

        .reports-search-input {
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .reports-search-input:focus {
          border-color: var(--accent) !important;
        }

        .report-card-in {
          opacity: 0;
          transform: translateY(18px);
          animation: reportsCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes reportsCardIn {
          to { opacity: 1; transform: translateY(0); }
        }

        .report-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .report-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-card-hover);
        }

        .report-icon-pop {
          opacity: 0;
          transform: scale(0.6) rotate(-8deg);
          animation: reportsIconPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
        }
        @keyframes reportsIconPop {
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        .report-link-btn {
          transition: gap 0.2s ease, opacity 0.2s ease;
        }
        .report-link-btn:hover:not(:disabled) {
          gap: 0.5rem;
          opacity: 0.8;
        }

        .report-download-icon-btn {
          transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .report-download-icon-btn:hover:not(:disabled) {
          background-color: var(--accent-soft);
          color: var(--accent);
          transform: translateY(-1px);
        }

        @media (prefers-reduced-motion: reduce) {
          .reports-orb, .reports-particle, .fade-in-up, .shimmer-text,
          .report-card-in, .report-icon-pop {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .shimmer-text {
            background: none;
            -webkit-text-fill-color: var(--text-primary);
            color: var(--text-primary);
          }
        }
      `}</style>
    </div>
  );
}