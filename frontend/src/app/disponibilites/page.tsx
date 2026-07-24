'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Plus, X, Calendar, Sun, Moon, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { disponibiliteAPI } from '@/services/api';
import toast from 'react-hot-toast';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const JOURS_LABEL: Record<string, string> = {
  lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi',
  jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche'
};

// ═══ PLAGES HORAIRES PRÉDÉFINIES ═══
const CRENEAUX_MATIN = [
  { label: '08:00 - 12:00', debut: '08:00', fin: '12:00' },
  { label: '09:00 - 12:30', debut: '09:00', fin: '12:30' },
  { label: '10:00 - 13:00', debut: '10:00', fin: '13:00' },
];

const CRENEAUX_APRES_MIDI = [
  { label: '13:00 - 17:00', debut: '13:00', fin: '17:00' },
  { label: '14:00 - 18:00', debut: '14:00', fin: '18:00' },
  { label: '15:00 - 19:00', debut: '15:00', fin: '19:00' },
];

const CRENEAUX_JOURNEE = [
  { label: '08:00 - 18:00', debut: '08:00', fin: '18:00' },
];

// ═══ FONCTION POUR DÉTERMINER LA PÉRIODE ═══
const getPeriode = (heure: string) => {
  const h = parseInt(heure.split(':')[0]);
  if (h < 12) return 'matin';
  if (h < 18) return 'apres-midi';
  return 'soir';
};

const getPeriodeLabel = (periode: string) => {
  if (periode === 'matin') return 'Matin';
  if (periode === 'apres-midi') return 'Après-midi';
  return 'Soir';
};

const getPeriodeIcon = (periode: string) => {
  if (periode === 'matin') return <Sun className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />;
  if (periode === 'apres-midi') return <Moon className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />;
  return <Clock className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />;
};

const getPeriodeColor = (periode: string) => {
  if (periode === 'matin') return '#F59E0B';
  if (periode === 'apres-midi') return '#6B7280';
  return '#8B5CF6';
};

