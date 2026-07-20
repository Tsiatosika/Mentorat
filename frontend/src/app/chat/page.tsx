'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, MessageCircle, Clock, ChevronRight, Users, ArrowLeft,
  Download, File, X, Paperclip, Send, Smile, Video,
  Trash2, MoreVertical, Check, CheckCheck, Calendar, ChevronDown
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

interface Session {
  id: string;
  sujet: string;
  date_debut: string;
  statut: string;
  mentor_nom?: string;
  mentor_prenom?: string;
  mentor_photo_url?: string;
  mentore_nom?: string;
  mentore_prenom?: string;
  mentore_photo_url?: string;
}

const AVATAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444', '#3B82F6'];

function getInitials(name: string) {
  return name.trim().split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function colorForName(name: string) {
  const code = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function getFullUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BACKEND_URL}${url}`;
}

function Avatar({ name, photoUrl, size = 48 }: { name: string; photoUrl?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(name || '?');
  const bg = colorForName(name || 'x');

  if (photoUrl && !failed) {
    return (
      <img src={getFullUrl(photoUrl)} alt={name} onError={() => setFailed(true)}
        className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.34 }}>
      {initials}
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const router = useRouter();
  const { playRingtone, stopRingtone } = useSound();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
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
  const [otherUserName, setOtherUserName] = useState('');
  const [otherUserPhoto, setOtherUserPhoto] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const locale = 'fr-FR';

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    try {
      const res = await sessionAPI.getAll();
      const all = res.data.sessions || [];
      const active = all.filter((s: Session) => ['confirmee', 'en_cours', 'terminee'].includes(s.statut));
      setSessions(active);
      if (active.length > 0 && !selectedSessionId) {
        setSelectedSessionId(active[0].id);
      }
    } catch { toast.error(t('common.error')); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!selectedSessionId || !user) return;
    if (socket) { socket.disconnect(); }

    setChatLoading(true);
    setMessages([]);
    setNewMessage('');
    setSelectedFiles([]);
    setFilePreviews([]);

    const token = localStorage.getItem('token');
    const newSocket = io(BACKEND_URL, { auth: { token }, transports: ['websocket', 'polling'] });

    newSocket.on('connect', () => {
      newSocket.emit('get_history', { session_id: selectedSessionId });
    });

    newSocket.on('history', (data) => {
      if (data.success) {
        setMessages(data.messages || []);
        setChatLoading(false);
        setTimeout(() => scrollToBottom(false), 100);
      }
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      setTimeout(() => scrollToBottom(true), 100);
    });

    newSocket.on('user_typing', (data) => setOtherTyping(data.is_typing));
    newSocket.on('user_status', (data) => {
      if (data.userId === otherUserId) setOtherOnline(!!data.online);
    });
    newSocket.on('message_deleted', (data) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    });
    newSocket.on('incoming_call', (data) => {
      playRingtone();
      setIncomingCall({ from: data.from, fromName: data.fromName, roomName: data.roomName });
    });
    newSocket.on('call_accepted', () => { stopRingtone(); setShowVideo(true); });
    newSocket.on('call_rejected', () => stopRingtone());
    newSocket.on('call_ended', () => setShowVideo(false));
    newSocket.on('error', (error) => { setSending(false); setUploading(false); });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [selectedSessionId, user]);

  useEffect(() => {
    if (!selectedSessionId || !user) return;
    const fetchOther = async () => {
      try {
        const res = await sessionAPI.getById(selectedSessionId);
        const s = res.data.session;
        setSessionInfo(s);
        if (user.role === 'mentor') {
          setOtherUserId(s.mentore_user_id);
          setOtherUserName(`${s.mentore_prenom} ${s.mentore_nom}`);
          setOtherUserPhoto(s.mentore_photo_url || null);
        } else {
          setOtherUserId(s.mentor_user_id);
          setOtherUserName(`${s.mentor_prenom} ${s.mentor_nom}`);
          setOtherUserPhoto(s.mentor_photo_url || null);
        }
        setPhotoFailed(false);
      } catch {}
    };
    fetchOther();
  }, [selectedSessionId, user]);

  useEffect(() => {
    if (showVideo) {
      callStartTimeRef.current = Date.now();
      setIsCallActive(true);
      callIntervalRef.current = setInterval(() => {
        if (callStartTimeRef.current) setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
      setIsCallActive(false);
      setCallDuration(0);
    }
    return () => { if (callIntervalRef.current) clearInterval(callIntervalRef.current); };
  }, [showVideo]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenFor(null);
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' }), 100);
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 120);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return 'Hier';
    if (diff < 7) return d.toLocaleDateString('fr-FR', { weekday: 'long' });
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getOtherPerson = (s: Session) =>
    user?.role === 'mentor'
      ? `${s.mentore_prenom ?? ''} ${s.mentore_nom ?? ''}`.trim()
      : `${s.mentor_prenom ?? ''} ${s.mentor_nom ?? ''}`.trim();

  const getOtherPhoto = (s: Session) =>
    user?.role === 'mentor' ? s.mentore_photo_url : s.mentor_photo_url;

  const isImageFile = (url: string) => url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const formatDuration = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const dayLabel = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const rows = useMemo(() => {
    const out: any[] = [];
    let lastDay = '';
    messages.forEach((m, idx) => {
      const day = new Date(m.envoye_le).toDateString();
      if (day !== lastDay) { out.push({ kind: 'date', key: `d-${day}`, label: dayLabel(m.envoye_le) }); lastDay = day; }
      const prev = messages[idx - 1];
      const next = messages[idx + 1];
      const samePrev = prev && prev.expediteur_id === m.expediteur_id && (new Date(m.envoye_le).getTime() - new Date(prev.envoye_le).getTime()) < 300000;
      const sameNext = next && next.expediteur_id === m.expediteur_id && (new Date(next.envoye_le).getTime() - new Date(m.envoye_le).getTime()) < 300000;
      out.push({ kind: 'msg', key: m.id || `m-${idx}`, message: m, isFirst: !samePrev, isLast: !sameNext });
    });
    return out;
  }, [messages]);

  const sendTextMessage = (text: string) => {
    if (!socket || sending || !text.trim()) return;
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { id: tempId, contenu: text.trim(), expediteur_id: user?.id || '', envoye_le: new Date().toISOString(), nom: user?.nom || '', prenom: user?.prenom || '', tempId }]);
    setNewMessage('');
    setSending(true);
    scrollToBottom();
    socket.emit('send_message', { session_id: selectedSessionId, contenu: text.trim(), type_message: 'texte' });
    setTimeout(() => setSending(false), 500);
  };

  const sendFile = async (file: File) => {
    try {
      const result = await uploadFile(file);
      if (result.success && socket) {
        const fileUrl = result.url.startsWith('http') ? result.url : `${BACKEND_URL}${result.url}`;
        const msgText = file.type.startsWith('image/') ? `📷 ${file.name}` : `📎 ${file.name}`;
        const tempId = Date.now().toString();
        setMessages(prev => [...prev, { id: tempId, contenu: msgText, expediteur_id: user?.id || '', envoye_le: new Date().toISOString(), nom: user?.nom || '', prenom: user?.prenom || '', type_message: 'fichier', fichier_url: fileUrl, tempId }]);
        scrollToBottom();
        socket.emit('send_message', { session_id: selectedSessionId, contenu: msgText, type_message: 'fichier', fichier_url: fileUrl, fichier_nom: file.name });
      }
    } catch { toast.error(`Erreur: ${file.name}`); }
  };

  const sendAll = async () => {
    if (sending || uploading) return;
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    setSending(true); setUploading(true);
    if (newMessage.trim()) { sendTextMessage(newMessage); await new Promise(r => setTimeout(r, 300)); }
    for (const f of selectedFiles) { await sendFile(f); await new Promise(r => setTimeout(r, 300)); }
    setNewMessage(''); setSelectedFiles([]); setFilePreviews([]);
    setSending(false); setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.some(f => f.size > 10 * 1024 * 1024)) { toast.error('Fichier > 10MB'); return; }
    setSelectedFiles(prev => [...prev, ...files]);
    Promise.all(files.map(f => {
      if (f.type.startsWith('image/')) {
        return new Promise<{ url: string; name: string; type: string }>(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ url: reader.result as string, name: f.name, type: f.type });
          reader.readAsDataURL(f);
        });
      }
      return Promise.resolve({ url: '', name: f.name, type: f.type });
    })).then(p => setFilePreviews(prev => [...prev, ...p]));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (i: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== i));
    setFilePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleTyping = () => {
    if (!socket) return;
    socket.emit('typing', { session_id: selectedSessionId, is_typing: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit('typing', { session_id: selectedSessionId, is_typing: false }), 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAll(); }
  };

  // ═══ DELETE MESSAGE - CORRIGÉ ═══
  const deleteMessage = async (id: string) => {
    if (!socket) return;
    
    // Si c'est un ID temporaire (timestamp, pas un UUID), supprimer seulement côté local
    const isTempId = !id.includes('-') || id.length < 30;
    
    if (isTempId) {
      setMessages(prev => prev.filter(m => m.id !== id));
      setMenuOpenFor(null);
      return;
    }
    
    // Vrai message (UUID) → appeler l'API + socket
    try {
      await messageAPI.deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      socket.emit('delete_message', { messageId: id, sessionId: selectedSessionId });
      toast.success('Message supprimé');
    } catch (error) {
      toast.error('Erreur suppression');
    }
    setMenuOpenFor(null);
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const res = await fetch(url); const blob = await res.blob();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename.replace(/[📎📷]/g, '').trim();
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch { window.open(url, '_blank'); }
  };

  const startCall = () => {
    if (!socket || !otherUserId) return;
    socket.emit('call_user', { to: otherUserId, roomName: selectedSessionId, callerName: `${user?.prenom} ${user?.nom}` });
    setShowVideo(true);
  };

  const acceptCall = () => {
    if (incomingCall && socket) { stopRingtone(); socket.emit('accept_call', { to: incomingCall.from, roomName: incomingCall.roomName }); setShowVideo(true); setIncomingCall(null); }
  };

  const rejectCall = () => {
    if (incomingCall && socket) { stopRingtone(); socket.emit('reject_call', { to: incomingCall.from }); setIncomingCall(null); }
  };

  const endCall = () => {
    if (socket && otherUserId) socket.emit('end_call', { to: otherUserId });
    setShowVideo(false);
  };

  const filteredSessions = sessions
    .filter(s => {
      const match = getOtherPerson(s).toLowerCase().includes(search.toLowerCase()) || s.sujet.toLowerCase().includes(search.toLowerCase());
      if (filter === 'active') return match && s.statut !== 'terminee';
      if (filter === 'completed') return match && s.statut === 'terminee';
      return match;
    })
    .sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime());

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const hasContent = newMessage.trim() !== '' || selectedFiles.length > 0;
  const otherInitials = getInitials(otherUserName || '?');
  const otherAvatarColor = colorForName(otherUserName || 'x');

  const STATUS_LABEL: Record<string, { label: string; color: string; dot: string }> = {
    confirmee: { label: 'Confirmée', color: '#10B981', dot: 'bg-green-500' },
    en_cours: { label: 'En cours', color: '#3B82F6', dot: 'bg-blue-500' },
    terminee: { label: 'Terminée', color: '#9CA3AF', dot: 'bg-gray-400' },
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    // Fixed to the space left below the sticky navbar (h-16 = 4rem) rather
    // than the full 100vh — with 100vh here, the page's overall height (navbar
    // + this block) exceeds one viewport, so the whole page scrolls and takes
    // this header/input bar out of view instead of only the message list.
    <div className="h-[calc(100vh-4rem)] flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* COLONNE GAUCHE - LISTE CONVERSATIONS */}
      <div className={`${isMobile && selectedSessionId ? 'hidden' : 'w-full md:w-[380px]'} flex-shrink-0 flex flex-col border-r`} style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('chat.title')}</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{sessions.length} conversation{sessions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <input type="text" placeholder={t('chat.search_placeholder')} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', ['--tw-ring-color' as any]: 'var(--accent)' }} />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'completed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: filter === f ? 'var(--accent)' : 'var(--bg-secondary)', color: filter === f ? '#06231D' : 'var(--text-secondary)' }}>
                {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Terminés'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <MessageCircle className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{search ? 'Aucun résultat' : t('chat.no_conversation')}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{search ? 'Modifiez votre recherche' : t('chat.no_conversations_desc_alt')}</p>
              {user?.role === 'mentore' && !search && (
                <Link href="/mentors" className="mt-5 px-6 py-3 rounded-xl text-sm font-semibold transition-transform hover:scale-105" style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}>Trouver un mentor</Link>
              )}
            </div>
          ) : (
            filteredSessions.map((s, idx) => {
              const other = getOtherPerson(s);
              const otherPhoto = getOtherPhoto(s);
              const status = STATUS_LABEL[s.statut] || { label: s.statut, color: '#9CA3AF', dot: 'bg-gray-400' };
              const isSelected = selectedSessionId === s.id;
              return (
                <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}>
                  <div onClick={() => setSelectedSessionId(s.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer hover:bg-[var(--bg-secondary)]"
                    style={{ backgroundColor: isSelected ? 'var(--accent-soft)' : 'transparent', border: isSelected ? '1px solid var(--accent)' : '1px solid transparent' }}>
                    <div className="relative flex-shrink-0">
                      <Avatar name={other || '?'} photoUrl={otherPhoto} size={48} />
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${status.dot}`} style={{ borderColor: 'var(--bg-primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{other || 'Inconnu'}</p>
                        <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-tertiary)' }}>{formatDate(s.date_debut)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{s.sujet}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ml-2 font-medium" style={{ backgroundColor: `${status.color}15`, color: status.color }}>{status.label}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* COLONNE DROITE - CONVERSATION */}
      <div className={`${isMobile && !selectedSessionId ? 'hidden' : 'flex-1'} flex flex-col min-w-0`}>
        {selectedSession ? (
          <>
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
              {isMobile && (
                <button onClick={() => setSelectedSessionId(null)} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)]" style={{ color: 'var(--text-secondary)' }}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="relative">
                <Avatar name={otherUserName} photoUrl={otherUserPhoto} size={40} />
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${otherOnline ? 'animate-pulse' : ''}`} style={{ backgroundColor: otherOnline ? '#10B981' : '#9CA3AF', borderColor: 'var(--card-bg)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{otherUserName || 'Utilisateur'}</h2>
                <p className="text-xs" style={{ color: otherOnline ? '#10B981' : 'var(--text-tertiary)' }}>{otherOnline ? 'En ligne' : 'Hors ligne'}</p>
              </div>
              <div className="flex items-center gap-1">
                {isCallActive && (
                  <span className="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {formatDuration(callDuration)}
                  </span>
                )}
                <button onClick={startCall} disabled={isCallActive} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100" style={{ color: 'var(--accent)' }}><Video className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 relative">
              {chatLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <MessageCircle className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Aucun message</p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Dites bonjour !</p>
                </div>
              ) : (
                rows.map((row) => {
                  if (row.kind === 'date') return (
                    <div key={row.key} className="flex items-center gap-3 my-6">
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                      <span className="text-xs font-medium px-4 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>{row.label}</span>
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                    </div>
                  );
                  const m = row.message;
                  const isOwn = m.expediteur_id === user?.id;
                  const fullUrl = getFullUrl(m.fichier_url || '');
                  const isImg = isImageFile(fullUrl);
                  const isFile = m.type_message === 'fichier' && m.fichier_url;
                  const radius = isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px';

                  return (
                    <motion.div 
                      key={row.key} 
                      initial={{ opacity: 0, y: 8 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className={`flex group ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                      <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {!isOwn && (
                          <div style={{ visibility: row.isLast ? 'visible' : 'hidden' }}>
                            <Avatar name={otherUserName} photoUrl={otherUserPhoto} size={28} />
                          </div>
                        )}
                        <div className="relative px-4 py-2.5 transition-shadow hover:shadow-md" style={{
                          background: isOwn ? 'var(--accent)' : 'var(--card-bg)',
                          color: isOwn ? '#06231D' : 'var(--text-primary)',
                          border: isOwn ? 'none' : '1px solid var(--border)',
                          borderRadius: radius,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}>
                          {isFile ? (
                            <div onClick={() => isImg ? setSelectedImage(fullUrl) : downloadFile(fullUrl, m.contenu)} className="cursor-pointer">
                              {isImg ? (
                                <img src={fullUrl} alt="" className="max-w-[200px] max-h-[180px] rounded-lg object-cover" />
                              ) : (
                                <div className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: isOwn ? 'rgba(6,35,29,0.08)' : 'var(--bg-secondary)' }}>
                                  <File className="w-5 h-5" />
                                  <span className="text-sm truncate">{m.contenu.replace(/[📎📷]/g, '').trim()}</span>
                                  <Download className="w-4 h-4 opacity-50" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm break-words whitespace-pre-wrap">{m.contenu}</p>
                          )}
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] opacity-60">
                              {new Date(m.envoye_le).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (m.lu ? <CheckCheck className="w-3 h-3 opacity-60" /> : <Check className="w-3 h-3 opacity-40" />)}
                          </div>

                          {/* ═══ BOUTON 3 POINTS - SEULEMENT POUR VRAIS MESSAGES ═══ */}
                          {isOwn && !m.tempId && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setMenuOpenFor(menuOpenFor === m.id ? null : m.id); }}
                              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]"
                              style={{ color: 'var(--text-tertiary)' }}
                              title="Plus d'options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          )}

                          {/* ═══ MENU SUPPRESSION ═══ */}
                          {isOwn && !m.tempId && menuOpenFor === m.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 top-full mt-1 rounded-lg shadow-lg overflow-hidden z-30 min-w-[140px]"
                              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteMessage(m.id); }}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm w-full transition-colors hover:bg-[var(--bg-secondary)]"
                                style={{ color: 'var(--danger)' }}
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer le message
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              {otherTyping && (
                <div className="flex items-end gap-2 mt-1">
                  <Avatar name={otherUserName} photoUrl={otherUserPhoto} size={28} />
                  <div className="px-4 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {!isAtBottom && (
              <button onClick={() => scrollToBottom(true)} className="absolute bottom-20 right-4 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg z-10 transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
            )}

            {/* Input */}
            <div className="flex-shrink-0 px-4 py-3 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
              {filePreviews.length > 0 && (
                <div className="mb-3 p-3 rounded-xl flex flex-wrap gap-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  {filePreviews.map((p, i) => (
                    <div key={i} className="relative group">
                      {p.url ? <img src={p.url} className="w-16 h-16 rounded-lg object-cover" /> : (
                        <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-soft)' }}>
                          <File className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                        </div>
                      )}
                      <button onClick={() => removeFile(i)} className="absolute -top-2 -right-2 rounded-full p-1 shadow-md" style={{ backgroundColor: 'var(--danger)', color: '#fff' }}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] hover:scale-105 active:scale-95 transition-all" style={{ color: 'var(--text-secondary)' }} title="Joindre un fichier">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="relative" ref={emojiRef}>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] hover:scale-105 active:scale-95 transition-all" style={{ color: 'var(--text-secondary)' }} title="Emojis">
                    <Smile className="w-5 h-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-50 shadow-xl rounded-2xl overflow-hidden">
                      <EmojiPicker onEmojiClick={(e: any) => { setNewMessage(prev => prev + e.emoji); setShowEmojiPicker(false); }} theme={theme === 'dark' ? 'dark' as any : 'light' as any} />
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.txt" multiple className="hidden" onChange={handleFilesSelect} />
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onKeyUp={handleTyping}
                  placeholder="Écrivez votre message..."
                  rows={1}
                  className="flex-1 resize-none border rounded-2xl px-4 py-2.5 outline-none transition-all focus:ring-2"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)', minHeight: '44px', maxHeight: '120px', ['--tw-ring-color' as any]: 'var(--accent)' }}
                />
                <button onClick={sendAll} disabled={!hasContent}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: hasContent ? 'var(--accent)' : 'var(--bg-secondary)', color: hasContent ? '#06231D' : 'var(--text-tertiary)' }}>
                  {sending || uploading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <MessageCircle className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t('chat.title')}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Sélectionnez une conversation à gauche</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal image */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
            onClick={() => setSelectedImage(null)}>
            <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 text-white hover:opacity-70 transition-opacity">
              <X className="w-8 h-8" />
            </button>
            <img src={selectedImage} alt="Agrandissement" className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visio */}
      {showVideo && (
        <SimpleJitsi roomName={selectedSessionId!} userName={`${user?.prenom} ${user?.nom}`} contactName={otherUserName}
          contactId={otherUserId || undefined} onClose={endCall} />
      )}

      {/* Appel entrant */}
      {incomingCall && (
        <IncomingCallModal callerName={incomingCall.fromName} onAccept={acceptCall} onReject={rejectCall} />
      )}
    </div>
  );
}