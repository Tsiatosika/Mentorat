'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, BookOpen, Save, Upload, Tag, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mentorAPI, mentoreAPI, uploadAPI, BACKEND_URL } from '@/services/api';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bio: '',
    domaine: '',
    niveau_etude: '',
    objectifs: '',
    objectifs_tags: [] as string[],
    annees_experience: 0,
    disponible: true,
  });

  const getPhotoUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchProfile();
  }, [user, router]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (user?.role === 'mentor') {
        const res = await mentorAPI.getProfile();
        const p = res.data.profile;
        setProfile(p);
        // Mettre à jour la photo depuis le profil
        const newPhotoUrl = p.photo_url || user?.photo_url || null;
        setPhotoUrl(newPhotoUrl);
        
        // Synchroniser le contexte si nécessaire
        if (newPhotoUrl !== user?.photo_url) {
          updateUser({ ...user, photo_url: newPhotoUrl });
        }
        
        setFormData({
          bio: p.bio || '',
          domaine: p.domaine || '',
          niveau_etude: '',
          objectifs: '',
          objectifs_tags: [],
          annees_experience: p.annees_experience || 0,
          disponible: p.disponible ?? true,
        });
      } else {
        const res = await mentoreAPI.getProfile();
        const p = res.data.profile;
        setProfile(p);
        const newPhotoUrl = p.photo_url || user?.photo_url || null;
        setPhotoUrl(newPhotoUrl);
        
        if (newPhotoUrl !== user?.photo_url) {
          updateUser({ ...user, photo_url: newPhotoUrl });
        }
        
        setFormData({
          bio: '',
          domaine: p.domaine || '',
          niveau_etude: p.niveau_etude || '',
          objectifs: p.objectifs || '',
          objectifs_tags: Array.isArray(p.objectifs_tags) ? p.objectifs_tags.filter(Boolean) : [],
          annees_experience: 0,
          disponible: true,
        });
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    if (formData.objectifs_tags.includes(tag)) { toast.error('Ce tag existe déjà'); return; }
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo trop lourde (max 5 Mo)');
      return;
    }
    
    try {
      const res = await uploadAPI.photo(file);
      if (res.data.success) {
        const newPhotoUrl = res.data.url;
        setPhotoUrl(newPhotoUrl);
        // Mettre à jour le contexte
        updateUser({ ...user, photo_url: newPhotoUrl });
        toast.success('Photo mise à jour');
        // Recharger le profil pour être sûr
        await fetchProfile();
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error("Erreur lors de l'upload de la photo");
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Veuillez sélectionner un fichier PDF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('CV trop lourd (max 5 Mo)');
      return;
    }
    try {
      await uploadAPI.cv(file);
      toast.success('CV uploadé avec succès');
      fetchProfile();
    } catch {
      toast.error("Erreur lors de l'upload du CV");
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
      toast.success('Profil mis à jour — les recommandations IA vont se recalculer');
      fetchProfile();
    } catch {
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
  const displayPhotoUrl = getPhotoUrl(photoUrl || user?.photo_url || null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">Mon profil</h1>
          <p className="text-indigo-100 mt-1">Gérez vos informations personnelles</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Carte photo */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" /> Photo de profil
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              {displayPhotoUrl ? (
                <img 
                  src={displayPhotoUrl} 
                  alt="Photo de profil" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Si l'image ne charge pas, afficher les initiales
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<span class="text-2xl font-bold text-white">${user?.prenom?.[0]}${user?.nom?.[0]}</span>`;
                  }}
                />
              ) : (
                <span className="text-2xl font-bold text-white">{user?.prenom?.[0]}{user?.nom?.[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors text-sm text-indigo-600 w-fit">
                <Upload className="w-4 h-4" />
                Changer la photo
                <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handlePhotoUpload} />
              </label>
              <p className="text-xs text-gray-400 mt-2">Formats acceptés : JPG, PNG (max 5 Mo)</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Informations personnelles */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" /> Informations personnelles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input disabled value={`${user?.prenom} ${user?.nom}`}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input disabled value={user?.email || ''}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Profil spécifique au rôle */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {isMentor
                ? <><Briefcase className="w-5 h-5 text-indigo-600" /> Informations professionnelles</>
                : <><BookOpen className="w-5 h-5 text-indigo-600" /> Parcours académique</>
              }
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domaine</label>
                <input type="text" placeholder="Ex: Informatique, Marketing, Design..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.domaine}
                  onChange={(e) => setFormData({ ...formData, domaine: e.target.value })}
                />
              </div>

              {isMentor ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biographie</label>
                    <textarea rows={4} placeholder="Présentez votre parcours et votre expertise..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Années d'expérience</label>
                      <input type="number" min={0} max={50}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={formData.annees_experience}
                        onChange={(e) => setFormData({ ...formData, annees_experience: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div
                          className={`relative w-11 h-6 rounded-full transition-colors ${formData.disponible ? 'bg-indigo-600' : 'bg-gray-300'}`}
                          onClick={() => setFormData(prev => ({ ...prev, disponible: !prev.disponible }))}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${formData.disponible ? 'translate-x-5' : ''}`} />
                        </div>
                        <span className="text-sm text-gray-700">
                          {formData.disponible ? 'Disponible pour mentorat' : 'Indisponible'}
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CV (PDF)</label>
                    <div className="flex flex-wrap items-center gap-3">
                      {profile?.cv_url && (
                        <a href={getPhotoUrl(profile.cv_url)} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:underline">
                          Voir le CV actuel
                        </a>
                      )}
                      <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors text-sm text-indigo-600">
                        <Upload className="w-4 h-4" />
                        {profile?.cv_url ? 'Remplacer le CV' : 'Uploader le CV'}
                        <input type="file" accept="application/pdf" className="hidden" onChange={handleCVUpload} />
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau d'étude</label>
                    <input type="text" placeholder="Ex: Licence 3, Master 2, Doctorat..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={formData.niveau_etude}
                      onChange={(e) => setFormData({ ...formData, niveau_etude: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objectifs d'apprentissage</label>
                    <textarea rows={3} placeholder="Décrivez vos objectifs d'apprentissage..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      value={formData.objectifs}
                      onChange={(e) => setFormData({ ...formData, objectifs: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Tag className="w-4 h-4" /> Mots-clés pour le matching IA
                    </label>
                    <p className="text-xs text-gray-400 mb-2">Ces mots-clés sont utilisés par l'algorithme IA pour trouver les meilleurs mentors.</p>
                    {formData.objectifs_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.objectifs_tags.map((tag) => (
                          <span key={tag} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input type="text" placeholder="Ex: python, machine learning..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                      />
                      <button type="button" onClick={addTag}
                        className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Appuyez sur Entrée ou , pour ajouter un tag</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium">
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}