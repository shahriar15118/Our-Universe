import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Send, User, Sparkles, X, ChevronDown } from "lucide-react";
import { useCouple } from "@/src/App";
import { cn } from "@/src/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ruh";
  timestamp: Date;
}

export default function RuhChat() {
  const { couple, profile } = useCouple();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Assalamu Alaikum. I am Ruh, your spiritual and emotional companion. How can I serve your hearts today?",
      sender: "ruh",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/ruh/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          coupleContext: {
            husbandName: profile?.role === 'husband' ? profile.name : 'Unknown',
            wifeName: profile?.role === 'wife' ? profile.name : 'Unknown',
            weddingDate: couple?.weddingDate
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const ruhMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.text || "I apologize, my soul is resting. Please try again later.",
        sender: "ruh",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, ruhMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const ruhErrorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I couldn't establish an AI connection to my soul core. If you are running the app on a static hosting platform (like Vercel), server-side APIs (relying on Node.js/Express) are not available of because Vercel doesn't run the custom backend server. Please run the app on Google AI Studio's Cloud Run environment to enjoy the full AI-powered chat companion!",
        sender: "ruh",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, ruhErrorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-12 h-screen max-w-2xl flex flex-col">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-rose-gold/20 p-2 rounded-full">
            <Sparkles className="text-rose-gold" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-serif">Ruh</h1>
            <p className="text-[10px] uppercase tracking-widest text-ivory/40">Wise Companion</p>
          </div>
        </div>
        <div className="flex -space-x-2">
          {/* Couple avatars mini */}
        </div>
      </header>

      <GlassCard className="flex-1 mb-6 flex flex-col p-0 overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex flex-col max-w-[80%]",
                msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                msg.sender === 'user' 
                  ? "bg-rose-gold text-white rounded-tr-none" 
                  : "bg-white/5 border border-white/10 text-ivory/90 rounded-tl-none font-serif text-base"
              )}>
                {msg.text}
              </div>
              <span className="text-[8px] mt-1 opacity-30 uppercase">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
              <div className="w-2 h-2 bg-rose-gold/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-rose-gold/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-rose-gold/40 rounded-full animate-bounce" />
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Whisper to Ruh..."
            className="flex-1 bg-midnight/50 border border-white/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-gold/50"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 rounded-full bg-rose-gold text-white flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105"
          >
            <Send size={18} />
          </button>
        </form>
      </GlassCard>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {[
          "Suggest a romantic gesture",
          "Give us an Islamic reminder",
          "Write a love poem for my spouse",
          "What's our wedding date?",
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInput(suggestion)}
            className="whitespace-nowrap bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[10px] uppercase font-bold tracking-wider hover:bg-white/10 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
