'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { sessionAPI, rapportAPI } from '@/services/api';
import Topbar from '@/components/layout/Topbar';
import toast from 'react-hot-toast';

interface Session {
  id: string; sujet: string; date_debut: string; statut: string;
  mentor_nom?: string; mentor_prenom?: string; mentore_nom?: string; mentore_prenom?: string;
}

export default function ReportsPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const [sessions,    setSessions]    = useState<Session[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    load();
  }, [user]);

  const load = async () => {
    try { const r = await sessionAPI.getAll({ statut: 'terminee' }); setSessions(r.data.sessions || []); }
    catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const handleGenerate = async (id: string) => {
    setGenerating(id);
    try { await rapportAPI.generateSession(id); toast.success('Rapport généré !'); await handleDownload(id); }
    catch { toast.error('Erreur génération'); }
    finally { setGenerating(null); }
  };

  const handleDownload = async (id: string) => {
    setDownloading(id);
    try {
      const r    = await rapportAPI.downloadSession(id);
      const blob = new Blob([r.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `rapport_${id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Rapport non disponible. Cliquez sur Générer.'); }
    finally { setDownloading(null); }
  };

  const handleProgression = async () => {
    setGenerating('progression');
    try {
      const r = await rapportAPI.generateProgression();
      if (r.data.rapport?.url) {
        toast.success('Rapport de progression généré !');
        window.open(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${r.data.rapport.url}`, '_blank');
      }
    } catch { toast.error('Erreur'); }
    finally { setGenerating(null); }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const other = (s: Session) => user?.role === 'mentor'
    ? `${s.mentore_prenom ?? ''} ${s.mentore_nom ?? ''}`.trim()
    : `${s.mentor_prenom  ?? ''} ${s.mentor_nom  ?? ''}`.trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar title="Mes rapports" icon="ti-file-text"
        action={user?.role === 'mentore' ? (
          <button onClick={handleProgression} disabled={generating === 'progression'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#F5F7FB', border: '0.5px solid #E5EAF2', borderRadius: '8px', color: '#1E3A5F', fontSize: '13px', cursor: 'pointer' }}>
            <i className={`ti ti-refresh${generating === 'progression' ? ' animate-spin' : ''}`} style={{ fontSize: '15px' }} aria-hidden="true" />
            Rapport de progression
          </button>
        ) : undefined}
      />

      <main style={{ flex: 1, padding: '24px' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #E5EAF2', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: '#F5F7FB', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="ti ti-file-off" style={{ fontSize: '32px', color: '#E5EAF2' }} aria-hidden="true" />
            </div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1E3A5F' }}>Aucun rapport disponible</p>
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '6px' }}>Les rapports apparaîtront ici une fois que vous aurez terminé des sessions.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Stats summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '8px' }}>
              {[
                { label: 'Sessions terminées', val: sessions.length, icon: 'ti-circle-check', bg: '#F0FDF4', color: '#22C55E' },
                { label: 'Rapports disponibles', val: sessions.length, icon: 'ti-file-text', bg: '#EFF6FF', color: '#3B82F6' },
                { label: 'Ce mois-ci', val: sessions.filter(s => new Date(s.date_debut).getMonth() === new Date().getMonth()).length, icon: 'ti-calendar', bg: '#FFFBEB', color: '#F59E0B' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #E5EAF2', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: '20px', color: s.color }} aria-hidden="true" />
                  </div>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 600, color: '#1E3A5F', lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reports list */}
            {sessions.map(s => {
              const o = other(s);
              const initO = o.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase();

              return (
                <div key={s.id} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #E5EAF2', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="ti ti-file-text" style={{ fontSize: '22px', color: '#22C55E' }} aria-hidden="true" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E3A5F', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sujet}</div>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="ti ti-calendar" style={{ fontSize: '13px' }} aria-hidden="true" /> {fmt(s.date_debut)}
                      </span>
                      {o && (
                        <span style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="ti ti-user" style={{ fontSize: '13px' }} aria-hidden="true" /> Avec {o}
                        </span>
                      )}
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: '#F0FDF4', color: '#166534' }}>Terminée</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => handleGenerate(s.id)} disabled={generating === s.id || downloading === s.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', opacity: generating === s.id || downloading === s.id ? 0.6 : 1 }}>
                      {generating === s.id
                        ? <div style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        : <i className="ti ti-download" style={{ fontSize: '15px' }} aria-hidden="true" />}
                      {generating === s.id ? 'Génération...' : 'Générer'}
                    </button>
                    <button onClick={() => handleDownload(s.id)} disabled={downloading === s.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#F5F7FB', color: '#1E3A5F', border: '0.5px solid #E5EAF2', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', opacity: downloading === s.id ? 0.6 : 1 }}>
                      {downloading === s.id
                        ? <div style={{ width: '14px', height: '14px', border: '2px solid #1E3A5F', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        : <i className="ti ti-download" style={{ fontSize: '15px' }} aria-hidden="true" />}
                      Retélécharger
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}