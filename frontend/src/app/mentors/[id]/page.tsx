'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Users, Star, Briefcase, Mail, MapPin, Award, BookOpen } from 'lucide-react';
import { publicAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface MentorDetail {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  photo_url: string;
  bio: string;
  domaine: string;
  annees_experience: number;
  note_moyenne: number;
  nb_sessions: number;
  disponible: boolean;
  competences: Array<{ id: string; nom: string; niveau: string }>;
  disponibilites: Array<{ id: string; jour_semaine: string; heure_debut: string; heure_fin: string }>;
}

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [mentor, setMentor] = useState<MentorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        const response = await publicAPI.getMentorById(params.id as string);
        setMentor(response.data.mentor);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMentor();
  }, [params.id]);

  const getNoteDisplay = (note: any) => {
    if (!note) return 'Nouveau';
    const numNote = Number(note);
    if (isNaN(numNote)) return 'Nouveau';
    return numNote.toFixed(1);
  };

  const joursFr: Record<string, string> = {
    lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi',
    jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Mentor non trouvé</p>
          <Link href="/mentors" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/mentors" className="inline-flex items-center gap-2 text-white hover:text-indigo-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Retour aux mentors
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header du profil */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl font-bold text-white">
                  {mentor.prenom?.[0]}{mentor.nom?.[0]}
                </span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {mentor.prenom} {mentor.nom}
                </h1>
                <p className="text-indigo-100 text-lg">{mentor.domaine || 'Expert'}</p>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-white font-semibold">{getNoteDisplay(mentor.note_moyenne)}/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-5 h-5 text-white/80" />
                    <span className="text-white">{mentor.nb_sessions} sessions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-5 h-5 text-white/80" />
                    <span className="text-white">{mentor.annees_experience} ans d'expérience</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${mentor.disponible ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {mentor.disponible ? 'Disponible' : 'Indisponible'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Colonne gauche */}
              <div className="lg:col-span-2 space-y-6">
                {/* Bio */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">À propos</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {mentor.bio || 'Aucune description disponible.'}
                  </p>
                </div>

                {/* Compétences */}
                {mentor.competences && mentor.competences.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Compétences</h2>
                    <div className="flex flex-wrap gap-2">
                      {mentor.competences.map((comp) => (
                        <span key={comp.id} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-sm">
                          {comp.nom} • {comp.niveau}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Colonne droite */}
              <div className="space-y-6">
                {/* Disponibilités */}
                {mentor.disponibilites && mentor.disponibilites.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Disponibilités
                    </h2>
                    <div className="space-y-2">
                      {mentor.disponibilites.map((dispo) => (
                        <div key={dispo.id} className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{joursFr[dispo.jour_semaine]}</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {dispo.heure_debut.substring(0, 5)} - {dispo.heure_fin.substring(0, 5)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bouton de réservation */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Réserver
                  </h2>
                  {user ? (
                    <Link
                      href={`/sessions/new?mentor=${mentor.id}`}
                      className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
                    >
                      Réserver une session
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
                    >
                      Connectez-vous pour réserver
                    </Link>
                  )}
                </div>

                {/* Stats */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Statistiques
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sessions réalisées</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{mentor.nb_sessions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Note moyenne</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{getNoteDisplay(mentor.note_moyenne)}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Expérience</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{mentor.annees_experience} ans</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
