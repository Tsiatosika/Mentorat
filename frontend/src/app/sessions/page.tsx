'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface Session {
  id: string; sujet: string; description: string; date_debut: string; date_fin: string;
  statut: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';
  lien_visio: string | null;
  mentor_nom?: string; mentor_prenom?: string; mentore_nom?: string; mentore_prenom?: string;
  note_du_mentor?: number | null; note_du_mentore?: number | null;
}

const STATUT_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  en_attente: { label: 'En attente', bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  confirmee:  { label: 'Confirmée',  bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  en_cours:   { label: 'En cours',   bg: '#F0FDF4', color: '#166534', dot: '#22C55E' },
  terminee:   { label: 'Terminée',   bg: '#F5F7FB', color: '#6B7280', dot: '#9CA3AF' },
  annulee:    { label: 'Annulée',    bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
};

function EvaluationModal({ sessionId, onClose, onSuccess }: { sessionId: string; onClose: () => void; onSuccess: () => void }) {
  const [note, setNote] = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await sessionAPI.complete(sessionId, { note, notes });
      toast.success('Évaluation enregistrée !');
      onSuccess(); onClose();
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Évaluer la session</h2>
        <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>Note</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setNote(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '28px', color: n <= note ? '#F59E0B' : '#E5EAF2' }}>
              ★
            </button>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Commentaire (optionnel)</p>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Votre retour sur cette session..."
          style={{ width: '100%', border: '1px solid #E5EAF2', borderRadius: '10px', padding: '10px', fontSize: '13px', marginBottom: '20px' }}
          rows={3} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '10px', background: '#fff', cursor: 'pointer' }}>Annuler</button>
          <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '10px', background: '#3B82F6', color: '#fff', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Envoi...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('tous');
  const [evalSessionId, setEvalSession] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    load();
  }, [user]);

  const load = async () => {
    try { 
      const r = await sessionAPI.getAll(); 
      setSessions(r.data.sessions || []); 
    } catch { 
      toast.error('Erreur chargement'); 
    } finally { 
      setLoading(false); 
    }
  };

  // CORRECTION : utiliser les bonnes routes backend
  const handleConfirm = async (id: string) => { 
    try { 
      await sessionAPI.confirm(id); 
      toast.success('Session confirmée !'); 
      load(); 
    } catch { 
      toast.error('Erreur'); 
    } 
  };
  
  const handleCancel = async (id: string) => { 
    if (!confirm('Annuler cette session ?')) return; 
    try { 
      await sessionAPI.cancel(id); 
      toast.success('Session annulée'); 
      load(); 
    } catch { 
      toast.error('Erreur'); 
    } 
  };
  
  const handleStart = async (id: string) => { 
    try { 
      await sessionAPI.start(id); 
      toast.success('Session démarrée !'); 
      load(); 
    } catch { 
      toast.error('Erreur'); 
    } 
  };

  const filtered = sessions.filter(s => filter === 'tous' || s.statut === filter);

  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const other = (s: Session) => user?.role === 'mentor'
    ? `${s.mentore_prenom ?? ''} ${s.mentore_nom ?? ''}`.trim()
    : `${s.mentor_prenom ?? ''} ${s.mentor_nom ?? ''}`.trim();

  const filterTabs = [
    { v: 'tous', l: 'Toutes', count: sessions.length },
    { v: 'en_attente', l: 'En attente', count: sessions.filter(s => s.statut === 'en_attente').length },
    { v: 'confirmee', l: 'Confirmées', count: sessions.filter(s => s.statut === 'confirmee').length },
    { v: 'en_cours', l: 'En cours', count: sessions.filter(s => s.statut === 'en_cours').length },
    { v: 'terminee', l: 'Terminées', count: sessions.filter(s => s.statut === 'terminee').length },
    { v: 'annulee', l: 'Annulées', count: sessions.filter(s => s.statut === 'annulee').length },
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      {evalSessionId && <EvaluationModal sessionId={evalSessionId} onClose={() => setEvalSession(null)} onSuccess={load} />}

      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Mes sessions</h1>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {filterTabs.map(t => (
          <button key={t.v} onClick={() => setFilter(t.v)} style={{
            padding: '6px 14px', borderRadius: '20px', border: filter === t.v ? 'none' : '1px solid #ccc',
            background: filter === t.v ? '#3B82F6' : '#fff', color: filter === t.v ? '#fff' : '#333', cursor: 'pointer'
          }}>
            {t.l} ({t.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#f5f5f5', borderRadius: '12px' }}>
          <p>Aucune session trouvée</p>
          {user?.role === 'mentore' && (
            <Link href="/mentors" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 20px', background: '#3B82F6', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
              Trouver un mentor
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(s => {
            const cfg = STATUT_CFG[s.statut];
            const isMentor = user?.role === 'mentor';
            const otherName = other(s);
            const dejaNote = isMentor ? s.note_du_mentore != null : s.note_du_mentor != null;

            return (
              <div key={s.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <strong>{s.sujet}</strong>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <div>Avec {otherName}</div>
                    <div>{fmt(s.date_debut)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {s.statut === 'en_attente' && isMentor && (
                    <button onClick={() => handleConfirm(s.id)} style={{ padding: '6px 12px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      ✓ Confirmer
                    </button>
                  )}
                  {(s.statut === 'en_attente' || s.statut === 'confirmee') && (
                    <button onClick={() => handleCancel(s.id)} style={{ padding: '6px 12px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      ✗ Annuler
                    </button>
                  )}
                  {s.statut === 'confirmee' && isMentor && (
                    <button onClick={() => handleStart(s.id)} style={{ padding: '6px 12px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      ▶ Démarrer
                    </button>
                  )}
                  {s.statut === 'en_cours' && !dejaNote && (
                    <button onClick={() => setEvalSession(s.id)} style={{ padding: '6px 12px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      ★ Évaluer
                    </button>
                  )}
                  <Link href={`/chat/${s.id}`} style={{ padding: '6px 12px', background: '#0A3B8A', color: '#fff', borderRadius: '6px', textDecoration: 'none', display: 'inline-block' }}>
                    💬 Chat
                  </Link>
                  {s.lien_visio && (s.statut === 'confirmee' || s.statut === 'en_cours') && (
                    <a href={s.lien_visio} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: '#7C3AED', color: '#fff', borderRadius: '6px', textDecoration: 'none' }}>
                      🎥 Visio
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}