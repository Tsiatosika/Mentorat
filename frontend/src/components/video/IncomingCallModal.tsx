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
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="card w-80 overflow-hidden animate-in">
        {/* Header avec animation */}
        <div className="p-4 text-center" style={{ backgroundColor: 'var(--success)' }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg animate-pulse"
            style={{ backgroundColor: '#fff' }}
          >
            <Phone className="w-8 h-8 animate-bounce" style={{ color: 'var(--success)' }} />
          </div>
          <h2 className="font-display font-bold text-lg" style={{ color: '#fff' }}>Appel entrant</h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{callerName}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Vous invite à rejoindre un appel vidéo
          </p>
        </div>

        {/* Actions */}
        <div className="flex" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onAccept}
            className="flex-1 py-4 flex items-center justify-center gap-2 font-semibold transition-colors"
            style={{ color: 'var(--success)', borderRight: '1px solid var(--border)' }}
          >
            <Phone className="w-5 h-5" />
            Accepter
          </button>
          <button
            onClick={onReject}
            className="flex-1 py-4 flex items-center justify-center gap-2 font-semibold transition-colors"
            style={{ color: 'var(--danger)' }}
          >
            <PhoneOff className="w-5 h-5" />
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}