"use client";

import React, { useState } from "react";
import { subscribeHashtag } from "../utils/hashtagSubscriptions";

interface HashtagChipsProps {
  hashtags: string[];
  enableSubscribe?: boolean;
  className?: string;
}

export function HashtagChips({
  hashtags,
  enableSubscribe = false,
  className = "",
}: HashtagChipsProps) {
  const [subscribeTag, setSubscribeTag] = useState<string | null>(null);

  const normalizedTags = hashtags
    .map((t) => t.replace(/^#+/, "").trim().toLowerCase())
    .filter(Boolean);

  if (normalizedTags.length === 0) return null;

  const handleChipClick = (tag: string) => {
    if (enableSubscribe) setSubscribeTag(tag);
  };

  const handleSubscribeConfirm = () => {
    if (subscribeTag) {
      subscribeHashtag(subscribeTag);
      setSubscribeTag(null);
    }
  };

  const handleSubscribeCancel = () => {
    setSubscribeTag(null);
  };

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {normalizedTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleChipClick(tag)}
            className={`rounded-full px-3 py-1 text-xs font-medium bg-foreground/10 text-foreground/80 border border-foreground/10 ${
              enableSubscribe ? "cursor-pointer hover:bg-foreground/15 hover:border-foreground/20" : "cursor-default"
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      {subscribeTag && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="subscribe-dialog-title"
          onClick={handleSubscribeCancel}
        >
          <div
            className="bg-background rounded-2xl shadow-xl border border-foreground/10 p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="subscribe-dialog-title" className="text-base text-foreground font-medium mb-2">
              Subscribe to #{subscribeTag}?
            </p>
            <p className="text-sm text-foreground/60 mb-6">
              You&apos;ll get alerts when new reports use this tag.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSubscribeCancel}
                className="flex-1 py-2.5 rounded-full border border-foreground/20 text-foreground text-sm font-semibold hover:bg-foreground/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubscribeConfirm}
                className="flex-1 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
