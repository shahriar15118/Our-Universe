import React, { useState } from "react";
import { login, signInWithSocial } from "@/src/lib/auth-helpers"; 
import { AnimatedButton } from "@/src/components/ui/AnimatedButton";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { useNavigate, Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { motion } from "motion/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSocialLogin = async (provider: 'google') => {
    setLoading(true);
    setError("");
    try {
      const user = await signInWithSocial(provider);
      
      // If it's a first time login via Social, we might not have a couple yet.
      // The Dashboard will handle redirecting to Profile to complete setup.
      if (user) {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with social provider");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 4 }}
            className="inline-block p-4 rounded-full bg-gold/10 mb-6 border border-gold/20"
          >
            <Heart size={40} className="text-gold" fill="currentColor" />
          </motion.div>
          <h1 className="text-4xl font-serif text-champagne">Our Whisper</h1>
          <p className="heading-accent mt-3">A private universe, built for two</p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-4 mb-2">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-ivory/80 hover:text-gold hover:border-gold/30 transition-all shadow-inner group"
              >
                <span className="font-bold text-xl">G</span>
                <span className="text-xs uppercase tracking-widest font-bold">Sign in with Google</span>
              </motion.button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[10px] uppercase tracking-widest text-slate-gray">or continue with soul key</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-gray mb-3 font-bold">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all font-medium"
                  placeholder="spouse@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-gray mb-3 font-bold">Secret Key</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-[10px] uppercase tracking-widest text-center">{error}</p>}

            <AnimatedButton disabled={loading} className="w-full py-5" size="lg">
              {loading ? "Knocking on the heart..." : "Enter Our Universe"}
            </AnimatedButton>
          </form>

          <p className="mt-10 text-center text-xs text-slate-gray uppercase tracking-widest font-medium">
            Don't have a space yet? <Link to="/signup" className="text-gold font-bold ml-2">Create Ours</Link>
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

