import React, { useState } from "react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { useAuth, useCouple } from "@/src/App";
import { Settings, LogOut, Heart, Calendar, User as UserIcon, Camera, Save } from "lucide-react";
import { auth, db } from "@/src/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { cn } from "@/src/lib/utils";

export default function Profile() {
  const { profile, couple, partner } = useCouple();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: profile?.name || "",
    role: profile?.role || "husband",
    photoUrl: profile?.photoUrl || "",
    weddingDate: couple?.weddingDate || "",
    anniversary: couple?.anniversary || "",
  });

  const handleLogout = () => {
    auth?.signOut();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !db) return;
    setLoading(true);
    setSuccess(false);

    try {
      // Update user profile
      const userRef = doc(db, "users", profile.userId);
      await updateDoc(userRef, {
        name: formData.name,
        role: formData.role,
        photoUrl: formData.photoUrl
      });

      // Update couple data
      if (couple?.id) {
        const coupleRef = doc(db, "couples", couple.id);
        await updateDoc(coupleRef, {
          weddingDate: formData.weddingDate,
          anniversary: formData.anniversary
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 pt-12 max-w-2xl pb-40">
      <header className="text-center mb-10">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="w-full h-full rounded-full border-4 border-gold p-1 shadow-[0_0_20px_rgba(197,160,89,0.2)]">
            <img 
              src={formData.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile?.name}`} 
              alt={profile?.name} 
              className="w-full h-full rounded-full object-cover bg-indigo-deep"
            />
          </div>
          <button className="absolute bottom-0 right-0 w-10 h-10 bg-gold text-midnight rounded-full flex items-center justify-center shadow-lg border-2 border-midnight">
            <Camera size={16} />
          </button>
        </div>
        <h1 className="text-4xl font-serif text-champagne mb-1">{profile?.name}</h1>
        <p className="text-gold text-[10px] uppercase tracking-[0.3em] font-bold">{profile?.role}</p>
      </header>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="space-y-4">
          <h3 className="heading-accent">Personal Essence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-gray font-bold">Your Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-gray font-bold">Your Role</label>
              <div className="flex gap-2">
                {['husband', 'wife'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({...formData, role: r as any})}
                    className={cn(
                      "flex-1 py-4 rounded-2xl text-[10px] uppercase tracking-widest font-bold border transition-all",
                      formData.role === r ? "bg-gold text-midnight border-gold shadow-[0_0_10px_rgba(197,160,89,0.3)]" : "bg-white/5 border-white/10 text-slate-gray"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="heading-accent">Our Sacred Timelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-gray font-bold">Wedding Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                <input 
                  type="date" 
                  value={formData.weddingDate}
                  onChange={(e) => setFormData({...formData, weddingDate: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-ivory outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-gray font-bold">Anniversary Message Date</label>
              <div className="relative">
                <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                <input 
                  type="date" 
                  value={formData.anniversary}
                  onChange={(e) => setFormData({...formData, anniversary: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-ivory outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-gold text-midnight rounded-3xl font-bold uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(197,160,89,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {loading ? "Engraving your choices..." : (
            <>
              {success ? "Eternally Saved" : "Set in Stone"}
              <Save size={18} />
            </>
          )}
        </button>

        <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-deep flex items-center justify-center text-ivory">
                <UserIcon size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-gray font-bold">Partnered with</p>
                <p className="text-sm font-serif text-champagne">{partner?.name || "Your soulmate"}</p>
              </div>
            </div>
            <span className="text-gold text-sm font-bold">Linked</span>
          </div>

          <button 
            type="button"
            onClick={handleLogout}
            className="w-full py-4 text-[10px] uppercase tracking-[0.3em] text-red-400 font-bold hover:bg-red-400/10 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Detach from the Universe
          </button>
        </div>
      </form>
    </div>
  );
}