export default function DisponibilitesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [disponibilites, setDisponibilites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredDispo, setHoveredDispo] = useState<string | null>(null);
  
  // ═══ MULTI-SELECTION : plusieurs créneaux sélectionnés ═══
  const [selectedCreneaux, setSelectedCreneaux] = useState<{ debut: string; fin: string }[]>([]);
  const [formData, setFormData] = useState({
    jour_semaine: 'lundi',
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
    
    if (selectedCreneaux.length === 0) {
      toast.error('Veuillez sélectionner au moins un créneau');
      return;
    }

    try {
      // Créer toutes les disponibilités sélectionnées
      const promises = selectedCreneaux.map(creneau => 
        disponibiliteAPI.create({
          jour_semaine: formData.jour_semaine,
          heure_debut: creneau.debut,
          heure_fin: creneau.fin,
          recurrent: formData.recurrent
        })
      );
      
      await Promise.all(promises);
      toast.success(`${selectedCreneaux.length} disponibilité${selectedCreneaux.length > 1 ? 's' : ''} ajoutée${selectedCreneaux.length > 1 ? 's' : ''}`);
      setIsModalOpen(false);
      fetchDisponibilites();
      setSelectedCreneaux([]);
      setFormData({ jour_semaine: 'lundi', recurrent: true });
    } catch (error: any) { 
      toast.error(error.response?.data?.message || t('common.error')); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('disponibilites.delete_confirm'))) return;
    try { await disponibiliteAPI.delete(id); toast.success(t('common.success')); fetchDisponibilites(); }
    catch (error) { toast.error(t('common.error')); }
  };

  // ═══ TOGGLE SÉLECTION D'UN CRÉNEAU ═══
  const toggleCreneau = (debut: string, fin: string) => {
    const exists = selectedCreneaux.some(c => c.debut === debut && c.fin === fin);
    if (exists) {
      setSelectedCreneaux(selectedCreneaux.filter(c => !(c.debut === debut && c.fin === fin)));
    } else {
      setSelectedCreneaux([...selectedCreneaux, { debut, fin }]);
    }
  };

  const isCreneauSelected = (debut: string, fin: string) => {
    return selectedCreneaux.some(c => c.debut === debut && c.fin === fin);
  };

  const inputStyle = { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // ═══ GROUPER LES DISPONIBILITÉS PAR JOUR ═══
  const disponibilitesParJour = disponibilites.reduce((acc: any, dispo) => {
    if (!acc[dispo.jour_semaine]) acc[dispo.jour_semaine] = [];
    acc[dispo.jour_semaine].push(dispo);
    return acc;
  }, {});

  // Trier les jours dans l'ordre de la semaine
  const joursOrdonnes = JOURS.filter(jour => disponibilitesParJour[jour]);

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
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 rounded-lg font-medium transition-all hover-add-btn fade-in-up" style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF', animationDelay: '0.08s' }}>
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" />{t('disponibilites.add')}</span>
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-8">
        {disponibilites.length === 0 ? (
          <div className="card p-12 text-center fade-in-up dispo-empty-card">
            <Clock className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>{t('disponibilites.no_disponibilites')}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('disponibilites.no_disponibilites_desc')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {joursOrdonnes.map((jour) => (
              <div key={jour} className="dispo-jour-section">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {JOURS_LABEL[jour]}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                    {disponibilitesParJour[jour].length} créneau{disponibilitesParJour[jour].length > 1 ? 'x' : ''}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {disponibilitesParJour[jour]
                    .sort((a: any, b: any) => a.heure_debut.localeCompare(b.heure_debut))
                    .map((dispo: any, idx: number) => {
                    const isHovered = hoveredDispo === dispo.id;
                    const periode = getPeriode(dispo.heure_debut);
                    const periodeLabel = getPeriodeLabel(periode);
                    const periodeColor = getPeriodeColor(periode);
                    
                    return (
                      <div 
                        key={dispo.id} 
                        className="card p-4 flex justify-between items-center fade-in-up dispo-row-card" 
                        style={{ 
                          animationDelay: `${idx * 0.04}s`, 
                          transform: isHovered ? 'translateX(6px)' : 'translateX(0)', 
                          borderLeft: `3px solid ${periodeColor}`,
                          opacity: isHovered ? 1 : 0.85,
                        }} 
                        onMouseEnter={() => setHoveredDispo(dispo.id)} 
                        onMouseLeave={() => setHoveredDispo(null)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center dispo-day-icon" style={{ 
                            backgroundColor: `${periodeColor}15`, 
                            transform: isHovered ? 'scale(1.1) rotate(-6deg)' : 'scale(1) rotate(0deg)' 
                          }}>
                            {getPeriodeIcon(periode)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium" style={{ color: isHovered ? periodeColor : 'var(--text-primary)' }}>
                                {dispo.heure_debut.substring(0, 5)} - {dispo.heure_fin.substring(0, 5)}
                              </span>
                              
                              <span 
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ 
                                  backgroundColor: `${periodeColor}15`, 
                                  color: periodeColor,
                                  border: `1px solid ${periodeColor}25`
                                }}
                              >
                                {periodeLabel}
                              </span>
                              
                              {dispo.recurrent && (
                                <span className="text-xs px-2 py-0.5 rounded-full dispo-recurrent-badge" style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}>
                                  {t('disponibilites.recurrent')}
                                </span>
                              )}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                              {periode === 'matin' ? '☀️ Matinée' : periode === 'apres-midi' ? '🌙 Après-midi' : '🌆 Soirée'}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(dispo.id)} 
                          className="transition-all hover-delete-btn p-2 rounded-lg flex-shrink-0 ml-2" 
                          style={{ color: 'var(--danger)' }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ MODAL D'AJOUT AVEC MULTI-SELECTION ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Calendar className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                {t('disponibilites.add_disponibilite')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn" style={{ color: 'var(--text-secondary)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="space-y-5">
                {/* Jour */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    {t('disponibilites.jour')}
                  </label>
                  <select 
                    className="w-full px-4 py-2.5 border rounded-xl outline-none transition-all dispo-input-hover" 
                    style={inputStyle} 
                    value={formData.jour_semaine} 
                    onChange={(e) => setFormData({ ...formData, jour_semaine: e.target.value })}
                  >
                    {JOURS.map(jour => (<option key={jour} value={jour}>{JOURS_LABEL[jour]}</option>))}
                  </select>
                </div>

                {/* Indicateur de sélection */}
                {selectedCreneaux.length > 0 && (
                  <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}>
                    <span className="text-sm font-medium">
                      {selectedCreneaux.length} créneau{selectedCreneaux.length > 1 ? 'x' : ''} sélectionné{selectedCreneaux.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Créneaux - Matin */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-4 h-4" style={{ color: '#F59E0B' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Matin</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {CRENEAUX_MATIN.map((creneau, idx) => {
                      const selected = isCreneauSelected(creneau.debut, creneau.fin);
                      return (
                        <button
                          key={`matin-${idx}`}
                          type="button"
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all creneau-btn ${selected ? 'creneau-btn-active' : ''}`}
                          style={{
                            backgroundColor: selected ? 'var(--accent)' : 'var(--bg-secondary)',
                            color: selected ? '#FFFFFF' : 'var(--text-secondary)',
                            borderColor: selected ? 'var(--accent)' : 'var(--border)'
                          }}
                          onClick={() => toggleCreneau(creneau.debut, creneau.fin)}
                        >
                          <span className="flex items-center justify-center gap-1.5">
                            {selected && <Check className="w-3.5 h-3.5" />}
                            {creneau.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Créneaux - Après-midi */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Moon className="w-4 h-4" style={{ color: '#6B7280' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Après-midi</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {CRENEAUX_APRES_MIDI.map((creneau, idx) => {
                      const selected = isCreneauSelected(creneau.debut, creneau.fin);
                      return (
                        <button
                          key={`apres-${idx}`}
                          type="button"
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all creneau-btn ${selected ? 'creneau-btn-active' : ''}`}
                          style={{
                            backgroundColor: selected ? 'var(--accent)' : 'var(--bg-secondary)',
                            color: selected ? '#FFFFFF' : 'var(--text-secondary)',
                            borderColor: selected ? 'var(--accent)' : 'var(--border)'
                          }}
                          onClick={() => toggleCreneau(creneau.debut, creneau.fin)}
                        >
                          <span className="flex items-center justify-center gap-1.5">
                            {selected && <Check className="w-3.5 h-3.5" />}
                            {creneau.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Créneaux - Journée complète */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Journée complète</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {CRENEAUX_JOURNEE.map((creneau, idx) => {
                      const selected = isCreneauSelected(creneau.debut, creneau.fin);
                      return (
                        <button
                          key={`journee-${idx}`}
                          type="button"
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all creneau-btn ${selected ? 'creneau-btn-active' : ''}`}
                          style={{
                            backgroundColor: selected ? 'var(--accent)' : 'var(--bg-secondary)',
                            color: selected ? '#FFFFFF' : 'var(--text-secondary)',
                            borderColor: selected ? 'var(--accent)' : 'var(--border)'
                          }}
                          onClick={() => toggleCreneau(creneau.debut, creneau.fin)}
                        >
                          <span className="flex items-center justify-center gap-1.5">
                            {selected && <Check className="w-3.5 h-3.5" />}
                            {creneau.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Heures personnalisées - on les garde mais on les ajoute à la sélection */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    {t('disponibilites.heures_personnalisees')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Début</label>
                      <input 
                        type="time" 
                        className="w-full px-3 py-2 border rounded-xl outline-none transition-all dispo-input-hover" 
                        style={inputStyle} 
                        id="custom_debut"
                        defaultValue="09:00"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Fin</label>
                      <input 
                        type="time" 
                        className="w-full px-3 py-2 border rounded-xl outline-none transition-all dispo-input-hover" 
                        style={inputStyle} 
                        id="custom_fin"
                        defaultValue="12:00"
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <button
                        type="button"
                        className="w-full px-3 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                        onClick={() => {
                          const debut = (document.getElementById('custom_debut') as HTMLInputElement)?.value;
                          const fin = (document.getElementById('custom_fin') as HTMLInputElement)?.value;
                          if (debut && fin) {
                            toggleCreneau(debut, fin);
                          }
                        }}
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>

                {/* Récurrent */}
                <div className="flex items-center gap-2.5 pt-1">
                  <input 
                    type="checkbox" 
                    checked={formData.recurrent} 
                    onChange={(e) => setFormData({ ...formData, recurrent: e.target.checked })} 
                    className="rounded w-4 h-4" 
                    style={{ accentColor: 'var(--accent)' }} 
                  />
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('disponibilites.recurrent')}</label>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedCreneaux([]);
                  }} 
                  className="px-4 py-2.5 rounded-xl font-medium transition-all modal-cancel-btn"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 rounded-xl font-medium transition-all hover-submit-btn"
                  style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter {selectedCreneaux.length > 0 ? `(${selectedCreneaux.length})` : ''}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .dispo-orb { position: absolute; border-radius: 9999px; filter: blur(80px); opacity: 0.3; will-change: transform; }
        .dispo-orb-1 { width: 20rem; height: 20rem; top: -6rem; right: -4rem; animation: dispoFloat1 24s ease-in-out infinite; }
        .dispo-orb-2 { width: 16rem; height: 16rem; bottom: -4rem; left: -3rem; animation: dispoFloat2 28s ease-in-out infinite; }
        @keyframes dispoFloat1 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(-25px,25px)scale(1.05)} }
        @keyframes dispoFloat2 { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(20px,-15px)scale(1.06)} }

        .fade-in-up { opacity: 0; transform: translateY(12px); animation: dispoFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes dispoFadeUp { to { opacity: 1; transform: translateY(0); } }

        .hover-gradient-text { transition: all 0.4s ease; cursor: default; display: inline-block; }
        .hover-gradient-text:hover { background: linear-gradient(135deg,#3B82F6,#8B5CF6,#EC4899); -webkit-background-clip:text; background-clip:text; color:transparent; }

        .hover-add-btn { transition: all 0.3s ease; }
        .hover-add-btn:hover { transform: translateY(-3px); filter: brightness(1.1); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }

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

        .dispo-jour-section {
          animation: dispoFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
        }

        /* ═══ STYLES MODAL ═══ */
        .modal-overlay {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-container {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15);
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px 16px 24px;
          border-bottom: 1px solid var(--border);
        }

        .modal-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close-btn:hover {
          background: var(--bg-tertiary);
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 24px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 24px 24px 24px;
          border-top: 1px solid var(--border);
        }

        .modal-cancel-btn {
          transition: all 0.2s ease;
        }
        .modal-cancel-btn:hover {
          background: var(--bg-secondary) !important;
          transform: translateY(-1px);
        }

        /* Créneaux */
        .creneau-btn {
          transition: all 0.2s ease;
          border: 1px solid var(--border);
          text-align: center;
          cursor: pointer;
        }
        .creneau-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }
        .creneau-btn-active {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);
        }
        .creneau-btn-active:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3);
        }

        @media (prefers-reduced-motion:reduce) {
          .dispo-orb,.fade-in-up,.modal-overlay,.modal-container{animation:none!important;transition:none!important;opacity:1!important;transform:none!important}
        }

        @media (max-width: 640px) {
          .modal-container { margin: 16px; max-width: 100%; }
          .modal-body { padding: 16px; }
          .modal-header { padding: 16px 16px 12px; }
          .modal-footer { padding: 12px 16px 16px; flex-direction: column; }
          .modal-footer button { width: 100%; justify-content: center; }
          .creneau-btn { font-size: 11px; padding: 8px 10px; }
          .grid-cols-3 { grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
        }
      `}</style>
    </div>
  );
}