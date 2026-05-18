import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Search, Heart, Shield, Sparkles, Wind, CloudRain, Sun, Zap, Moon, BookOpen, Share2, CheckCircle2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { db } from "@/src/lib/firebase";
import { useAuth, useCouple } from "@/src/App";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const emotions = [
  { id: 'happy', label: 'Happy', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'sad', label: 'Sad', icon: CloudRain, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'angry', label: 'Angry', icon: Zap, color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: 'lonely', label: 'Lonely', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'anxious', label: 'Anxious', icon: Wind, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  { id: 'grateful', label: 'Grateful', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { id: 'scared', label: 'Scared', icon: Shield, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'hopeful', label: 'Hopeful', icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
];

interface GuidanceItem {
  ayah: string;
  ref: string;
  trans: string;
  tafsir: string;
  dua: {
    arabic: string;
    trans: string;
    bangla: string;
  };
}

const guidanceData: Record<string, GuidanceItem[]> = {
  happy: [
    {
      ayah: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
      ref: "Ibrahim 14:7",
      trans: "If you are grateful, I will surely increase you.",
      tafsir: "Gratitude is the key to abundance. When you feel joy, returning that thanks to Allah ensures the blessing multiplies.",
      dua: {
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ",
        trans: "All praise is for Allah, by whose favor good things are accomplished.",
        bangla: "আলহামদু লিল্লাহিল্লাজি বিনি’মাতিহি তাতিম্মুস সলিহাত"
      }
    },
    {
      ayah: "فَاصْبِرْ صَبْرًا جَمِيلًا",
      ref: "Al-Ma'arij 70:5",
      trans: "So be patient with gracious patience.",
      tafsir: "Even in happiness, true beauty lies in the balance of patience and gratitude, knowing that every state is from Him.",
      dua: {
        arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ",
        trans: "My Lord, inspire me to be grateful for Your favor.",
        bangla: "রব্বি আওযি’নি আন আশকুরা নি’মাতাকা"
      }
    }
  ],
  sad: [
    {
      ayah: "لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا",
      ref: "At-Tawbah 9:40",
      trans: "Do not grieve; indeed Allah is with us.",
      tafsir: "Allah's presence is most felt when we feel most alone in our sorrow. This was spoken to Abu Bakr (RA) in a moment of fear and sadness.",
      dua: {
        arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",
        trans: "O Allah, I seek refuge in You from anxiety and grief.",
        bangla: "আল্লাহুম্মা ইন্নি আউযুবিকা মিনাল হাম্মি ওয়াল হাযান"
      }
    },
    {
      ayah: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
      ref: "Ash-Sharh 94:5",
      trans: "For indeed, with hardship [will be] ease.",
      tafsir: "Sorrow is temporary. The 'Yusr' (ease) is not just after the hardship, but packaged with it by Divine Design.",
      dua: {
        arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ",
        trans: "O Living, O Sustaining, in Your Mercy I seek relief.",
        bangla: "ইয়া হাইয়ু ইয়া কাইয়ুমু বিরাহমাতিকা আস্তাগীস"
      }
    }
  ],
  anxious: [
    {
      ayah: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
      ref: "Ar-Ra'd 13:28",
      trans: "Unquestionably, by the remembrance of Allah hearts find rest.",
      tafsir: "Anxiety is often a heart seeking its anchor. Dhikr is the anchor that settles the storms of the mind.",
      dua: {
        arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ",
        trans: "O Living, O Sustaining, in Your Mercy I seek relief.",
        bangla: "ইয়া হাইয়ু ইয়া কাইয়ুমু বিরাহমাতিকা আস্তাগীস"
      }
    },
    {
      ayah: "وَتَوَكَّلْ عَلَى اللَّهِ وَكَفَىٰ بِاللَّهِ وَكِيلًا",
      ref: "Al-Ahzab 33:3",
      trans: "And rely upon Allah ; and sufficient is Allah as Disposer of affairs.",
      tafsir: "Anxiety comes from trying to control what is already managed by Al-Wakeel. Let go and let God.",
      dua: {
        arabic: "اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
        trans: "O Allah, I hope for Your mercy. Do not leave me to myself even for the blink of an eye.",
        bangla: "আল্লাহুম্মা রহমাতাকা আরজু ফালা তাকিলনি ইলা নাফসি তরফাতা আই’ন"
      }
    }
  ],
  angry: [
    {
      ayah: "الَّذِينَ يُنفِقُونَ فِي السَّرَّاءِ وَالضَّرَّاءِ وَالْكَاظِمِينَ الْغَيْظَ",
      ref: "Ali 'Imran 3:134",
      trans: "Who restrain anger and who pardon the people - and Allah loves the doers of good.",
      tafsir: "Anger is fire. Control is water. Restraining your reaction during heat is a sign of high character loved by the Creator.",
      dua: {
        arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
        trans: "I seek refuge in Allah from the accursed Shaitan.",
        bangla: "আউযুবিল্লাহি মিনাশ শাইতানির রাজীম"
      }
    },
    {
      ayah: "خُذِ الْعَفْوَ وَأْمُرْ بِالْعُرْفِ وَأَعْرِضْ عَنِ الْجَاهِلِينَ",
      ref: "Al-A'raf 7:199",
      trans: "Take what is given freely, enjoin what is good, and turn away from the ignorant.",
      tafsir: "Pardon others not because they deserve it, but because your soul deserves peace.",
      dua: {
        arabic: "اللَّهُمَّ اغْفِرْ لِي ذَنْبِي وَأَذْهِبْ غَيْظَ قَلْبِي",
        trans: "O Allah, forgive my sin and remove the anger of my heart.",
        bangla: "আল্লাহুম্মা ইগফির লি যামবি ওয়া আযহিব গইযা কলবি"
      }
    }
  ],
  lonely: [
    {
      ayah: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",
      ref: "Al-Hadid 57:4",
      trans: "And He with you wherever you are.",
      tafsir: "Human company is finite, but the Divine Presence is constant. When you feel lonely, realize that the One who created your soul is closer than your jugular vein.",
      dua: {
        arabic: "يَا أُنْسَ كُلِّ مُسْتَوْحِشٍ",
        trans: "O Companion of the one who is lonely.",
        bangla: "ইয়া উনসা কুল্লি মুসতাউহিশ"
      }
    },
    {
      ayah: "وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ",
      ref: "Qaf 50:16",
      trans: "And We are closer to him than [his] jugular vein.",
      tafsir: "Loneliness is an invitation to intimacy with Allah. He is not 'somewhere else'—He is right here.",
      dua: {
        arabic: "اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَأَلْحِقْنِي بِالرَّفِيقِ الأَعْلَى",
        trans: "O Allah, forgive me, have mercy on me and join me with the Highest Companion.",
        bangla: "আল্লাহুম্মা ইগফিরলি ওয়ারহামনি ওয়া আলহিকনি বির রফিকিল আলা"
      }
    }
  ],
  grateful: [
    {
      ayah: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
      ref: "Ar-Rahman 55:13",
      trans: "So which of the favors of your Lord would you deny?",
      tafsir: "Gratefulness is the soul's awareness of its gifts. Every breath is a mercy; acknowledging it brings content.",
      dua: {
        arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ",
        trans: "My Lord, enable me to be grateful for Your favor which You have bestowed upon me.",
        bangla: "রব্বি আওযি’নি আন আশকুরা নি’মাতাকা"
      }
    },
    {
      ayah: "وَمَن يَشْكُرْ فَإِنَّمَا يَشْكُرُ لِنَفْسِهِ",
      ref: "Luqman 31:12",
      trans: "And whoever is grateful is grateful for [the benefit of] himself.",
      tafsir: "When we thank Allah, He doesn't gain anything—we do. It's the ultimate therapy for the soul.",
      dua: {
        arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
        trans: "O Allah, help me to remember You, give thanks to You, and worship You well.",
        bangla: "আল্লাহুম্মা আইন্নি আলা যিকরিকা ওয়া শুকরিকা ওয়া হুসনি ইবাদাতিকা"
      }
    }
  ],
  scared: [
    {
      ayah: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
      ref: "Ali 'Imran 3:173",
      trans: "Sufficient for us is Allah, and [He is] the best Disposer of affairs.",
      tafsir: "Fear is the absence of security. Turning your dependency to Al-Wakeel (The Trustee) transforms fear into Tawakkul.",
      dua: {
        arabic: "اللَّهُمَّ اسْتُرْ عَوْرَاتِنَا وَآمِنْ رَوْعَاتِنَا",
        trans: "O Allah, cover our faults and calm our fears.",
        bangla: "আল্লাহুম্মা উসতুর আওরাতিনা ওয়া আমিন রওআতিনা"
      }
    },
    {
      ayah: "فَلَا تَخَافُوهُمْ وَخَافُونِ إِن كُنتُم مُّؤْمِنِينَ",
      ref: "Ali 'Imran 3:175",
      trans: "So fear them not, but fear Me, if you are [indeed] believers.",
      tafsir: "The fear of Allah is the only fear that liberates you from all other fears.",
      dua: {
        arabic: "اللَّهُمَّ إِنِّي عَبْدُكَ وَابْنُ عَبْدِكَ وَابْنُ أَمَتِكَ",
        trans: "O Allah, I am Your slave, the son of Your slave...",
        bangla: "আল্লাহুম্মা ইন্নি আবদুকা ওয়াবনু আবদিকা ওয়াবনু আমাতিকা"
      }
    }
  ],
  hopeful: [
    {
      ayah: "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ",
      ref: "Yusuf 12:87",
      trans: "And never give up hope of Allah's soothing Mercy.",
      tafsir: "Hope is the oxygen of faith. Despair has no place in the heart of one who knows the Vastness of Allah's Rahmah.",
      dua: {
        arabic: "اللَّهُمَّ اجْعَلْ خَيْرَ عُمْرِي آخِرَهُ",
        trans: "O Allah, make the best of my life its end.",
        bangla: "আল্লাহুম্মা ইজ’আল খয়রা উমরি আখিরাহু"
      }
    },
    {
      ayah: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",
      ref: "Az-Zumar 39:53",
      trans: "Say, 'O My servants who have transgressed against themselves... do not despair of the mercy of Allah.'",
      tafsir: "Hope is always available, no matter how many mistakes were made. His doorway is ever open.",
      dua: {
        arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
        trans: "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good.",
        bangla: "রব্বানা আতিনা ফিদ দুনিয়া হাসানাতাও ওয়া ফিল আখিরাতি হাসানাতাহ"
      }
    }
  ]
};

export default function EmotionGuide() {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [customEmotion, setCustomEmotion] = useState("");
  const [activeGuidance, setActiveGuidance] = useState<GuidanceItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleEmotionSelect = (id: string) => {
    setSelectedEmotion(id);
    setCustomEmotion(""); // Clear custom input when selecting a preset
    const options = guidanceData[id];
    if (options && options.length > 0) {
      const randomItem = options[Math.floor(Math.random() * options.length)];
      setActiveGuidance(randomItem);
    }
  };

  const handleCustomSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmotion.trim()) return;

    setIsSearching(true);
    setSelectedEmotion(customEmotion);
    setActiveGuidance(null);

    try {
      const res = await fetch("/api/emotion/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion: customEmotion }),
      });
      const data = await res.json();
      if (data.ayah) {
        setActiveGuidance(data);
      }
    } catch (error) {
      console.error("Custom emotion search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleShuffle = () => {
    if (!selectedEmotion) return;
    const options = guidanceData[selectedEmotion];
    if (options && options.length > 1) {
      let nextItem;
      do {
        nextItem = options[Math.floor(Math.random() * options.length)];
      } while (nextItem.ayah === activeGuidance?.ayah);
      setActiveGuidance(nextItem);
    }
  };

  const handleShare = async () => {
    if (!selectedEmotion || !couple?.id || !user?.uid) return;
    
    setIsSharing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, "couples", couple.id, "moods"), {
        userId: user.uid,
        emotionId: selectedEmotion,
        date: today,
        timestamp: serverTimestamp()
      });
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (error) {
      console.error("Error sharing mood:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="container mx-auto px-6 pt-12 max-w-2xl pb-40">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-champagne mb-2">Heart's Compass</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Divine guidance for your soul's state</p>
      </header>

      <GlassCard className="p-0 border-white/10 overflow-hidden mb-12 shadow-2xl">
        <form onSubmit={handleCustomSearch} className="flex items-center gap-4 p-4 md:p-6 bg-white/5 backdrop-blur-xl">
           <div className="p-4 bg-gold/10 text-gold rounded-2xl">
             <Search size={20} />
           </div>
           <input 
             type="text"
             placeholder="How is your heart today? (e.g., 'stressed about work', 'feeling empty')"
             value={customEmotion}
             onChange={(e) => setCustomEmotion(e.target.value)}
             className="flex-1 bg-transparent border-none outline-none text-ivory placeholder:text-slate-gray/50 font-serif text-lg"
           />
           <button 
             type="submit"
             disabled={isSearching}
             className="px-8 py-4 bg-gold text-midnight rounded-xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
           >
             {isSearching ? "Searching..." : "Listen"}
           </button>
        </form>
      </GlassCard>

      <div className="grid grid-cols-4 gap-4 mb-12">
        {emotions.map((emotion) => (
          <motion.button
            key={emotion.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleEmotionSelect(emotion.id)}
            className={cn(
              "flex flex-col items-center gap-3 p-5 rounded-3xl transition-all duration-500 border",
              selectedEmotion === emotion.id 
                ? "bg-white/10 border-gold shadow-[0_0_20px_rgba(197,160,89,0.2)]" 
                : "bg-white/5 border-white/10 hover:bg-white/10"
            )}
          >
            <div className={cn("p-3 rounded-2xl", emotion.bg, emotion.color)}>
              <emotion.icon size={24} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-gray">{emotion.label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selectedEmotion && activeGuidance ? (
          <motion.div
            key={`${selectedEmotion}-${activeGuidance.ref}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard className="relative p-0 overflow-hidden border-gold/20">
              <div className="bg-gradient-to-br from-gold/10 via-transparent to-transparent p-10">
                <div className="text-center mb-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gold/10 px-5 py-1.5 rounded-full text-[10px] uppercase tracking-[0.3em] text-gold font-bold">
                      Healing for the {selectedEmotion} heart
                    </div>
                    <button 
                      onClick={handleShuffle}
                      className="text-gold hover:text-champagne transition-colors"
                      title="Seek another whisper"
                    >
                      <Sparkles size={18} />
                    </button>
                  </div>
                  <h2 className="arabic-text text-5xl mb-6 text-champagne leading-relaxed">
                    {activeGuidance.ayah}
                  </h2>
                  <p className="text-xl font-serif italic text-ivory leading-relaxed mb-4">
                    "{activeGuidance.trans}"
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold opacity-40">
                    {activeGuidance.ref}
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="relative">
                    <div className="absolute -left-4 top-0 w-1 h-full bg-gold/30 rounded-full"></div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold mb-3 flex items-center gap-2">
                       Reflection
                    </h4>
                    <p className="text-ivory leading-relaxed opacity-80 pl-2">
                      {activeGuidance.tafsir}
                    </p>
                  </div>

                  <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-gold/10 transition-colors" />
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold mb-4 flex items-center gap-2">
                      Healing Dua
                    </h4>
                    <p className="arabic-text text-3xl mb-4 text-champagne text-right leading-loose">
                      {activeGuidance.dua.arabic}
                    </p>
                    <div className="space-y-2">
                       <p className="text-base text-gold font-bold leading-relaxed font-bangla">
                        {activeGuidance.dua.bangla}
                      </p>
                      <p className="text-sm italic text-ivory/60 leading-relaxed">
                        "{activeGuidance.dua.trans}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <button className="text-[10px] uppercase tracking-widest text-slate-gray font-bold hover:text-gold transition-colors flex items-center gap-2 group">
                    <Sparkles size={16} className="group-hover:animate-pulse" /> Save to Favorites
                  </button>
                  <button 
                    onClick={handleShare}
                    disabled={isSharing || shareSuccess}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
                      shareSuccess 
                        ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-green-500/10" 
                        : "bg-gold text-midnight hover:scale-[1.02] shadow-gold/20"
                    )}
                  >
                    {isSharing ? "Sending..." : shareSuccess ? <>Shared with Spouse <CheckCircle2 size={16} /></> : <>Share frequency with Spouse <Share2 size={16} /></>}
                  </button>
                </div>
              </div>
            </GlassCard>
            <div className="mt-6 flex justify-center">
               <button 
                 onClick={handleShuffle}
                 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold font-bold hover:text-champagne transition-all"
               >
                 Another Whisper <Sparkles size={14} />
               </button>
            </div>
          </motion.div>
        ) : selectedEmotion ? (
          <GlassCard className="text-center py-20 border-white/10" delay={0}>
            <Sparkles className="text-gold mx-auto mb-6 opacity-20" size={48} />
            <p className="text-champagne font-serif italic text-lg capitalize">Infinite patience...</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-gray mt-2 font-bold">Divine guidance is being curated for this state</p>
          </GlassCard>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
