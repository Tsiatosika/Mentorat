'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionAPI, publicAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const mentorId = searchParams.get('mentor');
  
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mentor_id: mentorId || '',
    date_debut: '',
    date_fin: '',
    sujet: '',
    description: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'mentore') {
      router.push('/login');
      return;
    }

    if (mentorId) {
      fetchMentor();
    }
  }, [mentorId, user, router]);

  const fetchMentor = async () => {
    try {
      const response = await publicAPI.getMentorById(mentorId!);
      setMentor(response.data.mentor);
      setFormData(prev => ({ ...prev, mentor_id: mentorId! }));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Mentor non trouvé');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date_debut || !formData.date_fin || !formData.sujet) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      await sessionAPI.create(formData);
      toast.success('Demande de session envoyée !');
      router.push('/sessions');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'mentore') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link href={mentorId ? `/mentors/${mentorId}` : '/sessions'} className="inline-flex items-center gap-2 text-white hover:text-indigo-200">
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouvelle session de mentorat</h1>

            {mentor && (
              <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-indigo-600 mb-1">Avec</p>
                <p className="font-semibold text-gray-900">{mentor.prenom} {mentor.nom}</p>
                {mentor.domaine && <p className="text-sm text-gray-600">{mentor.domaine}</p>}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date et heure de début *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="datetime-local"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date et heure de fin *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="datetime-local"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.date_fin}
                    onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sujet de la session *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Ex: Aide sur le projet Python"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.sujet}
                    onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnelle)
                </label>
                <textarea
                  rows={4}
                  placeholder="Décrivez vos attentes pour cette session..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
                </button>
                <Link
                  href={mentorId ? `/mentors/${mentorId}` : '/sessions'}
                  className="flex-1 text-center px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
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