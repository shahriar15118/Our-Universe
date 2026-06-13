import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, useCouple } from "@/src/App";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Heart, Moon, Star, MessageCircle, Book, Gift as GiftIcon, Sparkles, ChevronRight, Clock, X, Send, Lock, Unlock, Gift, Copy } from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, format } from "date-fns";
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
  const { couple, profile, partner, loading: coupleLoading } = useCouple();
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [dailySecret, setDailySecret] = useState<DailySecret | null>(null);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSurpriseModal, setShowSurpriseModal] = useState(false);
  const [partnerMood, setPartnerMood] = useState<Mood | null>(null);
  const [showSharedVerseModal, setShowSharedVerseModal] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);

  const getSimulatedHijriDeed = () => {
    const now = new Date();
    const baseDate = new Date("2026-05-17T00:00:00");
    const date1 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const date2 = Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    const diffDays = Math.floor((date1 - date2) / (1000 * 60 * 60 * 24));

    let hijriDay = 1 + diffDays;
    let hijriMonth = "Dhul-Hijjah (জিলহজ)";
    let year = 1447;
    let specialDeedTitle = "General Deed";
    let specialDeedText = "";
    let specialDeedBangla = "";
    let checklist: { bn: string; en: string }[] = [];

    if (hijriDay <= 0) {
      hijriDay = 30 + hijriDay;
      hijriMonth = "Dhul-Qi'dah (জিলকদ)";
      specialDeedTitle = "Daa'wah & Kindness (দাওয়াহ ও ইহসান)";
      specialDeedText = "Keep your relationships pure. Exchange a warm compliment with your spouse today to spread happiness!";
      specialDeedBangla = "আপনার দাম্পত্য জীবনকে আরও মধুর করে তুলুন। আজ আপনার জীবনসঙ্গীকে একটি সুন্দর ও অনুপ্রেরণামূলক প্রশংসা বাক্য বলুন!";
      checklist = [
        {
          bn: "স্মিতহাস্যে সঙ্গীকে সালাম বিনিময় করা",
          en: "Greet your spouse with Salam and a warm smile"
        },
        {
          bn: "সুন্দর এবং নম্রভাবে একে অপরের সাথে কথা বলা",
          en: "Speak to one another gently and with beautiful manners"
        },
        {
          bn: "দিনের যে কোনো এক সময় ১০টি দরূদ শরীফ একসাথে পড়া",
          en: "Recite 10 Salawat (Darood) together at any point of the day"
        }
      ];
    } else if (hijriDay >= 1 && hijriDay <= 9) {
      specialDeedTitle = "Sacred Days of Dhul-Hijjah (জিলহজের মহিমান্বিত প্রথম দশক)";
      if (hijriDay === 9) {
        specialDeedText = "Today is the Day of Arafah. Fasting on this day expiates the sins of the previous and the coming year. Fast together and make extensive Du'a.";
        specialDeedBangla = "আজ ‘ইয়াওমুল আরাফাহ’ (আরাফাহর দিন)। এই দিনের রোজা বিগত ও আগামী বছরের গুনাহ মাফ করে দেয়। চলুন আজ দুজনে রোজা রাখি ও ইফতারের পূর্বে বিশেষ দোয়া করি।";
        checklist = [
          {
            bn: "আরাফাহর রোজা রাখা (ফজরের আগে সেহরি)",
            en: "Observe the fast of Arafah (Suhoor before Fajr)"
          },
          {
            bn: "আরাফাহর দুপুরের পর থেকে সূর্যাস্ত পর্যন্ত বেশি বেশি তওবা ও ইস্তিগফার করা",
            en: "Engage heavily in repentance and remembrance from Dhuhr until sunset"
          },
          {
            bn: "তাকবীরে তাশরীক পড়া: আল্লাহু আকবার, আল্লাহু আকবার, লা ইলাহা ইল্লাল্লাহু...",
            en: "Recite Takbeer al-Tashreeq together repeatedly"
          }
        ];
      } else {
        specialDeedText = "These are highly beloved days to Allah! Fasting and reciting Dhikr are extremely recommended. Recite Takbeer al-Tashreeq together.";
        specialDeedBangla = "জিলহজের প্রথম দশক বছরের সবচেয়ে প্রিয় ১০টি দিন! আল্লাহর নৈকট্য লাভের জন্য আজ রোজা রাখতে পারেন। দুজনে মিলে তাকবীরে তাশরীক বেশি বেশি পাঠ করুন।";
        checklist = [
          {
            bn: "তাকবীরে তাশরীক পড়া: আল্লাহু আকবার, আল্লাহু আকবার...",
            en: "Recite Takbeer al-Tashreeq: Allahu Akbar, Allahu Akbar..."
          },
          {
            bn: "সম্ভব হলে নফল রোজা রাখা",
            en: "Keep a voluntary fast if you are both able to do so"
          },
          {
            bn: "সঙ্গী বা সঙ্গিনীর সাথে সুন্নাহ মোতাবিক দ্বীনী আলোচনা করা",
            en: "Share and discuss a topic of Islamic faith according to the Sunnah"
          }
        ];
      }
    } else if (hijriDay === 10) {
      specialDeedTitle = "Eid-ul-Adha Celebration (পবিত্র ঈদুল আজহা)";
      specialDeedText = "Eid Mubarak! Celebrate this special day with immense gratitude, beautiful clothing, family bonding, and charity.";
      specialDeedBangla = "ঈদ মোবারক! আজকের বিশেষ দিনটি মহান আল্লাহ্‌র কৃতজ্ঞতা, সুন্দর পোশাক পরিধান, আত্মীয়দের খোঁজ নেওয়া এবং কুরবানীর মাধ্যমে আনন্দময় করে তুলুন।";
      checklist = [
        {
          bn: "ঈদের সালাতে একে অপরের জন্য দোয়া করা",
          en: "Perform Eid prayers and supplicate warmly for one another"
        },
        {
          bn: "একে অপরকে ঈদের উপহার দেওয়া",
          en: "Exchange beautiful Eid gifts of appreciation"
        },
        {
          bn: "ঈদের নফল দান ও কুরবানীর কাজগুলোর অংশ নেওয়া",
          en: "Participate in Eid charity, distribution of meat, and Qurbani obligations"
        }
      ];
    } else {
      const dayOfHijri = hijriDay;
      if (dayOfHijri === 13 || dayOfHijri === 14 || dayOfHijri === 15) {
        specialDeedTitle = "Ayyam al-Beed - The White Days (আইয়ামুল বিজের রোজা)";
        specialDeedText = "It is highly recommended (Sunnah) to fast the 13th, 14th, and 15th of every lunar month. Fasting these 3 days is like fasting the entire lifetime.";
        specialDeedBangla = "আরবি মাসের ১৩, ১৪ ও ১৫ তারিখ আইয়ামুল বিজের রোজা রাখা অত্যন্ত সওয়াবের কাজ। চলুন দুজনে মিলে এই তিন দিন নফল রোজা রাখার নিয়ত করি।";
        checklist = [
          {
            bn: "আইয়ামুল বিজের নফল রোজার নিয়ত ও প্রস্তুতি",
            en: "Make intention and prepare for the White Days (Ayyam al-Beed) fasts"
          },
          {
            bn: "সঙ্গীকে সেহরি ও ইফতারের কাজে সাহায্য করা",
            en: "Support your partner in preparing the Suhoor and Iftar meals"
          },
          {
            bn: "ইবলিস ও গুনাহ থেকে নিজেদের হেফাযত করা",
            en: "Guard your speech, actions, and gaze from bad habits and sin"
          }
        ];
      } else {
        specialDeedTitle = "Reflecting on Quran & Sunnah (কুরআন ও সুন্নাহর আলো)";
        specialDeedText = "Knowledge increases faith. Read a small portion of Tafsir or Islamic history together today.";
        specialDeedBangla = "আজকে দুজনে একসাথে বসে কুরআনের একটি আয়াতের অর্থ বা তাফসীর পাঠ করুন। দ্বীনী জ্ঞান একে অপরের প্রতি ভালোবাসা ও সম্মান বৃদ্ধি করে।";
        checklist = [
          {
            bn: "আজ অন্তত ১০ মিনিট কিতাব তিলাওয়াত বা তাফসীর পড়া",
            en: "Devote at least 10 minutes to reading the Holy Quran or its Tafsir together"
          },
          {
            bn: "সঙ্গীর মুখে কোনো একটি হাদিস বা সুন্নাহর গল্প শোনা",
            en: "Listen to your spouse reciting a Hadith or telling an inspiring Sunnah story"
          },
          {
            bn: "রাতের বেলা একসাথে অন্তত ২ রাকাত নফল নামাজ আদায় করা",
            en: "Pray at least 2 Rak'ahs of voluntary prayer (Tahajjud or Nafl) together tonight"
          }
        ];
      }
    }

    return {
      day: hijriDay,
      month: hijriMonth,
      year,
      title: specialDeedTitle,
      text: specialDeedText,
      bangla: specialDeedBangla,
      checklist
    };
  };



  const getTodayDeedCompletedKey = () => `moon_deed_${format(new Date(), "yyyy-MM-dd")}`;
  const [deedCompletedStatus, setDeedCompletedStatus] = useState<boolean>(() => {
    return localStorage.getItem(getTodayDeedCompletedKey()) === "completed";
  });

  const toggleDeedStatus = () => {
    const key = getTodayDeedCompletedKey();
    const nextVal = !deedCompletedStatus;
    setDeedCompletedStatus(nextVal);
    if (nextVal) {
      localStorage.setItem(key, "completed");
    } else {
      localStorage.removeItem(key);
    }
  };

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

    // Fetch partner's latest mood
    const q = query(
      collection(db, "couples", couple.id, "moods"),
      where("userId", "==", partner.userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, ...d } as Mood;
        });

        const now = new Date();
        // Filter out expired items
        const activeData = data.filter(item => {
          if (item.expiresAt) {
            const expTime = item.expiresAt.seconds ? new Date(item.expiresAt.seconds * 1000) : new Date(item.expiresAt);
            return expTime > now;
          }
          // Default fallback: 24h filter
          const itemTime = item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000) : new Date();
          return now.getTime() - itemTime.getTime() < 24 * 60 * 60 * 1000;
        });

        if (activeData.length > 0) {
          // Sort client-side to find the latest
          const latest = activeData.sort((a, b) => {
            const timeA = a.timestamp?.seconds || 0;
            const timeB = b.timestamp?.seconds || 0;
            return timeB - timeA;
          })[0];
          setPartnerMood(latest);
        } else {
          setPartnerMood(null);
        }
      } else {
        setPartnerMood(null);
      }
    }, (error) => {
      console.error("Partner Mood Snapshot Error:", error);
    });

    return () => unsubscribe();
  }, [couple?.id, partner?.userId]);

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

  if (coupleLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Heart className="text-gold animate-pulse mb-4" size={32} />
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 font-black animate-pulse">Aligning universes...</p>
      </div>
    );
  }

  if (!couple) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-20">
        <GlassCard className="text-center p-12">
          <Heart className="text-gold mx-auto mb-6 animate-pulse" size={48} />
          <h1 className="text-3xl font-serif text-champagne mb-4">Welcome to Our Whisper</h1>
          <p className="mb-8 text-slate-gray leading-relaxed uppercase tracking-widest text-[10px] font-bold">It looks like you aren't part of a couple space yet. Use your spouse's code or create a new one.</p>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-8">
            <p className="text-[10px] uppercase tracking-widest text-gold font-bold mb-3">Your Invite Code</p>
            <button 
              type="button"
              onClick={() => {
                const code = profile?.userId?.substring(0, 6).toUpperCase() || "UNIVERSE";
                navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-full py-4 bg-white/5 border border-white/10 hover:border-gold/30 rounded-2xl flex items-center justify-center gap-3 text-2xl font-serif tracking-[0.2em] text-champagne transition-all hover:scale-[1.01] active:scale-95 group relative overflow-hidden"
              title="Click to copy invite code"
            >
              <span>{profile?.userId?.substring(0, 6).toUpperCase() || "UNIVERSE"}</span>
              <Copy size={16} className="text-gold/60 group-hover:text-gold transition-colors" />
              {copied && (
                <div className="absolute inset-0 bg-gold text-midnight flex items-center justify-center font-bold text-[10px] uppercase tracking-widest transition-all">
                  Copied to Clipboard!
                </div>
              )}
            </button>
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
    <div className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12 max-w-4xl pb-40">
      {/* Header Area */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-12">
        <div className="flex items-center gap-4 sm:gap-5">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-gold p-1 shadow-[0_0_20px_rgba(197,160,89,0.3)] cursor-pointer shrink-0"
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
            <h1 className="text-2xl sm:text-3xl font-serif tracking-wide text-champagne">Our Whisper</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold">Eternal Connection</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
           <div className="flex items-center sm:justify-end gap-2 text-gold mb-1">
             <Clock size={12} />
             <p className="text-[10px] uppercase tracking-wider font-bold">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</p>
           </div>
           <p className="text-champagne font-serif italic text-lg sm:text-xl">Salaam, {profile?.name}</p>
        </div>
      </header>

      {/* Main Counter Hero */}
      <section className="flex flex-col items-center justify-center py-16 text-center bg-white/5 backdrop-blur-md rounded-[40px] sm:rounded-[50px] border border-white/10 shadow-2xl relative overflow-hidden mb-12 group px-6 sm:px-12">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-30"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.5em] text-gold mb-12 font-bold px-4"
        >
          Sacred Union Since {couple.weddingDate ? new Date(couple.weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "The Beginning"}
        </motion.div>
        
        <div className="flex items-baseline gap-3 sm:gap-4 md:gap-8 mb-6 flex-wrap justify-center w-full max-w-4xl mx-auto">
          <CounterUnit value={timeTogether.days} label="Days" />
          <span className="text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] xl:text-[11.5rem] font-thin text-gold/25 select-none self-center mb-6 sm:mb-10 md:mb-14 leading-none">:</span>
          <CounterUnit value={timeTogether.hours} label="Hours" />
          <span className="text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] xl:text-[11.5rem] font-thin text-gold/25 select-none self-center mb-6 sm:mb-10 md:mb-14 leading-none">:</span>
          <CounterUnit value={timeTogether.mins} label="Minutes" />
          <span className="text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] xl:text-[11.5rem] font-thin text-gold/25 select-none self-center mb-6 sm:mb-10 md:mb-14 leading-none">:</span>
          <CounterUnit value={timeTogether.secs} label="Seconds" />
        </div>

        <div className="mt-12 sm:mt-16 px-4 sm:px-12 max-w-2xl relative">
           <div className="w-12 h-px bg-gold/40 mx-auto mb-10"></div>
           <p className="text-xl sm:text-2xl md:text-4xl font-serif italic text-champagne leading-relaxed">
             "And He placed between you affection and mercy."
           </p>
           <p className="text-[10px] uppercase tracking-[0.4em] text-slate-gray mt-8 font-bold opacity-60">Surah Ar-Rum · 30:21</p>
           
           <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
             transition={{ repeat: Infinity, duration: 4 }}
             className="absolute -top-10 -left-10 text-gold/20 hidden sm:block"
           >
             <Heart size={80} strokeWidth={1} />
           </motion.div>
        </div>
      </section>

      {/* Grid of Content */}
      <div className="grid grid-cols-12 gap-4 sm:gap-8">
        {/* Dynamic Moon Notice / Today's Special Deed */}
        {(() => {
          const deed = getSimulatedHijriDeed();
          return (
            <div className="col-span-12">
              <GlassCard className="p-5 sm:p-8 md:p-10 border-gold/20 shadow-2xl relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
                <div className="absolute top-0 right-0 w-44 h-44 bg-gold/5 rounded-full blur-3xl"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-8 pb-6 border-b border-white/5 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-gold/10 to-transparent text-gold rounded-2xl border border-gold/20 flex items-center justify-center relative shadow-lg">
                      <Moon size={24} className="relative z-10 animate-pulse text-gold" />
                      <Star size={10} className="absolute top-1.5 right-1.5 text-gold/60 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-gold">Today's Special Deed (আজকের বিশেষ আমল)</h3>
                      <p className="text-[11px] text-slate-gray flex items-center gap-1.5 mt-0.5">
                        <Clock size={11} />
                        <span>Hijri Calendar (চন্দ্র দিনপঞ্জিকা): <strong>{deed.day} {deed.month} {deed.year} AH</strong></span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex md:self-center">
                    <button 
                      onClick={toggleDeedStatus}
                      className={cn(
                        "px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold shadow-md transition-all flex items-center gap-2",
                        deedCompletedStatus 
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                          : "bg-gold text-midnight hover:scale-105 active:scale-95 shadow-lg shadow-gold/20"
                      )}
                    >
                      <Sparkles size={11} />
                      <span>{deedCompletedStatus ? "Deed Completed!" : "Mark Completed"}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4 sm:gap-8 relative z-10">
                  {/* Left Side: Text Details */}
                  <div className="col-span-12 lg:col-span-7 space-y-4 text-left">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-gold/60">Today's Focus / আজকের আমল</span>
                      <h4 className="text-xl md:text-2xl font-serif text-champagne">{deed.title}</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="border-l-2 border-gold/30 pl-3">
                        <p className="text-sm font-medium text-ivory leading-relaxed font-bangla text-emerald-100/90">
                          {deed.bangla}
                        </p>
                      </div>
                      <div className="border-l-2 border-white/10 pl-3">
                        <p className="text-xs text-slate-gray/95 leading-relaxed font-normal italic">
                          "{deed.text}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Checklist Points */}
                  <div className="col-span-12 lg:col-span-5 bg-white/5 border border-white/5 p-4 sm:p-6 rounded-[20px] sm:rounded-[28px] text-left space-y-4">
                    <h5 className="text-[10px] uppercase tracking-widest font-bold text-gold flex items-center gap-1.5">
                      <span>✦</span>
                      আজকের বিশেষ আমলসমূহ (Today's Checklist)
                    </h5>
                    <ul className="space-y-4">
                      {deed.checklist.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] mt-0.5 shrink-0 transition-colors",
                            deedCompletedStatus 
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300" 
                              : "border-gold/30 text-gold bg-gold/5"
                          )}>
                            {deedCompletedStatus ? "✓" : idx + 1}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs md:text-sm text-ivory/90 font-bangla leading-relaxed font-semibold">
                              {item.bn}
                            </span>
                            <span className="text-[11px] text-slate-gray italic leading-normal font-sans">
                              {item.en}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </GlassCard>
            </div>
          );
        })()}

        {/* Left Column */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-4 sm:gap-8">
           <GlassCard 
             onClick={() => setShowSecretModal(true)}
             className="flex-1 min-h-[300px] p-5 sm:p-8 md:p-10 flex flex-col justify-between group cursor-pointer hover:border-gold/30 transition-all border-white/10"
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
             className="bg-gradient-to-br from-gold to-champagne rounded-[24px] sm:rounded-[40px] p-5 sm:p-8 h-44 flex flex-col justify-between shadow-2xl shadow-gold/20 cursor-pointer hover:scale-[1.02] transition-all group"
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
              className="p-5 sm:p-8 h-44 flex flex-col justify-between group cursor-pointer hover:border-gold/30 transition-all border-white/10 overflow-hidden relative"
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
        <div className="col-span-12 md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
           <GlassCard 
             onClick={() => {
                if (partnerMood && partnerMood.verse) {
                  setShowSharedVerseModal(true);
                } else {
                  navigate('/emotion-guide');
                }
              }}
             className={cn(
               "flex flex-col justify-between p-5 sm:p-10 group cursor-pointer hover:border-gold/30 transition-all",
               partnerMood && "border-gold/30 bg-gold/5"
             )}
           >
              <div>
                <div className={cn(
                  "w-14 h-14 rounded-3xl flex items-center justify-center text-3xl mb-8 shadow-inner transition-colors",
                  partnerMood ? "bg-gold/20" : "bg-white/5 group-hover:bg-gold/10"
                )}>
                  {partnerMood ? (
                    <div className="relative">
                      <Heart className="text-rose-gold fill-rose-gold animate-pulse relative z-10" size={30} />
                      <Heart className="text-rose-gold/30 fill-rose-gold/20 absolute inset-0 blur-xs scale-125" size={30} />
                    </div>
                  ) : (
                    <div className="relative">
                      <Heart className="text-gold/85 fill-gold/10 relative z-10 hover:scale-105 transition-transform" size={28} />
                      <Heart className="text-gold/20 fill-gold/5 absolute inset-0 blur-[2px] scale-115" size={28} />
                    </div>
                  )}
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
             className="flex flex-col justify-between p-5 sm:p-10 group cursor-pointer hover:border-gold/30 transition-all border-white/10"
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
             className="col-span-1 sm:col-span-2 p-5 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-4 group cursor-pointer hover:bg-white/[0.08] transition-all border-gold/10"
           >
              <div className="flex items-center gap-4 sm:gap-10">
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
              <div className="flex items-center gap-4 self-end sm:self-auto">
                 <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-gold/40 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-midnight transition-all shadow-lg group-hover:shadow-gold/40 shrink-0">
                    <ChevronRight size={20} className="sm:size-[24px]" />
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

      {/* Shared Verse Modal */}
      <AnimatePresence>
        {showSharedVerseModal && partnerMood && partnerMood.verse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-midnight/90 backdrop-blur-2xl overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg my-8"
            >
              <GlassCard className="p-8 border-gold/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
                
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                      <Heart className="fill-gold/10" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif text-ivory">Shared from {partner?.name?.split(' ')[0] || "Spouse"}'s Heart</h2>
                      <p className="text-[8px] uppercase tracking-widest text-slate-gray font-bold mt-0.5">Spiritual healing reminder</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSharedVerseModal(false)} className="text-slate-gray hover:text-ivory p-2 hover:bg-white/5 rounded-full transition-all">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Arabic text with beautiful rendering */}
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                     <p className="arabic-text text-3xl mb-4 text-champagne text-right leading-loose">
                       {partnerMood.verse.ayah}
                     </p>
                     <p className="text-[10px] text-left uppercase tracking-widest text-gold font-bold">{partnerMood.verse.ref}</p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] uppercase tracking-widest text-slate-gray font-bold block text-left">Translation</span>
                    <p className="text-base font-serif italic text-ivory/80 leading-relaxed text-left">
                      "{partnerMood.verse.trans}"
                    </p>
                  </div>

                  <div className="space-y-3 border-t border-white/5 pt-4">
                    <span className="text-[9px] uppercase tracking-widest text-slate-gray font-bold block text-left">Reflection</span>
                    <p className="text-sm text-champagne/80 font-serif leading-relaxed text-left">
                      {partnerMood.verse.tafsir}
                    </p>
                  </div>

                  {partnerMood.verse.dua && (
                     <div className="border-t border-white/5 pt-4 space-y-4">
                        <span className="text-[9px] uppercase tracking-widest text-slate-gray font-bold block text-left">Healing Dua</span>
                        <div className="p-6 bg-gold/[0.03] border border-gold/15 rounded-3xl">
                          <p className="arabic-text text-2xl text-right text-champagne mb-4 leading-loose">{partnerMood.verse.dua.arabic}</p>
                          {partnerMood.verse.dua.bangla && (
                            <p className="text-base text-gold font-bold leading-relaxed font-bangla text-left mb-2">
                              {partnerMood.verse.dua.bangla}
                            </p>
                          )}
                          <p className="text-sm italic text-ivory/60 leading-relaxed text-left">
                            "{partnerMood.verse.dua.trans}"
                          </p>
                        </div>
                     </div>
                  )}
                </div>

                <button 
                  onClick={() => setShowSharedVerseModal(false)}
                  className="w-full py-5 bg-gold text-midnight rounded-[24px] font-black uppercase tracking-[0.3em] text-[10px] shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all mt-8"
                >
                  Ameen, I feel peace
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
      <span className="text-5xl sm:text-7xl md:text-9xl lg:text-[11.5rem] xl:text-[13rem] font-serif font-semibold bg-gradient-to-b from-white via-champagne to-gold bg-clip-text text-transparent tracking-tighter drop-shadow-[0_10px_30px_rgba(197,160,89,0.3)] leading-none">
        {value.toLocaleString()}
      </span>
      <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-gold mt-2 font-bold">{label}</span>
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
