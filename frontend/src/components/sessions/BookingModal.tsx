'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { disponibiliteAPI } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string;
  mentorName: string;
  onBook: (data: any) => Promise<void>;
}

const STEPS = ['date', 'details', 'confirm'] as const;
type Step = typeof STEPS[number];

export function BookingModal({ isOpen, onClose, mentorId, mentorName, onBook }: BookingModalProps) {
  const { t, language } = useLanguage();
  const locale = language === 'fr' ? fr : enUS;

  const [step, setStep]                     = useState<Step>('date');
  const [selectedDate, setSelectedDate]     = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot]     = useState<{ start: string; end: string; label: string } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string; label: string }[]>([]);
  const [sujet, setSujet]                   = useState('');
  const [description, setDescription]       = useState('');
  const [loading, setLoading]               = useState(false);
  const [fetching, setFetching]             = useState(false);
  const [disponibilites, setDisponibilites] = useState<any[]>([]);
  const [weekOffset, setWeekOffset]         = useState(0);
  const [mounted, setMounted]               = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const stepLabels: Record<Step, string> = {
    date:    language === 'fr' ? 'Choisir une date'  : 'Choose a date',
    details: language === 'fr' ? 'Détails'           : 'Details',
    confirm: language === 'fr' ? 'Confirmation'      : 'Confirmed',
  };
  const stepNums: Record<Step, number> = { date: 1, details: 2, confirm: 3 };

  // S'assurer qu'on est côté client avant de créer le portal
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen && mentorId) fetchDisponibilites();
  }, [isOpen, mentorId]);

  // Bloquer/débloquer le scroll du body
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Fermer avec Échap
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const fetchDisponibilites = async () => {
    setFetching(true);
    try {
      const res = await disponibiliteAPI.getByMentor(mentorId);
      setDisponibilites(res.data.disponibilites || []);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setFetching(false);
    }
  };

  const generateSlots = (date: Date) => {
    const dayName = format(date, 'EEEE', { locale: fr }).toLowerCase();
    return disponibilites
      .filter((d: any) => d.jour_semaine === dayName)
      .map((d: any) => {
        const [sh, sm] = d.heure_debut.split(':');
        const [eh, em] = d.heure_fin.split(':');
        const start = new Date(date); start.setHours(+sh, +sm, 0);
        const end   = new Date(date); end.setHours(+eh, +em, 0);
        return {
          start: start.toISOString(),
          end: end.toISOString(),
          label: `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`,
        };
      });
  };

  const hasSlots = (date: Date) => generateSlots(date).length > 0;

  const handleDateSelect = (date: Date) => {
    const slots = generateSlots(date);
    if (!slots.length) return toast.error(t('session.no_slots'));
    setSelectedDate(date);
    setAvailableSlots(slots);
    setSelectedSlot(slots[0]);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !sujet.trim()) return toast.error(t('session.fields_required'));
    setLoading(true);
    try {
      await onBook({ mentor_id: mentorId, date_debut: selectedSlot.start, date_fin: selectedSlot.end, sujet, description });
      setStep('confirm');
    } catch {
      // géré par le parent
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('date');
    setSelectedDate(null);
    setSelectedSlot(null);
    setSujet('');
    setDescription('');
    setAvailableSlots([]);
    setWeekOffset(0);
  };

  const handleClose = () => { reset(); onClose(); };

  // Clic sur l'overlay (fond sombre) = fermer, mais pas si on clique sur le modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose();
  };

  // Ne rien rendre côté serveur ou si modal fermé
  if (!mounted || !isOpen) return null;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), weekOffset * 7 + i));
  const currentNum = stepNums[step];

  const modalContent = (
    <>
      {/*
        ─────────────────────────────────────────────────────────
        STRUCTURE : un seul div fixed qui remplit tout le viewport.
        Il est à la fois le backdrop (fond sombre) et le
        centrage flexbox. onClick sur LUI SEUL ferme (pas ses enfants).
        createPortal l'attache directement à document.body, donc
        aucun parent overflow/position ne peut le déplacer.
        ─────────────────────────────────────────────────────────
      */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,                          /* top:0 right:0 bottom:0 left:0 */
          zIndex: 99999,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Le modal (stopPropagation empêche le clic de remonter au backdrop) ── */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}      /* empêche le scroll de la page derrière */
          onTouchMove={(e) => e.stopPropagation()}  /* idem sur mobile */
          style={{
            width: '100%',
            maxWidth: '580px',
            maxHeight: '88vh',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'bmIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >

          {/* ── HEADER ── */}
          <div style={{ padding: '22px 26px 0', flexShrink: 0 }}>

            {/* Titre + bouton ✕ */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                  {language === 'fr' ? 'Réservation avec' : 'Booking with'}
                </p>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                  {mentorName}
                </h2>
              </div>

              <button
                onClick={handleClose}
                aria-label="Fermer"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  width: '38px', height: '38px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  flexShrink: 0,
                  transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  const b = e.currentTarget;
                  b.style.backgroundColor = 'var(--danger-soft)';
                  b.style.color = 'var(--danger)';
                  b.style.borderColor = 'var(--danger)';
                }}
                onMouseLeave={(e) => {
                  const b = e.currentTarget;
                  b.style.backgroundColor = 'var(--bg-secondary)';
                  b.style.color = 'var(--text-secondary)';
                  b.style.borderColor = 'var(--border)';
                }}
              >
                <X style={{ width: '17px', height: '17px' }} />
              </button>
            </div>

            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              {STEPS.map((s, i) => {
                const done    = stepNums[s] < currentNum;
                const current = s === step;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700, transition: 'all 0.25s',
                        backgroundColor: done ? 'var(--accent)' : current ? 'var(--accent-soft)' : 'var(--bg-tertiary)',
                        color: done ? '#06231D' : current ? 'var(--accent)' : 'var(--text-tertiary)',
                        border: `2px solid ${current || done ? 'var(--accent)' : 'transparent'}`,
                        boxShadow: current ? '0 0 0 4px var(--accent-soft)' : 'none',
                      }}>
                        {done ? <Check style={{ width: '13px', height: '13px' }} /> : stepNums[s]}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: current ? 600 : 400, color: current ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                        {stepLabels[s]}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: '2px', margin: '0 10px', borderRadius: '1px', backgroundColor: done ? 'var(--accent)' : 'var(--bg-tertiary)', transition: 'background-color 0.3s' }} />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0 -26px' }} />
          </div>

          {/* ── CONTENU SCROLLABLE ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 24px' }}>

            {/* STEP 1 : DATE */}
            {step === 'date' && (
              fetching ? (
                <div style={{ textAlign: 'center', padding: '52px 0' }}>
                  <div style={{ width: '36px', height: '36px', border: '3px solid var(--accent-soft)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'bmSpin 0.8s linear infinite', margin: '0 auto 14px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {language === 'fr' ? 'Chargement des disponibilités...' : 'Loading availability...'}
                  </p>
                </div>
              ) : disponibilites.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '52px 0' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>📅</div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>
                    {t('disponibilites.no_disponibilites')}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                    {t('disponibilites.no_disponibilites_desc')}
                  </p>
                  <button onClick={fetchDisponibilites} style={{ padding: '9px 22px', borderRadius: '10px', background: 'var(--accent)', color: '#06231D', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    {language === 'fr' ? 'Réessayer' : 'Retry'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Navigation semaine */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0}
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: weekOffset === 0 ? 'not-allowed' : 'pointer', opacity: weekOffset === 0 ? 0.4 : 1, color: 'var(--text-secondary)' }}>
                      <ChevronLeft style={{ width: '16px', height: '16px' }} />
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {format(weekDays[0], 'd MMM', { locale })} – {format(weekDays[6], 'd MMM yyyy', { locale })}
                    </span>
                    <button onClick={() => setWeekOffset(w => w + 1)}
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <ChevronRight style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>

                  {/* Grille des jours */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '18px' }}>
                    {weekDays.map((date, i) => {
                      const available  = hasSlots(date);
                      const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                      const isPast     = date < new Date(new Date().setHours(0, 0, 0, 0));
                      const disabled   = !available || isPast;
                      return (
                        <button key={i} onClick={() => !disabled && handleDateSelect(date)} disabled={disabled}
                          style={{
                            borderRadius: '14px', padding: '12px 4px',
                            border: `1.5px solid ${isSelected ? 'var(--accent)' : available && !isPast ? 'var(--border)' : 'transparent'}`,
                            backgroundColor: isSelected ? 'var(--accent-soft)' : available && !isPast ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: isPast ? 0.3 : 1,
                            transition: 'all 0.15s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                          }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                            {format(date, 'EEE', { locale }).slice(0, 3)}
                          </span>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: isSelected ? 'var(--accent)' : disabled ? 'var(--text-tertiary)' : 'var(--text-primary)', lineHeight: 1 }}>
                            {format(date, 'd')}
                          </span>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: available && !isPast ? 'var(--success)' : 'transparent' }} />
                        </button>
                      );
                    })}
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block', flexShrink: 0 }} />
                    {language === 'fr' ? 'Les jours avec un point vert ont des créneaux disponibles' : 'Days with a green dot have available slots'}
                  </p>
                </>
              )
            )}

            {/* STEP 2 : DETAILS */}
            {step === 'details' && selectedDate && selectedSlot && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Récap date/heure */}
                <div style={{ backgroundColor: 'var(--accent-soft)', borderRadius: '14px', padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar style={{ width: '14px', height: '14px', color: 'var(--accent)' }} />
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--accent-text-on-soft)', fontWeight: 600 }}>
                      {format(selectedDate, 'EEEE d MMMM', { locale })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock style={{ width: '14px', height: '14px', color: 'var(--accent)' }} />
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--accent-text-on-soft)', fontWeight: 600 }}>
                      {selectedSlot.label}
                    </span>
                  </div>
                </div>

                {/* Choix créneau si plusieurs */}
                {availableSlots.length > 1 && (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {t('session.time')}
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {availableSlots.map((slot, i) => (
                        <button key={i} onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            border: `1.5px solid ${selectedSlot.start === slot.start ? 'var(--accent)' : 'var(--border)'}`,
                            backgroundColor: selectedSlot.start === slot.start ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                            color: selectedSlot.start === slot.start ? 'var(--accent-text-on-soft)' : 'var(--text-primary)',
                            transition: 'all 0.15s',
                          }}>
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sujet */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {language === 'fr' ? 'Sujet de la session' : 'Session subject'} <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input type="text" placeholder={t('session.subject_placeholder')} value={sujet} onChange={e => setSujet(e.target.value)} maxLength={120}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
                    <span style={{ fontSize: '11px', color: sujet.length > 100 ? 'var(--warm)' : 'var(--text-tertiary)' }}>{sujet.length}/120</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t('session.desc')}
                  </label>
                  <textarea rows={3} placeholder={t('session.desc_placeholder')} value={description} onChange={e => setDescription(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: '1.6', transition: 'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>
            )}

            {/* STEP 3 : CONFIRM */}
            {step === 'confirm' && (
              <div style={{ textAlign: 'center', padding: '36px 0' }}>
                <div style={{ width: '76px', height: '76px', borderRadius: '50%', backgroundColor: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 0 12px var(--success-soft)', animation: 'bmConfirm 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  <Sparkles style={{ width: '34px', height: '34px', color: 'var(--success)' }} />
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.01em' }}>
                  {language === 'fr' ? 'Demande envoyée !' : 'Request sent!'}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '340px', margin: '0 auto 10px' }}>
                  {language === 'fr'
                    ? <><strong style={{ color: 'var(--text-primary)' }}>{mentorName}</strong> a reçu votre demande.</>
                    : <><strong style={{ color: 'var(--text-primary)' }}>{mentorName}</strong> received your request.</>}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  {language === 'fr' ? 'Vous recevrez une notification dès confirmation.' : 'You will be notified once confirmed.'}
                </p>
              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          {step !== 'confirm' ? (
            <div style={{ padding: '16px 26px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: '10px', backgroundColor: 'var(--card-bg)' }}>
              {step === 'details' && (
                <button onClick={() => setStep('date')}
                  style={{ padding: '12px 18px', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <ChevronLeft style={{ width: '15px', height: '15px' }} /> {t('common.back')}
                </button>
              )}
              <button
                onClick={step === 'details' ? handleSubmit : undefined}
                disabled={loading || step === 'date'}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                  backgroundColor: step === 'date' || loading ? 'var(--bg-tertiary)' : 'var(--accent)',
                  color: step === 'date' || loading ? 'var(--text-tertiary)' : '#06231D',
                  cursor: step === 'date' || loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'filter 0.15s',
                }}
                onMouseEnter={e => { if (step === 'details' && !loading) e.currentTarget.style.filter = 'brightness(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
              >
                {loading
                  ? <><div style={{ width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'bmSpin 0.7s linear infinite' }} /> {language === 'fr' ? 'Réservation...' : 'Booking...'}</>
                  : step === 'date'
                    ? language === 'fr' ? '← Sélectionner une date' : '← Select a date'
                    : <><Check style={{ width: '16px', height: '16px' }} /> {t('session.book')}</>
                }
              </button>
            </div>
          ) : (
            <div style={{ padding: '16px 26px', borderTop: '1px solid var(--border)', flexShrink: 0, backgroundColor: 'var(--card-bg)' }}>
              <button onClick={handleClose}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--accent)', color: '#06231D', cursor: 'pointer', fontSize: '14px', fontWeight: 700, transition: 'filter 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
              >
                {language === 'fr' ? 'Parfait, fermer ✓' : 'Done ✓'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bmSpin    { to { transform: rotate(360deg); } }
        @keyframes bmIn      { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes bmConfirm { from { transform:scale(0.6); opacity:0; } to { transform:scale(1); opacity:1; } }
      `}</style>
    </>
  );

  return createPortal(modalContent, document.body);
}