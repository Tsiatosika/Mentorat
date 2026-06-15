'use client';

import { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize, Minimize } from 'lucide-react';
import { CallTimer } from './CallTimer';
import { saveCallRecord } from './CallHistory';

interface SimpleJitsiProps {
  roomName: string;
  userName: string;
  contactName?: string;
  contactId?: string;
  onClose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export function SimpleJitsi({ roomName, userName, contactName, contactId, onClose }: SimpleJitsiProps) {
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const initializedRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      console.log('Script Jitsi chargé');
      initJitsi();
    };
    script.onerror = () => {
      console.error('Erreur chargement Jitsi');
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, []);

  // Minuteur
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && !loading) {
      startTimeRef.current = Date.now();
      interval = setInterval(() => {
        if (startTimeRef.current) {
          setCallDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    } else if (!isConnected && startTimeRef.current) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (duration > 0 && contactId && contactName) {
        saveCallRecord(contactId, contactName, duration, 'sortant', true);
      }
      startTimeRef.current = null;
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, loading, contactId, contactName]);

  const initJitsi = () => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) {
      console.error('Container ou API non disponible');
      return;
    }

    const room = `Mentorat_${roomName.substring(0, 8)}`;
    console.log('🎥 Salle:', room);
    console.log('👤 Utilisateur:', userName);

    const options = {
      roomName: room,
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
      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', options);
      
      apiRef.current.addEventListener('videoConferenceJoined', () => {
        console.log('✅ Conférence rejointe');
        setLoading(false);
        setIsConnected(true);
      });

      apiRef.current.addEventListener('videoConferenceLeft', () => {
        console.log('👋 Participant a quitté');
        setIsConnected(false);
        onClose();
      });

      apiRef.current.addEventListener('readyToClose', () => {
        console.log('🔚 Conférence prête à fermer');
        onClose();
      });

      setTimeout(() => {
        setLoading(false);
      }, 5000);

    } catch (error) {
      console.error('Erreur Jitsi:', error);
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Barre de contrôle supérieure */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-white text-sm">🎥 Appel vidéo</span>
            </div>
            {isConnected && !loading && (
              <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                <span className="text-white font-mono text-sm">{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Plein écran"
            >
              {isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
            </button>
            <button
              onClick={() => {
                if (apiRef.current) {
                  apiRef.current.executeCommand('hangup');
                }
                onClose();
              }}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <PhoneOff className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Chargement */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white">Connexion à la visioconférence...</p>
          </div>
        </div>
      )}

      {/* Conteneur Jitsi */}
      <div ref={containerRef} id="jitsi-container" className="flex-1 w-full h-full" />
    </div>
  );
}
