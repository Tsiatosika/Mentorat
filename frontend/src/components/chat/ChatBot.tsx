'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { api } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: '👋 Bonjour ! Je suis l\'assistant MentorIPath. Posez-moi vos questions sur la plateforme !' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/ask', { message: userMessage });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Désolé, une erreur est survenue.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "C'est quoi MentorIPath ?",
    "Comment trouver un mentor ?",
    "Comment fonctionne le matching IA ?",
    "Qui a créé ce projet ?"
  ];

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Fenêtre chatbot */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[90vw] rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, var(--accent), #8B5CF6)' }}>
              <Bot size={24} className="text-white" />
              <div>
                <h3 className="font-semibold text-white">Assistant MentorIPath</h3>
                <p className="text-xs text-white/70">Propulsé par Gemini AI</p>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[350px] overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                      {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions (si peu de messages) */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); sendMessage(); }}
                    className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Votre question..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <button onClick={sendMessage} disabled={loading || !input.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                  style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}