"use client";

import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-12 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="glass backdrop-blur-2xl bg-black/50 border border-white/10 rounded-full p-2 flex justify-between items-center shadow-2xl">
          <a 
            href="/" 
            className={`flex flex-col items-center flex-1 py-2 rounded-full transition-all ${
              pathname === "/" ? "bg-primary/20 border border-primary/30" : "hover:bg-white/5"
            }`}
          >
            <span className={`text-lg mb-1 ${pathname === "/" ? "" : "opacity-50"}`}>📊</span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${
              pathname === "/" ? "text-primary" : "text-white/50"
            }`}>Lens</span>
          </a>
          
          <div className="w-px h-6 bg-white/10"></div>
          
          <a 
            href="/queue" 
            className={`flex flex-col items-center flex-1 py-2 rounded-full transition-all ${
              pathname === "/queue" ? "bg-primary/20 border border-primary/30" : "hover:bg-white/5"
            }`}
          >
            <span className={`text-lg mb-1 ${pathname === "/queue" ? "" : "opacity-50"}`}>⏱️</span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${
              pathname === "/queue" ? "text-primary" : "text-white/50"
            }`}>Queue</span>
          </a>
          
          <div className="w-px h-6 bg-white/10"></div>
          
          <a 
            href="/recommendations" 
            className={`flex flex-col items-center flex-1 py-2 rounded-full transition-all ${
              pathname === "/recommendations" ? "bg-primary/20 border border-primary/30" : "hover:bg-white/5"
            }`}
          >
            <span className={`text-lg mb-1 ${pathname === "/recommendations" ? "" : "opacity-50"}`}>⚡</span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${
              pathname === "/recommendations" ? "text-primary" : "text-white/50"
            }`}>Pulse</span>
          </a>
        </div>
      </div>
    </div>
  );
}
