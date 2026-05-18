import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, useCouple } from "@/src/App";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Heart, Moon, Star, MessageCircle, Book, Gift as GiftIcon, Sparkles, ChevronRight, Clock, X, Send, Lock, Unlock, Gift } from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { db } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, limit, orderBy } from "firebase/firestore";
import { DailySecret, Mood } from "@/src/types";
import { emotions } from "./EmotionGuide";

const SURPRISES = [
  { type: 'letter', title: "A Sacred Note", content: "My love for you grows with every prayer I make. In you, I found my peace.", icon: "✉️" },
  { type: 'gift', title: "Eternal Bloom", content: "A virtual rose for the most beautiful blossom in my life. You make everything beautiful.", icon: "🌹" },
  { type: 'food', title: "Sweetness", content: "Something sweet for my sweetest one. May our life together always be flavorful.", icon: "🍫" },
  { type: 'spiritual', title: "Divine Bond", content: "May Allah always keep our hearts united in His love and guidance. Ameen.", icon: "✨" },
  { type: 'affection', title: "Warmth", content: "Sending you a mountain of warmth and peace today. You are my home.", icon: "🧸" },
  { type: 'flower', title: "Garden of Joy", content: "Virtual flowers to brighten your day. Like these, your presence brings color to my world.", icon: "🌸" },
  { type: 'letter', title: "Predestined", content: "You are the answer to every dua I never knew I needed. Writing our story together is my greatest joy.", icon: "✉️" },
  { type: 'letter', title: "Written in Stars", content: "Our journey is a beautiful manuscript being written by the Best of Creators. I'm honored to be your partner.", icon: "📜" },
  { type: 'gift', title: "Bouquet of Peace", content: "A bouquet of virtual joy for you. May your heart be as light as a petal today.", icon: "💐" },
];

const getDailySurprise = (dateStr: string) => {
  const seed = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return SURPRISES[seed % SURPRISES.length];
};

