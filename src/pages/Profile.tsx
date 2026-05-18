import React, { useState, useRef } from "react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { useAuth, useCouple } from "@/src/App";
import { Settings, LogOut, Heart, Calendar, User as UserIcon, Camera, Save, Upload, Trash2 } from "lucide-react";
import { auth, db } from "@/src/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { cn } from "@/src/lib/utils";

export default function Profile() {
  const { profile, couple, partner } = useCouple();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const userFileRef = useRef<HTMLInputElement>(null);
  const partnerFileRef = useRef<HTMLInputElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const formatForInput = (dateStr: string) => {
    if (!dateStr) return "";
    // If it's just a date YYYY-MM-DD, append T00:00
    if (dateStr.length === 10) return `${dateStr}T00:00`;
    return dateStr;
  };

  const [formData, setFormData] = useState({
    name: profile?.name || "",
    role: profile?.role || "husband",
    photoUrl: profile?.photoUrl || "",
    weddingDate: formatForInput(couple?.weddingDate || ""),
    anniversary: couple?.anniversary || "",
    partnerPhotoUrl: partner?.photoUrl || "",
  });

  // Sync formData when data loads
  React.useEffect(() => {
    if (profile || couple || partner) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || profile?.name || "",
        role: prev.role || profile?.role || "husband",
        photoUrl: prev.photoUrl || profile?.photoUrl || "",
        weddingDate: prev.weddingDate || formatForInput(couple?.weddingDate || ""),
        anniversary: prev.anniversary || couple?.anniversary || "",
        partnerPhotoUrl: prev.partnerPhotoUrl || partner?.photoUrl || "",
      }));
    }
  }, [profile, couple, partner]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'partner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Image size is too large (max 5MB). Please use a smaller file.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          [type === 'user' ? 'photoUrl' : 'partnerPhotoUrl']: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    auth?.signOut();
  };

  const handleDeleteAccount = async () => {
    if (!profile || !auth?.currentUser || !db) return;
    
    setDeleteLoading(true);
    try {
      // 1. Delete Firestore User Document
      const userRef = doc(db, "users", profile.userId);
      await updateDoc(userRef, {
        status: 'deleted',
        deletedAt: new Date().toISOString()
      });

      // Note: Real deletion would happen here, but usually we just flag it.
      // If user wants full deletion:
      // await deleteDoc(userRef);

      // 2. Delete Authentication Account
      await auth.currentUser.delete();
      
      // 3. Log out if delete was successful (delete() usually handles logout automatically)
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      if (err.code === 'auth/requires-recent-login') {
        alert("For security reasons, please logout and log back in before deleting your account.");
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
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

      // Update partner profile image if changed
      if (partner?.userId && formData.partnerPhotoUrl !== partner.photoUrl) {
        const partnerRef = doc(db, "users", partner.userId);
        await updateDoc(partnerRef, {
          photoUrl: formData.partnerPhotoUrl
        });
      }

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
          <input 
            type="file" 
            ref={userFileRef} 
            onChange={(e) => handleFileChange(e, 'user')} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            type="button"
            onClick={() => userFileRef.current?.click()}
            className="absolute bottom-0 right-0 w-10 h-10 bg-gold text-midnight rounded-full flex items-center justify-center shadow-lg border-2 border-midnight hover:scale-110 active:scale-95 transition-all"
          >
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
              <label className="text-[10px] uppercase tracking-widest text-slate-gray font-bold">Wedding Date & Time</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                <input 
                  type="datetime-local" 
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

        <div className="space-y-4">
          <h3 className="heading-accent">Partner's Essence</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-[32px]">
              <div className="relative w-20 h-20 shrink-0">
                <img 
                  src={formData.partnerPhotoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partner?.name}`} 
                  alt="Partner Preview" 
                  className="w-full h-full rounded-full object-cover border-2 border-gold/40 shadow-xl bg-indigo-deep"
                />
                <button 
                  type="button"
                  onClick={() => partnerFileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-gold text-midnight rounded-full flex items-center justify-center shadow-md border border-midnight"
                >
                  <Camera size={12} />
                </button>
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-gray font-bold">Partner's Portrait</p>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={partnerFileRef} 
                    onChange={(e) => handleFileChange(e, 'partner')} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <button 
                    type="button"
                    onClick={() => partnerFileRef.current?.click()}
                    className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] uppercase tracking-widest font-black text-ivory hover:bg-gold/10 hover:border-gold/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload size={12} />
                    Choose New
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-gray font-bold">Or Paste Image URL</label>
              <div className="relative">
                <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                <input 
                  type="text" 
                  placeholder="Paste external image URL here"
                  value={formData.partnerPhotoUrl}
                  onChange={(e) => setFormData({...formData, partnerPhotoUrl: e.target.value})}
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
              <div className="w-12 h-12 rounded-full border border-gold/30 p-0.5 overflow-hidden">
                <img 
                  src={formData.partnerPhotoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partner?.name}`} 
                  alt={partner?.name} 
                  className="w-full h-full rounded-full object-cover bg-indigo-deep"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-gray font-bold">Partnered with</p>
                <p className="text-sm font-serif text-champagne">{partner?.name || "Your soulmate"}</p>
                <p className="text-[9px] text-gold/60 lowercase tracking-wider">{partner?.email}</p>
              </div>
            </div>
            <span className="text-gold text-xs font-bold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">Linked</span>
          </div>

          <button 
            type="button"
            onClick={handleLogout}
            className="w-full py-4 text-[10px] uppercase tracking-[0.3em] text-ivory/40 hover:text-ivory font-bold hover:bg-white/5 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Sign Out
          </button>

          <div className="flex flex-col gap-2 mt-4">
            <div className="flex justify-center gap-6">
              <a href="/privacy" className="text-[9px] uppercase tracking-widest text-slate-gray hover:text-gold transition-colors font-bold">Privacy Policy</a>
              <a href="/terms" className="text-[9px] uppercase tracking-widest text-slate-gray hover:text-gold transition-colors font-bold">Terms of Service</a>
            </div>
            <p className="text-center text-[8px] uppercase tracking-[0.4em] text-slate-gray/30 font-black mt-2">Our Whisper • v1.0.0</p>
          </div>

          <div className="mt-8 pt-8 border-t border-red-500/10">
            {!showDeleteConfirm ? (
              <button 
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-4 text-[10px] uppercase tracking-[0.3em] text-red-400/60 hover:text-red-400 font-bold hover:bg-red-400/5 rounded-2xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-400/20"
              >
                <Trash2 size={16} />
                Dissolve this Union Permanently
              </button>
            ) : (
              <div className="flex flex-col gap-3 p-6 bg-red-400/5 border border-red-400/20 rounded-[32px] animate-in fade-in zoom-in duration-300">
                <div className="text-center space-y-2 mb-2">
                  <h4 className="text-red-400 text-xs font-bold uppercase tracking-widest">Are you absolutely sure?</h4>
                  <p className="text-[10px] text-red-400/60 leading-relaxed">
                    This action is final. Your shared journey, streaks, and memories will be lost forever in the void.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-white/5 text-ivory text-[10px] uppercase tracking-widest font-bold rounded-xl hover:bg-white/10 transition-all"
                  >
                    Stay Together
                  </button>
                  <button 
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="flex-1 py-3 bg-red-500/80 hover:bg-red-500 text-white text-[10px] uppercase tracking-widest font-bold rounded-xl shadow-[0_5px_15px_rgba(239,68,68,0.3)] transition-all flex items-center justify-center"
                  >
                    {deleteLoading ? "Dissolving..." : "Confirm Deletion"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
