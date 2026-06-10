'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Clock, Users, Star, MapPin, Briefcase } from 'lucide-react';
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

  const resetFilters = () => {
    setSearchTerm('');
    setDomaine('');
    setDisponible('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des mentors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Nos Mentors</h1>
          <p className="text-indigo-100">Des experts passionnés prêts à vous accompagner</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-4 -mt-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un mentor..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <input
              type="text"
              placeholder="Domaine (ex: Informatique)"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={domaine}
              onChange={(e) => setDomaine(e.target.value)}
            />
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={disponible}
              onChange={(e) => setDisponible(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="true">Disponibles</option>
            </select>
            <button
              onClick={resetFilters}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des mentors */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {mentors.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <p className="text-gray-500 dark:text-gray-400">Aucun mentor trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div key={mentor.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xl font-bold text-white">
                        {mentor.prenom?.[0]}{mentor.nom?.[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {getNoteDisplay(mentor.note_moyenne)}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {mentor.prenom} {mentor.nom}
                  </h3>
                  <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3">
                    {mentor.domaine || 'Expert'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {mentor.annees_experience || 0} ans
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {mentor.nb_sessions || 0} sessions
                    </span>
                  </div>
                  {mentor.competences && mentor.competences.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mentor.competences.slice(0, 3).map((comp, idx) => (
                        <span key={idx} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${mentor.disponible ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {mentor.disponible ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                  <Link
                    href={`/mentors/${mentor.id}`}
                    className="block w-full text-center px-4 py-2 rounded-lg border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors font-medium"
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
