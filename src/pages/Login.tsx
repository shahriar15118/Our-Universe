import React, { useState, useEffect } from "react";
import { login, signInWithSocial, sendPasswordReset } from "@/src/lib/auth-helpers"; 
import { AnimatedButton } from "@/src/components/ui/AnimatedButton";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Key, Mail, ChevronLeft, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/src/App";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Forgot Password state
  const [view, setView] = useState<'login' | 'forgot-password'>('login');
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError("Please provide your email address");
      return;
    }
    setResetLoading(true);
    setResetError("");
    try {
      await sendPasswordReset(resetEmail);
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.message || "Failed to send reset link. Double check your email address.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-[#0d0a15] to-[#140f26]">
      <motion.div 
        key={view}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          {view === "login" ? (
            <>
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ repeat: Infinity, duration: 4 }}
                className="inline-block p-4 rounded-full bg-gold/10 mb-6 border border-gold/20"
              >
                <Heart size={40} className="text-gold" fill="currentColor" />
              </motion.div>
              <h1 className="text-4xl font-serif text-champagne tracking-wide leading-tight">Our Whisper</h1>
              <p className="heading-accent mt-3">A private universe, built for two</p>
            </>
          ) : (
            <>
              <div className="inline-block p-4 rounded-full bg-gold/10 mb-6 border border-gold/20">
                <Key size={40} className="text-gold animate-pulse" />
              </div>
              <h1 className="text-3xl font-serif text-champagne tracking-wide leading-tight">Reset Secret Key</h1>
              <p className="heading-accent mt-3">Recover your login key through email verification</p>
            </>
          )}
        </div>

        <GlassCard className="p-8">
          {view === "login" ? (
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-4 mb-2">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-ivory/80 hover:text-gold hover:border-gold/30 transition-all shadow-inner group"
                >
                  <span className="font-bold text-xl text-gold group-hover:scale-110 transition-transform">G</span>
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
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-gray font-bold">Secret Key</label>
                    <button 
                      type="button"
                      onClick={() => { setView("forgot-password"); setError(""); setResetSuccess(false); }}
                      className="text-[9px] uppercase tracking-widest text-gold hover:underline transition-colors font-bold"
                    >
                      Forgot Key?
                    </button>
                  </div>
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

              {error && (
                <div className="space-y-3">
                  <p className="text-red-400 text-[10px] uppercase tracking-widest text-center leading-relaxed">{error}</p>
                </div>
              )}

              <AnimatedButton disabled={loading} className="w-full py-5 font-bold uppercase text-xs tracking-wider" size="lg">
                {loading ? "Knocking on the heart..." : "Enter Our Universe"}
              </AnimatedButton>
            </form>
          ) : (
            // Forgot password form layout
            <div className="space-y-6">
              {resetSuccess ? (
                <div className="space-y-6 text-center py-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                    <Mail size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-ivory uppercase tracking-wider">Reset Email Dispatched</h3>
                  <p className="text-xs text-slate-gray leading-relaxed">
                    We have successfully sent a secure password reset email to:
                    <br />
                    <span className="text-gold font-semibold block mt-1 text-sm">{resetEmail}</span>
                  </p>
                  <p className="text-[10px] text-slate-gray/80 leading-relaxed max-w-sm mx-auto">
                    Please open your email inbox (remember to check the Spam folder if not received in 2 minutes) and tap the verification link to choose your new Secret Key. Once done, return here to log in!
                  </p>
                  <div className="pt-4">
                    <AnimatedButton 
                      onClick={() => { setView("login"); setResetSuccess(false); setResetEmail(""); }} 
                      className="w-full py-4 text-xs font-bold uppercase tracking-wider"
                    >
                      Return to Login
                    </AnimatedButton>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-gray mb-3 font-bold">Email Address</label>
                    <input 
                      type="email" 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all font-medium"
                      placeholder="spouse@email.com"
                      required
                    />
                    <p className="text-[10px] text-slate-gray/70 mt-3 leading-relaxed">
                      Enter the email linked to your Couple account. We will send a secure link to reset your Secret Key.
                    </p>
                  </div>

                  {resetError && <p className="text-red-400 text-[10px] uppercase tracking-widest text-center leading-relaxed">{resetError}</p>}

                  <div className="space-y-4">
                    <AnimatedButton disabled={resetLoading} className="w-full py-5 font-bold uppercase text-xs tracking-wider" size="lg">
                      {resetLoading ? "Delivering password-repair link..." : "Send Reset Link via Email"}
                    </AnimatedButton>

                    <button
                      type="button"
                      onClick={() => { setView("login"); setResetError(""); }}
                      className="w-full py-4 rounded-xl border border-white/5 bg-transparent hover:bg-white/5 text-xs text-slate-gray uppercase tracking-widest transition-all font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ChevronLeft size={14} /> Back to Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <p className="mt-10 text-center text-xs text-slate-gray uppercase tracking-widest font-medium">
            Don't have a space yet? <Link to="/signup" className="text-gold font-bold ml-2 hover:underline">Create Ours</Link>
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

