import { NavLink } from "react-router-dom";
import { Home, Heart, BookOpen, Sparkles, User } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function MobileNav() {
  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Heart, label: "Love", path: "/timeline" },
    { icon: BookOpen, label: "Deen", path: "/journey" },
    { icon: Sparkles, label: "Mood", path: "/journal" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-50">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center justify-between shadow-2xl">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              cn(
                "flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-500",
                isActive 
                  ? "bg-gold text-midnight shadow-[0_0_20px_rgba(197,160,89,0.3)] scale-105" 
                  : "text-slate-gray hover:text-ivory"
              )
            }
          >
            <item.icon size={18} />
            <span className={cn("text-[10px] font-bold uppercase tracking-widest hidden md:inline")}>{item.label}</span>
          </NavLink>
        ))}
        
        {/* Profile/Plus action as seen in design */}
        <div className="w-12 h-12 ml-2 rounded-full bg-gradient-to-tr from-gold to-champagne flex items-center justify-center shadow-lg shadow-gold/20 cursor-pointer hover:scale-110 active:scale-95 transition-all text-midnight font-bold text-xl">
          +
        </div>
      </div>
    </nav>

  );
}
