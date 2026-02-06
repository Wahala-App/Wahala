"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  MapPin,
  Paperclip,
  Send,
  Share2,
  X,
} from "lucide-react";
import { getToken } from "@/app/actions/auth";
import { getCachedAddress, setCachedAddress } from "@/app/utils/addressCache";
import { shareReportLink } from "@/app/utils/shareReportLink";
import { IncidentUpdate } from "@/app/api/types";
import { inferMediaTypeFromUrl, validateMediaForSeverity } from "@/app/utils/mediaRequirements";

// --- TYPES ---
type MockUpdate = {
  id: string;
  author: string;
  initial: string;
  timeAgo: string;
  body: string;
  severity: number;
  creatorUid?: string;
  kind?: "update" | "disprove";
  hasMedia?: boolean;
  mediaUrls?: string[];
};

interface IncidentFeedContentProps {
  onClose: () => void;
  isModal?: boolean;
}

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
  severity: 8 as number | string,
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

export default function IncidentFeedContent({ onClose, isModal = false }: IncidentFeedContentProps) {
  const params = useParams<{ id: string }>();
  const incidentId = (params?.id ?? "") as string;

  const [incident, setIncident] = useState(INCIDENT_DEMO);
  const [updates, setUpdates] = useState<MockUpdate[]>([]);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [pinCreatorUid, setPinCreatorUid] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const updatesEndRef = useRef<HTMLDivElement>(null);
  const [evidenceImageUrl, setEvidenceImageUrl] = useState<string | null>(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  // Update-related state
  const [updateKind, setUpdateKind] = useState<"update" | "disprove">("update");
  const [updateSeverity, setUpdateSeverity] = useState(5);
  const [updateMediaFile, setUpdateMediaFile] = useState<File | null>(null);
  const [updateMediaUrl, setUpdateMediaUrl] = useState<string | null>(null);
  const [updateMediaPreview, setUpdateMediaPreview] = useState<string | null>(null);
  const [updateMediaPreviewKind, setUpdateMediaPreviewKind] = useState<"image" | "video" | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);
  const [isDeletingUpdate, setIsDeletingUpdate] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<"copied" | "shared" | null>(null);
  const shareFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateMediaObjectUrlRef = useRef<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    kind: "update" | "disprove";
  } | null>(null);

  useEffect(() => {
    return () => {
      if (shareFeedbackTimeoutRef.current) clearTimeout(shareFeedbackTimeoutRef.current);
    };
  }, []);

  // Calculate average severity with time-decay weighting
  const averageSeverity = useMemo(() => {
    if (!incident || updates.length === 0) {
      const incidentSeverity = typeof incident?.severity === 'string' 
        ? parseFloat(incident.severity) 
        : (incident?.severity || 5);
      return isNaN(incidentSeverity) ? 5 : incidentSeverity;
    }

    const incidentSeverity = typeof incident.severity === 'string' 
      ? parseFloat(incident.severity) 
      : (incident.severity || 5);
    const baseSeverity = isNaN(incidentSeverity) ? 5 : incidentSeverity;

    // Time-decay weighting
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const sixHours = 6 * oneHour;
    const oneDay = 24 * oneHour;

    let totalWeightedSeverity = baseSeverity * 0.4; // Original gets 40% weight
    let totalWeight = 0.4;

    updates.forEach((update) => {
      // For mock updates, use current time; for real updates, parse created_at
      const updateTime = update.timeAgo === "Just now" 
        ? now 
        : now - (parseInt(update.timeAgo.match(/\d+/)?.[0] || "0") * 60 * 1000);
      
      const age = now - updateTime;

      let weight = 0.1; // Default for old updates (24+ hours)
      if (age < oneHour) {
        weight = 1.0; // Recent updates (0-1 hour) get full weight
      } else if (age < sixHours) {
        weight = 0.7; // 1-6 hours get 70% weight
      } else if (age < oneDay) {
        weight = 0.4; // 6-24 hours get 40% weight
      }

      totalWeightedSeverity += update.severity * weight;
      totalWeight += weight;
    });

    return Math.min(10, Math.max(1, totalWeightedSeverity / totalWeight));
  }, [updates, incident]);

  // Fetch updates from database
  const fetchUpdates = useCallback(async () => {
    if (!incidentId) return;
    setIsLoadingUpdates(true);
    try {
      const idToken = await getToken();
      if (!idToken) return;

      const res = await fetch(`/api/updates?incident_id=${incidentId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to load updates", res.status);
        return;
      }

      const updatesData: IncidentUpdate[] = await res.json();
      
      const presignMediaUrl = async (mediaUrl: string): Promise<string> => {
        try {
          const presignRes = await fetch(
            `/api/getImageUrl?url=${encodeURIComponent(mediaUrl)}`,
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );

          if (!presignRes.ok) return mediaUrl;
          const data = (await presignRes.json()) as { url?: string };
          return data.url || mediaUrl;
        } catch {
          return mediaUrl;
        }
      };

      // Convert IncidentUpdate to MockUpdate format (and presign media URLs)
      const formattedUpdates: MockUpdate[] = await Promise.all(updatesData.map(async (update) => {
        const createdAt = new Date(update.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timeAgo = "Just now";
        if (diffMins > 0 && diffMins < 60) {
          timeAgo = `${diffMins} min ago`;
        } else if (diffHours > 0 && diffHours < 24) {
          timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays > 0) {
          timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        }

        const initial = (update.creator_username || "U").charAt(0).toUpperCase();
        const presignedMediaUrl = update.media_url ? await presignMediaUrl(update.media_url) : undefined;

        return {
          id: update.id,
          author: update.creator_username || "Anonymous",
          initial,
          timeAgo,
          body: update.body,
          severity: update.severity,
          creatorUid: update.creator_uid,
          kind: (update.kind ?? "update") as "update" | "disprove",
          hasMedia: !!update.media_url,
          mediaUrls: presignedMediaUrl ? [presignedMediaUrl] : undefined,
        };
      }));

      setUpdates(formattedUpdates);
    } catch (error) {
      console.error("Error fetching updates:", error);
    } finally {
      setIsLoadingUpdates(false);
    }
  }, [incidentId]);

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
        setPinCreatorUid(data.creator_uid ?? null);

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
          severity: data.severity ?? INCIDENT_DEMO.severity,
        });
      } catch (err) {
        console.error("Error loading incident details", err);
      }
    };

    loadIncident();
  }, [incidentId]);

  // Fetch current user uid (used for delete permissions)
  useEffect(() => {
    const loadMe = async () => {
      try {
        const idToken = await getToken();
        if (!idToken) return;
        const res = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (!res.ok) return;
        const me: any = await res.json();
        setCurrentUserUid(me?.uid ?? null);
      } catch {
        // ignore
      }
    };
    loadMe();
  }, []);

  // Fetch updates when incidentId changes
  useEffect(() => {
    if (incidentId) {
      fetchUpdates();
    }
  }, [incidentId, fetchUpdates]);

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

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isModal) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isImageModalOpen) {
          setIsImageModalOpen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isModal, isImageModalOpen, onClose]);

  // Handle ESC key to close image modal
  useEffect(() => {
    if (isImageModalOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isImageModalOpen]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxImageBytes = 5 * 1024 * 1024;
    const maxVideoBytes = 50 * 1024 * 1024;
    const v = validateMediaForSeverity({
      severity: updateSeverity,
      file,
      maxImageBytes,
      maxVideoBytes,
    });
    if (!v.ok) {
      setPostError(v.message);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUpdateMediaFile(file);
    setPostError(null);

    // Create preview (supports image + video)
    if (updateMediaObjectUrlRef.current) {
      URL.revokeObjectURL(updateMediaObjectUrlRef.current);
      updateMediaObjectUrlRef.current = null;
    }
    const previewUrl = URL.createObjectURL(file);
    updateMediaObjectUrlRef.current = previewUrl;
    setUpdateMediaPreview(previewUrl);
    setUpdateMediaPreviewKind(file.type.startsWith("video/") ? "video" : "image");
  };

  // Handle file upload to S3
  const uploadMediaToS3 = async (file: File): Promise<string> => {
    const idToken = await getToken();
    if (!idToken) throw new Error('Not authenticated');

    // Get presigned URL
    const urlResponse = await fetch("/api/uploadFile", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });

    if (!urlResponse.ok) {
      throw new Error("Failed to get upload URL");
    }

    const { uploadUrl, fileUrl } = await urlResponse.json();

    // Upload to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to S3");
    }

    return fileUrl;
  };

  // Remove selected media
  const handleRemoveMedia = () => {
    setUpdateMediaFile(null);
    setUpdateMediaUrl(null);
    setUpdateMediaPreview(null);
    setUpdateMediaPreviewKind(null);
    if (updateMediaObjectUrlRef.current) {
      URL.revokeObjectURL(updateMediaObjectUrlRef.current);
      updateMediaObjectUrlRef.current = null;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [mediaReqPopup, setMediaReqPopup] = useState<string | null>(null);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (isPostingUpdate || isUploadingMedia) return;

    setIsPostingUpdate(true);
    setPostError(null);

    try {
      const idToken = await getToken();
      if (!idToken) {
        setPostError('Not authenticated. Please log in.');
        return;
      }

      // Enforce severity-based media requirement for updates/disproves
      const maxImageBytes = 5 * 1024 * 1024;
      const maxVideoBytes = 50 * 1024 * 1024;
      const mediaValidation = validateMediaForSeverity({
        severity: updateSeverity,
        file: updateMediaFile,
        maxImageBytes,
        maxVideoBytes,
      });
      if (!mediaValidation.ok) {
        setMediaReqPopup(mediaValidation.message);
        return;
      }

      let mediaUrl = updateMediaUrl;

      // Upload media if selected but not yet uploaded
      if (updateMediaFile && !updateMediaUrl) {
        setIsUploadingMedia(true);
        try {
          mediaUrl = await uploadMediaToS3(updateMediaFile);
          setUpdateMediaUrl(mediaUrl);
        } catch (error: any) {
          setPostError(`Failed to upload image: ${error.message}`);
          setIsUploadingMedia(false);
          setIsPostingUpdate(false);
          return;
        }
        setIsUploadingMedia(false);
      }

      // Post the update
      const response = await fetch('/api/updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          incident_id: incidentId,
          body: inputValue.trim(),
          severity: updateSeverity,
          media_url: mediaUrl || null,
          kind: updateKind,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post update');
      }

      // Success - clear form and refresh updates
      setInputValue("");
      setUpdateSeverity(5);
      setUpdateKind("update");
      handleRemoveMedia();
      
      // Refresh updates from server
      await fetchUpdates();
      // Refresh incident (to keep DB-severity/update_count in sync)
      // (best-effort; if it fails we still show the new update in the list)
      try {
        const res = await fetch(`/api/dataHandler?id=${incidentId}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (res.ok) {
          const data: any = await res.json();
          setPinCreatorUid(data.creator_uid ?? null);
          setIncident((prev) => ({
            ...prev,
            severity: data.severity ?? prev.severity,
            evidence_url: data.evidence_url ?? prev.evidence_url,
          }));
        }
      } catch {}

      // Scroll to top to see new update
      if (updatesEndRef.current) {
        updatesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error: any) {
      console.error('Error posting update:', error);
      setPostError(error.message || 'Failed to post update. Please try again.');
    } finally {
      setIsPostingUpdate(false);
    }
  };

  const canDeleteUpdate = (u: MockUpdate) => {
    if (!currentUserUid) return false;
    const isAuthor = !!u.creatorUid && u.creatorUid === currentUserUid;
    const isPinCreator = !!pinCreatorUid && pinCreatorUid === currentUserUid;
    const isNormalUpdate = (u.kind ?? "update") === "update";
    return isAuthor || (isPinCreator && isNormalUpdate);
  };

  const handleDeleteUpdate = async (updateId: string) => {
    try {
      setIsDeletingUpdate(true);
      const idToken = await getToken();
      if (!idToken) {
        setPostError("Not authenticated. Please log in.");
        return;
      }

      const res = await fetch(`/api/updates?update_id=${encodeURIComponent(updateId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete update");
      }

      await fetchUpdates();

      // Best-effort refresh incident to reflect server-side severity/update_count
      try {
        const incidentRes = await fetch(`/api/dataHandler?id=${incidentId}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (incidentRes.ok) {
          const data: any = await incidentRes.json();
          setPinCreatorUid(data.creator_uid ?? null);
          setIncident((prev) => ({
            ...prev,
            severity: data.severity ?? prev.severity,
            evidence_url: data.evidence_url ?? prev.evidence_url,
          }));
        }
      } catch {}
    } catch (e: any) {
      setPostError(e?.message || "Failed to delete update");
    } finally {
      setIsDeletingUpdate(false);
    }
  };

  const incidentEvidenceIsVideo = inferMediaTypeFromUrl(evidenceImageUrl) === "video";

  return (
    <div className="h-full bg-background text-foreground font-sans flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-foreground/10">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-1 -ml-1 hover:bg-foreground/10 rounded-full transition-colors"
            >
              <X size={20} className="text-foreground" />
            </button>
            <h1 className="text-xs font-black uppercase tracking-widest text-foreground/40">Incident Feed</h1>
          </div>
          <div className="flex items-center gap-2">
            {incidentId && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    if (shareFeedback) return;
                    const result = await shareReportLink(incidentId, {
                      title: incident.title,
                      text: incident.description ? `${incident.title}. ${incident.description}` : undefined,
                    });
                    if (result === "copied" || result === "shared") {
                      setShareFeedback(result === "copied" ? "copied" : "shared");
                      shareFeedbackTimeoutRef.current = setTimeout(() => setShareFeedback(null), 2000);
                    }
                  }}
                  className="p-1.5 hover:bg-foreground/10 rounded-full transition-colors disabled:opacity-50"
                  aria-label="Share report"
                  disabled={!!shareFeedback}
                >
                  <Share2 size={20} className="text-foreground" />
                </button>
                {shareFeedback && (
                  <span className="text-[10px] font-medium text-foreground/60">
                    {shareFeedback === "copied" ? "Link copied" : "Shared"}
                  </span>
                )}
              </>
            )}
            <SeverityGauge average={averageSeverity} />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-32 overflow-y-auto">
        
        {/* MAIN INCIDENT (PARENT) */}
        <div className="relative flex gap-3">
          {/* Avatar Column */}
          <div className="flex flex-col items-center flex-shrink-0 w-10">
            {/* Parent Avatar: w-10 (40px) */}
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-base font-bold text-foreground z-10 ring-4 ring-background border border-foreground/10">
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
                    <span className="text-xs text-foreground/40">Loading media...</span>
                  </div>
                ) : evidenceImageUrl ? (
                  incidentEvidenceIsVideo ? (
                    <video
                      src={evidenceImageUrl}
                      className="w-full h-auto object-cover max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                      controls
                      playsInline
                      onClick={() => setIsImageModalOpen(true)}
                    />
                  ) : (
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
                  )
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-foreground/5">
                    <span className="text-xs text-foreground/40">Failed to load media</span>
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
          <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-foreground/10 z-0" />

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
                {/* Shorter so the curve clearly stops before the avatar circle */}
                <div className="absolute left-[19px] top-0 h-[20px] w-[26px] border-b-[2px] border-l-[2px] border-foreground/10 rounded-bl-xl z-0" />

                {/* === CHILD AVATAR === */}
                <div className="relative z-10 flex-shrink-0 ml-[45px] mt-[4px]"> 
                  {/* Opaque avatar so rail doesn't show through */}
                  <div className="w-8 h-8 rounded-full bg-background border-2 border-background flex items-center justify-center text-xs font-bold text-foreground shadow-sm ring-1 ring-foreground/10">
                    {update.initial}
                  </div>
                </div>

                {/* === CONTENT === */}
                  <div className="relative z-10 flex-1 ml-3 pt-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{update.author}</span>
                    <span className="text-xs text-foreground/40">{update.timeAgo}</span>
                      {(update.kind ?? "update") === "disprove" && (
                        <span className="ml-1 inline-flex items-center rounded-full border border-emerald-600 bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-black">
                          Disprove
                        </span>
                      )}
                      {canDeleteUpdate(update) && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({
                              id: update.id,
                              kind: (update.kind ?? "update") as "update" | "disprove",
                            })
                          }
                          className="ml-auto inline-flex items-center justify-center rounded-full p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          aria-label="Delete update"
                          title="Delete update"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                  </div>
                  
                  <p className="text-sm text-foreground/60 leading-relaxed mb-2">
                     {update.body}
                  </p>

                  {update.hasMedia && update.mediaUrls && (
                    <div className="mt-2 grid gap-2">
                        {update.mediaUrls.map((url, i) => {
                        const isVideo = inferMediaTypeFromUrl(url) === "video";
                        return (
                          <div key={i} className="rounded-xl overflow-hidden border border-foreground/10 shadow-sm">
                            {isVideo ? (
                              <video
                                src={url}
                                className="w-full h-auto object-cover max-h-48"
                                controls
                                playsInline
                              />
                            ) : (
                              <img src={url} alt="Evidence" className="w-full h-auto object-cover max-h-48" />
                            )}
                          </div>
                        );
                      })}
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
      <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-foreground/10">
           <div className="w-full space-y-3">
              {/* Severity Input */}
              <div className="px-2">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="text-xs font-medium text-foreground/60">
                    Severity: <span className="font-semibold text-foreground">{updateSeverity}</span> -{" "}
                    <span className={`font-semibold ${
                      updateSeverity <= 3 ? 'text-emerald-500' :
                      updateSeverity <= 6 ? 'text-amber-500' :
                      updateSeverity <= 8 ? 'text-orange-500' : 'text-red-500'
                    }`}>
                      {updateSeverity <= 3 ? 'Low' :
                       updateSeverity <= 6 ? 'Medium' :
                       updateSeverity <= 8 ? 'High' : 'Critical'}
                    </span>
                  </div>

                  <div className="inline-flex rounded-full border border-foreground/10 bg-foreground/5 p-1">
                    <button
                      type="button"
                      onClick={() => setUpdateKind("update")}
                      className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors ${
                        updateKind === "update"
                          ? "bg-foreground text-background"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                      aria-pressed={updateKind === "update"}
                    >
                      Live
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpdateKind("disprove")}
                      className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors ${
                        updateKind === "disprove"
                          ? "bg-foreground text-background"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                      aria-pressed={updateKind === "disprove"}
                      title="Disproves cannot be deleted by the pin creator"
                    >
                      Disprove
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground/40">1</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={updateSeverity}
                    onChange={(e) => setUpdateSeverity(parseInt(e.target.value))}
                    className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-foreground/10"
                    style={{
                      background: `linear-gradient(to right,
                        #10b981 0%, #10b981 30%,
                        #eab308 30%, #eab308 60%,
                        #f97316 60%, #f97316 80%,
                        #ef4444 80%, #ef4444 100%)`,
                    }}
                  />
                  <span className="text-[10px] text-foreground/40">10</span>
                </div>
              </div>

              {/* Image Preview */}
              {updateMediaPreview && (
                <div className="px-2 relative">
                  <div className="relative inline-block">
                    {updateMediaPreviewKind === "video" ? (
                      <video
                        src={updateMediaPreview}
                        className="h-20 w-20 object-cover rounded-lg border border-foreground/10"
                        controls
                        playsInline
                      />
                    ) : (
                      <img
                        src={updateMediaPreview}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-lg border border-foreground/10"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {postError && (
                <div className="px-2">
                  <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
                    {postError}
                  </p>
                </div>
              )}

              {mediaReqPopup && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                  onClick={() => setMediaReqPopup(null)}
                >
                  <div
                    className="w-full max-w-sm rounded-2xl bg-background text-foreground shadow-2xl border border-foreground/10 p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black">Media required</div>
                        <div className="mt-1 text-xs text-foreground/60">{mediaReqPopup}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMediaReqPopup(null)}
                        className="rounded-full p-1.5 text-foreground/40 hover:text-foreground hover:bg-foreground/5"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMediaReqPopup(null)}
                      className="mt-4 w-full h-10 rounded-full bg-foreground text-background text-sm font-black hover:opacity-90"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handlePost} className="relative flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="relative flex-1">
                      <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setPostError(null);
                      }}
                      placeholder={updateKind === "disprove" ? "Add a disprove..." : "Add a live update..."}
                      className="w-full bg-foreground/5 border border-foreground/10 rounded-full py-3 px-4 pl-4 pr-10 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/20 transition-all font-medium"
                      disabled={isPostingUpdate || isUploadingMedia}
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground/40 hover:text-foreground transition-colors disabled:opacity-50"
                        disabled={isPostingUpdate || isUploadingMedia}
                        aria-label="Attach image"
                      >
                          <Paperclip size={18} />
                      </button>
                  </div>
                  
                  <button 
                      type="submit"
                      disabled={!inputValue.trim() || isPostingUpdate || isUploadingMedia}
                      className="p-3 bg-foreground text-background rounded-full disabled:opacity-50 disabled:bg-foreground/10 disabled:text-foreground/40 transition-all flex-shrink-0"
                  >
                      {isPostingUpdate || isUploadingMedia ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <Send size={18} className="translate-x-0.5" />
                      )}
                  </button>
              </form>
           </div>
      </div>

      {/* Image Modal/Lightbox */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => (isDeletingUpdate ? null : setDeleteConfirm(null))}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-background text-foreground shadow-2xl border border-foreground/10 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-black">
                  Delete {deleteConfirm.kind === "disprove" ? "disprove" : "update"}?
                </div>
                <div className="mt-1 text-xs text-foreground/60">
                  This action can’t be undone.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeletingUpdate}
                className="rounded-full p-1.5 text-foreground/40 hover:text-foreground hover:bg-foreground/5 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeletingUpdate}
                className="flex-1 h-10 rounded-full border border-foreground/20 text-sm font-bold text-foreground hover:bg-foreground/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deleteConfirm.id;
                  setDeleteConfirm(null);
                  await handleDeleteUpdate(id);
                }}
                disabled={isDeletingUpdate}
                className="flex-1 h-10 rounded-full bg-red-600 text-white text-sm font-black hover:bg-red-500 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
            {incidentEvidenceIsVideo ? (
              <video
                src={evidenceImageUrl}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                controls
                playsInline
              />
            ) : (
              <img
                src={evidenceImageUrl}
                alt="Evidence - Full size"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}