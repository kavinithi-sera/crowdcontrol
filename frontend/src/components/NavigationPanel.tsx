"use client";

import { useState, useEffect } from "react";

interface RouteStep {
  instruction: string;
  zone: string;
  predicted_density_at_arrival?: number;
}

interface CrowdPrediction {
  zone: string;
  predicted_density: number;
  rationale: string;
}

interface StrategicRecommendation {
  suggestion: string;
  rationale: string;
}

interface NavigationAdvice {
  route_steps: RouteStep[];
  estimated_minutes: number;
  congestion_warning: boolean;
  alternative_route?: string;
  crowd_prediction: CrowdPrediction[];
  routing_assessment: {
    bottlenecks: string[];
    flow_conflicts: string;
  };
  strategic_recommendations: StrategicRecommendation[];
}

interface Destination {
  name: string;
  zone: string;
}

import { API_BASE } from "@/config";

export default function NavigationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDest, setSelectedDest] = useState<string>("");
  const [route, setRoute] = useState<NavigationAdvice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avoidCrowds, setAvoidCrowds] = useState(false);
  const [activeTab, setActiveTab] = useState<"steps" | "audit">("steps");

  // Default to Gate A for demo purposes (representing user's actual location)
  const userLocation = "A";

  useEffect(() => {
    fetch(`${API_BASE}/api/navigation/destinations`)
      .then(res => res.json())
      .then(data => setDestinations(data.destinations))
      .catch(err => console.error("Failed to load destinations:", err));
  }, []);

  const handleNavigate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDest) return;

    setIsLoading(true);
    setRoute(null);
    setActiveTab("steps");

    try {
      const response = await fetch(`${API_BASE}/api/navigation/navigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_zone: userLocation,
          to_destination: selectedDest,
          avoid_crowds: avoidCrowds
        })
      });
      const data = await response.json();
      setRoute(data);
    } catch (err) {
      console.error("Navigation failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button to open Navigation */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-24 w-14 h-14 rounded-2xl premium-gradient shadow-[0_0_20px_rgba(124,58,237,0.5)] flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
          aria-label="Open PathFinder"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>
      )}

      {/* Slide-Up Panel Overlay */}
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'} md:inset-x-auto md:bottom-20 md:right-6 md:translate-y-0 ${!isOpen ? 'md:hidden' : ''}`}
      >
        <div className="glass border-t border-white/10 rounded-t-[2rem] shadow-2xl flex flex-col w-full max-h-[120vh] md:w-[420px] md:max-h-[calc(100vh-6rem)] md:rounded-[2rem] md:border md:border-white/10">
          {/* Inner padded container */}
          <div className="flex flex-col flex-1 overflow-hidden p-6 min-h-0">
            {/* Handle bar for mobile */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5 md:hidden"></div>


            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                PathFinder <span className="text-white/30 italic font-medium ml-1">AI</span>
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!route ? (
              <form onSubmit={handleNavigate} className="space-y-6 flex-1 flex flex-col overflow-y-auto pr-2">
                <div>
                  <label className="text-sm font-medium text-white/50 mb-2 block">Where do you want to go?</label>
                  <select
                    value={selectedDest}
                    onChange={(e) => setSelectedDest(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                  >
                    <option value="" disabled className="bg-black text-white/50">Select Destination</option>
                    {destinations.map((dest, i) => (
                      <option key={i} value={dest.zone} className="bg-slate-900">{dest.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white/80">Proactive Avoidance</span>
                    <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">AI Adaptive Routing</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={avoidCrowds} onChange={() => setAvoidCrowds(!avoidCrowds)} />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button type="button" onClick={() => setSelectedDest("F")} className="bg-white/5 border border-white/5 hover:border-primary/50 text-white/70 py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group">
                    <span className="text-lg group-hover:scale-110 transition-transform">🏥</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Medical</span>
                  </button>
                  <button type="button" onClick={() => setSelectedDest("H")} className="bg-white/5 border border-white/5 hover:border-primary/50 text-white/70 py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group">
                    <span className="text-lg group-hover:scale-110 transition-transform">🚻</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Restrooms</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !selectedDest}
                  className="w-full premium-gradient py-4 rounded-xl font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 mt-auto"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Auditing Crowd Flow...
                    </span>
                  ) : (
                    "Initiate Pathfinder"
                  )}
                </button>
              </form>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden min-h-0">

                <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl border border-white/5">
                  <button
                    onClick={() => setActiveTab("steps")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'steps' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
                  >
                    Directions
                  </button>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
                  >
                    AI Audit
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                  {activeTab === "steps" ? (
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="glass flex-1 p-4 rounded-xl border-white/10 text-center">
                          <div className="text-xs font-bold text-white/40 uppercase">Est. Walk</div>
                          <div className="text-3xl font-black text-white mt-1">{route.estimated_minutes} <span className="text-base text-white/50 font-medium">min</span></div>
                        </div>
                        {route.congestion_warning && (
                          <div className="glass flex-1 p-4 rounded-xl border-destructive/30 bg-destructive/10 text-center border animate-pulse">
                            <div className="text-xs font-bold text-destructive uppercase">Peak Flow</div>
                            <div className="text-sm font-medium mt-1">Slower movement</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 pb-20">
                        {route.route_steps.map((step, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[10px] font-black group-hover:bg-primary transition-colors">
                                {idx + 1}
                              </div>
                              {idx < route.route_steps.length - 1 && (
                                <div className="w-px h-full bg-gradient-to-b from-white/10 to-transparent my-1"></div>
                              )}
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 flex-1 border border-white/5 hover:border-primary/20 transition-colors">
                              <div className="text-sm leading-relaxed text-white/90">{step.instruction}</div>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Zone {step.zone}</span>
                                {step.predicted_density_at_arrival && (
                                  <span className="text-[10px] text-white/30 font-bold">Arrival: {step.predicted_density_at_arrival}% cap</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 pb-20">
                      <section>
                        <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Spatial Predictions</h3>
                        <div className="space-y-3">
                          {route.crowd_prediction.map((pred, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-white">Zone {pred.zone}</span>
                                <span className={`text-sm font-black ${pred.predicted_density > 70 ? 'text-destructive' : 'text-emerald-400'}`}>{pred.predicted_density}%</span>
                              </div>
                              <p className="text-xs text-white/40 leading-relaxed">{pred.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Strategic Audit</h3>
                        <div className="glass p-4 rounded-2xl border-white/5 space-y-4">
                          <div>
                            <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Potential Bottlenecks</div>
                            <div className="flex flex-wrap gap-2">
                              {route.routing_assessment.bottlenecks.map((b, i) => (
                                <span key={i} className="px-2 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black uppercase">{b}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Flow Conflicts</div>
                            <p className="text-xs text-white/60 leading-relaxed">{route.routing_assessment.flow_conflicts}</p>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Operational Recs</h3>
                        <div className="space-y-3">
                          {route.strategic_recommendations.map((rec, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-primary/20 bg-primary/5">
                              <div className="text-sm font-bold text-primary mb-1 inline-flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                                {rec.suggestion}
                              </div>
                              <p className="text-xs text-white/50 leading-relaxed">{rec.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 pt-3 pb-1">
                  <button
                    onClick={() => setRoute(null)}
                    className="w-full bg-white/10 text-white font-bold py-3 rounded-2xl hover:bg-white/20 transition-all border border-white/10"
                  >
                    Recalculate Path
                  </button>
                </div>
              </div>
            )}
          </div>{/* /inner padded container */}
        </div>
      </div>
    </>
  );
}
