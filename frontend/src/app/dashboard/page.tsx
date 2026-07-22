'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Calendar, MessageCircle, FileText, Users, TrendingUp, Clock,
  Mail, Award, ArrowRight, BookOpen, Pencil, Save, X, ChevronDown, CheckCircle
} from 'lucide-react';
import { mentorAPI, mentoreAPI, sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

/** Anime un nombre de 0 jusqu'à sa valeur finale */
function useCountUp(target: number, durationMs = 900, startWhen = true) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startWhen || startedRef.current) return;
    startedRef.current = true;
    if (!target || isNaN(target)) { setValue(target || 0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, durationMs, startWhen]);
  return value;
}

// ─── Stockage local des notes par session ───────────────────────────────────
const NOTES_KEY = 'mentoripath_session_notes';
function loadNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}'); } catch { return {}; }
}
function saveNotes(notes: Record<string, string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

// ─── Mini graphique SVG (courbe de progression) ─────────────────────────────
interface ProgressChartProps {
  sessions: any[];
  language: string;
}

function ProgressChart({ sessions, language }: ProgressChartProps) {
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';

  // On construit des points mensuels : nb de sessions terminées cumulées
  const points = useMemo(() => {
    const sorted = [...sessions]
      .filter(s => s.statut === 'terminee')
      .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime());

    if (sorted.length === 0) return [];

    // Regrouper par mois
    const byMonth: Record<string, number> = {};
    sorted.forEach(s => {
      const key = new Date(s.date_debut).toLocaleDateString(locale, { year: '2-digit', month: 'short' });
      byMonth[key] = (byMonth[key] || 0) + 1;
    });

    // Transformer en points cumulés
    let cum = 0;
    return Object.entries(byMonth).map(([label, count]) => {
      cum += count;
      return { label, cumulative: cum, count };
    });
  }, [sessions, locale]);

  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <TrendingUp className="w-10 h-10 opacity-20" style={{ color: 'var(--accent)' }} />
        <p className="text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
          {language === 'fr' ? 'Aucune session terminée pour l\'instant' : 'No completed sessions yet'}
        </p>
      </div>
    );
  }

  // Dimensions du SVG
  const W = 500, H = 160, PADX = 10, PADY = 16;
  const maxVal = Math.max(...points.map(p => p.cumulative), 1);
  const xs = points.map((_, i) => PADX + (i / Math.max(points.length - 1, 1)) * (W - PADX * 2));
  const ys = points.map(p => PADY + (1 - p.cumulative / maxVal) * (H - PADY * 2));

  // Chemin courbe lisse (Bézier)
  const pathD = xs.map((x, i) => {
    if (i === 0) return `M ${x} ${ys[i]}`;
    const prevX = xs[i - 1], prevY = ys[i - 1];
    const cpX = (prevX + x) / 2;
    return `C ${cpX} ${prevY}, ${cpX} ${ys[i]}, ${x} ${ys[i]}`;
  }).join(' ');

  // Zone de remplissage
  const areaD = `${pathD} L ${xs[xs.length - 1]} ${H - PADY} L ${xs[0]} ${H - PADY} Z`;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 240, height: 'auto' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
          {/* Ligne de grille horizontale */}
        </defs>

        {/* Grille légère */}
        {[0.25, 0.5, 0.75].map(f => {
          const y = PADY + f * (H - PADY * 2);
          return <line key={f} x1={PADX} y1={y} x2={W - PADX} y2={y} stroke="var(--border)" strokeWidth="1" />;
        })}

        {/* Aire sous la courbe */}
        <path d={areaD} fill="url(#chartGrad)" />

        {/* Courbe */}
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points + tooltips */}
        {points.map((pt, i) => (
          <g key={i}>
            <circle cx={xs[i]} cy={ys[i]} r="5" fill="var(--card-bg)" stroke="var(--accent)" strokeWidth="2.5" />
            <circle cx={xs[i]} cy={ys[i]} r="2.5" fill="var(--accent)" />
            {/* Valeur au-dessus */}
            <text x={xs[i]} y={ys[i] - 9} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--accent)" fontWeight="700">
              {pt.cumulative}
            </text>
            {/* Label mois en bas */}
            <text x={xs[i]} y={H - 2} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--text-tertiary)">
              {pt.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Bloc-notes par session ──────────────────────────────────────────────────
interface SessionNotesProps {
  sessions: any[];
  language: string;
}

function SessionNotes({ sessions, language }: SessionNotesProps) {
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const [notes, setNotes] = useState<Record<string, string>>(loadNotes);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [openSession, setOpenSession] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const relevantSessions = sessions.filter(s => ['confirmee', 'en_cours', 'terminee'].includes(s.statut));

  const startEdit = (sessionId: string) => {
    setDraft(notes[sessionId] || '');
    setEditing(sessionId);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const saveNote = (sessionId: string) => {
    const updated = { ...notes, [sessionId]: draft };
    setNotes(updated);
    saveNotes(updated);
    setEditing(null);
    toast.success(language === 'fr' ? 'Note sauvegardée ✓' : 'Note saved ✓');
  };

  const deleteNote = (sessionId: string) => {
    const updated = { ...notes };
    delete updated[sessionId];
    setNotes(updated);
    saveNotes(updated);
  };

  const cancelEdit = () => { setEditing(null); setDraft(''); };

  if (relevantSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2">
        <BookOpen className="w-8 h-8 opacity-20" style={{ color: 'var(--accent)' }} />
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {language === 'fr' ? 'Aucune session active' : 'No active sessions'}
        </p>
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; fg: string; dot: string }> = {
    confirmee: { bg: 'var(--info-soft)', fg: 'var(--info)', dot: 'var(--info)' },
    en_cours:  { bg: 'var(--success-soft)', fg: 'var(--success)', dot: 'var(--success)' },
    terminee:  { bg: 'var(--bg-tertiary)', fg: 'var(--text-tertiary)', dot: 'var(--text-tertiary)' },
  };

  return (
    <div className="space-y-2">
      {relevantSessions.slice(0, 5).map(session => {
        const isOpen = openSession === session.id;
        const isEditing = editing === session.id;
        const hasNote = !!notes[session.id]?.trim();
        const sc = statusColors[session.statut] || statusColors.terminee;

        return (
          <div key={session.id} className="note-accordion" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
            {/* En-tête de la session */}
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 px-4 py-3"
              onClick={() => setOpenSession(isOpen ? null : session.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Pastille statut */}
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sc.dot }} />
                <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {session.sujet}
                </span>
                <span className="hidden sm:inline text-xs flex-shrink-0 font-mono-data" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(session.date_debut).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasNote && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}>
                    {language === 'fr' ? 'Note' : 'Note'}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 transition-transform duration-200"
                  style={{ color: 'var(--text-tertiary)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </div>
            </button>

            {/* Contenu dépliable */}
            {isOpen && (
              <div className="px-4 pb-4 note-content-in">
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      rows={4}
                      placeholder={language === 'fr'
                        ? 'Vos notes sur cette session (points clés, actions à faire, ressources...)'
                        : 'Your notes for this session (key points, action items, resources...)'}
                      className="w-full text-sm resize-none outline-none rounded-lg px-3 py-2.5"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1.5px solid var(--accent)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        lineHeight: 1.6,
                      }}
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs mr-auto" style={{ color: 'var(--text-tertiary)' }}>
                        {draft.length} {language === 'fr' ? 'caractères' : 'chars'}
                      </span>
                      <button type="button" onClick={cancelEdit}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>
                        <X className="w-3 h-3" /> {language === 'fr' ? 'Annuler' : 'Cancel'}
                      </button>
                      <button type="button" onClick={() => saveNote(session.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ backgroundColor: 'var(--accent)', color: '#06231D', border: 'none', cursor: 'pointer' }}>
                        <Save className="w-3 h-3" /> {language === 'fr' ? 'Sauvegarder' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : hasNote ? (
                  <div>
                    <p className="text-sm whitespace-pre-wrap mb-3"
                      style={{ color: 'var(--text-secondary)', lineHeight: 1.65, borderLeft: '2px solid var(--accent)', paddingLeft: 10 }}>
                      {notes[session.id]}
                    </p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => startEdit(session.id)}
                        className="flex items-center gap-1 text-xs font-medium"
                        style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Pencil className="w-3 h-3" /> {language === 'fr' ? 'Modifier' : 'Edit'}
                      </button>
                      <button type="button" onClick={() => deleteNote(session.id)}
                        className="flex items-center gap-1 text-xs font-medium"
                        style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X className="w-3 h-3" /> {language === 'fr' ? 'Supprimer' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => startEdit(session.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full note-add-btn"
                    style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)', border: '1px dashed var(--accent)', cursor: 'pointer' }}>
                    <Pencil className="w-3.5 h-3.5" />
                    {language === 'fr' ? 'Ajouter une note…' : 'Add a note…'}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const isMentor = user?.role === 'mentor';
  const sessionsTerminees = sessions.filter(s => s.statut === 'terminee').length;
  const totalSessions = sessions.length;
  const progression = Number(profile?.progression) || 0;
  const noteMoyenne = parseFloat(
    (() => {
      const note = profile?.note_moyenne;
      if (!note || note === 0 || note === '0' || note === '0.00') return '0.0';
      const n = typeof note === 'string' ? parseFloat(note) : note;
      return isNaN(n) ? '0.0' : n.toFixed(1);
    })()
  );

  const animatedSessions    = useCountUp(totalSessions, 800, !loading);
  const animatedProgression = useCountUp(progression, 900, !loading);
  const animatedNoteTenths  = useCountUp(Math.round(noteMoyenne * 10), 900, !loading);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    (async () => {
      try {
        if (user.role === 'mentor') {
          const r = await mentorAPI.getProfile();
          setProfile(r.data.profile);
        } else {
          const r = await mentoreAPI.getProfile();
          setProfile(r.data.profile);
        }
        const sr = await sessionAPI.getAll();
        setSessions(sr.data.sessions || []);
      } catch {
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const statsCards = [
    {
      id: 'sessions',
      title: t('dashboard.sessions'),
      value: animatedSessions,
      icon: Calendar,
      accent: 'accent',
      subtitle: `${sessionsTerminees} terminées`,
      gradient: 'linear-gradient(135deg, var(--accent-soft), var(--info-soft))',
    },
    {
      id: isMentor ? 'note' : 'progression',
      title: isMentor ? t('profile.note') : t('profile.progression'),
      value: isMentor ? (animatedNoteTenths / 10).toFixed(1) : `${animatedProgression}%`,
      icon: TrendingUp,
      accent: 'warm',
      subtitle: isMentor ? `${profile?.nb_sessions || 0} sessions` : `${sessionsTerminees}/${totalSessions} sessions`,
      gradient: 'linear-gradient(135deg, var(--warm-soft), var(--accent-soft))',
    },
    {
      id: 'messages',
      title: t('dashboard.messages'),
      value: '0',
      icon: Mail,
      accent: 'info',
      subtitle: t('dashboard.unread'),
      gradient: 'linear-gradient(135deg, var(--info-soft), var(--success-soft))',
    },
  ];

  const menuItems = [
    { id: 'sessions', title: t('dashboard.sessions'), icon: Calendar, href: '/sessions', accent: 'accent', description: t('dashboard.sessions_desc'), gradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' },
    { id: 'messages', title: t('dashboard.messages'), icon: MessageCircle, href: '/chat', accent: 'info', description: t('dashboard.messages_desc'), gradient: 'linear-gradient(135deg, #06B6D4, #3B82F6)' },
    { id: 'reports', title: t('dashboard.reports'), icon: FileText, href: '/reports', accent: 'success', description: t('dashboard.reports_desc'), gradient: 'linear-gradient(135deg, #10B981, #06B6D4)' },
  ];

  if (isMentor) {
    menuItems.unshift({ id: 'disponibilites', title: t('profile.disponibilites'), icon: Clock, href: '/disponibilites', accent: 'warm', description: t('profile.disponibilites_desc'), gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)' });
  } else {
    menuItems.unshift({ id: 'mentors', title: t('dashboard.find_mentor'), icon: Users, href: '/mentors', accent: 'warm', description: t('dashboard.find_mentor_desc'), gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)' });
    menuItems.push({ id: 'matching', title: t('dashboard.recommendations'), icon: Award, href: '/matching', accent: 'accent', description: t('dashboard.recommendations_desc'), gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899)' });
  }

  const accentColors: Record<string, { bg: string; fg: string }> = {
    accent:  { bg: 'var(--accent-soft)',   fg: 'var(--accent-text-on-soft)' },
    warm:    { bg: 'var(--warm-soft)',     fg: 'var(--warm-text-on-soft)' },
    info:    { bg: 'var(--info-soft)',     fg: 'var(--info)' },
    success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  };

  const statusConfig: Record<string, { bg: string; fg: string; label: string }> = {
    terminee:  { bg: 'var(--success-soft)', fg: 'var(--success)', label: t('sessions.completed') },
    en_cours:  { bg: 'var(--info-soft)',    fg: 'var(--info)',    label: t('sessions.in_progress') },
    annulee:   { bg: 'var(--danger-soft)', fg: 'var(--danger)',  label: t('sessions.cancelled') },
    confirmee: { bg: 'var(--warm-soft)',   fg: 'var(--warm-text-on-soft)', label: t('sessions.confirmed') },
    en_attente:{ bg: 'var(--bg-tertiary)', fg: 'var(--text-secondary)',    label: t('sessions.pending') },
  };

  return (
    <div className="min-h-screen relative dash-ambient" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Fond ambiant */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="dash-orb dash-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
        <div className="dash-orb dash-orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="dash-particle" style={{
            left: `${(i * 13 + 7) % 100}%`,
            top: `${(i * 17 + 11) % 100}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${3 + (i % 4)}s`,
            backgroundColor: i % 2 === 0 ? 'var(--accent)' : 'var(--warm)',
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
          }} />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-10 pb-8 max-w-7xl mx-auto">
        <p className="font-mono-data text-xs uppercase tracking-wide mb-2 fade-in-up" style={{ color: 'var(--accent)' }}>
          {t('dashboard.activity')}
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold fade-in-up" style={{ color: 'var(--text-primary)', animationDelay: '0.06s' }}>
          <span className="hover-gradient-title">{t('dashboard.welcome')}, {user.prenom}</span>
        </h1>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-8">

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((card, index) => {
            const colors = accentColors[card.accent];
            const isHovered = hoveredCard === card.id;
            return (
              <div key={index} className="stat-card-wrapper"
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}>
                <div className="card stat-card-in p-6 relative overflow-hidden transition-all duration-500"
                  style={{
                    animationDelay: `${0.1 + index * 0.07}s`,
                    transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'none',
                    boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.12)' : 'var(--shadow-card)',
                  }}>
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-500"
                    style={{ background: card.gradient, opacity: isHovered ? 0.08 : 0 }} />
                  <div className="relative z-10 flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center icon-pop transition-all duration-300"
                      style={{ backgroundColor: colors.bg, transform: isHovered ? 'scale(1.15) rotate(-6deg)' : 'none' }}>
                      <card.icon className="w-5 h-5" style={{ color: colors.fg }} />
                    </div>
                    <span className="font-mono-data text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {card.value}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium relative z-10" style={{ color: 'var(--text-primary)' }}>{card.title}</h3>
                  <p className="text-xs mt-1 relative z-10" style={{ color: 'var(--text-tertiary)' }}>{card.subtitle}</p>
                  <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-500"
                    style={{ background: card.gradient, width: isHovered ? '100%' : '0%' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── SECTIONS EXCLUSIVES MENTORÉ : graphique + bloc-notes ── */}
        {!isMentor && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* ── Graphique de progression ── */}
            <div className="card p-6 fade-in-up" style={{ animationDelay: '0.28s' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-mono-data text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
                    {language === 'fr' ? 'Votre parcours' : 'Your journey'}
                  </p>
                  <h2 className="font-display text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {language === 'fr' ? 'Courbe de progression' : 'Progress curve'}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--accent-soft)' }}>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span className="font-mono-data text-xs font-semibold" style={{ color: 'var(--accent-text-on-soft)' }}>
                    {sessionsTerminees} {language === 'fr' ? 'terminée(s)' : 'done'}
                  </span>
                </div>
              </div>

              <ProgressChart sessions={sessions} language={language} />

              {/* Légende */}
              {sessionsTerminees > 0 && (
                <div className="mt-4 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {language === 'fr' ? 'Sessions terminées (cumulées)' : 'Completed sessions (cumulative)'}
                    </span>
                  </div>
                  {progression > 0 && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
                        {progression}% {language === 'fr' ? 'progression' : 'progress'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Bloc-notes par session ── */}
            <div className="card p-6 fade-in-up" style={{ animationDelay: '0.34s' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-mono-data text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--warm)' }}>
                    {language === 'fr' ? 'Prise de notes' : 'Notes'}
                  </p>
                  <h2 className="font-display text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {language === 'fr' ? 'Bloc-notes de session' : 'Session notebook'}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--warm-soft)' }}>
                  <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--warm)' }} />
                  <span className="font-mono-data text-xs font-semibold" style={{ color: 'var(--warm-text-on-soft)' }}>
                    {language === 'fr' ? 'Privé & local' : 'Private & local'}
                  </span>
                </div>
              </div>

              <SessionNotes sessions={sessions} language={language} />

              <p className="text-[10px] mt-3" style={{ color: 'var(--text-tertiary)' }}>
                {language === 'fr'
                  ? '💡 Notes stockées sur cet appareil uniquement — non partagées'
                  : '💡 Notes stored on this device only — not shared'}
              </p>
            </div>
          </div>
        )}

        {/* ── Sessions récentes ── */}
        {sessions.length > 0 && (
          <div className="mb-8 fade-in-up" style={{ animationDelay: '0.32s' }}>
            <h2 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('dashboard.recent_sessions')}
            </h2>
            <div className="space-y-3">
              {sessions.slice(0, 3).map((session, i) => {
                const cfg = statusConfig[session.statut] || statusConfig.en_attente;
                const sid = `session-${session.id}`;
                const isSessionHovered = hoveredCard === sid;
                return (
                  <div key={session.id}
                    className="card p-4 flex justify-between items-center session-row-in transition-all duration-300 cursor-pointer"
                    style={{
                      animationDelay: `${0.4 + i * 0.06}s`,
                      transform: isSessionHovered ? 'translateX(6px)' : 'none',
                      borderLeft: isSessionHovered ? '3px solid var(--accent)' : '3px solid transparent',
                    }}
                    onMouseEnter={() => setHoveredCard(sid)}
                    onMouseLeave={() => setHoveredCard(null)}>
                    <div>
                      <h3 className="font-semibold transition-all duration-300"
                        style={{ color: isSessionHovered ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {session.sujet}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(session.date_debut).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB')}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium transition-all duration-300"
                      style={{ backgroundColor: cfg.bg, color: cfg.fg, transform: isSessionHovered ? 'scale(1.05)' : 'none' }}>
                      {session.statut === 'en_cours' && (
                        <span className="live-dot" style={{ backgroundColor: cfg.fg }} />
                      )}
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Accès rapide ── */}
        <h2 className="font-display text-xl font-semibold mb-4 fade-in-up"
          style={{ color: 'var(--text-primary)', animationDelay: '0.46s' }}>
          {t('dashboard.quick_access')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => {
            const colors = accentColors[item.accent];
            const isMenuHovered = hoveredCard === item.id;
            return (
              <Link key={index} href={item.href} className="block menu-card-wrapper"
                style={{ animationDelay: `${0.5 + index * 0.06}s` }}
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}>
                <div className="card menu-card p-6 h-full menu-card-in relative overflow-hidden transition-all duration-500"
                  style={{
                    transform: isMenuHovered ? 'translateY(-6px) scale(1.02)' : 'none',
                    boxShadow: isMenuHovered ? '0 16px 32px rgba(0,0,0,0.1)' : 'var(--shadow-card)',
                  }}>
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-500"
                    style={{ background: item.gradient, opacity: isMenuHovered ? 0.06 : 0 }} />
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative z-10 transition-all duration-500"
                    style={{ backgroundColor: colors.bg, transform: isMenuHovered ? 'scale(1.15) rotate(-8deg)' : 'none' }}>
                    <item.icon className="w-6 h-6" style={{ color: colors.fg }} />
                  </div>
                  <h3 className="font-semibold relative z-10 transition-all duration-300"
                    style={{ color: 'var(--text-primary)', transform: isMenuHovered ? 'translateX(3px)' : 'none' }}>
                    {item.title}
                  </h3>
                  <p className="text-sm relative z-10" style={{ color: 'var(--text-secondary)' }}>
                    {item.description}
                  </p>
                  <div className="absolute bottom-4 right-4 transition-all duration-300"
                    style={{ opacity: isMenuHovered ? 1 : 0, transform: isMenuHovered ? 'translateX(0)' : 'translateX(-10px)' }}>
                    <ArrowRight className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="absolute top-0 left-0 right-0 h-1 transition-all duration-500"
                    style={{ background: item.gradient, opacity: isMenuHovered ? 1 : 0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .dash-ambient { overflow: hidden; }
        .dash-orb { position: absolute; border-radius: 9999px; filter: blur(80px); opacity: 0.35; will-change: transform; }
        .dash-orb-1 { width: 22rem; height: 22rem; top: -8rem; right: -6rem; animation: dashFloat1 26s ease-in-out infinite; }
        .dash-orb-2 { width: 18rem; height: 18rem; bottom: -6rem; left: -4rem; animation: dashFloat2 30s ease-in-out infinite; }
        @keyframes dashFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,30px) scale(1.06)} }
        @keyframes dashFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(25px,-20px) scale(1.08)} }

        .dash-particle { position: absolute; border-radius: 50%; pointer-events: none; animation: particleFloat linear infinite; }
        @keyframes particleFloat { 0%{opacity:0;transform:translateY(0) scale(0)} 20%{opacity:0.6} 80%{opacity:0.2} 100%{opacity:0;transform:translateY(-60px) scale(1.5)} }

        .fade-in-up { opacity:0; transform:translateY(12px); animation:dashFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes dashFadeUp { to{opacity:1;transform:translateY(0)} }

        .stat-card-in { opacity:0; transform:translateY(16px) scale(0.98); animation:dashCardIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes dashCardIn { to{opacity:1;transform:translateY(0) scale(1)} }

        .icon-pop { opacity:0; transform:scale(0.6); animation:dashIconPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        @keyframes dashIconPop { to{opacity:1;transform:scale(1)} }

        .session-row-in { opacity:0; transform:translateX(-10px); animation:dashRowIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes dashRowIn { to{opacity:1;transform:translateX(0)} }

        .menu-card-in { opacity:0; transform:translateY(14px); animation:dashFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }

        .stat-card-wrapper,.menu-card-wrapper { transition:transform 0.3s ease; }
        .card { transition:all 0.4s cubic-bezier(0.4,0,0.2,1); }

        /* Titre dégradé hover */
        .hover-gradient-title { display:inline-block; transition:all 0.3s ease; }
        .hover-gradient-title:hover {
          background: linear-gradient(135deg,#3B82F6,#8B5CF6);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }

        /* Pastille en cours */
        .live-dot { display:inline-block; width:6px; height:6px; border-radius:50%; margin-right:5px; animation:dashPulseDot 1.6s ease-in-out infinite; }
        @keyframes dashPulseDot { 0%,100%{opacity:1} 50%{opacity:0.35} }

        /* Accordéon notes */
        .note-content-in { animation: noteIn 0.2s ease; }
        @keyframes noteIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

        .note-accordion { transition: box-shadow 0.2s ease; }
        .note-accordion:hover { box-shadow: var(--shadow-card); }

        .note-add-btn { transition: filter 0.15s ease, transform 0.15s ease; }
        .note-add-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }

        @media (prefers-reduced-motion:reduce) {
          .dash-orb,.dash-particle,.fade-in-up,.stat-card-in,.icon-pop,.session-row-in,
          .menu-card-in,.live-dot,.card,.note-content-in {
            animation:none!important; transition:none!important; opacity:1!important; transform:none!important;
          }
        }
      `}</style>
    </div>
  );
}