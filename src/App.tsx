import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/src/lib/firebase";
import { Couple, UserProfile } from "@/src/types";

// Contexts
const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });
const CoupleContext = createContext<{ 
  couple: Couple | null; 
  profile: UserProfile | null; 
  partner: UserProfile | null;
  loading: boolean;
}>({ couple: null, profile: null, partner: null, loading: true });

export const useAuth = () => useContext(AuthContext);
export const useCouple = () => useContext(CoupleContext);

// Components
import { ParticleBackground } from "@/src/components/ui/ParticleBackground";
import { MobileNav } from "@/src/components/layout/MobileNav";
import { ScrollToTop } from "@/src/components/layout/ScrollToTop";
import { PWAInstallPrompt } from "@/src/components/layout/PWAInstallPrompt";

// Pages (to be created)
const Dashboard = React.lazy(() => import("@/src/pages/Dashboard"));
const Login = React.lazy(() => import("@/src/pages/Login"));
const Signup = React.lazy(() => import("@/src/pages/Signup"));
const EmotionGuide = React.lazy(() => import("@/src/pages/EmotionGuide"));
const Timeline = React.lazy(() => import("@/src/pages/Timeline"));
const MemoryVault = React.lazy(() => import("@/src/pages/MemoryVault"));
const RuhChat = React.lazy(() => import("@/src/pages/RuhChat"));
const Profile = React.lazy(() => import("@/src/pages/Profile"));
const Journey = React.lazy(() => import("@/src/pages/Journey"));
const Journal = React.lazy(() => import("@/src/pages/Journal"));
const Privacy = React.lazy(() => import("@/src/pages/Privacy"));
const Terms = React.lazy(() => import("@/src/pages/Terms"));

// Providers
function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [coupleData, setCoupleData] = useState<{ 
    couple: Couple | null; 
    profile: UserProfile | null;
    partner: UserProfile | null;
    loading: boolean;
  }>({ couple: null, profile: null, partner: null, loading: true });

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setCoupleData(prev => ({ ...prev, loading: false }));
      return;
    }

    setCoupleData(prev => ({ ...prev, loading: true }));

    let unsubCouple: (() => void) | null = null;
    let unsubPartner: (() => void) | null = null;

    // 1. Listen to Profile
    const unsubProfile = onSnapshot(doc(db, "users", user.uid), (profileSnap) => {
      if (!profileSnap.exists()) {
        setCoupleData({ couple: null, profile: null, partner: null, loading: false });
        return;
      }

      const profile = { userId: profileSnap.id, ...profileSnap.data() } as UserProfile;

      if (profile.coupleId) {
        // 2. Listen to Couple (only if not already listening or coupleId changed)
        if (!unsubCouple) {
          unsubCouple = onSnapshot(doc(db, "couples", profile.coupleId), (coupleSnap) => {
            if (!coupleSnap.exists()) {
              setCoupleData(prev => ({ ...prev, couple: null, loading: false }));
              return;
            }

            const couple = { id: coupleSnap.id, ...coupleSnap.data() } as Couple;
            const partnerId = couple.spouseIds.find(id => id !== user.uid);

            if (partnerId) {
              // 3. Listen to Partner
              if (!unsubPartner) {
                unsubPartner = onSnapshot(doc(db, "users", partnerId), (partnerSnap) => {
                  const partner = partnerSnap.exists()
                    ? { userId: partnerSnap.id, ...partnerSnap.data() } as UserProfile
                    : null;
                  
                  // This is a bit of a state nightmare, but let's update everything
                  setCoupleData(prev => ({
                    ...prev,
                    profile,
                    couple,
                    partner,
                    loading: false
                  }));
                });
              } else {
                // Partner ID hasn't changed, but couple data might have
                setCoupleData(prev => ({ ...prev, profile, couple, loading: false }));
              }
            } else {
              if (unsubPartner) { unsubPartner(); unsubPartner = null; }
              setCoupleData(prev => ({ ...prev, profile, couple, partner: null, loading: false }));
            }
          });
        } else {
          // Couple ID hasn't changed, but profile might have
          setCoupleData(prev => ({ ...prev, profile, loading: false }));
        }
      } else {
        if (unsubCouple) { unsubCouple(); unsubCouple = null; }
        if (unsubPartner) { unsubPartner(); unsubPartner = null; }
        setCoupleData({ couple: null, profile, partner: null, loading: false });
      }
    });

    return () => {
      unsubProfile();
      if (unsubCouple) unsubCouple();
      if (unsubPartner) unsubPartner();
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading: authLoading }}>
      <CoupleContext.Provider value={coupleData}>
        {children}
      </CoupleContext.Provider>
    </AuthContext.Provider>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { couple, loading: coupleLoading } = useCouple();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  // If user is logged in but has no couple, redirect to setup or onboarding
  // We'll handle this in the pages themselves for now
  
  return <>{children}</>;
}

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <ScrollToTop />
        <PWAInstallPrompt />
        <div className="min-h-screen flex flex-col">
          <ParticleBackground />
          
          <main className="flex-1 pb-32">
            <React.Suspense fallback={<div className="flex items-center justify-center p-20">Glow of moonlight...</div>}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/timeline" element={<PrivateRoute><Timeline /></PrivateRoute>} />
                <Route path="/vault" element={<PrivateRoute><MemoryVault /></PrivateRoute>} />
                <Route path="/emotion-guide" element={<PrivateRoute><EmotionGuide /></PrivateRoute>} />
                <Route path="/ruh" element={<PrivateRoute><RuhChat /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/journey" element={<PrivateRoute><Journey /></PrivateRoute>} /> 
                <Route path="/journal" element={<PrivateRoute><Journal /></PrivateRoute>} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </React.Suspense>
          </main>

          <AuthWrapperForNav />
        </div>
      </BrowserRouter>
    </Providers>
  );
}

function AuthWrapperForNav() {
  const { user } = useAuth();
  const { couple } = useCouple();
  
  if (user && couple) {
    return <MobileNav />;
  }
  return null;
}
