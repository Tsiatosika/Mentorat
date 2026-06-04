'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionAPI, publicAPI, disponibiliteAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface Disponibilite {
  id: string;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
}

const JOURS: Record<string, string> = {
  lundi:'Lundi', mardi:'Mardi', mercredi:'Mercredi',
  jeudi:'Jeudi', vendredi:'Vendredi', samedi:'Samedi', dimanche:'Dimanche',
};

export default function NewSessionPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user }     = useAuth();
  const mentorId     = searchParams.get('mentor');

  const [mentor,         setMentor]         = useState<any>(null);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [errors,         setErrors]         = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    mentor_id:   mentorId || '',
    date_debut:  '',
    date_fin:    '',
    sujet:       '',
    description: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'mentore') { router.push('/login'); return; }
    if (mentorId) loadMentor();
  }, [mentorId, user, router]);

  const loadMentor = async () => {
    try {
      const [mentorRes, dispoRes] = await Promise.allSettled([
        publicAPI.getMentorById(mentorId!),
        disponibiliteAPI.getByMentor(mentorId!),
      ]);
      if (mentorRes.status === 'fulfilled') setMentor(mentorRes.value.data.mentor);
      if (dispoRes.status === 'fulfilled')  setDisponibilites(dispoRes.value.data.disponibilites || []);
    } catch {
      toast.error('Impossible de charger les informations du mentor');
    }
  };

  const set = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // CORRECTION 1 : validation complète avant envoi
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const now  = new Date();
    const deb  = formData.date_debut ? new Date(formData.date_debut) : null;
    const fin  = formData.date_fin   ? new Date(formData.date_fin)   : null;

    if (!formData.mentor_id)  errs.mentor_id  = 'Aucun mentor sélectionné';
    if (!formData.date_debut) errs.date_debut  = 'La date de début est obligatoire';
    else if (deb && deb < now) errs.date_debut = 'La date de début doit être dans le futur';

    if (!formData.date_fin)   errs.date_fin    = 'La date de fin est obligatoire';
    else if (deb && fin && fin <= deb) errs.date_fin = 'La date de fin doit être après le début';

    // CORRECTION 2 : durée min 30 min, max 3h
    if (deb && fin) {
      const dureeMin = (fin.getTime() - deb.getTime()) / 60000;
      if (dureeMin < 30)   errs.date_fin = 'La session doit durer au moins 30 minutes';
      if (dureeMin > 180)  errs.date_fin = 'La session ne peut pas dépasser 3 heures';
    }

    if (!formData.sujet.trim()) errs.sujet = 'Le sujet est obligatoire';
    if (formData.sujet.length > 300) errs.sujet = 'Le sujet ne doit pas dépasser 300 caractères';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await sessionAPI.create({
        ...formData,
        // Envoyer en ISO string pour PostgreSQL
        date_debut:  new Date(formData.date_debut).toISOString(),
        date_fin:    new Date(formData.date_fin).toISOString(),
      });
      toast.success('Demande de session envoyée ! Le mentor va être notifié.');
      router.push('/sessions');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  // Calculer la durée en temps réel
  const dureeMinutes = formData.date_debut && formData.date_fin
    ? Math.round((new Date(formData.date_fin).getTime() - new Date(formData.date_debut).getTime()) / 60000)
    : null;

  if (!user || user.role !== 'mentore') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link href={mentorId ? `/mentors/${mentorId}` : '/sessions'}
            className="inline-flex items-center gap-2 text-white hover:text-indigo-200 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Retour
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouvelle session de mentorat</h1>

            {/* Infos mentor */}
            {mentor && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                <p className="text-xs text-indigo-500 mb-1 font-medium uppercase tracking-wide">Mentor sélectionné</p>
                <p className="font-semibold text-gray-900">{mentor.prenom} {mentor.nom}</p>
                {mentor.domaine && <p className="text-sm text-gray-600">{mentor.domaine}</p>}

                {/* CORRECTION 3 : afficher les disponibilités du mentor */}
                {disponibilites.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-indigo-100">
                    <p className="text-xs text-indigo-500 mb-2 font-medium">Créneaux disponibles :</p>
                    <div className="flex flex-wrap gap-2">
                      {disponibilites.map((d) => (
                        <span key={d.id} className="text-xs bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded-lg">
                          {JOURS[d.jour_semaine]} {d.heure_debut.substring(0,5)}–{d.heure_fin.substring(0,5)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {/* Date début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date et heure de début <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="datetime-local"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.date_debut ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.date_debut}
                    onChange={(e) => set('date_debut', e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                {errors.date_debut && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.date_debut}
                  </p>
                )}
              </div>

              {/* Date fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date et heure de fin <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="datetime-local"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.date_fin ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.date_fin}
                    onChange={(e) => set('date_fin', e.target.value)}
                    min={formData.date_debut || new Date().toISOString().slice(0, 16)}
                  />
                </div>
                {errors.date_fin && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.date_fin}
                  </p>
                )}
                {/* CORRECTION 4 : affichage durée calculée en temps réel */}
                {dureeMinutes !== null && dureeMinutes > 0 && !errors.date_fin && (
                  <p className="text-indigo-600 text-xs mt-1">
                    Durée : {dureeMinutes >= 60
                      ? `${Math.floor(dureeMinutes/60)}h${dureeMinutes % 60 > 0 ? dureeMinutes % 60 + 'min' : ''}`
                      : `${dureeMinutes} min`}
                  </p>
                )}
              </div>

              {/* Sujet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sujet <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder="Ex: Aide pour mon projet de fin d'études en IA"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.sujet ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.sujet}
                    onChange={(e) => set('sujet', e.target.value)}
                    maxLength={300}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  {errors.sujet
                    ? <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.sujet}</p>
                    : <span />
                  }
                  <span className="text-xs text-gray-400">{formData.sujet.length}/300</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 font-normal">(optionnelle)</span>
                </label>
                <textarea rows={4}
                  placeholder="Décrivez vos attentes, vos questions ou le contexte de la session..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  value={formData.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-4 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50">
                  {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
                </button>
                <Link href={mentorId ? `/mentors/${mentorId}` : '/sessions'}
                  className="flex-1 text-center px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                  Annuler
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}