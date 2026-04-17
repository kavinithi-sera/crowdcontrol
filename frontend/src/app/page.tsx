"use client";

import { useState, useEffect } from "react";

interface ZoneData {
  zone_id: string;
  density_percent: number;
  trend: "increasing" | "decreasing" | "stable";
}

export default function Home() {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = () => {
      fetch("http://localhost:8000/api/crowd/status")
        .then(res => res.json())
        .then(data => {
          setZones(data.zones);
          setLastUpdate(new Date().toLocaleTimeString());
        })
        .catch(err => console.error("Failed to fetch crowd status:", err));
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getIntensity = (density: number) => {
    if (density > 80) return "bg-destructive shadow-[0_0_20px_rgba(239,68,68,0.4)]";
    if (density > 50) return "bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]";
    return "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
  };

  return (
    <div className="min-h-screen mesh-gradient selection:bg-primary/30 pb-32">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">CrowdControl</span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
            <div className={`w-2 h-2 rounded-full ${lastUpdate ? 'bg-emerald-500 animate-pulse' : 'bg-white/10'}`}></div>
            {lastUpdate ? `Live: ${lastUpdate}` : 'Connecting...'}
          </div>
        </div>
      </nav>

      <main className="relative pt-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-8 mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 text-xs font-medium text-emerald-400 mb-4 animate-float">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Venue Lens Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gradient max-w-4xl">
            Live Area Intelligence
          </h1>
          
          <p className="text-lg md:text-xl text-white/50 max-w-2xl leading-relaxed">
            Real-time density mapping and flow predictive logic across all campus zones.
          </p>
        </div>

        {/* Live Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-16">
          {zones.map((zone) => (
             <div key={zone.zone_id} className="p-4 rounded-2xl glass border-white/5 flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-all">
                <span className="text-[10px] font-black text-white/30 uppercase mb-2">Zone {zone.zone_id}</span>
                <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center text-xs font-black text-white transition-all duration-500 ${getIntensity(zone.density_percent)}`}>
                   {zone.density_percent}%
                </div>
                <span className="text-[10px] font-bold text-white/50">{zone.trend.toUpperCase()}</span>
             </div>
          ))}
        </div>

        {/* Analytic Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ring-1 ring-white/5 p-8 rounded-[3rem] bg-white/[0.02]">
           <div className="space-y-6">
              <h2 className="text-2xl font-bold">Spatial Distribution</h2>
              <div className="space-y-4">
                 {zones.slice(0, 5).map(z => (
                    <div key={z.zone_id} className="space-y-2">
                       <div className="flex justify-between text-xs font-bold text-white/40 uppercase">
                          <span>Zone {z.zone_id}</span>
                          <span>{z.density_percent}% Capacity</span>
                       </div>
                       <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${z.density_percent > 80 ? 'premium-gradient' : 'bg-white/20'}`}
                            style={{ width: `${z.density_percent}%` }}
                          ></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
           <div className="glass p-8 rounded-[2rem] border-white/5 flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 border border-primary/30">
                 <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Safety Thresholds</h3>
              <p className="text-sm text-white/40 leading-relaxed max-w-xs">
                 All sectors are currently operating within nominal safety parameters. No active evacuations or redirects required.
              </p>
           </div>
        </div>
      </main>
    </div>
  );
}
