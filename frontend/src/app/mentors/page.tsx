'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, Clock, Users, Star, CalendarPlus, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicAPI } from '@/services/api';
import { DOMAINES } from '@/lib/domaines';
import { Avatar } from '@/components/ui/Avatar';

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
  competences: string[];
  disponible: boolean;
}

type SortKey = 'pertinence' | 'note' | 'experience' | 'popularite';

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

  useEffect(() => {
    const domaineParam = searchParams.get('domaine');
    if (domaineParam) {
      const category = DOMAINES.find((d) => d.key === domaineParam);
      if (category) {
        setSearchTerm(category.keywords[0] || category.label);
        setActiveDomaineLabel(category.label);
      }
    }
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const response = await publicAPI.searchMentors({});
      setMentors(response.data.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableTags = useMemo(() => {
    const counts = new Map<string, number>();
    mentors.forEach((m) => {
      (m.competences || []).forEach((c) => {
        counts.set(c, (counts.get(c) || 0) + 1);
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
        (mentor.competences || []).some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesAvailable = !onlyAvailable || mentor.disponible;
      const matchesTags = activeTags.length === 0 || activeTags.every((tag) => (mentor.competences || []).includes(tag));
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
      default:
        break;
    }

    return result;
  }, [mentors, searchTerm, onlyAvailable, activeTags, sortKey, minNote, minExperience]);

  const getNoteDisplay = (note: any) => {
    if (!note) return t('common.new');
    const numNote = Number(note);
    if (isNaN(numNote)) return t('common.new');
    return numNote.toFixed(1);
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

  return (
    <div className="min-h-screen relative mentors-ambient" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="mentors-orb mentors-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
        <div className="mentors-orb mentors-orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-12 pb-8">
        <p className="font-mono-data text-xs uppercase tracking-wide mb-2 fade-in-up" style={{ color: 'var(--accent)' }}>
          {t('mentors.subtitle')}
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold fade-in-up hover-gradient-text" style={{ color: 'var(--text-primary)', animationDelay: '0.05s' }}>
          {t('nav.mentors')}
        </h1>
        {activeDomaineLabel && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-medium fade-in-up" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)', animationDelay: '0.1s' }}>
            Domaine : {activeDomaineLabel}
            <button onClick={resetFilters} className="hover:opacity-70 transition-opacity font-bold">✕</button>
          </div>
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 mb-8 space-y-4 fade-in-up" style={{ animationDelay: '0.12s' }}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder={t('mentors.search_placeholder')}
              className="mentors-input w-full pl-12 pr-4 py-4 rounded-2xl outline-none text-base"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setActiveDomaineLabel(null); }}
            />
          </div>

          <div className="relative">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="mentors-input w-full md:w-56 h-full pl-11 pr-4 py-4 rounded-2xl outline-none appearance-none text-sm font-medium"
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
            className="mentors-filter-btn flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-sm font-medium transition-all hover-lift"
            style={showAdvanced ? { backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)', border: '1px solid var(--border)' } : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('mentors.advanced_filters')}
          </button>
        </div>

        {showAdvanced && (
          <div className="card p-5 grid grid-cols-1 md:grid-cols-2 gap-6 panel-in">
            <div>
              <label className="flex justify-between text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                <span>{t('mentors.min_rating')}</span>
                <span className="font-mono-data" style={{ color: 'var(--accent)' }}>{minNote > 0 ? `${minNote}+` : t('mentors.all')}</span>
              </label>
              <input type="range" min={0} max={5} step={0.5} value={minNote} onChange={(e) => setMinNote(parseFloat(e.target.value))} className="w-full range-slider" style={{ accentColor: 'var(--accent)' }} />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                <span>{t('mentors.min_experience')}</span>
                <span className="font-mono-data" style={{ color: 'var(--accent)' }}>{minExperience > 0 ? `${minExperience}+ ${t('mentors.years')}` : t('mentors.all')}</span>
              </label>
              <input type="range" min={0} max={20} step={1} value={minExperience} onChange={(e) => setMinExperience(parseInt(e.target.value))} className="w-full range-slider" style={{ accentColor: 'var(--accent)' }} />
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 flex-wrap">
          <button
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            className="mentors-tag-btn flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover-lift"
            style={onlyAvailable ? { backgroundColor: 'var(--accent)', color: '#06231D' } : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t('mentors.available')} uniquement
          </button>

          {visibleTags.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="mentors-tag-btn px-4 py-2 rounded-full text-sm font-medium transition-all hover-lift"
                style={active ? { backgroundColor: 'var(--warm)', color: '#2A1700' } : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                {tag}
              </button>
            );
          })}

          {availableTags.length > 9 && (
            <button onClick={() => setShowAllTags(!showAllTags)} className="px-4 py-2 rounded-full text-sm font-medium transition-all hover-scale" style={{ color: 'var(--accent)' }}>
              {showAllTags ? t('mentors.show_less') : `+${availableTags.length - 9} ${t('mentors.show_more_others')}`}
            </button>
          )}

          {hasActiveFilters && (
            <button onClick={resetFilters} className="px-4 py-2 rounded-full text-sm font-medium transition-all hover-scale" style={{ color: 'var(--danger)' }}>
              {t('mentors.reset')}
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="card p-12 text-center fade-in-up">
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{t('mentors.no_results')}</p>
          </div>
        ) : (
          <>
            <p className="text-sm mb-4 fade-in-up" style={{ color: 'var(--text-tertiary)' }}>
              {filteredMentors.length} {t('mentors.found_label')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredMentors.map((mentor, idx) => {
                const extraCompetences = (mentor.competences || []).slice(4);
                const isHovered = hoveredMentor === mentor.id;

                return (
                  <div
                    key={mentor.id}
                    className="card p-5 flex flex-col mentor-card-in mentor-hover-card"
                    style={{ animationDelay: `${Math.min(idx, 12) * 0.04}s` }}
                    onMouseEnter={() => setHoveredMentor(mentor.id)}
                    onMouseLeave={() => setHoveredMentor(null)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="mentor-avatar-img transition-all duration-400 ease-bounce">
                        <Avatar photoUrl={mentor.photo_url} prenom={mentor.prenom} nom={mentor.nom} size={56} rounded="xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold leading-tight truncate mentor-name-hover" style={{ color: isHovered ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {mentor.prenom} {mentor.nom}
                        </h3>
                        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                          {mentor.domaine || t('mentors.expert')}
                        </p>
                        <div className="flex items-center gap-1 mt-1 mentor-rating-hover">
                          <Star className="w-3.5 h-3.5" style={{ color: 'var(--warm)', fill: 'var(--warm)' }} />
                          <span className="font-mono-data text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {getNoteDisplay(mentor.note_moyenne)}
                          </span>
                          {mentor.nb_avis !== undefined && (
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>({mentor.nb_avis} avis)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {mentor.competences && mentor.competences.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {mentor.competences.slice(0, 4).map((comp, ci) => (
                          <span key={ci} className="text-xs px-2.5 py-1 rounded-full font-medium competence-chip-hover" style={{ backgroundColor: 'var(--warm-soft)', color: 'var(--warm-text-on-soft)' }}>
                            {comp}
                          </span>
                        ))}
                        {extraCompetences.length > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            +{extraCompetences.length}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-mono-data">{mentor.nb_sessions || 0} sessions</span>
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: mentor.disponible ? 'var(--success)' : 'var(--text-tertiary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full status-dot-hover" style={{ backgroundColor: mentor.disponible ? 'var(--success)' : 'var(--text-tertiary)' }} />
                        {mentor.disponible ? t('mentors.available') : t('mentors.unavailable')}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Link href={`/mentors/${mentor.id}`} className="mentors-cta-btn flex-1 text-center px-3 py-2.5 rounded-xl font-medium text-sm transition-all hover-btn-primary" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                        {t('mentors.view_profile')}
                      </Link>
                      <Link href={`/sessions/new?mentor=${mentor.id}`} className="mentors-cta-btn px-3 py-2.5 rounded-xl flex items-center justify-center transition-all hover-btn-icon" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--accent)' }} title="Réserver une session">
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

        @keyframes mentorsFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 30px) scale(1.06); }
        }
        @keyframes mentorsFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -20px) scale(1.08); }
        }

        .fade-in-up {
          opacity: 0;
          transform: translateY(12px);
          animation: mentorsFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes mentorsFadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .mentor-card-in {
          opacity: 0;
          transform: translateY(16px) scale(0.98);
          animation: mentorsCardIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes mentorsCardIn {
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .panel-in {
          opacity: 0;
          transform: translateY(-6px);
          animation: mentorsFadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .mentors-input {
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .mentors-input:focus {
          border-color: var(--accent) !important;
        }

        /* ─── ANIMATIONS DE SURVOL ─── */
        .hover-gradient-text {
          transition: all 0.4s ease;
          cursor: default;
          display: inline-block;
        }
        .hover-gradient-text:hover {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hover-lift {
          transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
        }
        .hover-lift:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }

        .hover-scale {
          transition: transform 0.2s ease;
        }
        .hover-scale:hover {
          transform: scale(1.08);
        }

        .range-slider {
          transition: opacity 0.2s ease;
        }
        .range-slider:hover {
          opacity: 0.8;
        }

        /* Cartes mentor */
        .mentor-hover-card {
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
        }
        .mentor-hover-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.14);
          border-color: var(--accent) !important;
        }

        .mentor-avatar-img {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .mentor-hover-card:hover .mentor-avatar-img {
          transform: scale(1.1);
        }

        .mentor-name-hover {
          transition: color 0.3s ease;
        }

        .mentor-rating-hover {
          transition: transform 0.3s ease;
        }
        .mentor-hover-card:hover .mentor-rating-hover {
          transform: scale(1.05);
        }

        .competence-chip-hover {
          transition: all 0.3s ease;
        }
        .competence-chip-hover:hover {
          transform: translateY(-2px) scale(1.08);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .status-dot-hover {
          transition: transform 0.3s ease;
        }
        .mentor-hover-card:hover .status-dot-hover {
          transform: scale(1.5);
        }

        /* Boutons */
        .mentors-filter-btn,
        .mentors-tag-btn,
        .mentors-cta-btn {
          transition: transform 0.15s ease, filter 0.15s ease;
        }
        .mentors-filter-btn:hover,
        .mentors-tag-btn:hover,
        .mentors-cta-btn:hover {
          transform: translateY(-2px);
        }
        .mentors-filter-btn:active,
        .mentors-tag-btn:active,
        .mentors-cta-btn:active {
          transform: scale(0.97);
        }

        .hover-btn-primary {
          transition: all 0.3s ease;
        }
        .hover-btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }

        .hover-btn-icon {
          transition: all 0.3s ease;
        }
        .hover-btn-icon:hover {
          background-color: var(--accent-soft) !important;
          transform: translateY(-2px);
        }

        @media (prefers-reduced-motion: reduce) {
          .mentors-orb, .fade-in-up, .mentor-card-in, .panel-in,
          .mentor-hover-card, .hover-lift, .hover-scale {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}