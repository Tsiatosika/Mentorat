'use client';

import { useState } from 'react';
import { X, Star, Check } from 'lucide-react';
import { avisAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  mentorName: string;
  onSubmitted: () => void;
}

const CRITERIA = [
  { key: 'note_ponctualite', label: 'Ponctualité' },
  { key: 'note_pedagogie', label: 'Pédagogie' },
  { key: 'note_disponibilite', label: 'Disponibilité' },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star
            className="w-7 h-7 transition-colors"
            style={{
              color: n <= value ? 'var(--warm)' : 'var(--border-strong)',
              fill: n <= value ? 'var(--warm)' : 'none',
            }}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewModal({ isOpen, onClose, sessionId, mentorName, onSubmitted }: ReviewModalProps) {
  const [ratings, setRatings] = useState({ note_ponctualite: 0, note_pedagogie: 0, note_disponibilite: 0 });
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const allRated = Object.values(ratings).every((v) => v > 0);

  const handleSubmit = async () => {
    if (!allRated) {
      toast.error('Veuillez noter chaque critère');
      return;
    }
    setLoading(true);
    try {
      await avisAPI.create({ session_id: sessionId, ...ratings, commentaire });
      setDone(true);
      onSubmitted();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'avis');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRatings({ note_ponctualite: 0, note_pedagogie: 0, note_disponibilite: 0 });
    setCommentaire('');
    setDone(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="card w-full max-w-md p-6">
        {done ? (
          <div className="text-center py-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--success-soft)' }}
            >
              <Check className="w-8 h-8" style={{ color: 'var(--success)' }} />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Merci pour votre avis !
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Votre retour aide les autres mentorés et améliore le matching.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-lg font-medium"
              style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Évaluer la session
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avec {mentorName}</p>
              </div>
              <button onClick={handleClose} style={{ color: 'var(--text-secondary)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-4">
              {CRITERIA.map((c) => (
                <div key={c.key} className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.label}</span>
                  <StarRating
                    value={(ratings as any)[c.key]}
                    onChange={(v) => setRatings((prev) => ({ ...prev, [c.key]: v }))}
                  />
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Commentaire (optionnel)
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border rounded-lg outline-none resize-none"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="Partagez votre expérience..."
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !allRated}
              className="w-full py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                'Envoyer mon avis'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}