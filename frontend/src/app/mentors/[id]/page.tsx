'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Users, Star, MessageCircle, Award, FileText } from 'lucide-react';
import { publicAPI, disponibiliteAPI, competenceAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface MentorDetail {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  photo_url: string | null;
  bio: string | null;
  domaine: string | null;
  annees_experience: number;
  note_moyenne: number;
  nb_sessions: number;
  disponible: boolean;
  competences: string[];
}

interface Disponibilite {
  id: string;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
}

interface Competence {
  id: string;
  nom: string;
  niveau: string;
}

const JOURS: Record<string, string> = {
  lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi',
  jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche',
};

const ORDRE_JOURS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];

export default function MentorDetailPage() {
  const params     = useParams();
  const { user }   = useAuth();
  const mentorId   = params.id as string;

  const [mentor,         setMentor]         = useState<MentorDetail | null>(null);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [competences,    setCompetences]    = useState<Competence[]>([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // CORRECTION 1 : charger mentor + compétences + dispos en parallèle
        const [mentorRes, dispoRes, compRes] = await Promise.allSettled([
          publicAPI.getMentorById(mentorId),
          disponibiliteAPI.getByMentor(mentorId),
          competenceAPI.getAll().then((r) => ({ data: { competences: [] } })), // fallback
          // Si vous avez un endpoint /competences/mentor/:id, utilisez-le ici
        ]);

        if (mentorRes.status === 'fulfilled') {
          setMentor(mentorRes.value.data.mentor);
        }
        if (dispoRes.status === 'fulfilled') {
          // Trier par ordre de la semaine
          const sorted = (dispoRes.value.data.disponibilites || []).sort(
            (a: Disponibilite, b: Disponibilite) =>
              ORDRE_JOURS.indexOf(a.jour_semaine) - ORDRE_JOURS.indexOf(b.jour_semaine)
          );
          setDisponibilites(sorted);
        }

        // CORRECTION 2 : les compétences sont déjà dans le profil mentor (tableau de strings)
        // Elles sont dans mentor.competences depuis getMentorById
      } catch {
        console.error('Erreur chargement profil mentor');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [mentorId]);

  const getNoteDisplay = (note: any) => {
    const n = Number(note);
    return isNaN(n) || n === 0 ? 'Nouveau' : n.toFixed(1);
  };

  const formatHeure = (h: string) => h?.substring(0, 5) ?? '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Mentor non trouvé</p>
          <Link href="/mentors" className="text-indigo-600 hover:underline">Retour à la liste</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/mentors"
            className="inline-flex items-center gap-2 text-white hover:text-indigo-200 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Retour aux mentors
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Bannière profil */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-10">
            <div className="flex flex-wrap items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
                {mentor.photo_url
                  ? <img src={mentor.photo_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-4xl font-bold text-white">{mentor.prenom?.[0]}{mentor.nom?.[0]}</span>
                }
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{mentor.prenom} {mentor.nom}</h1>
                <p className="text-indigo-100 text-lg">{mentor.domaine || 'Expert'}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1 text-white">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {getNoteDisplay(mentor.note_moyenne)}/5
                  </span>
                  <span className="flex items-center gap-1 text-white/90">
                    <Users className="w-4 h-4" /> {mentor.nb_sessions} sessions
                  </span>
                  <span className="flex items-center gap-1 text-white/90">
                    <Clock className="w-4 h-4" /> {mentor.annees_experience} ans d'expérience
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    mentor.disponible ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'
                  }`}>
                    {mentor.disponible ? '● Disponible' : '● Indisponible'}
                  </span>
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
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">À propos</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {mentor.bio || 'Aucune description disponible.'}
                  </p>
                </section>

                {/* Compétences — depuis mentor.competences (array de strings) */}
                {mentor.competences?.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Compétences</h2>
                    <div className="flex flex-wrap gap-2">
                      {mentor.competences.map((comp, i) => (
                        <span key={i}
                          className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Colonne droite */}
              <div className="space-y-6">

                {/* Disponibilités */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" /> Disponibilités
                  </h2>
                  {disponibilites.length > 0 ? (
                    <div className="space-y-2">
                      {disponibilites.map((d) => (
                        <div key={d.id} className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">{JOURS[d.jour_semaine] ?? d.jour_semaine}</span>
                          <span className="text-gray-600">{formatHeure(d.heure_debut)} – {formatHeure(d.heure_fin)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Aucun créneau renseigné</p>
                  )}
                </div>

                {/* Statistiques */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" /> Statistiques
                  </h2>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Sessions réalisées', mentor.nb_sessions ?? 0],
                      ['Note moyenne', `${getNoteDisplay(mentor.note_moyenne)}/5`],
                      ['Expérience', `${mentor.annees_experience ?? 0} ans`],
                    ].map(([label, value]) => (
                      <div key={label as string} className="flex justify-between">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-semibold text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Réservation */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-indigo-600" /> Réserver
                  </h2>
                  {/* CORRECTION 3 : montrer le bouton seulement aux mentorés connectés */}
                  {!user ? (
                    <Link href="/login"
                      className="block w-full text-center bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm">
                      Connectez-vous pour réserver
                    </Link>
                  ) : user.role === 'mentore' ? (
                    <Link href={`/sessions/new?mentor=${mentor.id}`}
                      className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all text-sm">
                      Réserver une session
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-500 text-center">
                      Seuls les mentorés peuvent réserver une session.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}