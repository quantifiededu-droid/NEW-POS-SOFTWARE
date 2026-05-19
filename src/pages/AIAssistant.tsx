import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { db } from '../lib/db';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I am CLEMTRIX AI. I can help you analyze your business data. Ask me things like 'What are my top selling products?' or 'Show me my low stock items'.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const products = await db.products.toArray();
      const sales = await db.sales.orderBy('created_at').reverse().limit(20).toArray();
      
      const context = {
        products: products.map(p => ({ 
          name: p.name, 
          price: p.price, 
          stock: p.stock_quantity, 
          min_stock: p.min_stock_level 
        })),
        recent_sales: sales.map(s => ({ 
          total: s.total_amount, 
          method: s.payment_method, 
          date: s.created_at 
        }))
      };

      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, context })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || "I'm sorry, I couldn't process that request at the moment.",
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error connecting to my servers. Please check your internet connection.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-brand-ink">Business Assistant</h1>
          <p className="text-xs font-bold text-brand-slate uppercase tracking-wider">AI Insights & Predictions</p>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-blue-50/50 border border-blue-100 rounded-2xl mb-8 p-8 overflow-y-auto space-y-4"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex max-w-[85%]",
                m.role === 'user' ? "ml-auto" : ""
              )}
            >
              <div className={cn(
                "p-4 border text-[13px] leading-relaxed shadow-sm",
                m.role === 'assistant' 
                  ? "bg-white text-brand-ink rounded-xl rounded-tl-none border-blue-100" 
                  : "bg-blue-100 text-blue-900 rounded-xl rounded-tr-none border-transparent"
              )}>
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }}
               className="flex gap-2 items-center text-blue-400 pl-2"
            >
               <Loader2 className="w-4 h-4 animate-spin" />
               <span className="text-xs font-bold uppercase tracking-widest">CLEMTRIX is calculating...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex bg-white border border-brand-line rounded-xl p-2 shadow-sm focus-within:border-blue-300 transition-all">
        <input 
          type="text" 
          placeholder="Ask CLEMTRIX AI about your business..." 
          className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 font-medium text-sm text-brand-ink"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="bg-brand-primary text-white p-3 rounded-lg shadow-sm hover:bg-blue-600 transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
