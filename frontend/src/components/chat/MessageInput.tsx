'use client';

import { useState, useRef } from 'react';
import { Send, Smile, Paperclip, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

interface MessageInputProps {
  onSendMessage: (message: string, file?: File) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() || selectedFile) {
      onSendMessage(message, selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      setShowEmojiPicker(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiObject: any) => {
    setMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(file.name);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4 relative">
      {/* Aperçu du fichier */}
      {selectedFile && (
        <div className="mb-3 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            {filePreview && filePreview.startsWith('data:image') ? (
              <img src={filePreview} alt="Preview" className="w-10 h-10 rounded object-cover" />
            ) : (
              <Paperclip className="w-5 h-5 text-gray-500" />
            )}
            <span className="text-sm text-gray-600 truncate max-w-[200px]">
              {selectedFile.name}
            </span>
          </div>
          <button onClick={clearFile} className="text-gray-400 hover:text-red-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Zone de texte */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Écrivez votre message..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          
          {/* Boutons d'actions dans la zone de texte */}
          <div className="absolute right-2 bottom-2 flex gap-1">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"
              title="Emojis"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"
              title="Joindre un fichier"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* Bouton envoyer */}
        <button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || disabled}
          className="bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
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
  );
}
