'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Check, CheckCircle2, XCircle, CalendarDays, ClipboardList } from 'lucide-react';
import { format, addDays } from 'date-fns';
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
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string; label: string } | null>(null);
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
    const slots: { start: string; end: string; label: string }[] = [];
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
      toast.error('Aucun créneau disponible pour cette date');
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

  const dates: Date[] = [];
  for (let i = 0; i < 14; i++) {
    dates.push(addDays(new Date(), i));
  }

  const stepTitles: Record<string, { icon: any; label: string }> = {
    select: { icon: CalendarDays, label: 'Choisir une date' },
    details: { icon: ClipboardList, label: 'Détails de la session' },
    confirm: { icon: CheckCircle2, label: 'Confirmation' },
  };

  const currentStep = stepTitles[step];
  const inputStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className="sticky top-0 p-4 flex justify-between items-center"
          style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-soft)' }}
            >
              <currentStep.icon className="w-5 h-5" style={{ color: 'var(--accent-text-on-soft)' }} />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {currentStep.label}
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avec {mentorName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' && (
            <div>
              {fetching ? (
                <div className="text-center py-8">
                  <div
                    className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2"
                    style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                  />
                  <p style={{ color: 'var(--text-secondary)' }}>Chargement des disponibilités...</p>
                </div>
              ) : disponibilites.length === 0 ? (
                <div className="text-center py-8">
                  <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>Aucune disponibilité pour ce mentor</p>
                  <button
                    onClick={fetchDisponibilites}
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
                  >
                    Réessayer
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Sélectionnez une date pour voir les créneaux disponibles
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {dates.map((date, index) => {
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const hasSlots = generateSlots(date).length > 0;
                      const isDisabled = isWeekend || !hasSlots;
                      const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');

                      return (
                        <button
                          key={index}
                          onClick={() => handleDateSelect(date)}
                          disabled={isDisabled}
                          className="p-3 rounded-xl border-2 text-left transition-all"
                          style={
                            isDisabled
                              ? { borderColor: 'var(--border)', backgroundColor: 'var(--bg-tertiary)', opacity: 0.5, cursor: 'not-allowed' }
                              : isSelected
                              ? { borderColor: 'var(--accent)', backgroundColor: 'var(--accent-soft)' }
                              : { borderColor: 'var(--border)' }
                          }
                        >
                          <div className="text-sm font-semibold" style={{ color: isDisabled ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                            {format(date, 'EEE', { locale: fr })}
                          </div>
                          <div className="font-mono-data text-lg font-bold" style={{ color: isDisabled ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                            {format(date, 'd')}
                          </div>
                          <div className="text-xs" style={{ color: isDisabled ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
                            {format(date, 'MMM', { locale: fr })}
                          </div>
                          {!isDisabled ? (
                            <div className="mt-1 text-xs flex items-center gap-1" style={{ color: 'var(--success)' }}>
                              <CheckCircle2 className="w-3 h-3" />
                              Disponible
                            </div>
                          ) : (
                            <div className="mt-1 text-xs flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                              <XCircle className="w-3 h-3" />
                              Indisponible
                            </div>
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
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <span>{selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  <Clock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <span className="font-mono-data">{selectedSlot.label}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Sujet de la session *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg outline-none transition-all"
                  style={inputStyle}
                  placeholder="Ex: Aide sur le projet Python"
                  value={sujet}
                  onChange={(e) => setSujet(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Description (optionnelle)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg outline-none transition-all resize-none"
                  style={inputStyle}
                  placeholder="Décrivez vos attentes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('select')}
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{ border: '2px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'var(--success-soft)' }}
              >
                <Check className="w-10 h-10" style={{ color: 'var(--success)' }} />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Session réservée !
              </h3>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                Votre demande a été envoyée au mentor. Vous recevrez une confirmation prochainement.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
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