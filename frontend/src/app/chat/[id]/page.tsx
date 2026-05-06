'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionAPI, messageAPI } from '@/services/api';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  contenu: string;
  expediteur_id: string;
  envoye_le: string;
  lu: boolean;
  nom: string;
  prenom: string;
}

interface Session {
  id: string;
  sujet: string;
  statut: string;
  mentor_nom?: string;
  mentor_prenom?: string;
  mentore_nom?: string;
  mentore_prenom?: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = params.id as string;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSession();
    initSocket();
    return () => {
      if (socket) socket.disconnect();
    };
  }, [user, router, sessionId]);

  const fetchSession = async () => {
    try {
      const response = await sessionAPI.getById(sessionId);
      setSession(response.data.session);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Session non trouvée');
      router.push('/chat');
    }
  };

  const initSocket = () => {
    const token = localStorage.getItem('token');
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket connecté');
      newSocket.emit('get_history', { session_id: sessionId, page: 1, limit: 50 });
    });

    newSocket.on('history', (data) => {
      if (data.success) {
        setMessages(data.messages);
        scrollToBottom();
      }
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('user_typing', (data) => {
      setOtherTyping(data.is_typing);
    });

    newSocket.on('error', (error) => {
      toast.error(error.message);
    });

    setSocket(newSocket);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket) return;

    setSending(true);
    socket.emit('send_message', {
      session_id: sessionId,
      contenu: newMessage.trim(),
      type_message: 'texte'
    });
    setNewMessage('');
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (!socket || typing) return;
    setTyping(true);
    socket.emit('typing', { session_id: sessionId, is_typing: true });
    setTimeout(() => {
      socket.emit('typing', { session_id: sessionId, is_typing: false });
      setTyping(false);
    }, 1000);
  };

  const getOtherName = () => {
    if (!session) return '';
    if (user?.role === 'mentor') {
      return `${session.mentore_prenom || ''} ${session.mentore_nom || ''}`;
    }
    return `${session.mentor_prenom || ''} ${session.mentor_nom || ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/chat" className="hover:text-indigo-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold">{session?.sujet}</h1>
              <p className="text-sm text-indigo-200">avec {getOtherName()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 overflow-y-auto">
        <div className="space-y-3">
          {messages.map((message) => {
            const isOwn = message.expediteur_id === user?.id;
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  <div className={`rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}>
                    <p className="text-sm">{message.contenu}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {new Date(message.envoye_le).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className={`flex items-end ${isOwn ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
          {otherTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              onKeyUp={handleTyping}
              placeholder="Écrivez votre message..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}