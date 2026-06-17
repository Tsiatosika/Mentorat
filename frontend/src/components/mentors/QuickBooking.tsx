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

  console.log('🔍 QuickBooking - mentorId reçu:', mentorId);
  console.log('🔍 QuickBooking - mentorName reçu:', mentorName);

  const handleBook = async (data: any) => {
    try {
      console.log('📝 Réservation avec mentorId:', mentorId);
      await sessionAPI.create(data);
      toast.success('Session réservée avec succès !');
    } catch (error: any) {
      console.error('Erreur réservation:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la réservation');
      throw error;
    }
  };

  if (!mentorId) {
    console.warn('⚠️ QuickBooking: mentorId est undefined ou null');
    return (
      <div className="w-full text-center px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl">
        Mentor non disponible
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          console.log('🔄 Ouverture du modal pour mentorId:', mentorId);
          setIsModalOpen(true);
        }}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
      >
        <Calendar className="w-5 h-5" />
        Réserver une session
      </button>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        mentorId={mentorId}
        mentorName={mentorName}
        onBook={handleBook}
      />
    </>
  );
}
