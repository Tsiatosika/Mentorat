'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, BookOpen, Save, Upload, Tag, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { mentorAPI, mentoreAPI, uploadAPI, BACKEND_URL } from '@/services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
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
        setPhotoUrl(p.photo_url || user?.photo_url || null);
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
        setPhotoUrl(p.photo_url || user?.photo_url || null);
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
      toast.error(t('common.error'));
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
      toast.success('CV uploadé avec succès');
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
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const isMentor = user?.role === 'mentor';
  const displayPhotoUrl = getPhotoUrl(photoUrl || user?.photo_url || null);

  const inputStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-8">
        <p className="font-mono-data text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
          {t('profile.info')}
        </p>
        <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('profile.title')}
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8 space-y-6">
        {/* Photo */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <User className="w-5 h-5" style={{ color: 'var(--accent)' }} /> {t('profile.photo')}
          </h2>
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-soft)' }}
            >
              {displayPhotoUrl ? (
                <img src={displayPhotoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold" style={{ color: 'var(--accent-text-on-soft)' }}>
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </span>
              )}
            </div>
            <label
              className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm w-fit"
              style={{ border: '2px dashed var(--accent)', color: 'var(--accent)' }}
            >
              <Upload className="w-4 h-4" />
              {t('profile.photo')}
              <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Infos personnelles */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <User className="w-5 h-5" style={{ color: 'var(--accent)' }} /> {t('profile.info')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.nom_complet')}</label>
                <input
                  disabled
                  value={`${user?.prenom} ${user?.nom}`}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <input
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>
          </div>

          {/* Profil spécifique */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              {isMentor ? <Briefcase className="w-5 h-5" style={{ color: 'var(--accent)' }} /> : <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />}
              {isMentor ? t('profile.experience') : t('profile.academic')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.domaine')}</label>
                <input
                  type="text"
                  placeholder={t('profile.domaine_placeholder')}
                  className="w-full px-4 py-2 border rounded-lg outline-none transition-all"
                  style={inputStyle}
                  value={formData.domaine}
                  onChange={(e) => setFormData({ ...formData, domaine: e.target.value })}
                />
              </div>

              {isMentor ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.bio')}</label>
                    <textarea
                      rows={4}
                      placeholder={t('profile.bio_placeholder')}
                      className="w-full px-4 py-2 border rounded-lg outline-none transition-all resize-none"
                      style={inputStyle}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.annees_experience')}</label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className="w-full px-4 py-2 border rounded-lg outline-none transition-all"
                        style={inputStyle}
                        value={formData.annees_experience}
                        onChange={(e) => setFormData({ ...formData, annees_experience: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div
                          className="relative w-11 h-6 rounded-full transition-colors"
                          style={{ backgroundColor: formData.disponible ? 'var(--accent)' : 'var(--bg-tertiary)' }}
                          onClick={() => setFormData(prev => ({ ...prev, disponible: !prev.disponible }))}
                        >
                          <div
                            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                            style={{ transform: formData.disponible ? 'translateX(20px)' : 'translateX(0)' }}
                          />
                        </div>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {formData.disponible ? t('profile.disponible') : t('profile.indisponible')}
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.cv')}</label>
                    <div className="flex flex-wrap items-center gap-3">
                      {profile?.cv_url && (
                        <a
                          href={getPhotoUrl(profile.cv_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          {t('profile.view_cv')}
                        </a>
                      )}
                      <label
                        className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm"
                        style={{ border: '2px dashed var(--accent)', color: 'var(--accent)' }}
                      >
                        <Upload className="w-4 h-4" />
                        {profile?.cv_url ? t('profile.replace_cv') : t('profile.upload_cv')}
                        <input type="file" accept="application/pdf" className="hidden" onChange={handleCVUpload} />
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.niveau_etude')}</label>
                    <input
                      type="text"
                      placeholder={t('profile.niveau_etude_placeholder')}
                      className="w-full px-4 py-2 border rounded-lg outline-none transition-all"
                      style={inputStyle}
                      value={formData.niveau_etude}
                      onChange={(e) => setFormData({ ...formData, niveau_etude: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('profile.objectifs')}</label>
                    <textarea
                      rows={3}
                      placeholder={t('profile.objectifs_placeholder')}
                      className="w-full px-4 py-2 border rounded-lg outline-none transition-all resize-none"
                      style={inputStyle}
                      value={formData.objectifs}
                      onChange={(e) => setFormData({ ...formData, objectifs: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <Tag className="w-4 h-4" /> {t('profile.tags')}
                    </label>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>{t('profile.tags_desc')}</p>
                    {formData.objectifs_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.objectifs_tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                            style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}
                          >
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t('profile.tags_placeholder')}
                        className="flex-1 px-4 py-2 border rounded-lg outline-none transition-all text-sm"
                        style={inputStyle}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-2 rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('profile.tags_hint')}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
            >
              <Save className="w-4 h-4" />
              {saving ? t('common.saving') : t('profile.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}