'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Briefcase, BookOpen, Target, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mentorAPI, mentoreAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    domaine: '',
    niveau_etude: '',
    objectifs: '',
    objectifs_tags: '',
    annees_experience: 0,
    disponible: true,
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      if (user.role === 'mentor') {
        const response = await mentorAPI.getProfile();
        const profile = response.data.profile;
        setFormData({
          bio: profile.bio || '',
          domaine: profile.domaine || '',
          niveau_etude: '',
          objectifs: '',
          objectifs_tags: '',
          annees_experience: profile.annees_experience || 0,
          disponible: profile.disponible,
        });
      } else {
        const response = await mentoreAPI.getProfile();
        const profile = response.data.profile;
        setFormData({
          bio: '',
          domaine: profile.domaine || '',
          niveau_etude: profile.niveau_etude || '',
          objectifs: profile.objectifs || '',
          objectifs_tags: profile.objectifs_tags?.join(', ') || '',
          annees_experience: 0,
          disponible: true,
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user?.role === 'mentor') {
        await mentorAPI.updateProfile({
          bio: formData.bio,
          domaine: formData.domaine,
          annees_experience: formData.annees_experience,
          disponible: formData.disponible,
        });
      } else {
        await mentoreAPI.updateProfile({
          domaine: formData.domaine,
          niveau_etude: formData.niveau_etude,
          objectifs: formData.objectifs,
          objectifs_tags: formData.objectifs_tags.split(',').map(tag => tag.trim()),
        });
      }
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isMentor = user?.role === 'mentor';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">Mon profil</h1>
          <p className="text-indigo-100 mt-1">Gérez vos informations personnelles</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
          {/* Informations de base */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Informations personnelles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={`${user?.nom} ${user?.prenom}`}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Profil spécifique */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {isMentor ? <Briefcase className="w-5 h-5 text-indigo-600" /> : <BookOpen className="w-5 h-5 text-indigo-600" />}
              {isMentor ? 'Informations professionnelles' : 'Parcours académique'}
            </h2>
            <div className="space-y-4">
              {isMentor ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biographie</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Présentez-vous..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Années d'expérience</label>
                    <input
                      type="number"
                      value={formData.annees_experience}
                      onChange={(e) => setFormData({ ...formData, annees_experience: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.disponible}
                        onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Disponible pour mentorat</span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau d'étude</label>
                    <input
                      type="text"
                      value={formData.niveau_etude}
                      onChange={(e) => setFormData({ ...formData, niveau_etude: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ex: Master 2, Licence 3..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objectifs</label>
                    <textarea
                      value={formData.objectifs}
                      onChange={(e) => setFormData({ ...formData, objectifs: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Décrivez vos objectifs d'apprentissage..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mots-clés (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      value={formData.objectifs_tags}
                      onChange={(e) => setFormData({ ...formData, objectifs_tags: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ex: python, data science, IA"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domaine</label>
                <input
                  type="text"
                  value={formData.domaine}
                  onChange={(e) => setFormData({ ...formData, domaine: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: Informatique, Marketing, Design..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}