import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Book, Heart, Moon, Star, Sun, Compass, Send, CheckCircle2, MessageSquare, AlertCircle, TrendingUp, Clock, User, Users } from "lucide-react";
import { useAuth, useCouple } from "@/src/App";
import { db } from "@/src/lib/firebase";
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp, getDoc } from "firebase/firestore";
import { format, differenceInDays, startOfDay, isAfter, parse } from "date-fns";
import { cn } from "@/src/lib/utils";
import { X } from "lucide-react";

const TOTAL_AYAHS = 6236;
const AYAH_PER_PRAYER = 42;

const postSalahAdhkar = [
  { 
    arabic: "أَسْتَغْفِرُ اللهَ", 
    transliteration: "Astaghfirullah", 
    banglaUccharon: "আস্তাগফিরুল্লাহ",
    translation: "আমি আল্লাহর কাছে ক্ষমা প্রার্থনা করছি", 
    repeat: 3 
  },
  { 
    arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", 
    transliteration: "Allahumma Antas-Salam...", 
    banglaUccharon: "আল্লাহুম্মা আন্তাস সালামু ওয়া মিনকাস সালাম, তাবারকতা ইয়া যাল জালালি ওয়াল ইকরাম",
    translation: "হে আল্লাহ! আপনিই শান্তি এবং আপনার থেকেই শান্তি আসে...", 
    repeat: 1 
  },
  { 
    arabic: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", 
    transliteration: "La ilaha illallah...", 
    banglaUccharon: "লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারিকা লাহু, লাহুল মুলকু ওয়া লাহুল হামদু ওয়া হুয়া আলা কুলি শাইয়িন কাদির",
    translation: "আল্লাহ ছাড়া ইবাদতের কোনো যোগ্য মাবুদ নেই...", 
    repeat: 1 
  },
  { 
    arabic: "سُبْحَانَ اللهِ", 
    transliteration: "SubhanAllah", 
    banglaUccharon: "সুবহানআল্লাহ",
    translation: "আল্লাহ অতি পবিত্র", 
    repeat: 33 
  },
  { 
    arabic: "الْحَمْدُ لِلَّهِ", 
    transliteration: "Alhamdulillah", 
    banglaUccharon: "আলহামদুলিল্লাহ",
    translation: "সমস্ত প্রশংসা আল্লাহর জন্য", 
    repeat: 33 
  },
  { 
    arabic: "اللهُ أَكْبَرُ", 
    transliteration: "Allahu Akbar", 
    banglaUccharon: "আল্লাহু আকবার",
    translation: "আল্লাহ সবচেয়ে মহান", 
    repeat: 34 
  },
];

interface DeenData {
  prayers: Record<string, boolean>;
  quran: boolean;
  dhikr: boolean;
  tahajjud: boolean;
}

interface DeenNote {
  id: string;
  from: string;
  text: string;
  seen: boolean;
  followed: boolean | null;
  timestamp: any;
}

const prayersConfig = [
  { id: "Fajr", icon: Sun },
  { id: "Dhuhr", icon: Sun },
  { id: "Asr", icon: Sun },
  { id: "Maghrib", icon: Moon },
  { id: "Isha", icon: Moon },
];

