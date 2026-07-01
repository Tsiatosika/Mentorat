'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, BookOpen, Save, Upload, Tag, Plus, X, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { mentorAPI, mentoreAPI, uploadAPI, BACKEND_URL, competenceAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  
  // États pour les compétences
  const [availableCompetences, setAvailableCompetences] = useState<any[]>([]);
  const [competenceSearch, setCompetenceSearch] = useState('');
  const [showCompetenceDropdown, setShowCompetenceDropdown] = useState(false);
  const [selectedNiveau, setSelectedNiveau] = useState('intermediaire');
  const [addingCompetence, setAddingCompetence] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    bio: '',
    domaine: '',
    niveau_etude: '',
    objectifs: '',
    objectifs_tags: [] as string[],
    competences: [] as any[],
    annees_experience: 0,
    disponible: true,
  });

  const NIVEAUX = [
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' },
    { value: 'expert', label: 'Expert' },
  ];

  const DOMAINES = [
    'Informatique', 'Marketing', 'Design', 'Finance', 'Management',
    'Communication', 'Droit', 'Sante', 'Education', 'Ingenierie',
    'Data Science', 'Cybersecurite', 'Autre'
  ];

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCompetenceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchProfile();
    if (user?.role === 'mentor') {
      fetchAvailableCompetences();
    }
  }, [user, router]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (user?.role === 'mentor') {
        const res = await mentorAPI.getProfile();
        const p = res.data.profile;
        setProfile(p);
        setPhotoUrl(p.photo_url || user?.photo_url || null);
        setFormData({
          bio: p.bio || '',
          domaine: p.domaine || '',
          niveau_etude: '',
          objectifs: '',
          objectifs_tags: [],
          competences: p.competences || [],
          annees_experience: p.annees_experience || 0,
          disponible: p.disponible ?? true,
        });
      } else {
        const res = await mentoreAPI.getProfile();
        const p = res.data.profile;
        setProfile(p);
        setPhotoUrl(p.photo_url || user?.photo_url || null);
        setFormData({
          bio: '',
          domaine: p.domaine || '',
          niveau_etude: p.niveau_etude || '',
          objectifs: p.objectifs || '',
          objectifs_tags: Array.isArray(p.objectifs_tags) ? p.objectifs_tags.filter(Boolean) : [],
          competences: [],
          annees_experience: 0,
          disponible: true,
        });
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCompetences = async () => {
    try {
      const response = await competenceAPI.getAll();
      setAvailableCompetences(response.data.competences || response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement competences:', error);
    }
  };

  // Filtrer les compétences disponibles (celles pas encore ajoutées)
  const filteredCompetences = availableCompetences.filter(
    (comp: any) => 
      comp.nom?.toLowerCase().includes(competenceSearch.toLowerCase()) &&
      !formData.competences.some((c: any) => c.id === comp.id || c.competence_id === comp.id)
  );

  // Ajouter une compétence existante
  const handleAddExistingCompetence = async (competence: any) => {
    setAddingCompetence(true);
    try {
      await mentorAPI.addCompetence({ 
        competence_id: competence.id, 
        niveau: selectedNiveau 
      });
      
      // Ajouter localement
      setFormData(prev => ({
        ...prev,
        competences: [...prev.competences, {
          id: competence.id,
          nom: competence.nom,
          niveau: selectedNiveau
        }]
      }));
      
      toast.success('Competence ajoutee');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setAddingCompetence(false);
      setCompetenceSearch('');
      setShowCompetenceDropdown(false);
    }
  };

  // Ajouter une nouvelle compétence personnalisée
  const handleAddCustomCompetence = async () => {
    const nom = competenceSearch.trim();
    if (!nom || nom.length < 2) {
      toast.error('Veuillez entrer un nom de competence (minimum 2 caracteres)');
      return;
    }

    // Vérifier si déjà dans la liste
    if (formData.competences.some((c: any) => c.nom?.toLowerCase() === nom.toLowerCase())) {
      toast.error('Cette competence existe deja dans votre profil');
      return;
    }

    setAddingCompetence(true);
    try {
      const response = await mentorAPI.addCompetence({ 
        competence_nom: nom, 
        niveau: selectedNiveau 
      });
      
      // Ajouter localement
      setFormData(prev => ({
        ...prev,
        competences: [...prev.competences, {
          id: response.data.competence.id,
          nom: response.data.competence.nom,
          niveau: selectedNiveau
        }]
      }));
      
      toast.success('Competence ajoutee avec succes !');
      
      // Rafraîchir la liste des compétences disponibles
      fetchAvailableCompetences();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setAddingCompetence(false);
      setCompetenceSearch('');
      setShowCompetenceDropdown(false);
    }
  };

  // Supprimer une compétence
  const handleRemoveCompetence = async (competenceId: string) => {
    try {
      await mentorAPI.removeCompetence(competenceId);
      setFormData(prev => ({
        ...prev,
        competences: prev.competences.filter((c: any) => 
          c.id !== competenceId && c.competence_id !== competenceId
        )
      }));
      toast.success('Competence supprimee');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  // Mettre à jour le niveau d'une compétence
  const handleUpdateNiveau = async (competenceId: string, newNiveau: string) => {
    setFormData(prev => ({
      ...prev,
      competences: prev.competences.map((c: any) => 
        (c.id === competenceId || c.competence_id === competenceId) 
          ? { ...c, niveau: newNiveau }
          : c
      )
    }));
    
    try {
      await mentorAPI.addCompetence({ competence_id: competenceId, niveau: newNiveau });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    if (formData.objectifs_tags.includes(tag)) { toast.error('Ce tag existe deja'); return; }
    setFormData(prev => ({ ...prev, objectifs_tags: [...prev.objectifs_tags, tag] }));
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, objectifs_tags: prev.objectifs_tags.filter(t => t !== tag) }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
    if (e.key === ',') { e.preventDefault(); addTag(); }
  };

  const handleCompetenceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Si pas de résultats dans la recherche, ajouter comme nouvelle compétence
      if (filteredCompetences.length === 0 && competenceSearch.trim().length >= 2) {
        handleAddCustomCompetence();
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo trop lourde (max 5 Mo)'); return; }
    try {
      const res = await uploadAPI.photo(file);
      updateUser({ ...user, photo_url: res.data.url });
      setPhotoUrl(res.data.url);
      toast.success(t('common.success'));
      fetchProfile();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('CV trop lourd (max 5 Mo)'); return; }
    try {
      await uploadAPI.cv(file);
      toast.success('CV uploade avec succes');
      fetchProfile();
    } catch {
      toast.error(t('common.error'));
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
          objectifs_tags: formData.objectifs_tags,
        });
      }
      toast.success(t('common.success'));
      fetchProfile();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const isMentor = user?.role === 'mentor';
  const inputStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="min-h-screen profile-ambient" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-10 pb-8">
        <p className="font-mono-data text-xs uppercase tracking-wide mb-2 fade-in-up" style={{ color: 'var(--accent)' }}>
          {t('profile.info')}
        </p>
        <h1 className="font-display text-3xl font-semibold fade-in-up hover-gradient-text" style={{ color: 'var(--text-primary)', animationDelay: '0.05s' }}>
          {t('profile.title')}
        </h1>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-8 space-y-6">
        {/* Photo */}
        <div className="card p-6 fade-in-up profile-card-hover" style={{ animationDelay: '0.08s' }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <User className="w-5 h-5" style={{ color: 'var(--accent)' }} /> {t('profile.photo')}
          </h2>
          <div className="flex items-center gap-4">
            <div className="profile-avatar-hover">
              <Avatar photoUrl={photoUrl || user?.photo_url} prenom={user?.prenom} nom={user?.nom} size={80} />
            </div>
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all text-sm w-fit hover-upload-btn" style={{ border: '2px dashed var(--accent)', color: 'var(--accent)' }}>
              <Upload className="w-4 h-4" />
              {t('profile.photo')}
              <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Infos personnelles */}
          <div className="card p-6 fade-in-up profile-card-hover" style={{ animationDelay: '0.12s' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <User className="w-5 h-5" style={{ color: 'var(--accent)' }} /> {t('profile.info')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.nom_complet')}</label>
                <input disabled value={`${user?.prenom} ${user?.nom}`} className="w-full px-4 py-2 rounded-lg profile-input-disabled" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <input disabled value={user?.email || ''} className="w-full px-4 py-2 rounded-lg profile-input-disabled" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }} />
              </div>
            </div>
          </div>

          {/* Profil spécifique */}
          <div className="card p-6 fade-in-up profile-card-hover" style={{ animationDelay: '0.16s' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              {isMentor ? <Briefcase className="w-5 h-5" style={{ color: 'var(--accent)' }} /> : <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />}
              {isMentor ? t('profile.experience') : 'Profil academique'}
            </h2>
            <div className="space-y-4">
              {/* Domaine */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.domaine')}</label>
                <select className="w-full px-4 py-2 border rounded-lg outline-none transition-all profile-input-hover" style={inputStyle} value={formData.domaine} onChange={(e) => setFormData({ ...formData, domaine: e.target.value })}>
                  <option value="">Selectionner un domaine...</option>
                  {DOMAINES.map(d => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>

              {isMentor ? (
                <>
                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.bio')}</label>
                    <textarea rows={4} placeholder={t('profile.bio_placeholder')} className="w-full px-4 py-2 border rounded-lg outline-none transition-all resize-none profile-input-hover" style={inputStyle} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
                  </div>

                  {/* Expérience + Disponible */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.annees_experience')}</label>
                      <input type="number" min={0} max={50} className="w-full px-4 py-2 border rounded-lg outline-none transition-all profile-input-hover" style={inputStyle} value={formData.annees_experience} onChange={(e) => setFormData({ ...formData, annees_experience: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative w-11 h-6 rounded-full transition-all duration-300 toggle-switch" style={{ backgroundColor: formData.disponible ? 'var(--accent)' : 'var(--bg-tertiary)' }} onClick={() => setFormData(prev => ({ ...prev, disponible: !prev.disponible }))}>
                          <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300" style={{ transform: formData.disponible ? 'translateX(20px)' : 'translateX(0)' }} />
                        </div>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formData.disponible ? t('profile.disponible') : t('profile.indisponible')}</span>
                      </label>
                    </div>
                  </div>

                  {/* ─── COMPÉTENCES ─── */}
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <Tag className="w-4 h-4" /> Competences techniques
                    </label>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                      Ajoutez vos competences techniques. Si votre competence n&apos;existe pas, tapez-la et appuyez sur Entree pour la creer.
                    </p>

                    {/* Compétences existantes */}
                    {formData.competences.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {formData.competences.map((comp: any) => (
                          <div key={comp.id || comp.competence_id} className="relative group">
                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm profile-tag-hover" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}>
                              <span className="font-medium">{comp.nom}</span>
                              <select
                                value={comp.niveau || 'intermediaire'}
                                onChange={(e) => handleUpdateNiveau(comp.id || comp.competence_id, e.target.value)}
                                className="text-xs bg-transparent border-none outline-none cursor-pointer"
                                style={{ color: 'inherit' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {NIVEAUX.map(n => (<option key={n.value} value={n.value} style={{ color: '#000' }}>{n.label}</option>))}
                              </select>
                              <button type="button" onClick={() => handleRemoveCompetence(comp.id || comp.competence_id)} className="hover:opacity-70 ml-1">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ajouter une compétence */}
                    <div className="relative" ref={dropdownRef}>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          <input
                            type="text"
                            placeholder="Rechercher ou taper une nouvelle competence..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none transition-all text-sm profile-input-hover"
                            style={inputStyle}
                            value={competenceSearch}
                            onChange={(e) => {
                              setCompetenceSearch(e.target.value);
                              setShowCompetenceDropdown(true);
                            }}
                            onFocus={() => setShowCompetenceDropdown(true)}
                            onKeyDown={handleCompetenceKeyDown}
                          />
                        </div>
                        <select value={selectedNiveau} onChange={(e) => setSelectedNiveau(e.target.value)} className="px-3 py-2 border rounded-lg outline-none text-sm" style={inputStyle}>
                          {NIVEAUX.map(n => (<option key={n.value} value={n.value}>{n.label}</option>))}
                        </select>
                      </div>

                      {/* Bouton pour ajouter une compétence personnalisée (toujours visible) */}
                      {competenceSearch.trim().length >= 2 && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={handleAddCustomCompetence}
                            disabled={addingCompetence}
                            className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 hover-add-custom-btn"
                            style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)', border: '1px dashed var(--success)' }}
                          >
                            {addingCompetence ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                            Ajouter &quot;{competenceSearch.trim()}&quot; comme nouvelle competence
                          </button>
                        </div>
                      )}

                      {/* Dropdown des compétences existantes */}
                      {showCompetenceDropdown && filteredCompetences.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                          <div className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                            Competences existantes
                          </div>
                          {filteredCompetences.slice(0, 8).map((comp: any) => (
                            <button
                              key={comp.id}
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between"
                              style={{ color: 'var(--text-primary)' }}
                              onClick={() => handleAddExistingCompetence(comp)}
                            >
                              <span>{comp.nom}</span>
                              <Plus className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                      💡 Conseil : Si votre competence n&apos;apparait pas dans la liste, tapez son nom et cliquez sur le bouton pour la creer.
                    </p>
                  </div>

                  {/* CV */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.cv')}</label>
                    <div className="flex flex-wrap items-center gap-3">
                      {profile?.cv_url && (
                        <a href={`${BACKEND_URL}${profile.cv_url}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline hover-cv-link" style={{ color: 'var(--accent)' }}>
                          {t('profile.view_cv')}
                        </a>
                      )}
                      <label className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all text-sm hover-upload-btn" style={{ border: '2px dashed var(--accent)', color: 'var(--accent)' }}>
                        <Upload className="w-4 h-4" />
                        {profile?.cv_url ? t('profile.replace_cv') : t('profile.upload_cv')}
                        <input type="file" accept="application/pdf" className="hidden" onChange={handleCVUpload} />
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Mentoré */}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.niveau_etude')}</label>
                    <input type="text" placeholder={t('profile.niveau_etude_placeholder')} className="w-full px-4 py-2 border rounded-lg outline-none transition-all profile-input-hover" style={inputStyle} value={formData.niveau_etude} onChange={(e) => setFormData({ ...formData, niveau_etude: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.objectifs')}</label>
                    <textarea rows={3} placeholder={t('profile.objectifs_placeholder')} className="w-full px-4 py-2 border rounded-lg outline-none transition-all resize-none profile-input-hover" style={inputStyle} value={formData.objectifs} onChange={(e) => setFormData({ ...formData, objectifs: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <Tag className="w-4 h-4" /> {t('profile.tags')}
                    </label>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>{t('profile.tags_desc')}</p>
                    {formData.objectifs_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.objectifs_tags.map((tag) => (
                          <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full text-sm profile-tag-hover" style={{ backgroundColor: hoveredTag === tag ? 'var(--accent)' : 'var(--accent-soft)', color: hoveredTag === tag ? '#FFFFFF' : 'var(--accent-text-on-soft)' }} onMouseEnter={() => setHoveredTag(tag)} onMouseLeave={() => setHoveredTag(null)}>
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input type="text" placeholder={t('profile.tags_placeholder')} className="flex-1 px-4 py-2 border rounded-lg outline-none transition-all text-sm profile-input-hover" style={inputStyle} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
                      <button type="button" onClick={addTag} className="px-3 py-2 rounded-lg transition-all hover-add-tag" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('profile.tags_hint')}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bouton Enregistrer */}
          <div className="flex justify-end fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 hover-save-btn" style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>
              <Save className="w-4 h-4" />
              {saving ? t('common.saving') : t('profile.save')}
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .fade-in-up { opacity: 0; transform: translateY(12px); animation: profileFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes profileFadeUp { to { opacity: 1; transform: translateY(0); } }
        .hover-gradient-text { transition: all 0.4s ease; cursor: default; display: inline-block; }
        .hover-gradient-text:hover { background: linear-gradient(135deg,#3B82F6,#8B5CF6,#EC4899); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .profile-card-hover { transition: all 0.35s ease; }
        .profile-card-hover:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(0,0,0,0.1); border-color: var(--accent) !important; }
        .profile-avatar-hover { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .profile-avatar-hover:hover { transform: scale(1.08); }
        .hover-upload-btn { transition: all 0.3s ease; }
        .hover-upload-btn:hover { transform: translateY(-2px); background-color: var(--accent-soft); border-color: var(--accent) !important; box-shadow: 0 4px 12px var(--accent-soft); }
        .profile-input-hover { transition: all 0.3s ease; }
        .profile-input-hover:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--accent-soft); }
        .toggle-switch { transition: all 0.3s ease; cursor: pointer; }
        .toggle-switch:hover { filter: brightness(1.1); transform: scale(1.05); }
        .profile-tag-hover { transition: all 0.3s ease; cursor: pointer; }
        .profile-tag-hover:hover { transform: translateY(-3px) scale(1.08); box-shadow: 0 6px 16px rgba(0,0,0,0.12); }
        .hover-cv-link { transition: all 0.3s ease; }
        .hover-cv-link:hover { opacity: 0.8; transform: translateX(2px); }
        .hover-add-tag { transition: all 0.3s ease; }
        .hover-add-tag:hover { transform: scale(1.1); background-color: var(--accent) !important; color: #FFFFFF !important; }
        .hover-add-custom-btn { transition: all 0.3s ease; }
        .hover-add-custom-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.05); }
        .hover-save-btn { transition: all 0.3s ease; }
        .hover-save-btn:hover:not(:disabled) { transform: translateY(-3px); filter: brightness(1.1); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
        @media (prefers-reduced-motion:reduce) { .fade-in-up,.profile-card-hover,.profile-avatar-hover{animation:none!important;transition:none!important;opacity:1!important;transform:none!important} }
      `}</style>
    </div>
  );
}