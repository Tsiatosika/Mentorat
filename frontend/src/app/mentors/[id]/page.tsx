'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Users, Star, CheckCircle, XCircle, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicAPI } from '@/services/api';
import { QuickBooking } from '@/components/mentors/QuickBooking';
import toast from 'react-hot-toast';

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mentorId = params.id as string;

  useEffect(() => {
    if (mentorId) fetchMentor();
  }, [mentorId]);

  const fetchMentor = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await publicAPI.getMentorById(mentorId);
      if (response.data.success && response.data.mentor) {
        setMentor(response.data.mentor);
      } else {
        setError(t('common.error'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError(t('common.error'));
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const getNoteDisplay = (note: any) => {
    if (!note || note === 0) return t('common.new');
    const numNote = typeof note === 'string' ? parseFloat(note) : note;
    if (isNaN(numNote) || numNote === 0) return t('common.new');
    return numNote.toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="card p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Mentor non trouvé
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{error || t('common.error')}</p>
          <button
            onClick={() => router.back()}
            className="inline-block px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
          >
            {t('common.back')}
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
          className="inline-flex items-center gap-2 mb-6 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>

        <div className="card overflow-hidden">
          {/* Header profil */}
          <div className="px-8 py-8" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold flex-shrink-0"
                style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}
              >
                {mentor.prenom?.[0]}{mentor.nom?.[0]}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {mentor.prenom} {mentor.nom}
                </h1>
                <p className="text-lg" style={{ color: 'var(--accent)' }}>{mentor.domaine || t('mentors.expert')}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 justify-center md:justify-start">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5" style={{ color: 'var(--warm)', fill: 'var(--warm)' }} />
                    <span className="font-mono-data font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {getNoteDisplay(mentor.note_moyenne)}/5
                    </span>
                  </div>
                  <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <Users className="w-5 h-5" />
                    <span>{mentor.nb_sessions || 0} {t('mentors.sessions')}</span>
                  </div>
                  <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <Clock className="w-5 h-5" />
                    <span>{mentor.annees_experience || 0} {t('mentors.years')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {mentor.disponible ? (
                      <><CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} /><span style={{ color: 'var(--text-secondary)' }}>Disponible</span></>
                    ) : (
                      <><XCircle className="w-5 h-5" style={{ color: 'var(--danger)' }} /><span style={{ color: 'var(--text-secondary)' }}>Indisponible</span></>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    À propos
                  </h2>
                  <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                    {mentor.bio || 'Aucune description disponible.'}
                  </p>
                </div>

                {mentor.competences && mentor.competences.length > 0 && (
                  <div>
                    <h2 className="font-display text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                      Compétences
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {mentor.competences.map((comp: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm"
                          style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    📅 {t('mentors.book_session')}
                  </h2>
                  {user ? (
                    user.role === 'mentore' ? (
                      <QuickBooking mentorId={mentor.id} mentorName={`${mentor.prenom} ${mentor.nom}`} />
                    ) : (
                      <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                        Vous devez être un mentoré pour réserver.
                      </p>
                    )
                  ) : (
                    <Link
                      href={`/login?redirect=/mentors/${mentor.id}`}
                      className="block w-full text-center px-4 py-3 rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
                    >
                      {t('common.login')}
                    </Link>
                  )}
                </div>

                <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Mail className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    {t('mentors.contact')}
                  </h2>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${mentor.email}`} className="hover:underline" style={{ color: 'inherit' }}>
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
  );
}