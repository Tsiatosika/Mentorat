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
    await sessionAPI.create(data);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
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
