'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { publicAPI, disponibiliteAPI, sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
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
    if (mentorId) {
      fetchMentor();
    }
  }, [mentorId, user, router]);

  const fetchMentor = async () => {
    try {
      const [mentorRes, dispoRes] = await Promise.all([
        publicAPI.getMentorById(mentorId!),
        disponibiliteAPI.getByMentor(mentorId!)
      ]);
      setMentor(mentorRes.data.mentor);
      setDisponibilites(dispoRes.data.disponibilites || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    }
  };

  const generateTimeSlots = (date: string) => {
    if (!date) return [];
    const dayOfWeek = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
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
    if (times.length > 0) {
      setSelectedTime(times[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !sujet) {
      toast.error('Veuillez remplir tous les champs');
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
        sujet: sujet,
        description: description
      });
      
      toast.success('Session réservée avec succès !');
      router.push('/sessions');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  if (!mentor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href={`/mentors/${mentorId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour au profil
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <h1 className="text-2xl font-bold">Nouvelle session</h1>
            <p className="text-indigo-100 mt-1">avec {mentor.prenom} {mentor.nom}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Heure
                </label>
                {availableTimes.length === 0 ? (
                  <p className="text-red-500 text-sm">Aucun créneau disponible pour cette date</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          selectedTime === time
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Sujet *
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ex: Aide sur le projet Python"
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optionnelle)
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Décrivez vos attentes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Réserver'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
