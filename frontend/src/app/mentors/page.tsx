'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, Clock, Users, Star, CalendarPlus, ArrowUpDown, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicAPI } from '@/services/api';
import { DOMAINES } from '@/lib/domaines';

interface Mentor {
  id: string;
  nom: string;
  prenom: string;
  domaine: string;
  note_moyenne: number;
  nb_avis?: number;
  nb_sessions: number;
  annees_experience: number;
  photo_url: string;
  competences: any[];
  disponible: boolean;
}

type SortKey = 'pertinence' | 'note' | 'experience' | 'popularite';

function getCompName(comp: any): string {
  if (!comp) return '';
  if (typeof comp === 'string') return comp;
  if (typeof comp === 'object' && comp.nom) return String(comp.nom);
  return '';
}

function getCompNiveau(comp: any): string {
  if (typeof comp === 'object' && comp.niveau) return String(comp.niveau);
  return '';
}

function getNiveauLabel(niveau: string): string {
  switch (niveau) {
    case 'debutant': return 'Débutant';
    case 'intermediaire': return 'Intermédiaire';
    case 'avance': return 'Avancé';
    case 'expert': return 'Expert';
    default: return '';
  }
}

export default function MentorsPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('pertinence');
  const [minNote, setMinNote] = useState(0);
  const [minExperience, setMinExperience] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeDomaineLabel, setActiveDomaineLabel] = useState<string | null>(null);
  const [hoveredMentor, setHoveredMentor] = useState<string | null>(null);
  const [focusedSearch, setFocusedSearch] = useState(false);

  useEffect(() => {
    const domaineParam = searchParams.get('domaine');
    if (domaineParam) {
      const category = DOMAINES.find((d) => d.key === domaineParam);
      if (category) {
        setSearchTerm(category.keywords?.[0] || category.label);
        setActiveDomaineLabel(category.label);
      }
    }
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const response = await publicAPI.searchMentors({ limit: 100 });
      const data = response.data.data || [];
      setMentors(data);
    } catch (error) {
      console.error('Erreur fetchMentors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extraire les tags (noms de compétences) uniques
  const availableTags = useMemo(() => {
    const counts = new Map<string, number>();

    mentors.forEach((m) => {
      const competences = m.competences || [];
      competences.forEach((c: any) => {
        const name = getCompName(c);
        if (name) {
          counts.set(name, (counts.get(name) || 0) + 1);
        }
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [mentors]);

  const visibleTags = showAllTags ? availableTags : availableTags.slice(0, 9);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'pertinence', label: 'Pertinence' },
    { key: 'note', label: 'Meilleure note' },
    { key: 'experience', label: "Plus d'expérience" },
    { key: 'popularite', label: 'Plus populaire' },
  ];

  const filteredMentors = useMemo(() => {
    let result = mentors.filter((mentor) => {
      const fullName = `${mentor.prenom} ${mentor.nom}`.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        fullName.includes(searchTerm.toLowerCase()) ||
        (mentor.domaine || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.competences || []).some((c: any) =>
          getCompName(c).toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesAvailable = !onlyAvailable || mentor.disponible;

      const matchesTags =
        activeTags.length === 0 ||
        activeTags.every((tag) =>
          (mentor.competences || []).some((c: any) => getCompName(c) === tag)
        );

      const matchesNote = !minNote || Number(mentor.note_moyenne || 0) >= minNote;
      const matchesExperience = !minExperience || Number(mentor.annees_experience || 0) >= minExperience;

      return matchesSearch && matchesAvailable && matchesTags && matchesNote && matchesExperience;
    });

    switch (sortKey) {
      case 'note':
        result = [...result].sort((a, b) => Number(b.note_moyenne || 0) - Number(a.note_moyenne || 0));
        break;
      case 'experience':
        result = [...result].sort((a, b) => Number(b.annees_experience || 0) - Number(a.annees_experience || 0));
        break;
      case 'popularite':
        result = [...result].sort((a, b) => Number(b.nb_sessions || 0) - Number(a.nb_sessions || 0));
        break;
    }

    return result;
  }, [mentors, searchTerm, onlyAvailable, activeTags, sortKey, minNote, minExperience]);

  const getNoteDisplay = (note: any) => {
    if (!note || note === 0) return t('common.new');
    const numNote = Number(note);
    if (isNaN(numNote)) return t('common.new');
    return numNote.toFixed(1);
  };

  const getPhotoUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setOnlyAvailable(false);
    setActiveTags([]);
    setMinNote(0);
    setMinExperience(0);
    setSortKey('pertinence');
    setActiveDomaineLabel(null);
  };

  const hasActiveFilters = searchTerm || onlyAvailable || activeTags.length > 0 || minNote > 0 || minExperience > 0;

  if (loading) {
    return (
      <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-12 pb-8">
          <div className="skeleton-block h-3 w-32 rounded-full mb-3" />
          <div className="skeleton-block h-10 w-64 rounded-xl mb-8" />
          <div className="skeleton-block h-14 w-full rounded-2xl mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-5 skeleton-card" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="skeleton-block w-14 h-14 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-block h-4 w-3/4 rounded-md" />
                    <div className="skeleton-block h-3 w-1/2 rounded-md" />
                  </div>
                </div>
                <div className="skeleton-block h-3 w-full rounded-md mb-2" />
                <div className="skeleton-block h-8 w-full rounded-xl mt-4" />
              </div>
            ))}
          </div>
        </div>
        <style jsx global>{`
          .skeleton-block {
            background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border) 37%, var(--bg-tertiary) 63%);
            background-size: 400% 100%;
            animation: skeletonShimmer 1.6s ease-in-out infinite;
          }
          @keyframes skeletonShimmer {
            0% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .skeleton-card {
            opacity: 0;
            animation: skeletonCardIn 0.4s ease forwards;
          }
          @keyframes skeletonCardIn { to { opacity: 1; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="mentors-orb mentors-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
        <div className="mentors-orb mentors-orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
        <div className="mentors-orb mentors-orb-3" style={{ backgroundColor: 'var(--accent-soft)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-12 pb-8">
        <p className="font-mono-data text-xs uppercase tracking-wide mb-2 fade-in-up" style={{ color: 'var(--accent)' }}>
          {t('mentors.subtitle')}
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold fade-in-up" style={{ color: 'var(--text-primary)', animationDelay: '0.05s' }}>
          {t('nav.mentors')}
        </h1>
        {activeDomaineLabel && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-medium domaine-chip-in" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}>
            Domaine : {activeDomaineLabel}
            <button onClick={resetFilters} className="domaine-chip-close hover:opacity-70 font-bold">✕</button>
          </div>
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 mb-8 space-y-4 fade-in-up" style={{ animationDelay: '0.12s' }}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 search-wrap" data-focused={focusedSearch}>
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 search-icon" style={{ color: focusedSearch ? 'var(--accent)' : 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder={t('mentors.search_placeholder')}
              className="search-input w-full pl-12 pr-4 py-3.5 rounded-2xl outline-none text-base"
              style={{ backgroundColor: 'var(--card-bg)', border: `1px solid ${focusedSearch ? 'var(--accent)' : 'var(--border)'}`, color: 'var(--text-primary)', boxShadow: focusedSearch ? '0 0 0 4px var(--accent-soft)' : 'var(--shadow-card)' }}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setActiveDomaineLabel(null); }}
              onFocus={() => setFocusedSearch(true)}
              onBlur={() => setFocusedSearch(false)}
            />
          </div>

          <div className="relative">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="sort-select w-full md:w-56 h-full pl-11 pr-4 py-3.5 rounded-2xl outline-none appearance-none text-sm font-medium"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
            <ArrowUpDown className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="filters-btn flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all"
            style={showAdvanced ? { backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)', border: '1px solid var(--border)' } : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <SlidersHorizontal className="w-4 h-4" style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
            {t('mentors.advanced_filters')}
          </button>
        </div>

        {showAdvanced && (
          <div className="card p-5 grid grid-cols-1 md:grid-cols-2 gap-6 advanced-panel-in">
            <div>
              <label className="flex justify-between text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                <span>{t('mentors.min_rating')}</span>
                <span className="font-mono-data" style={{ color: 'var(--accent)' }}>{minNote > 0 ? `${minNote}+` : t('mentors.all')}</span>
              </label>
              <input type="range" min={0} max={5} step={0.5} value={minNote} onChange={(e) => setMinNote(parseFloat(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent)' }} />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                <span>{t('mentors.min_experience')}</span>
                <span className="font-mono-data" style={{ color: 'var(--accent)' }}>{minExperience > 0 ? `${minExperience}+ ${t('mentors.years')}` : t('mentors.all')}</span>
              </label>
              <input type="range" min={0} max={20} step={1} value={minExperience} onChange={(e) => setMinExperience(parseInt(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent)' }} />
            </div>
          </div>
        )}

        {/* ─── TAGS DE COMPÉTENCES (FILTRES) ─── */}
        <div className="flex items-start gap-2 flex-wrap">
          <button
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            className="tag-btn px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={onlyAvailable ? { backgroundColor: 'var(--accent)', color: '#FFFFFF' } : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: onlyAvailable ? '#FFFFFF' : 'var(--success)', animation: onlyAvailable ? 'none' : 'availablePulse 2s ease-in-out infinite' }} />
              {t('mentors.available')}
            </span>
          </button>

          {visibleTags.length > 0 ? (
            <>
              {visibleTags.map((tag, ti) => {
                const active = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="tag-btn tag-btn-in px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={{
                      ...(active ? { backgroundColor: 'var(--warm)', color: '#2A1700' } : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }),
                      animationDelay: `${ti * 0.03}s`,
                    }}
                  >
                    {tag}
                    {active && <X className="w-3 h-3 ml-1 inline" />}
                  </button>
                );
              })}

              {availableTags.length > 9 && (
                <button onClick={() => setShowAllTags(!showAllTags)} className="tag-more-btn px-4 py-2 rounded-full text-sm font-medium" style={{ color: 'var(--accent)' }}>
                  {showAllTags ? t('mentors.show_less') : `+${availableTags.length - 9} ${t('mentors.show_more_others')}`}
                </button>
              )}
            </>
          ) : (
            <span className="text-sm py-2" style={{ color: 'var(--text-tertiary)' }}>
              Aucune compétence disponible. Les mentors doivent ajouter leurs compétences depuis leur profil.
            </span>
          )}

          {hasActiveFilters && (
            <button onClick={resetFilters} className="reset-btn px-4 py-2 rounded-full text-sm font-medium" style={{ color: 'var(--danger)' }}>
              {t('mentors.reset')}
            </button>
          )}
        </div>
      </div>

      {/* ─── LISTE DES MENTORS ─── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-12">
        {filteredMentors.length === 0 ? (
          <div className="card p-12 text-center fade-in-up empty-state">
            <div className="empty-icon-wrap mb-4">
              <Search className="w-10 h-10 mx-auto" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{t('mentors.no_results')}</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90" style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}>
                {t('mentors.reset')}
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm mb-4 fade-in-up count-text" key={filteredMentors.length} style={{ color: 'var(--text-tertiary)' }}>
              {filteredMentors.length} {t('mentors.found_label')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredMentors.map((mentor, idx) => {
                const isHovered = hoveredMentor === mentor.id;

                return (
                  <div
                    key={mentor.id}
                    className="card p-5 flex flex-col mentor-card-in mentor-card"
                    style={{ animationDelay: `${Math.min(idx, 12) * 0.04}s`, transform: isHovered ? 'translateY(-5px)' : 'translateY(0)', boxShadow: isHovered ? '0 16px 32px rgba(0,0,0,0.12)' : 'var(--shadow-card)', borderColor: isHovered ? 'var(--accent)' : 'var(--border)' }}
                    onMouseEnter={() => setHoveredMentor(mentor.id)}
                    onMouseLeave={() => setHoveredMentor(null)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center avatar-box" style={{ backgroundColor: 'var(--accent-soft)', border: '2px solid var(--accent-soft)', transform: isHovered ? 'scale(1.06) rotate(-2deg)' : 'scale(1) rotate(0deg)' }}>
                        {(() => {
                          const photoUrl = getPhotoUrl(mentor.photo_url);
                          return photoUrl ? (
                            <img src={photoUrl} alt={`${mentor.prenom} ${mentor.nom}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-lg" style={{ color: 'var(--accent-text-on-soft)' }}>
                              {String(mentor.prenom?.[0] || '')}{String(mentor.nom?.[0] || '')}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold leading-tight truncate transition-colors duration-200" style={{ color: isHovered ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {mentor.prenom} {mentor.nom}
                        </h3>
                        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                          {mentor.domaine || t('mentors.expert')}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3.5 h-3.5" style={{ color: 'var(--warm)', fill: 'var(--warm)' }} />
                          <span className="font-mono-data text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {getNoteDisplay(mentor.note_moyenne)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {mentor.competences && mentor.competences.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {mentor.competences.slice(0, 4).map((comp: any, ci: number) => {
                          const compName = getCompName(comp);
                          const compNiveau = getCompNiveau(comp);

                          if (!compName) return null;

                          return (
                            <span
                              key={ci}
                              className="text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer competence-mini-chip"
                              style={{ backgroundColor: 'var(--warm-soft)', color: 'var(--warm-text-on-soft)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTag(compName);
                              }}
                              title={compNiveau ? `Niveau: ${getNiveauLabel(compNiveau)}` : undefined}
                            >
                              {compName}
                            </span>
                          );
                        })}
                        {mentor.competences.length > 4 && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            +{mentor.competences.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-mono-data text-xs">{mentor.nb_sessions || 0} sessions</span>
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: mentor.disponible ? 'var(--success)' : 'var(--text-tertiary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mentor.disponible ? 'var(--success)' : 'var(--text-tertiary)', animation: mentor.disponible ? 'availablePulse 2s ease-in-out infinite' : 'none' }} />
                        {mentor.disponible ? t('mentors.available') : t('mentors.unavailable')}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Link
                        href={`/mentors/${mentor.id}`}
                        className="card-btn-primary flex-1 text-center px-3 py-2.5 rounded-xl font-medium text-sm"
                        style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                      >
                        {t('mentors.view_profile')}
                      </Link>
                      <Link
                        href={`/sessions/new?mentor=${mentor.id}`}
                        className="card-btn-secondary px-3 py-2.5 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                        title={t('mentors.book_session')}
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .mentors-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          opacity: 0.35;
          will-change: transform;
        }
        .mentors-orb-1 { width: 22rem; height: 22rem; top: -8rem; right: -6rem; animation: mentorsFloat1 26s ease-in-out infinite; }
        .mentors-orb-2 { width: 18rem; height: 18rem; bottom: -6rem; left: -4rem; animation: mentorsFloat2 30s ease-in-out infinite; }
        .mentors-orb-3 { width: 14rem; height: 14rem; top: 30%; left: 45%; animation: mentorsFloat3 34s ease-in-out infinite; opacity: 0.18; }

        @keyframes mentorsFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 30px) scale(1.06); }
        }
        @keyframes mentorsFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -20px) scale(1.08); }
        }
        @keyframes mentorsFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 20px) scale(1.1); }
        }

        @keyframes availablePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
        }

        .fade-in-up {
          opacity: 0;
          transform: translateY(12px);
          animation: mentorsFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes mentorsFadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .domaine-chip-in {
          opacity: 0;
          transform: translateY(-6px) scale(0.95);
          animation: domaineChipIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
        }
        @keyframes domaineChipIn { to { opacity: 1; transform: translateY(0) scale(1); } }
        .domaine-chip-close { transition: transform 0.2s ease; display: inline-block; }
        .domaine-chip-close:hover { transform: rotate(90deg); }

        .search-input { transition: border-color 0.25s ease, box-shadow 0.25s ease; }
        .search-icon { transition: color 0.25s ease; }

        .sort-select { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .sort-select:hover { border-color: var(--accent) !important; }
        .sort-select:focus { box-shadow: 0 0 0 4px var(--accent-soft); border-color: var(--accent) !important; }

        .filters-btn { transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease; }
        .filters-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
        .filters-btn:active { transform: translateY(0) scale(0.97); }

        .advanced-panel-in {
          opacity: 0;
          transform: translateY(-8px);
          animation: advancedPanelIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes advancedPanelIn { to { opacity: 1; transform: translateY(0); } }

        .tag-btn { transition: transform 0.18s ease, background-color 0.2s ease, box-shadow 0.2s ease; }
        .tag-btn:hover { transform: translateY(-2px); }
        .tag-btn:active { transform: translateY(0) scale(0.95); }
        .tag-btn-in {
          opacity: 0;
          transform: translateY(6px);
          animation: tagBtnIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes tagBtnIn { to { opacity: 1; transform: translateY(0); } }

        .tag-more-btn { transition: opacity 0.2s ease; }
        .tag-more-btn:hover { opacity: 0.7; text-decoration: underline; }

        .reset-btn { transition: transform 0.18s ease, opacity 0.2s ease; }
        .reset-btn:hover { transform: translateY(-2px); opacity: 0.8; }

        .count-text {
          animation: mentorsFadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .mentor-card-in {
          opacity: 0;
          transform: translateY(16px) scale(0.98);
          animation: mentorsCardIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes mentorsCardIn {
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mentor-card {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .avatar-box { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }

        .competence-mini-chip { transition: transform 0.18s ease, filter 0.18s ease; }
        .competence-mini-chip:hover { transform: translateY(-2px) scale(1.05); filter: brightness(1.08); }

        .card-btn-primary, .card-btn-secondary { transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease; }
        .card-btn-primary:hover { filter: brightness(1.15); box-shadow: 0 6px 14px rgba(0,0,0,0.15); }
        .card-btn-primary:active { transform: scale(0.96); }
        .card-btn-secondary:hover { transform: translateY(-2px) rotate(8deg); border-color: var(--accent) !important; }
        .card-btn-secondary:active { transform: scale(0.92); }

        .empty-state { animation-delay: 0.05s; }
        .empty-icon-wrap {
          animation: emptyIconFloat 3s ease-in-out infinite;
        }
        @keyframes emptyIconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .mentors-orb, .fade-in-up, .mentor-card-in, .domaine-chip-in,
          .advanced-panel-in, .tag-btn-in, .empty-icon-wrap, .avatar-box,
          .mentor-card, .card-btn-primary, .card-btn-secondary, .competence-mini-chip {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}