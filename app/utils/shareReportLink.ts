/**
 * Builds the canonical report URL and shares it. Copies to clipboard first so the
 * user can always paste the link; then opens the native share sheet if available.
 * Call only on the client (e.g. from a button click).
 */
export type ShareResult = "shared" | "copied" | "unsupported";

export async function shareReportLink(id: string, options?: { title?: string; text?: string }): Promise<ShareResult> {
  if (typeof window === "undefined") return "unsupported";

  const url = `${window.location.origin}/report/${id}`;
  const title = options?.title ?? "Report";
  const text = options?.text ?? "View this report and live updates.";

  // Copy to clipboard first so the user can always paste the link
  let copied = false;
  try {
    await navigator.clipboard.writeText(url);
    copied = true;
  } catch {
    // Clipboard failed (e.g. insecure context or permission)
  }

  // If native share is available: use it (and if we already copied, user can paste too)
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ url, title, text });
      return "shared";
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (isAbort && copied) return "copied"; // Cancelled share but link is already copied
      if (copied) return "copied";
      return "unsupported";
    }
  }

  // No share API: if we copied, report success; otherwise clipboard failed (e.g. insecure context)
  return copied ? "copied" : "unsupported";
}
