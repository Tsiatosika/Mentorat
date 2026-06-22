'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { BookingModal } from '@/components/sessions/BookingModal';
import { sessionAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface QuickBookingProps {
  mentorId: string;
  mentorName: string;
}

export function QuickBooking({ mentorId, mentorName }: QuickBookingProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBook = async (data: any) => {
    try {
      await sessionAPI.create(data);
      toast.success('Session réservée avec succès !');
    } catch (error: any) {
      console.error('Erreur réservation:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la réservation');
      throw error;
    }
  };

  if (!mentorId) {
    return (
      <div
        className="w-full text-center px-4 py-3 rounded-xl"
        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
      >
        Mentor non disponible
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all shadow-md"
        style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
      >
        <Calendar className="w-5 h-5" />
        Réserver une session
      </button>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mentorId={mentorId}
        mentorName={mentorName}
        onBook={handleBook}
      />
    </>
  );
}