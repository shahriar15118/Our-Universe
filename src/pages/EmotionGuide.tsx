import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Search, Heart, Shield, Sparkles, Wind, CloudRain, Sun, Zap, Moon, BookOpen, Share2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

const emotions = [
  { id: 'happy', label: 'Happy', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'sad', label: 'Sad', icon: CloudRain, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'angry', label: 'Angry', icon: Zap, color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: 'lonely', label: 'Lonely', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'anxious', label: 'Anxious', icon: Wind, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  { id: 'grateful', label: 'Grateful', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { id: 'scared', label: 'Scared', icon: Shield, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'hopeful', label: 'Hopeful', icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
];

const guidanceData: Record<string, any> = {
  happy: {
    ayah: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
    ref: "Ibrahim 14:7",
    trans: "If you are grateful, I will surely increase you.",
    tafsir: "Gratitude is the key to abundance. When you feel joy, returning that thanks to Allah ensures the blessing multiplies.",
    dua: {
      arabic: "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ",
      trans: "All praise is for Allah, by whose favor good things are accomplished."
    }
  },
  sad: {
    ayah: "لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا",
    ref: "At-Tawbah 9:40",
    trans: "Do not grieve; indeed Allah is with us.",
    tafsir: "Allah's presence is most felt when we feel most alone in our sorrow. This was spoken to Abu Bakr (RA) in a moment of fear and sadness.",
    dua: {
      arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",
      trans: "O Allah, I seek refuge in You from anxiety and grief."
    }
  },
  anxious: {
    ayah: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    ref: "Ar-Ra'd 13:28",
    trans: "Unquestionably, by the remembrance of Allah hearts find rest.",
    tafsir: "Anxiety is often a heart seeking its anchor. Dhikr is the anchor that settles the storms of the mind.",
    dua: {
      arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ",
      trans: "O Living, O Sustaining, in Your Mercy I seek relief."
    }
  }
};

export default function EmotionGuide() {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-6 pt-12 max-w-2xl pb-40">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-champagne mb-2">Heart's Compass</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Divine guidance for your soul's state</p>
      </header>

      <div className="grid grid-cols-4 gap-4 mb-12">
        {emotions.map((emotion) => (
          <motion.button
            key={emotion.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedEmotion(emotion.id)}
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
        {selectedEmotion && guidanceData[selectedEmotion] ? (
          <motion.div
            key={selectedEmotion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard className="relative p-0 overflow-hidden border-gold/20">
              <div className="bg-gradient-to-br from-gold/10 via-transparent to-transparent p-10">
                <div className="text-center mb-10">
                  <div className="bg-gold/10 inline-block px-5 py-1.5 rounded-full text-[10px] uppercase tracking-[0.3em] text-gold mb-6 font-bold">
                    Healing for the {selectedEmotion} heart
                  </div>
                  <h2 className="arabic-text text-5xl mb-6 text-champagne leading-relaxed">
                    {guidanceData[selectedEmotion].ayah}
                  </h2>
                  <p className="text-xl font-serif italic text-ivory leading-relaxed mb-4">
                    "{guidanceData[selectedEmotion].trans}"
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold opacity-40">
                    {guidanceData[selectedEmotion].ref}
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="relative">
                    <div className="absolute -left-4 top-0 w-1 h-full bg-gold/30 rounded-full"></div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold mb-3 flex items-center gap-2">
                       Reflection
                    </h4>
                    <p className="text-ivory leading-relaxed opacity-80 pl-2">
                      {guidanceData[selectedEmotion].tafsir}
                    </p>
                  </div>

                  <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-gold/10 transition-colors" />
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold mb-4 flex items-center gap-2">
                      Healing Dua
                    </h4>
                    <p className="arabic-text text-3xl mb-4 text-champagne text-right leading-loose">
                      {guidanceData[selectedEmotion].dua.arabic}
                    </p>
                    <p className="text-sm italic text-ivory/60 leading-relaxed">
                      "{guidanceData[selectedEmotion].dua.trans}"
                    </p>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-white/5 flex justify-between items-center gap-6">
                  <button className="text-[10px] uppercase tracking-widest text-slate-gray font-bold hover:text-gold transition-colors flex items-center gap-2">
                    <Sparkles size={16} /> Save to Favorites
                  </button>
                  <button className="flex-1 bg-gold text-midnight py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-gold/20">
                    Share frequency with Spouse <Share2 size={16} />
                  </button>
                </div>
              </div>
            </GlassCard>
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
