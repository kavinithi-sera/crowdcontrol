"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminZone {
  zone_id: string;
  name: string;
  capacity: number;
  current_count: number;
  density_percent: number;
  trend: "increasing" | "decreasing" | "stable";
  is_closed: boolean;
}

interface AdminQueue {
  id: string;
  name: string;
  type: string;
  current_queue_length: number;
  predicted_wait_minutes: number;
}

interface Alert {
  zone_id: string;
  name: string;
  density: number;
  message: string;
  severity: "warning" | "critical";
}

interface Summary {
  total_count: number;
  total_capacity: number;
  average_density: number;
  closed_zones: string[];
  alert_count: number;
}

interface AdminOverview {
  zones: AdminZone[];
  queues: AdminQueue[];
  alerts: Alert[];
  summary: Summary;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const API = "http://localhost:8000";
const WS_CROWD = "ws://localhost:8000/ws/crowd";
const RECONNECT_DELAY = 3000;

// ── Helpers ───────────────────────────────────────────────────────────────────
function densityColor(d: number, closed: boolean) {
  if (closed) return { bg: "bg-white/10", text: "text-white/30", badge: "bg-white/5 text-white/30 border-white/10" };
  if (d >= 85) return { bg: "bg-red-500/20", text: "text-red-300", badge: "bg-red-500/10 text-red-300 border-red-500/30" };
  if (d >= 60) return { bg: "bg-amber-400/20", text: "text-amber-300", badge: "bg-amber-400/10 text-amber-300 border-amber-500/30" };
  return { bg: "bg-emerald-500/20", text: "text-emerald-300", badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" };
}

function trendIcon(t: string) {
  if (t === "increasing") return "↑";
  if (t === "decreasing") return "↓";
  return "→";
}

// ── Admin Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [data, setData]         = useState<AdminOverview | null>(null);
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [tab, setTab]           = useState<"zones" | "queues" | "alerts">("zones");
  const wsRef   = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/overview`);
      const d: AdminOverview = await res.json();
      setData(d);
      setLastUpdate(new Date().toLocaleTimeString());
      setLoading(false);
    } catch {}
  }, []);

  // WebSocket for live crowd updates → refresh overview
  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_CROWD);
    wsRef.current = ws;
    ws.onmessage = () => fetchOverview();   // re-pull full admin overview on each crowd tick
    ws.onclose   = () => { retryRef.current = setTimeout(connectWS, RECONNECT_DELAY); };
    ws.onerror   = () => ws.close();
  }, [fetchOverview]);

  useEffect(() => {
    fetchOverview();
    connectWS();
    const t = setInterval(fetchOverview, 5000);
    return () => {
      clearInterval(t);
      wsRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [fetchOverview, connectWS]);

  const toggleZone = async (zone_id: string, is_closed: boolean) => {
    setToggling((prev) => new Set(prev).add(zone_id));
    const action = is_closed ? "open" : "close";
    try {
      await fetch(`${API}/api/admin/zones/${zone_id}/${action}`, { method: "POST" });
      await fetchOverview();
    } finally {
      setToggling((prev) => { const n = new Set(prev); n.delete(zone_id); return n; });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-medium">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const avgDensity = summary?.average_density ?? 0;

  return (
    <div className="min-h-screen mesh-gradient pb-10">
      {/* ── Header ── */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
              ←
            </Link>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                 style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>🛡️</div>
            <div>
              <p className="text-sm font-black text-white">Staff Dashboard</p>
              <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-widest">Admin Portal · Real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {summary && summary.alert_count > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-red-300 uppercase tracking-widest">{summary.alert_count} Alert{summary.alert_count > 1 ? "s" : ""}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/30">
              <div className={`w-1.5 h-1.5 rounded-full ${lastUpdate ? "bg-emerald-500 animate-pulse" : "bg-white/20"}`} />
              {lastUpdate ?? "Connecting…"}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 px-4 max-w-7xl mx-auto">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Attendance", value: summary?.total_count.toLocaleString() ?? "—", sub: `of ${summary?.total_capacity.toLocaleString()}`, color: "text-white" },
            { label: "Avg Density", value: `${avgDensity.toFixed(1)}%`, sub: avgDensity >= 85 ? "⚠ Critical" : avgDensity >= 60 ? "Moderate" : "Comfortable", color: avgDensity >= 85 ? "text-red-300" : avgDensity >= 60 ? "text-amber-300" : "text-emerald-300" },
            { label: "Active Alerts", value: String(summary?.alert_count ?? 0), sub: "Zones >85%", color: (summary?.alert_count ?? 0) > 0 ? "text-red-300" : "text-emerald-300" },
            { label: "Closed Zones", value: String(summary?.closed_zones.length ?? 0), sub: "Manual overrides", color: "text-amber-300" },
          ].map((kpi) => (
            <div key={kpi.label} className="p-5 rounded-2xl glass border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{kpi.label}</p>
              <p className={`text-3xl font-black tabular-nums ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-white/30 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-6">
          {(["zones", "queues", "alerts"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                tab === t ? "bg-amber-500/20 border border-amber-500/40 text-amber-300" : "bg-white/5 border border-white/10 text-white/40 hover:text-white/70"
              }`}>
              {t === "alerts" && (data?.alerts.length ?? 0) > 0 ? `${t} (${data!.alerts.length})` : t}
            </button>
          ))}
        </div>

        {/* ── Tab: Zones ── */}
        {tab === "zones" && data && (
          <div className="rounded-3xl overflow-hidden border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Zone Density Table</h2>
              <span className="text-[10px] text-white/25 font-bold">{data.zones.length} zones</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Zone", "Name", "Capacity", "Count", "Density", "Trend", "Status", "Override"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/25">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.zones.map((z, i) => {
                    const c = densityColor(z.density_percent, z.is_closed);
                    const inFlight = toggling.has(z.zone_id);
                    return (
                      <tr key={z.zone_id}
                          className={`border-b border-white/[0.04] transition-colors ${i % 2 === 0 ? "bg-white/[0.01]" : ""} hover:bg-white/[0.03] ${z.is_closed ? "opacity-50" : ""}`}>
                        <td className="px-5 py-3.5">
                          <span className="font-black text-white">{z.zone_id}</span>
                        </td>
                        <td className="px-5 py-3.5 text-white/70 text-xs max-w-[180px] truncate">{z.name}</td>
                        <td className="px-5 py-3.5 text-white/40 tabular-nums">{z.capacity.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-white tabular-nums font-semibold">{z.current_count.toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${z.is_closed ? "bg-white/10" : z.density_percent >= 85 ? "bg-red-500" : z.density_percent >= 60 ? "bg-amber-400" : "bg-emerald-500"}`}
                                   style={{ width: `${z.density_percent}%`, transition: "width 0.8s" }} />
                            </div>
                            <span className={`font-black text-xs ${c.text}`}>{z.density_percent.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`font-bold text-xs ${z.trend === "increasing" ? "text-red-300" : z.trend === "decreasing" ? "text-emerald-300" : "text-white/40"}`}>
                            {trendIcon(z.trend)} {z.trend}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${c.badge}`}>
                            {z.is_closed ? "Closed" : z.density_percent >= 85 ? "Critical" : z.density_percent >= 60 ? "Busy" : "Open"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => toggleZone(z.zone_id, z.is_closed)}
                            disabled={inFlight}
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
                              z.is_closed
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                                : "bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20"
                            }`}
                          >
                            {inFlight ? "…" : z.is_closed ? "Reopen" : "Close Zone"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab: Queues ── */}
        {tab === "queues" && data && (
          <div className="rounded-3xl overflow-hidden border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Queue Status</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {["ID", "Name", "Type", "Queue Length", "Est. Wait"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/25">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.queues.map((q, i) => (
                    <tr key={q.id} className={`border-b border-white/[0.04] ${i % 2 === 0 ? "bg-white/[0.01]" : ""} hover:bg-white/[0.03]`}>
                      <td className="px-5 py-3.5 font-black text-white">{q.id}</td>
                      <td className="px-5 py-3.5 text-white/70 text-xs">{q.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border bg-white/5 border-white/10 text-white/40">
                          {q.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${q.current_queue_length > 40 ? "bg-red-500" : q.current_queue_length > 20 ? "bg-amber-400" : "bg-emerald-500"}`}
                                 style={{ width: `${Math.min(100, (q.current_queue_length / 60) * 100)}%` }} />
                          </div>
                          <span className={`font-black text-xs ${q.current_queue_length > 40 ? "text-red-300" : q.current_queue_length > 20 ? "text-amber-300" : "text-emerald-300"}`}>
                            {q.current_queue_length}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-black ${q.predicted_wait_minutes > 10 ? "text-red-300" : q.predicted_wait_minutes > 5 ? "text-amber-300" : "text-emerald-300"}`}>
                          {q.predicted_wait_minutes.toFixed(1)} min
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab: Alerts ── */}
        {tab === "alerts" && (
          <div className="space-y-3">
            {data?.alerts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-white/40 font-semibold">No active alerts — all zones within safe thresholds.</p>
              </div>
            ) : (
              data?.alerts.map((alert) => (
                <div key={alert.zone_id}
                     className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                       alert.severity === "critical"
                         ? "bg-red-500/5 border-red-500/30"
                         : "bg-amber-400/5 border-amber-500/30"
                     }`}>
                  <span className="text-2xl flex-shrink-0">{alert.severity === "critical" ? "🚨" : "⚠️"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        alert.severity === "critical"
                          ? "bg-red-500/10 border-red-500/30 text-red-300"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      }`}>{alert.severity}</span>
                      <span className="text-xs font-black text-white">Zone {alert.zone_id}</span>
                    </div>
                    <p className="text-sm text-white/70">{alert.message}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-2xl font-black ${alert.severity === "critical" ? "text-red-300" : "text-amber-300"}`}>
                      {alert.density.toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-white/25 uppercase tracking-widest">Density</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
