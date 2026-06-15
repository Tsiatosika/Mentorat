'use client';

import { useEffect, useRef, useState } from 'react';
import { PhoneOff } from 'lucide-react';

interface JitsiMeetingProps {
  roomName: string;
  userName: string;
  onClose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export function JitsiMeeting({ roomName, userName, onClose }: JitsiMeetingProps) {
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    // Charger le script Jitsi
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      console.log('Script Jitsi chargé');
      initJitsi();
    };
    document.head.appendChild(script);

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, [roomName, userName]);

  const initJitsi = () => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) {
      console.error('Container ou API non disponible');
      return;
    }

    const domain = 'meet.jit.si';
    const options = {
      roomName: `Mentorat_${roomName.substring(0, 8)}`,
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      userInfo: {
        displayName: userName,
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        disableInviteFunctions: true,
        enableCalendarIntegration: false,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
        requireDisplayName: false,
      },
    };

    try {
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      
      apiRef.current.addEventListener('videoConferenceJoined', () => {
        console.log('✅ Conférence rejointe');
        setLoading(false);
      });

      apiRef.current.addEventListener('readyToClose', () => {
        onClose();
      });

      setTimeout(() => {
        setLoading(false);
      }, 3000);

    } catch (error) {
      console.error('Erreur Jitsi:', error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
        >
          <PhoneOff className="w-5 h-5 text-white" />
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white">Connexion à la visioconférence...</p>
          </div>
        </div>
      )}

      <div ref={containerRef} className="flex-1 w-full h-full" />
    </div>
  );
}
