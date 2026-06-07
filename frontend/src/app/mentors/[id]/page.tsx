'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Users, Star, MessageCircle, Award } from 'lucide-react';
import { publicAPI, disponibiliteAPI, BACKEND_URL } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface MentorDetail {
  id: string; nom: string; prenom: string; email: string;
  photo_url: string | null; bio: string | null; domaine: string | null;
  annees_experience: number; note_moyenne: number; nb_sessions: number;
  disponible: boolean; competences: string[];
}
interface Disponibilite { id: string; jour_semaine: string; heure_debut: string; heure_fin: string; }

const JOURS: Record<string, string> = {
  lundi:'Lundi', mardi:'Mardi', mercredi:'Mercredi',
  jeudi:'Jeudi', vendredi:'Vendredi', samedi:'Samedi', dimanche:'Dimanche',
};
const ORDRE_JOURS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];

export default function MentorDetailPage() {
  const params   = useParams();
  const { user } = useAuth();
  const mentorId = params.id as string;
  const [mentor,         setMentor]         = useState<MentorDetail | null>(null);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [loading,        setLoading]        = useState(true);

  const getPhotoUrl = (url: string) => url.startsWith('http') ? url : `${BACKEND_URL}${url}`;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [mentorRes, dispoRes] = await Promise.allSettled([
          publicAPI.getMentorById(mentorId),
          disponibiliteAPI.getByMentor(mentorId),
        ]);
        if (mentorRes.status === 'fulfilled') setMentor(mentorRes.value.data.mentor);
        if (dispoRes.status === 'fulfilled') {
          const sorted = (dispoRes.value.data.disponibilites || []).sort(
            (a: Disponibilite, b: Disponibilite) =>
              ORDRE_JOURS.indexOf(a.jour_semaine) - ORDRE_JOURS.indexOf(b.jour_semaine)
          );
          setDisponibilites(sorted);
        }
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, [mentorId]);

  const getNoteDisplay = (note: any) => { const n = Number(note); return isNaN(n) || n === 0 ? 'Nouveau' : n.toFixed(1); };
  const formatHeure = (h: string) => h?.substring(0, 5) ?? '';

  if (loading) return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
      <div className="w-14 h-14 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!mentor) return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[#1E3A5F]/60 text-lg mb-4">Mentor non trouvé</p>
        <Link href="/mentors" className="text-[#3B82F6] hover:underline">Retour à la liste</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FB]">

      {/* Header */}
      <div className="bg-[#0A3B8A] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/mentors" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Retour aux mentors
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-[#E5EAF2] overflow-hidden">

          {/* Bannière profil */}
          <div className="bg-[#0A3B8A] px-8 py-10">
            <div className="flex flex-wrap items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#3B82F6] flex items-center justify-center flex-shrink-0">
                {mentor.photo_url
                  ? <img src={getPhotoUrl(mentor.photo_url)} alt="" className="w-full h-full object-cover" />
                  : <span className="text-4xl font-bold text-white">{mentor.prenom?.[0]}{mentor.nom?.[0]}</span>
                }
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{mentor.prenom} {mentor.nom}</h1>
                <p className="text-blue-200 text-lg">{mentor.domaine || 'Expert'}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1 text-white">
                    <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                    {getNoteDisplay(mentor.note_moyenne)}/5
                  </span>
                  <span className="flex items-center gap-1 text-blue-100">
                    <Users className="w-4 h-4" /> {mentor.nb_sessions} sessions
                  </span>
                  <span className="flex items-center gap-1 text-blue-100">
                    <Clock className="w-4 h-4" /> {mentor.annees_experience} ans d'expérience
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    mentor.disponible ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#EF4444]/20 text-[#EF4444]'
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

              {/* Gauche */}
              <div className="lg:col-span-2 space-y-6">
                <section>
                  <h2 className="text-lg font-semibold text-[#1E3A5F] mb-3">À propos</h2>
                  <p className="text-[#1E3A5F]/70 leading-relaxed text-sm">
                    {mentor.bio || 'Aucune description disponible.'}
                  </p>
                </section>
                {mentor.competences?.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-[#1E3A5F] mb-3">Compétences</h2>
                    <div className="flex flex-wrap gap-2">
                      {mentor.competences.map((comp, i) => (
                        <span key={i} className="bg-[#F5F7FB] border border-[#E5EAF2] text-[#1E3A5F] px-3 py-1 rounded-full text-sm">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Droite */}
              <div className="space-y-4">

                {/* Disponibilités */}
                <div className="bg-[#F5F7FB] border border-[#E5EAF2] rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-[#1E3A5F] mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#3B82F6]" /> Disponibilités
                  </h2>
                  {disponibilites.length > 0 ? (
                    <div className="space-y-2">
                      {disponibilites.map((d) => (
                        <div key={d.id} className="flex justify-between text-sm">
                          <span className="font-medium text-[#1E3A5F]">{JOURS[d.jour_semaine] ?? d.jour_semaine}</span>
                          <span className="text-[#1E3A5F]/60">{formatHeure(d.heure_debut)} – {formatHeure(d.heure_fin)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-[#1E3A5F]/40">Aucun créneau renseigné</p>}
                </div>

                {/* Statistiques */}
                <div className="bg-[#F5F7FB] border border-[#E5EAF2] rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-[#1E3A5F] mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#3B82F6]" /> Statistiques
                  </h2>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Sessions réalisées', mentor.nb_sessions ?? 0],
                      ['Note moyenne',       `${getNoteDisplay(mentor.note_moyenne)}/5`],
                      ['Expérience',         `${mentor.annees_experience ?? 0} ans`],
                    ].map(([label, value]) => (
                      <div key={label as string} className="flex justify-between">
                        <span className="text-[#1E3A5F]/60">{label}</span>
                        <span className="font-semibold text-[#1E3A5F]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="bg-[#F5F7FB] border border-[#E5EAF2] rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-[#1E3A5F] mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#3B82F6]" /> Réserver
                  </h2>
                  {!user ? (
                    <Link href="/login"
                      className="block w-full text-center bg-[#3B82F6] text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm">
                      Connectez-vous pour réserver
                    </Link>
                  ) : user.role === 'mentore' ? (
                    <Link href={`/sessions/new?mentor=${mentor.id}`}
                      className="block w-full text-center bg-[#3B82F6] text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm">
                      Réserver une session
                    </Link>
                  ) : (
                    <p className="text-sm text-[#1E3A5F]/50 text-center">Seuls les mentorés peuvent réserver.</p>
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