'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Download, File, X, Paperclip, Send, Smile, Video,
  Trash2, MoreVertical
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { sessionAPI, messageAPI } from '@/services/api';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callStartTimeRef = useRef<number | null>(null);

  const BACKEND_URL = 'http://localhost:5000';
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';

  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        const response = await sessionAPI.getById(sessionId);
        const session = response.data.session;

        if (user?.role === 'mentor') {
          setOtherUserId(session.mentore_user_id);
          setOtherUserName(`${session.mentore_prenom} ${session.mentore_nom}`);
        } else {
          setOtherUserId(session.mentor_user_id);
          setOtherUserName(`${session.mentor_prenom} ${session.mentor_nom}`);
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

  const initSocket = () => {
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:5000', {
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
        setTimeout(() => scrollToBottom(), 100);
      }
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      setTimeout(() => scrollToBottom(), 100);
    });

    newSocket.on('user_typing', (data) => {
      setOtherTyping(data.is_typing);
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

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
    if (url.startsWith('http')) return url;
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
      toast.error('Impossible de trouver l\'autre participant');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const hasContent = newMessage.trim() !== '' || selectedFiles.length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.fromName}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/chat" className="transition-colors" style={{ color: 'var(--text-secondary)' }}>
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('chat.title')}</h1>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('chat.session')}</p>
              </div>
            </div>

            <button
              onClick={startCall}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--success)', color: '#fff' }}
              title={t('chat.video_call')}
            >
              <Video className="w-5 h-5" />
              <span className="text-sm font-medium">{t('chat.video_call')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 overflow-y-auto">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
              💬 {t('chat.no_messages')}
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.expediteur_id === user?.id;
              const fullUrl = getFullUrl(message.fichier_url || '');
              const isImage = isImageFile(fullUrl);
              const isFile = message.type_message === 'fichier' && message.fichier_url;

              return (
                <div key={message.id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative`}>
                  <div
                    className="max-w-[70%] rounded-2xl px-4 py-2"
                    style={
                      isOwn
                        ? { backgroundColor: 'var(--accent)', color: '#06231D' }
                        : { backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                    }
                  >
                    {!isOwn && (
                      <p className="text-xs mb-1 font-medium" style={{ color: 'var(--accent)' }}>
                        {message.prenom} {message.nom}
                      </p>
                    )}

                    {isFile ? (
                      <div onClick={() => handleFileClick(fullUrl, message.contenu, isImage)} className="cursor-pointer">
                        {isImage ? (
                          <img
                            src={fullUrl}
                            alt={message.contenu}
                            className="max-w-[200px] max-h-[150px] rounded-lg object-cover hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div
                            className="flex items-center gap-2 hover:underline p-2 rounded-lg"
                            style={{ backgroundColor: isOwn ? 'rgba(0,0,0,0.08)' : 'var(--bg-secondary)' }}
                          >
                            <File className="w-5 h-5" style={{ color: isOwn ? '#06231D' : 'var(--accent)' }} />
                            <span className="text-sm break-words">{message.contenu}</span>
                            <Download className="w-4 h-4 opacity-60" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm break-words whitespace-pre-wrap">{message.contenu}</p>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="font-mono-data text-xs" style={{ opacity: 0.7 }}>
                        {new Date(message.envoye_le).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {isOwn && (
                        <button
                          onClick={() => setMenuOpenFor(menuOpenFor === message.id ? null : message.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-3 h-3" style={{ opacity: 0.6 }} />
                        </button>
                      )}
                    </div>

                    {isOwn && menuOpenFor === message.id && (
                      <div
                        className="absolute right-0 mt-1 rounded-lg shadow-lg overflow-hidden z-10"
                        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
                      >
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm w-full transition-colors"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('chat.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {otherTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {(sending || uploading) && (
            <div className="flex justify-end">
              <div className="rounded-2xl px-4 py-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('chat.sending')}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Modal image */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button onClick={() => setSelectedImage(null)} className="absolute -top-10 right-0 text-white hover:opacity-70">
              <X className="w-8 h-8" />
            </button>
            <img src={selectedImage} alt="Agrandissement" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            <button
              onClick={(e) => { e.stopPropagation(); downloadFile(selectedImage, 'image'); }}
              className="absolute -bottom-10 right-0 px-4 py-2 rounded-lg flex items-center gap-2"
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
      <div className="sticky bottom-0" style={{ backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3">

          {filePreviews.length > 0 && (
            <div className="mb-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
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
                      className="absolute -top-2 -right-2 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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

          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading}
              className="p-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ color: 'var(--text-secondary)' }}
              title={t('chat.attach_file')}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title={t('chat.emoji')}
            >
              <Smile className="w-5 h-5" />
            </button>

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
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              onKeyUp={handleTyping}
              placeholder={t('chat.message_placeholder')}
              disabled={sending || uploading}
              rows={1}
              className="flex-1 resize-none border rounded-lg px-4 py-2 outline-none transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />

            <button
              onClick={sendAll}
              disabled={!hasContent || sending || uploading}
              className="px-5 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: 'var(--accent)', color: '#06231D' }}
            >
              {sending || uploading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="font-medium">{t('chat.send')}</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-20 right-4 z-50">
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="absolute -top-2 -right-2 rounded-full p-1 z-10"
                  style={{ backgroundColor: 'var(--text-primary)', color: 'var(--card-bg)' }}
                >
                  <X className="w-3 h-3" />
                </button>
                <EmojiPicker onEmojiClick={handleEmojiClick} theme={theme === 'dark' ? ('dark' as any) : ('light' as any)} />
              </div>
            </div>
          )}

          <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-tertiary)' }}>
            {t('chat.hint')}
          </p>
        </div>
      </div>

      {!showVideo && (
        <div className="max-w-5xl mx-auto px-4 pb-4">
          <CallHistory onCallBack={handleCallBack} />
        </div>
      )}
    </div>
  );
}