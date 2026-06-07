'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Clock, Users, Star } from 'lucide-react';
import { publicAPI, BACKEND_URL } from '@/services/api';

interface Mentor {
  id: string; nom: string; prenom: string; domaine: string;
  note_moyenne: number; nb_sessions: number; annees_experience: number;
  photo_url: string | null; competences: string[]; disponible: boolean;
}

export default function MentorsPage() {
  const [mentors,    setMentors]    = useState<Mentor[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [domaine,    setDomaine]    = useState('');
  const [competence, setCompetence] = useState('');
  const [disponible, setDisponible] = useState('');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const LIMIT = 12;

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { setPage(1); }, [debouncedSearch, domaine, competence, disponible]);
  useEffect(() => { fetchMentors(); }, [debouncedSearch, domaine, competence, disponible, page]);

  const getPhotoUrl = (url: string) => url.startsWith('http') ? url : `${BACKEND_URL}${url}`;

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: LIMIT };
      if (debouncedSearch) params.search     = debouncedSearch;
      if (domaine)         params.domaine    = domaine;
      if (competence)      params.competence = competence;
      if (disponible)      params.disponible = disponible;
      const response = await publicAPI.searchMentors(params);
      setMentors(response.data.data || []);
      setTotal(response.data.pagination?.total ?? 0);
    } catch {}
    finally { setLoading(false); }
  };

  const reset = () => { setSearchTerm(''); setDomaine(''); setCompetence(''); setDisponible(''); setPage(1); };

  const getNoteDisplay = (note: any) => {
    const n = Number(note);
    return isNaN(n) || n === 0 ? 'Nouveau' : n.toFixed(1);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-[#F5F7FB]">

      {/* Header */}
      <div className="bg-[#0A3B8A] text-white">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Nos Mentors</h1>
          <p className="text-blue-200 text-lg">Des experts passionnés prêts à vous accompagner</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-4 -mt-6 mb-8 relative z-10">
        <div className="bg-white rounded-2xl border border-[#E5EAF2] shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1E3A5F]/40 w-4 h-4" />
              <input type="text" placeholder="Rechercher un mentor..."
                className="w-full pl-10 pr-4 py-2.5 border border-[#E5EAF2] rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent bg-[#F5F7FB] text-[#1E3A5F] placeholder:text-[#1E3A5F]/40 text-sm outline-none"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <input type="text" placeholder="Domaine"
              className="px-4 py-2.5 border border-[#E5EAF2] rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent bg-[#F5F7FB] text-[#1E3A5F] placeholder:text-[#1E3A5F]/40 text-sm outline-none"
              value={domaine} onChange={(e) => setDomaine(e.target.value)} />
            <input type="text" placeholder="Compétence (ex: Python)"
              className="px-4 py-2.5 border border-[#E5EAF2] rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent bg-[#F5F7FB] text-[#1E3A5F] placeholder:text-[#1E3A5F]/40 text-sm outline-none"
              value={competence} onChange={(e) => setCompetence(e.target.value)} />
            <div className="flex gap-2">
              <select
                className="flex-1 px-3 py-2.5 border border-[#E5EAF2] rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent bg-[#F5F7FB] text-[#1E3A5F] text-sm outline-none"
                value={disponible} onChange={(e) => setDisponible(e.target.value)}>
                <option value="">Tous</option>
                <option value="true">Disponibles</option>
              </select>
              <button onClick={reset}
                className="px-3 py-2.5 bg-[#F5F7FB] border border-[#E5EAF2] text-[#1E3A5F] rounded-lg hover:bg-[#E5EAF2] transition-colors text-sm whitespace-nowrap">
                Réinitialiser
              </button>
            </div>
          </div>
          {total > 0 && <p className="text-sm text-[#1E3A5F]/50 mt-3">{total} mentor(s) trouvé(s)</p>}
        </div>
      </div>

      {/* Grille */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-14 h-14 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E5EAF2]">
            <p className="text-[#1E3A5F]/60 text-lg mb-4">Aucun mentor trouvé</p>
            <button onClick={reset} className="text-[#3B82F6] hover:underline text-sm">Réinitialiser les filtres</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {mentors.map((mentor) => (
                <div key={mentor.id}
                  className="bg-white rounded-2xl border border-[#E5EAF2] p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-[#0A3B8A] flex items-center justify-center">
                      {mentor.photo_url
                        ? <img src={getPhotoUrl(mentor.photo_url)} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xl font-bold text-white">{mentor.prenom?.[0]}{mentor.nom?.[0]}</span>
                      }
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                      <span className="font-semibold text-[#1E3A5F] text-sm">{getNoteDisplay(mentor.note_moyenne)}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-[#1E3A5F] mb-1">{mentor.prenom} {mentor.nom}</h3>
                  <p className="text-[#3B82F6] text-sm font-medium mb-3">{mentor.domaine || 'Expert'}</p>

                  <div className="flex items-center gap-4 text-sm text-[#1E3A5F]/50 mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{mentor.annees_experience ?? 0} ans</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{mentor.nb_sessions ?? 0} sessions</span>
                  </div>

                  <div className="mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      mentor.disponible ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                    }`}>
                      {mentor.disponible ? '● Disponible' : '● Indisponible'}
                    </span>
                  </div>

                  {mentor.competences?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {mentor.competences.slice(0, 3).map((c, i) => (
                        <span key={i} className="bg-[#F5F7FB] border border-[#E5EAF2] text-[#1E3A5F] text-xs px-2 py-1 rounded-full">{c}</span>
                      ))}
                      {mentor.competences.length > 3 && (
                        <span className="bg-[#F5F7FB] border border-[#E5EAF2] text-[#1E3A5F]/40 text-xs px-2 py-1 rounded-full">+{mentor.competences.length - 3}</span>
                      )}
                    </div>
                  )}

                  <Link href={`/mentors/${mentor.id}`}
                    className="block w-full text-center px-4 py-2 rounded-lg border-2 border-[#3B82F6] text-[#3B82F6] hover:bg-blue-50 transition-colors font-medium text-sm">
                    Voir le profil
                  </Link>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#1E3A5F] hover:bg-[#F5F7FB] disabled:opacity-40 text-sm">
                  ← Précédent
                </button>
                <span className="px-4 py-2 text-[#1E3A5F]/60 text-sm self-center">Page {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-white border border-[#E5EAF2] text-[#1E3A5F] hover:bg-[#F5F7FB] disabled:opacity-40 text-sm">
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}