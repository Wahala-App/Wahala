"use client";

import React, { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Paperclip, 
  Send 
} from "lucide-react";

// --- TYPES ---
type MockUpdate = {
  id: string;
  author: string;
  initial: string;
  timeAgo: string;
  body: string;
  severity: number;
  hasMedia?: boolean;
  mediaUrls?: string[];
};

// --- MOCK DATA ---
const INCIDENT = {
  id: "demo-1",
  type: "Robbery",
  title: "Armed robbery near Lekki Phase 1 gate",
  description: "Multiple reports of armed robbery targeting cars at the main Lekki Phase 1 gate. Stay away from the area.",
  location: "Lekki Phase 1 Gate, Lagos",
  createdAt: "Today · 8:05 PM",
  authorInitial: "W",
  author: "wahala-reports"
};

const INITIAL_UPDATES: MockUpdate[] = [
  { 
    id: "u3", 
    author: "Samuel", 
    initial: "S", 
    timeAgo: "5 min ago", 
    body: "Police has arrived on scene, traffic building up.", 
    severity: 8, 
    hasMedia: true,
    mediaUrls: ["https://placehold.co/600x400/1a1a1a/white?text=Police+Van"] 
  },
  { 
    id: "u2", 
    author: "Ada", 
    initial: "A", 
    timeAgo: "18 min ago", 
    body: "Saw two men on a bike stopping cars and smashing windows.", 
    severity: 7, 
    hasMedia: false 
  },
  { 
    id: "u1", 
    author: "Chike", 
    initial: "C", 
    timeAgo: "30 min ago", 
    body: "Heard gunshots and screaming near the roundabout.", 
    severity: 9, 
    hasMedia: true,
    mediaUrls: ["https://placehold.co/600x400/1a1a1a/white?text=Traffic+Chaos"] 
  },
];

// --- COMPONENTS ---

