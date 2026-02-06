"use client";

import { useState } from "react";
import { AlarmClock } from "lucide-react";
import { getToken } from "@/app/actions/auth";
import getCurrLocation from "@/app/map/mapUtils";
import clsx from "clsx";

interface SOSButtonProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  className?: string;
  compact?: boolean;
}

export function SOSButton({
  onSuccess,
  onError,
  className,
  compact = false,
}: SOSButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) {
        onError?.("Please sign in to use SOS.");
        return;
      }

      const location = await getCurrLocation();

      const response = await fetch("/api/sos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send SOS");
      }

      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send SOS";
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = compact
    ? "w-10 h-10 min-w-[40px] min-h-[40px]"
    : "w-12 h-12 min-w-[48px] min-h-[48px]";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-label="Send SOS"
      className={clsx(
        "rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900",
        "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white transition-colors",
        "disabled:opacity-70 disabled:cursor-not-allowed",
        sizeClasses,
        className
      )}
    >
      <AlarmClock className={compact ? "w-5 h-5" : "w-6 h-6"} strokeWidth={2.5} />
    </button>
  );
}
