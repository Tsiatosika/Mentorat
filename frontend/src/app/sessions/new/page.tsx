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

  useEffect(() => {
    if (!user || user.role !== 'mentore') {
      router.push('/login');
      return;
    }
    if (mentorId) fetchMentor();
  }, [mentorId, user, router]);

  const fetchMentor = async () => {
    try {
      const mentorRes = await publicAPI.getMentorById(mentorId);
      setMentor(mentorRes.data.mentor);
      const dispoRes = await disponibiliteAPI.getByMentor(mentorId);
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

  const inputStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  };

  if (!mentor) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/mentors/${mentorId}`}
          className="inline-flex items-center gap-2 mb-6 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('session.back')}
        </Link>

        <div className="card overflow-hidden">
          <div className="p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('session.new_title')}
            </h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t('session.new_with')} {mentor.prenom} {mentor.nom}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="w-4 h-4 inline mr-2" style={{ color: 'var(--accent)' }} />
                {t('session.date')}
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border rounded-lg outline-none transition-all"
                style={inputStyle}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <Clock className="w-4 h-4 inline mr-2" style={{ color: 'var(--accent)' }} />
                  {t('session.time')}
                </label>
                {availableTimes.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--danger)' }}>{t('session.no_slots')}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className="p-2 rounded-lg border-2 font-mono-data transition-all"
                        style={
                          selectedTime === time
                            ? { borderColor: 'var(--accent)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text-on-soft)' }
                            : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                        }
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                <FileText className="w-4 h-4 inline mr-2" style={{ color: 'var(--accent)' }} />
                {t('session.subject')}
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg outline-none transition-all"
                style={inputStyle}
                placeholder={t('session.subject_placeholder')}
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t('session.desc')}
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border rounded-lg outline-none transition-all resize-none"
                style={inputStyle}
                placeholder={t('session.desc_placeholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
    </div>
  );
}