"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ZoneStatus {
  zone_id: string;
  name: string;
  density_percent: number;
  trend: "increasing" | "decreasing" | "stable";
}

interface CrowdStatus {
  average_density: number;
  total_count: number;
  total_capacity: number;
  zones: ZoneStatus[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const API = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/crowd";
const RECONNECT_DELAY = 3000;

const MODULES = [
  {
    href: "/",
    label: "CrowdLens",
    emoji: "👁️",
    desc: "Real-time zone density heat maps across all stadium sections.",
    color: "from-violet-600/20 to-purple-900/10",
    border: "border-violet-500/30",
    pill: "text-violet-300",
  },
  {
    href: "/map",
    label: "PathFinder",
    emoji: "🗺️",
    desc: "AI-powered routing that avoids bottlenecks and crowded corridors.",
    color: "from-blue-600/20 to-cyan-900/10",
    border: "border-blue-500/30",
    pill: "text-blue-300",
  },
  {
    href: "/queue",
    label: "QueueSense",
    emoji: "⏱️",
    desc: "Live wait-time predictions for food, merch, restrooms & medical.",
    color: "from-amber-600/20 to-orange-900/10",
    border: "border-amber-500/30",
    pill: "text-amber-300",
  },
  {
    href: "/recommendations",
    label: "FanPulse",
    emoji: "⚡",
    desc: "Personalised recommendations based on your interests & live offers.",
    color: "from-emerald-600/20 to-teal-900/10",
    border: "border-emerald-500/30",
    pill: "text-emerald-300",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusConfig(density: number) {
  if (density >= 85) return { label: "HIGH DENSITY", color: "bg-red-500", text: "text-red-300", glow: "shadow-red-500/40", ring: "ring-red-500/30" };
  if (density >= 60) return { label: "MODERATE", color: "bg-amber-400", text: "text-amber-300", glow: "shadow-amber-400/40", ring: "ring-amber-500/30" };
  return { label: "COMFORTABLE", color: "bg-emerald-500", text: "text-emerald-300", glow: "shadow-emerald-500/40", ring: "ring-emerald-500/30" };
}

// ── Chatbot Component ─────────────────────────────────────────────────────────
function Chatbot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hey! 👋 I'm CrowdBot. Ask me anything — where to eat, shortest queue, how to get to your seat fast, or which areas to avoid right now!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "I couldn't reach the server right now — try again in a moment!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-40 right-6 z-50 w-[360px] max-h-[520px] flex flex-col rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
         style={{ background: "rgba(10,14,30,0.95)", backdropFilter: "blur(24px)", border: "1px solid rgba(139,92,246,0.25)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5"
           style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(99,102,241,0.1) 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-lg">🤖</div>
          <div>
            <p className="text-sm font-bold text-white">CrowdBot</p>
            <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-widest">Gemini-Powered · Live Context</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: "340px" }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-violet-600 text-white rounded-br-sm"
                : "bg-white/5 text-white/90 border border-white/8 rounded-bl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask anything about the venue…"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/50 transition-all"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center transition-all active:scale-95"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [status, setStatus]       = useState<CrowdStatus | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [chatOpen, setChatOpen]   = useState(false);
  const [animated, setAnimated]   = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── WebSocket with auto-reconnect ──
  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setStatus({
          average_density: data.average_density,
          total_count: data.total_count,
          total_capacity: data.total_capacity,
          zones: data.zones.map((z: any) => ({
            zone_id: z.zone_id,
            name: z.name,
            density_percent: z.density_percent,
            trend: z.trend,
          })),
        });
        setLastUpdate(new Date().toLocaleTimeString());
      } catch {}
    };

    ws.onclose = () => {
      retryRef.current = setTimeout(connectWS, RECONNECT_DELAY);
    };
    ws.onerror = () => ws.close();
  }, []);

  // Fallback HTTP poll + initial load
  const fetchStatus = useCallback(() => {
    fetch(`${API}/api/crowd/status`)
      .then((r) => r.json())
      .then((d) => {
        setStatus(d);
        setLastUpdate(new Date().toLocaleTimeString());
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStatus();
    connectWS();
    const interval = setInterval(fetchStatus, 8000);
    setTimeout(() => setAnimated(true), 100);
    return () => {
      clearInterval(interval);
      wsRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [fetchStatus, connectWS]);

  const cfg = status ? statusConfig(status.average_density) : null;

  return (
    <div className="min-h-screen mesh-gradient selection:bg-primary/30 pb-36">
      {/* ── Top Nav ── */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 premium-gradient rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-black tracking-tight text-gradient">CrowdControl</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
              <div className={`w-1.5 h-1.5 rounded-full ${lastUpdate ? "bg-emerald-500 animate-pulse" : "bg-white/20"}`} />
              {lastUpdate ? `Live ${lastUpdate}` : "Connecting…"}
            </div>
            <Link href="/admin" className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all">
              Staff Portal
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-28 px-4 max-w-7xl mx-auto">
        {/* ── Hero ── */}
        <section className={`text-center mb-16 transition-all duration-700 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-xs font-semibold text-violet-300 mb-6 animate-float">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            National Stadium · Live Intelligence
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gradient mb-6 leading-tight">
            Your Venue,<br />
            <span style={{ background: "linear-gradient(90deg,#a78bfa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Intelligently Guided
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            Real-time crowd intelligence, AI navigation, and smart recommendations — all in your pocket.
          </p>

          {/* Attendance Counter */}
          {status && (
            <div className="mt-10 inline-flex flex-col items-center gap-1 px-8 py-5 rounded-3xl glass border border-white/8">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Live Attendance</span>
              <span className="text-5xl font-black tabular-nums text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
                {status.total_count.toLocaleString()}
              </span>
              <span className="text-xs text-white/30">
                of {status.total_capacity.toLocaleString()} capacity
              </span>
              <div className="w-full mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${cfg?.color}`}
                  style={{ width: `${Math.min(100, status.average_density)}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* ── Venue Status Banner ── */}
        {cfg && status && (
          <div className={`mb-10 flex items-center gap-4 p-4 rounded-2xl ring-1 ${cfg.ring} transition-all duration-700 ${animated ? "opacity-100" : "opacity-0"}`}
               style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className={`w-3 h-3 rounded-full ${cfg.color} shadow-lg ${cfg.glow} animate-pulse flex-shrink-0`} />
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-white/40">Venue Status</p>
              <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label} — {status.average_density.toFixed(0)}% average density across all zones</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/20 uppercase tracking-widest">Zones at &gt;85%</p>
              <p className="text-lg font-black text-white">
                {status.zones.filter((z) => z.density_percent >= 85).length}
                <span className="text-xs text-white/30 font-normal ml-1">/ {status.zones.length}</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Feature Module Cards ── */}
        <section className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16 transition-all duration-700 delay-200 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {MODULES.map((mod) => (
            <Link
              key={mod.label}
              href={mod.href}
              className={`group relative flex flex-col p-6 rounded-3xl bg-gradient-to-br ${mod.color} border ${mod.border} hover:scale-[1.03] hover:shadow-xl hover:shadow-black/40 transition-all duration-300 cursor-pointer`}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{mod.emoji}</div>
              <h2 className={`text-base font-black mb-1 ${mod.pill}`}>{mod.label}</h2>
              <p className="text-xs text-white/50 leading-relaxed flex-1">{mod.desc}</p>
              <div className={`mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${mod.pill} opacity-70`}>
                Open module
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </section>

        {/* ── Zone Grid ── */}
        {status && (
          <section className={`mb-16 transition-all duration-700 delay-300 ${animated ? "opacity-100" : "opacity-0"}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">Zone Overview</h2>
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{status.zones.length} Zones Active</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {status.zones.map((z) => {
                const c = statusConfig(z.density_percent);
                return (
                  <div key={z.zone_id}
                       className="p-4 rounded-2xl glass border border-white/5 hover:border-white/15 flex flex-col items-center text-center group transition-all duration-200">
                    <span className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-2">Zone {z.zone_id}</span>
                    <div className={`w-12 h-12 rounded-xl mb-2 flex items-center justify-center text-xs font-black text-white transition-all duration-500 ${c.color} shadow-lg ${c.glow}`}>
                      {z.density_percent.toFixed(0)}%
                    </div>
                    <span className={`text-[9px] font-bold ${c.text}`}>{z.trend.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ── Floating Chatbot Button ── */}
      <button
        onClick={() => setChatOpen((o) => !o)}
        id="chatbot-toggle"
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-2xl shadow-2xl shadow-violet-900/40 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ background: "linear-gradient(135deg,#7c3aed,#6366f1)" }}
        aria-label="Open CrowdBot Assistant"
      >
        {chatOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-2xl ring-2 ring-violet-500/50 animate-ping opacity-40 pointer-events-none" />
      </button>

      {chatOpen && <Chatbot onClose={() => setChatOpen(false)} />}
    </div>
  );
}
