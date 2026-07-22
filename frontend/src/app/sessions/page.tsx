'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, Video, CheckCircle, XCircle,
  MessageCircle, FileText, Play, Star, Plus, StopCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sessionAPI, avisAPI } from '@/services/api';
import { ReviewModal } from '@/components/sessions/ReviewModal';
import toast from 'react-hot-toast';

interface Session {
  id: string; sujet: string; description: string;
  date_debut: string; date_fin: string;
  statut: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';
  lien_visio: string | null;
  mentor_nom?: string; mentor_prenom?: string;
  mentore_nom?: string; mentore_prenom?: string;
  mentor_id?: string;
}

export default function SessionsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [sessions,    setSessions]    = useState<Session[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('tous');
  const [reviewed,    setReviewed]    = useState<Set<string>>(new Set());
  const [reviewModal, setReviewModal] = useState<{ sessionId: string; mentorName: string } | null>(null);
  const [mounted,     setMounted]     = useState(false);

  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';

  const STATUS: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    en_attente: { label: t('sessions.pending'),     color: 'var(--warm)',    bg: 'var(--warm-soft)',    border: 'var(--border)', icon: Clock       },
    confirmee:  { label: t('sessions.confirmed'),   color: 'var(--info)',    bg: 'var(--info-soft)',    border: 'var(--border)', icon: CheckCircle },
    en_cours:   { label: t('sessions.in_progress'), color: 'var(--success)', bg: 'var(--success-soft)', border: 'var(--border)', icon: Play        },
    terminee:   { label: t('sessions.completed'),   color: 'var(--success)', bg: 'var(--success-soft)', border: 'var(--border)', icon: CheckCircle },
    annulee:    { label: t('sessions.cancelled'),   color: 'var(--danger)',  bg: 'var(--danger-soft)',  border: 'var(--border)', icon: XCircle     },
  };

  const FILTERS = [
    { key: 'tous',       label: t('sessions.all')         },
    { key: 'confirmee',  label: t('sessions.upcoming')    },
    { key: 'en_attente', label: t('sessions.pending')     },
    { key: 'en_cours',   label: t('sessions.in_progress') },
    { key: 'terminee',   label: t('sessions.history')     },
    { key: 'annulee',    label: t('sessions.cancelled')   },
  ];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    load();
  }, [user]);

  const load = async () => {
    try {
      const r = await sessionAPI.getAll();
      setSessions(r.data.sessions || []);
      if (user?.role === 'mentore') {
        const noted = await avisAPI.getMesSessionsNotees().catch(() => ({ data: { sessionIds: [] } }));
        setReviewed(new Set(noted.data.sessionIds || []));
      }
    } catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  const handleConfirm = async (id: string) => {
    try { await sessionAPI.confirm(id); toast.success(t('sessions.confirmed')); load(); }
    catch { toast.error(t('common.error')); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm(t('sessions.cancel_confirm'))) return;
    try { await sessionAPI.cancel(id); toast.success(t('sessions.cancelled')); load(); }
    catch { toast.error(t('common.error')); }
  };

  const handleStart = async (id: string) => {
    try { await sessionAPI.start(id); toast.success(t('sessions.started')); load(); }
    catch { toast.error(t('common.error')); }
  };

  // ═══ TERMINER UNE SESSION ═══
  const handleComplete = async (id: string) => {
    if (!confirm('Terminer cette session ? Le mentoré pourra ensuite vous évaluer.')) return;
    try { 
      await sessionAPI.complete(id, {}); 
      toast.success('Session terminée !'); 
      load(); 
    }
    catch { toast.error(t('common.error')); }
  };

  const counts = Object.fromEntries(
    ['tous', ...Object.keys(STATUS)].map(k => [k, k === 'tous' ? sessions.length : sessions.filter(s => s.statut === k).length])
  );

  const getFilteredSessions = () => {
    if (filter === 'tous') return sessions;
    if (filter === 'confirmee') return sessions.filter(s => s.statut === 'confirmee' || s.statut === 'en_cours');
    return sessions.filter(s => s.statut === filter);
  };

  const filtered = getFilteredSessions();

  const fmt = (d: string) => new Date(d).toLocaleString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).replace(',', ' @');

  const other = (s: Session) =>
    user?.role === 'mentor'
      ? `${s.mentore_prenom ?? ''} ${s.mentore_nom ?? ''}`.trim()
      : `${s.mentor_prenom ?? ''} ${s.mentor_nom ?? ''}`.trim();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="w-12 h-12 rounded-full animate-spin mx-auto mb-4" style={{ border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sessions-page min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="sessions-orb sessions-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
        <div className="sessions-orb sessions-orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
        {mounted && [...Array(10)].map((_, i) => (
          <div key={i} className="absolute rounded-full sessions-particle"
            style={{
              width: Math.random() * 3 + 1, height: Math.random() * 3 + 1,
              top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
              backgroundColor: i % 2 === 0 ? 'var(--accent)' : 'var(--info)',
              opacity: Math.random() * 0.4 + 0.15,
              animationDelay: `${Math.random() * 3}s`, animationDuration: `${Math.random() * 2 + 2}s`,
            }} />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10 fade-in-up">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
                  {t('sessions.subtitle')}
                </p>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-semibold mb-3 shimmer-text" style={{ lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {t('sessions.title')}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{t('sessions.page_description')}</p>
            </div>

            {user?.role === 'mentore' && (
              <Link href="/mentors" className="sessions-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}>
                <Plus className="w-4 h-4" /> {t('sessions.new_session')}
              </Link>
            )}
          </div>

          <div className="flex gap-3 mt-6 flex-wrap">
            {[
              { label: t('sessions.in_progress'), val: counts.en_cours, color: 'var(--success)' },
              { label: t('sessions.upcoming'),    val: counts.confirmee, color: 'var(--info)' },
              { label: t('sessions.total'),       val: counts.tous,     color: 'var(--text-secondary)' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg stat-chip-in" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', animationDelay: `${0.1 + i * 0.06}s` }}>
                <span className="text-xl font-bold font-mono-data" style={{ color: stat.color }}>{stat.val}</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-8 fade-in-up" style={{ animationDelay: '0.12s' }}>
          <div className="flex gap-1 p-1 rounded-2xl flex-wrap" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'inline-flex' }}>
            {FILTERS.map(f => {
              const cnt = f.key === 'confirmee' ? counts.confirmee + counts.en_cours : counts[f.key] ?? 0;
              const active = filter === f.key;
              return (
                <button key={f.key} onClick={() => setFilter(f.key)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={active ? { backgroundColor: 'var(--accent)', color: '#FFFFFF' } : { color: 'var(--text-secondary)', backgroundColor: 'transparent' }}>
                  {f.label}
                  {cnt > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'var(--accent-soft)', color: active ? '#FFFFFF' : 'var(--accent-text-on-soft)' }}>{cnt}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center fade-in-up">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--accent-soft)', border: '1px solid var(--border)' }}>
              <Calendar className="w-8 h-8" style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t('sessions.empty_title')}</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>{user?.role === 'mentore' ? t('sessions.empty_mentee') : t('sessions.empty_mentor')}</p>
            {user?.role === 'mentore' && (
              <Link href="/mentors" className="px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}>{t('sessions.explore_mentors')}</Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((s, idx) => {
              const isMentor   = user?.role === 'mentor';
              const isMentore  = user?.role === 'mentore';
              const st         = STATUS[s.statut] || STATUS.en_attente;
              const Icon       = st.icon;
              const otherName  = other(s);
              const canReview  = isMentore && s.statut === 'terminee' && !reviewed.has(s.id);
              const hasReviewed= isMentore && s.statut === 'terminee' && reviewed.has(s.id);
              const isActive   = s.statut === 'en_cours';

              return (
                <div key={s.id} className="session-card-in group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                  style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', animationDelay: `${idx * 60}ms` }}>
                  
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl session-active-bar" style={{ backgroundColor: 'var(--success)' }} />}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${st.bg} 0%, transparent 70%)` }} />

                  <div className="relative flex flex-wrap items-start gap-4 p-5">
                    <div className="rounded-xl p-3 flex-shrink-0" style={{ backgroundColor: st.bg, border: '1px solid var(--border)' }}>
                      <Calendar className="w-5 h-5" style={{ color: st.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                          {(isMentor ? t('sessions.label_mentee') : t('sessions.label_mentor')).toUpperCase()} : {otherName.toUpperCase()}
                        </span>
                        <span style={{ color: 'var(--text-tertiary)' }}>●</span>
                        <span className="text-xs font-mono-data" style={{ color: 'var(--text-tertiary)' }}>🕐 {fmt(s.date_debut)}</span>
                        {hasReviewed && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--warm-soft)', color: 'var(--warm-text-on-soft)', border: '1px solid var(--border)' }}>
                            <Star className="w-3 h-3 fill-current" /> {t('sessions.reviewed')}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-1.5 leading-tight font-display" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{s.sujet}</h3>
                      {s.description && <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{s.description}</p>}
                    </div>

                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: st.bg, border: '1px solid var(--border)', color: st.color }}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{st.label}</span>
                      </div>

                      <div className="flex gap-2 flex-wrap justify-end">
                        {/* Confirmer */}
                        {s.statut === 'en_attente' && isMentor && (
                          <button onClick={() => handleConfirm(s.id)} className="session-action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)', border: '1px solid var(--border)' }}>
                            <CheckCircle className="w-3.5 h-3.5" /> {t('sessions.confirm')}
                          </button>
                        )}
                        {/* Démarrer */}
                        {s.statut === 'confirmee' && isMentor && (
                          <button onClick={() => handleStart(s.id)} className="session-action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'var(--info-soft)', color: 'var(--info)', border: '1px solid var(--border)' }}>
                            <Play className="w-3.5 h-3.5" /> {t('sessions.start')}
                          </button>
                        )}
                        {/* ═══ TERMINER (NOUVEAU) ═══ */}
                        {s.statut === 'en_cours' && isMentor && (
                          <button onClick={() => handleComplete(s.id)} className="session-action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#10B98115', color: '#10B981', border: '1px solid #10B98130' }}>
                            <StopCircle className="w-3.5 h-3.5" /> {t('sessions.completed')}
                          </button>
                        )}
                        {/* Annuler */}
                        {(s.statut === 'en_attente' || s.statut === 'confirmee') && (
                          <button onClick={() => handleCancel(s.id)} className="session-action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid var(--border)' }}>
                            <XCircle className="w-3.5 h-3.5" /> {t('sessions.cancel')}
                          </button>
                        )}
                        {/* Visio */}
                        {s.lien_visio && (s.statut === 'confirmee' || s.statut === 'en_cours') && (
                          <a href={s.lien_visio} target="_blank" rel="noopener noreferrer" className="session-action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)', border: '1px solid var(--border)' }}>
                            <Video className="w-3.5 h-3.5" /> {t('sessions.visio')}
                          </a>
                        )}
                        {/* Noter */}
                        {canReview && (
                          <button onClick={() => setReviewModal({ sessionId: s.id, mentorName: otherName })} className="session-action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'var(--warm-soft)', color: 'var(--warm-text-on-soft)', border: '1px solid var(--border)' }}>
                            <Star className="w-3.5 h-3.5" /> {t('sessions.rate')}
                          </button>
                        )}
                        {/* Rapport */}
                        {s.statut === 'terminee' && (
                          <Link href={`/reports?sessionId=${s.id}`} className="session-action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)', border: '1px solid var(--border)' }}>
                            <FileText className="w-3.5 h-3.5" /> {t('sessions.view_report')}
                          </Link>
                        )}
                        {/* Chat */}
                        <Link href={`/chat?sessionId=${s.id}`} className="session-action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)', border: '1px solid var(--border)' }}>
                          <MessageCircle className="w-3.5 h-3.5" /> {t('sessions.chat')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewModal && (
        <ReviewModal isOpen={true} onClose={() => setReviewModal(null)} sessionId={reviewModal.sessionId} mentorName={reviewModal.mentorName} onSubmitted={() => { load(); setTimeout(() => setReviewModal(null), 1500); }} />
      )}

      <style jsx global>{`
        .sessions-orb { position: absolute; border-radius: 9999px; filter: blur(70px); opacity: 0.5; will-change: transform; }
        .sessions-orb-1 { width: 480px; height: 480px; top: -200px; right: -100px; animation: sessionsFloat1 24s ease-in-out infinite; }
        .sessions-orb-2 { width: 360px; height: 360px; bottom: 60px; left: -100px; animation: sessionsFloat2 28s ease-in-out infinite; }
        @keyframes sessionsFloat1 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(-30px,25px)scale(1.07)} }
        @keyframes sessionsFloat2 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(25px,-20px)scale(1.05)} }
        .sessions-particle { animation: sessionsParticlePulse ease-in-out infinite; }
        @keyframes sessionsParticlePulse { 0%,100%{opacity:.15} 50%{opacity:.5} }
        .fade-in-up { opacity:0; transform:translateY(14px); animation:sessionsFadeUp .5s cubic-bezier(.16,1,.3,1) forwards; }
        @keyframes sessionsFadeUp { to{opacity:1;transform:translateY(0)} }
        .shimmer-text { background-image:linear-gradient(100deg,var(--text-primary)40%,var(--accent)50%,var(--text-primary)60%); background-size:250% 100%; -webkit-background-clip:text; background-clip:text; color:transparent; animation:shimmerTextSlide 5s ease-in-out 1s infinite; }
        @keyframes shimmerTextSlide { 0%{background-position:100% 0} 50%{background-position:0% 0} 100%{background-position:100% 0} }
        .stat-chip-in { opacity:0; transform:scale(.92); animation:sessionsChipIn .4s cubic-bezier(.34,1.56,.64,1) forwards; }
        @keyframes sessionsChipIn { to{opacity:1;transform:scale(1)} }
        .session-card-in { opacity:0; transform:translateY(16px); animation:sessionsCardIn .45s cubic-bezier(.16,1,.3,1) forwards; }
        @keyframes sessionsCardIn { to{opacity:1;transform:translateY(0)} }
        .session-active-bar { animation:sessionsPulseBar 1.6s ease-in-out infinite; }
        @keyframes sessionsPulseBar { 0%,100%{opacity:1} 50%{opacity:.45} }
        .sessions-btn-primary,.session-action-btn { transition:transform .18s ease,box-shadow .18s ease,filter .18s ease; }
        .sessions-btn-primary:hover { transform:scale(1.04); filter:brightness(1.05); }
        .session-action-btn:hover { transform:scale(1.05); }
        .sessions-btn-primary:active,.session-action-btn:active { transform:scale(.96); }
        @media (prefers-reduced-motion:reduce) { .sessions-orb,.sessions-particle,.fade-in-up,.stat-chip-in,.session-card-in,.session-active-bar,.shimmer-text{animation:none!important;opacity:1!important;transform:none!important} .shimmer-text{background:none;-webkit-text-fill-color:var(--text-primary);color:var(--text-primary)} }
      `}</style>
    </div>
  );
}