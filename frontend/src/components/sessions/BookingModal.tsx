'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Check } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { disponibiliteAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string;
  mentorName: string;
  onBook: (data: any) => Promise<void>;
}

export function BookingModal({ isOpen, onClose, mentorId, mentorName, onBook }: BookingModalProps) {
  const [step, setStep] = useState<'select' | 'details' | 'confirm'>('select');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [sujet, setSujet] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [disponibilites, setDisponibilites] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && mentorId) {
      fetchDisponibilites();
    }
  }, [isOpen, mentorId]);

  const fetchDisponibilites = async () => {
    setFetching(true);
    try {
      const response = await disponibiliteAPI.getByMentor(mentorId);
      console.log('Disponibilités reçues:', response.data);
      setDisponibilites(response.data.disponibilites || []);
      
      if (response.data.disponibilites?.length === 0) {
        toast.error('Ce mentor n\'a pas encore de disponibilités');
      }
    } catch (error) {
      console.error('Erreur chargement disponibilités:', error);
      toast.error('Erreur lors du chargement des disponibilités');
    } finally {
      setFetching(false);
    }
  };

  const generateSlots = (date: Date) => {
    const slots = [];
    const dayOfWeek = format(date, 'EEEE', { locale: fr }).toLowerCase();
    
    disponibilites.forEach((dispo: any) => {
      if (dispo.jour_semaine === dayOfWeek) {
        const [startHour, startMin] = dispo.heure_debut.split(':');
        const [endHour, endMin] = dispo.heure_fin.split(':');
        
        const start = new Date(date);
        start.setHours(parseInt(startHour), parseInt(startMin), 0);
        
        const end = new Date(date);
        end.setHours(parseInt(endHour), parseInt(endMin), 0);
        
        slots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          label: `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
        });
      }
    });
    
    return slots;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const slots = generateSlots(date);
    setAvailableSlots(slots);
    if (slots.length > 0) {
      setSelectedSlot(slots[0]);
      setStep('details');
    } else {
      toast.info('Aucun créneau disponible pour cette date');
    }
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !sujet.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await onBook({
        mentor_id: mentorId,
        date_debut: selectedSlot.start,
        date_fin: selectedSlot.end,
        sujet: sujet,
        description: description
      });
      setStep('confirm');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('select');
    setSelectedDate(null);
    setSelectedSlot(null);
    setSujet('');
    setDescription('');
    setAvailableSlots([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const dates = [];
  for (let i = 0; i < 14; i++) {
    dates.push(addDays(new Date(), i));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {step === 'select' && '📅 Choisir une date'}
              {step === 'details' && '📝 Détails de la session'}
              {step === 'confirm' && '✅ Confirmation'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avec {mentorName}</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' && (
            <div>
              {fetching ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Chargement des disponibilités...</p>
                </div>
              ) : disponibilites.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">Aucune disponibilité pour ce mentor</p>
                  <button
                    onClick={fetchDisponibilites}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Réessayer
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Sélectionnez une date pour voir les créneaux disponibles
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {dates.map((date, index) => {
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const hasSlots = generateSlots(date).length > 0;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleDateSelect(date)}
                          disabled={isWeekend || !hasSlots}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            isWeekend || !hasSlots
                              ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 opacity-50 cursor-not-allowed'
                              : selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
                          }`}
                        >
                          <div className="text-sm font-semibold" style={{ color: isWeekend || !hasSlots ? '#9ca3af' : '#1f2937' }}>
                            {format(date, 'EEE', { locale: fr })}
                          </div>
                          <div className="text-lg font-bold" style={{ color: isWeekend || !hasSlots ? '#9ca3af' : '#111827' }}>
                            {format(date, 'd')}
                          </div>
                          <div className="text-xs" style={{ color: isWeekend || !hasSlots ? '#9ca3af' : '#6b7280' }}>
                            {format(date, 'MMM', { locale: fr })}
                          </div>
                          {hasSlots && !isWeekend && (
                            <div className="mt-1 text-xs text-green-600 dark:text-green-400">✅ Disponible</div>
                          )}
                          {(!hasSlots || isWeekend) && (
                            <div className="mt-1 text-xs text-red-400 dark:text-red-500">❌ Indisponible</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'details' && selectedSlot && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedSlot.label}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sujet de la session *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Aide sur le projet Python"
                  value={sujet}
                  onChange={(e) => setSujet(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optionnelle)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Décrivez vos attentes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('select')}
                  className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Réserver
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Session réservée !</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Votre demande a été envoyée au mentor. Vous recevrez une confirmation prochainement.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Terminer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
