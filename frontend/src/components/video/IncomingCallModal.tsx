'use client';

import { useEffect } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useSound } from '@/hooks/useSound';

interface IncomingCallModalProps {
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallModal({ callerName, onAccept, onReject }: IncomingCallModalProps) {
  const { playRingtone, stopRingtone } = useSound();

  useEffect(() => {
    playRingtone();
    return () => stopRingtone();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header avec animation de sonnerie */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg animate-pulse">
            <Phone className="w-8 h-8 text-green-600 animate-bounce" />
          </div>
          <h2 className="text-white font-bold text-lg">Appel entrant</h2>
          <p className="text-green-100 text-sm mt-1">{callerName}</p>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 text-center text-sm">
            Vous invite à rejoindre un appel vidéo
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex border-t border-gray-100">
          <button
            onClick={onAccept}
            className="flex-1 py-4 flex items-center justify-center gap-2 text-green-600 font-semibold hover:bg-green-50 transition-colors border-r border-gray-100"
          >
            <Phone className="w-5 h-5" />
            Accepter
          </button>
          <button
            onClick={onReject}
            className="flex-1 py-4 flex items-center justify-center gap-2 text-red-600 font-semibold hover:bg-red-50 transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
