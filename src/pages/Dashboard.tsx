import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, useCouple } from "@/src/App";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Heart, Moon, Star, MessageCircle, Book, Gift, Sparkles, ChevronRight, Clock } from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const { couple, profile, partner } = useCouple();
  const navigate = useNavigate();
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    if (!couple?.weddingDate) return;

    const wedding = new Date(couple.weddingDate);
    
    const interval = setInterval(() => {
      const now = new Date();
      setTimeTogether({
        days: differenceInDays(now, wedding),
        hours: differenceInHours(now, wedding) % 24,
        mins: differenceInMinutes(now, wedding) % 60,
        secs: differenceInSeconds(now, wedding) % 60
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [couple]);

  if (!couple) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-20">
        <GlassCard className="text-center p-12">
          <Heart className="text-gold mx-auto mb-6 animate-pulse" size={48} />
          <h1 className="text-3xl font-serif text-champagne mb-4">Welcome to Our Whisper</h1>
          <p className="mb-8 text-slate-gray leading-relaxed uppercase tracking-widest text-[10px] font-bold">It looks like you aren't part of a couple space yet. Use your spouse's code or create a new one.</p>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-8">
            <p className="text-[10px] uppercase tracking-widest text-gold font-bold mb-2">Your Invite Code</p>
            <p className="text-4xl font-serif tracking-[0.2em] text-champagne">{profile?.userId?.substring(0, 6).toUpperCase() || "UNIVERSE"}</p>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="bg-gold text-midnight px-10 py-4 rounded-full w-full font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-gold/20 hover:scale-105 transition-all"
          >
            Complete Setup
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 pt-12 max-w-4xl pb-40">
      {/* Header Area */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-5">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="w-16 h-16 rounded-full border-2 border-gold p-1 shadow-[0_0_20px_rgba(197,160,89,0.3)] cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            <div className="w-full h-full rounded-full bg-indigo-deep flex items-center justify-center overflow-hidden">
              <img 
                src={profile?.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile?.name}`} 
                alt="You" 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
          <div>
            <h1 className="text-3xl font-serif tracking-wide text-champagne">Our Whisper</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold">Eternal Connection</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
           <div className="flex items-center justify-end gap-2 text-gold mb-1">
             <Clock size={12} />
             <p className="text-[10px] uppercase tracking-wider font-bold">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</p>
           </div>
           <p className="text-champagne font-serif italic text-xl">Salaam, {profile?.name}</p>
        </div>
      </header>

      {/* Main Counter Hero */}
      <section className="flex flex-col items-center justify-center py-16 text-center bg-white/5 backdrop-blur-md rounded-[50px] border border-white/10 shadow-2xl relative overflow-hidden mb-12 group">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-30"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] uppercase tracking-[0.5em] text-gold mb-10 font-bold"
        >
          Sacred Union Since {couple.weddingDate ? new Date(couple.weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "The Beginning"}
        </motion.div>
        
        <div className="flex items-baseline gap-4 md:gap-14 mb-4">
          <CounterUnit value={timeTogether.days} label="Days" />
          <span className="text-5xl font-light text-white/5 select-none">:</span>
          <CounterUnit value={timeTogether.hours} label="Hours" />
          <span className="text-5xl font-light text-white/5 select-none">:</span>
          <CounterUnit value={timeTogether.mins} label="Minutes" />
        </div>

        <div className="mt-16 px-12 max-w-2xl relative">
           <div className="w-12 h-px bg-gold/40 mx-auto mb-10"></div>
           <p className="text-2xl md:text-4xl font-serif italic text-champagne leading-relaxed">
             "And He placed between you affection and mercy."
           </p>
           <p className="text-[10px] uppercase tracking-[0.4em] text-slate-gray mt-8 font-bold opacity-60">Surah Ar-Rum · 30:21</p>
           
           <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
             transition={{ repeat: Infinity, duration: 4 }}
             className="absolute -top-10 -left-10 text-gold/20"
           >
             <Heart size={80} strokeWidth={1} />
           </motion.div>
        </div>
      </section>

      {/* Grid of Content */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-8">
           <GlassCard 
             onClick={() => navigate('/vault')}
             className="flex-1 min-h-[300px] p-10 flex flex-col justify-between group cursor-pointer hover:border-gold/30 transition-all border-white/10"
           >
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold mb-1">Vault</h3>
                <h4 className="text-2xl font-serif text-champagne leading-tight">Daily Secret</h4>
              </div>
              
              <div className="flex flex-col items-center justify-center flex-1 py-4">
                 <motion.div 
                   animate={{ rotateY: [0, 15, 0], rotateZ: [-3, 0, -3] }}
                   transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                   className="w-28 h-40 bg-gradient-to-br from-indigo-deep to-midnight border border-gold/40 rounded-2xl flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative"
                 >
                    <div className="absolute inset-0 bg-gold/5 rounded-2xl animate-pulse"></div>
                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center text-3xl z-10 shadow-inner">🧸</div>
                 </motion.div>
                 <p className="text-[10px] uppercase tracking-widest text-gold mt-10 font-bold">Unlocking Soon</p>
              </div>
           </GlassCard>

           <div 
             onClick={() => navigate('/journey')}
             className="bg-gradient-to-br from-gold to-champagne rounded-[40px] p-8 h-44 flex flex-col justify-between shadow-2xl shadow-gold/20 cursor-pointer hover:scale-[1.02] transition-all group"
           >
              <div className="flex justify-between items-start">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-midnight font-bold">Deen Streak</h3>
                <Moon className="text-midnight/60 group-hover:rotate-12 transition-transform" size={24} />
              </div>
              <div className="flex items-end gap-3">
                <span className="text-6xl font-serif text-midnight leading-none">{couple?.deenStreak || 0}</span>
                <div className="mb-1">
                  <p className="text-[10px] text-midnight font-bold uppercase tracking-wider">Days Together</p>
                  <p className="text-[8px] text-midnight/60 font-bold uppercase tracking-tighter">MashAllah</p>
                </div>
              </div>
           </div>
        </div>

        {/* Right Column Grid */}
        <div className="col-span-12 md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
           <GlassCard 
             onClick={() => navigate('/emotion-guide')}
             className="flex flex-col justify-between p-10 group cursor-pointer hover:border-gold/30 transition-all"
           >
              <div>
                <div className="w-14 h-14 rounded-3xl bg-white/5 flex items-center justify-center text-3xl mb-8 shadow-inner group-hover:bg-gold/10 transition-colors">🕊️</div>
                <h4 className="text-2xl font-serif text-ivory">For your Heart</h4>
                <p className="text-[10px] uppercase tracking-widest text-slate-gray mt-3 font-bold">Guidance from {partner?.name || "your spouse"}</p>
              </div>
              <div className="flex items-center justify-between mt-10">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-champagne">Approach Seal</span>
                <ChevronRight size={18} className="text-gold" />
              </div>
           </GlassCard>

           <GlassCard 
             onClick={() => navigate('/timeline')}
             className="flex flex-col justify-between p-10 group cursor-pointer hover:border-gold/30 transition-all border-white/10"
           >
              <div>
                <div className="w-14 h-14 rounded-3xl bg-white/5 flex items-center justify-center text-3xl mb-8 shadow-inner group-hover:bg-gold/10 transition-colors">🖇️</div>
                <h4 className="text-2xl font-serif text-ivory">Legacy</h4>
                <p className="text-[10px] uppercase tracking-widest text-slate-gray mt-3 font-bold">Anniversary Journey</p>
              </div>
              <div className="space-y-4 mt-10">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }}
                    transition={{ duration: 1.5, delay: 1 }}
                    className="h-full bg-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]" 
                  />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-gold text-right font-bold">65% Progress</p>
              </div>
           </GlassCard>

           <GlassCard 
             onClick={() => navigate('/ruh')}
             className="col-span-1 sm:col-span-2 p-10 flex items-center justify-between group cursor-pointer hover:bg-white/[0.08] transition-all border-gold/10"
           >
              <div className="flex items-center gap-10">
                <div className="relative">
                  <div className="w-24 h-24 rounded-[32px] bg-indigo-deep border border-gold/30 flex items-center justify-center text-4xl shadow-2xl relative z-10 overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-tr from-gold/20 to-transparent"></div>
                     <Sparkles className="text-gold relative animate-pulse" size={40} />
                  </div>
                  <div className="absolute -inset-1 bg-gold/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div>
                   <h4 className="text-3xl font-serif text-ivory">Ask Ruh</h4>
                   <p className="text-sm text-slate-gray mt-2 italic font-serif opacity-80">"How is your heart feeling today?"</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-full border border-gold/40 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-midnight transition-all shadow-lg group-hover:shadow-gold/40">
                    <ChevronRight size={24} />
                 </div>
              </div>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}

function CounterUnit({ value, label }: { value: number, label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-7xl md:text-9xl font-serif text-ivory tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
        {value.toLocaleString()}
      </span>
      <span className="text-[10px] uppercase tracking-[0.3em] text-gold mt-4 font-bold">{label}</span>
    </div>
  );
}

function ArabicText({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("arabic-text text-center", className)}>
      {children}
    </div>
  );
}
