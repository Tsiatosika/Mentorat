'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface Session {
  id: string; sujet: string; description: string; date_debut: string; date_fin: string;
  statut: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';
  lien_visio: string | null;
  mentor_nom?: string; mentor_prenom?: string; mentore_nom?: string; mentore_prenom?: string;
  note_du_mentor?: number | null; note_du_mentore?: number | null;
}

export default function SessionsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('tous');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    load();
  }, [user]);

  const load = async () => {
    try { const r = await sessionAPI.getAll(); setSessions(r.data.sessions || []); }
    catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  const handleConfirm = async (id: string) => { try { await sessionAPI.confirm(id); toast.success(t('sessions.confirmed')); load(); } catch { toast.error(t('common.error')); } };
  const handleCancel = async (id: string) => { if (!confirm(t('sessions.cancel_confirm'))) return; try { await sessionAPI.cancel(id); toast.success(t('sessions.cancelled')); load(); } catch { toast.error(t('common.error')); } };
  const handleStart = async (id: string) => { try { await sessionAPI.start(id); toast.success(t('sessions.started')); load(); } catch { toast.error(t('common.error')); } };

  const counts = {
    tous: sessions.length,
    en_attente: sessions.filter(s => s.statut === 'en_attente').length,
    confirmee: sessions.filter(s => s.statut === 'confirmee').length,
    en_cours: sessions.filter(s => s.statut === 'en_cours').length,
    terminee: sessions.filter(s => s.statut === 'terminee').length,
    annulee: sessions.filter(s => s.statut === 'annulee').length,
  };

  const filters = [
    { key: 'tous', label: t('sessions.all'), count: counts.tous },
    { key: 'en_attente', label: t('sessions.pending'), count: counts.en_attente },
    { key: 'confirmee', label: t('sessions.confirmed'), count: counts.confirmee },
    { key: 'en_cours', label: t('sessions.in_progress'), count: counts.en_cours },
    { key: 'terminee', label: t('sessions.completed'), count: counts.terminee },
    { key: 'annulee', label: t('sessions.cancelled'), count: counts.annulee },
  ];

  const filtered = sessions.filter(s => filter === 'tous' || s.statut === filter);
  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const other = (s: Session) => user?.role === 'mentor' 
    ? `${s.mentore_prenom || ''} ${s.mentore_nom || ''}`.trim() 
    : `${s.mentor_prenom || ''} ${s.mentor_nom || ''}`.trim();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('sessions.title')}</h1>
      
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.key 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500">{t('sessions.no_sessions')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const isMentor = user?.role === 'mentor';
            const otherName = other(s);
            
            let statusColor = '';
            let statusBg = '';
            let statusText = '';
            
            switch(s.statut) {
              case 'en_attente': statusBg = '#FFFBEB'; statusColor = '#92400E'; statusText = t('sessions.pending'); break;
              case 'confirmee': statusBg = '#EFF6FF'; statusColor = '#1D4ED8'; statusText = t('sessions.confirmed'); break;
              case 'en_cours': statusBg = '#F0FDF4'; statusColor = '#166534'; statusText = t('sessions.in_progress'); break;
              case 'terminee': statusBg = '#F5F7FB'; statusColor = '#6B7280'; statusText = t('sessions.completed'); break;
              case 'annulee': statusBg = '#FEF2F2'; statusColor = '#991B1B'; statusText = t('sessions.cancelled'); break;
              default: statusBg = '#F3F4F6'; statusColor = '#374151'; statusText = s.statut;
            }
            
            return (
              <div key={s.id} className="bg-white rounded-xl shadow-md p-4 flex flex-wrap justify-between items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <strong className="text-gray-900">{s.sujet}</strong>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: statusBg, color: statusColor }}>
                      {statusText}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <div>{t('sessions.with')} {otherName}</div>
                    <div>{fmt(s.date_debut)}</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {s.statut === 'en_attente' && isMentor && (
                    <button onClick={() => handleConfirm(s.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm">{t('sessions.confirm')}</button>
                  )}
                  {(s.statut === 'en_attente' || s.statut === 'confirmee') && (
                    <button onClick={() => handleCancel(s.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm">{t('sessions.cancel')}</button>
                  )}
                  {s.statut === 'confirmee' && isMentor && (
                    <button onClick={() => handleStart(s.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">{t('sessions.start')}</button>
                  )}
                  <Link href={`/chat/${s.id}`} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm">{t('sessions.chat')}</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
