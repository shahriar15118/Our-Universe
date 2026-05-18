import React, { useState } from "react";
import { signup, createOrJoinCouple, signInWithSocial } from "@/src/lib/auth-helpers";
import { AnimatedButton } from "@/src/components/ui/AnimatedButton";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    spouseEmail: "",
    role: "husband" as "husband" | "wife",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSocialSignup = async (provider: 'google') => {
    setLoading(true);
    setError("");
    try {
      await signInWithSocial(provider);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with social provider");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role
      });
      
      if (user) {
        await createOrJoinCouple(user.uid, formData.email, formData.spouseEmail);
      }

      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create your universe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif text-champagne">Our Journey Begins</h1>
          <p className="heading-accent mt-3">Initialize your sacred digital space</p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-4 mb-2">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleSocialSignup('google')}
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-ivory/80 hover:text-gold hover:border-gold/30 transition-all shadow-inner group"
              >
                <span className="font-bold text-xl">G</span>
                <span className="text-xs uppercase tracking-widest font-bold">Sign up with Google</span>
              </motion.button>
            </div>
            
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[10px] uppercase tracking-widest text-slate-gray">or continue with email</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-gray mb-3 font-bold">Your Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all font-medium"
                  placeholder="Name"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-gray mb-3 font-bold">Your Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all font-medium"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-gray mb-3 font-bold">Your Spouse's Email</label>
                  <input 
                    type="email" 
                    value={formData.spouseEmail}
                    onChange={(e) => setFormData({...formData, spouseEmail: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all font-medium"
                    placeholder="spouse@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-gray mb-3 font-bold">Choose a Secret Key</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setFormData({...formData, role: 'husband'})}
                className={cn(
                  "flex-1 py-4 rounded-2xl border transition-all text-[10px] uppercase tracking-widest font-bold", 
                  formData.role === 'husband' ? "bg-gold text-midnight border-gold shadow-[0_0_15px_rgba(197,160,89,0.2)]" : "bg-white/5 border-white/10 text-slate-gray"
                )}
              >
                Husband
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, role: 'wife'})}
                className={cn(
                  "flex-1 py-4 rounded-2xl border transition-all text-[10px] uppercase tracking-widest font-bold", 
                  formData.role === 'wife' ? "bg-gold text-midnight border-gold shadow-[0_0_15px_rgba(197,160,89,0.2)]" : "bg-white/5 border-white/10 text-slate-gray"
                )}
              >
                Wife
              </button>
            </div>

            {error && <p className="text-red-400 text-[10px] uppercase tracking-widest text-center">{error}</p>}

            <AnimatedButton disabled={loading} className="w-full py-5 mt-4" size="lg">
              {loading ? "Engraving your love..." : "Create Our Universe"}
            </AnimatedButton>
          </form>

          <p className="mt-10 text-center text-xs text-slate-gray uppercase tracking-widest font-medium">
            Already have a space? <Link to="/login" className="text-gold font-bold ml-2">Sign In</Link>
          </p>
          
          <div className="mt-6 pt-6 border-t border-white/5 flex justify-center gap-6">
             <Link to="/privacy" className="text-[9px] uppercase tracking-widest text-slate-gray/60 hover:text-gold transition-colors font-bold">Privacy</Link>
             <Link to="/terms" className="text-[9px] uppercase tracking-widest text-slate-gray/60 hover:text-gold transition-colors font-bold">Terms</Link>
          </div>
        </GlassCard>

      </motion.div>
    </div>
  );
}
