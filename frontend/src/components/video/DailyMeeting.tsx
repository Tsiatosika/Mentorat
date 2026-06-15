'use client';

import { useState } from 'react';
import { PhoneOff } from 'lucide-react';

interface DailyMeetingProps {
  roomName: string;
  userName: string;
  onClose: () => void;
}

export function DailyMeeting({ roomName, userName, onClose }: DailyMeetingProps) {
  const [loading, setLoading] = useState(true);
  
  // Salle unique par session
  const roomId = `mentorat-${roomName.substring(0, 8)}`;
  const dailyUrl = `https://mentorat.daily.co/${roomId}`;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Barre de contrôle */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-black p-4 z-20">
        <div className="flex justify-between items-center">
          <div className="text-white font-semibold">
            🎥 Visioconférence - {userName}
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Chargement */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white">Connexion à la visioconférence...</p>
            <p className="text-gray-400 text-sm mt-2">Patientez quelques secondes</p>
          </div>
        </div>
      )}

      {/* Iframe Daily.co */}
      <iframe
        src={`${dailyUrl}?name=${encodeURIComponent(userName)}`}
        allow="camera; microphone; fullscreen"
        className="w-full h-full border-0"
        onLoad={() => setLoading(false)}
        title="Visioconférence"
      />
    </div>
  );
}