export default function Journey() {
  const { profile, couple, partner } = useCouple();
  const [viewMode, setViewMode] = useState<"me" | "partner">("me");
  const [myData, setMyData] = useState<DeenData>({
    prayers: {},
    quran: false,
    dhikr: false,
    tahajjud: false,
  });
  const [partnerData, setPartnerData] = useState<DeenData | null>(null);
  const [notes, setNotes] = useState<DeenNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string>>({});
  const [showQuranModal, setShowQuranModal] = useState(false);
  const [showDhikrModal, setShowDhikrModal] = useState(false);
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [ayahLoading, setAyahLoading] = useState(false);

  const fetchAyahs = async () => {
    if (!profile) return;
    setAyahLoading(true);
    const start = (profile.quranProgress || 0) + 1;
    const end = Math.min(start + AYAH_PER_PRAYER - 1, TOTAL_AYAHS);
    
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${start}-${end}/editions/quran-uthmani,bn.bengali`);
      const data = await res.json();
      
      if (data.code === 200) {
        const arabicVerses = data.data[0].ayahs;
        const banglaVerses = data.data[1].ayahs;
        
        const combined = arabicVerses.map((av: any, i: number) => ({
          number: av.number,
          numInSurah: av.numberInSurah,
          surah: av.surah.name,
          surahEn: av.surah.englishName,
          text: av.text,
          translation: banglaVerses[i].text
        }));

        const transRes = await fetch("/api/quran/transliterate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            ayahs: combined.map((c: any) => ({ id: c.number, text: c.text })) 
          })
        });
        const transData = await transRes.json();
        
        if (transData.transliterations) {
          combined.forEach((c: any, i: number) => {
            c.transliteration = transData.transliterations[i];
          });
        }
        
        setAyahs(combined);
      }
    } catch (e) {
      console.error("Failed to fetch ayahs", e);
    } finally {
      setAyahLoading(false);
    }
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const docPath = couple?.id ? `couples/${couple.id}/deen_daily/${todayStr}` : null;

  useEffect(() => {
    const fetchTimes = async () => {
      try {
        let lat = 23.8103;
        let lon = 90.4125;

        const getTimes = async (latitude: number, longitude: number) => {
          const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
          const data = await res.json();
          if (data.data?.timings) {
            setPrayerTimes(data.data.timings);
          }
        };

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => getTimes(pos.coords.latitude, pos.coords.longitude),
            () => getTimes(lat, lon), 
            { timeout: 10000 }
          );
        } else {
          getTimes(lat, lon);
        }
      } catch (e) {
        console.error("Failed to fetch prayer times", e);
      }
    };

    fetchTimes();
  }, []);

  const updateStreak = async () => {
    if (!couple?.id || !db) return;
    
    const lastDate = couple.lastDeenDate;
    const currentStreak = couple.deenStreak || 0;
    
    if (lastDate === todayStr) return; 

    let newStreak = 1;
    if (lastDate) {
      try {
        const last = startOfDay(new Date(lastDate));
        const today = startOfDay(new Date());
        const diff = differenceInDays(today, last);
        
        if (diff === 1) {
          newStreak = currentStreak + 1;
        } else if (diff === 0) {
          newStreak = currentStreak; 
        } else {
          newStreak = 1; 
        }
      } catch (e) {
        console.error("Date parsing error", e);
        newStreak = 1;
      }
    }

    try {
      await updateDoc(doc(db, "couples", couple.id), {
        deenStreak: newStreak,
        lastDeenDate: todayStr
      });
    } catch (e) {
      console.error("Failed to update streak", e);
    }
  };

  useEffect(() => {
    if (!docPath || !db) return;

    const unsub = onSnapshot(doc(db, docPath), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (profile?.userId) {
          setMyData(data[profile.userId] || { prayers: {}, quran: false, dhikr: false, tahajjud: false });
        }
        if (partner?.userId) {
          setPartnerData(data[partner.userId] || null);
        }
        setNotes(data.notes || []);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error in Journey:", error);
      setLoading(false);
    });

    const s = couple?.deenStreak || 0;
    setStreak(s); 

    return () => unsub();
  }, [docPath, profile?.userId, partner?.userId, couple?.deenStreak]);

  const getCurrentPrayer = () => {
    if (!prayerTimes.Fajr) return "Fajr";
    const now = new Date();
    const timeToDate = (timeStr: string) => parse(timeStr, "HH:mm", new Date());

    const isha = timeToDate(prayerTimes.Isha);
    const maghrib = timeToDate(prayerTimes.Maghrib);
    const asr = timeToDate(prayerTimes.Asr);
    const dhuhr = timeToDate(prayerTimes.Dhuhr);
    const fajr = timeToDate(prayerTimes.Fajr);

    if (isAfter(now, isha)) return "Isha";
    if (isAfter(now, maghrib)) return "Maghrib";
    if (isAfter(now, asr)) return "Asr";
    if (isAfter(now, dhuhr)) return "Dhuhr";
    return "Fajr";
  };

  const updateQuranProgress = async () => {
    if (!profile?.userId || !db) return;
    const currentProgress = profile.quranProgress || 0;
    const nextProgress = Math.min(currentProgress + AYAH_PER_PRAYER, TOTAL_AYAHS);

    try {
      await updateDoc(doc(db, "users", profile.userId), {
        quranProgress: nextProgress
      });
      // Also mark as done for today if not already
      if (!myData.quran) {
        await toggleItem("extra", "quran");
      }
      setShowQuranModal(false);
    } catch (e) {
      console.error("Failed to update Quran progress", e);
    }
  };

  const toggleItem = async (type: "prayer" | "extra", id: string) => {
    if (!db || !docPath || !profile?.userId || viewMode !== "me") return;

    try {
      await updateStreak();
    } catch (e) {
      console.warn("Streak update failed, continuing...", e);
    }

    const docRef = doc(db, docPath);
    
    let newStatus = false;
    if (type === "prayer") {
      newStatus = !myData.prayers?.[id];
    } else {
      newStatus = !(myData as any)[id];
    }

    try {
      const updateObj: any = {};
      if (type === "prayer") {
        updateObj[`${profile.userId}.prayers.${id}`] = newStatus;
      } else {
        updateObj[`${profile.userId}.${id}`] = newStatus;
      }
      updateObj.lastUpdated = serverTimestamp();
      
      await updateDoc(docRef, updateObj);
    } catch (e: any) {
      if (e.code === 'not-found') {
        const initialUserData: any = {
          prayers: {},
          quran: false,
          dhikr: false,
          tahajjud: false
        };

        if (type === "prayer") {
          initialUserData.prayers[id] = newStatus;
        } else {
          initialUserData[id] = newStatus;
        }

        const initialData = {
          [profile.userId]: initialUserData,
          lastUpdated: serverTimestamp(),
          notes: []
        };
        await setDoc(docRef, initialData, { merge: true });
      } else {
        console.error("Firestore Toggle Error:", e);
      }
    }
  };

  const sendNote = async () => {
    if (!newNote.trim() || !db || !couple?.id || !profile?.userId) return;
    
    await updateStreak();

    const noteId = Math.random().toString(36).substring(7);
    const note: DeenNote = {
      id: noteId,
      from: profile.userId,
      text: newNote,
      seen: false,
      followed: null,
      timestamp: new Date()
    };

    try {
      if (!docPath) return;
      await updateDoc(doc(db, docPath), {
        notes: arrayUnion(note)
      });
    } catch (e) {
      if (!docPath) return;
      await setDoc(doc(db, docPath), { notes: [note] }, { merge: true });
    }
    setNewNote("");
  };

  const acknowledgeNote = async (noteId: string, action: "seen" | "followed" | "ignored") => {
    if (!db || !docPath) return;
    
    const updatedNotes = notes.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          seen: true,
          followed: action === "followed" ? true : action === "ignored" ? false : n.followed
        };
      }
      return n;
    });

    try {
      await updateDoc(doc(db, docPath), { notes: updatedNotes });
    } catch (e) {
      await setDoc(doc(db, docPath), { notes: updatedNotes }, { merge: true });
    }
  };

  const currentViewData = viewMode === "me" ? myData : (partnerData || { prayers: {}, quran: false, dhikr: false, tahajjud: false });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Compass className="text-gold opacity-20" size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 pt-12 max-w-2xl pb-40">
      <header className="mb-12">
        {/* Top Verse - An-Naba */}
        <p className="text-center italic text-gold/60 font-serif mb-12 max-w-lg mx-auto text-lg">
          "And We created you in pairs" — Surah An-Naba 78:8
        </p>

        <div className="flex justify-between items-start flex-wrap gap-6 mb-12">
          <div className="space-y-8 w-full md:w-auto">
            <div>
              <h1 className="text-4xl font-serif text-champagne mb-2">Our Journey</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Scaling the heights of Iman</p>
            </div>
            
            <div className="flex items-center gap-10 bg-gold/10 px-12 py-9 rounded-[48px] border-2 border-gold/30 backdrop-blur-3xl group hover:border-gold/50 transition-all shadow-[0_30px_70px_rgba(197,160,89,0.3)]">
              <div className="p-6 bg-gold text-midnight rounded-[28px] shadow-2xl group-hover:scale-110 transition-transform">
                <TrendingUp size={48} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-5xl font-serif text-champagne leading-none mb-3">{streak} Days</p>
                <p className="text-[14px] uppercase tracking-[0.4em] text-gold font-bold">Sacred Streak</p>
              </div>
            </div>

            {/* Spiritual Verse - Multilingual (Under Streak) */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden group w-full"
            >
              <GlassCard className="p-10 md:p-12 text-center bg-gradient-to-br from-midnight via-transparent to-gold/5 border-gold/20 shadow-2xl relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                 <div className="space-y-10">
                    <div className="flex justify-center">
                       <h3 className="arabic-text text-5xl md:text-6xl text-champagne leading-[1.8] text-center w-full">
                          فَإِنَّ مَعَ الْعُسْرِ يُسْرًا
                       </h3>
                    </div>
                    <div className="space-y-6">
                       <p className="text-2xl font-serif italic text-ivory/90 tracking-tight leading-relaxed max-w-sm mx-auto">
                         "For indeed, with hardship [will be] ease."
                       </p>
                       <div className="w-16 h-[2px] bg-gold/30 mx-auto"></div>
                       <p className="text-2xl font-bangla text-gold/80 leading-relaxed max-w-sm mx-auto">
                         "নিশ্চয় কষ্টের সাথেই স্বস্তি রয়েছে।"
                       </p>
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.6em] text-slate-gray font-bold pt-10 border-t border-white/5 inline-block">Surah Ash-Sharh · 94:6</p>
                 </div>
              </GlassCard>
            </motion.div>
          </div>

          <div className="flex flex-col items-end gap-6 ml-auto">
             <div className="flex bg-midnight/50 p-2 rounded-[24px] border border-white/10 backdrop-blur-md">
                <button 
                  onClick={() => setViewMode("me")}
                  className={cn(
                    "flex items-center gap-2 px-8 py-4 rounded-[16px] text-[11px] uppercase tracking-widest font-bold transition-all",
                    viewMode === "me" ? "bg-gold text-midnight shadow-lg" : "text-slate-gray hover:text-ivory"
                  )}
                >
                  <User size={16} /> You
                </button>
                <button 
                  onClick={() => setViewMode("partner")}
                  className={cn(
                    "flex items-center gap-2 px-8 py-4 rounded-[16px] text-[11px] uppercase tracking-widest font-bold transition-all",
                    viewMode === "partner" ? "bg-gold text-midnight shadow-lg" : "text-slate-gray hover:text-ivory"
                  )}
                >
                  <Users size={16} /> Spouse
                </button>
             </div>
          </div>
        </div>
      </header>

      <div className="space-y-12">
        {/* Prayers Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="heading-accent m-0">Daily Prayers (Salah)</h3>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold font-bold bg-gold/10 px-4 py-2 rounded-full border border-gold/20">
              <Clock size={12} /> {format(new Date(), "HH:mm")}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {prayersConfig.map((prayer) => {
              const isDone = currentViewData.prayers[prayer.id];
              const time = prayerTimes[prayer.id] || "--:--";
              const spouseDone = partnerData?.prayers?.[prayer.id];
              
              return (
                <GlassCard 
                  key={prayer.id}
                  onClick={() => viewMode === "me" && toggleItem("prayer", prayer.id)}
                  whileTap={viewMode === "me" ? { scale: 0.98 } : {}}
                  className={cn(
                    "p-7 flex items-center justify-between transition-all duration-500 cursor-pointer group",
                    isDone ? "bg-gold/[0.08] border-gold/40" : "hover:bg-white/[0.07] border-white/10"
                  )}
                >
                  <div className="flex items-center gap-8">
                    <div className={cn(
                      "p-5 rounded-2xl transition-all duration-500",
                      isDone ? "bg-gold text-midnight shadow-[0_0_30px_rgba(197,160,89,0.4)] scale-110" : "bg-white/5 text-slate-gray group-hover:text-gold/50"
                    )}>
                      <prayer.icon size={28} />
                    </div>
                    <div>
                      <h4 className={cn("text-2xl font-serif mb-1", isDone ? "text-champagne" : "text-ivory/60 group-hover:text-ivory")}>
                        {prayer.id}
                      </h4>
                      <p className="text-[11px] uppercase tracking-widest text-slate-gray font-bold flex items-center gap-2">
                        <Clock size={12} className="text-gold/50" /> {time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Visual feedback for spouse status in "me" mode */}
                    {viewMode === "me" && spouseDone && (
                       <div className="flex flex-col items-center gap-1 opacity-60">
                          <CheckCircle2 size={12} className="text-gold" />
                          <span className="text-[7px] uppercase tracking-widest text-gold font-bold">Spouse</span>
                       </div>
                    )}

                    <div className={cn(
                      "w-12 h-12 rounded-[18px] border-2 flex items-center justify-center transition-all duration-300",
                      isDone ? "bg-gold border-gold text-midnight scale-110 shadow-lg" : "border-white/10 hover:border-gold/30 text-transparent"
                    )}>
                      {isDone ? "✓" : ""}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* Extra Deen Activities */}
        <section>
          <h3 className="heading-accent mb-8">Interactive Worship</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: "quran", label: "Quran", icon: Book },
              { id: "dhikr", label: "Dhikr", icon: Moon },
              { id: "tahajjud", label: "Tahajjud", icon: Star },
            ].map((item) => {
              const isDone = currentViewData[item.id as keyof DeenData];
              const spouseDone = partnerData?.[item.id as keyof DeenData];
              
              const handleClick = () => {
                if (viewMode !== "me") return;
                if (item.id === "quran") {
                  setShowQuranModal(true);
                  fetchAyahs();
                } else if (item.id === "dhikr") setShowDhikrModal(true);
                else toggleItem("extra", item.id);
              };

              return (
                <GlassCard
                  key={item.id}
                  onClick={handleClick}
                  whileTap={viewMode === "me" ? { scale: 0.95 } : {}}
                  className={cn(
                    "flex flex-col items-center gap-6 p-8 cursor-pointer transition-all duration-500",
                    isDone
                      ? "bg-gold/[0.08] border-gold/40 shadow-[0_15px_40px_rgba(197,160,89,0.2)]"
                      : "bg-white/5 border-white/10 text-slate-gray hover:bg-white/10 hover:border-gold/20"
                  )}
                >
                  <div className={cn(
                    "p-6 rounded-2xl transition-all duration-500",
                    isDone ? "bg-gold text-midnight shadow-lg scale-110" : "bg-white/5 text-slate-gray"
                  )}>
                    <item.icon size={32} />
                  </div>
                  
                  <div className="text-center">
                    <span className={cn("text-[12px] uppercase tracking-[0.3em] font-bold block mb-2", isDone ? "text-gold" : "text-slate-gray")}>
                      {item.label}
                    </span>
                    
                    {viewMode === "me" && spouseDone && (
                      <div className="flex items-center justify-center gap-1.5 opacity-60">
                        <CheckCircle2 size={10} className="text-gold" />
                        <span className="text-[7px] uppercase tracking-widest text-gold font-bold">Partner Done</span>
                      </div>
                    )}
                  </div>

                  <div className={cn(
                    "w-full h-1 rounded-full mt-2 transition-all duration-1000",
                    isDone ? "bg-gold shadow-[0_0_10px_rgba(197,160,89,0.5)]" : "bg-white/5"
                  )} />
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* Partner Notes & Polls */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="text-gold" size={20} />
            <h3 className="heading-accent m-0">Sacred Reminders</h3>
          </div>

          <GlassCard className="p-0 border-white/10 overflow-hidden mb-8">
            <div className="p-6 bg-white/5 flex gap-4 items-center">
              <input 
                type="text"
                placeholder="Leave a spiritual nudge..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-ivory placeholder:text-slate-gray/50 font-serif p-2"
              />
              <button 
                onClick={sendNote}
                className="p-4 bg-gold text-midnight rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <Send size={20} />
              </button>
            </div>
          </GlassCard>

          <div className="space-y-6">
             <AnimatePresence>
              {notes.length === 0 ? (
                <p className="text-center text-[10px] uppercase tracking-widest text-slate-gray py-12 border border-dashed border-white/5 rounded-[32px]">No echoes to share yet</p>
              ) : (
                [...notes].reverse().map((note) => {
                  const isFromMe = note.from === profile?.userId;
                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "p-8 rounded-[40px] border flex flex-col gap-6 transition-all",
                        isFromMe ? "bg-white/[0.03] border-white/10" : "bg-gold/[0.05] border-gold/20"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className={cn("p-3 rounded-2xl", isFromMe ? "bg-white/5 text-slate-gray" : "bg-gold text-midnight")}>
                             <Heart size={18} />
                          </div>
                          <div>
                            <p className="text-lg font-serif text-champagne leading-relaxed">{note.text}</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-gray mt-2 font-bold opacity-60">
                              {isFromMe ? "Sent by you" : `From ${partner?.name?.split(' ')[0]}`}
                            </p>
                          </div>
                        </div>
                        {!isFromMe && !note.seen && <AlertCircle size={16} className="text-gold animate-pulse" />}
                      </div>

                      {!isFromMe && !note.seen && (
                         <button 
                           onClick={() => acknowledgeNote(note.id, "seen")}
                           className="w-full py-4 bg-gold text-midnight rounded-[20px] text-[10px] uppercase tracking-widest font-bold shadow-lg"
                         >
                           Read Reminder
                         </button>
                      )}

                      {!isFromMe && note.seen && (
                         <div className="space-y-4 pt-4 border-t border-white/5">
                            <p className="text-[9px] uppercase tracking-widest text-gold font-bold text-center">Followed this reminder?</p>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => acknowledgeNote(note.id, "followed")}
                                 className={cn(
                                   "flex-1 py-3 rounded-2xl text-[9px] uppercase tracking-widest font-bold border transition-all",
                                   note.followed === true ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white/5 border-white/10 text-slate-gray"
                                 )}
                               >
                                 Yes
                               </button>
                               <button 
                                 onClick={() => acknowledgeNote(note.id, "ignored")}
                                 className={cn(
                                   "flex-1 py-3 rounded-2xl text-[9px] uppercase tracking-widest font-bold border transition-all",
                                   note.followed === false ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-slate-gray"
                                 )}
                               >
                                 No
                               </button>
                            </div>
                         </div>
                      )}

                      {isFromMe && note.seen && (
                         <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold border-t border-white/5 pt-4">
                            <span className="text-gold/60">Seen by spouse</span>
                            {note.followed !== null && (
                               <span className={note.followed ? "text-emerald-400" : "text-red-400"}>
                                 {note.followed ? "Success" : "Pending"}
                               </span>
                            )}
                         </div>
                      )}
                    </motion.div>
                  );
                })
              )}
             </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Quran Progress Modal */}
      <AnimatePresence>
        {showQuranModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-midnight/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg"
            >
              <GlassCard className="p-10 md:p-12 border-gold/30 shadow-[0_0_80px_rgba(197,160,89,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6">
                  <button onClick={() => setShowQuranModal(false)} className="text-slate-gray hover:text-gold transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="text-center space-y-10">
                  <div className="p-6 bg-gold text-midnight rounded-[28px] inline-block shadow-2xl">
                    <Book size={48} />
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-4xl font-serif text-champagne">Quran Khatam Plan</h2>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold">1 Month Completion Journey</p>
                  </div>

                  <div className="bg-white/5 rounded-[32px] p-10 border border-white/10 space-y-8">
                    <div className="grid grid-cols-2 gap-8 divide-x divide-white/5">
                      <div className="space-y-2">
                        <p className="text-[9px] uppercase tracking-widest text-slate-gray font-bold">Today's Start</p>
                        <p className="text-3xl font-serif text-gold">Ayah {(profile?.quranProgress || 0) + 1}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] uppercase tracking-widest text-slate-gray font-bold">Today's Goal</p>
                        <p className="text-3xl font-serif text-ivory">Ayah {Math.min((profile?.quranProgress || 0) + AYAH_PER_PRAYER, TOTAL_AYAHS)}</p>
                      </div>
                    </div>

                    {/* Ayahs List */}
                    <div className="max-h-[400px] overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                      {ayahLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                          <div className="w-8 h-8 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                          <p className="text-xs text-slate-gray animate-pulse">Loading Divine Verses...</p>
                        </div>
                      ) : ayahs.length > 0 ? (
                        ayahs.map((ayah, idx) => (
                          <div key={idx} className="space-y-4 pb-6 border-b border-white/5 last:border-0 text-left">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] uppercase tracking-widest text-gold/60 font-bold">{ayah.surahEn} · {ayah.numInSurah}</span>
                              <span className="text-[10px] text-slate-gray font-mono">#{ayah.number}</span>
                            </div>
                            <p className="arabic-text text-2xl text-right text-champagne leading-loose">{ayah.text}</p>
                            <div className="space-y-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] uppercase tracking-widest text-gold/40 font-bold">Bangla Uccharon</span>
                                <p className="text-sm text-gold font-bold leading-relaxed">{ayah.transliteration}</p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Bengali Translation</span>
                                <p className="text-xs text-ivory/70 font-serif leading-relaxed">{ayah.translation}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-gray py-4 text-center">Click update below when finished reading</p>
                      )}
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                        <span className="text-slate-gray">Total Progress</span>
                        <span className="text-gold">{Math.round(((profile?.quranProgress || 0) / TOTAL_AYAHS) * 100)}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${((profile?.quranProgress || 0) / TOTAL_AYAHS) * 100}%` }}
                          className="h-full bg-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={updateQuranProgress}
                      className="w-full py-6 bg-gold text-midnight rounded-[24px] text-sm uppercase tracking-[0.3em] font-bold shadow-[0_15px_40px_rgba(197,160,89,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Mark as Read ({AYAH_PER_PRAYER} Ayahs)
                    </button>
                    <p className="text-[10px] text-slate-gray/60 italic font-serif">
                      Read these ayahs after this prayer to complete the Quran in 1 month
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dhikr Modal */}
      <AnimatePresence>
        {showDhikrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-midnight/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl"
            >
              <GlassCard className="p-8 md:p-12 border-gold/30 shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="absolute top-0 right-0 p-6 sticky">
                  <button onClick={() => setShowDhikrModal(false)} className="text-slate-gray hover:text-gold transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-10">
                  <div className="text-center space-y-6">
                    <div className="p-5 bg-gold text-midnight rounded-full inline-block shadow-lg">
                      <Moon size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-serif text-champagne mb-2">Post-{getCurrentPrayer()} Adhkar</h2>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">According to Sunnah</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {postSalahAdhkar.map((dhikr, idx) => {
                       return (
                        <div key={idx} className="bg-white/5 border border-white/5 p-6 rounded-[28px] space-y-4 group hover:bg-white/[0.08] transition-all text-left">
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="arabic-text text-3xl text-right text-champagne leading-relaxed flex-1">
                              {dhikr.arabic}
                            </h4>
                            {dhikr.repeat > 1 && (
                              <div className="bg-gold text-midnight px-4 py-1 rounded-full text-[10px] font-bold shadow-md">
                                {dhikr.repeat}x
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                             <div className="flex flex-col gap-1">
                                <span className="text-[8px] uppercase tracking-widest text-gold/40 font-bold">Bangla Uccharon</span>
                                <p className="text-sm font-bangla text-ivory/90 leading-relaxed font-bold">
                                   {dhikr.banglaUccharon}
                                </p>
                             </div>
                             <div className="flex flex-col gap-1">
                                <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Translation</span>
                                <p className="text-xs font-serif italic text-slate-gray leading-relaxed">"{dhikr.translation}"</p>
                             </div>
                          </div>
                        </div>
                      );
                    })}

                    {(getCurrentPrayer() === "Fajr" || getCurrentPrayer() === "Maghrib") && (
                      <div className="bg-gold/10 border border-gold/20 p-6 rounded-[28px] space-y-4 text-left">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase tracking-widest text-gold font-bold">Sunnah for {getCurrentPrayer()}</span>
                            <div className="bg-gold text-midnight px-4 py-1 rounded-full text-[10px] font-bold">10x</div>
                         </div>
                         <h4 className="arabic-text text-2xl text-right text-champagne leading-relaxed">
                            لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ
                         </h4>
                         <div className="space-y-2">
                            <div className="flex flex-col gap-1">
                               <span className="text-[8px] uppercase tracking-widest text-gold/40 font-bold">Bangla Uccharon</span>
                               <p className="text-sm font-bangla text-gold leading-relaxed font-bold">
                                  লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারিকা লাহু, লাহুল মুলকু ওয়া লাহুল হামদু ইউহয়ী ওয়া ইউমীতু ওয়া হুয়া আলা কুলি শাইয়িন কাদির
                               </p>
                            </div>
                            <div className="flex flex-col gap-1">
                               <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Translation</span>
                               <p className="text-xs font-serif italic text-slate-gray/80">"None has the right to be worshipped but Allah alone... He gives life and causes death..."</p>
                            </div>
                         </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      if (viewMode === "me" && !myData.dhikr) toggleItem("extra", "dhikr");
                      setShowDhikrModal(false);
                    }}
                    className="w-full py-5 bg-midnight border-2 border-gold/40 text-gold rounded-[24px] text-[10px] uppercase tracking-widest font-bold hover:bg-gold hover:text-midnight transition-all shadow-xl"
                  >
                    I have completed my Dhikr
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
