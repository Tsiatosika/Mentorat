'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Trash2, Wrench, Code, Palette, TrendingUp, DollarSign, Users, MessageCircle, Scale, Heart, BookOpen, Cog, BarChart3, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

const ACCENT = '#14B8A6';

const CATEGORIES_CONFIG = [
  { nom: 'Informatique', icon: Code, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  { nom: 'Data Science', icon: BarChart3, color: '#14B8A6', bg: 'rgba(20,184,166,0.1)' },
  { nom: 'Design', icon: Palette, color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
  { nom: 'Marketing', icon: TrendingUp, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  { nom: 'Finance', icon: DollarSign, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  { nom: 'Management', icon: Users, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  { nom: 'Communication', icon: MessageCircle, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
  { nom: 'Droit', icon: Scale, color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  { nom: 'Santé', icon: Heart, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  { nom: 'Éducation', icon: BookOpen, color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
  { nom: 'Ingénierie', icon: Cog, color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
  { nom: 'Cybersécurité', icon: Shield, color: '#1E40AF', bg: 'rgba(30,64,175,0.1)' },
  { nom: 'Autre', icon: Wrench, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
];

export default function AdminCompetencesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [competences, setCompetences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComp, setNewComp] = useState('');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null);
  const [newCompCategorie, setNewCompCategorie] = useState('Informatique');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    fetchCompetences();
  }, [user]);

  const fetchCompetences = async () => {
    setLoading(true);
    try {
      const res = await api.get('/competences');
      setCompetences(res.data.competences || []);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const addCompetence = async () => {
    if (!newComp.trim()) return;
    setAdding(true);
    try {
      await api.post('/admin/competences', { nom: newComp.trim(), categorie: newCompCategorie });
      toast.success('Compétence ajoutée');
      setNewComp('');
      fetchCompetences();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setAdding(false);
    }
  };

  const deleteCompetence = async (id: string) => {
    if (!confirm('Supprimer cette compétence ?')) return;
    try {
      await api.delete(`/admin/competences/${id}`);
      toast.success('Supprimée');
      fetchCompetences();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const toggleCategorie = (categorie: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categorie)) next.delete(categorie);
      else next.add(categorie);
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
    CATEGORIES_CONFIG.forEach(config => {
      if (grouped[config.nom]) sorted[config.nom] = grouped[config.nom];
    });
    Object.keys(grouped).forEach(key => {
      if (!sorted[key]) sorted[key] = grouped[key];
    });

    return sorted;
  }, [competences, search]);

  const displayedCategories = selectedCategorie
    ? { [selectedCategorie]: competencesByCategorie[selectedCategorie] || [] }
    : competencesByCategorie;

  const totalFiltered = Object.values(displayedCategories).reduce((sum, comps) => sum + comps.length, 0);

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
        
        /* ═══ ADMIN HEADER COMPATIBLE CLAIR/SOMBRE ═══ */
        .admin-header {
          background: linear-gradient(135deg, #3B82F6, #60A5FA);
          padding: 28px 24px;
        }
        .dark .admin-header {
          background: linear-gradient(135deg, #1E3A5F, #0F172A);
        }
        
        @media (prefers-reduced-motion: reduce) { .cz-orb1,.cz-orb2,.comp-chip { animation: none !important; } }
      `}</style>

      <div className="cz-orb cz-orb1" />
      <div className="cz-orb cz-orb2" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="admin-header">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wrench size={16} style={{ color: '#A78BFA' }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A78BFA' }}>Administration</span>
                </div>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Compétences</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Gérer le référentiel de compétences par catégorie</p>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Wrench size={12} /> {competences.length} compétences
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 -mt-6 relative pb-12">
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
              {CATEGORIES_CONFIG.map((cat) => {
                const count = competences.filter((c: any) => (c.categorie || 'Autre') === cat.nom).length;
                return (
                  <div
                    key={cat.nom}
                    className={`cat-card p-3 rounded-xl text-center ${selectedCategorie === cat.nom ? 'active' : ''}`}
                    style={{ backgroundColor: 'var(--bg-secondary)', ['--cc' as any]: cat.color, ['--cb' as any]: cat.bg }}
                    onClick={() => setSelectedCategorie(selectedCategorie === cat.nom ? null : cat.nom)}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-1.5" style={{ backgroundColor: cat.bg }}>
                      <cat.icon size={18} style={{ color: cat.color }} />
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{cat.nom}</span>
                    <span className="text-[10px] block mt-0.5 font-mono-data" style={{ color: count > 0 ? cat.color : 'var(--text-tertiary)' }}>{count}</span>
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
              {CATEGORIES_CONFIG.map(cat => (<option key={cat.nom} value={cat.nom}>{cat.nom}</option>))}
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
          {loading ? (
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
                const config = CATEGORIES_CONFIG.find(c => c.nom === categorie);
                const isCollapsed = collapsedCategories.has(categorie);
                const Icon = config?.icon || Wrench;
                const color = config?.color || '#6B7280';
                const bg = config?.bg || 'rgba(107,114,128,0.1)';

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
                          <span key={c.id} className="comp-chip flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium group"
                            style={{ backgroundColor: bg, color: color, animationDelay: `${i * 30}ms` }}>
                            {c.nom}
                            <button onClick={(e) => { e.stopPropagation(); deleteCompetence(c.id); }}
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
    </div>
  );
}