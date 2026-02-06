const STORAGE_KEY = "wahala_hashtag_subscriptions";

export function getSubscribedHashtags(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function subscribeHashtag(tag: string): void {
  const normalized = tag.replace(/^#+/, "").trim().toLowerCase();
  if (!normalized) return;
  const current = getSubscribedHashtags();
  if (current.includes(normalized)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, normalized]));
}

export function unsubscribeHashtag(tag: string): void {
  const normalized = tag.replace(/^#+/, "").trim().toLowerCase();
  if (!normalized) return;
  const current = getSubscribedHashtags().filter((t) => t !== normalized);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}