function SeverityGauge({ average }: { average: number }) {
  const bars = Math.min(4, Math.max(1, Math.round((average / 10) * 4)));
  
  const getColor = (avg: number) => {
    if (avg <= 3) return "bg-green-500";
    if (avg <= 6) return "bg-yellow-500";
    if (avg <= 8) return "bg-orange-500";
    return "bg-red-500";
  };

  const activeColor = getColor(average);

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/10">
      <span className="text-[10px] font-bold tracking-wider text-white/60">SEVERITY</span>
      <div className="flex items-end gap-[3px] h-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-[3px] rounded-sm transition-all duration-300 ${
              i <= bars ? activeColor : "bg-white/10"
            }`}
            style={{ height: `${6 + i * 4}px` }}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono text-white/60">{average.toFixed(1)}/10</span>
    </div>
  );
}

export default function IncidentFeedPage() {
  const router = useRouter();
  const [updates, setUpdates] = useState(INITIAL_UPDATES);
  const [inputValue, setInputValue] = useState("");
  const updatesEndRef = useRef<HTMLDivElement>(null);

  const averageSeverity = useMemo(() => {
    const total = updates.reduce((acc, curr) => acc + curr.severity, 8); 
    return total / (updates.length + 1);
  }, [updates]);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newUpdate: MockUpdate = {
      id: Date.now().toString(),
      author: "You",
      initial: "Y",
      timeAgo: "Just now",
      body: inputValue,
      severity: 5,
      hasMedia: false,
    };

    setUpdates([newUpdate, ...updates]);
    setInputValue("");
  };

  return (
    <div className={`min-h-screen bg-[#0F0F0F] text-white font-sans flex justify-center`}>
      <div className="w-full max-w-md flex flex-col relative">
        
        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-[#0F0F0F]/95 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <h1 className="text-sm font-medium text-gray-400">Incident Feed</h1>
            </div>
            <SeverityGauge average={averageSeverity} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-32">
          
          {/* MAIN INCIDENT (PARENT) */}
          <div className="relative flex gap-3">
            {/* Avatar Column */}
            <div className="flex flex-col items-center flex-shrink-0 w-10">
              {/* Parent Avatar: w-10 (40px) */}
              <div className="w-10 h-10 rounded-full bg-[#3A3A3A] flex items-center justify-center text-base font-bold text-white z-10 ring-4 ring-[#0F0F0F]">
                {INCIDENT.authorInitial}
              </div>
              {/* Vertical Line Start: 
                  Centered under 40px avatar = 20px. 
                  Width 2px. Left = 20 - 1 = 19px.
              */}
              <div className="w-[2px] bg-white/10 flex-grow -mt-2 mb-0 min-h-[2rem]" />
            </div>

            {/* Content Column */}
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-xs text-gray-500 font-medium">@{INCIDENT.author}</span>
                 <span className="text-[10px] text-gray-500">•</span>
                 <span className="text-xs text-gray-500">{INCIDENT.createdAt}</span>
              </div>
              
              <h2 className="text-lg font-bold leading-tight mb-2 text-white">{INCIDENT.title}</h2>
              <p className="text-sm text-gray-300 leading-relaxed mb-3">{INCIDENT.description}</p>
              
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 py-1 px-2 rounded-md w-fit">
                <MapPin size={12} />
                <span>{INCIDENT.location}</span>
              </div>
            </div>
          </div>

          {/* UPDATES LIST (CHILDREN) */}
          <div className="relative">
            {/* GLOBAL VERTICAL RAIL 
                Runs from top of updates container to the very bottom.
                Position: Left 19px (Aligned with parent avatar center).
            */}
            <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-white/10 -z-10" />

            {updates.map((update, index) => {
              const isLast = index === updates.length - 1;
              
              return (
                <div key={update.id} className="relative flex mb-6 last:mb-0">
                  
                  {/* === CONNECTING LINES === */}
                  
                  {/* 1. MASK (Last Item Only) */}
                  {/* Hides the global rail below the curve of the last item */}
                  {isLast && (
                    <div className="absolute left-[19px] top-[20px] bottom-0 w-[2px] bg-[#0F0F0F] z-0" />
                  )}

                  {/* 2. THE CURVE CONNECTOR */}
                  {/* Top: 0. Height: 20px (Centers perfectly on child avatar).
                      Width: 26px (Reaches from rail at 19px to avatar at ~45px).
                      Rounded Bottom Left: Creates the L-curve.
                  */}
                  <div className="absolute left-[19px] top-0 h-[20px] w-[26px] border-b-[2px] border-l-[2px] border-white/10 rounded-bl-xl z-0" />

                  {/* === CHILD AVATAR === */}
                  {/* Margin Left: 45px. 
                      19px (rail) + 26px (connector width) = 45px.
                      This ensures the line touches the avatar edge perfectly.
                  */}
                  <div className="relative z-10 flex-shrink-0 ml-[45px] mt-[4px]"> 
                    <div className="w-8 h-8 rounded-full bg-[#2A2A2A] border-2 border-[#0F0F0F] flex items-center justify-center text-xs font-bold text-white">
                      {update.initial}
                    </div>
                  </div>

                  {/* === CONTENT === */}
                  <div className="flex-1 ml-3 pt-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-bold text-white">@{update.author}</span>
                      <span className="text-xs text-gray-500">{update.timeAgo}</span>
                    </div>
                    
                    <p className="text-sm text-gray-300 leading-relaxed mb-2">
                       {update.body}
                    </p>

                    {update.hasMedia && update.mediaUrls && (
                      <div className="mt-2 grid gap-2">
                        {update.mediaUrls.map((url, i) => (
                           <div key={i} className="rounded-lg overflow-hidden border border-white/10">
                              <img src={url} alt="Evidence" className="w-full h-auto object-cover max-h-48" />
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
           <div ref={updatesEndRef} />
        </main>

        {/* STICKY FOOTER INPUT */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#0F0F0F] border-t border-white/10 flex justify-center">
             <div className="w-full max-w-md">
                <form onSubmit={handlePost} className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Add a live update..."
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-full py-3 px-4 pl-4 pr-10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-all"
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors">
                            <Paperclip size={18} />
                        </button>
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="p-3 bg-white text-black rounded-full disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-500 transition-all flex-shrink-0"
                    >
                        <Send size={18} className="translate-x-0.5" />
                    </button>
                </form>
             </div>
        </div>

      </div>
    </div>
  );
}