'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Download, File, X, Paperclip, Send, Smile } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionAPI } from '@/services/api';
import { uploadFile } from '@/services/uploadService';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

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
  const sessionId = params.id as string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BACKEND_URL = 'http://localhost:5000';

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    initSocket();
    return () => { if (socket) socket.disconnect(); };
  }, [user, router, sessionId]);

  const initSocket = () => {
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Socket connecté');
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
    
    newSocket.on('error', (error) => {
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

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const isImageFile = (url: string) => {
    return url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasContent = newMessage.trim() !== '' || selectedFiles.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/chat" className="hover:text-indigo-200 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold">Chat</h1>
              <p className="text-sm text-indigo-200">Session de mentorat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 overflow-y-auto">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              💬 Aucun message. Commencez la conversation !
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.expediteur_id === user?.id;
              const fullUrl = getFullUrl(message.fichier_url || '');
              const isImage = isImageFile(fullUrl);
              const isFile = message.type_message === 'fichier' && message.fichier_url;
              
              return (
                <div key={message.id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 shadow-md'
                  }`}>
                    {!isOwn && (
                      <p className="text-xs text-indigo-500 mb-1 font-medium">
                        {message.prenom} {message.nom}
                      </p>
                    )}
                    
                    {isFile ? (
                      <div 
                        onClick={() => handleFileClick(fullUrl, message.contenu, isImage)}
                        className="cursor-pointer"
                      >
                        {isImage ? (
                          <img 
                            src={fullUrl} 
                            alt={message.contenu}
                            className="max-w-[200px] max-h-[150px] rounded-lg object-cover hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div className="flex items-center gap-2 hover:underline p-2 bg-gray-100 rounded-lg">
                            <File className="w-5 h-5 text-indigo-600" />
                            <span className="text-sm break-words">{message.contenu}</span>
                            <Download className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm break-words whitespace-pre-wrap">{message.contenu}</p>
                    )}
                    
                    <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {new Date(message.envoye_le).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          
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
          
          {(sending || uploading) && (
            <div className="flex justify-end">
              <div className="bg-gray-200 rounded-2xl px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-500">Envoi...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Modal image en grand */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={selectedImage} 
              alt="Agrandissement" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(selectedImage, 'image');
              }}
              className="absolute -bottom-10 right-0 bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
          </div>
        </div>
      )}

      {/* Zone de saisie */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3">
          
          {/* Aperçu des fichiers sélectionnés */}
          {filePreviews.length > 0 && (
            <div className="mb-3 p-3 bg-gray-100 rounded-xl">
              <div className="flex flex-wrap gap-2">
                {filePreviews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    {preview.url ? (
                      <img src={preview.url} alt={preview.name} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <File className="w-8 h-8 text-indigo-600" />
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate w-16">{preview.name.substring(0, 10)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input principal */}
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Joindre des fichiers"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Emojis"
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
              placeholder="Écrivez votre message..."
              disabled={sending || uploading}
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            
            <button
              onClick={sendAll}
              disabled={!hasContent || sending || uploading}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending || uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Envoyer</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          
          {/* Picker emoji */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 right-4 z-50">
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 z-10"
                >
                  <X className="w-3 h-3" />
                </button>
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            </div>
          )}
        
        </div>
      </div>
    </div>
  );
}