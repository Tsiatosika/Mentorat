'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Download, File, X, Paperclip, Send, Smile, Video,
  Trash2, MoreVertical, ChevronDown, Check, CheckCheck,
  Clock, Calendar, MessageCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { sessionAPI, messageAPI, BACKEND_URL } from '@/services/api';
import { uploadFile } from '@/services/uploadService';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { SimpleJitsi } from '@/components/video/SimpleJitsi';
import { IncomingCallModal } from '@/components/video/IncomingCallModal';
import { CallHistory, saveCallRecord } from '@/components/video/CallHistory';
import { useSound } from '@/hooks/useSound';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  contenu: string;
  expediteur_id: string;
  envoye_le: string;
  nom: string;
  prenom: string;
  type_message?: string;
  fichier_url?: string;
  lu?: boolean;
  tempId?: string;
}

const AVATAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444', '#3B82F6'];

function getInitials(name: string) {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function colorForName(name: string) {
  const code = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const sessionId = params.id as string;
  const { playRingtone, stopRingtone } = useSound();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ url: string; name: string; type: string }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: string; fromName: string; roomName: string } | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherUserPhoto, setOtherUserPhoto] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';

  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        const response = await sessionAPI.getById(sessionId);
        const session = response.data.session;
        setSessionInfo(session);

        if (user?.role === 'mentor') {
          setOtherUserId(session.mentore_user_id);
          setOtherUserName(`${session.mentore_prenom} ${session.mentore_nom}`);
          setOtherUserPhoto(session.mentore_photo_url || null);
        } else {
          setOtherUserId(session.mentor_user_id);
          setOtherUserName(`${session.mentor_prenom} ${session.mentor_nom}`);
          setOtherUserPhoto(session.mentor_photo_url || null);
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    };

    if (sessionId && user) {
      fetchOtherUser();
    }
  }, [sessionId, user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    initSocket();
    return () => { 
      if (socket) socket.disconnect();
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    };
  }, [user, router, sessionId]);

  useEffect(() => {
    if (showVideo) {
      callStartTimeRef.current = Date.now();
      setIsCallActive(true);
      callIntervalRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        }
      }, 1000);
    } else {
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
        callIntervalRef.current = null;
      }
      if (callStartTimeRef.current) {
        const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        if (duration > 0 && otherUserId && otherUserName) {
          saveCallRecord(otherUserId, otherUserName, duration, 'sortant', true);
        }
        callStartTimeRef.current = null;
      }
      setIsCallActive(false);
      setCallDuration(0);
    }
  }, [showVideo, otherUserId, otherUserName]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpenFor && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenFor(null);
      }
      if (showEmojiPicker && emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenFor, showEmojiPicker]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  useEffect(() => {
    setPhotoFailed(false);
  }, [otherUserPhoto]);

  const initSocket = () => {
    const token = localStorage.getItem('token');
    const newSocket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      newSocket.emit('get_history', { session_id: sessionId });
    });

    newSocket.on('history', (data) => {
      if (data.success) {
        setMessages(data.messages || []);
        setLoading(false);
        setTimeout(() => scrollToBottom(false), 100);
      }
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      setTimeout(() => scrollToBottom(true), 100);
    });

    newSocket.on('user_typing', (data) => {
      setOtherTyping(data.is_typing);
    });

    newSocket.on('user_status', (data) => {
      if (data.userId === otherUserId) setOtherOnline(!!data.online);
    });

    newSocket.on('message_deleted', (data) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
      toast(t('chat.message_deleted'), { icon: '🗑️' });
    });

    newSocket.on('incoming_call', (data) => {
      playRingtone();
      setIncomingCall({
        from: data.from,
        fromName: data.fromName,
        roomName: data.roomName
      });
    });

    newSocket.on('call_accepted', () => {
      stopRingtone();
      toast.success(t('chat.call_accepted'));
      setShowVideo(true);
    });

    newSocket.on('call_rejected', () => {
      stopRingtone();
      toast.error(t('chat.call_rejected'));
      if (otherUserId && otherUserName) {
        saveCallRecord(otherUserId, otherUserName, 0, 'sortant', false);
      }
    });

    newSocket.on('call_ended', () => {
      setShowVideo(false);
      toast(t('chat.call_ended'), { icon: '📞' });
    });

    newSocket.on('call_error', (error) => {
      stopRingtone();
      toast.error(error.message);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message);
      setSending(false);
      setUploading(false);
    });

    setSocket(newSocket);
  };

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }, 100);
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtBottom(distanceFromBottom < 120);
  };

  const sendTextMessage = (text: string) => {
    if (!socket || sending) return;
    if (!text.trim()) return;

    const tempId = Date.now().toString();
    const tempMessage: Message = {
      id: tempId,
      contenu: text.trim(),
      expediteur_id: user?.id || '',
      envoye_le: new Date().toISOString(),
      nom: user?.nom || '',
      prenom: user?.prenom || '',
      type_message: 'texte',
      tempId: tempId
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setSending(true);
    scrollToBottom();

    socket.emit('send_message', {
      session_id: sessionId,
      contenu: text.trim(),
      type_message: 'texte'
    });
    setTimeout(() => setSending(false), 500);
  };

  const sendFile = async (file: File) => {
    try {
      const result = await uploadFile(file);
      if (result.success && socket) {
        const fileUrl = result.url.startsWith('http') ? result.url : `${BACKEND_URL}${result.url}`;
        const messageText = file.type.startsWith('image/') ? `📷 ${file.name}` : `📎 ${file.name}`;

        const tempId = Date.now().toString();
        const tempMessage: Message = {
          id: tempId,
          contenu: messageText,
          expediteur_id: user?.id || '',
          envoye_le: new Date().toISOString(),
          nom: user?.nom || '',
          prenom: user?.prenom || '',
          type_message: 'fichier',
          fichier_url: fileUrl,
          tempId: tempId
        };

        setMessages(prev => [...prev, tempMessage]);
        scrollToBottom();

        socket.emit('send_message', {
          session_id: sessionId,
          contenu: messageText,
          type_message: 'fichier',
          fichier_url: fileUrl,
          fichier_nom: file.name
        });
        return true;
      }
      return false;
    } catch (error) {
      toast.error(`Erreur upload: ${file.name}`);
      return false;
    }
  };

  const sendAll = async () => {
    if (sending || uploading) return;
    if (newMessage.trim() === '' && selectedFiles.length === 0) return;

    setSending(true);
    setUploading(true);

    const messageText = newMessage.trim();

    if (messageText) {
      sendTextMessage(messageText);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    for (const file of selectedFiles) {
      await sendFile(file);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setNewMessage('');
    setSelectedFiles([]);
    setFilePreviews([]);
    setSending(false);
    setUploading(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMultipleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const tooLarge = files.some(f => f.size > 10 * 1024 * 1024);
    if (tooLarge) {
      toast.error('Un ou plusieurs fichiers dépassent 10MB');
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);

    const newPreviews = files.map(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        return new Promise<{ url: string; name: string; type: string }>((resolve) => {
          reader.onloadend = () => {
            resolve({ url: reader.result as string, name: file.name, type: file.type });
          };
        });
      } else {
        return Promise.resolve({ url: '', name: file.name, type: file.type });
      }
    });

    Promise.all(newPreviews).then(previews => {
      setFilePreviews(prev => [...prev, ...previews]);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleTyping = () => {
    if (!socket) return;

    socket.emit('typing', { session_id: sessionId, is_typing: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { session_id: sessionId, is_typing: false });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAll();
    }
  };

  const handleEmojiClick = (emojiObject: any) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename.replace(/[📎📷]/g, '').trim();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  const handleFileClick = (url: string, filename: string, isImage: boolean) => {
    if (isImage) {
      setSelectedImage(url);
    } else {
      downloadFile(url, filename);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!socket) return;

    try {
      const response = await messageAPI.deleteMessage(messageId);

      if (response.data.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        socket.emit('delete_message', { messageId, sessionId });
        toast.success(t('chat.message_deleted_success'));
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(t('chat.message_delete_error'));
    }
    setMenuOpenFor(null);
  };

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const isImageFile = (url: string) => {
    return url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  const startCall = () => {
    if (!socket) {
      toast.error('Connexion socket non établie');
      return;
    }

    if (!otherUserId) {
      toast.error("Impossible de trouver l'autre participant");
      return;
    }

    socket.emit('call_user', {
      to: otherUserId,
      roomName: sessionId,
      callerName: `${user?.prenom} ${user?.nom}`
    });

    setShowVideo(true);
    toast.success('Appel en cours...');
  };

  const acceptCall = () => {
    if (incomingCall && socket) {
      stopRingtone();
      socket.emit('accept_call', { to: incomingCall.from, roomName: incomingCall.roomName });
      setShowVideo(true);
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      stopRingtone();
      socket.emit('reject_call', { to: incomingCall.from });
      setIncomingCall(null);
      if (otherUserId && otherUserName) {
        saveCallRecord(otherUserId, otherUserName, 0, 'entrant', false);
      }
    }
  };

  const endCall = () => {
    if (socket && otherUserId) {
      socket.emit('end_call', { to: otherUserId });
    }
    setShowVideo(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCallBack = (contactId: string, contactName: string) => {
    if (socket && contactId) {
      socket.emit('call_user', {
        to: contactId,
        roomName: sessionId,
        callerName: `${user?.prenom} ${user?.nom}`
      });
      setShowVideo(true);
      toast.success(`Appel vers ${contactName}...`);
    }
  };

  const dayLabel = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor(
      (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000
    );
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: diffDays > 300 ? 'numeric' : undefined });
  };

  type Row =
    | { kind: 'date'; key: string; label: string }
    | { kind: 'msg'; key: string; message: Message; isFirstInGroup: boolean; isLastInGroup: boolean };

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    let lastDay = '';
    messages.forEach((m, idx) => {
      const day = new Date(m.envoye_le).toDateString();
      if (day !== lastDay) {
        out.push({ kind: 'date', key: `date-${day}`, label: dayLabel(m.envoye_le) });
        lastDay = day;
      }
      const prev = messages[idx - 1];
      const next = messages[idx + 1];
      const sameAsPrev = prev && prev.expediteur_id === m.expediteur_id &&
        new Date(m.envoye_le).toDateString() === new Date(prev.envoye_le).toDateString() &&
        (new Date(m.envoye_le).getTime() - new Date(prev.envoye_le).getTime()) < 5 * 60 * 1000;
      const sameAsNext = next && next.expediteur_id === m.expediteur_id &&
        new Date(m.envoye_le).toDateString() === new Date(next.envoye_le).toDateString() &&
        (new Date(next.envoye_le).getTime() - new Date(m.envoye_le).getTime()) < 5 * 60 * 1000;
      out.push({
        kind: 'msg',
        key: m.id || `msg-${idx}`,
        message: m,
        isFirstInGroup: !sameAsPrev,
        isLastInGroup: !sameAsNext,
      });
    });
    return out;
  }, [messages, locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" 
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Chargement du chat...</p>
        </div>
      </div>
    );
  }

  const hasContent = newMessage.trim() !== '' || selectedFiles.length > 0;
  const otherInitials = getInitials(otherUserName || '?');
  const otherAvatarColor = colorForName(otherUserName || 'x');

  return (
    <div 
      className="h-screen flex flex-col" 
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ===== HEADER FIXE ===== */}
      <div 
        className="flex-shrink-0 z-20"
        style={{ 
          backgroundColor: 'var(--card-bg)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Partie gauche */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/chat"
                className="p-2 rounded-lg transition-all hover:bg-[var(--bg-secondary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {otherUserPhoto && !photoFailed ? (
                    <img
                      src={getFullUrl(otherUserPhoto)}
                      alt={otherUserName}
                      onError={() => setPhotoFailed(true)}
                      className="w-11 h-11 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: otherAvatarColor }}
                    >
                      {otherInitials}
                    </div>
                  )}
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                    style={{
                      backgroundColor: otherOnline ? '#10B981' : '#9CA3AF',
                      borderColor: 'var(--card-bg)',
                    }}
                  />
                </div>

                {/* Infos */}
                <div className="min-w-0">
                  <h1 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {otherUserName || 'Utilisateur'}
                  </h1>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                      <Clock className="w-3 h-3" />
                      {otherOnline ? 'En ligne' : 'Hors ligne'}
                    </span>
                    {sessionInfo && (
                      <>
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                        <span className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                          <Calendar className="w-3 h-3" />
                          {new Date(sessionInfo.date_debut).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {isCallActive && (
                <div className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {formatDuration(callDuration)}
                </div>
              )}
              <button
                onClick={startCall}
                disabled={isCallActive}
                className="p-2.5 rounded-lg transition-all hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                style={{ color: isCallActive ? 'var(--text-secondary)' : 'var(--accent)' }}
                title="Appel vidéo"
              >
                {isCallActive ? <Video className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MESSAGES (SCROLLABLE UNIQUEMENT ICI) ===== */}
      <div className="flex-1 min-h-0 relative">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full px-4 py-4 overflow-y-auto"
          style={{
            scrollBehavior: 'smooth',
          }}
        >
          <div className="max-w-4xl mx-auto">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <MessageCircle className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Aucun message
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {otherUserName ? `Dites bonjour à ${otherUserName.split(' ')[0]}` : 'Commencez la conversation'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {rows.map((row) => {
                  if (row.kind === 'date') {
                    return (
                      <div key={row.key} className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                        <span
                          className="text-xs font-medium px-4 py-1 rounded-lg"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          {row.label}
                        </span>
                        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                      </div>
                    );
                  }

                  const message = row.message;
                  const isOwn = message.expediteur_id === user?.id;
                  const fullUrl = getFullUrl(message.fichier_url || '');
                  const isImage = isImageFile(fullUrl);
                  const isFile = message.type_message === 'fichier' && message.fichier_url;

                  const radius = isOwn
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px';

                  return (
                    <motion.div
                      key={row.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                      <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {!isOwn && (
                          <div className="flex-shrink-0" style={{ visibility: row.isLastInGroup ? 'visible' : 'hidden' }}>
                            {otherUserPhoto && !photoFailed ? (
                              <img
                                src={getFullUrl(otherUserPhoto)}
                                alt={otherUserName}
                                onError={() => setPhotoFailed(true)}
                                className="w-7 h-7 rounded-lg object-cover"
                              />
                            ) : (
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                                style={{ backgroundColor: otherAvatarColor }}
                              >
                                {otherInitials}
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          className="relative px-4 py-2.5"
                          style={{
                            background: isOwn
                              ? 'var(--accent)'
                              : 'var(--card-bg)',
                            color: isOwn ? '#06231D' : 'var(--text-primary)',
                            border: isOwn ? 'none' : '1px solid var(--border)',
                            borderRadius: radius,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          {isFile ? (
                            <div 
                              onClick={() => handleFileClick(fullUrl, message.contenu, !!isImage)} 
                              className="cursor-pointer"
                            >
                              {isImage ? (
                                <div className="rounded-lg overflow-hidden">
                                  <img
                                    src={fullUrl}
                                    alt={message.contenu}
                                    className="max-w-[200px] max-h-[180px] object-cover hover:opacity-90 transition-opacity"
                                  />
                                </div>
                              ) : (
                                <div
                                  className="flex items-center gap-3 p-2 rounded-lg"
                                  style={{ backgroundColor: isOwn ? 'rgba(6,35,29,0.08)' : 'var(--bg-secondary)' }}
                                >
                                  <File className="w-5 h-5 flex-shrink-0" style={{ color: isOwn ? '#06231D' : 'var(--accent)' }} />
                                  <span className="text-sm truncate">{message.contenu.replace(/[📎📷]/g, '').trim()}</span>
                                  <Download className="w-4 h-4 opacity-50 flex-shrink-0" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{message.contenu}</p>
                          )}

                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] opacity-60">
                              {new Date(message.envoye_le).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              message.lu
                                ? <CheckCheck className="w-3 h-3 opacity-60" />
                                : <Check className="w-3 h-3 opacity-40" />
                            )}
                          </div>

                          {isOwn && (
                            <button
                              onClick={() => setMenuOpenFor(menuOpenFor === message.id ? null : message.id)}
                              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--bg-secondary)]"
                            >
                              <MoreVertical className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                            </button>
                          )}

                          {isOwn && menuOpenFor === message.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 top-full mt-1 rounded-lg shadow-lg overflow-hidden z-30 min-w-[140px]"
                              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
                            >
                              <button
                                onClick={() => deleteMessage(message.id)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm w-full transition-colors hover:bg-[var(--bg-secondary)]"
                                style={{ color: 'var(--danger)' }}
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {otherTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-end gap-2 mt-1"
                  >
                    <div className="flex-shrink-0">
                      {otherUserPhoto && !photoFailed ? (
                        <img
                          src={getFullUrl(otherUserPhoto)}
                          alt={otherUserName}
                          onError={() => setPhotoFailed(true)}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: otherAvatarColor }}
                        >
                          {otherInitials}
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Bouton retour en bas */}
        {!isAtBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* ===== ZONE DE SAISIE FIXE ===== */}
      <div 
        className="flex-shrink-0"
        style={{ 
          backgroundColor: 'var(--card-bg)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="px-4 py-3">
          {/* Prévisualisation des fichiers */}
          {filePreviews.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 rounded-xl" 
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex flex-wrap gap-3">
                {filePreviews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    {preview.url ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-soft)' }}>
                        <File className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 rounded-full p-1 shadow-md"
                      style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-xs mt-1 truncate w-16 text-center" style={{ color: 'var(--text-tertiary)' }}>
                      {preview.name.substring(0, 10)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Input group */}
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-0.5 pb-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploading}
                className="p-2 rounded-lg transition-all hover:bg-[var(--bg-secondary)] disabled:opacity-40"
                style={{ color: 'var(--text-secondary)' }}
                title="Joindre un fichier"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="relative" ref={emojiRef}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-lg transition-all hover:bg-[var(--bg-secondary)]"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Emojis"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 z-50 shadow-xl rounded-2xl overflow-hidden">
                    <EmojiPicker onEmojiClick={handleEmojiClick} theme={theme === 'dark' ? ('dark' as any) : ('light' as any)} />
                  </div>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.txt"
              multiple
              className="hidden"
              onChange={handleMultipleFilesSelect}
              disabled={sending || uploading}
            />

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                onKeyUp={handleTyping}
                placeholder="Écrivez votre message..."
                disabled={sending || uploading}
                rows={1}
                className="w-full resize-none border rounded-xl px-4 py-2.5 outline-none transition-all focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  minHeight: '44px',
                  maxHeight: '120px',
                  '--tw-ring-color': 'var(--accent)',
                } as React.CSSProperties}
              />
            </div>

            <button
              onClick={sendAll}
              disabled={!hasContent || sending || uploading}
              className="flex-shrink-0 w-11 h-11 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95"
              style={{ 
                backgroundColor: hasContent && !sending && !uploading ? 'var(--accent)' : 'var(--bg-secondary)',
                color: hasContent && !sending && !uploading ? '#06231D' : 'var(--text-tertiary)',
              }}
              title="Envoyer"
            >
              {sending || uploading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-tertiary)' }}>
            Appuyez sur Entrée pour envoyer · Shift+Entrée pour sauter une ligne
          </p>
        </div>
      </div>

      {/* Appels récents */}
      {!showVideo && (
        <div className="flex-shrink-0 px-4 pb-3">
          <CallHistory onCallBack={handleCallBack} />
        </div>
      )}

      {/* Modal image */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] p-4">
              <button 
                onClick={() => setSelectedImage(null)} 
                className="absolute -top-12 right-0 text-white hover:opacity-70 transition-opacity"
              >
                <X className="w-8 h-8" />
              </button>
              <img 
                src={selectedImage} 
                alt="Agrandissement" 
                className="max-w-full max-h-[85vh] object-contain rounded-xl" 
              />
              <button
                onClick={(e) => { e.stopPropagation(); downloadFile(selectedImage, 'image'); }}
                className="absolute -bottom-12 right-0 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-transform hover:scale-105"
                style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visio */}
      {showVideo && (
        <SimpleJitsi
          roomName={sessionId}
          userName={`${user?.prenom} ${user?.nom}`}
          contactName={otherUserName}
          contactId={otherUserId || undefined}
          onClose={endCall}
        />
      )}

      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.fromName}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}
    </div>
  );
}