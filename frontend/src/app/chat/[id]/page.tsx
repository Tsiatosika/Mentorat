'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface Message {
  id: string; contenu: string; expediteur_id: string;
  envoye_le: string; nom: string; prenom: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export default function ChatPage() {
  const params    = useParams();
  const router    = useRouter();
  const { user }  = useAuth();
  const sessionId = params.id as string;

  const [messages,   setMessages]  = useState<Message[]>([]);
  const [newMessage, setNewMessage]= useState('');
  const [loading,    setLoading]   = useState(true);
  const [sending,    setSending]   = useState(false);
  const [isTyping,   setIsTyping]  = useState(false);
  const [connected,  setConnected] = useState(false);

  const endRef       = useRef<HTMLDivElement>(null);
  const typingRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef    = useRef<Socket | null>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);

  const scroll = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    const token = localStorage.getItem('token');
    const sock  = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 5 });
    socketRef.current = sock;

    sock.on('connect', () => { setConnected(true); sock.emit('get_history', { session_id: sessionId, page: 1, limit: 50 }); });
    sock.on('disconnect', () => setConnected(false));
    sock.on('history', d => { if (d.success) { setMessages(d.messages || []); setLoading(false); setTimeout(scroll, 100); } });
    sock.on('new_message', (m: Message) => {
      setMessages(p => p.find(x => x.id === m.id) ? p : [...p, m]);
      setTimeout(scroll, 100);
      sock.emit('mark_read', { session_id: sessionId, message_id: m.id });
    });
    sock.on('message_sent', d => {
      if (d.success && d.message) setMessages(p => p.find(x => x.id === d.message.id) ? p : [...p, d.message]);
      setTimeout(scroll, 100);
    });
    sock.on('user_typing', (d: { is_typing: boolean }) => {
      setIsTyping(d.is_typing);
      if (d.is_typing) { if (typingRef.current) clearTimeout(typingRef.current); typingRef.current = setTimeout(() => setIsTyping(false), 3000); }
    });
    sock.on('error', (e: { message: string }) => toast.error(e.message));
    return () => { sock.disconnect(); if (typingRef.current) clearTimeout(typingRef.current); };
  }, [user, router, sessionId]);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    // Auto-resize
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'; }
    if (socketRef.current) {
      socketRef.current.emit('typing', { session_id: sessionId, is_typing: true });
      if (typingRef.current) clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => socketRef.current?.emit('typing', { session_id: sessionId, is_typing: false }), 1500);
    }
  };

  const send = useCallback(() => {
    if (!newMessage.trim() || !socketRef.current || sending) return;
    setSending(true);
    socketRef.current.emit('send_message', { session_id: sessionId, contenu: newMessage.trim(), type_message: 'texte' });
    socketRef.current.emit('typing', { session_id: sessionId, is_typing: false });
    setNewMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSending(false);
  }, [newMessage, sending, sessionId]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' });

  // Grouper les messages par date
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const d = fmtDate(m.envoye_le);
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) last.msgs.push(m);
    else grouped.push({ date: d, msgs: [m] });
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F7FB' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* Chat Header */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #E5EAF2', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <Link href="/sessions" style={{ textDecoration: 'none', color: '#6B7280', display: 'flex', alignItems: 'center' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '20px' }} aria-hidden="true" />
        </Link>
        <div style={{ width: '1px', height: '20px', background: '#E5EAF2' }} />
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0A3B8A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
          <i className="ti ti-message-circle" style={{ fontSize: '16px' }} aria-hidden="true" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E3A5F' }}>Chat de session</div>
          <div style={{ fontSize: '11px', color: connected ? '#22C55E' : '#EF4444', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: connected ? '#22C55E' : '#EF4444', display: 'inline-block' }} />
            {connected ? 'Connecté' : 'Reconnexion...'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {grouped.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
            <i className="ti ti-messages" style={{ fontSize: '48px', color: '#E5EAF2', marginBottom: '12px' }} aria-hidden="true" />
            <p style={{ fontSize: '14px' }}>Aucun message. Commencez la conversation !</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.date}>
              {/* Date divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0 12px' }}>
                <div style={{ flex: 1, height: '0.5px', background: '#E5EAF2' }} />
                <span style={{ fontSize: '11px', color: '#9CA3AF', background: '#F5F7FB', padding: '3px 10px', borderRadius: '20px', border: '0.5px solid #E5EAF2' }}>{group.date}</span>
                <div style={{ flex: 1, height: '0.5px', background: '#E5EAF2' }} />
              </div>

              {group.msgs.map((msg, i) => {
                const isOwn     = msg.expediteur_id === user?.id;
                const prev      = i > 0 ? group.msgs[i - 1] : null;
                const showAvatar = !isOwn && (!prev || prev.expediteur_id !== msg.expediteur_id);

                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '3px' }}>
                    {!isOwn && (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: showAvatar ? '#EFF6FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#3B82F6', flexShrink: 0, marginRight: '8px', alignSelf: 'flex-end' }}>
                        {showAvatar ? `${msg.prenom?.[0] ?? ''}${msg.nom?.[0] ?? ''}`.toUpperCase() : ''}
                      </div>
                    )}
                    <div style={{ maxWidth: '65%' }}>
                      {showAvatar && !isOwn && (
                        <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '3px', marginLeft: '2px' }}>{msg.prenom} {msg.nom}</div>
                      )}
                      <div style={{
                        padding: '10px 14px', borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isOwn ? '#3B82F6' : '#fff',
                        border: isOwn ? 'none' : '0.5px solid #E5EAF2',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}>
                        <p style={{ fontSize: '13px', color: isOwn ? '#fff' : '#1E3A5F', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap', margin: 0 }}>
                          {msg.contenu}
                        </p>
                        <p style={{ fontSize: '10px', color: isOwn ? 'rgba(255,255,255,0.6)' : '#9CA3AF', textAlign: 'right', marginTop: '4px', marginBottom: 0 }}>
                          {fmtTime(msg.envoye_le)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px', marginLeft: '40px' }}>
            <div style={{ background: '#fff', border: '0.5px solid #E5EAF2', borderRadius: '18px', padding: '10px 14px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0, 150, 300].map(d => (
                <span key={d} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#9CA3AF', display: 'inline-block', animation: 'bounce 1.2s infinite', animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #E5EAF2', padding: '12px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: '#F5F7FB', borderRadius: '14px', border: '0.5px solid #E5EAF2', padding: '8px 12px' }}>
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={handleKey}
            placeholder="Écrivez un message... (Entrée pour envoyer)"
            disabled={!connected}
            style={{ flex: 1, border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontSize: '13px', color: '#1E3A5F', lineHeight: 1.5, maxHeight: '120px', fontFamily: 'inherit' }}
            rows={1}
          />
          <button onClick={send} disabled={!newMessage.trim() || sending || !connected} aria-label="Envoyer"
            style={{ width: '36px', height: '36px', borderRadius: '10px', background: newMessage.trim() && connected ? '#3B82F6' : '#E5EAF2', border: 'none', cursor: newMessage.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
            <i className="ti ti-send" style={{ fontSize: '16px', color: newMessage.trim() && connected ? '#fff' : '#9CA3AF' }} aria-hidden="true" />
          </button>
        </div>
        <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '6px', textAlign: 'center' }}>Maj+Entrée pour aller à la ligne</p>
      </div>

      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.7)}40%{transform:scale(1)}}`}</style>
    </div>
  );
}