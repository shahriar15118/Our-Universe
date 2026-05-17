import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import React from "react";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function AnimatedButton({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  ...props 
}: AnimatedButtonProps) {
  const variants = {
    primary: "bg-gold text-midnight shadow-[0_0_15px_rgba(197,160,89,0.3)] hover:shadow-gold/40",
    secondary: "bg-white/5 backdrop-blur-md text-ivory border border-white/10 hover:bg-white/10",
    ghost: "bg-transparent text-slate-gray hover:text-ivory hover:bg-white/5",
    outline: "bg-transparent border border-gold/40 text-gold hover:bg-gold/10"
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px] uppercase tracking-widest font-bold",
    md: "px-6 py-3 text-xs uppercase tracking-widest font-bold",
    lg: "px-8 py-4 text-sm uppercase tracking-widest font-bold"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-gold/30",
        variants[variant],
        sizes[size],
        className
      )}

      {...props}
    >
      {children}
    </motion.button>
  );
}
