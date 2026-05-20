import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Heart, BookOpen, Sparkles, User, X, Plus, Image, Send, Smile } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Heart, label: "Love", path: "/timeline" },
    { icon: BookOpen, label: "Deen", path: "/journey" },
    { icon: Sparkles, label: "Mood", path: "/emotion-guide" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const quickActions = [
    { icon: Smile, label: "Mood", color: "bg-gold/20 text-gold", path: "/emotion-guide" },
    { icon: Image, label: "Milestone", color: "bg-gold/20 text-gold", path: "/timeline?action=add" },
    { icon: Send, label: "Secret", color: "bg-gold/20 text-gold", path: "/dashboard?action=secret" },
  ];

  return (
    <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-50">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-midnight/40 backdrop-blur-sm z-[-1]"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90%] bg-midnight/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-4 flex justify-around items-center shadow-2xl"
            >
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    setIsOpen(false);
                    navigate(action.path);
                  }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={cn("p-4 rounded-2xl transition-all duration-300 group-hover:scale-110", action.color)}>
                    <action.icon size={20} />
                  </div>
                  <span className="text-[8px] uppercase tracking-widest font-black text-ivory/60 group-hover:text-gold transition-colors">{action.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center justify-between shadow-2xl">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => 
              cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-5 sm:py-3 rounded-full transition-all duration-500",
                isActive 
                  ? "bg-gold text-midnight shadow-[0_0_20px_rgba(197,160,89,0.3)] scale-105" 
                  : "text-slate-gray hover:text-ivory"
              )
            }
          >
            <item.icon size={18} />
            <span className={cn("text-[10px] font-bold uppercase tracking-widest hidden lg:inline")}>{item.label}</span>
          </NavLink>
        ))}
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-12 h-12 ml-0.5 sm:ml-2 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 text-midnight font-bold shrink-0",
            isOpen 
              ? "bg-ivory scale-90 rotate-45" 
              : "bg-gradient-to-tr from-gold to-champagne shadow-gold/20 hover:scale-110 active:scale-95"
          )}
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>
    </nav>
  );
}
