import React, { useState } from "react";
import { motion } from "motion/react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Search, Grid, List, Filter, Heart, Play, Mic } from "lucide-react";
import { cn } from "@/src/lib/utils";

export default function MemoryVault() {
  const categories = ["Memories", "Wedding", "Travel", "Silly", "Sacred"];
  const [activeCategory, setActiveCategory] = useState("Memories");

  return (
    <div className="container mx-auto px-4 pt-12 max-w-2xl">
      <header className="text-center mb-10">
        <h1 className="text-4xl mb-2">Memory Vault</h1>
        <p className="text-ivory/60 italic font-serif">Our visual archive of love.</p>
      </header>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-full text-xs uppercase font-bold tracking-widest transition-all",
              activeCategory === cat ? "bg-rose-gold text-white" : "bg-white/5 text-ivory/40"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="group relative"
          >
            <GlassCard className="p-0 aspect-[4/5] relative overflow-hidden">
              <img 
                src={`https://picsum.photos/seed/${i + 100}/400/500`} 
                alt="Memory" 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                <p className="text-[10px] text-white/60 mb-1">June 2024</p>
                <p className="text-xs font-medium text-white truncate">The day we saw the sunset...</p>
                <div className="flex items-center justify-between mt-2">
                   <div className="flex items-center gap-1">
                      <Heart size={12} fill="white" className="text-white" />
                      <span className="text-[10px] text-white">12</span>
                   </div>
                   {i % 3 === 0 && <Play size={12} fill="white" />}
                   {i % 4 === 0 && <Mic size={12} fill="white" />}
                </div>
              </div>
            </GlassCard>
            
            {/* Heart hover effect button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-rose-gold/20 p-2 rounded-full backdrop-blur-sm">
                 <Heart size={14} className="text-rose-gold" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 text-center text-ivory/30 text-[10px] uppercase tracking-[0.2em] animate-pulse">
        Scroll to explore our universe
      </div>
    </div>
  );
}
