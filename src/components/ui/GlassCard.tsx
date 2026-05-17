import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/src/lib/utils";
import React from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}

export function GlassCard({ children, className, id, delay = 0, ...props }: GlassCardProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "glass-card p-6 rounded-3xl overflow-hidden relative border border-white/10",
        className
      )}
      {...props}
    >
      {/* Star pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none" style={{
        backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M30 0l2.5 17.5L50 20l-17.5 2.5L30 40l-2.5-17.5L10 20l17.5-2.5z" fill="%23C5A059" fill-opacity="1" fill-rule="evenodd"/%3E%3C/svg%3E')`,
        backgroundSize: '120px 120px'
      }} />

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
