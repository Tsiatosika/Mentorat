'use client';

import { useState, useEffect } from 'react';
import { Phone, PhoneOff, PhoneCall, PhoneIncoming, PhoneOutgoing, Clock, ChevronDown, ChevronUp } from 'lucide-react';

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
    if (!accepted) return <PhoneOff className="w-4 h-4" style={{ color: 'var(--danger)' }} />;
    if (type === 'entrant') return <PhoneIncoming className="w-4 h-4" style={{ color: 'var(--success)' }} />;
    return <PhoneOutgoing className="w-4 h-4" style={{ color: 'var(--info)' }} />;
  };

  const getCallStatus = (type: string, accepted: boolean) => {
    if (!accepted) return 'Manqué';
    if (type === 'entrant') return 'Appel entrant';
    return 'Appel sortant';
  };

  if (history.length === 0) return null;

  const latestCalls = history.slice(0, isExpanded ? history.length : 3);

  return (
    <div className="card overflow-hidden mt-4">
      {/* En-tête */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Appels récents</span>
          <span
            className="font-mono-data text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
          >
            {history.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
        )}
      </div>

      {/* Liste */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {latestCalls.map((call) => (
            <div
              key={call.id}
              className="flex items-center justify-between p-4 transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  {getCallIcon(call.type, call.accepted)}
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{call.contactName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: !call.accepted ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {getCallStatus(call.type, call.accepted)}
                    </span>
                    {call.accepted && call.duration > 0 && (
                      <>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>•</span>
                        <span className="font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {formatDuration(call.duration)}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{formatDate(call.timestamp)}</p>
                </div>
              </div>
              {onCallBack && call.accepted && (
                <button
                  onClick={() => onCallBack(call.contactId, call.contactName)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm"
                  style={{ backgroundColor: 'var(--success)', color: '#fff' }}
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

  window.dispatchEvent(new CustomEvent('callHistoryUpdated'));
};