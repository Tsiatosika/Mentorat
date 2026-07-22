'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Trash2, Pencil, Wrench, Palette, ChevronDown, ChevronUp, X,
  Code, Briefcase, MessageCircle, Scale, Globe, Stethoscope,
  BookOpen, Music, Camera, Heart, Star, ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

// ═══ Référentiel d'icônes disponibles pour les catégories ═══
// On stocke seulement la "clé" (string) en base ; le composant réel est
// résolu ici, côté frontend, via ICON_MAP.
const ICON_OPTIONS: { key: string; Icon: any }[] = [
  { key: 'Code', Icon: Code },
  { key: 'Briefcase', Icon: Briefcase },
  { key: 'MessageCircle', Icon: MessageCircle },
  { key: 'Scale', Icon: Scale },
  { key: 'Globe', Icon: Globe },
  { key: 'Stethoscope', Icon: Stethoscope },
  { key: 'Wrench', Icon: Wrench },
  { key: 'BookOpen', Icon: BookOpen },
  { key: 'Music', Icon: Music },
  { key: 'Camera', Icon: Camera },
  { key: 'Heart', Icon: Heart },
  { key: 'Star', Icon: Star },
  { key: 'ShoppingBag', Icon: ShoppingBag },
];
const ICON_MAP: Record<string, any> = Object.fromEntries(ICON_OPTIONS.map(o => [o.key, o.Icon]));

// Palette de couleurs proposées (évite les couleurs arbitraires mal contrastées)
const COLOR_PALETTE = [
  '#3B82F6', '#F59E0B', '#06B6D4', '#6366F1', '#10B981',
  '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6', '#6B7280',
];

