'use client';

import { useState, useEffect } from 'react';
import { Phone, PhoneOff, PhoneCall, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface CallRecord {
  id: string;
  contactName: string;
  contactId: string;
  duration: number;
  timestamp: Date;
  type: 'entrant' | 'sortant' | 'manqué';
  accepted: boolean;
}

interface CallHistoryProps {
  onCallBack?: (contactId: string, contactName: string) => void;
}

export function CallHistory({ onCallBack }: CallHistoryProps) {
  const [history, setHistory] = useState<CallRecord[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem('callHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        })));
      } catch (e) {
        console.error('Erreur chargement historique:', e);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} sec`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min${secs > 0 ? ` ${secs} sec` : ''}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getCallIcon = (type: string, accepted: boolean) => {
    if (!accepted) return <PhoneOff className="w-4 h-4 text-red-500" />;
    if (type === 'entrant') return <PhoneCall className="w-4 h-4 text-green-500 transform rotate-180" />;
    return <PhoneCall className="w-4 h-4 text-blue-500" />;
  };

  const getCallStatus = (type: string, accepted: boolean, duration: number) => {
    if (!accepted) return 'Manqué';
    if (type === 'entrant') return 'Appel entrant';
    return 'Appel sortant';
  };

  if (history.length === 0) return null;

  const latestCalls = history.slice(0, isExpanded ? history.length : 3);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4">
      {/* En-tête */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">Appels récents</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {history.length}
          </span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {/* Liste des appels */}
      {isExpanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {latestCalls.map((call) => (
            <div key={call.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {getCallIcon(call.type, call.accepted)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{call.contactName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs ${
                      !call.accepted ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {getCallStatus(call.type, call.accepted, call.duration)}
                    </span>
                    {call.accepted && call.duration > 0 && (
                      <>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{formatDuration(call.duration)}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(call.timestamp)}</p>
                </div>
              </div>
              {onCallBack && call.accepted && (
                <button
                  onClick={() => onCallBack(call.contactId, call.contactName)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-white text-sm"
                >
                  <Phone className="w-3 h-3" />
                  Rappeler
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Fonction pour sauvegarder un appel
export const saveCallRecord = (contactId: string, contactName: string, duration: number, type: 'entrant' | 'sortant', accepted: boolean) => {
  const existing = localStorage.getItem('callHistory');
  const history = existing ? JSON.parse(existing) : [];
  const newCall = {
    id: Date.now().toString(),
    contactId,
    contactName,
    duration,
    timestamp: new Date().toISOString(),
    type,
    accepted
  };
  const updated = [newCall, ...history].slice(0, 50);
  localStorage.setItem('callHistory', JSON.stringify(updated));
  
  // Déclencher un événement pour mettre à jour l'interface
  window.dispatchEvent(new CustomEvent('callHistoryUpdated'));
};
