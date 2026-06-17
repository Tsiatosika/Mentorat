'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { disponibiliteAPI } from '@/services/api';
import toast from 'react-hot-toast';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const JOURS_LABEL: Record<string, string> = {
  lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi',
  jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche'
};

export default function DisponibilitesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [disponibilites, setDisponibilites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    jour_semaine: 'lundi',
    heure_debut: '09:00',
    heure_fin: '12:00',
    recurrent: true
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'mentor') {
      router.push('/dashboard');
      toast.error('Seuls les mentors peuvent gérer leurs disponibilités');
      return;
    }
    fetchDisponibilites();
  }, [user, router]);

  const fetchDisponibilites = async () => {
    try {
      const response = await disponibiliteAPI.getAll();
      setDisponibilites(response.data.disponibilites || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await disponibiliteAPI.create(formData);
      toast.success('Disponibilité ajoutée');
      setShowForm(false);
      fetchDisponibilites();
      setFormData({ jour_semaine: 'lundi', heure_debut: '09:00', heure_fin: '12:00', recurrent: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette disponibilité ?')) return;
    try {
      await disponibiliteAPI.delete(id);
      toast.success('Disponibilité supprimée');
      fetchDisponibilites();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Mes disponibilités</h1>
              <p className="text-indigo-100 mt-1">Gérez vos créneaux horaires</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              {showForm ? 'Annuler' : '+ Ajouter'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nouvelle disponibilité</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jour</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  value={formData.jour_semaine}
                  onChange={(e) => setFormData({ ...formData, jour_semaine: e.target.value })}
                >
                  {JOURS.map(jour => (
                    <option key={jour} value={jour}>{JOURS_LABEL[jour]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heure début</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    value={formData.heure_debut}
                    onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heure fin</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    value={formData.heure_fin}
                    onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.recurrent}
                  onChange={(e) => setFormData({ ...formData, recurrent: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">Récurrent (chaque semaine)</label>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Ajouter
              </button>
            </form>
          </div>
        )}

        {disponibilites.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <p className="text-gray-500 dark:text-gray-400">Aucune disponibilité</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Ajoutez vos créneaux horaires</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disponibilites.map((dispo) => (
              <div key={dispo.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{JOURS_LABEL[dispo.jour_semaine]}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-4">
                    {dispo.heure_debut.substring(0, 5)} - {dispo.heure_fin.substring(0, 5)}
                  </span>
                  {dispo.recurrent && (
                    <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Récurrent</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(dispo.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
