'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Token manquant.');
      return;
    }
    verifyEmail(token);
  }, []);

  const verifyEmail = async (token: string) => {
    try {
      const res = await api.post('/auth/verify-email', { token });
      setStatus('success');
      setMessage(res.data.message);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Erreur de vérification.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="card p-8 max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Vérification en cours...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--success)' }} />
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Email vérifié !</h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            <Link href="/login" className="btn btn-primary">Se connecter</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--danger)' }} />
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Erreur</h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            <Link href="/login" className="btn btn-primary">Retour à la connexion</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={48} className="animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}