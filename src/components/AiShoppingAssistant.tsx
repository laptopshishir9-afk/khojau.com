import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, ArrowRight, CornerDownLeft, ShieldCheck, Tag } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import * as api from '../services/api.ts';
import type { Product } from '../types/index.ts';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  recommendedProducts?: Product[];
  timestamp: string;
}

export const AiShoppingAssistant: React.FC = () => {
  const {
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    aiInitialPrompt,
    settings,
    products,
    openProductDetail,
    selectedProduct
  } = useStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const assistantName = settings?.aiSettings?.assistantName || 'Liyau Thinker';

  // Initialize with greeting
  useEffect(() => {
    const defaultGreeting =
      settings?.aiSettings?.greetingMessage ||
      settings?.aiSettings?.welcomeMessage ||
      'Namaste! 🙏 I am Liyau Thinker, your official AI shopping assistant for Liyau (लियौँ) in Butwal, Nepal. Ask me about our live products, prices, QR payment, or delivery across Nepal!';

    if (messages.length === 0) {
      setMessages([
        {
          id: 'msg-welcome',
          sender: 'ai',
          text: defaultGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [settings, messages.length]);

  // Handle incoming initial prompt
  useEffect(() => {
    if (isAiAssistantOpen && aiInitialPrompt) {
      handleSendMessage(aiInitialPrompt);
    }
  }, [isAiAssistantOpen, aiInitialPrompt]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await api.sendAiChatMessage({
        message: query,
        history: historyPayload,
        currentProductId: selectedProduct?.id
      });

      // Find matching product objects
      const matchingProds = (res.recommendedProductIds || [])
        .map(id => products.find(p => p.id === id))
        .filter((p): p is Product => !!p);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        recommendedProducts: matchingProds,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Namaste! 🙏 I am experiencing a brief connection hiccup. Liyau (लियौँ) is based in Butwal, Nepal and you can explore our catalog or contact our Butwal team directly.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const samplePrompts = settings?.aiSettings?.suggestedQuestions?.length
    ? settings.aiSettings.suggestedQuestions
    : [
        'Where is Liyau located in Nepal?',
        'How does QR payment work on Liyau?',
        'What are the delivery charges from Butwal?',
        'Who is the founder of Liyau?'
      ];

  if (settings?.aiSettings?.enabled === false) return null;

  return (
    <>
      {/* Floating Trigger Button (Positioned safely above bottom nav/cart on mobile) */}
      {!isAiAssistantOpen && (
        <button
          onClick={() => setIsAiAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-red-600 hover:bg-red-700 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group active:scale-95"
          aria-label="Open Liyau Thinker AI Shopping Assistant"
        >
          <Sparkles className="w-5 h-5 text-red-200 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold pr-1 hidden sm:inline">{assistantName}</span>
        </button>
      )}

      {/* Slide-out / Modal Chat Window */}
      {isAiAssistantOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px] max-h-[85vh] animate-fadeIn">
          
          {/* Header */}
          <div className="p-3.5 bg-zinc-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold font-heading">{assistantName}</h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[10px] text-zinc-400">Grounded on Liyau (लियौँ) Store Catalog</p>
              </div>
            </div>

            <button
              onClick={() => setIsAiAssistantOpen(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-zinc-50">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-red-600 text-white rounded-br-xs'
                      : 'bg-white text-zinc-800 border border-zinc-200/80 shadow-2xs rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Clickable Product Recommendations Cards inside AI response */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-100 space-y-1.5">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Mentioned in Stock:
                      </p>
                      {msg.recommendedProducts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => openProductDetail(p)}
                          className="flex items-center justify-between p-1.5 bg-zinc-50 hover:bg-red-50 border border-zinc-200 hover:border-red-300 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img
                              src={p.images?.[0] || ''}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded object-cover shrink-0"
                            />
                            <div className="truncate text-left">
                              <p className="font-semibold text-zinc-900 truncate text-[11px]">{p.name}</p>
                              <p className="text-[10px] text-red-600 font-bold tabular-nums">
                                Rs. {(p.discountPrice || p.price).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-zinc-400 px-1 mt-0.5">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs pl-1">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[11px] ml-1">{assistantName} is searching inventory...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-white border-t border-zinc-200 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
            {samplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-full whitespace-nowrap transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about Butwal location, QR payment, or products..."
              className="flex-1 text-xs p-2 bg-zinc-100 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600 placeholder:text-zinc-400"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-300 text-white rounded-lg transition-colors"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
};
