"use client";

import { useEffect, useState } from "react";

interface ZoneData {
  zone_id: string;
  name: string;
  capacity: number;
  current_count: number;
  density_percent: number;
  trend: "increasing" | "decreasing" | "stable";
  timestamp: string;
}

interface CrowdSnapshot {
  timestamp: string;
  total_capacity: number;
  total_count: number;
  average_density: number;
  zones: ZoneData[];
}

export default function MapPage() {
  const [snapshot, setSnapshot] = useState<CrowdSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/crowd/snapshot")
      .then((res) => res.json())
      .then((data) => setSnapshot(data))
      .catch((err) => console.error("Failed to fetch initial snapshot:", err));

    const ws = new WebSocket("ws://localhost:8000/ws/crowd");
    
    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSnapshot(data);
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };
    ws.onclose = () => setConnected(false);

    return () => {
      ws.close();
    };
  }, []);

  const getZoneColor = (density: number) => {
    if (density < 40) return "hsl(142.1 70.6% 45.3%)"; // Green
    if (density < 70) return "hsl(47.9 95.8% 53.1%)"; // Yellow
    if (density < 85) return "hsl(24.6 95% 53.1%)"; // Orange
    return "hsl(0 84.2% 60.2%)"; // Red
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") return "↑";
    if (trend === "decreasing") return "↓";
    return "→";
  };

  const generateStadiumArcs = () => {
    const arcs = [];
    const numSlices = 12;
    const cx = 250;
    const cy = 250;
    const rOuter = 220;
    const rInner = 140;

    for (let i = 0; i < numSlices; i++) {
        const zoneId = String.fromCharCode(65 + i);
        const zoneData = snapshot?.zones.find(z => z.zone_id === zoneId);
        
        let startAngle = (i * 360) / numSlices;
        let endAngle = ((i + 1) * 360) / numSlices;
        
        const radStart = (startAngle - 90) * (Math.PI / 180);
        const radEnd = (endAngle - 90) * (Math.PI / 180);

        const x1Outer = cx + rOuter * Math.cos(radStart);
        const y1Outer = cy + rOuter * Math.sin(radStart);
        const x2Outer = cx + rOuter * Math.cos(radEnd);
        const y2Outer = cy + rOuter * Math.sin(radEnd);

        const x1Inner = cx + rInner * Math.cos(radStart);
        const y1Inner = cy + rInner * Math.sin(radStart);
        const x2Inner = cx + rInner * Math.cos(radEnd);
        const y2Inner = cy + rInner * Math.sin(radEnd);

        const d = [
            `M ${x1Outer} ${y1Outer}`,
            `A ${rOuter} ${rOuter} 0 0 1 ${x2Outer} ${y2Outer}`,
            `L ${x2Inner} ${y2Inner}`,
            `A ${rInner} ${rInner} 0 0 0 ${x1Inner} ${y1Inner}`,
            `Z`
        ].join(" ");

        const density = zoneData?.density_percent || 0;
        const color = getZoneColor(density);
        const isPulsing = density > 80 && zoneData?.trend === "increasing";
        const isHovered = hoveredZone === zoneId;

        const midRad = (radStart + radEnd) / 2;
        const labelX = cx + ((rOuter + rInner) / 2) * Math.cos(midRad);
        const labelY = cy + ((rOuter + rInner) / 2) * Math.sin(midRad);

        arcs.push(
            <g 
                key={zoneId} 
                onMouseEnter={() => setHoveredZone(zoneId)}
                onMouseLeave={() => setHoveredZone(null)}
                className={`cursor-pointer transition-all duration-300 ${isPulsing ? 'animate-pulse' : ''}`}
            >
                <path
                    d={d}
                    fill={color}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="1.5"
                    opacity={isHovered ? 1 : 0.7}
                    style={{
                        filter: isHovered ? `drop-shadow(0 0 15px ${color})` : 'none',
                        transition: 'all 0.4s ease'
                    }}
                />
                <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="white"
                    fontSize="16"
                    fontWeight="800"
                    pointerEvents="none"
                    className="select-none"
                >
                    {zoneId}
                </text>
            </g>
        );
    }
    return arcs;
  };

  const hoveredZoneData = hoveredZone ? snapshot?.zones.find(z => z.zone_id === hoveredZone) : null;

  return (
    <main className="min-h-screen mesh-gradient text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'} shadow-[0_0_10px_currentColor]`}></span>
              <span className="text-xs font-bold tracking-widest uppercase text-white/40">{connected ? 'Live Data Stream' : 'Connection Interrupted'}</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gradient">CrowdLens <span className="text-white/20">Spatial Intelligence</span></h1>
          </div>
          
          <div className="glass px-6 py-4 rounded-2xl flex items-center gap-8">
            <div className="text-center">
              <div className="text-xs font-medium text-white/30 uppercase">Average Density</div>
              <div className="text-xl font-bold">{snapshot?.average_density || 0}%</div>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="text-center">
              <div className="text-xs font-medium text-white/30 uppercase">Total Headcount</div>
              <div className="text-xl font-bold text-primary">{snapshot?.total_count || 0}</div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex justify-center relative">
            <div className="relative w-full max-w-[600px] aspect-square">
                <svg viewBox="0 0 500 500" width="100%" height="100%" className="drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <g transform="scale(1, 0.75) translate(0, 80)">
                        <rect x="150" y="180" width="200" height="140" rx="70" fill="rgba(15, 23, 42, 0.5)" stroke="white" strokeWidth="1" strokeDasharray="4 4" opacity="0.2"/>
                        <text x="250" y="250" textAnchor="middle" alignmentBaseline="middle" fill="white" fontSize="20" fontWeight="800" opacity="0.1" className="tracking-widest capitalize">FIELD</text>
                        {snapshot && generateStadiumArcs()}
                    </g>
                </svg>

                {hoveredZoneData && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full glass p-6 rounded-3xl z-30 min-w-[240px] animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold">{hoveredZoneData.name}</h3>
                                <div className="text-primary text-xs font-bold uppercase tracking-wider">Zone {hoveredZoneData.zone_id}</div>
                            </div>
                            <div className={`p-2 rounded-lg bg-white/5 ${hoveredZoneData.trend === 'increasing' ? 'text-destructive' : 'text-emerald-400'}`}>
                                {getTrendIcon(hoveredZoneData.trend)}
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full transition-all duration-1000" 
                                    style={{ 
                                        width: `${hoveredZoneData.density_percent}%`,
                                        backgroundColor: getZoneColor(hoveredZoneData.density_percent)
                                    }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/30 font-medium">Utilization</span>
                                <span className="font-bold">{hoveredZoneData.density_percent}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/30 font-medium">Headcount</span>
                                <span className="font-bold">{hoveredZoneData.current_count} / {hoveredZoneData.capacity}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="glass p-8 rounded-[2.5rem]">
                <h2 className="text-2xl font-bold mb-8">Spatial Legend</h2>
                <div className="space-y-6">
                    {[
                        { label: "Optimal Flow", range: "0 - 40%", color: "bg-emerald-500", effect: "shadow-emerald-500/20" },
                        { label: "Active Engagement", range: "40 - 70%", color: "bg-yellow-500", effect: "shadow-yellow-500/20" },
                        { label: "High Density", range: "70 - 85%", color: "bg-orange-500", effect: "shadow-orange-500/20" },
                        { label: "Critical Threshold", range: "85 - 100%", color: "bg-destructive", effect: "shadow-destructive/20" }
                    ].map((item, id) => (
                        <div key={id} className="flex items-center justify-between group cursor-default">
                            <div className="flex items-center gap-4">
                                <div className={`w-4 h-4 rounded-full ${item.color} shadow-[0_0_15px_rgba(0,0,0,0.1)] group-hover:scale-125 transition-transform`}></div>
                                <span className="text-white/60 font-medium group-hover:text-white transition-colors">{item.label}</span>
                            </div>
                            <span className="text-sm font-bold text-white/20 tabular-nums">{item.range}</span>
                        </div>
                    ))}
                </div>
                
                <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-sm leading-relaxed text-white/40">
                        <span className="text-primary font-bold">Proactive Alerting:</span> Zones pulsing on the map indicate rapid concentration increase above 80% capacity. Deployment recommended.
                    </p>
                </div>
            </div>

            <button className="w-full py-5 rounded-3xl premium-gradient text-white font-bold text-lg hover:scale-[1.02] transition-transform shadow-2xl shadow-primary/20">
                Generate Full Spatial Report
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
