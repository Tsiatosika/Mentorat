'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Calendar, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { sessionAPI, rapportAPI, BACKEND_URL } from '@/services/api';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSessions();
  }, [user, router]);

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getAll();
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAndDownload = async (sessionId: string) => {
    setGenerating(sessionId);
    try {
      toast.loading(t('reports.generating'), { id: 'report' });
      const response = await rapportAPI.generateSession(sessionId);
      if (response.data.success) {
        const fileUrl = response.data.rapport.url;
        const fullUrl = `${BACKEND_URL}${fileUrl}`;
        const downloadResponse = await fetch(fullUrl);
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_session_${sessionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(t('reports.downloaded'), { id: 'report' });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('common.error'), { id: 'report' });
    } finally {
      setGenerating(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  const sessionsTerminees = sessions.filter(s => s.statut === 'terminee');

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-8">
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <FileText className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          {t('reports.title')}
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{t('reports.subtitle')}</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        {sessionsTerminees.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t('reports.no_sessions')}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{t('reports.no_sessions_desc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('sessions.completed')} ({sessionsTerminees.length})
            </h2>
            {sessionsTerminees.map((session) => (
              <div key={session.id} className="card bookmark p-5 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{session.sujet}</h3>
                  <div className="flex gap-4 text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span className="font-mono-data">{formatDate(session.date_debut)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {session.mentor_prenom || session.mentore_prenom}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => generateAndDownload(session.id)}
                  disabled={generating === session.id}
                  className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
                >
                  {generating === session.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {t('reports.download')} PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}