'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface Message {
  id:             string;
  contenu:        string;
  expediteur_id:  string;
  envoye_le:      string;
  nom:            string;
  prenom:         string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export default function ChatPage() {
  const params    = useParams();
  const router    = useRouter();
  const { user }  = useAuth();
  const sessionId = params.id as string;

  const [socket,      setSocket]     = useState<Socket | null>(null);
  const [messages,    setMessages]   = useState<Message[]>([]);
  const [newMessage,  setNewMessage] = useState('');
  const [loading,     setLoading]    = useState(true);
  const [sending,     setSending]    = useState(false);
  const [isTyping,    setIsTyping]   = useState(false);   // l'autre personne écrit
  const [connected,   setConnected]  = useState(false);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const typingTimeout   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef       = useRef<Socket | null>(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }

    const token = localStorage.getItem('token');
    const sock  = io(SOCKET_URL, {
      auth:       { token },
      transports: ['websocket', 'polling'],
      reconnection:        true,
      reconnectionAttempts: 5,
      reconnectionDelay:   1000,
    });

    socketRef.current = sock;

    sock.on('connect', () => {
      setConnected(true);
      sock.emit('get_history', { session_id: sessionId, page: 1, limit: 50 });
    });

    sock.on('disconnect', () => setConnected(false));

    sock.on('history', (data) => {
      if (data.success) {
        setMessages(data.messages || []);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      }
    });

    // CORRECTION 1 : ajouter le message reçu ET marquer les messages comme lus
    sock.on('new_message', (message: Message) => {
      setMessages((prev) => {
        // Eviter les doublons si message_sent arrive aussi
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      setTimeout(scrollToBottom, 100);
      // Marquer comme lu
      sock.emit('mark_read', { session_id: sessionId, message_id: message.id });
    });

    // CORRECTION 2 : message_sent ajoute aussi le message dans la liste
    sock.on('message_sent', (data) => {
      if (data.success && data.message) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(scrollToBottom, 100);
      }
    });

    // CORRECTION 3 : indicateur "en train d'écrire"
    sock.on('user_typing', (data: { is_typing: boolean }) => {
      setIsTyping(data.is_typing);
      if (data.is_typing) {
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    sock.on('error', (error: { message: string }) => {
      toast.error(error.message);
    });

    setSocket(sock);

    return () => {
      sock.disconnect();
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [user, router, sessionId]);

  // CORRECTION 4 : émission de l'événement "typing" pendant la saisie
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    if (socketRef.current) {
      socketRef.current.emit('typing', { session_id: sessionId, is_typing: true });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socketRef.current?.emit('typing', { session_id: sessionId, is_typing: false });
      }, 1500);
    }
  };

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !socketRef.current || sending) return;
    setSending(true);
    socketRef.current.emit('send_message', {
      session_id:   sessionId,
      contenu:      newMessage.trim(),
      type_message: 'texte',
    });
    // Stopper l'indicateur typing
    socketRef.current.emit('typing', { session_id: sessionId, is_typing: false });
    setNewMessage('');
    setSending(false);
  }, [newMessage, sending, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/chat" className="hover:text-indigo-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold">Chat de session</h1>
            <p className="text-xs text-indigo-200 flex items-center gap-1">
              {/* CORRECTION 5 : indicateur de connexion Socket.IO */}
              <span className={`w-2 h-2 rounded-full inline-block ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
              {connected ? 'Connecté' : 'Reconnexion...'}
            </p>
          </div>
        </div>
      </div>

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 py-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            Aucun message. Commencez la conversation !
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.expediteur_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {!isOwn && (
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 self-end">
                      <span className="text-xs font-semibold text-indigo-700">
                        {msg.prenom?.[0]}{msg.nom?.[0]}
                      </span>
                    </div>
                  )}
                  <div className={`max-w-[70%] ${isOwn ? '' : ''}`}>
                    {!isOwn && (
                      <p className="text-xs text-gray-500 mb-1 ml-1">{msg.prenom} {msg.nom}</p>
                    )}
                    <div className={`rounded-2xl px-4 py-2 ${
                      isOwn ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 shadow-sm'
                    }`}>
                      <p className="text-sm break-words whitespace-pre-wrap">{msg.contenu}</p>
                      <p className={`text-xs mt-1 text-right ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {new Date(msg.envoye_le).toLocaleTimeString('fr-FR', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Indicateur "en train d'écrire" */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay}
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Zone saisie */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-3 items-end">
            <textarea
              value={newMessage}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message... (Entrée pour envoyer)"
              disabled={!connected}
              className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 max-h-32"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending || !connected}
              className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Maj+Entrée pour aller à la ligne</p>
        </div>
      </div>
    </div>
  );
}