"use client";

import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import clsx from "clsx";

interface FilterButtonProps {
  onFilterChange?: (filters: IncidentFilters) => void;
  className?: string;
  compact?: boolean;
}

export interface IncidentFilters {
  dateRange: "today" | "week" | "month" | "custom" | null;
  customStartDate?: string;
  customEndDate?: string;
  distance: number; // in km
  timeRange: { start: string; end: string } | null;
  incidentTypes: string[];
}

const INCIDENT_TYPES = [
  "Theft",
  "Assault",
  "Accident",
  "Fire",
  "Medical Emergency",
  "Violence",
  "Vandalism",
  "Other",
];

const DISTANCE_PRESETS = [1, 5, 10, 25, 50];

export function FilterButton({
  onFilterChange,
  className,
  compact = false,
}: FilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [filters, setFilters] = useState<IncidentFilters>({
    dateRange: null,
    distance: 10,
    timeRange: null,
    incidentTypes: [],
  });

  const handleApplyFilters = () => {
    onFilterChange?.(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: IncidentFilters = {
      dateRange: null,
      distance: 10,
      timeRange: null,
      incidentTypes: [],
    };
    setFilters(resetFilters);
    onFilterChange?.(resetFilters);
  };

  const toggleIncidentType = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      incidentTypes: prev.incidentTypes.includes(type)
        ? prev.incidentTypes.filter((t) => t !== type)
        : [...prev.incidentTypes, type],
    }));
  };

  const sizeClasses = compact
    ? "w-10 h-10 min-w-[40px] min-h-[40px]"
    : "w-12 h-12 min-w-[48px] min-h-[48px]";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Filter settings"
        className={clsx(
          "rounded-full flex items-center justify-center shadow-lg border-2 border-gray-200 dark:border-gray-700",
          "bg-white hover:bg-white/80 active:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-800/80 dark:active:bg-gray-700 transition-colors",
          "disabled:opacity-70 disabled:cursor-not-allowed",
          sizeClasses,
          className
        )}
      >
        <SlidersHorizontal
          className={clsx(
            compact ? "w-5 h-5" : "w-6 h-6",
            "text-black dark:text-white"
          )}
          strokeWidth={2.5}
        />
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filter Incidents
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Date Range */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Date Range
                </h3>
                
                {/* Quick Date Options - One Line */}
                <div className="flex gap-2 mb-3">
                  {["today", "week", "month"].map((range) => (
                    <button
                      key={range}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: range as "today" | "week" | "month",
                          customStartDate: undefined,
                          customEndDate: undefined,
                        }))
                      }
                      className={clsx(
                        "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        filters.dateRange === range
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      )}
                    >
                      {range === "week"
                        ? "This Week"
                        : range === "month"
                        ? "This Month"
                        : "Today"}
                    </button>
                  ))}
                </div>

                {/* Custom Range Toggle */}
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: prev.dateRange === "custom" ? null : "custom",
                    }))
                  }
                  className={clsx(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    filters.dateRange === "custom"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  )}
                >
                  Custom Range
                </button>

                {/* Custom Date Inputs */}
                {filters.dateRange === "custom" && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={filters.customStartDate || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            customStartDate: e.target.value,
                          }))
                        }
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={filters.customEndDate || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            customEndDate: e.target.value,
                          }))
                        }
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Distance */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Distance from Location
                </h3>
                
                {/* Preset Buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {DISTANCE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, distance: preset }))
                      }
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        filters.distance === preset
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      )}
                    >
                      {preset} km
                    </button>
                  ))}
                </div>

                {/* Distance Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={filters.distance}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        distance: parseInt(e.target.value),
                      }))
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>1 km</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {filters.distance} km
                    </span>
                    <span>100 km</span>
                  </div>
                </div>
              </div>

              {/* Time of Day */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Time of Day
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={filters.timeRange?.start || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          timeRange: {
                            start: e.target.value,
                            end: prev.timeRange?.end || "23:59",
                          },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={filters.timeRange?.end || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          timeRange: {
                            start: prev.timeRange?.start || "00:00",
                            end: e.target.value,
                          },
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Incident Types - Dropdown */}
              <div className="relative">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Incident Types
                </h3>
                
                <button
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent flex items-center justify-between"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {filters.incidentTypes.length === 0
                      ? "Select incident types..."
                      : `${filters.incidentTypes.length} selected`}
                  </span>
                  <ChevronDown
                    className={clsx(
                      "w-4 h-4 text-gray-500 transition-transform",
                      isTypeDropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                {isTypeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {INCIDENT_TYPES.map((type) => (
                      <label
                        key={type}
                        className="flex items-center space-x-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filters.incidentTypes.includes(type)}
                          onChange={() => toggleIncidentType(type)}
                          className="w-4 h-4 text-red-600 focus:ring-red-500 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}