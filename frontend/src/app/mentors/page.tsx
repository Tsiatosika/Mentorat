'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Clock, Users, Star, CalendarPlus, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicAPI } from '@/services/api';

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

const AVATAR_PALETTE = [
  { bg: 'var(--accent-soft)', fg: 'var(--accent-text-on-soft)' },
  { bg: 'var(--warm-soft)', fg: 'var(--warm-text-on-soft)' },
  { bg: 'var(--info-soft)', fg: 'var(--info)' },
];

function avatarTone(seed: string) {
  const index = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

export default function MentorsPage() {
  const { t } = useLanguage();
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

  useEffect(() => {
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

      const matchesTags =
        activeTags.length === 0 ||
        activeTags.every((tag) => (mentor.competences || []).includes(tag));

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
  };

  const hasActiveFilters = searchTerm || onlyAvailable || activeTags.length > 0 || minNote > 0 || minExperience > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-8">
        <p className="font-mono-data text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
          {t('mentors.subtitle')}
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('nav.mentors')}
        </h1>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="max-w-7xl mx-auto px-4 mb-8 space-y-4">
        {/* Recherche + tri */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              placeholder={t('mentors.search_placeholder')}
              className="w-full pl-12 pr-4 py-4 rounded-2xl outline-none transition-all text-base"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-card)',
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="w-full md:w-56 h-full pl-11 pr-4 py-4 rounded-2xl outline-none appearance-none text-sm font-medium"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
            <ArrowUpDown
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-tertiary)' }}
            />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-sm font-medium transition-colors"
            style={
              showAdvanced
                ? { backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)', border: '1px solid var(--border)' }
                : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres avancés
          </button>
        </div>

        {/* Panneau de filtres avancés */}
        {showAdvanced && (
          <div className="card p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex justify-between text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                <span>Note minimum</span>
                <span className="font-mono-data" style={{ color: 'var(--accent)' }}>{minNote > 0 ? `${minNote}+` : 'Toutes'}</span>
              </label>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={minNote}
                onChange={(e) => setMinNote(parseFloat(e.target.value))}
                className="w-full"
                style={{ accentColor: 'var(--accent)' }}
              />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                <span>Expérience minimum</span>
                <span className="font-mono-data" style={{ color: 'var(--accent)' }}>{minExperience > 0 ? `${minExperience}+ ans` : 'Toutes'}</span>
              </label>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={minExperience}
                onChange={(e) => setMinExperience(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
        )}

        {/* Tags de filtre */}
        <div className="flex items-start gap-3 flex-wrap">
          <button
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={
              onlyAvailable
                ? { backgroundColor: 'var(--accent)', color: '#06231D' }
                : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
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
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={
                  active
                    ? { backgroundColor: 'var(--warm)', color: '#2A1700' }
                    : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                }
              >
                {tag}
              </button>
            );
          })}

          {availableTags.length > 9 && (
            <button
              onClick={() => setShowAllTags(!showAllTags)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{ color: 'var(--accent)' }}
            >
              {showAllTags ? 'Voir moins' : `+${availableTags.length - 9} autres`}
            </button>
          )}

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{ color: 'var(--danger)' }}
            >
              {t('mentors.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Résultats */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{t('mentors.no_results')}</p>
          </div>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {filteredMentors.length} mentor{filteredMentors.length > 1 ? 's' : ''} trouvé{filteredMentors.length > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredMentors.map((mentor) => {
                const initials = `${mentor.prenom?.[0] || ''}${mentor.nom?.[0] || ''}`.toUpperCase();
                const tone = avatarTone(mentor.id);
                const extraCompetences = (mentor.competences || []).slice(4);

                return (
                  <div key={mentor.id} className="card card-hover bookmark p-5 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 font-mono-data font-bold text-lg"
                        style={{ backgroundColor: tone.bg, color: tone.fg }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
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
                          {mentor.nb_avis !== undefined && (
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              ({mentor.nb_avis} avis)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {mentor.competences && mentor.competences.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {mentor.competences.slice(0, 4).map((comp, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ backgroundColor: 'var(--warm-soft)', color: 'var(--warm-text-on-soft)' }}
                          >
                            {comp}
                          </span>
                        ))}
                        {extraCompetences.length > 0 && (
                          <span
                            className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                          >
                            +{extraCompetences.length}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-mono-data">{mentor.nb_sessions || 0} sessions</span>
                      <span
                        className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: mentor.disponible ? 'var(--success)' : 'var(--text-tertiary)' }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: mentor.disponible ? 'var(--success)' : 'var(--text-tertiary)' }}
                        />
                        {mentor.disponible ? t('mentors.available') : 'Indisponible'}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Link
                        href={`/mentors/${mentor.id}`}
                        className="flex-1 text-center px-3 py-2.5 rounded-xl font-medium text-sm transition-colors"
                        style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                      >
                        {t('mentors.view_profile')}
                      </Link>
                      <Link
                        href={`/sessions/new?mentor=${mentor.id}`}
                        className="px-3 py-2.5 rounded-xl flex items-center justify-center transition-colors"
                        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                        title="Réserver une session"
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
    </div>
  );
}