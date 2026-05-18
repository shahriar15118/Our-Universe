import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Plus, Camera, Calendar, Heart, MessageCircle, X, Send, Image as ImageIcon, MapPin, Sparkles, Edit2, Trash2 } from "lucide-react";
import { useCouple, useAuth } from "@/src/App";
import { cn } from "@/src/lib/utils";
import { db } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, deleteDoc } from "firebase/firestore";
import { Memory } from "@/src/types";
import { useLocation } from "react-router-dom";

const DEMO_STORIES = [
  { title: "Our First Conversation", date: "2023-01-15", emotion: "Soul-stirring", note: "It all started with a simple Salaam. Who knew those words would echo forever?", mediaUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800" },
  { title: "The Engagement", date: "2023-06-10", emotion: "Destined", note: "The day our families became one. A sacred promise was made.", mediaUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800" },
  { title: "Our Nikkah", date: "2024-05-17", emotion: "Sacred Union", note: "Completed half our deen together. Alhamdulillah for you.", mediaUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800" },
];

export default function Timeline() {
  const { user } = useAuth();
  const { couple, profile } = useCouple();
  const [milestones, setMilestones] = useState<Memory[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [filter, setFilter] = useState<string>("All");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    emotion: "Soul-stirring",
    note: "",
    date: new Date().toISOString().split('T')[0],
    image: ""
  });

  const location = useLocation();

  const ISLAMIC_QUOTES = [
    { text: "And We created you in pairs.", source: "Quran 78:8" },
    { text: "Among His signs is that He created for you spouses from among yourselves that you may find tranquility in them; and He placed between you affection and mercy.", source: "Quran 30:21" },
    { text: "The most complete of believers in faith is the one with the best character among them. And the best of you are those who are best to their wives.", source: "Prophet Muhammad (SAW)" },
    { text: "When a husband and wife look at each other with love, Allah looks at both of them with mercy.", source: "Hadith" },
    { text: "Love is the most beautiful thing that can happen between two souls when it's kept within the boundaries of Allah.", source: "Spiritual Reflection" },
    { text: "A successful marriage requires falling in love many times, always with the same person, for the sake of Allah.", source: "Sacred Love" }
  ];

  const dailyQuote = ISLAMIC_QUOTES[new Date().getDate() % ISLAMIC_QUOTES.length];

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'add') {
      setShowAddModal(true);
    }
  }, [location]);

  useEffect(() => {
    if (!couple?.id) return;

    const q = query(
      collection(db, "memories"),
      where("coupleId", "==", couple.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Memory[];
      
      // Sort client-side to avoid index requirement
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMilestones(sorted);
    }, (error) => {
      console.error("Timeline Snapshot Error:", error);
    });

    return () => unsubscribe();
  }, [couple?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size too large (max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit && editingMilestone) {
          setEditingMilestone({ ...editingMilestone, mediaUrl: reader.result as string });
        } else {
          setFormData({ ...formData, image: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couple?.id || !user?.uid) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "memories"), {
        coupleId: couple.id,
        authorId: user.uid,
        type: 'milestone',
        title: formData.title,
        emotion: formData.emotion,
        caption: formData.note,
        date: formData.date,
        mediaUrl: formData.image,
        tags: [],
        likes: [],
        isLocked: false,
        comments: [],
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setFormData({
        title: "",
        emotion: "Soul-stirring",
        note: "",
        date: new Date().toISOString().split('T')[0],
        image: ""
      });
    } catch (error) {
      console.error("Error adding story:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone || !db) return;

    setLoading(true);
    try {
      const memoryRef = doc(db, "memories", editingMilestone.id);
      await updateDoc(memoryRef, {
        title: editingMilestone.title,
        emotion: editingMilestone.emotion,
        caption: editingMilestone.caption,
        date: editingMilestone.date,
        mediaUrl: editingMilestone.mediaUrl || ""
      });
      setEditingMilestone(null);
    } catch (error) {
      console.error("Error updating story:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm("Are you sure you want to erase this memory from our history?")) return;
    try {
      await deleteDoc(doc(db, "memories", id));
    } catch (error) {
      console.error("Error deleting story:", error);
    }
  };

  const seedDemoStories = async () => {
    if (!couple?.id || !user?.uid) return;
    setLoading(true);
    try {
      for (const demo of DEMO_STORIES) {
        await addDoc(collection(db, "memories"), {
          coupleId: couple.id,
          authorId: user.uid,
          type: 'milestone',
          title: demo.title,
          emotion: demo.emotion,
          caption: demo.note,
          date: demo.date,
          mediaUrl: demo.mediaUrl,
          tags: [],
          likes: [],
          isLocked: false,
          comments: [],
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error seeding stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (memoryId: string) => {
    const text = commentText[memoryId];
    if (!text?.trim() || !user?.uid || !profile?.name) return;

    try {
      const memoryRef = doc(db, "memories", memoryId);
      await updateDoc(memoryRef, {
        comments: arrayUnion({
          userId: user.uid,
          userName: profile.name,
          text: text.trim(),
          createdAt: new Date().toISOString()
        })
      });
      setCommentText({ ...commentText, [memoryId]: "" });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const filteredMilestones = milestones.filter(m => 
    filter === "All" || m.emotion === filter
  );

  return (
    <div className="container mx-auto px-6 pt-12 max-w-2xl relative pb-40">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif text-champagne mb-2">Our Story</h1>
          <p className="text-ivory/60 font-serif italic text-lg leading-relaxed">The chronological archive of our predestined journey.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="hidden sm:flex items-center gap-3 px-6 py-4 bg-gold text-midnight rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gold/20"
        >
          <Plus size={18} strokeWidth={3} /> Add Milestone
        </button>
      </header>

      {/* Daily Inspiration Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 relative group"
      >
        <GlassCard className="p-8 border-gold/20 bg-gold/[0.03] overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
             <Sparkles size={80} className="text-gold" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
                <Heart size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-[10px] uppercase font-black tracking-[0.3em] text-gold">Sacred Reflection</h2>
                <p className="text-[9px] uppercase tracking-widest text-slate-gray font-bold">Daily Guidance for our SoulSync</p>
              </div>
            </div>
            
            <div className="space-y-4 pt-2">
              <p className="text-xl md:text-2xl font-serif text-ivory/90 leading-snug italic italic-serif">
                "{dailyQuote.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gold/10" />
                <span className="text-[9px] uppercase tracking-[0.2em] text-gold font-black bg-gold/5 px-3 py-1.5 rounded-full border border-gold/10">
                  {dailyQuote.source}
                </span>
                <div className="h-px flex-1 bg-gold/10" />
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="mb-12 flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
        {["All", "Soul-stirring", "Destined", "Sacred Union", "Peaceful", "Infinite"].map((emo) => (
          <button
            key={emo}
            onClick={() => setFilter(emo)}
            className={cn(
              "px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all whitespace-nowrap border",
              filter === emo
                ? "bg-gold text-midnight border-gold shadow-lg shadow-gold/20"
                : "bg-white/5 text-slate-gray border-white/10 hover:border-gold/30 hover:text-ivory"
            )}
          >
            {emo}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent" />

        <div className="space-y-12">
          {filteredMilestones.length === 0 && !loading && (
            <div className="pl-16 py-12 space-y-6">
              <p className="text-ivory/40 font-serif italic text-lg">
                {filter === "All" ? "No sacred milestones recorded yet." : `No milestones found for the "${filter}" frequency.`}
              </p>
              {filter === "All" && (
                <button 
                  onClick={seedDemoStories}
                  className="px-6 py-3 bg-gold/10 border border-gold/30 rounded-2xl text-gold text-xs uppercase tracking-widest font-black hover:bg-gold/20 transition-all flex items-center gap-3"
                >
                  <Sparkles size={16} />
                  Seed with Demo Stories
                </button>
              )}
            </div>
          )}

          {filteredMilestones.map((milestone, index) => (
            <motion.div 
              key={milestone.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-16"
            >
              <div className="absolute left-[-2px] top-10 w-5 h-5 rounded-full bg-indigo-deep border-2 border-gold flex items-center justify-center z-10 shadow-[0_0_15px_rgba(197,160,89,0.5)]">
                <div className="w-1.5 h-1.5 bg-gold rounded-full" />
              </div>

              <GlassCard className="hover:bg-white/[0.07] transition-all group p-8 border-white/10 hover:border-gold/20 flex flex-col gap-6 relative">
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingMilestone(milestone)}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg text-gold/60 hover:text-gold hover:bg-gold/10 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteStory(milestone.id)}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold bg-gold/10 px-3 py-1.5 rounded-full">
                      {milestone.emotion}
                    </span>
                    <h3 className="text-2xl mt-4 font-serif text-ivory tracking-wide">{milestone.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-[10px] text-slate-gray font-bold uppercase tracking-widest">
                      <Calendar size={12} className="text-gold/50" />
                      {new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {milestone.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video relative group/img">
                    <img src={milestone.mediaUrl} alt="Memory" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 to-transparent" />
                  </div>
                )}

                <p className="text-sm text-champagne leading-relaxed font-serif opacity-80">
                  {milestone.caption}
                </p>

                {/* Comments Section */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  {milestone.comments?.map((comment, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-gold font-black">{comment.userName}</span>
                        <span className="text-[8px] text-slate-gray">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-ivory/70 font-serif">{comment.text}</p>
                    </div>
                  ))}

                  <div className="relative mt-2">
                    <input 
                      type="text" 
                      placeholder="Add a sacred reflection..."
                      value={commentText[milestone.id] || ""}
                      onChange={(e) => setCommentText({...commentText, [milestone.id]: e.target.value})}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(milestone.id)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-ivory outline-none focus:border-gold/30 pr-12 transition-all"
                    />
                    <button 
                      onClick={() => handleAddComment(milestone.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gold/40 hover:text-gold transition-colors"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Add New Milestone Floating Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-32 right-8 w-16 h-16 bg-gold text-midnight rounded-[24px] shadow-2xl flex items-center justify-center z-50 hover:scale-110 hover:-rotate-12 active:scale-95 transition-all group"
      >
        <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>

      {/* Add Milestone Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-midnight/90 backdrop-blur-xl">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="w-full max-w-lg"
             >
               <GlassCard className="p-8 border-gold/30">
                 <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-serif text-ivory">New Sacred Milestone</h2>
                   <button onClick={() => setShowAddModal(false)} className="text-slate-gray hover:text-ivory"><X size={24} /></button>
                 </div>

                 <form onSubmit={handleAddStory} className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] uppercase tracking-widest text-gold font-bold">Event Title</label>
                     <input 
                       required
                       type="text" 
                       value={formData.title}
                       onChange={(e) => setFormData({...formData, title: e.target.value})}
                       placeholder="e.g., The Afternoon Under the Banyan Tree"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory outline-none focus:ring-2 focus:ring-gold/30"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gold font-bold">Sacred Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={16} />
                          <input 
                            required
                            type="date" 
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-ivory outline-none focus:ring-2 focus:ring-gold/30"
                          />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gold font-bold">Emotional Tone</label>
                        <select 
                          value={formData.emotion}
                          onChange={(e) => setFormData({...formData, emotion: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory outline-none focus:ring-2 focus:ring-gold/30 appearance-none"
                        >
                          <option value="Soul-stirring">Soul-stirring</option>
                          <option value="Destined">Destined</option>
                          <option value="Sacred Union">Sacred Union</option>
                          <option value="Peaceful">Peaceful</option>
                          <option value="Infinite">Infinite</option>
                        </select>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] uppercase tracking-widest text-gold font-bold">The Memory</label>
                     <textarea 
                       required
                       rows={4}
                       value={formData.note}
                       onChange={(e) => setFormData({...formData, note: e.target.value})}
                       placeholder="Capture the essence of this moment..."
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory outline-none focus:ring-2 focus:ring-gold/30 resize-none"
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] uppercase tracking-widest text-gold font-bold">Visual Evidence</label>
                     <div className="relative">
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={(e) => handleFileChange(e)}
                          className="hidden" 
                          accept="image/*"
                        />
                        {formData.image ? (
                          <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/10">
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, image: ""})}
                              className="absolute top-2 right-2 p-2 bg-midnight/80 text-white rounded-full hover:bg-red-500/80"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-12 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center gap-3 text-slate-gray hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all"
                          >
                            <ImageIcon size={32} />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Upload a Glimpse of the Past</span>
                          </button>
                        )}
                     </div>
                   </div>

                   <button 
                     type="submit"
                     disabled={loading}
                     className="w-full py-5 bg-gold text-midnight rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_10px_30px_rgba(197,160,89,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                   >
                     {loading ? "Etching in Universe..." : "Preserve this Memory"}
                     <Sparkles size={16} />
                   </button>
                 </form>
               </GlassCard>
             </motion.div>
          </div>
        )}

        {/* Edit Milestone Modal */}
        {editingMilestone && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-midnight/90 backdrop-blur-xl">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="w-full max-w-lg"
             >
               <GlassCard className="p-8 border-gold/30">
                 <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-serif text-ivory">Update Memory</h2>
                   <button onClick={() => setEditingMilestone(null)} className="text-slate-gray hover:text-ivory"><X size={24} /></button>
                 </div>

                 <form onSubmit={handleUpdateStory} className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] uppercase tracking-widest text-gold font-bold">Event Title</label>
                     <input 
                       required
                       type="text" 
                       value={editingMilestone.title}
                       onChange={(e) => setEditingMilestone({...editingMilestone, title: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory outline-none focus:ring-2 focus:ring-gold/30"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gold font-bold">Sacred Date</label>
                        <input 
                          required
                          type="date" 
                          value={editingMilestone.date}
                          onChange={(e) => setEditingMilestone({...editingMilestone, date: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory outline-none focus:ring-2 focus:ring-gold/30"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gold font-bold">Emotional Tone</label>
                        <select 
                          value={editingMilestone.emotion}
                          onChange={(e) => setEditingMilestone({...editingMilestone, emotion: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory outline-none focus:ring-2 focus:ring-gold/30"
                        >
                          <option value="Soul-stirring">Soul-stirring</option>
                          <option value="Destined">Destined</option>
                          <option value="Sacred Union">Sacred Union</option>
                          <option value="Peaceful">Peaceful</option>
                          <option value="Infinite">Infinite</option>
                        </select>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] uppercase tracking-widest text-gold font-bold">The Memory</label>
                     <textarea 
                       required
                       rows={4}
                       value={editingMilestone.caption}
                       onChange={(e) => setEditingMilestone({...editingMilestone, caption: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-ivory outline-none focus:ring-2 focus:ring-gold/30 resize-none"
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] uppercase tracking-widest text-gold font-bold">Update Visual</label>
                     <div className="relative">
                        <input 
                          type="file" 
                          ref={editFileInputRef}
                          onChange={(e) => handleFileChange(e, true)}
                          className="hidden" 
                          accept="image/*"
                        />
                        {editingMilestone.mediaUrl ? (
                          <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/10">
                            <img src={editingMilestone.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => setEditingMilestone({...editingMilestone, mediaUrl: ""})}
                              className="absolute top-2 right-2 p-2 bg-midnight/80 text-white rounded-full"
                            >
                              <X size={16} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => editFileInputRef.current?.click()}
                              className="absolute bottom-2 right-2 p-2 bg-gold text-midnight rounded-full"
                            >
                              <Camera size={16} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="w-full py-8 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center gap-2 text-slate-gray"
                          >
                            <ImageIcon size={24} />
                            <span className="text-[10px] uppercase tracking-widest font-bold">Change Image</span>
                          </button>
                        )}
                     </div>
                   </div>

                   <button 
                     type="submit"
                     disabled={loading}
                     className="w-full py-5 bg-gold text-midnight rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                   >
                     {loading ? "Updating..." : "Seal the Update"}
                   </button>
                 </form>
               </GlassCard>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
