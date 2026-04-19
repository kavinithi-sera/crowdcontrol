"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "@/config";

interface FanProfile {
  current_zone: string;
  dietary_preferences: string[];
  interests: string[];
  time_available_minutes: number;
}

interface Recommendation {
  type: "Food" | "Merch" | "Experience" | "Restroom";
  title: string;
  description: string;
  zone: string;
  estimated_wait: number;
  why_recommended: string;
  urgency_label: "Act Now" | "Good Time" | "Anytime";
}

const EMOJIS = {
  Food: "🍔",
  Merch: "👕",
  Experience: "🎉",
  Restroom: "🚻",
};

export default function FanPulsePage() {
  const [step, setStep] = useState<"onboarding" | "loading" | "results">("onboarding");
  const [profile, setProfile] = useState<FanProfile>({
    current_zone: "A",
    dietary_preferences: [],
    interests: [],
    time_available_minutes: 60,
  });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const fetchRecommendations = async (currentProfile: FanProfile) => {
    setStep("loading");
    try {
      const response = await fetch(`${API_BASE}/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentProfile),
      });
      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setActiveCardIndex(0);
      setStep("results");
    } catch (err) {
      console.error(err);
      setStep("onboarding"); // fallback
    }
  };

  const handleNextCard = () => {
    if (activeCardIndex < recommendations.length - 1) {
      setActiveCardIndex((prev) => prev + 1);
    }
  };

  const toggleDiet = (diet: string) => {
    setProfile(p => ({
      ...p,
      dietary_preferences: p.dietary_preferences.includes(diet)
        ? p.dietary_preferences.filter(d => d !== diet)
        : [...p.dietary_preferences, diet]
    }));
  };

  const toggleInterest = (interest: string) => {
    setProfile(p => ({
      ...p,
      interests: p.interests.includes(interest)
        ? p.interests.filter(i => i !== interest)
        : [...p.interests, interest]
    }));
  };

  return (
    <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center p-6 text-white overflow-hidden pb-24">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/40 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full"></div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: ONBOARDING */}
        {step === "onboarding" && (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md z-10"
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black italic tracking-tighter mb-2">FAN<span className="text-primary">PULSE</span></h1>
              <p className="text-white/50 text-sm">Design your ultimate venue experience.</p>
            </div>

            <div className="glass p-8 rounded-[2.5rem] space-y-8 border-white/10 shadow-2xl">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Any Dietary Needs?</h3>
                <div className="flex flex-wrap gap-2">
                  {["Vegan", "Halal", "Gluten-Free"].map(d => (
                    <button 
                      key={d} 
                      onClick={() => toggleDiet(d)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${profile.dietary_preferences.includes(d) ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">I'm looking for...</h3>
                <div className="flex flex-wrap gap-2">
                  {["Food", "Merch", "Experience"].map(i => (
                    <button 
                      key={i} 
                      onClick={() => toggleInterest(i)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${profile.interests.includes(i) ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Time available</h3>
                <div className="flex justify-between items-center bg-white/5 rounded-2xl p-4 border border-white/5">
                  <span className="text-3xl font-black">{profile.time_available_minutes} <span className="text-base text-white/40">min</span></span>
                  <input 
                    type="range" min="15" max="120" step="15" 
                    value={profile.time_available_minutes} 
                    onChange={(e) => setProfile({...profile, time_available_minutes: parseInt(e.target.value)})}
                    className="accent-primary w-1/2"
                  />
                </div>
              </div>

              <button 
                onClick={() => fetchRecommendations(profile)}
                className="w-full premium-gradient py-5 rounded-2xl font-black text-lg tracking-widest uppercase hover:scale-[1.02] transition-transform shadow-xl shadow-primary/20"
              >
                Pulse it
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: LOADING */}
        {step === "loading" && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center z-10"
          >
            <div className="w-24 h-24 relative mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">⚡</div>
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter">READING THE CROWD...</h2>
            <p className="text-white/40 mt-2">Checking queues & specials</p>
          </motion.div>
        )}

        {/* STEP 3: RESULTS */}
        {step === "results" && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm relative h-[550px] z-10"
          >
             <div className="absolute top-[-60px] left-0 right-0 flex justify-between items-center px-2">
                <h2 className="text-xl font-black italic tracking-tighter">FAN<span className="text-primary">PULSE</span></h2>
                <span className="text-xs font-bold text-white/40">{activeCardIndex + 1} OF {recommendations.length}</span>
             </div>

             <div className="relative w-full h-full">
                <AnimatePresence>
                  {recommendations.map((rec, idx) => {
                    if (idx < activeCardIndex) return null;
                    const isActive = idx === activeCardIndex;
                    
                    return (
                      <motion.div
                        key={idx}
                        className={`absolute inset-0 glass rounded-[2.5rem] border overflow-hidden shadow-2xl flex flex-col ${isActive ? 'border-primary/50' : 'border-white/5 opacity-0'}`}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 20, scale: isActive ? 1 : 0.95, zIndex: isActive ? 10 : 0 }}
                        exit={{ opacity: 0, x: -100, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                         <div className="p-8 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                               <div className="text-5xl">{EMOJIS[rec.type] || "🎯"}</div>
                               <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  rec.urgency_label === 'Act Now' ? 'bg-destructive/20 text-destructive border border-destructive/30' : 
                                  rec.urgency_label === 'Good Time' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 
                                  'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                               }`}>
                                  {rec.urgency_label}
                               </div>
                            </div>

                            <h3 className="text-3xl font-black leading-tight mb-2">{rec.title}</h3>
                            <p className="text-white/60 text-sm mb-6">{rec.description}</p>

                            <div className="glass bg-black/40 p-5 rounded-2xl border-white/5 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-xl"></div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Why for you?</div>
                                <p className="text-sm italic text-white/90 font-medium">"{rec.why_recommended}"</p>
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-4">
                               <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center">
                                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Zone</span>
                                  <span className="text-xl font-black">{rec.zone}</span>
                               </div>
                               <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center">
                                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Wait</span>
                                  <span className="text-xl font-black">{rec.estimated_wait} <span className="text-[10px]">min</span></span>
                               </div>
                            </div>
                         </div>
                         
                         {isActive && (
                            <button 
                               onClick={handleNextCard}
                               className="w-full bg-white text-black font-black uppercase tracking-widest py-5 hover:bg-white/90 active:bg-white/80 transition-colors"
                            >
                               {activeCardIndex === recommendations.length - 1 ? 'Done' : 'Next Match'}
                            </button>
                         )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
             </div>

             <button 
               onClick={() => setStep("onboarding")}
               className="mx-auto mt-8 block text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
             >
               Change Preferences
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
