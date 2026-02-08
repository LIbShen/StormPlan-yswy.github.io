import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS } from '../constants';
import { ChatMessage } from '../types';
import { createChatSession, ChatSession } from '../services/geminiService';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';

interface AIProps {
  lang: 'zh' | 'en';
}

export const AI: React.FC<AIProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'model',
      text: '你好，我是小诗。想学哪首诗？我们也可以玩成语接龙。',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSession = useRef<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatSession.current) {
        chatSession.current = createChatSession();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatSession.current.sendMessage({ message: userMsg.text });
      const text = response.text || "小诗有点累了，休息一下再试吧 😴";
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : '';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `小诗暂时连不上模型接口。${detail ? `（${detail}）` : ''}\n请到“设置 → 小诗AI”填写 API Key；若已填写，再检查 API 地址和模型名称。`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto h-[calc(100dvh-10rem)] md:h-[calc(100dvh-6rem)]">
      <div className="bg-white rounded-t-2xl p-4 border-b border-gray-100 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-pink-400 flex items-center justify-center text-white">
            <Bot size={24} />
        </div>
        <div>
            <h2 className="font-bold text-gray-800 text-lg">小诗 AI 助手</h2>
            <p className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 在线
            </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white ${msg.role === 'user' ? 'bg-secondary' : 'bg-pink-400'}`}>
                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            
            <div 
                className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-secondary text-white rounded-br-none' 
                    : 'bg-white text-gray-700 rounded-bl-none border border-gray-100'
                }`}
            >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-end gap-2">
                 <div className="w-8 h-8 rounded-full bg-pink-400 flex items-center justify-center text-white">
                    <Bot size={16} />
                 </div>
                 <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></span>
                    </div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-4 rounded-b-2xl border-t border-gray-100 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="flex gap-2 relative">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.send_message}
                disabled={isLoading}
                className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all outline-none"
            />
            <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-primary text-white p-3 rounded-xl hover:bg-pink-600 disabled:opacity-50 disabled:hover:bg-primary transition-colors shadow-lg shadow-primary/30"
            >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
        </div>
      </div>
    </div>
  );
};
