'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Download, File, X, Paperclip, Send, Smile, Video,
  Trash2, MoreVertical, ChevronDown, Check, CheckCheck
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

const AVATAR_COLORS = ['#0A2463', '#1D4ED8', '#7C3AED', '#059669', '#DC2626'];

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);

  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';

  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        const response = await sessionAPI.getById(sessionId);
        const session = response.data.session;

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
    return () => { if (socket) socket.disconnect(); };
  }, [user, router, sessionId]);

  useEffect(() => {
    if (showVideo) {
      callStartTimeRef.current = Date.now();
    } else if (callStartTimeRef.current) {
      const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      if (duration > 0 && otherUserId && otherUserName) {
        saveCallRecord(otherUserId, otherUserName, duration, 'sortant', true);
      }
      callStartTimeRef.current = null;
    }
  }, [showVideo, otherUserId, otherUserName]);

  // Fermer le menu contextuel / les emoji au clic extérieur
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

  // Auto-resize du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  useEffect(() => {
    setPhotoFailed(false);
  }, [otherUserPhoto]);

  // Mesure la hauteur réellement disponible (viewport - position du composant - marge basse
  // du padding du layout parent), pour que le header de chat reste toujours visible quelle
  // que soit la hauteur du TopNavbar.
  useEffect(() => {
    const computeHeight = () => {
      if (!rootRef.current) return;
      const top = rootRef.current.getBoundingClientRect().top;
      const bottomMargin = window.innerWidth >= 640 ? 24 : 16; // p-6 vs p-4 du layout parent
      setAvailableHeight(Math.max(window.innerHeight - top - bottomMargin, 480));
    };
    computeHeight();
    window.addEventListener('resize', computeHeight);
    return () => window.removeEventListener('resize', computeHeight);
  }, [loading]);

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

  // --- Préparation de l'affichage : groupement + séparateurs de date ---
  const dayLabel = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor(
      (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000
    );
    if (diffDays === 0) return t('chat.today') || "Aujourd'hui";
    if (diffDays === 1) return t('chat.yesterday') || 'Hier';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--bg-primary)', height: '480px' }}>
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const hasContent = newMessage.trim() !== '' || selectedFiles.length > 0;
  const otherInitials = getInitials(otherUserName || '?');
  const otherAvatarColor = colorForName(otherUserName || 'x');

  return (
    <div
      ref={rootRef}
      className="flex flex-col overflow-hidden rounded-2xl chat-detail-page"
      style={{
        backgroundColor: 'var(--bg-primary)',
        height: availableHeight ? `${availableHeight}px` : 'calc(100vh - 8rem)',
        minHeight: '480px',
      }}
    >
      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.fromName}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Header */}
      <div
        className="flex-shrink-0 z-20 backdrop-blur-md"
        style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/chat"
                className="p-2 -ml-2 rounded-full transition-colors hover:bg-[var(--bg-secondary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <div className="relative flex-shrink-0">
                {otherUserPhoto && !photoFailed ? (
                  <img
                    src={getFullUrl(otherUserPhoto)}
                    alt={otherUserName}
                    onError={() => setPhotoFailed(true)}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: otherAvatarColor }}
                  >
                    {otherInitials}
                  </div>
                )}
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                  style={{
                    backgroundColor: otherOnline ? 'var(--success)' : 'var(--text-tertiary)',
                    borderColor: 'var(--card-bg)',
                  }}
                />
              </div>

              <div className="min-w-0">
                <h1 className="font-semibold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {otherUserName || t('chat.title')}
                </h1>
                <p className="text-xs leading-tight" style={{ color: otherOnline ? 'var(--success)' : 'var(--text-tertiary)' }}>
                  {otherTyping
                    ? (t('chat.typing') || 'écrit...')
                    : otherOnline
                      ? (t('chat.online') || 'En ligne')
                      : t('chat.session')}
                </p>
              </div>
            </div>

            <button
              onClick={startCall}
              className="call-btn flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-auto sm:px-4 sm:gap-2 rounded-full sm:rounded-xl transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'var(--success)', color: '#fff' }}
              title={t('chat.video_call')}
            >
              <Video className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">{t('chat.video_call')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full max-w-5xl mx-auto w-full px-3 sm:px-4 py-5 overflow-y-auto"
        >
          <div className="space-y-0.5">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 gap-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <span className="text-2xl">💬</span>
                </div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('chat.no_messages')}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {otherUserName ? `Dites bonjour à ${otherUserName.split(' ')[0]}` : ''}
                </p>
              </div>
            ) : (
              rows.map((row) => {
                if (row.kind === 'date') {
                  return (
                    <div key={row.key} className="flex items-center gap-3 my-5 select-none">
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                      <span
                        className="text-xs font-medium px-3 py-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
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
                  ? `${row.isFirstInGroup ? '1.25rem' : '0.45rem'} 1.25rem 1.25rem ${row.isLastInGroup ? '1.25rem' : '0.45rem'}`
                  : `1.25rem ${row.isFirstInGroup ? '1.25rem' : '0.45rem'} ${row.isLastInGroup ? '1.25rem' : '0.45rem'} 1.25rem`;

                return (
                  <div
                    key={row.key}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative animate-message-in`}
                    style={{ marginTop: row.isFirstInGroup ? '0.65rem' : '0.15rem' }}
                  >
                    <div className={`flex items-end gap-2 max-w-[78%] sm:max-w-[65%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {!isOwn && (
                        otherUserPhoto && !photoFailed ? (
                          <img
                            src={getFullUrl(otherUserPhoto)}
                            alt={otherUserName}
                            onError={() => setPhotoFailed(true)}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            style={{ visibility: row.isLastInGroup ? 'visible' : 'hidden' }}
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{
                              backgroundColor: otherAvatarColor,
                              visibility: row.isLastInGroup ? 'visible' : 'hidden',
                            }}
                          >
                            {otherInitials}
                          </div>
                        )
                      )}

                      <div
                        className="chat-bubble relative px-4 py-2.5"
                        style={{
                          background: isOwn
                            ? 'linear-gradient(135deg, var(--accent), var(--accent-hover))'
                            : 'var(--card-bg)',
                          color: isOwn ? '#06231D' : 'var(--text-primary)',
                          border: isOwn ? 'none' : '1px solid var(--border)',
                          borderRadius: radius,
                          boxShadow: 'var(--shadow-card)',
                        }}
                      >
                        {isFile ? (
                          <div onClick={() => handleFileClick(fullUrl, message.contenu, !!isImage)} className="cursor-pointer">
                            {isImage ? (
                              <img
                                src={fullUrl}
                                alt={message.contenu}
                                className="max-w-[220px] max-h-[180px] rounded-lg object-cover hover:opacity-90 transition-opacity"
                              />
                            ) : (
                              <div
                                className="flex items-center gap-2 p-2 rounded-lg transition-colors"
                                style={{ backgroundColor: isOwn ? 'rgba(6,35,29,0.1)' : 'var(--bg-secondary)' }}
                              >
                                <File className="w-5 h-5 flex-shrink-0" style={{ color: isOwn ? '#06231D' : 'var(--accent)' }} />
                                <span className="text-sm break-words underline-offset-2 hover:underline">{message.contenu}</span>
                                <Download className="w-4 h-4 opacity-60 flex-shrink-0" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{message.contenu}</p>
                        )}

                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="font-mono-data text-[11px]" style={{ opacity: 0.65 }}>
                            {new Date(message.envoye_le).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwn && (
                            message.lu
                              ? <CheckCheck className="w-3.5 h-3.5" style={{ opacity: 0.65 }} />
                              : <Check className="w-3.5 h-3.5" style={{ opacity: 0.5 }} />
                          )}
                        </div>

                        {isOwn && (
                          <button
                            onClick={() => setMenuOpenFor(menuOpenFor === message.id ? null : message.id)}
                            className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-[var(--bg-secondary)]"
                          >
                            <MoreVertical className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                          </button>
                        )}

                        {isOwn && menuOpenFor === message.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 rounded-lg shadow-lg overflow-hidden z-30 animate-pop-in"
                            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
                          >
                            <button
                              onClick={() => deleteMessage(message.id)}
                              className="flex items-center gap-2 px-3 py-2 text-sm w-full transition-colors hover:bg-[var(--bg-secondary)] whitespace-nowrap"
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('chat.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {otherTyping && (
              <div className="flex justify-start items-end gap-2 mt-2 animate-message-in">
                {otherUserPhoto && !photoFailed ? (
                  <img
                    src={getFullUrl(otherUserPhoto)}
                    alt={otherUserName}
                    onError={() => setPhotoFailed(true)}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: otherAvatarColor }}
                  >
                    {otherInitials}
                  </div>
                )}
                <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fade en haut de la zone de scroll */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-6"
          style={{ background: 'linear-gradient(to bottom, var(--bg-primary), transparent)' }}
        />

        {/* Bouton retour en bas */}
        {!isAtBottom && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-5 right-6 sm:right-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 animate-pop-in z-10"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-card-hover)' }}
            title="Aller en bas"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Modal image */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button onClick={() => setSelectedImage(null)} className="absolute -top-10 right-0 text-white hover:opacity-70 transition-opacity">
              <X className="w-8 h-8" />
            </button>
            <img src={selectedImage} alt="Agrandissement" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            <button
              onClick={(e) => { e.stopPropagation(); downloadFile(selectedImage, 'image'); }}
              className="absolute -bottom-10 right-0 px-4 py-2 rounded-lg flex items-center gap-2 transition-transform hover:scale-105"
              style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
            >
              <Download className="w-4 h-4" />
              {t('chat.download')}
            </button>
          </div>
        </div>
      )}

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

      {/* Zone de saisie */}
      <div className="flex-shrink-0 relative" style={{ backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3">

          {filePreviews.length > 0 && (
            <div className="mb-3 p-3 rounded-xl animate-pop-in" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex flex-wrap gap-2">
                {filePreviews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    {preview.url ? (
                      <img src={preview.url} alt={preview.name} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--accent-soft)' }}
                      >
                        <File className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 rounded-full p-1 transition-opacity"
                      style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-xs mt-1 truncate w-16" style={{ color: 'var(--text-tertiary)' }}>
                      {preview.name.substring(0, 10)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex items-center gap-1 flex-shrink-0 pb-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploading}
                className="p-2 rounded-full transition-colors disabled:opacity-50 hover:bg-[var(--bg-secondary)]"
                style={{ color: 'var(--text-secondary)' }}
                title={t('chat.attach_file')}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="relative" ref={emojiRef}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-full transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ color: 'var(--text-secondary)' }}
                  title={t('chat.emoji')}
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 z-50 animate-pop-in">
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

            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              onKeyUp={handleTyping}
              placeholder={t('chat.message_placeholder')}
              disabled={sending || uploading}
              rows={1}
              className="chat-textarea flex-1 resize-none border rounded-2xl px-4 py-2.5 outline-none disabled:opacity-50 focus:ring-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                minHeight: '44px',
                maxHeight: '120px',
                '--tw-ring-color': 'var(--accent)',
              } as React.CSSProperties}
            />

            <button
              onClick={sendAll}
              disabled={!hasContent || sending || uploading}
              className="flex-shrink-0 w-11 h-11 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
              title={t('chat.send')}
            >
              {sending || uploading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-tertiary)' }}>
            {t('chat.hint')}
          </p>
        </div>
      </div>

      {!showVideo && (
        <div className="max-w-5xl mx-auto px-4 pb-2 flex-shrink-0">
          <CallHistory onCallBack={handleCallBack} />
        </div>
      )}

      <style jsx global>{`
        @keyframes message-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-message-in {
          animation: message-in 0.18s ease-out;
        }
        @keyframes pop-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-pop-in {
          animation: pop-in 0.15s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }

        .chat-bubble {
          transition: box-shadow 0.2s ease;
        }
        .call-btn {
          transition: transform 0.2s ease, filter 0.2s ease;
        }
        .call-btn:hover {
          filter: brightness(1.05);
        }
        .chat-textarea {
          transition: border-color 0.2s ease;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-message-in, .animate-pop-in, .animate-fade-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}