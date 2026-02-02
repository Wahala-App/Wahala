export type CachedUserProfile = {
  uid: string;
  email?: string;
  user_name?: string;
  [key: string]: any;
};

const PROFILE_KEY = "wahala.auth.profile";
const PROFILE_UPDATED_AT_KEY = "wahala.auth.updatedAt";
const PROFILE_SCHEMA_VERSION_KEY = "wahala.auth.schemaVersion";
const PROFILE_SCHEMA_VERSION = 1;

export function loadCachedUserProfile(): CachedUserProfile | null {
  try {
    const v = localStorage.getItem(PROFILE_SCHEMA_VERSION_KEY);
    if (v && parseInt(v, 10) !== PROFILE_SCHEMA_VERSION) return null;
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedUserProfile;
  } catch {
    return null;
  }
}

export function saveCachedUserProfile(profile: CachedUserProfile) {
  try {
    localStorage.setItem(PROFILE_SCHEMA_VERSION_KEY, String(PROFILE_SCHEMA_VERSION));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(PROFILE_UPDATED_AT_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function clearCachedUserProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(PROFILE_UPDATED_AT_KEY);
    localStorage.removeItem(PROFILE_SCHEMA_VERSION_KEY);
  } catch {
    // ignore
  }
}

