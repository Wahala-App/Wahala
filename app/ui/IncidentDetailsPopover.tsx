"use client";

import React, { useEffect, useState } from "react";
import { MapPin, X, Eye } from "lucide-react";
import { Incident } from "../api/types";
import { PillButton, DefaultButton } from "./button";
import { getCachedAddress, setCachedAddress } from "../utils/addressCache";
import { getToken } from "../actions/auth";

interface IncidentDetailsPopoverProps {
  incident: Incident;
  onClose: () => void;
  onViewFullReport?: (id: string) => void;
}

const IncidentDetailsPopover: React.FC<IncidentDetailsPopoverProps> = ({
  incident,
  onClose,
  onViewFullReport,
}) => {
  const type = (incident.incidentType || incident.incident_type || "Other") as string;
  const hasCoords = !!incident.coordinates;
  const [address, setAddress] = useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [evidenceImageUrl, setEvidenceImageUrl] = useState<string | null>(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const numericSeverity = (() => {
    if (incident.severity === undefined || incident.severity === null) return null;
    const n = typeof incident.severity === "string" ? parseFloat(incident.severity) : incident.severity;
    if (Number.isNaN(n)) return null;
    return Math.min(10, Math.max(1, n));
  })();

  const severityInfo =
    numericSeverity === null
      ? null
      : (() => {
          if (numericSeverity <= 3) return { label: "Low", color: "text-emerald-500" };
          if (numericSeverity <= 6) return { label: "Medium", color: "text-amber-500" };
          if (numericSeverity <= 8) return { label: "High", color: "text-orange-500" };
          return { label: "Critical", color: "text-red-500" };
        })();

  // Fetch address using reverse geocoding
  useEffect(() => {
    if (!hasCoords || !incident.coordinates) return;

    const fetchAddress = async () => {
      setIsLoadingAddress(true);
      try {
        // Parse coordinates (may be string or object)
        let lat: number | null = null;
        let lng: number | null = null;

        if (typeof incident.coordinates === "string") {
          try {
            const parsed = JSON.parse(incident.coordinates);
            lat = parsed.latitude || parsed.lat;
            lng = parsed.longitude || parsed.lng || parsed.lon;
          } catch {
            const coords = incident.coordinates.match(/-?\d+\.?\d*/g);
            if (coords && coords.length >= 2) {
              lat = parseFloat(coords[0]);
              lng = parseFloat(coords[1]);
            }
          }
        } else if (typeof incident.coordinates === "object") {
          lat = incident.coordinates.latitude || incident.coordinates.lat;
          lng = incident.coordinates.longitude || incident.coordinates.lng || incident.coordinates.lon;
        }

        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          // Check cache first
          const cached = getCachedAddress(lat, lng);
          if (cached) {
            setAddress(cached);
            setIsLoadingAddress(false);
            return;
          }

          const geoRes = await fetch(`/api/location?lat=${lat}&lng=${lng}`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (
              geoData?.features &&
              Array.isArray(geoData.features) &&
              geoData.features.length > 0
            ) {
              const addressLine = geoData.features[0].properties.address_line1;
              if (addressLine) {
                setAddress(addressLine);
                setCachedAddress(lat, lng, addressLine);
              } else {
                const coordStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                setAddress(coordStr);
                setCachedAddress(lat, lng, coordStr);
              }
            } else {
              const coordStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setAddress(coordStr);
              setCachedAddress(lat, lng, coordStr);
            }
          } else {
            const coordStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setAddress(coordStr);
            setCachedAddress(lat, lng, coordStr);
          }
        } else {
          setAddress(String(incident.coordinates));
        }
      } catch (err) {
        console.error("Error fetching address:", err);
        if (incident.coordinates && typeof incident.coordinates === "object") {
          setAddress(
            `${incident.coordinates.latitude?.toFixed(4) || "N/A"}, ${
              incident.coordinates.longitude?.toFixed(4) || "N/A"
            }`
          );
        } else {
          setAddress(String(incident.coordinates));
        }
      } finally {
        setIsLoadingAddress(false);
      }
    };

    fetchAddress();
  }, [hasCoords, incident.coordinates]);

  // Fetch presigned URL for evidence image
  useEffect(() => {
    const evidenceUrl = (incident as any).evidence_url;
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
  }, [(incident as any).evidence_url]);

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

  return (
    <div className="w-full rounded-2xl bg-white text-gray-900 shadow-xl border border-gray-200 dark:bg-neutral-900 dark:text-white dark:border-neutral-700">
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="inline-flex h-6 items-center rounded-full bg-gray-100 px-2.5 text-[11px] font-semibold text-gray-700 dark:bg-neutral-800 dark:text-gray-100">
            {type}
          </span>
          <h2 className="mt-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
            {incident.title}
          </h2>
          {incident.creator_username && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {incident.creator_username}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-3 rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-neutral-800"
          aria-label="Close incident details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {incident.description && (
        <p className="px-4 pb-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
          {incident.description}
        </p>
      )}

      {((incident as any).evidence_url && String((incident as any).evidence_url).trim() !== "") && (
        <div className="mx-4 mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700">
          {isLoadingEvidence ? (
            <div className="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-neutral-800">
              <span className="text-xs text-gray-500 dark:text-gray-400">Loading image...</span>
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
            <div className="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-neutral-800">
              <span className="text-xs text-gray-500 dark:text-gray-400">Failed to load image</span>
            </div>
          )}
        </div>
      )}

      {/* Image Modal/Lightbox */}
      {isImageModalOpen && evidenceImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
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

      {hasCoords && (
        <div className="px-4 pb-3 flex items-center gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
          <MapPin className="h-3 w-3" />
          <span>
            {isLoadingAddress
              ? "Loading address..."
              : address ||
                (incident.coordinates &&
                typeof incident.coordinates === "object"
                  ? `${incident.coordinates.latitude?.toFixed(4) || "N/A"}, ${
                      incident.coordinates.longitude?.toFixed(4) || "N/A"
                    }`
                  : String(incident.coordinates))}
          </span>
        </div>
      )}

      {/* Severity + live update bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 text-[11px] sm:text-xs bg-white dark:bg-neutral-900 dark:border-neutral-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-500 dark:text-gray-400 truncate">
            Severity
          </span>
          {severityInfo && numericSeverity !== null ? (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border border-current ${severityInfo.color}`}
            >
              {severityInfo.label} · {numericSeverity.toFixed(1)}/10
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-[10px]">
              Not specified
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium font-black text-red-500">
          <span>Live update</span>
          <Eye className="h-3.5 w-3.5 live-eye-pulse" />
          <span className="ml-0.5">{incident.update_count ?? 0}</span>
        </div>
      </div>

      <div className="flex gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60">
        <DefaultButton
          type="button"
          onClick={onClose}
          className="flex-1 h-9 rounded-full text-xs sm:text-sm border border-gray-300 dark:border-neutral-700"
        >
          Close
        </DefaultButton>
        {onViewFullReport && (
          <PillButton
            type="button"
            onClick={() => onViewFullReport(incident.id)}
            className="flex-1 h-9 rounded-full text-xs sm:text-sm"
          >
            View full report
          </PillButton>
        )}
      </div>
    </div>
  );
};

export default IncidentDetailsPopover;

