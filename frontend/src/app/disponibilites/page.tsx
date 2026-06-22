'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { disponibiliteAPI } from '@/services/api';
import toast from 'react-hot-toast';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const JOURS_LABEL: Record<string, string> = {
  lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi',
  jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche'
};

export default function DisponibilitesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'mentor') {
      router.push('/dashboard');
      toast.error(t('common.error'));
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
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await disponibiliteAPI.create(formData);
      toast.success(t('common.success'));
      setShowForm(false);
      fetchDisponibilites();
      setFormData({ jour_semaine: 'lundi', heure_debut: '09:00', heure_fin: '12:00', recurrent: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('disponibilites.delete_confirm'))) return;
    try {
      await disponibiliteAPI.delete(id);
      toast.success(t('common.success'));
      fetchDisponibilites();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <p className="font-mono-data text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
              {t('disponibilites.subtitle')}
            </p>
            <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('disponibilites.title')}
            </h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
          >
            {showForm ? t('disponibilites.cancel') : '+ ' + t('disponibilites.add')}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        {showForm && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('disponibilites.add_disponibilite')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('disponibilites.jour')}</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg outline-none"
                  style={inputStyle}
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('disponibilites.heure_debut')}</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border rounded-lg outline-none"
                    style={inputStyle}
                    value={formData.heure_debut}
                    onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('disponibilites.heure_fin')}</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border rounded-lg outline-none"
                    style={inputStyle}
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
                  className="rounded"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('disponibilites.recurrent')}</label>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
              >
                {t('disponibilites.add')}
              </button>
            </form>
          </div>
        )}

        {disponibilites.length === 0 ? (
          <div className="card p-12 text-center">
            <p style={{ color: 'var(--text-secondary)' }}>{t('disponibilites.no_disponibilites')}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('disponibilites.no_disponibilites_desc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disponibilites.map((dispo) => (
              <div key={dispo.id} className="card bookmark p-4 flex justify-between items-center">
                <div>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{JOURS_LABEL[dispo.jour_semaine]}</span>
                  <span className="font-mono-data ml-4" style={{ color: 'var(--text-secondary)' }}>
                    {dispo.heure_debut.substring(0, 5)} - {dispo.heure_fin.substring(0, 5)}
                  </span>
                  {dispo.recurrent && (
                    <span
                      className="ml-2 text-xs px-2 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}
                    >
                      {t('disponibilites.recurrent')}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(dispo.id)}
                  className="transition-colors"
                  style={{ color: 'var(--danger)' }}
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