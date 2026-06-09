import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { useAuth, useCouple } from "@/src/App";
import { Settings, LogOut, Heart, Calendar, User as UserIcon, Camera, Save, Upload, Trash2, Copy, Check, Gift, Building2, Smartphone, HeartHandshake, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { auth, db } from "@/src/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { cn } from "@/src/lib/utils";

export default function Profile() {
  const { profile, couple, partner } = useCouple();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [spouseEmail, setSpouseEmail] = useState("");
  const [linkingLoading, setLinkingLoading] = useState(false);
  const userFileRef = useRef<HTMLInputElement>(null);
  const partnerFileRef = useRef<HTMLInputElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Voluntary Support states
  const [supportCopiedText, setSupportCopiedText] = useState<string | null>(null);
  const [customSupportAmount, setCustomSupportAmount] = useState("");
  const [supportMethod, setSupportMethod] = useState<'bank' | 'rocket'>('bank');
  const [showSupportSuccess, setShowSupportSuccess] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderNote, setSenderNote] = useState("");
  const [showSupportAccount, setShowSupportAccount] = useState(false);

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
    partnerPhotoUrl: partner?.photoUrl || couple?.partnerPhotoUrl || "",
  });

  const [hasInitialized, setHasInitialized] = useState(false);

  // Sync formData when data loads for the first time
  React.useEffect(() => {
    if ((profile || couple || partner) && !hasInitialized) {
      setFormData({
        name: profile?.name || "",
        role: profile?.role || "husband",
        photoUrl: profile?.photoUrl || "",
        weddingDate: formatForInput(couple?.weddingDate || ""),
        anniversary: couple?.anniversary || "",
        partnerPhotoUrl: partner?.photoUrl || couple?.partnerPhotoUrl || "",
      });
      if (profile && couple) {
        setHasInitialized(true);
      }
    }
  }, [profile, couple, partner, hasInitialized]);

  const handleLinkSpouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spouseEmail.trim() || !profile || !auth?.currentUser) return;

    setLinkingLoading(true);
    try {
      const { createOrJoinCouple } = await import("@/src/lib/auth-helpers");
      await createOrJoinCouple(profile.userId, profile.email, spouseEmail);
      // Data will refresh via App.tsx snapshots
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to link with spouse");
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'partner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // Increased to 10MB
        alert("Image size is too large (max 10MB). Please use a smaller file.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Resize and compress
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 500px (Plenty for profile pics)
          const MAX_SIZE = 500;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress quality 0.6 for smaller footprint
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          
          // Check if still too large for Firestore (1MB limit)
          if (compressedBase64.length > 1000000) {
            alert("Even after compression, this image is too large. Please try a different one.");
            return;
          }

          setFormData(prev => ({
            ...prev,
            [type === 'user' ? 'photoUrl' : 'partnerPhotoUrl']: compressedBase64
          }));
        };
        img.src = reader.result as string;
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

      // Update couple data
      if (couple?.id) {
        const coupleRef = doc(db, "couples", couple.id);
        const coupleUpdate: any = {
          weddingDate: formData.weddingDate,
          anniversary: formData.anniversary
        };

        // If partner hasn't joined yet, or we want to save a placeholder
        if (!partner || formData.partnerPhotoUrl !== (partner?.photoUrl || couple?.partnerPhotoUrl)) {
          coupleUpdate.partnerPhotoUrl = formData.partnerPhotoUrl;
        }

        await updateDoc(coupleRef, coupleUpdate);
      }

      // Update partner profile image if they exist and it changed
      if (partner?.userId && formData.partnerPhotoUrl !== partner.photoUrl) {
        const partnerRef = doc(db, "users", partner.userId);
        await updateDoc(partnerRef, {
          photoUrl: formData.partnerPhotoUrl
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      alert(`Failed to save changes: ${err.message}`);
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
        {!couple && (
          <GlassCard className="p-8 border-gold/30 bg-gold/5 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="text-gold" size={20} />
              <h3 className="heading-accent m-0 text-ivory">Connect your Universe</h3>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-gray mb-6 font-bold leading-relaxed">
              To unlock full features, enter your spouse's email. If they haven't joined yet, we'll create a space and wait for them. If they have, you'll join their space.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-gray font-bold">Spouse's Email</label>
                <input 
                  type="email" 
                  value={spouseEmail}
                  onChange={(e) => setSpouseEmail(e.target.value)}
                  placeholder="partner@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory outline-none focus:ring-2 focus:ring-gold/30"
                  required
                />
              </div>
              <button 
                type="button"
                onClick={handleLinkSpouse}
                disabled={linkingLoading || !spouseEmail.trim()}
                className="w-full py-4 bg-gold text-midnight rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-gold/20 hover:scale-105 transition-all disabled:opacity-50"
              >
                {linkingLoading ? "Connecting..." : "Initiate Connection"}
              </button>
            </div>
          </GlassCard>
        )}

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
                  src={formData.partnerPhotoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partner?.name || partner?.email || 'Partner'}`} 
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

        {/* Support the Developer Section */}
        <GlassCard className="p-8 border-gold/20 bg-midnight/35 relative overflow-hidden mt-10 transition-all duration-500">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gold/5 rounded-full blur-3xl z-0" />
          
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <HeartHandshake className="text-gold" size={24} />
            <h3 className="heading-accent m-0 text-ivory font-serif text-xl">Support Our Whisper</h3>
          </div>

          <div className="space-y-4 mb-6 relative z-10">
            <p className="text-xs text-slate-gray leading-relaxed">
              <strong>Our Whisper</strong> is a voluntary, privacy-first Islamic digital space focused on nurturing beautiful love (<em>Mawaddah</em>) and mercy (<em>Rahmah</em>) in marriage. Setting up and hosting these continuous digital companions require active upkeep. If this spiritual app, daily companion, and couples' private sanctuary brought ease to your home, you are welcome to support its maintenance.
            </p>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
              <p className="text-[11px] text-gold font-bold italic leading-relaxed text-center">
                “The most beloved deed to Allah is the one which is continuous, even if it is small.” &mdash; Sahih Al-Bukhari
              </p>
              <p className="text-[11px] text-slate-gray italic leading-relaxed text-center">
                “Indeed, charity extinguishes the Lord's anger and wards off an evil death.” &mdash; Sunan At-Tirmidhi
              </p>
            </div>
          </div>

          {/* Humble Toggle Button */}
          <div className="flex justify-center mb-2 relative z-10">
            <button
              type="button"
              onClick={() => {
                setShowSupportAccount(!showSupportAccount);
                setShowSupportSuccess(false);
              }}
              className={cn(
                "py-3 px-6 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2",
                showSupportAccount 
                  ? "bg-white/5 border border-white/10 text-slate-gray hover:text-ivory" 
                  : "bg-gold/10 hover:bg-gold/20 border border-gold/35 text-champagne hover:scale-[1.01]"
              )}
            >
              <Gift size={14} className="text-gold animate-pulse" />
              {showSupportAccount ? "Close Donation Panel" : "Support Voluntary Project (Sadaqah)"}
              {showSupportAccount ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Conditionally Displayed Support Details */}
          {showSupportAccount && (
            <div className="mt-8 pt-6 border-t border-white/5 space-y-6 relative z-10 animate-in fade-in slide-in-from-top-4 duration-500">
              {/* Flexible Sadaqah Input */}
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-gold font-bold flex items-center gap-1.5">
                  <Sparkles size={11} className="text-gold animate-pulse" />
                  Voluntary Contribution Level
                </label>
                <p className="text-[11px] text-slate-gray leading-relaxed">
                  There are no conditions or fixed rules here. Feel free to contribute whatever amount feels right to your heart and is easeful for you, solely for the pleasure of Allah.
                </p>

                {/* Custom Amount */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/60 text-sm font-serif">৳</span>
                  <input
                    type="number"
                    placeholder="Enter support amount in BDT (৳)"
                    value={customSupportAmount}
                    onChange={(e) => {
                      setCustomSupportAmount(e.target.value);
                      setShowSupportSuccess(false);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-8 pr-4 py-3.5 text-ivory text-sm outline-none focus:ring-2 focus:ring-gold/30 placeholder-slate-gray/50"
                  />
                </div>
              </div>

              {/* Developer's Blessings based on input */}
              {customSupportAmount && parseInt(customSupportAmount) > 0 && (
                <div className="p-4 bg-gold/5 border border-gold/15 rounded-2xl animate-in fade-in duration-300">
                  <p className="text-[10px] text-gold font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles size={11} />
                    Our Whisper Team's Du'a for You
                  </p>
                  <p className="text-xs text-ivory/80 italic leading-relaxed">
                    “May Allah accept your beautiful contribution of ৳{customSupportAmount}, write it as a beautiful act of continuous Sadaqah Jariyah for your relationship, and bless you and your partner with Mawaddah, Rahmah, and barakah in this life and the next. Ameen.”
                  </p>
                </div>
              )}

              {/* Payment Method Tabs */}
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-slate-gray font-bold">
                  Select payment method
                </label>
                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setSupportMethod('bank');
                      setShowSupportSuccess(false);
                    }}
                    className={cn(
                      "flex-1 py-3 px-1 rounded-xl text-[10px] uppercase tracking-widest font-black flex items-center justify-center gap-2 transition-all",
                      supportMethod === 'bank' ? "bg-gold text-midnight shadow-md shadow-gold/10" : "text-slate-gray hover:text-ivory"
                    )}
                  >
                    <Building2 size={13} />
                    DBBL Bank Acc
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSupportMethod('rocket');
                      setShowSupportSuccess(false);
                    }}
                    className={cn(
                      "flex-1 py-3 px-1 rounded-xl text-[10px] uppercase tracking-widest font-black flex items-center justify-center gap-2 transition-all",
                      supportMethod === 'rocket' ? "bg-gold text-midnight shadow-md shadow-gold/10" : "text-slate-gray hover:text-ivory"
                    )}
                  >
                    <Smartphone size={13} />
                    Rocket Wallet
                  </button>
                </div>
              </div>

              {/* Details Card */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                {supportMethod === 'bank' ? (
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-gray font-bold">Bank Name</span>
                        <p className="text-xs text-ivory font-semibold mt-0.5">Dutch-Bangla Bank PLC (DBBL)</p>
                      </div>
                    </div>
                    <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-gray font-bold">Account Name</span>
                        <p className="text-xs text-ivory font-semibold mt-0.5">Md Shahriar Rahaman Ayon</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('Md Shahriar Rahaman Ayon');
                          setSupportCopiedText('acc_name');
                          setTimeout(() => setSupportCopiedText(null), 3000);
                        }}
                        className="text-[10px] text-gold hover:text-white flex items-center gap-1 transition-colors mt-1"
                      >
                        {supportCopiedText === 'acc_name' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {supportCopiedText === 'acc_name' ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-gray font-bold">Account Number</span>
                        <p className="text-sm text-gold font-mono font-bold tracking-wider mt-0.5">2771580424155</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('2771580424155');
                          setSupportCopiedText('acc_num');
                          setTimeout(() => setSupportCopiedText(null), 3000);
                        }}
                        className="text-[10px] text-gold hover:text-white flex items-center gap-1 transition-colors mt-1"
                      >
                        {supportCopiedText === 'acc_num' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {supportCopiedText === 'acc_num' ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-gray font-bold">Branch Name</span>
                        <p className="text-xs text-ivory font-semibold mt-0.5">Ashulia Bazar Branch, Dhaka, Bangladesh</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('Ashulia Bazar Branch');
                          setSupportCopiedText('branch');
                          setTimeout(() => setSupportCopiedText(null), 3000);
                        }}
                        className="text-[10px] text-gold hover:text-white flex items-center gap-1 transition-colors mt-1"
                      >
                        {supportCopiedText === 'branch' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {supportCopiedText === 'branch' ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-gray font-bold">Routing Number</span>
                        <p className="text-xs text-ivory font-mono font-semibold mt-0.5">090260275</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('090260275');
                          setSupportCopiedText('routing');
                          setTimeout(() => setSupportCopiedText(null), 3000);
                        }}
                        className="text-[10px] text-gold hover:text-white flex items-center gap-1 transition-colors mt-1"
                      >
                        {supportCopiedText === 'routing' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {supportCopiedText === 'routing' ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-gray font-bold">SWIFT Code</span>
                        <p className="text-xs text-ivory font-mono font-semibold mt-0.5">DBBLBDDH</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('DBBLBDDH');
                          setSupportCopiedText('swift_code');
                          setTimeout(() => setSupportCopiedText(null), 3000);
                        }}
                        className="text-[10px] text-gold hover:text-white flex items-center gap-1 transition-colors mt-1"
                      >
                        {supportCopiedText === 'swift_code' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {supportCopiedText === 'swift_code' ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-gray font-bold">Mobile Financial Service</span>
                        <p className="text-xs text-ivory font-semibold mt-0.5">DBBL Rocket</p>
                      </div>
                    </div>
                    <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-gray font-bold">Rocket Wallet Number</span>
                        <p className="text-sm text-gold font-mono font-bold tracking-wider mt-0.5">018334387294</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('018334387294');
                          setSupportCopiedText('rocket_num');
                          setTimeout(() => setSupportCopiedText(null), 3000);
                        }}
                        className="text-[10px] text-gold hover:text-white flex items-center gap-1 transition-colors mt-1"
                      >
                        {supportCopiedText === 'rocket_num' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {supportCopiedText === 'rocket_num' ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-gray font-bold">Account Type</span>
                        <p className="text-xs text-ivory font-semibold mt-0.5">Personal Wallet (Use "Send Money" / "Cash In")</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sender Notification inputs */}
              <div className="space-y-3 border-t border-white/5 pt-5 mb-5">
                <h4 className="text-[10px] uppercase tracking-widest text-gold font-bold">Bless with dynamic notification</h4>
                <p className="text-[10px] text-slate-gray leading-normal">
                  If you wish to log your contribution, enter your sweet name and custom du'a or reflection below to register on our hearts.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <input
                    type="text"
                    placeholder="Spouse Name(s) e.g., Arif & Lamia"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-xs outline-none focus:ring-1 focus:ring-gold/30 placeholder-slate-gray/50"
                  />
                  <input
                    type="text"
                    placeholder="A warm prayer or recommendation"
                    value={senderNote}
                    onChange={(e) => setSenderNote(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-xs outline-none focus:ring-1 focus:ring-gold/30 placeholder-slate-gray/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSupportSuccess(true);
                  }}
                  className="w-full mt-2 py-3.5 bg-white/5 border border-white/10 hover:border-gold/35 hover:bg-gold/5 text-champagne rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2"
                >
                  <HeartHandshake size={14} className="text-gold" />
                  I have sent support / Sadaqah
                </button>
              </div>

              {/* Thank You Feedback */}
              {showSupportSuccess && (
                <div className="p-5 bg-gold/10 border border-gold rounded-[24px] text-center animate-in zoom-in duration-300 shadow-[0_0_20px_rgba(197,160,89,0.1)]">
                  <h4 className="text-gold font-serif text-lg mb-1.5 flex items-center justify-center gap-2">
                    <Sparkles size={18} className="text-gold animate-bounce" />
                    Jazakallahu Khairan! (جَزَاكَ اللَّهُ خَيْرًا)
                  </h4>
                  <p className="text-xs text-ivory leading-relaxed">
                    {senderName ? `Dearest ${senderName}, may` : "May"} Allah accept your noble contribution as a continuous Sadaqah Jariyah. Your voluntary gesture directly supports keeping these systems alive and comforting for Muslim couples worldwide. You will forever remain in our prayers and quiet devotions. Ameen.
                  </p>
                </div>
              )}
            </div>
          )}
        </GlassCard>

        <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-gold/30 p-0.5 overflow-hidden">
                <img 
                  src={formData.partnerPhotoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${partner?.name || partner?.email || 'Partner'}`} 
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
              <Link to="/privacy" className="text-[9px] uppercase tracking-widest text-slate-gray hover:text-gold transition-colors font-bold">Privacy Policy</Link>
              <Link to="/terms" className="text-[9px] uppercase tracking-widest text-slate-gray hover:text-gold transition-colors font-bold">Terms of Service</Link>
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
