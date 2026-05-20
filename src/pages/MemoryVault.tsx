import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Search, Grid, List, Filter, Heart, Play, Mic, MessageCircle, Calendar, Image as ImageIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useCouple } from "@/src/App";
import { db } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Memory } from "@/src/types";

export default function MemoryVault() {
  const { couple } = useCouple();
  const [memories, setMemories] = useState<Memory[]>([]);
  const categories = ["Memories", "Wedding", "Travel", "Silly", "Sacred"];
  const [activeCategory, setActiveCategory] = useState("Memories");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!couple?.id) return;

    const q = query(
      collection(db, "memories"),
      where("coupleId", "==", couple.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Memory[];
      
      // Sort client-side to avoid index requirement
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMemories(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [couple?.id]);

  const imagesOnly = memories.filter(m => m.mediaUrl);

  return (
    <div className="container mx-auto px-4 pt-12 max-w-2xl pb-32">
      <header className="text-center mb-10">
        <h1 className="text-4xl mb-2 font-serif text-champagne">Memory Vault</h1>
        <p className="text-ivory/60 italic font-serif">Our visual archive of love.</p>
      </header>

      <div className="flex items-center justify-start sm:justify-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2 w-full">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-full text-xs uppercase font-bold tracking-widest transition-all",
              activeCategory === cat ? "bg-gold text-midnight" : "bg-white/5 text-ivory/40"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse text-gold/50 font-serif lowercase tracking-widest text-xs">
          unveiling memories...
        </div>
      ) : imagesOnly.length === 0 ? (
        <div className="text-center py-20 px-8 bg-white/5 border border-white/10 rounded-[32px]">
           <ImageIcon className="mx-auto text-gold/20 mb-4" size={48} />
           <p className="text-ivory/40 font-serif italic">The vault is currently empty. Add photos to our story to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {imagesOnly.map((memory, i) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative"
            >
              <GlassCard className="p-0 aspect-[4/5] relative overflow-hidden border-white/10 hover:border-gold/30 transition-all shadow-xl">
                <img 
                  src={memory.mediaUrl} 
                  alt={memory.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <p className="text-[10px] text-gold/70 mb-1 font-bold">
                    {new Date(memory.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs font-serif text-ivory truncate">{memory.title}</p>
                  <div className="flex items-center justify-between mt-2">
                     <div className="flex items-center gap-1">
                        <Heart size={10} fill="#C5A059" className="text-gold" />
                        <span className="text-[10px] text-ivory/60">{memory.likes?.length || 0}</span>
                     </div>
                     <div className="flex items-center gap-1">
                        <MessageCircle size={10} className="text-ivory/60" />
                        <span className="text-[10px] text-ivory/60">{memory.comments?.length || 0}</span>
                     </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center text-ivory/30 text-[10px] uppercase tracking-[0.2em] animate-pulse">
        Sacred moments preserved in the vault
      </div>
    </div>
  );
}
