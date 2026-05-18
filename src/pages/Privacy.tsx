import React from "react";
import { motion } from "motion/react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Shield, Lock, Eye, ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Shield,
      title: "Data Protection",
      content: "We prioritize the sanctity of your private moments. Your data is encrypted and accessible only to you and your chosen partner. We do not sell or share your personal information with third parties."
    },
    {
      icon: Lock,
      title: "Security Measures",
      content: "We use industry-standard security protocols to protect your memories and spiritual progress. This includes secure Firebase infrastructure and robust authentication methods."
    },
    {
      icon: Eye,
      title: "Information Collection",
      content: "We collect only what is necessary to provide the SoulSync experience: your basic profile information, your spiritual tracking data, and the memories you choose to upload to your shared timeline."
    }
  ];

  return (
    <div className="min-h-screen bg-midnight text-ivory pb-32">
      <div className="max-w-3xl mx-auto px-6 pt-20">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-gray hover:text-gold transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Go Back</span>
        </button>

        <header className="mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20 mb-6">
            <FileText size={32} className="text-gold" />
          </div>
          <h1 className="heading-accent text-4xl md:text-5xl mb-4">Privacy Policy</h1>
          <p className="text-slate-gray text-sm tracking-wide leading-relaxed">
            Your trust is our most sacred commitment. Learn how we protect your digital sanctuary.
          </p>
        </header>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/5 text-gold">
                    <section.icon size={24} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-serif text-champagne">{section.title}</h2>
                    <p className="text-slate-gray text-sm leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <footer className="mt-12 pt-12 border-t border-white/5 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-gray font-bold">
            Last Updated: May 2024
          </p>
        </footer>
      </div>
    </div>
  );
}
