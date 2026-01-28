"use client";

import React from "react";
import { MapPin, X, Eye } from "lucide-react";
import { Incident } from "../api/types";
import { PillButton, DefaultButton } from "./button";

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

      {hasCoords && (
        <div className="px-4 pb-3 flex items-center gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
          <MapPin className="h-3 w-3" />
          <span>
            {incident.coordinates.latitude.toFixed(4)},{" "}
            {incident.coordinates.longitude.toFixed(4)}
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
        <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-red-500">
          <span>Live update</span>
          <Eye className="h-3.5 w-3.5 live-eye-pulse" />
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

