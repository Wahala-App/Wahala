export type RequiredMediaType = "image" | "video";

export function requiredMediaTypeFromSeverity(severity: number): RequiredMediaType {
  // Requirement: severity <= 5 => image, severity > 5 => video
  return severity > 5 ? "video" : "image";
}

export function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}

export function validateMediaForSeverity(params: {
  severity: number;
  file: File | null | undefined;
  maxImageBytes: number;
  maxVideoBytes: number;
}): { ok: true } | { ok: false; message: string } {
  const { severity, file, maxImageBytes, maxVideoBytes } = params;
  const required = requiredMediaTypeFromSeverity(severity);

  if (!file) {
    return {
      ok: false,
      message:
        required === "image"
          ? "Severity is 5 or below. Please attach at least 1 picture before submitting."
          : "Severity is above 5. Please attach a video before submitting.",
    };
  }

  if (required === "image" && !isImageFile(file)) {
    return { ok: false, message: "Severity is 5 or below. Please upload a picture (image), not a video." };
  }

  if (required === "video" && !isVideoFile(file)) {
    return { ok: false, message: "Severity is above 5. Please upload a video, not a picture (image)." };
  }

  const maxBytes = required === "image" ? maxImageBytes : maxVideoBytes;
  if (file.size > maxBytes) {
    const maxMb = Math.round((maxBytes / 1024 / 1024) * 10) / 10;
    return { ok: false, message: `File is too large. Max allowed size is ${maxMb}MB.` };
  }

  return { ok: true };
}

export function inferMediaTypeFromUrl(url: string | null | undefined): RequiredMediaType {
  if (!url) return "image";

  const videoExts = new Set(["mp4", "mov", "webm", "m4v", "avi", "mkv"]);
  const imageExts = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]);

  try {
    const u = new URL(url);
    const path = u.pathname || "";
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    if (videoExts.has(ext)) return "video";
    if (imageExts.has(ext)) return "image";
    return "image";
  } catch {
    const clean = url.split("?")[0] ?? url;
    const ext = clean.split(".").pop()?.toLowerCase() ?? "";
    if (videoExts.has(ext)) return "video";
    if (imageExts.has(ext)) return "image";
    return "image";
  }
}

