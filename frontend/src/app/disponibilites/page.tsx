'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Plus, X, Calendar } from 'lucide-react';
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
  const [hoveredDispo, setHoveredDispo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    jour_semaine: 'lundi',
    heure_debut: '09:00',
    heure_fin: '12:00',
    recurrent: true
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'mentor') { router.push('/dashboard'); toast.error(t('common.error')); return; }
    fetchDisponibilites();
  }, [user, router]);

  const fetchDisponibilites = async () => {
    try {
      const response = await disponibiliteAPI.getAll();
      setDisponibilites(response.data.disponibilites || []);
    } catch (error) { console.error('Erreur:', error); toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await disponibiliteAPI.create(formData);
      toast.success(t('common.success'));
      setShowForm(false);
      fetchDisponibilites();
      setFormData({ jour_semaine: 'lundi', heure_debut: '09:00', heure_fin: '12:00', recurrent: true });
    } catch (error: any) { toast.error(error.response?.data?.message || t('common.error')); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('disponibilites.delete_confirm'))) return;
    try { await disponibiliteAPI.delete(id); toast.success(t('common.success')); fetchDisponibilites(); }
    catch (error) { toast.error(t('common.error')); }
  };

  const inputStyle = { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen disponibilites-ambient" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="dispo-orb dispo-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
        <div className="dispo-orb dispo-orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-10 pb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <p className="font-mono-data text-xs uppercase tracking-wide mb-2 fade-in-up" style={{ color: 'var(--accent)' }}>{t('disponibilites.subtitle')}</p>
            <h1 className="font-display text-3xl font-semibold fade-in-up hover-gradient-text" style={{ color: 'var(--text-primary)', animationDelay: '0.05s' }}>{t('disponibilites.title')}</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg font-medium transition-all hover-add-btn fade-in-up" style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF', animationDelay: '0.08s' }}>
            {showForm ? (
              <span className="flex items-center gap-2"><X className="w-4 h-4" />{t('disponibilites.cancel')}</span>
            ) : (
              <span className="flex items-center gap-2"><Plus className="w-4 h-4" />{t('disponibilites.add')}</span>
            )}
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-8">
        {showForm && (
          <div className="card p-6 mb-6 fade-in-up panel-in dispo-form-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              {t('disponibilites.add_disponibilite')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('disponibilites.jour')}</label>
                <select className="w-full px-4 py-2 border rounded-lg outline-none transition-all dispo-input-hover" style={inputStyle} value={formData.jour_semaine} onChange={(e) => setFormData({ ...formData, jour_semaine: e.target.value })}>
                  {JOURS.map(jour => (<option key={jour} value={jour}>{JOURS_LABEL[jour]}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('disponibilites.heure_debut')}</label>
                  <input type="time" className="w-full px-4 py-2 border rounded-lg outline-none transition-all dispo-input-hover" style={inputStyle} value={formData.heure_debut} onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('disponibilites.heure_fin')}</label>
                  <input type="time" className="w-full px-4 py-2 border rounded-lg outline-none transition-all dispo-input-hover" style={inputStyle} value={formData.heure_fin} onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.recurrent} onChange={(e) => setFormData({ ...formData, recurrent: e.target.checked })} className="rounded" style={{ accentColor: 'var(--accent)' }} />
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('disponibilites.recurrent')}</label>
              </div>
              <button type="submit" className="w-full px-4 py-2 rounded-lg font-medium transition-all hover-submit-btn" style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}>
                <span className="flex items-center justify-center gap-2"><Plus className="w-4 h-4" />{t('disponibilites.add')}</span>
              </button>
            </form>
          </div>
        )}

        {disponibilites.length === 0 ? (
          <div className="card p-12 text-center fade-in-up dispo-empty-card">
            <Clock className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>{t('disponibilites.no_disponibilites')}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('disponibilites.no_disponibilites_desc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disponibilites.map((dispo, idx) => {
              const isHovered = hoveredDispo === dispo.id;
              return (
                <div key={dispo.id} className="card p-4 flex justify-between items-center fade-in-up dispo-row-card" style={{ animationDelay: `${idx * 0.04}s`, transform: isHovered ? 'translateX(6px)' : 'translateX(0)', borderLeft: isHovered ? '3px solid var(--accent)' : '3px solid transparent' }} onMouseEnter={() => setHoveredDispo(dispo.id)} onMouseLeave={() => setHoveredDispo(null)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center dispo-day-icon" style={{ backgroundColor: 'var(--accent-soft)', transform: isHovered ? 'scale(1.1) rotate(-6deg)' : 'scale(1) rotate(0deg)' }}>
                      <Clock className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: isHovered ? 'var(--accent)' : 'var(--text-primary)' }}>{JOURS_LABEL[dispo.jour_semaine]}</span>
                      <span className="font-mono-data ml-4" style={{ color: 'var(--text-secondary)' }}>{dispo.heure_debut.substring(0, 5)} - {dispo.heure_fin.substring(0, 5)}</span>
                      {dispo.recurrent && (
                        <span className="ml-2 text-xs px-2 py-1 rounded-full dispo-recurrent-badge" style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}>
                          {t('disponibilites.recurrent')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(dispo.id)} className="transition-all hover-delete-btn p-2 rounded-lg" style={{ color: 'var(--danger)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        .dispo-orb { position: absolute; border-radius: 9999px; filter: blur(80px); opacity: 0.3; will-change: transform; }
        .dispo-orb-1 { width: 20rem; height: 20rem; top: -6rem; right: -4rem; animation: dispoFloat1 24s ease-in-out infinite; }
        .dispo-orb-2 { width: 16rem; height: 16rem; bottom: -4rem; left: -3rem; animation: dispoFloat2 28s ease-in-out infinite; }
        @keyframes dispoFloat1 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(-25px,25px)scale(1.05)} }
        @keyframes dispoFloat2 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(20px,-15px)scale(1.06)} }

        .fade-in-up { opacity: 0; transform: translateY(12px); animation: dispoFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes dispoFadeUp { to { opacity: 1; transform: translateY(0); } }
        .panel-in { opacity: 0; transform: translateY(-6px); animation: dispoFadeUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }

        .hover-gradient-text { transition: all 0.4s ease; cursor: default; display: inline-block; }
        .hover-gradient-text:hover { background: linear-gradient(135deg,#3B82F6,#8B5CF6,#EC4899); -webkit-background-clip:text; background-clip:text; color:transparent; }

        .hover-add-btn { transition: all 0.3s ease; }
        .hover-add-btn:hover { transform: translateY(-3px); filter: brightness(1.1); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }

        .dispo-form-card { transition: all 0.35s ease; }
        .dispo-form-card:hover { box-shadow: 0 16px 32px rgba(0,0,0,0.1); }

        .dispo-input-hover { transition: all 0.3s ease; }
        .dispo-input-hover:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--accent-soft); }
        .dispo-input-hover:hover { border-color: var(--accent) !important; }

        .hover-submit-btn { transition: all 0.3s ease; }
        .hover-submit-btn:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 6px 16px rgba(0,0,0,0.12); }

        .dispo-empty-card { transition: all 0.35s ease; }
        .dispo-empty-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(0,0,0,0.1); }

        .dispo-row-card { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
        .dispo-day-icon { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .dispo-recurrent-badge { transition: all 0.3s ease; }
        .dispo-row-card:hover .dispo-recurrent-badge { transform: scale(1.05); }

        .hover-delete-btn { transition: all 0.3s ease; }
        .hover-delete-btn:hover { background-color: var(--danger-soft); transform: scale(1.1); }

        @media (prefers-reduced-motion:reduce) {
          .dispo-orb,.fade-in-up,.panel-in,.dispo-row-card{animation:none!important;transition:none!important;opacity:1!important;transform:none!important}
        }
      `}</style>
    </div>
  );
}