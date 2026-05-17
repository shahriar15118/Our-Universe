import React, { useState } from "react";
import { motion } from "motion/react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Plus, Camera, MapPin, Calendar, Heart, MessageCircle } from "lucide-react";
import { useCouple } from "@/src/App";
import { cn } from "@/src/lib/utils";

const mockMilestones = [
  { id: '1', title: "Our First Conversation", date: "2023-01-15", emotion: "Soul-stirring", note: "It all started with a simple Salaam. Who knew those words would echo forever?", icon: MessageCircle },
  { id: '2', title: "The Engagement", date: "2023-06-10", emotion: "Destined", note: "The day our families became one. A sacred promise was made.", icon: Heart },
  { id: '3', title: "Our Nikkah", date: "2024-05-17", emotion: "Sacred Union", note: "Completed half our deen together. Alhamdulillah for you.", icon: Heart },
];

export default function Timeline() {
  const { couple } = useCouple();

  return (
    <div className="container mx-auto px-6 pt-12 max-w-2xl relative pb-40">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-champagne mb-2">Our Story</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">A sacred journey throughout time</p>
      </header>

      <div className="relative">
        {/* The Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent" />

        <div className="space-y-12">
          {mockMilestones.map((milestone, index) => (
            <motion.div 
              key={milestone.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-16"
            >
              <div className="absolute left-[-2px] top-10 w-5 h-5 rounded-full bg-indigo-deep border-2 border-gold flex items-center justify-center z-10 shadow-[0_0_15px_rgba(197,160,89,0.5)]">
                <div className="w-1.5 h-1.5 bg-gold rounded-full" />
              </div>

              <GlassCard className="hover:bg-white/[0.07] transition-all cursor-pointer group p-8 border-white/10 hover:border-gold/20">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold bg-gold/10 px-3 py-1.5 rounded-full">
                      {milestone.emotion}
                    </span>
                    <h3 className="text-2xl mt-4 font-serif text-ivory tracking-wide">{milestone.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-[10px] text-slate-gray font-bold uppercase tracking-widest">
                      <Calendar size={12} className="text-gold/50" />
                      {new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-champagne leading-relaxed font-serif opacity-80 mb-6">
                  {milestone.note}
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-ivory/20 group-hover:text-gold/50 group-hover:border-gold/20 transition-all">
                    <milestone.icon size={20} />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-ivory/20 group-hover:text-gold/50 group-hover:border-gold/20 transition-all">
                    <Camera size={20} />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Add New Milestone Floating Button */}
      <button className="fixed bottom-32 right-8 w-16 h-16 bg-gold text-midnight rounded-[24px] shadow-2xl flex items-center justify-center z-50 hover:scale-110 hover:-rotate-12 active:scale-95 transition-all group">
        <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>
    </div>
  );
}
