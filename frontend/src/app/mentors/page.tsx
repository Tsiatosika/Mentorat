'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Clock, Users, Star } from 'lucide-react';
import { publicAPI } from '@/services/api';

interface Mentor {
  id: string;
  nom: string;
  prenom: string;
  domaine: string;
  note_moyenne: number;
  nb_sessions: number;
  annees_experience: number;
  photo_url: string;
  competences: string[];
  disponible: boolean;
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [domaine, setDomaine] = useState('');
  const [disponible, setDisponible] = useState('');

  useEffect(() => {
    fetchMentors();
  }, [searchTerm, domaine, disponible]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (domaine) params.domaine = domaine;
      if (disponible === 'true') params.disponible = true;
      
      const response = await publicAPI.searchMentors(params);
      setMentors(response.data.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNoteDisplay = (note: any) => {
    if (!note) return 'Nouveau';
    const numNote = Number(note);
    if (isNaN(numNote)) return 'Nouveau';
    return numNote.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nos Mentors</h1>
          <p className="text-xl text-indigo-100">
            Des experts passionnés prêts à vous accompagner dans votre parcours
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un mentor..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <input
              type="text"
              placeholder="Domaine (ex: Informatique)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={domaine}
              onChange={(e) => setDomaine(e.target.value)}
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={disponible}
              onChange={(e) => setDisponible(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="true">Disponibles</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setDomaine('');
                setDisponible('');
              }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des mentors */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md">
            <p className="text-gray-500 text-lg">Aucun mentor trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div key={mentor.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-white">
                        {mentor.prenom?.[0]}{mentor.nom?.[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="font-semibold">{getNoteDisplay(mentor.note_moyenne)}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {mentor.prenom} {mentor.nom}
                  </h3>
                  <p className="text-indigo-600 text-sm font-medium mb-2">{mentor.domaine || 'Expert'}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {mentor.annees_experience || 0} ans exp.
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {mentor.nb_sessions || 0} sessions
                    </span>
                  </div>
                  {mentor.competences && mentor.competences.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mentor.competences.slice(0, 3).map((comp, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}
                  <Link
                    href={`/mentors/${mentor.id}`}
                    className="block w-full text-center px-4 py-2 rounded-lg border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
                  >
                    Voir le profil
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}