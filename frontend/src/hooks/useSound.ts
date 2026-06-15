'use client';

import { useRef } from 'react';

export const useSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playRingtone = () => {
    try {
      // Créer un contexte audio
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      
      const context = audioContextRef.current;
      const now = context.currentTime;
      
      // Créer un oscillateur pour la sonnerie
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      
      oscillator.connect(gain);
      gain.connect(context.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 440; // La4
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      
      oscillator.start();
      oscillator.stop(now + 1.5);
      
      // Deuxième son (aigu)
      setTimeout(() => {
        const osc2 = context.createOscillator();
        const gain2 = context.createGain();
        osc2.connect(gain2);
        gain2.connect(context.destination);
        osc2.type = 'sine';
        osc2.frequency.value = 880;
        gain2.gain.setValueAtTime(0.3, context.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.8);
        osc2.start();
        osc2.stop(context.currentTime + 0.8);
      }, 500);
      
    } catch (error) {
      console.error('Erreur lecture son:', error);
    }
  };

  const stopRingtone = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  return { playRingtone, stopRingtone };
};
