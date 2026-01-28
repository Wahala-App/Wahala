"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { getToken } from "@/app/actions/auth";
import { getCachedAddress, setCachedAddress } from "@/app/utils/addressCache";

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
const INCIDENT_DEMO = {
  id: "demo-1",
  type: "Robbery",
  title: "Armed robbery near Lekki Phase 1 gate",
  description:
    "Multiple reports of armed robbery targeting cars at the main Lekki Phase 1 gate. Stay away from the area.",
  location: "Lekki Phase 1 Gate, Lagos",
  createdAt: "Today · 8:05 PM",
  authorInitial: "W",
  author: "wahala-reports",
  evidence_url: undefined as string | undefined,
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
  const numericSeverity = Math.min(10, Math.max(1, average));
  
  const severityInfo = (() => {
    if (numericSeverity <= 3) return { label: "Low", color: "text-emerald-500" };
    if (numericSeverity <= 6) return { label: "Medium", color: "text-amber-500" };
    if (numericSeverity <= 8) return { label: "High", color: "text-orange-500" };
    return { label: "Critical", color: "text-red-500" };
  })();

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 truncate">
        Severity
      </span>
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border border-current ${severityInfo.color}`}
      >
        {severityInfo.label} · {numericSeverity.toFixed(1)}/10
      </span>
    </div>
  );
}

export default function IncidentFeedPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const incidentId = (params?.id ?? "") as string;

  const [incident, setIncident] = useState(INCIDENT_DEMO);
  const [updates, setUpdates] = useState(INITIAL_UPDATES);
  const [inputValue, setInputValue] = useState("");
  const updatesEndRef = useRef<HTMLDivElement>(null);
  const [evidenceImageUrl, setEvidenceImageUrl] = useState<string | null>(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const averageSeverity = useMemo(() => {
    const total = updates.reduce((acc, curr) => acc + curr.severity, 8);
    return total / (updates.length + 1);
  }, [updates]);

  useEffect(() => {
    const loadIncident = async () => {
      if (!incidentId) return;
      try {
        const idToken = await getToken();
        if (!idToken) return;

        const res = await fetch(`/api/dataHandler?id=${incidentId}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!res.ok) {
          console.error("Failed to load incident", res.status);
          return;
        }

        const data: any = await res.json();

        const type =
          data.incidentType ||
          data.incident_type ||
          INCIDENT_DEMO.type;

        // Parse coordinates (may be string or object)
        let lat: number | null = null;
        let lng: number | null = null;
        if (data.coordinates) {
          if (typeof data.coordinates === "string") {
            try {
              const parsed = JSON.parse(data.coordinates);
              lat = parsed.latitude || parsed.lat;
              lng = parsed.longitude || parsed.lng || parsed.lon;
            } catch {
              // If parsing fails, try to extract from string format
              const coords = data.coordinates.match(/-?\d+\.?\d*/g);
              if (coords && coords.length >= 2) {
                lat = parseFloat(coords[0]);
                lng = parseFloat(coords[1]);
              }
            }
          } else if (typeof data.coordinates === "object") {
            lat = data.coordinates.latitude || data.coordinates.lat;
            lng = data.coordinates.longitude || data.coordinates.lng || data.coordinates.lon;
          }
        }

        // Fetch address using reverse geocoding with caching
        let locationText = INCIDENT_DEMO.location;
        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          // Check cache first
          const cached = getCachedAddress(lat, lng);
          if (cached) {
            locationText = cached;
          } else {
            try {
              const geoRes = await fetch(`/api/location?lat=${lat}&lng=${lng}`);
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (
                  geoData?.features &&
                  Array.isArray(geoData.features) &&
                  geoData.features.length > 0
                ) {
                  const address = geoData.features[0].properties.address_line1;
                  if (address) {
                    locationText = address;
                    setCachedAddress(lat, lng, address);
                  } else {
                    // Fallback to coordinates if no address found
                    locationText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    setCachedAddress(lat, lng, locationText);
                  }
                } else {
                  locationText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                  setCachedAddress(lat, lng, locationText);
                }
              } else {
                locationText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                setCachedAddress(lat, lng, locationText);
              }
            } catch (geoErr) {
              console.error("Error fetching address:", geoErr);
              locationText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setCachedAddress(lat, lng, locationText);
            }
          }
        } else if (data.coordinates) {
          locationText = String(data.coordinates);
        }

        let createdAt = INCIDENT_DEMO.createdAt;
        if (data.added_on) {
          createdAt = new Date(data.added_on).toLocaleString();
        } else if (data.date_time) {
          createdAt = String(data.date_time);
        }

        setIncident({
          id: data.id ?? incidentId,
          type,
          title: data.title ?? INCIDENT_DEMO.title,
          description: data.description ?? INCIDENT_DEMO.description,
          location: locationText,
          createdAt,
          authorInitial: INCIDENT_DEMO.authorInitial,
          author: data.creator_username || INCIDENT_DEMO.author,
          evidence_url: data.evidence_url || undefined,
        });
      } catch (err) {
        console.error("Error loading incident details", err);
      }
    };

    loadIncident();
  }, [incidentId]);

  // Fetch presigned URL for evidence image
  useEffect(() => {
    const evidenceUrl = incident.evidence_url;
    if (evidenceUrl && String(evidenceUrl).trim() !== "") {
      setIsLoadingEvidence(true);
      const fetchPresignedUrl = async () => {
        try {
          const token = await getToken();
          if (!token) {
            setIsLoadingEvidence(false);
            return;
          }

          const response = await fetch(
            `/api/getImageUrl?url=${encodeURIComponent(evidenceUrl)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setEvidenceImageUrl(data.url);
          } else {
            console.error("Failed to get presigned URL for evidence");
          }
        } catch (err) {
          console.error("Error fetching presigned URL for evidence:", err);
        } finally {
          setIsLoadingEvidence(false);
        }
      };

      fetchPresignedUrl();
    } else {
      setEvidenceImageUrl(null);
    }
  }, [incident.evidence_url]);

  // Handle ESC key to close image modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isImageModalOpen) {
        setIsImageModalOpen(false);
      }
    };

    if (isImageModalOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isImageModalOpen]);

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
    <div className="min-h-screen bg-background text-foreground font-sans flex justify-center">
      <div className="w-full max-w-md flex flex-col relative">
        
        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-foreground/10">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-1 -ml-1 hover:bg-foreground/10 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-foreground" />
              </button>
              <h1 className="text-xs font-black uppercase tracking-widest text-foreground/40">Incident Feed</h1>
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
              <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-base font-bold text-foreground z-10 ring-4 ring-background border border-foreground/10">
                {incident.authorInitial}
              </div>
              {/* Vertical Line Start: 
                  Centered under 40px avatar = 20px. 
                  Width 2px. Left = 20 - 1 = 19px.
              */}
              <div className="w-[2px] bg-foreground/10 flex-grow -mt-2 mb-0 min-h-[2rem]" />
            </div>

            {/* Content Column */}
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-xs text-foreground/60 font-medium">{incident.author}</span>
                 <span className="text-[10px] text-foreground/40">•</span>
                 <span className="text-xs text-foreground/40">{incident.createdAt}</span>
              </div>
              
              <h2 className="text-lg font-bold leading-tight mb-2 text-foreground">{incident.title}</h2>
              <p className="text-sm text-foreground/60 leading-relaxed mb-3">{incident.description}</p>
              
              {incident.evidence_url && incident.evidence_url.trim() !== "" && (
                <div className="mt-3 mb-3 rounded-xl overflow-hidden border border-foreground/10 shadow-sm">
                  {isLoadingEvidence ? (
                    <div className="w-full h-48 flex items-center justify-center bg-foreground/5">
                      <span className="text-xs text-foreground/40">Loading image...</span>
                    </div>
                  ) : evidenceImageUrl ? (
                    <img
                      src={evidenceImageUrl}
                      alt="Evidence"
                      className="w-full h-auto object-cover max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setIsImageModalOpen(true)}
                      onError={(e) => {
                        console.error("Error loading evidence image:", evidenceImageUrl);
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-foreground/5">
                      <span className="text-xs text-foreground/40">Failed to load image</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-1.5 text-xs text-foreground/40 bg-foreground/5 py-1 px-2 rounded-md w-fit border border-foreground/5">
                <MapPin size={12} className="text-foreground/30" />
                <span>{incident.location}</span>
              </div>
            </div>
          </div>

          {/* UPDATES LIST (CHILDREN) */}
          <div className="relative">
            {/* GLOBAL VERTICAL RAIL 
                Runs from top of updates container to the very bottom.
                Position: Left 19px (Aligned with parent avatar center).
            */}
            <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-foreground/10 -z-10" />

            {updates.map((update, index) => {
              const isLast = index === updates.length - 1;
              
              return (
                <div key={update.id} className="relative flex mb-6 last:mb-0">
                  
                  {/* === CONNECTING LINES === */}
                  
                  {/* 1. MASK (Last Item Only) */}
                  {/* Hides the global rail below the curve of the last item */}
                  {isLast && (
                    <div className="absolute left-[19px] top-[20px] bottom-0 w-[2px] bg-background z-0" />
                  )}

                  {/* 2. THE CURVE CONNECTOR */}
                  {/* Top: 0. Height: 20px (Centers perfectly on child avatar).
                      Width: 26px (Reaches from rail at 19px to avatar at ~45px).
                      Rounded Bottom Left: Creates the L-curve.
                  */}
                  <div className="absolute left-[19px] top-0 h-[20px] w-[26px] border-b-[2px] border-l-[2px] border-foreground/10 rounded-bl-xl z-0" />

                  {/* === CHILD AVATAR === */}
                  <div className="relative z-10 flex-shrink-0 ml-[45px] mt-[4px]"> 
                    <div className="w-8 h-8 rounded-full bg-foreground/5 border-2 border-background flex items-center justify-center text-xs font-bold text-foreground shadow-sm">
                      {update.initial}
                    </div>
                  </div>

                  {/* === CONTENT === */}
                  <div className="flex-1 ml-3 pt-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">{update.author}</span>
                      <span className="text-xs text-foreground/40">{update.timeAgo}</span>
                    </div>
                    
                    <p className="text-sm text-foreground/60 leading-relaxed mb-2">
                       {update.body}
                    </p>

                    {update.hasMedia && update.mediaUrls && (
                      <div className="mt-2 grid gap-2">
                        {update.mediaUrls.map((url, i) => (
                           <div key={i} className="rounded-xl overflow-hidden border border-foreground/10 shadow-sm">
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
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-foreground/10 flex justify-center">
             <div className="w-full max-w-md">
                <form onSubmit={handlePost} className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Add a live update..."
                        className="w-full bg-foreground/5 border border-foreground/10 rounded-full py-3 px-4 pl-4 pr-10 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/20 transition-all font-medium"
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground/40 hover:text-foreground transition-colors">
                            <Paperclip size={18} />
                        </button>
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="p-3 bg-foreground text-background rounded-full disabled:opacity-50 disabled:bg-foreground/10 disabled:text-foreground/40 transition-all flex-shrink-0"
                    >
                        <Send size={18} className="translate-x-0.5" />
                    </button>
                </form>
             </div>
        </div>

      </div>

      {/* Image Modal/Lightbox */}
      {isImageModalOpen && evidenceImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            aria-label="Close image"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={evidenceImageUrl}
              alt="Evidence - Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}