export default function Dashboard() {
  const { user } = useAuth();
  const { couple, profile, partner } = useCouple();
  const navigate = useNavigate();
  const location = useLocation();
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [dailySecret, setDailySecret] = useState<DailySecret | null>(null);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSurpriseModal, setShowSurpriseModal] = useState(false);
  const [partnerMood, setPartnerMood] = useState<Mood | null>(null);
  const [memoryCount, setMemoryCount] = useState(0);

  const today = new Date().toISOString().split('T')[0];
  const surprise = getDailySurprise(today);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'secret') {
      setShowSecretModal(true);
    }
  }, [location]);

  useEffect(() => {
    if (!couple?.id) return;

    // Fetch memory count for legacy section
    const q = query(
      collection(db, "memories"),
      where("coupleId", "==", couple.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMemoryCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [couple?.id]);

  useEffect(() => {
    if (!couple?.id || !partner?.userId) return;

    // Fetch partner's latest mood for today
    const q = query(
      collection(db, "couples", couple.id, "moods"),
      where("userId", "==", partner.userId),
      where("date", "==", today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Sort client-side to find the latest
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mood));
        const latest = data.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)[0];
        setPartnerMood(latest);
      } else {
        setPartnerMood(null);
      }
    }, (error) => {
      console.error("Partner Mood Snapshot Error:", error);
    });

    return () => unsubscribe();
  }, [couple?.id, partner?.userId, today]);

  useEffect(() => {
    if (!couple?.id) return;

    // Fetch secret for today
    const q = query(
      collection(db, "couples", couple.id, "secrets"),
      where("date", "==", today),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setDailySecret({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as DailySecret);
      } else {
        setDailySecret(null);
      }
    }, (error) => {
      console.error("Daily Secret Snapshot Error:", error);
    });

    return () => unsubscribe();
  }, [couple?.id, today]);

  const handleShareSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim() || !couple?.id || !user?.uid) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "couples", couple.id, "secrets"), {
        coupleId: couple.id,
        authorId: user.uid,
        text: secretInput.trim(),
        date: today,
        isRevealed: false,
        createdAt: serverTimestamp()
      });
      setSecretInput("");
      setShowSecretModal(false);
    } catch (error) {
      console.error("Error sharing secret:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const getAnniversaryProgress = () => {
    if (!couple?.weddingDate) return 0;
    const wedding = new Date(couple.weddingDate);
    const now = new Date();
    
    let lastAnniversary = new Date(wedding);
    while (true) {
      const nextCandidate = new Date(lastAnniversary);
      nextCandidate.setFullYear(nextCandidate.getFullYear() + 1);
      if (nextCandidate > now) break;
      lastAnniversary = nextCandidate;
    }
    
    const nextAnniversary = new Date(lastAnniversary);
    nextAnniversary.setFullYear(nextAnniversary.getFullYear() + 1);
    
    const totalDays = differenceInDays(nextAnniversary, lastAnniversary);
    const daysPassed = differenceInDays(now, lastAnniversary);
    
    return Math.min(100, Math.max(0.1, (daysPassed / totalDays) * 100));
  };

  const anniProgress = getAnniversaryProgress();

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
        
        <div className="flex items-baseline gap-2 md:gap-8 mb-4 flex-wrap justify-center">
          <CounterUnit value={timeTogether.days} label="Days" />
          <span className="text-3xl md:text-5xl font-light text-white/5 select-none self-center">:</span>
          <CounterUnit value={timeTogether.hours} label="Hours" />
          <span className="text-3xl md:text-5xl font-light text-white/5 select-none self-center">:</span>
          <CounterUnit value={timeTogether.mins} label="Minutes" />
          <span className="text-3xl md:text-5xl font-light text-white/5 select-none self-center">:</span>
          <CounterUnit value={timeTogether.secs} label="Seconds" />
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
             onClick={() => setShowSecretModal(true)}
             className="flex-1 min-h-[300px] p-10 flex flex-col justify-between group cursor-pointer hover:border-gold/30 transition-all border-white/10"
           >
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold mb-1">Vault</h3>
                <h4 className="text-2xl font-serif text-champagne leading-tight">Daily Secret</h4>
              </div>
              
              <div className="flex flex-col items-center justify-center flex-1 py-4">
                 <motion.div 
                   animate={dailySecret ? { rotateY: [0, 5, 0] } : { rotateY: [0, 15, 0], rotateZ: [-3, 0, -3] }}
                   transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                   className={cn(
                     "w-28 h-40 bg-gradient-to-br border rounded-2xl flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative transition-all duration-700",
                     dailySecret ? "from-gold/20 to-champagne/10 border-gold/40" : "from-indigo-deep to-midnight border-white/10"
                   )}
                 >
                    <div className="absolute inset-0 bg-gold/5 rounded-2xl animate-pulse"></div>
                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center text-3xl z-10 shadow-inner">
                      {dailySecret ? (dailySecret.authorId === user?.uid ? "🤫" : "🎁") : "🧸"}
                    </div>
                 </motion.div>
                 <p className="text-[10px] uppercase tracking-widest text-gold mt-10 font-bold">
                   {dailySecret 
                     ? (dailySecret.authorId === user?.uid ? "Your Secret Shared" : "A Secret Awaits") 
                     : "Unlocking Soon"}
                 </p>
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

           <GlassCard 
              onClick={() => setShowSurpriseModal(true)}
              className="p-8 h-44 flex flex-col justify-between group cursor-pointer hover:border-gold/30 transition-all border-white/10 overflow-hidden relative"
            >
               <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <GiftIcon size={120} className="text-gold" />
               </div>
               <div>
                 <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold mb-1">Gift</h3>
                 <h4 className="text-2xl font-serif text-ivory">Daily Surprise</h4>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-gold/10 flex items-center justify-center text-xl">
                   {surprise.icon}
                 </div>
                 <p className="text-[10px] uppercase tracking-widest text-gold font-bold">Open Daily Gift</p>
               </div>
            </GlassCard>
        </div>

        {/* Right Column Grid */}
        <div className="col-span-12 md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
           <GlassCard 
             onClick={() => navigate('/emotion-guide')}
             className={cn(
               "flex flex-col justify-between p-10 group cursor-pointer hover:border-gold/30 transition-all",
               partnerMood && "border-gold/30 bg-gold/5"
             )}
           >
              <div>
                <div className={cn(
                  "w-14 h-14 rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-inner transition-colors",
                  partnerMood ? "bg-gold/20" : "bg-white/5 group-hover:bg-gold/10"
                )}>
                  {partnerMood ? (
                    emotions.find(e => e.id === partnerMood.emotionId)?.icon ? (
                      React.createElement(emotions.find(e => e.id === partnerMood.emotionId)!.icon, { size: 30, className: "text-gold" })
                    ) : "🕊️"
                  ) : "🕊️"}
                </div>
                <h4 className="text-2xl font-serif text-ivory">For your Heart</h4>
                <p className="text-[10px] uppercase tracking-widest text-slate-gray mt-3 font-bold">
                  {partnerMood ? `${partner?.name} is feeling ${partnerMood.emotionId}` : `Guidance from ${partner?.name || "your spouse"}`}
                </p>
              </div>
              <div className="flex items-center justify-between mt-10">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-champagne">
                  {partnerMood ? "Open Healing" : "Approach Seal"}
                </span>
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
                <p className="text-[10px] uppercase tracking-widest text-slate-gray mt-3 font-bold">{memoryCount} Sacred Milestones</p>
              </div>
              <div className="space-y-4 mt-10">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${anniProgress}%` }}
                    transition={{ duration: 1.5, delay: 1 }}
                    className="h-full bg-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]" 
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[8px] uppercase tracking-widest text-slate-gray font-bold italic">Anniversary Journey</p>
                  <p className="text-[10px] uppercase tracking-widest text-gold font-bold">{Math.round(anniProgress)}% Completion</p>
                </div>
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

      {/* Daily Secret Modal */}
      <AnimatePresence>
        {showSecretModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-midnight/90 backdrop-blur-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg"
            >
              <GlassCard className="p-8 border-gold/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
                
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                      <Lock size={20} />
                    </div>
                    <h2 className="text-2xl font-serif text-ivory">Today's Whisper</h2>
                  </div>
                  <button onClick={() => setShowSecretModal(false)} className="text-slate-gray hover:text-ivory p-2 hover:bg-white/5 rounded-full transition-all">
                    <X size={24} />
                  </button>
                </div>

                {!dailySecret ? (
                  <form onSubmit={handleShareSecret} className="space-y-6">
                    <p className="text-sm text-ivory/60 italic font-serif leading-relaxed">
                      "Every secret between us is a seed of trust. Share a whisper for your partner to find today."
                    </p>
                    
                    <div className="relative">
                      <textarea 
                        required
                        rows={4}
                        value={secretInput}
                        onChange={(e) => setSecretInput(e.target.value)}
                        placeholder="Type your secret whisper here..."
                        className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-ivory outline-none focus:ring-2 focus:ring-gold/30 resize-none font-serif text-lg italic placeholder:text-ivory/20"
                      />
                      <Sparkles className="absolute bottom-4 right-4 text-gold/20" size={24} />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting || !secretInput.trim()}
                      className="w-full py-5 bg-gold text-midnight rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_10px_30px_rgba(197,160,89,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? "Sealing..." : "Seal our Secret"}
                      <Send size={14} />
                    </button>
                  </form>
                ) : (
                  <div className="space-y-8 py-4">
                    {dailySecret.authorId === user?.uid ? (
                      <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                          <Lock className="text-gold" size={32} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gold font-bold mb-4">Your Whisper for {partner?.name || "Spouse"}</p>
                          <p className="text-2xl font-serif italic text-champagne bg-white/5 p-8 rounded-[40px] border border-white/10">
                            "{dailySecret.text}"
                          </p>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-gray font-bold">They will discover this soon.</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(197,160,89,0.3)] animate-pulse">
                          <Unlock className="text-gold" size={32} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gold font-bold mb-4">A Gift from {partner?.name || "Spouse"}</p>
                          <p className="text-2xl font-serif italic text-champagne bg-white/10 p-8 rounded-[40px] border border-gold/30 shadow-2xl">
                            "{dailySecret.text}"
                          </p>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-gray font-bold italic">A piece of their heart, given to you.</p>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setShowSecretModal(false)}
                      className="w-full py-5 border border-white/10 text-ivory rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white/5 transition-all"
                    >
                      Close Vault
                    </button>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Daily Surprise Modal */}
      <AnimatePresence>
        {showSurpriseModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-midnight/90 backdrop-blur-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md"
            >
              <GlassCard className="p-10 border-gold/30 relative text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
                
                <div className="mb-10 relative">
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="w-32 h-32 bg-gold/20 rounded-[40px] flex items-center justify-center text-6xl mx-auto shadow-[0_0_50px_rgba(197,160,89,0.2)]"
                  >
                    {surprise.icon}
                  </motion.div>
                  <Sparkles size={24} className="text-gold absolute -top-4 -right-4 animate-pulse" />
                  <Sparkles size={16} className="text-gold absolute -bottom-2 -left-4 animate-pulse" />
                </div>

                <div className="space-y-6 mb-10">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold mb-2">Today's Surprise</p>
                    <h2 className="text-3xl font-serif text-ivory tracking-wide">{surprise.title}</h2>
                  </div>
                  <div className="w-12 h-px bg-gold/30 mx-auto"></div>
                  <p className="text-xl font-serif italic text-champagne leading-relaxed">
                    "{surprise.content}"
                  </p>
                </div>

                <button 
                  onClick={() => setShowSurpriseModal(false)}
                  className="w-full py-5 bg-gold text-midnight rounded-[24px] font-black uppercase tracking-[0.3em] text-[10px] shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Alhamdulillah
                </button>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CounterUnit({ value, label }: { value: number, label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-5xl md:text-8xl font-serif text-ivory tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
        {value.toLocaleString()}
      </span>
      <span className="text-[10px] uppercase tracking-[0.3em] text-gold mt-2 font-bold">{label}</span>
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
