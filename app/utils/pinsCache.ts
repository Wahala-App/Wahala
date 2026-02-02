import type { Incident } from "@/app/api/types";

const PINS_KEY = "wahala.pins.list";
const PINS_UPDATED_AT_KEY = "wahala.pins.updatedAt";
const PINS_SCHEMA_VERSION_KEY = "wahala.pins.schemaVersion";
const PINS_SCHEMA_VERSION = 1;

type CachedPinsPayload = {
  schemaVersion: number;
  updatedAt: number;
  pins: Incident[];
};

export function loadCachedPins(): Incident[] | null {
  try {
    const vRaw = localStorage.getItem(PINS_SCHEMA_VERSION_KEY);
    if (vRaw && parseInt(vRaw, 10) !== PINS_SCHEMA_VERSION) return null;
    const raw = localStorage.getItem(PINS_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as CachedPinsPayload | Incident[];
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.pins)) return payload.pins;
    return null;
  } catch {
    return null;
  }
}

export function savePins(pins: Incident[]) {
  try {
    localStorage.setItem(PINS_SCHEMA_VERSION_KEY, String(PINS_SCHEMA_VERSION));
    localStorage.setItem(PINS_UPDATED_AT_KEY, String(Date.now()));
    const payload: CachedPinsPayload = {
      schemaVersion: PINS_SCHEMA_VERSION,
      updatedAt: Date.now(),
      pins,
    };
    localStorage.setItem(PINS_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function upsertPinInCache(pin: Incident) {
  const pins = loadCachedPins() ?? [];
  const next = [pin, ...pins.filter((p) => p.id !== pin.id)];
  savePins(next);
}

export function removePinFromCache(pinId: string) {
  const pins = loadCachedPins();
  if (!pins) return;
  savePins(pins.filter((p) => p.id !== pinId));
}

