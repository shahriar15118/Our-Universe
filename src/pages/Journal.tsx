import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Sparkles, Heart, Moon, Sun, Cloud, Wind, Zap, Send, Search } from "lucide-react";
import { useAuth, useCouple } from "@/src/App";
import { cn } from "@/src/lib/utils";
import { VerseBank, Verse } from "@/src/lib/verseBank";

const moods = [
  { icon: Sun, label: "Radiant", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { icon: Heart, label: "Loved", color: "text-rose-400", bg: "bg-rose-400/10" },
  { icon: Moon, label: "Peaceful", color: "text-indigo-300", bg: "bg-indigo-300/10" },
  { icon: Cloud, label: "Quiet", color: "text-slate-400", bg: "bg-slate-400/10" },
  { icon: Wind, label: "Restless", color: "text-emerald-300", bg: "bg-emerald-300/10" },
  { icon: Zap, label: "Energetic", color: "text-amber-500", bg: "bg-amber-500/10" },
];

export default function Journal() {
  const { profile, partner } = useCouple();
  const [selectedMoodLabel, setSelectedMoodLabel] = useState<string | null>(null);
  const [activeVerse, setActiveVerse] = useState<Verse | null>(null);
  const [entry, setEntry] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleMoodClick = (label: string) => {
    setSelectedMoodLabel(label);
    const verses = VerseBank[label] || [];
    if (verses.length > 0) {
      const randomIndex = Math.floor(Math.random() * verses.length);
      setActiveVerse(verses[randomIndex]);
    }
  };

  const identifyVerseFromText = async () => {
    if (!entry.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/journal/identify-mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: entry }),
      });
      const data = await response.json();
      if (data.mood && VerseBank[data.mood]) {
        const verses = VerseBank[data.mood];
        const randomIndex = Math.floor(Math.random() * verses.length);
        setActiveVerse(verses[randomIndex]);
        setSelectedMoodLabel(data.mood);
      }
    } catch (error) {
      console.error("Failed to identify mood:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto px-6 pt-12 max-w-2xl pb-40">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-champagne mb-2">Heart's Echo</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Documenting our emotional landscape</p>
      </header>

      <div className="space-y-12">
        <section>
          <h3 className="heading-accent mb-6">How is your heart feeling?</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {moods.map((mood) => (
              <button
                key={mood.label}
                onClick={() => handleMoodClick(mood.label)}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-3xl border transition-all duration-500",
                  selectedMoodLabel === mood.label 
                    ? "bg-white/10 border-gold shadow-[0_0_20px_rgba(197,160,89,0.2)]" 
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <div className={cn("p-3 rounded-2xl", mood.bg, mood.color)}>
                  <mood.icon size={24} />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-gray">{mood.label}</span>
              </button>
            ))}
          </div>
        </section>

        <AnimatePresence mode="wait">
          {activeVerse && (
            <motion.section
              key={activeVerse.ref}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-6"
            >
              <GlassCard className="p-10 border-gold/20 relative overflow-hidden bg-gradient-to-br from-gold/5 via-transparent to-transparent group">
                 <div className="absolute top-4 right-4 text-gold/20 group-hover:text-gold/40 transition-colors">
                    <Sparkles size={24} />
                 </div>
                 <div className="text-center">
                    <h2 className="arabic-text text-4xl mb-8 text-champagne leading-relaxed">
                      {activeVerse.arabic}
                    </h2>
                    
                    <div className="space-y-5 max-w-lg mx-auto">
                      <p className="text-xl font-serif italic text-ivory/90 leading-relaxed tracking-tight group-hover:text-ivory transition-colors">
                        "{activeVerse.english}"
                      </p>
                      
                      <div className="w-12 h-px bg-gold/20 mx-auto"></div>
                      
                      <p className="text-lg font-serif text-gold/80 leading-relaxed font-bangla">
                        "{activeVerse.bangla}"
                      </p>
                      
                      <p className="text-[10px] uppercase tracking-[0.4em] text-slate-gray font-bold pt-4 select-none opacity-60">
                        {activeVerse.ref}
                      </p>
                    </div>
                 </div>
              </GlassCard>
            </motion.section>
          )}
        </AnimatePresence>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="heading-accent">Whisper to the Universe</h3>
            <button 
              onClick={identifyVerseFromText}
              disabled={isAnalyzing || !entry.trim()}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-gold font-bold hover:bg-gold/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search size={12} /> {isAnalyzing ? "Seeking Divine Echo..." : "Find Relevant Verse"}
            </button>
          </div>
          <GlassCard className="p-0 overflow-hidden">
            <textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="If you don't pick a mood, just whisper your thoughts here. We'll find guidance for your heart..."
              className="w-full bg-transparent p-8 min-h-[220px] text-ivory placeholder:text-slate-gray/50 outline-none resize-none font-serif text-lg leading-relaxed focus:bg-white/[0.02] transition-colors"
            />
            <div className="bg-white/5 p-5 flex items-center justify-between border-t border-white/10">
              <div className="flex gap-5 px-4">
                <button className="text-slate-gray hover:text-gold transition-colors"><Sparkles size={18} /></button>
                <button className="text-slate-gray hover:text-gold transition-colors"><Moon size={18} /></button>
              </div>
              <button className="bg-gold text-midnight px-10 py-4 rounded-full font-bold uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-gold/10">
                Safeguard Heart <Send size={16} />
              </button>
            </div>
          </GlassCard>
        </section>

        <section className="pt-8">
          <h3 className="heading-accent mb-6">Partner's Resonance</h3>
          <GlassCard className="p-10 flex items-center gap-8 border-gold/20 cursor-pointer hover:border-gold/40 transition-all">
            <div className="w-20 h-20 rounded-full border-2 border-gold/30 p-1 relative">
              <div className="absolute inset-0 bg-gold/10 rounded-full blur animate-pulse"></div>
              <img 
                src={partner?.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partner?.name}`} 
                alt="Partner" 
                className="w-full h-full rounded-full object-cover bg-indigo-deep opacity-60 relative z-10"
              />
            </div>
            <div>
              <p className="text-lg text-champagne font-serif italic mb-2">
                {partner?.name || "Your soulmate"} hasn't shared their echo today.
              </p>
              <p className="text-[10px] uppercase tracking-[0.4em] text-slate-gray font-bold">Awaiting their frequency...</p>
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}

