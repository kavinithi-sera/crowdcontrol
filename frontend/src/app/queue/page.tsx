"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface QueueHistory {
  value: number;
}

interface QueuePoint {
  id: string;
  name: string;
  type: "food" | "merch" | "restroom" | "medical";
  current_queue_length: number;
  service_rate_per_min: number;
  predicted_wait_minutes: number;
  historical_avg_wait: number;
  trend_direction: "increasing" | "decreasing" | "stable";
  history_data: QueueHistory[];
}

export default function QueuePage() {
  const [queues, setQueues] = useState<QueuePoint[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "food" | "merch" | "restroom">("all");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Initial fetch
    fetch("http://localhost:8000/api/queues")
      .then(res => res.json())
      .then(data => {
        setQueues(data.queues);
        setLastUpdate(new Date());
      })
      .catch(err => console.error("Failed to load initial queues:", err));

    // Connect WebSocket for live updates
    const ws = new WebSocket("ws://localhost:8000/api/queues/ws");
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.queues) {
        setQueues(data.queues);
        setLastUpdate(new Date(data.timestamp));
      }
    };

    return () => ws.close();
  }, []);

  const filteredQueues = queues.filter(q => activeTab === "all" || q.type === activeTab);

  // Find best choices per category
  const bestChoices = {
    food: [...queues.filter(q => q.type === "food")].sort((a,b) => a.predicted_wait_minutes - b.predicted_wait_minutes)[0]?.id,
    merch: [...queues.filter(q => q.type === "merch")].sort((a,b) => a.predicted_wait_minutes - b.predicted_wait_minutes)[0]?.id,
    restroom: [...queues.filter(q => q.type === "restroom")].sort((a,b) => a.predicted_wait_minutes - b.predicted_wait_minutes)[0]?.id,
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") return <span className="text-destructive font-black">↑ RISING</span>;
    if (trend === "decreasing") return <span className="text-emerald-400 font-black">↓ DROPPING</span>;
    return <span className="text-white/40 font-black">→ STABLE</span>;
  };

  return (
    <div className="min-h-screen mesh-gradient py-32 px-6 pb-32">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
              Queue<span className="text-gradient">Sense AI</span>
            </h1>
            <p className="text-white/40 text-lg max-w-2xl">
              Real-time predictive queuing. Powered by M/M/1 queuing theory and live crowd sensing.
            </p>
          </div>
          {lastUpdate && (
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-white/50 font-medium">Live • Updated {lastUpdate.toLocaleTimeString()}</span>
             </div>
          )}
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-4 custom-scrollbar">
            {["all", "food", "merch", "restroom"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-primary text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]' 
                      : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
            ))}
        </div>

        {queues.length === 0 ? (
          <div className="text-center py-20">
             <div className="inline-block w-16 h-16 border-4 border-white/10 border-t-primary rounded-full animate-spin mb-4"></div>
             <p className="text-white/50 font-medium">Syncing sensor data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredQueues.map((queue) => {
              const isBest = bestChoices[queue.type as keyof typeof bestChoices] === queue.id;
              
              return (
                <div key={queue.id} className={`group glass p-8 rounded-[2rem] border transition-all duration-500 relative overflow-hidden ${isBest ? 'border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:border-emerald-500/60' : 'border-white/5 hover:border-white/20'}`}>
                  
                  {isBest && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
                          Best Choice
                      </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">
                        Type: {queue.type}
                      </div>
                      <h3 className="text-2xl font-bold text-white transition-colors leading-tight">
                        {queue.name}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-5xl font-black tabular-nums tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-white/40 transition-all duration-300">
                        {queue.predicted_wait_minutes}
                      </div>
                      <span className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">
                        Minutes Wait
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Queue length bar */}
                    <div>
                        <div className="flex justify-between text-xs font-medium text-white/40 mb-2">
                            <span>Queue Length: {queue.current_queue_length} pax</span>
                            <span>{getTrendIcon(queue.trend_direction)}</span>
                        </div>
                        <div className="relative h-2 w-full bg-black/50 rounded-full overflow-hidden">
                        <div 
                            className={`absolute inset-y-0 left-0 transition-all duration-1000 rounded-full ${queue.current_queue_length > 30 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, (queue.current_queue_length / 50) * 100)}%` }}
                        ></div>
                        </div>
                    </div>

                    {/* Sparkline */}
                    <div className="h-16 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={queue.history_data}>
                                <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={isBest ? '#10b981' : '#7c3aed'} 
                                    strokeWidth={3} 
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <div className="px-3 py-1.5 rounded-full bg-white/5 text-[10px] font-bold text-white/50 uppercase tracking-tighter">
                        Historical Avg: {queue.historical_avg_wait}m
                      </div>
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        ID: {queue.id}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
