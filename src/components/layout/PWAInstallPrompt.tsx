import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, X, Smartphone, ArrowDown, Share, Plus } from "lucide-react";
import { GlassCard } from "@/src/components/ui/GlassCard";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "other">("other");

  useEffect(() => {
    // 1. Detect if the app is already running in standalone mode
    const checkStandalone = () => {
      const isSpecStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // @ts-ignore
      const isNavigatorStandalone = window.navigator.standalone === true;
      const isReallyStandalone = isSpecStandalone || isNavigatorStandalone;
      
      setIsStandalone(isReallyStandalone);
      
      if (!isReallyStandalone) {
        // Show after 1.5 seconds for instant high-end responsive feel
        const timer = setTimeout(() => setShowPrompt(true), 1500);
        return () => clearTimeout(timer);
      }
    };

    checkStandalone();

    // 2. Identify Device OS Group
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) {
      setDeviceType("ios");
    } else if (/Android/.test(ua)) {
      setDeviceType("android");
    } else {
      setDeviceType("other");
    }

    // 3. Listen to beforeinstallprompt event for Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deviceType === "ios") {
      // iOS doesn't support programmatic PWA install. Show the sleek pointer guide.
      setShowIosGuide(true);
    } else if (deferredPrompt) {
      // Direct native browser install click (Android / Supported Browsers)
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsStandalone(true);
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // If prompt isn't fired yet but user clicked, show native chrome fallback guide
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      <AnimatePresence>
        {showPrompt && !showIosGuide && (
          <div className="fixed inset-0 bg-midnight/80 backdrop-blur-md flex items-center justify-center p-4 z-[999999]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="w-full max-w-sm"
            >
              <GlassCard className="p-6 border-gold/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-3xl bg-midnight/90 text-center flex flex-col items-center">
                
                {/* Minimalist Top Close Button */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-2 text-slate-gray hover:text-gold hover:bg-white/5 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>

                {/* Minimal App Icon Container */}
                <div className="w-16 h-16 bg-gradient-to-tr from-gold to-champagne rounded-3xl flex items-center justify-center shadow-lg shadow-gold/20 mb-4 mt-2 border border-white/10">
                  <Smartphone className="text-midnight" size={28} />
                </div>

                <h3 className="text-base font-bold text-champagne tracking-wider uppercase font-sans">
                  Whisper Web App
                </h3>
                
                <p className="text-[10px] text-slate-gray leading-relaxed max-w-xs mt-2 px-2">
                  Install this application on your device to access full-screen mode without the browser interface.
                </p>

                {/* Single Big Beautiful Action Button */}
                <div className="w-full mt-6 space-y-2">
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-4 bg-gradient-to-r from-gold to-champagne text-midnight text-xs font-black uppercase tracking-wider rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-gold/25 flex items-center justify-center gap-2"
                  >
                    <Download size={14} className="stroke-[3]" />
                    Install App
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-gray hover:text-gold uppercase tracking-[0.15em] rounded-xl transition-all"
                  >
                    Continue in Web
                  </button>
                </div>

              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* iOS Pointer Guide Overlay — activates only if they try on iPhone */}
      <AnimatePresence>
        {showIosGuide && (
          <div className="fixed inset-0 bg-midnight/90 backdrop-blur-md flex flex-col items-center justify-end md:justify-center p-6 z-[999999]">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: "spring", stiffness: 280, damping: 25 }}
              className="w-full max-w-sm text-center space-y-6 pb-12 md:pb-0"
            >
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative max-w-xs mx-auto">
                <button
                  onClick={() => setShowIosGuide(false)}
                  className="absolute top-3 right-3 p-1 text-slate-gray hover:text-gold rounded-full"
                >
                  <X size={14} />
                </button>
                
                <p className="text-xs text-champagne font-bold leading-relaxed">
                  Tap the share button <span className="inline-flex p-1 bg-white/10 rounded mx-0.5 text-gold align-middle"><Share size={12} /></span> then select <strong className="text-gold">Add to Home Screen</strong> <span className="inline-flex p-1 bg-white/10 rounded mx-0.5 text-gold align-middle"><Plus size={12} /></span> to complete installation.
                </p>
              </div>

              {/* Pointing down to bottom-center address bar/share sheet on Safari */}
              <div className="flex flex-col items-center text-gold animate-bounce mt-4 shrink-0">
                <p className="text-[9px] uppercase tracking-widest font-black mb-1 opacity-75">Tap Safari Menu below</p>
                <ArrowDown size={28} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
