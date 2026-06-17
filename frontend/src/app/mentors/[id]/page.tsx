'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Users, Star, CheckCircle, XCircle, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { publicAPI } from '@/services/api';
import { QuickBooking } from '@/components/mentors/QuickBooking';
import toast from 'react-hot-toast';

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mentorId = params.id as string;

  useEffect(() => {
    if (mentorId) {
      fetchMentor();
    }
  }, [mentorId]);

  const fetchMentor = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching mentor with ID:', mentorId);
      const response = await publicAPI.getMentorById(mentorId);
      console.log('📦 Response:', response.data);
      
      if (response.data.success && response.data.mentor) {
        const mentorData = response.data.mentor;
        console.log('✅ Mentor chargé:', mentorData);
        console.log('✅ Mentor ID:', mentorData.id);
        setMentor(mentorData);
      } else {
        setError(response.data.message || 'Mentor non trouvé');
      }
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setError(error.response?.data?.message || 'Erreur lors du chargement');
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getNoteDisplay = (note: any) => {
    if (!note || note === 0 || note === '0') return 'Nouveau';
    const numNote = parseFloat(note);
    if (isNaN(numNote) || numNote === 0) return 'Nouveau';
    return numNote.toFixed(1);
  };

  const getJourLabel = (jour: string) => {
    const jours: Record<string, string> = {
      lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi',
      jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche'
    };
    return jours[jour] || jour;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mentor non trouvé</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Ce mentor n\'existe pas ou a été supprimé.'}</p>
          <button
            onClick={() => router.back()}
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8 text-white">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-5xl font-bold text-white border-4 border-white/30">
                {mentor.prenom?.[0]}{mentor.nom?.[0]}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold">{mentor.prenom} {mentor.nom}</h1>
                <p className="text-indigo-100 text-lg">{mentor.domaine || 'Expert'}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 justify-center md:justify-start">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold">{getNoteDisplay(mentor.note_moyenne)}/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-5 h-5 text-white/80" />
                    <span>{mentor.nb_sessions || 0} sessions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-5 h-5 text-white/80" />
                    <span>{mentor.annees_experience || 0} ans</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {mentor.disponible ? (
                      <><CheckCircle className="w-5 h-5 text-green-300" /><span>Disponible</span></>
                    ) : (
                      <><XCircle className="w-5 h-5 text-red-300" /><span>Indisponible</span></>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">À propos</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {mentor.bio || 'Aucune description disponible.'}
                  </p>
                </div>

                {mentor.competences && mentor.competences.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Compétences</h2>
                    <div className="flex flex-wrap gap-2">
                      {mentor.competences.map((comp: string, index: number) => (
                        <span key={index} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📅 Réserver une session</h2>
                  {user ? (
                    user.role === 'mentore' ? (
                      mentor && mentor.id ? (
                        <QuickBooking 
                          mentorId={mentor.id} 
                          mentorName={`${mentor.prenom} ${mentor.nom}`} 
                        />
                      ) : (
                        <p className="text-sm text-red-500 dark:text-red-400 text-center">
                          ID du mentor non disponible
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Vous devez être un mentoré pour réserver.
                      </p>
                    )
                  ) : (
                    <Link
                      href={`/login?redirect=/mentors/${mentor.id}`}
                      className="block w-full text-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Connectez-vous pour réserver
                    </Link>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-indigo-600" />
                    Contact
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${mentor.email}`} className="hover:text-indigo-600">
                        {mentor.email}
                      </a>
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