function hexToRgba(hex: string, alpha = 0.1) {
  const clean = (hex || '#6B7280').replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ACCENT = '#14B8A6';

export default function AdminCompetencesPage() {
  const { user } = useAuth();
  const router = useRouter();

  // ── Compétences ──
  const [competences, setCompetences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComp, setNewComp] = useState('');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null);
  const [newCompCategorie, setNewCompCategorie] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const [editingComp, setEditingComp] = useState<any | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editCategorie, setEditCategorie] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Catégories (référentiel : nom + icône + couleur) ──
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCategoriesPanel, setShowCategoriesPanel] = useState(false);

  const [newCatNom, setNewCatNom] = useState('');
  const [newCatIcone, setNewCatIcone] = useState('Wrench');
  const [newCatCouleur, setNewCatCouleur] = useState(COLOR_PALETTE[0]);
  const [addingCategorie, setAddingCategorie] = useState(false);

  const [editingCategorie, setEditingCategorie] = useState<any | null>(null);
  const [editCatNom, setEditCatNom] = useState('');
  const [editCatIcone, setEditCatIcone] = useState('Wrench');
  const [editCatCouleur, setEditCatCouleur] = useState(COLOR_PALETTE[0]);
  const [savingCategorie, setSavingCategorie] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    fetchCompetences();
    fetchCategories();
  }, [user]);

  const fetchCompetences = async () => {
    setLoading(true);
    try {
      const res = await api.get('/competences');
      setCompetences(res.data.competences || []);
    } catch { toast.error('Erreur chargement compétences'); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.get('/admin/categories');
      const cats = res.data.categories || [];
      setCategories(cats);
      // Valeur par défaut des selects, une fois les catégories chargées
      if (cats.length > 0) {
        setNewCompCategorie(prev => prev || cats[0].nom);
      }
    } catch { toast.error('Erreur chargement catégories'); }
    finally { setLoadingCategories(false); }
  };

  // ═══ CRUD Compétences ═══

  const addCompetence = async () => {
    if (!newComp.trim()) return;
    setAdding(true);
    try {
      await api.post('/admin/competences', { nom: newComp.trim(), categorie: newCompCategorie });
      toast.success('Compétence ajoutée');
      setNewComp('');
      fetchCompetences();
    } catch (error: any) {
      if (error.response?.status === 409) {
        const existante = error.response?.data?.competence;
        toast.error(
          existante
            ? `Déjà existante : "${existante.nom}" (${existante.categorie})`
            : error.response?.data?.message || 'Cette compétence existe déjà'
        );
      } else {
        toast.error(error.response?.data?.message || "Erreur lors de l'ajout");
      }
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (c: any) => {
    setEditingComp(c);
    setEditNom(c.nom);
    setEditCategorie(c.categorie || categories[0]?.nom || 'Autre');
  };
  const cancelEdit = () => { setEditingComp(null); setEditNom(''); setEditCategorie(''); };

  const saveEdit = async () => {
    if (!editingComp || !editNom.trim()) return;
    setSaving(true);
    try {
      await api.put(`/admin/competences/${editingComp.id}`, { nom: editNom.trim(), categorie: editCategorie });
      toast.success('Compétence mise à jour');
      cancelEdit();
      fetchCompetences();
    } catch (error: any) {
      if (error.response?.status === 409) {
        const conflit = error.response?.data?.competence;
        toast.error(conflit ? `Déjà pris par "${conflit.nom}" (${conflit.categorie})` : error.response?.data?.message || 'Ce nom est déjà utilisé');
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteCompetence = async (id: string, nom: string) => {
    let nbMentors = 0;
    try {
      const usageRes = await api.get(`/admin/competences/${id}/usage`);
      nbMentors = usageRes.data?.nbMentors ?? 0;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Impossible de vérifier l'usage de cette compétence");
      return;
    }
    const message = nbMentors > 0
      ? `"${nom}" est utilisée par ${nbMentors} mentor${nbMentors > 1 ? 's' : ''}. La supprimer la retirera de ${nbMentors > 1 ? 'leurs profils' : 'son profil'}. Continuer ?`
      : `Supprimer la compétence "${nom}" ? Cette action est irréversible.`;
    if (!confirm(message)) return;
    try {
      await api.delete(`/admin/competences/${id}`);
      toast.success(nbMentors > 0 ? `Supprimée — retirée de ${nbMentors} mentor${nbMentors > 1 ? 's' : ''}` : 'Supprimée');
      fetchCompetences();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // ═══ CRUD Catégories ═══

  const addCategorie = async () => {
    if (!newCatNom.trim()) return;
    setAddingCategorie(true);
    try {
      await api.post('/admin/categories', { nom: newCatNom.trim(), icone: newCatIcone, couleur: newCatCouleur });
      toast.success('Catégorie ajoutée');
      setNewCatNom('');
      setNewCatIcone('Wrench');
      setNewCatCouleur(COLOR_PALETTE[0]);
      fetchCategories();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error(error.response?.data?.message || 'Cette catégorie existe déjà');
      } else {
        toast.error(error.response?.data?.message || "Erreur lors de l'ajout de la catégorie");
      }
    } finally {
      setAddingCategorie(false);
    }
  };

  const startEditCategorie = (cat: any) => {
    setEditingCategorie(cat);
    setEditCatNom(cat.nom);
    setEditCatIcone(cat.icone || 'Wrench');
    setEditCatCouleur(cat.couleur || COLOR_PALETTE[0]);
  };
  const cancelEditCategorie = () => {
    setEditingCategorie(null); setEditCatNom(''); setEditCatIcone('Wrench'); setEditCatCouleur(COLOR_PALETTE[0]);
  };

  const saveEditCategorie = async () => {
    if (!editingCategorie || !editCatNom.trim()) return;
    setSavingCategorie(true);
    try {
      const res = await api.put(`/admin/categories/${editingCategorie.id}`, {
        nom: editCatNom.trim(), icone: editCatIcone, couleur: editCatCouleur,
      });
      const nbMaj = res.data?.competencesMisesAJour ?? 0;
      const nbProfils = res.data?.profilsMisAJour ?? 0;
      const parts = [];
      if (nbMaj > 0) parts.push(`${nbMaj} compétence${nbMaj > 1 ? 's' : ''}`);
      if (nbProfils > 0) parts.push(`${nbProfils} profil${nbProfils > 1 ? 's' : ''}`);
      toast.success(parts.length > 0 ? `Catégorie mise à jour — ${parts.join(' et ')} réaffecté(s)` : 'Catégorie mise à jour');
      cancelEditCategorie();
      fetchCategories();
      fetchCompetences(); // le nom de catégorie peut avoir changé sur des compétences
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error(error.response?.data?.message || 'Ce nom est déjà utilisé par une autre catégorie');
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      }
    } finally {
      setSavingCategorie(false);
    }
  };

  const deleteCategorie = async (id: string, nom: string) => {
    if (nom === 'Autre') {
      toast.error('La catégorie "Autre" ne peut pas être supprimée (catégorie de repli)');
      return;
    }
    let nbCompetences = 0;
    let nbMentors = 0;
    let nbMentores = 0;
    try {
      const usageRes = await api.get(`/admin/categories/${id}/usage`);
      nbCompetences = usageRes.data?.nbCompetences ?? 0;
      nbMentors = usageRes.data?.nbMentors ?? 0;
      nbMentores = usageRes.data?.nbMentores ?? 0;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Impossible de vérifier l'usage de cette catégorie");
      return;
    }
    const nbProfils = nbMentors + nbMentores;
    const parts = [];
    if (nbCompetences > 0) parts.push(`${nbCompetences} compétence${nbCompetences > 1 ? 's' : ''}`);
    if (nbProfils > 0) parts.push(`${nbProfils} profil${nbProfils > 1 ? 's' : ''} (mentor/mentoré)`);
    const message = parts.length > 0
      ? `"${nom}" est utilisée par ${parts.join(' et ')}. Tout sera basculé vers "Autre". Continuer ?`
      : `Supprimer la catégorie "${nom}" ?`;
    if (!confirm(message)) return;
    try {
      const res = await api.delete(`/admin/categories/${id}`);
      const nbReassignComp = res.data?.competencesReassignees ?? 0;
      const nbReassignProfils = res.data?.profilsReassignes ?? 0;
      const doneParts = [];
      if (nbReassignComp > 0) doneParts.push(`${nbReassignComp} compétence${nbReassignComp > 1 ? 's' : ''}`);
      if (nbReassignProfils > 0) doneParts.push(`${nbReassignProfils} profil${nbReassignProfils > 1 ? 's' : ''}`);
      toast.success(doneParts.length > 0 ? `Supprimée — ${doneParts.join(' et ')} basculé(s) vers "Autre"` : 'Catégorie supprimée');
      fetchCategories();
      fetchCompetences();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const toggleCategorie = (categorie: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categorie)) next.delete(categorie); else next.add(categorie);
      return next;
    });
  };

  const competencesByCategorie = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    const filtered = competences.filter((c: any) => c.nom?.toLowerCase().includes(search.toLowerCase()));
    filtered.forEach((c: any) => {
      const cat = c.categorie || 'Autre';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(c);
    });
    const sorted: Record<string, any[]> = {};
    categories.forEach(cat => { if (grouped[cat.nom]) sorted[cat.nom] = grouped[cat.nom]; });
    Object.keys(grouped).forEach(key => { if (!sorted[key]) sorted[key] = grouped[key]; });
    return sorted;
  }, [competences, search, categories]);

  const displayedCategories = selectedCategorie
    ? { [selectedCategorie]: competencesByCategorie[selectedCategorie] || [] }
    : competencesByCategorie;

  const totalFiltered = Object.values(displayedCategories).reduce((sum, comps) => sum + comps.length, 0);

  const getCatConfig = (nom: string) => {
    const cat = categories.find(c => c.nom === nom);
    return {
      Icon: ICON_MAP[cat?.icone] || Wrench,
      color: cat?.couleur || '#6B7280',
      bg: hexToRgba(cat?.couleur || '#6B7280', 0.1),
    };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <style>{`
        .cz-orb { position: absolute; border-radius: 50%; filter: blur(75px); opacity: 0.2; pointer-events: none; z-index: 0; }
        .cz-orb1 { width: 420px; height: 420px; top: -170px; left: 10%; background: radial-gradient(circle, ${ACCENT}, transparent 70%); animation: czFloat 23s ease-in-out infinite; }
        .cz-orb2 { width: 360px; height: 360px; bottom: -160px; right: 5%; background: radial-gradient(circle, #34D399, transparent 70%); animation: czFloat 19s ease-in-out infinite reverse; }
        @keyframes czFloat { 0%,100% { transform: translate(0,0); } 50% { transform: translate(25px,-30px) scale(1.08); } }
        .cat-card { transition: all 0.3s ease; cursor: pointer; border: 2px solid transparent; }
        .cat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); }
        .cat-card.active { border-color: var(--cc) !important; background: var(--cb) !important; }
        .comp-chip { transition: all 0.25s ease; opacity: 0; transform: translateY(10px) scale(.9); animation: chipIn .45s cubic-bezier(.34,1.56,.64,1) forwards; }
        @keyframes chipIn { to { opacity: 1; transform: translateY(0) scale(1); } }
        .comp-chip:hover { transform: translateY(-3px) scale(1.05) !important; box-shadow: 0 6px 16px rgba(0,0,0,0.1); }
        .admin-header { background: linear-gradient(135deg, #3B82F6, #60A5FA); padding: 28px 24px; }
        .dark .admin-header { background: linear-gradient(135deg, #1E3A5F, #0F172A); }
        .edit-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px; }
        .edit-modal { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 24px; width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; }
        .icon-btn { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid transparent; }
        .icon-btn.active { border-color: ${ACCENT}; }
        .color-swatch { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; }
        .color-swatch.active { border-color: var(--text-primary); transform: scale(1.15); }
        @media (prefers-reduced-motion: reduce) { .cz-orb1,.cz-orb2,.comp-chip { animation: none !important; } }
      `}</style>

      <div className="cz-orb cz-orb1" />
      <div className="cz-orb cz-orb2" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="admin-header">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wrench size={16} style={{ color: '#A78BFA' }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A78BFA' }}>Administration</span>
                </div>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Compétences</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Gérer le référentiel de compétences et de catégories</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <Wrench size={12} /> {competences.length} compétences
                </span>
                <button onClick={() => setShowCategoriesPanel(v => !v)}
                  className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold"
                  style={{ background: showCategoriesPanel ? '#fff' : 'rgba(255,255,255,0.15)', color: showCategoriesPanel ? '#1E3A5F' : 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                  <Palette size={12} /> Gérer les catégories
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 -mt-6 relative pb-12">

          {/* ═══ Panneau de gestion des catégories ═══ */}
          {showCategoriesPanel && (
            <div className="card p-5 mb-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Palette size={16} style={{ color: ACCENT }} /> Catégories ({categories.length})
              </h3>

              {loadingCategories ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="skeleton rounded-full" style={{ width: '90px', height: '32px' }} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mb-5">
                  {categories.map(cat => {
                    const Icon = ICON_MAP[cat.icone] || Wrench;
                    return (
                      <span key={cat.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium group"
                        style={{ backgroundColor: hexToRgba(cat.couleur, 0.12), color: cat.couleur }}>
                        <Icon size={13} />
                        {cat.nom}
                        <span className="text-[10px] opacity-70">({cat.nb_competences})</span>
                        <button onClick={() => startEditCategorie(cat)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-black/10"
                          title="Modifier">
                          <Pencil size={11} />
                        </button>
                        {cat.nom !== 'Autre' && (
                          <button onClick={() => deleteCategorie(cat.id, cat.nom)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-red-100"
                            style={{ color: 'var(--danger)' }} title="Supprimer">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Ajout d'une catégorie */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Nouvelle catégorie</p>
                <div className="flex flex-wrap items-start gap-4">
                  <input
                    type="text" placeholder="Nom de la catégorie" value={newCatNom}
                    onChange={e => setNewCatNom(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategorie()}
                    style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', minWidth: '180px' }}
                  />
                  <div className="flex gap-1.5 flex-wrap max-w-[220px]">
                    {ICON_OPTIONS.map(({ key, Icon }) => (
                      <div key={key} className={`icon-btn ${newCatIcone === key ? 'active' : ''}`}
                        style={{ backgroundColor: 'var(--bg-secondary)' }} onClick={() => setNewCatIcone(key)}>
                        <Icon size={16} style={{ color: newCatIcone === key ? newCatCouleur : 'var(--text-tertiary)' }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                    {COLOR_PALETTE.map(color => (
                      <div key={color} className={`color-swatch ${newCatCouleur === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }} onClick={() => setNewCatCouleur(color)} />
                    ))}
                  </div>
                  <button onClick={addCategorie} disabled={addingCategorie || !newCatNom.trim()}
                    style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${ACCENT}, #34D399)`, color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', opacity: addingCategorie || !newCatNom.trim() ? 0.55 : 1, whiteSpace: 'nowrap' }}>
                    {addingCategorie ? (<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />) : (<Plus size={14} />)}
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filtres par catégorie */}
          <div className="card p-5 mb-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Palette size={16} style={{ color: ACCENT }} /> Filtrer par catégorie
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div
                className={`cat-card p-3 rounded-xl text-center ${selectedCategorie === null ? 'active' : ''}`}
                style={{ backgroundColor: 'var(--bg-secondary)', ['--cc' as any]: ACCENT, ['--cb' as any]: 'rgba(20,184,166,0.08)' }}
                onClick={() => setSelectedCategorie(null)}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-1.5" style={{ backgroundColor: 'rgba(20,184,166,0.15)' }}>
                  <Wrench size={18} style={{ color: ACCENT }} />
                </div>
                <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>Tous</span>
                <span className="text-[10px] block mt-0.5 font-mono-data" style={{ color: 'var(--text-tertiary)' }}>{competences.length}</span>
              </div>
              {categories.map((cat) => {
                const Icon = ICON_MAP[cat.icone] || Wrench;
                const count = competences.filter((c: any) => (c.categorie || 'Autre') === cat.nom).length;
                const bg = hexToRgba(cat.couleur, 0.1);
                return (
                  <div
                    key={cat.id}
                    className={`cat-card p-3 rounded-xl text-center ${selectedCategorie === cat.nom ? 'active' : ''}`}
                    style={{ backgroundColor: 'var(--bg-secondary)', ['--cc' as any]: cat.couleur, ['--cb' as any]: bg }}
                    onClick={() => setSelectedCategorie(selectedCategorie === cat.nom ? null : cat.nom)}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-1.5" style={{ backgroundColor: bg }}>
                      <Icon size={18} style={{ color: cat.couleur }} />
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{cat.nom}</span>
                    <span className="text-[10px] block mt-0.5 font-mono-data" style={{ color: count > 0 ? cat.couleur : 'var(--text-tertiary)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ajout + Recherche */}
          <div className="card p-4 mb-6 flex flex-wrap items-center gap-3" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <div className="relative flex-1 min-w-[180px]">
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text" placeholder="Rechercher une compétence..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <select value={newCompCategorie} onChange={e => setNewCompCategorie(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', minWidth: '140px' }}>
              {categories.map(cat => (<option key={cat.id} value={cat.nom}>{cat.nom}</option>))}
            </select>

            <div className="flex gap-2 flex-1 min-w-[200px]">
              <input
                type="text" placeholder="Nouvelle compétence..." value={newComp} onChange={e => setNewComp(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCompetence()}
                style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
              />
              <button onClick={addCompetence} disabled={adding || !newComp.trim()}
                style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${ACCENT}, #34D399)`, color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', opacity: adding || !newComp.trim() ? 0.55 : 1, whiteSpace: 'nowrap' }}>
                {adding ? (<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />) : (<Plus size={16} />)}
                Ajouter
              </button>
            </div>
          </div>

          {/* Liste par catégorie */}
          {loading || loadingCategories ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
                  <div className="skeleton rounded-lg" style={{ width: '120px', height: '20px', marginBottom: '12px' }} />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="skeleton rounded-full" style={{ width: `${70 + (j % 3) * 30}px`, height: '30px' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : totalFiltered === 0 ? (
            <div className="card p-12 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
              <Wrench size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Aucune compétence trouvée</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Ajoutez une nouvelle compétence ci-dessus.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(displayedCategories).map(([categorie, comps]) => {
                const isCollapsed = collapsedCategories.has(categorie);
                const { Icon, color, bg } = getCatConfig(categorie);

                return (
                  <div key={categorie} className="card" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={() => toggleCategorie(categorie)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}><Icon size={20} style={{ color }} /></div>
                        <div><h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{categorie}</h3><p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{comps.length} compétence{comps.length > 1 ? 's' : ''}</p></div>
                      </div>
                      <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        {isCollapsed ? <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} />}
                      </button>
                    </div>

                    {!isCollapsed && (
                      <div className="px-4 pb-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                        {comps.map((c: any, i: number) => (
                          <span key={c.id} className="comp-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium group"
                            style={{ backgroundColor: bg, color, animationDelay: `${i * 30}ms` }}>
                            {c.nom}
                            <button onClick={(e) => { e.stopPropagation(); startEdit(c); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                              style={{ color }} title="Modifier">
                              <Pencil size={12} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteCompetence(c.id, c.nom); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                              style={{ color: 'var(--danger)' }} title="Supprimer">
                              <Trash2 size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'édition — compétence */}
      {editingComp && (
        <div className="edit-modal-overlay" onClick={cancelEdit}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Modifier la compétence</h3>
              <button onClick={cancelEdit} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} style={{ color: 'var(--text-tertiary)' }} /></button>
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Nom</label>
            <input type="text" value={editNom} onChange={e => setEditNom(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', marginBottom: '14px' }} />
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Catégorie</label>
            <select value={editCategorie} onChange={e => setEditCategorie(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', marginBottom: '20px' }}>
              {categories.map(cat => (<option key={cat.id} value={cat.nom}>{cat.nom}</option>))}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={cancelEdit} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer' }}>Annuler</button>
              <button onClick={saveEdit} disabled={saving || !editNom.trim()}
                style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${ACCENT}, #34D399)`, color: '#fff', fontWeight: 600, opacity: saving || !editNom.trim() ? 0.55 : 1 }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition — catégorie */}
      {editingCategorie && (
        <div className="edit-modal-overlay" onClick={cancelEditCategorie}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Modifier la catégorie</h3>
              <button onClick={cancelEditCategorie} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} style={{ color: 'var(--text-tertiary)' }} /></button>
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Nom</label>
            <input type="text" value={editCatNom} onChange={e => setEditCatNom(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEditCategorie()} autoFocus
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', marginBottom: '14px' }} />

            <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>Icône</label>
            <div className="flex gap-1.5 flex-wrap mb-4">
              {ICON_OPTIONS.map(({ key, Icon }) => (
                <div key={key} className={`icon-btn ${editCatIcone === key ? 'active' : ''}`}
                  style={{ backgroundColor: 'var(--bg-secondary)' }} onClick={() => setEditCatIcone(key)}>
                  <Icon size={16} style={{ color: editCatIcone === key ? editCatCouleur : 'var(--text-tertiary)' }} />
                </div>
              ))}
            </div>

            <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>Couleur</label>
            <div className="flex gap-1.5 flex-wrap mb-5">
              {COLOR_PALETTE.map(color => (
                <div key={color} className={`color-swatch ${editCatCouleur === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }} onClick={() => setEditCatCouleur(color)} />
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={cancelEditCategorie} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer' }}>Annuler</button>
              <button onClick={saveEditCategorie} disabled={savingCategorie || !editCatNom.trim()}
                style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${ACCENT}, #34D399)`, color: '#fff', fontWeight: 600, opacity: savingCategorie || !editCatNom.trim() ? 0.55 : 1 }}>
                {savingCategorie ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}