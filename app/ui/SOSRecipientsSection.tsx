"use client";

import { useState, useEffect, useCallback } from "react";
import { getToken } from "@/app/actions/auth";
import { X } from "lucide-react";

interface SOSRecipient {
  id: string;
  recipient_email: string;
}

interface SOSRecipientsSectionProps {
  className?: string;
}

export function SOSRecipientsSection({ className }: SOSRecipientsSectionProps) {
  const [recipients, setRecipients] = useState<SOSRecipient[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipients = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch("/api/sos/recipients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRecipients(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch SOS recipients:", err);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const handleAdd = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email address");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("Please sign in");
        return;
      }
      const response = await fetch("/api/sos/recipients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setRecipients((prev) => [...prev, data]);
        setEmailInput("");
      } else {
        setError(data.error || "Failed to add");
      }
    } catch (err) {
      setError("Failed to add recipient");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (recipientEmail: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(
        `/api/sos/recipients?email=${encodeURIComponent(recipientEmail)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        setRecipients((prev) => prev.filter((r) => r.recipient_email !== recipientEmail));
      }
    } catch (err) {
      console.error("Failed to remove recipient:", err);
    }
  };

  return (
    <div className={className}>
      <p className="text-[11px] text-foreground/60 mb-3">
        Add people by email to receive your SOS alerts.
      </p>
      <div className="flex gap-2 min-w-0 overflow-hidden">
        <input
          type="email"
          value={emailInput}
          onChange={(e) => {
            setEmailInput(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="email@example.com"
          className="min-w-0 flex-1 h-9 px-3 rounded-xl border border-foreground/10 bg-background text-sm outline-none focus:border-foreground/30"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={loading || !emailInput.trim()}
          className="shrink-0 h-9 px-4 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
        {recipients.length === 0 ? (
          <p className="text-xs text-foreground/50">No SOS contacts yet.</p>
        ) : (
          recipients.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-foreground/5"
            >
              <span className="text-xs font-medium truncate">{r.recipient_email}</span>
              <button
                type="button"
                onClick={() => handleRemove(r.recipient_email)}
                aria-label="Remove"
                className="w-6 h-6 rounded-full flex items-center justify-center text-foreground/60 hover:bg-red-500/20 hover:text-red-600 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
