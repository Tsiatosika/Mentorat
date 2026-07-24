'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { publicAPI, disponibiliteAPI, sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const mentorId = searchParams.get('mentor');

  const [mentor, setMentor] = useState<any>(null);
  const [disponibilites, setDisponibilites] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [sujet, setSujet] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'mentore') {
      router.push('/login');
      return;
    }
    if (mentorId) fetchMentor();
  }, [mentorId, user, router]);

  const fetchMentor = async () => {
    try {
      const mentorRes = await publicAPI.getMentorById(mentorId!);
      setMentor(mentorRes.data.mentor);
      const dispoRes = await disponibiliteAPI.getByMentor(mentorId!);
      setDisponibilites(dispoRes.data.disponibilites || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('session.loading_error'));
    }
  };

  const generateTimeSlots = (date: string) => {
    if (!date) return [];
    const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
    const dayOfWeek = new Date(date).toLocaleDateString(locale, { weekday: 'long' }).toLowerCase();
    const times: string[] = [];

    disponibilites.forEach((dispo: any) => {
      if (dispo.jour_semaine === dayOfWeek) {
        const [startH, startM] = dispo.heure_debut.split(':');
        const [endH, endM] = dispo.heure_fin.split(':');
        let current = new Date();
        current.setHours(parseInt(startH), parseInt(startM), 0);
        const end = new Date();
        end.setHours(parseInt(endH), parseInt(endM), 0);
        while (current < end) {
          const hours = String(current.getHours()).padStart(2, '0');
          const minutes = String(current.getMinutes()).padStart(2, '0');
          times.push(`${hours}:${minutes}`);
          current.setMinutes(current.getMinutes() + 60);
        }
      }
    });

    return times;
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    const times = generateTimeSlots(date);
    setAvailableTimes(times);
    if (times.length > 0) setSelectedTime(times[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime || !sujet) {
      toast.error(t('session.fields_required'));
      return;
    }

    const [hours, minutes] = selectedTime.split(':');
    const date = new Date(selectedDate);
    date.setHours(parseInt(hours), parseInt(minutes), 0);
    const endDate = new Date(date);
    endDate.setHours(endDate.getHours() + 1);

    setLoading(true);
    try {
      await sessionAPI.create({
        mentor_id: mentorId,
        date_debut: date.toISOString(),
        date_fin: endDate.toISOString(),
        sujet,
        description,
      });
      toast.success(t('session.booked'));
      router.push('/sessions');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (field: string) => ({
    backgroundColor: 'var(--bg-secondary)',
    borderColor: focusedField === field ? 'var(--accent)' : 'var(--border)',
    color: 'var(--text-primary)',
    boxShadow: focusedField === field ? '0 0 0 4px var(--accent-soft)' : 'none',
  });

  if (!mentor) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="skeleton-block h-5 w-24 rounded-md mb-6" />
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="skeleton-block h-7 w-48 rounded-md mb-2" />
              <div className="skeleton-block h-4 w-64 rounded-md" />
            </div>
            <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="skeleton-block h-11 w-full rounded-lg" />
              <div className="skeleton-block h-11 w-full rounded-lg" />
              <div className="skeleton-block h-11 w-full rounded-lg" />
            </div>
          </div>
        </div>
        <style jsx global>{`
          .skeleton-block {
            background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border) 37%, var(--bg-tertiary) 63%);
            background-size: 400% 100%;
            animation: skeletonShimmer 1.6s ease-in-out infinite;
          }
          @keyframes skeletonShimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="new-session-page min-h-screen p-6 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="ns-orb ns-orb-1" style={{ backgroundColor: 'var(--accent-soft)' }} />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <Link
          href={`/mentors/${mentorId}`}
          className="ns-back-btn inline-flex items-center gap-2 mb-6 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('session.back')}
        </Link>

        <div className="card overflow-hidden ns-card-in">
          <div className="p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <h1 className="font-display text-2xl font-semibold ns-title-in" style={{ color: 'var(--text-primary)' }}>
              {t('session.new_title')}
            </h1>
            <p className="mt-1 ns-title-in" style={{ color: 'var(--text-secondary)', animationDelay: '0.06s' }}>
              {t('session.new_with')} {mentor.prenom} {mentor.nom}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="ns-field-in" style={{ animationDelay: '0.05s' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="w-4 h-4 inline mr-2" style={{ color: 'var(--accent)' }} />
                {t('session.date')}
              </label>
              <input
                type="date"
                className="ns-input w-full px-4 py-2 border rounded-lg outline-none"
                style={getInputStyle('date')}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                onFocus={() => setFocusedField('date')}
                onBlur={() => setFocusedField(null)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {selectedDate && (
              <div className="ns-slot-panel">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <Clock className="w-4 h-4 inline mr-2" style={{ color: 'var(--accent)' }} />
                  {t('session.time')}
                </label>
                {availableTimes.length === 0 ? (
                  <p className="text-sm ns-no-slots" style={{ color: 'var(--danger)' }}>{t('session.no_slots')}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map((time, ti) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className="ns-time-btn ns-time-in p-2 rounded-lg border-2 font-mono-data"
                        style={{
                          ...(selectedTime === time
                            ? { borderColor: 'var(--accent)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }
                            : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }),
                          animationDelay: `${ti * 0.03}s`,
                        }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="ns-field-in" style={{ animationDelay: '0.1s' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                <FileText className="w-4 h-4 inline mr-2" style={{ color: 'var(--accent)' }} />
                {t('session.subject')}
              </label>
              <input
                type="text"
                className="ns-input w-full px-4 py-2 border rounded-lg outline-none"
                style={getInputStyle('sujet')}
                placeholder={t('session.subject_placeholder')}
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                onFocus={() => setFocusedField('sujet')}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>

            <div className="ns-field-in" style={{ animationDelay: '0.15s' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t('session.desc')}
              </label>
              <textarea
                rows={3}
                className="ns-input w-full px-4 py-2 border rounded-lg outline-none resize-none"
                style={getInputStyle('description')}
                placeholder={t('session.desc_placeholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ns-submit-btn w-full px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('session.book')
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .ns-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          opacity: 0.3;
          will-change: transform;
        }
        .ns-orb-1 { width: 20rem; height: 20rem; top: -6rem; right: -6rem; animation: nsFloat1 26s ease-in-out infinite; }
        @keyframes nsFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 25px) scale(1.06); }
        }

        .ns-back-btn { transition: transform 0.15s ease, color 0.15s ease; }
        .ns-back-btn:hover { transform: translateX(-3px); color: var(--accent); }

        .ns-card-in {
          opacity: 0;
          transform: translateY(16px) scale(0.99);
          animation: nsCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes nsCardIn { to { opacity: 1; transform: translateY(0) scale(1); } }

        .ns-title-in {
          opacity: 0;
          transform: translateY(8px);
          animation: nsTitleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
        }
        @keyframes nsTitleIn { to { opacity: 1; transform: translateY(0); } }

        .ns-field-in {
          opacity: 0;
          transform: translateY(10px);
          animation: nsFieldIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes nsFieldIn { to { opacity: 1; transform: translateY(0); } }

        .ns-input { transition: border-color 0.2s ease, box-shadow 0.2s ease; }

        .ns-slot-panel {
          opacity: 0;
          transform: translateY(-6px);
          animation: nsSlotPanelIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes nsSlotPanelIn { to { opacity: 1; transform: translateY(0); } }

        .ns-time-btn { transition: transform 0.15s ease, border-color 0.2s ease, background-color 0.2s ease; }
        .ns-time-btn:hover { transform: translateY(-2px); border-color: var(--accent); }
        .ns-time-btn:active { transform: scale(0.95); }
        .ns-time-in {
          opacity: 0;
          transform: scale(0.9);
          animation: nsTimeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes nsTimeIn { to { opacity: 1; transform: scale(1); } }

        .ns-no-slots {
          animation: nsShake 0.5s ease;
        }
        @keyframes nsShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .ns-submit-btn { transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease; }
        .ns-submit-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
        .ns-submit-btn:active:not(:disabled) { transform: scale(0.97); }

        @media (prefers-reduced-motion: reduce) {
          .ns-orb, .ns-card-in, .ns-title-in, .ns-field-in, .ns-slot-panel,
          .ns-time-btn, .ns-time-in, .ns-no-slots, .ns-submit-btn {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}