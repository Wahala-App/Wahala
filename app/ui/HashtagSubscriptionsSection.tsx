"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  getSubscribedHashtags,
  subscribeHashtag,
  unsubscribeHashtag,
} from "../utils/hashtagSubscriptions";

interface HashtagSubscriptionsSectionProps {
  existingHashtags?: string[];
}

export function HashtagSubscriptionsSection({ existingHashtags = [] }: HashtagSubscriptionsSectionProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");

  const refresh = () => setTags(getSubscribedHashtags());

  useEffect(() => {
    refresh();
  }, []);

  const handleUnsubscribe = (tag: string) => {
    unsubscribeHashtag(tag);
    refresh();
  };

  const handleSubscribe = (tag: string) => {
    subscribeHashtag(tag);
    setSearchInput("");
    refresh();
  };

  const suggestions = useMemo(() => {
    const q = searchInput.replace(/^#+/, "").trim().toLowerCase();
    if (!q) return [];
    const subscribed = new Set(getSubscribedHashtags());
    return existingHashtags.filter(
      (t) => t.toLowerCase().includes(q) && !subscribed.has(t.toLowerCase())
    );
  }, [searchInput, existingHashtags]);

  return (
    <div className="space-y-3">
      <div className="text-base font-bold text-foreground">Hashtag Subscriptions</div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleUnsubscribe(tag)}
            className="rounded-full px-3 py-1.5 text-sm font-medium bg-foreground/10 text-foreground/80 border border-foreground/10 hover:bg-foreground/15 hover:border-foreground/20"
          >
            #{tag}
          </button>
        ))}
      </div>
      <div>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Type a hashtag to subscribe..."
          className="w-full px-3 py-2 text-sm rounded-full border border-foreground/10 bg-background"
        />
        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSubscribe(tag)}
                className="rounded-full px-3 py-1.5 text-sm font-medium bg-foreground/10 text-foreground/80 border border-foreground/10 hover:bg-foreground/15 hover:border-foreground/20"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
