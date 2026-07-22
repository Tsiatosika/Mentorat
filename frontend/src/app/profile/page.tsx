'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Briefcase, BookOpen, Save, Upload, Tag, Plus, X,
  Search, Lock, CheckCircle, AlertCircle, ChevronRight,
  Sparkles, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { mentorAPI, mentoreAPI, uploadAPI, BACKEND_URL, competenceAPI, authAPI, api } from '@/services/api';
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
  const [activeTab, setActiveTab] = useState<'info' | 'profil' | 'securite'>('info');

  const [availableCompetences, setAvailableCompetences] = useState<any[]>([]);
  const [competenceSearch, setCompetenceSearch] = useState('');
  const [showCompetenceDropdown, setShowCompetenceDropdown] = useState(false);
  const [selectedNiveau, setSelectedNiveau] = useState('intermediaire');
  const [addingCompetence, setAddingCompetence] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Domaines chargés dynamiquement depuis le référentiel de catégories
  // (géré par l'admin), au lieu d'une liste codée en dur.
  const [domaines, setDomaines] = useState<{ id: string; nom: string }[]>([]);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    bio: '',
    domaine: '',
    niveau_etude: '',
    objectifs: '',
    objectifs_tags: [] as string[],
    competences: [] as any[],
    annees_experience: 0,
    disponible: true,
  });

  const [passwordData, setPasswordData] = useState({
    ancien_mot_de_passe: '',
    nouveau_mot_de_passe: '',
    confirmation: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const NIVEAUX = [
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' },
    { value: 'expert', label: 'Expert' },
  ];

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
    fetchDomaines();
    if (user?.role === 'mentor') fetchAvailableCompetences();
  }, [user, router]);

  const fetchDomaines = async () => {
    try {
      const res = await api.get('/categories');
      setDomaines(res.data.categories || []);
    } catch {
      // Non bloquant : le select restera simplement vide si ça échoue
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (user?.role === 'admin') {
        // Un admin n'a pas de profil mentor/mentoré en base : on ne charge
        // que ses infos de base (nom/prénom/photo), déjà présentes sur `user`.
        setProfile(null);
        setPhotoUrl(user?.photo_url || null);
        setFormData(prev => ({
          ...prev,
          nom: user?.nom || '',
          prenom: user?.prenom || '',
        }));
      } else if (user?.role === 'mentor') {
        const res = await mentorAPI.getProfile();
        const p = res.data.profile;
        setProfile(p);
        setPhotoUrl(p.photo_url || user?.photo_url || null);
        setFormData(prev => ({
          ...prev,
          nom: user?.nom || '',
          prenom: user?.prenom || '',
          bio: p.bio || '',
          domaine: p.domaine || '',
          niveau_etude: '',
          objectifs: '',
          objectifs_tags: [],
          competences: p.competences || [],
          annees_experience: p.annees_experience || 0,
          disponible: p.disponible ?? true,
        }));
      } else {
        const res = await mentoreAPI.getProfile();
        const p = res.data.profile;
        setProfile(p);
        setPhotoUrl(p.photo_url || user?.photo_url || null);
        setFormData(prev => ({
          ...prev,
          nom: user?.nom || '',
          prenom: user?.prenom || '',
          bio: '',
          domaine: p.domaine || '',
          niveau_etude: p.niveau_etude || '',
          objectifs: p.objectifs || '',
          objectifs_tags: Array.isArray(p.objectifs_tags) ? p.objectifs_tags.filter(Boolean) : [],
          competences: [],
          annees_experience: 0,
          disponible: true,
        }));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCompetences = async () => {
    try {
      const response = await competenceAPI.getAll();
      setAvailableCompetences(response.data.competences || response.data.data || []);
    } catch {}
  };

  const filteredCompetences = availableCompetences.filter(
    (comp: any) =>
      comp.nom?.toLowerCase().includes(competenceSearch.toLowerCase()) &&
      !formData.competences.some((c: any) => c.id === comp.id || c.competence_id === comp.id)
  );

  const handleAddExistingCompetence = async (competence: any) => {
    setAddingCompetence(true);
    try {
      await mentorAPI.addCompetence({ competence_id: competence.id, niveau: selectedNiveau });
      setFormData(prev => ({
        ...prev,
        competences: [...prev.competences, { id: competence.id, nom: competence.nom, niveau: selectedNiveau }]
      }));
      toast.success('Compétence ajoutée');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur');
    } finally {
      setAddingCompetence(false);
      setCompetenceSearch('');
      setShowCompetenceDropdown(false);
    }
  };

  const handleAddCustomCompetence = async () => {
    const nom = competenceSearch.trim();
    if (!nom || nom.length < 2) { toast.error('Minimum 2 caractères'); return; }
    if (formData.competences.some((c: any) => c.nom?.toLowerCase() === nom.toLowerCase())) {
      toast.error('Compétence déjà présente'); return;
    }
    setAddingCompetence(true);
    try {
      const response = await mentorAPI.addCompetence({ competence_nom: nom, niveau: selectedNiveau });
      setFormData(prev => ({
        ...prev,
        competences: [...prev.competences, { id: response.data.competence.id, nom: response.data.competence.nom, niveau: selectedNiveau }]
      }));
      toast.success('Compétence créée et ajoutée !');
      fetchAvailableCompetences();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur');
    } finally {
      setAddingCompetence(false);
      setCompetenceSearch('');
      setShowCompetenceDropdown(false);
    }
  };

  const handleRemoveCompetence = async (competenceId: string) => {
    try {
      await mentorAPI.removeCompetence(competenceId);
      setFormData(prev => ({
        ...prev,
        competences: prev.competences.filter((c: any) => c.id !== competenceId && c.competence_id !== competenceId)
      }));
      toast.success('Compétence supprimée');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleUpdateNiveau = async (competenceId: string, newNiveau: string) => {
    setFormData(prev => ({
      ...prev,
      competences: prev.competences.map((c: any) =>
        (c.id === competenceId || c.competence_id === competenceId) ? { ...c, niveau: newNiveau } : c
      )
    }));
    try {
      await mentorAPI.addCompetence({ competence_id: competenceId, niveau: newNiveau });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    if (formData.objectifs_tags.includes(tag)) { toast.error('Tag déjà présent'); return; }
    setFormData(prev => ({ ...prev, objectifs_tags: [...prev.objectifs_tags, tag] }));
    setTagInput('');
  };

  const removeTag = (tag: string) =>
    setFormData(prev => ({ ...prev, objectifs_tags: prev.objectifs_tags.filter(t => t !== tag) }));

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
  };

  const handleCompetenceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCompetences.length === 0 && competenceSearch.trim().length >= 2) handleAddCustomCompetence();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo trop lourde (max 5 Mo)'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Format non supporté'); return; }
    try {
      const res = await uploadAPI.photo(file);
      if (user) updateUser({ ...user, photo_url: res.data.url } as any);
      setPhotoUrl(res.data.url);
      toast.success(t('common.success'));
      fetchProfile();
    } catch (e: any) {
      toast.error(e.response?.data?.message || t('common.error'));
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('CV trop lourd (max 5 Mo)'); return; }
    try {
      await uploadAPI.cv(file);
      toast.success('CV uploadé');
      fetchProfile();
    } catch (e: any) {
      toast.error(e.response?.data?.message || t('common.error'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim() || !formData.prenom.trim()) { toast.error('Nom et prénom requis'); return; }
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ nom: formData.nom.trim(), prenom: formData.prenom.trim() });
      if (user) updateUser({ ...user, nom: res.data.user.nom, prenom: res.data.user.prenom } as any);
      // Un admin n'a pas de profil mentor/mentoré : rien de plus à sauvegarder.
      if (user?.role === 'mentor') {
        await mentorAPI.updateProfile({ bio: formData.bio, domaine: formData.domaine, annees_experience: formData.annees_experience, disponible: formData.disponible });
      } else if (user?.role === 'mentore') {
        await mentoreAPI.updateProfile({ domaine: formData.domaine, niveau_etude: formData.niveau_etude, objectifs: formData.objectifs, objectifs_tags: formData.objectifs_tags });
      }
      toast.success(t('common.success'));
      fetchProfile();
    } catch (e: any) {
      toast.error(e.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.nouveau_mot_de_passe || passwordData.nouveau_mot_de_passe.length < 8) {
      toast.error('Minimum 8 caractères'); return;
    }
    if (passwordData.nouveau_mot_de_passe !== passwordData.confirmation) {
      toast.error('Les mots de passe ne correspondent pas'); return;
    }
    setChangingPassword(true);
    try {
      await authAPI.changePassword({ ancien_mot_de_passe: passwordData.ancien_mot_de_passe || undefined, nouveau_mot_de_passe: passwordData.nouveau_mot_de_passe });
      toast.success('Mot de passe mis à jour');
      setPasswordData({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', confirmation: '' });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur');
    } finally {
      setChangingPassword(false);
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
  const isAdmin = user?.role === 'admin';

  // Complétude — non pertinente pour un admin (pas de champs métier à remplir)
  const completionChecks = isAdmin
    ? []
    : isMentor
    ? [!!photoUrl, !!formData.bio.trim(), !!formData.domaine, formData.annees_experience > 0, formData.competences.length > 0]
    : [!!photoUrl, !!formData.domaine, !!formData.niveau_etude.trim(), !!formData.objectifs.trim(), formData.objectifs_tags.length > 0];
  const completionDone = completionChecks.filter(Boolean).length;
  const completionPercent = completionChecks.length > 0 ? Math.round((completionDone / completionChecks.length) * 100) : 100;

  const inputCls = "w-full px-4 py-2.5 rounded-xl outline-none transition-all text-sm pf-input";
  const inputStyle = { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' };
  const labelCls = "block text-xs font-semibold uppercase tracking-wide mb-1.5";

  // Pas d'onglet "Profil/Expérience" pour un admin : rien à y afficher (pas de
  // domaine, bio, compétences, etc. côté admin).
  const tabs = [
    { key: 'info' as const,     label: t('profile.info'),                      icon: User },
    ...(!isAdmin ? [{ key: 'profil' as const, label: isMentor ? t('profile.experience') : 'Parcours', icon: isMentor ? Briefcase : BookOpen }] : []),
    { key: 'securite' as const, label: 'Sécurité',                             icon: Shield },
  ];

  const niveauColors: Record<string, string> = {
    debutant:      'var(--info-soft)',
    intermediaire: 'var(--warm-soft)',
    avance:        'var(--accent-soft)',
    expert:        'var(--success-soft)',
  };
  const niveauTextColors: Record<string, string> = {
    debutant:      'var(--info)',
    intermediaire: 'var(--warm-text-on-soft)',
    avance:        'var(--accent-text-on-soft)',
    expert:        'var(--success)',
  };

  return (
    <div className="min-h-screen pf-page" style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* ══════════ HERO BANNER ══════════ */}
      <div className="pf-hero relative overflow-hidden">
        {/* Orbes de fond */}
        <div className="pf-orb pf-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
        <div className="pf-orb pf-orb-2" style={{ backgroundColor: 'var(--warm-soft)' }} />
        <div className="pf-grid-bg" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-10 pb-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs mb-8 pf-breadcrumb">
            <span style={{ color: 'var(--text-tertiary)' }}>{t('nav.dashboard')}</span>
            <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{t('profile.title')}</span>
          </div>

          {/* Carte hero identité */}
          <div className="pf-hero-card">
            {/* Avatar + upload */}
            <div className="pf-avatar-wrapper">
              <div className="pf-avatar-ring">
                <Avatar photoUrl={photoUrl || user?.photo_url} prenom={user?.prenom} nom={user?.nom} size={88} />
                {/* Cercle de progression (masqué pour l'admin, sans complétude à afficher) */}
                {!isAdmin && (
                  <svg className="pf-ring-svg" viewBox="0 0 104 104">
                    <circle cx="52" cy="52" r="48" fill="none" stroke="var(--border)" strokeWidth="3" />
                    <circle cx="52" cy="52" r="48" fill="none" stroke="var(--accent)" strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 48}`}
                      strokeDashoffset={`${2 * Math.PI * 48 * (1 - completionPercent / 100)}`}
                      className="pf-ring-progress"
                    />
                  </svg>
                )}
              </div>
              <label className="pf-avatar-upload-btn" title={t('profile.photo')}>
                <Upload className="w-3.5 h-3.5" />
                <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            {/* Infos */}
            <div className="pf-hero-info">
              <div className="flex items-start gap-3 flex-wrap">
                <div>
                  <h1 className="pf-hero-name">
                    {formData.prenom || user?.prenom} {formData.nom || user?.nom}
                  </h1>
                  <p className="pf-hero-email">{user?.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap ml-auto">
                  <span className="pf-role-badge">
                    {isAdmin ? <Shield className="w-3 h-3" /> : isMentor ? <Briefcase className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    {isAdmin ? 'Administrateur' : isMentor ? 'Mentor' : 'Mentoré(e)'}
                  </span>
                  {isMentor && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, disponible: !prev.disponible }))}
                      className="pf-disponible-toggle"
                      style={{ backgroundColor: formData.disponible ? 'var(--success-soft)' : 'var(--bg-tertiary)' }}
                    >
                      <span className="pf-disponible-dot" style={{ backgroundColor: formData.disponible ? 'var(--success)' : 'var(--text-tertiary)' }} />
                      <span style={{ color: formData.disponible ? 'var(--success)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
                        {formData.disponible ? t('profile.disponible') : t('profile.indisponible')}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Barre de complétion — masquée pour l'admin */}
              {!isAdmin && (
                <div className="pf-completion">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Profil complété</span>
                    <span className="text-xs font-bold font-mono-data" style={{ color: completionPercent === 100 ? 'var(--success)' : 'var(--accent)' }}>
                      {completionPercent}%
                    </span>
                  </div>
                  <div className="pf-progress-track">
                    <div className="pf-progress-fill" style={{ width: `${completionPercent}%`, backgroundColor: completionPercent === 100 ? 'var(--success)' : 'var(--accent)' }} />
                  </div>
                </div>
              )}

              {/* Mini stats — masquées pour l'admin (pas de sessions/objectifs) */}
              {!isAdmin && (
                <div className="pf-stats">
                  {isMentor ? (
                    <>
                      <div className="pf-stat-item">
                        <span className="pf-stat-value">{formData.annees_experience}</span>
                        <span className="pf-stat-label">ans exp.</span>
                      </div>
                      <div className="pf-stat-divider" />
                      <div className="pf-stat-item">
                        <span className="pf-stat-value">{formData.competences.length}</span>
                        <span className="pf-stat-label">compétences</span>
                      </div>
                      <div className="pf-stat-divider" />
                      <div className="pf-stat-item">
                        <span className="pf-stat-value">{profile?.nb_sessions || 0}</span>
                        <span className="pf-stat-label">sessions</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="pf-stat-item">
                        <span className="pf-stat-value">{formData.objectifs_tags.length}</span>
                        <span className="pf-stat-label">objectifs</span>
                      </div>
                      <div className="pf-stat-divider" />
                      <div className="pf-stat-item">
                        <span className="pf-stat-value">{formData.niveau_etude || '—'}</span>
                        <span className="pf-stat-label">niveau</span>
                      </div>
                      <div className="pf-stat-divider" />
                      <div className="pf-stat-item">
                        <span className="pf-stat-value">{profile?.progression || 0}%</span>
                        <span className="pf-stat-label">progression</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Onglets (collés en bas du hero) ── */}
          <div className="pf-tabs-bar">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pf-tab ${activeTab === tab.key ? 'pf-tab-active' : ''}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ CONTENU DES ONGLETS ══════════ */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Onglet : Infos personnelles ── */}
        {activeTab === 'info' && (
          <form onSubmit={handleSubmit} className="pf-tab-content">
            <div className="pf-section">
              <div className="pf-section-header">
                <User className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <div>
                  <h2 className="pf-section-title">{t('profile.info')}</h2>
                  <p className="pf-section-desc">Votre identité sur la plateforme</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>Prénom</label>
                  <input value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                    className={inputCls} style={inputStyle} placeholder="Votre prénom" />
                </div>
                <div>
                  <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>Nom</label>
                  <input value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })}
                    className={inputCls} style={inputStyle} placeholder="Votre nom" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>Email</label>
                  <div className="relative">
                    <input disabled value={user?.email || ''} className={inputCls}
                      style={{ ...inputStyle, backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', cursor: 'not-allowed' }} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)', fontSize: '10px' }}>
                      non modifiable
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pf-save-row">
              <button type="submit" disabled={saving} className="pf-save-btn">
                <Save className="w-4 h-4" />
                {saving ? t('common.saving') : t('profile.save')}
              </button>
            </div>
          </form>
        )}

        {/* ── Onglet : Profil / Expérience (absent pour un admin) ── */}
        {activeTab === 'profil' && !isAdmin && (
          <form onSubmit={handleSubmit} className="pf-tab-content">
            <div className="pf-section">
              <div className="pf-section-header">
                {isMentor ? <Briefcase className="w-5 h-5" style={{ color: 'var(--accent)' }} /> : <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />}
                <div>
                  <h2 className="pf-section-title">{isMentor ? t('profile.experience') : 'Parcours académique'}</h2>
                  <p className="pf-section-desc">{isMentor ? 'Votre expertise et vos compétences' : 'Votre niveau et vos objectifs'}</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Domaine — chargé dynamiquement depuis le référentiel de catégories */}
                <div>
                  <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>{t('profile.domaine')}</label>
                  <select value={formData.domaine} onChange={e => setFormData({ ...formData, domaine: e.target.value })}
                    className={inputCls} style={inputStyle}>
                    <option value="">Sélectionner un domaine…</option>
                    {domaines.map(d => <option key={d.id} value={d.nom}>{d.nom}</option>)}
                  </select>
                </div>

                {isMentor ? (
                  <>
                    {/* Bio */}
                    <div>
                      <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>{t('profile.bio')}</label>
                      <textarea rows={4} placeholder={t('profile.bio_placeholder')} value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        className={`${inputCls} resize-none`} style={inputStyle} />
                      <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-tertiary)' }}>{formData.bio.length} / 600</p>
                    </div>

                    {/* Expérience */}
                    <div>
                      <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>{t('profile.annees_experience')}</label>
                      <div className="flex items-center gap-4">
                        <input type="number" min={0} max={50} value={formData.annees_experience}
                          onChange={e => setFormData({ ...formData, annees_experience: parseInt(e.target.value) || 0 })}
                          className={`${inputCls} w-28 text-center font-mono-data text-lg font-bold`}
                          style={inputStyle} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>année(s)</span>
                      </div>
                    </div>

                    {/* Compétences */}
                    <div>
                      <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>
                        <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Compétences techniques</span>
                      </label>

                      {/* Chips existantes */}
                      {formData.competences.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {formData.competences.map((comp: any) => (
                            <div key={comp.id || comp.competence_id}
                              className="pf-comp-chip"
                              style={{ backgroundColor: niveauColors[comp.niveau || 'intermediaire'] || 'var(--accent-soft)' }}>
                              <span className="font-medium text-xs" style={{ color: niveauTextColors[comp.niveau || 'intermediaire'] || 'var(--accent-text-on-soft)' }}>
                                {comp.nom}
                              </span>
                              <select value={comp.niveau || 'intermediaire'}
                                onChange={e => handleUpdateNiveau(comp.id || comp.competence_id, e.target.value)}
                                className="text-xs bg-transparent border-none outline-none cursor-pointer ml-1"
                                style={{ color: niveauTextColors[comp.niveau || 'intermediaire'] || 'var(--accent-text-on-soft)' }}
                                onClick={e => e.stopPropagation()}>
                                {NIVEAUX.map(n => <option key={n.value} value={n.value} style={{ color: '#000' }}>{n.label}</option>)}
                              </select>
                              <button type="button" onClick={() => handleRemoveCompetence(comp.id || comp.competence_id)}
                                className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" style={{ color: niveauTextColors[comp.niveau || 'intermediaire'] }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Recherche / ajout */}
                      <div className="relative" ref={dropdownRef}>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                            <input type="text" placeholder="Rechercher ou créer une compétence…"
                              className={`${inputCls} pl-10`}
                              style={{ ...inputStyle, color: 'var(--text-primary, #111827)', caretColor: 'var(--text-primary, #111827)' }}
                              value={competenceSearch}
                              onChange={e => { setCompetenceSearch(e.target.value); setShowCompetenceDropdown(true); }}
                              onFocus={() => setShowCompetenceDropdown(true)}
                              onKeyDown={handleCompetenceKeyDown} />
                          </div>
                          <select value={selectedNiveau} onChange={e => setSelectedNiveau(e.target.value)}
                            className={`${inputCls} w-24 text-xs`}
                            style={{ ...inputStyle, paddingLeft: '8px', paddingRight: '20px' }}>
                            {NIVEAUX.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                          </select>
                        </div>

                        {/* Bouton "Créer" */}
                        {competenceSearch.trim().length >= 2 && (
                          <button type="button" onClick={handleAddCustomCompetence} disabled={addingCompetence}
                            className="pf-create-comp-btn mt-2">
                            {addingCompetence
                              ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              : <Plus className="w-4 h-4" />}
                            Créer &ldquo;{competenceSearch.trim()}&rdquo;
                          </button>
                        )}

                        {/* Dropdown suggestions */}
                        {showCompetenceDropdown && filteredCompetences.length > 0 && (
                          <div className="pf-comp-dropdown">
                            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                              Suggestions
                            </div>
                            {filteredCompetences.slice(0, 8).map((comp: any) => (
                              <button key={comp.id} type="button" className="pf-comp-dropdown-item" onClick={() => handleAddExistingCompetence(comp)}>
                                <span>{comp.nom}</span>
                                <Plus className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CV */}
                    <div>
                      <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>{t('profile.cv')}</label>
                      <div className="flex flex-wrap items-center gap-3">
                        {profile?.cv_url && (
                          <a href={`${BACKEND_URL}${profile.cv_url}`} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                            {t('profile.view_cv')} →
                          </a>
                        )}
                        <label className="pf-upload-label">
                          <Upload className="w-3.5 h-3.5" />
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
                      <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>{t('profile.niveau_etude')}</label>
                      <input type="text" placeholder={t('profile.niveau_etude_placeholder')} value={formData.niveau_etude}
                        onChange={e => setFormData({ ...formData, niveau_etude: e.target.value })}
                        className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>{t('profile.objectifs')}</label>
                      <textarea rows={3} placeholder={t('profile.objectifs_placeholder')} value={formData.objectifs}
                        onChange={e => setFormData({ ...formData, objectifs: e.target.value })}
                        className={`${inputCls} resize-none`} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>
                        <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />{t('profile.tags')}</span>
                      </label>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>{t('profile.tags_desc')}</p>
                      {formData.objectifs_tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {formData.objectifs_tags.map(tag => (
                            <span key={tag} className="pf-tag-chip">
                              {tag}
                              <button type="button" onClick={() => removeTag(tag)} className="ml-1 opacity-60 hover:opacity-100">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input type="text" placeholder={t('profile.tags_placeholder')} value={tagInput}
                          onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                          className={`${inputCls} flex-1`} style={inputStyle} />
                        <button type="button" onClick={addTag} className="pf-add-tag-btn">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('profile.tags_hint')}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pf-save-row">
              <button type="submit" disabled={saving} className="pf-save-btn">
                <Save className="w-4 h-4" />
                {saving ? t('common.saving') : t('profile.save')}
              </button>
            </div>
          </form>
        )}

        {/* ── Onglet : Sécurité ── */}
        {activeTab === 'securite' && (
          <form onSubmit={handleChangePassword} className="pf-tab-content">
            <div className="pf-section">
              <div className="pf-section-header">
                <Shield className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <div>
                  <h2 className="pf-section-title">Sécurité</h2>
                  <p className="pf-section-desc">Gérez l'accès à votre compte</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>Mot de passe actuel</label>
                  <input type="password" placeholder="Laissez vide si connecté via Google"
                    value={passwordData.ancien_mot_de_passe}
                    onChange={e => setPasswordData({ ...passwordData, ancien_mot_de_passe: e.target.value })}
                    className={inputCls} style={inputStyle} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>Nouveau mot de passe</label>
                    <input type="password" value={passwordData.nouveau_mot_de_passe}
                      onChange={e => setPasswordData({ ...passwordData, nouveau_mot_de_passe: e.target.value })}
                      className={inputCls} style={inputStyle} />
                    {passwordData.nouveau_mot_de_passe && (
                      <div className="mt-2 space-y-1">
                        {[
                          { ok: passwordData.nouveau_mot_de_passe.length >= 8, label: '8 caractères minimum' },
                          { ok: /[A-Z]/.test(passwordData.nouveau_mot_de_passe), label: '1 majuscule' },
                          { ok: /[0-9]/.test(passwordData.nouveau_mot_de_passe), label: '1 chiffre' },
                        ].map(({ ok, label }) => (
                          <div key={label} className="flex items-center gap-1.5 text-xs">
                            {ok
                              ? <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                              : <AlertCircle className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />}
                            <span style={{ color: ok ? 'var(--success)' : 'var(--text-tertiary)' }}>{label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>Confirmer</label>
                    <input type="password" value={passwordData.confirmation}
                      onChange={e => setPasswordData({ ...passwordData, confirmation: e.target.value })}
                      className={inputCls} style={inputStyle} />
                    {passwordData.confirmation && (
                      <p className="text-xs mt-1" style={{ color: passwordData.confirmation === passwordData.nouveau_mot_de_passe ? 'var(--success)' : 'var(--danger)' }}>
                        {passwordData.confirmation === passwordData.nouveau_mot_de_passe ? '✓ Correspond' : '✗ Ne correspond pas'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pf-save-row">
              <button type="submit" disabled={changingPassword || !passwordData.nouveau_mot_de_passe} className="pf-save-btn">
                <Lock className="w-4 h-4" />
                {changingPassword ? 'Modification…' : 'Modifier le mot de passe'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ══════════ STYLES ══════════ */}
      <style jsx global>{`
        /* ── Page ── */
        .pf-page { overflow-x: hidden; }

        /* ── Hero ── */
        .pf-hero {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
        }
        .pf-orb {
          position: absolute; border-radius: 9999px;
          filter: blur(72px); opacity: 0.5; will-change: transform;
        }
        .pf-orb-1 { width: 400px; height: 400px; top: -180px; right: -60px; animation: pfOrb1 22s ease-in-out infinite; }
        .pf-orb-2 { width: 300px; height: 300px; bottom: -100px; left: -60px; animation: pfOrb2 28s ease-in-out infinite; }
        @keyframes pfOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,20px) scale(1.06)} }
        @keyframes pfOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-15px) scale(1.05)} }

        .pf-grid-bg {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 40px 40px; opacity: 0.2;
          mask-image: radial-gradient(ellipse 70% 80% at 50% 0%, black 40%, transparent 100%);
        }

        /* ── Hero card ── */
        .pf-hero-card {
          display: flex; align-items: flex-start; gap: 24px; flex-wrap: wrap;
          padding-bottom: 0;
        }

        /* ── Avatar ── */
        .pf-avatar-wrapper { position: relative; flex-shrink: 0; }
        .pf-avatar-ring {
          position: relative; width: 100px; height: 100px;
          display: flex; align-items: center; justify-content: center;
        }
        .pf-ring-svg {
          position: absolute; inset: -6px;
          width: calc(100% + 12px); height: calc(100% + 12px);
          transform: rotate(-90deg);
        }
        .pf-ring-progress {
          transition: stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1);
        }
        .pf-avatar-upload-btn {
          position: absolute; bottom: -4px; right: -4px;
          width: 28px; height: 28px; border-radius: 50%;
          background-color: var(--accent); color: #06231D;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; border: 2px solid var(--card-bg);
          transition: transform 0.2s ease, filter 0.2s ease;
        }
        .pf-avatar-upload-btn:hover { transform: scale(1.12); filter: brightness(1.05); }

        /* ── Hero info ── */
        .pf-hero-info { flex: 1; min-width: 0; padding-bottom: 0; }
        .pf-hero-name {
          font-size: 26px; font-weight: 700; letter-spacing: -0.02em;
          color: var(--text-primary); margin: 0 0 4px;
          font-family: var(--font-display);
        }
        .pf-hero-email { font-size: 13px; color: var(--text-tertiary); margin: 0; }

        /* ── Badges ── */
        .pf-role-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;
          background-color: var(--accent-soft); color: var(--accent-text-on-soft);
        }
        .pf-disponible-toggle {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 9999px; font-size: 12px;
          border: none; cursor: pointer; transition: filter 0.2s ease;
        }
        .pf-disponible-toggle:hover { filter: brightness(1.05); }
        .pf-disponible-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        /* ── Completion bar ── */
        .pf-completion { margin-top: 16px; }
        .pf-progress-track { height: 4px; border-radius: 9999px; background-color: var(--bg-tertiary); overflow: hidden; }
        .pf-progress-fill { height: 100%; border-radius: 9999px; transition: width 0.8s cubic-bezier(0.16,1,0.3,1); }

        /* ── Stats ── */
        .pf-stats { display: flex; align-items: center; gap: 16px; margin-top: 14px; flex-wrap: wrap; }
        .pf-stat-item { display: flex; flex-direction: column; }
        .pf-stat-value { font-size: 16px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); line-height: 1; }
        .pf-stat-label { font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }
        .pf-stat-divider { width: 1px; height: 28px; background-color: var(--border); }

        /* ── Tabs ── */
        .pf-tabs-bar {
          display: flex; gap: 0; margin-top: 20px;
          border-bottom: none;
        }
        .pf-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 18px; font-size: 13px; font-weight: 500;
          color: var(--text-secondary); background: transparent; border: none; cursor: pointer;
          border-bottom: 2px solid transparent; transition: all 0.2s ease;
          margin-bottom: -1px;
        }
        .pf-tab:hover { color: var(--text-primary); background-color: var(--bg-primary); }
        .pf-tab-active {
          color: var(--accent); font-weight: 600;
          border-bottom-color: var(--accent);
          background-color: var(--bg-primary);
        }

        /* ── Tab content ── */
        .pf-tab-content { display: flex; flex-direction: column; gap: 20px; animation: pfFadeUp 0.35s cubic-bezier(0.16,1,0.3,1); }
        @keyframes pfFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

        /* ── Sections ── */
        .pf-section {
          background-color: var(--card-bg); border: 1px solid var(--border);
          border-radius: 16px; padding: 24px;
          box-shadow: var(--shadow-card);
        }
        .pf-section-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid var(--border); }
        .pf-section-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 2px; font-family: var(--font-display); }
        .pf-section-desc { font-size: 13px; color: var(--text-tertiary); margin: 0; }

        /* ── Input ── */
        .pf-input { border-radius: 10px; }
        .pf-input:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--accent-soft); }
        .pf-input:disabled { cursor: not-allowed; }

        /* ── Save row ── */
        .pf-save-row { display: flex; justify-content: flex-end; }
        .pf-save-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 24px; border-radius: 12px; border: none;
          background-color: var(--accent); color: #06231D;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: transform 0.2s ease, filter 0.2s ease;
        }
        .pf-save-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.05); }
        .pf-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Compétences ── */
        .pf-comp-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 10px 5px 12px; border-radius: 9999px; font-size: 12px;
          transition: transform 0.15s ease;
        }
        .pf-comp-chip:hover { transform: translateY(-1px); }

        .pf-create-comp-btn {
          width: 100%; padding: 9px; border-radius: 10px; font-size: 13px; font-weight: 600;
          display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;
          background-color: var(--success-soft); color: var(--success);
          border: 1px dashed var(--success); transition: filter 0.15s ease, transform 0.15s ease;
        }
        .pf-create-comp-btn:hover:not(:disabled) { filter: brightness(1.05); transform: translateY(-1px); }
        .pf-create-comp-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .pf-comp-dropdown {
          position: absolute; z-index: 50; width: 100%; margin-top: 4px;
          border-radius: 12px; overflow: hidden; max-height: 200px; overflow-y: auto;
          background-color: var(--card-bg); border: 1px solid var(--border);
          box-shadow: var(--shadow-card-hover);
        }
        .pf-comp-dropdown-item {
          width: 100%; padding: 9px 16px; text-align: left; font-size: 13px;
          display: flex; align-items: center; justify-content: space-between;
          color: var(--text-primary); background: transparent; border: none; cursor: pointer;
          transition: background-color 0.1s;
        }
        .pf-comp-dropdown-item:hover { background-color: var(--bg-secondary); }

        /* ── Tags ── */
        .pf-tag-chip {
          display: inline-flex; align-items: center;
          padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500;
          background-color: var(--accent-soft); color: var(--accent-text-on-soft);
          transition: transform 0.15s ease;
        }
        .pf-tag-chip:hover { transform: translateY(-1px); }
        .pf-add-tag-btn {
          padding: 0 14px; border-radius: 10px; border: none;
          background-color: var(--accent-soft); color: var(--accent-text-on-soft); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background-color 0.15s, transform 0.15s;
        }
        .pf-add-tag-btn:hover { background-color: var(--accent); color: #06231D; transform: scale(1.06); }

        /* ── Upload ── */
        .pf-upload-label {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 7px 14px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 500;
          border: 1.5px dashed var(--accent); color: var(--accent);
          transition: background-color 0.15s, transform 0.15s;
        }
        .pf-upload-label:hover { background-color: var(--accent-soft); transform: translateY(-1px); }

        /* ── Breadcrumb ── */
        .pf-breadcrumb { animation: pfFadeUp 0.4s cubic-bezier(0.16,1,0.3,1); }

        @media (prefers-reduced-motion: reduce) {
          .pf-orb, .pf-ring-progress, .pf-tab-content, .pf-breadcrumb, .pf-progress-fill {
            animation: none !important; transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}