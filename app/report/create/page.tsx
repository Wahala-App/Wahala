"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IncidentType, Location } from "@/app/api/types";
import getCurrLocation from "@/app/map/mapUtils";
import { getToken } from "@/app/actions/auth";
import { TextInput } from "@/app/ui/TextInput";
import { DefaultButton, PillButton } from "@/app/ui/button";
import { MapPin } from "lucide-react";
import { getCachedAddress, setCachedAddress } from "@/app/utils/addressCache";
import { validateMediaForSeverity } from "@/app/utils/mediaRequirements";

export default function CreateReportPage() {
  const router = useRouter();

  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const mediaReqDialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [incidentType, setIncidentType] = useState<IncidentType>(IncidentType.OTHER);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [severity, setSeverity] = useState<number>(5);
  const [areaSize, setAreaSize] = useState<string>("building");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const [mediaReqError, setMediaReqError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userName, setUserName] = useState<string>("User");
  const [userInitial, setUserInitial] = useState<string>("U");

  // Address input state
  const [addressInput, setAddressInput] = useState<string>("");
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [addressMode, setAddressMode] = useState<"auto" | "manual">("auto");
  const [addressError, setAddressError] = useState<string>("");

  const [validationErrors, setValidationErrors] = useState({
    title: false,
    description: false,
    evidenceFile: false, // optional
    location: false,
  });

  useEffect(() => {
    getCurrLocation().then((loc) => {
      setLocation(loc);
      // Fetch address for current location
      fetchAddressFromCoordinates(loc.latitude, loc.longitude);
    });
  }, []);

  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    // Check cache first
    const cached = getCachedAddress(lat, lng);
    if (cached) {
      setCurrentAddress(cached);
      return;
    }

    setIsLoadingAddress(true);
    setAddressError("");
    try {
      const res = await fetch(`/api/location?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.features && Array.isArray(data.features) && data.features.length > 0) {
          const address = data.features[0].properties.address_line1;
          if (address) {
            setCurrentAddress(address);
            setCachedAddress(lat, lng, address);
          } else {
            setCurrentAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } else {
          setCurrentAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } else {
        setCurrentAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (err) {
      console.error("Error fetching address:", err);
      setCurrentAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setAddressError("");
    setIsLoadingAddress(true);
    try {
      const currLocation = await getCurrLocation();
      setLocation(currLocation);
      await fetchAddressFromCoordinates(currLocation.latitude, currLocation.longitude);
    } catch (err) {
      console.error("Error getting current location:", err);
      setAddressError("Failed to get current location");
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!addressInput.trim()) {
      setAddressError("Please enter an address");
      return;
    }

    setAddressError("");
    setIsLoadingAddress(true);
    try {
      const res = await fetch(`/api/location?address=${encodeURIComponent(addressInput.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          setLocation({ latitude: data.latitude, longitude: data.longitude });
          setCurrentAddress(data.address || addressInput.trim());
          setAddressError("");
        } else {
          setAddressError("Address not found. Please try a different address.");
        }
      } else {
        setAddressError("Failed to find address. Please try again.");
      }
    } catch (err) {
      console.error("Error searching address:", err);
      setAddressError("Failed to search address. Please try again.");
    } finally {
      setIsLoadingAddress(false);
    }
  };

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    if (storedUserName) {
      setUserName(storedUserName);
      setUserInitial(storedUserName.charAt(0).toUpperCase());
    }
  }, []);

  useEffect(() => {
    if (!confirmDialogRef.current) return;
    if (showConfirmation) confirmDialogRef.current.showModal();
    else confirmDialogRef.current.close();
  }, [showConfirmation]);

  useEffect(() => {
    if (!mediaReqDialogRef.current) return;
    if (mediaReqError) mediaReqDialogRef.current.showModal();
    else mediaReqDialogRef.current.close();
  }, [mediaReqError]);

  const getSeverityColor = (value: number) => {
    if (value <= 3) return { color: "bg-green-500", label: "Low" };
    if (value <= 6) return { color: "bg-yellow-500", label: "Medium" };
    if (value <= 8) return { color: "bg-orange-500", label: "High" };
    return { color: "bg-red-500", label: "Critical" };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");
    setValidationErrors((prev) => ({ ...prev, evidenceFile: false }));

    if (!file) {
      setEvidenceFile(null);
      return;
    }

    const maxImageBytes = 4 * 1024 * 1024;
    const maxVideoBytes = 50 * 1024 * 1024;
    const v = validateMediaForSeverity({
      severity,
      file,
      maxImageBytes,
      maxVideoBytes,
    });
    if (!v.ok) {
      setFileError(v.message);
      setEvidenceFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setEvidenceFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = {
      title: !title.trim(),
      description: !description.trim(),
      evidenceFile: false, // optional
      location: !location,
    };

    setValidationErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    setShowConfirmation(true);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIncidentType(IncidentType.OTHER);
    setSeverity(5);
    setAreaSize("building");
    setEvidenceFile(null);
    setFileError("");
    setAddressInput("");
    setCurrentAddress(null);
    setAddressError("");
    setAddressMode("auto");
    setIsLoadingAddress(false);
    setValidationErrors({
      title: false,
      description: false,
      evidenceFile: false,
      location: false,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getLocalTimestamp = () => {
    const now = new Date();
    const date = now.toLocaleDateString("en-CA");
    const time = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const shortName = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
    })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value;

    const offsetTotal = now.getTimezoneOffset();
    const offset = -offsetTotal;
    const sign = offset >= 0 ? "+" : "-";
    const abs = Math.abs(offset);
    const hours = Math.floor(abs / 60).toString().padStart(2, "0");
    const mins = (abs % 60).toString().padStart(2, "0");
    const offsetStr = `GMT${sign}${hours}:${mins}`;

    return `${date} ${time} (${offsetStr}, ${shortName})`;
  };

  const handleConfirmedSubmit = async () => {
    if (!location) return;
    if (isSubmitting) return;

    // Enforce severity-based evidence requirement (before upload/submit)
    const maxImageBytes = 4 * 1024 * 1024;
    const maxVideoBytes = 50 * 1024 * 1024;
    const mediaValidation = validateMediaForSeverity({
      severity,
      file: evidenceFile,
      maxImageBytes,
      maxVideoBytes,
    });
    if (!mediaValidation.ok) {
      setShowConfirmation(false);
      setMediaReqError(mediaValidation.message);
      setValidationErrors((prev) => ({ ...prev, evidenceFile: true }));
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await getToken();
      if (!idToken) return;

      const dateTime = getLocalTimestamp();
      let fileUrl: string | null = null;

      // Upload file to S3 if provided
      if (evidenceFile) {
        const urlResponse = await fetch("/api/uploadFile", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: evidenceFile.name,
            fileType: evidenceFile.type,
          }),
        });

        if (!urlResponse.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, fileUrl: s3FileUrl } = await urlResponse.json();

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": evidenceFile.type },
          body: evidenceFile,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload file to S3");
        fileUrl = s3FileUrl;
      }

      const bodyData = {
        incidentType,
        title: title.trim(),
        description: description.trim(),
        coordinates: location,
        dateTime,
        severity: severity.toString(),
        areaSize,
        evidenceUrl: fileUrl,
      };

      const response = await fetch("/api/dataHandler", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.status} ${errorText}`);
      }

      setShowConfirmation(false);
      resetForm();
      router.back(); // return to map/home
    } catch (err) {
      console.error(err);
      setShowConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const severityInfo = getSeverityColor(severity);

  return (
    <div className="min-h-screen bg-background text-foreground md:hidden">
      <div className="sticky top-0 z-10 bg-background border-b border-foreground/10">
        <div className="h-14 px-4 flex items-center justify-between">
          <button
            type="button"
            className="text-sm font-semibold"
            onClick={() => router.back()}
          >
            Back
          </button>
          <div className="font-bold">Report Incident</div>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Header with user info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {userInitial}
          </div>
          <div className="text-base font-medium">{userName}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Incident Type <span className="text-red-500">*</span>
            </label>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value as IncidentType)}
              className="w-full p-2 border border-foreground/10 rounded-md bg-background"
            >
              {Object.values(IncidentType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            {validationErrors.title && (
              <p className="text-xs text-red-600 mb-1">⚠️ Title is required</p>
            )}
            <TextInput
              type="text"
              placeholder="Brief incident title"
              title="Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setValidationErrors((prev) => ({ ...prev, title: false }));
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Severity: <span className="font-semibold">{severity}</span> -{" "}
              <span className={`font-semibold ${severityInfo.color.replace("bg-", "text-")}`}>
                {severityInfo.label}
              </span>{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-foreground/60">1</span>
              <input
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right,
                    #10b981 0%, #10b981 30%,
                    #eab308 30%, #eab308 60%,
                    #f97316 60%, #f97316 80%,
                    #ef4444 80%, #ef4444 100%)`,
                }}
              />
              <span className="text-xs text-foreground/60">10</span>
            </div>
            <div className="flex justify-between text-xs text-foreground/60 mt-1">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
              <span>Critical</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Area Size <span className="text-red-500">*</span>
            </label>
            <select
              value={areaSize}
              onChange={(e) => setAreaSize(e.target.value)}
              className="w-full p-2 border border-foreground/10 rounded-md bg-background"
            >
              <option value="building">Building</option>
              <option value="block">Block</option>
              <option value="neighbourhood">Neighbourhood</option>
              <option value="estate">Estate</option>
              <option value="village">Village</option>
              <option value="town">Town</option>
              <option value="city">City</option>
            </select>
          </div>

          <div>
            {validationErrors.description && (
              <p className="text-xs text-red-600 mb-1">⚠️ Description is required</p>
            )}
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setValidationErrors((prev) => ({ ...prev, description: false }));
              }}
              placeholder="Additional details about the incident..."
              className="w-full p-2 border border-foreground/10 rounded-md bg-background resize-none"
              rows={3}
            />
          </div>

          {/* Location/Address Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setAddressMode("auto");
                  setAddressError("");
                }}
                className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                  addressMode === "auto"
                    ? "bg-foreground/10 border-foreground/20 text-foreground"
                    : "bg-background border-foreground/10 text-foreground/70"
                }`}
              >
                Use Current Location
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddressMode("manual");
                  setAddressError("");
                }}
                className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                  addressMode === "manual"
                    ? "bg-foreground/10 border-foreground/20 text-foreground"
                    : "bg-background border-foreground/10 text-foreground/70"
                }`}
              >
                Enter Address
              </button>
            </div>

            {addressMode === "auto" ? (
              <div className="space-y-2">
                <DefaultButton
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isLoadingAddress}
                  className="w-full"
                >
                  {isLoadingAddress ? "Getting location..." : "Get Current Location"}
                </DefaultButton>
                {currentAddress && (
                  <div className="flex items-center gap-2 p-2 bg-foreground/5 rounded-md text-sm text-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{currentAddress}</span>
                  </div>
                )}
                {location && !currentAddress && !isLoadingAddress && (
                  <div className="flex items-center gap-2 p-2 bg-foreground/5 rounded-md text-sm text-foreground/60">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => {
                      setAddressInput(e.target.value);
                      setAddressError("");
                    }}
                    placeholder="Enter address (e.g., 123 Main St, Lagos)"
                    className="flex-1 p-2 border border-foreground/10 rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchAddress();
                      }
                    }}
                  />
                  <PillButton
                    type="button"
                    onClick={handleSearchAddress}
                    disabled={isLoadingAddress || !addressInput.trim()}
                    className="px-4"
                  >
                    {isLoadingAddress ? "Searching..." : "Search"}
                  </PillButton>
                </div>
                {currentAddress && (
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md text-sm text-green-600">
                    <MapPin className="h-4 w-4" />
                    <span>{currentAddress}</span>
                  </div>
                )}
              </div>
            )}

            {addressError && (
              <p className="text-xs text-red-600 mt-1">⚠️ {addressError}</p>
            )}
            {validationErrors.location && (
              <p className="text-xs text-red-600 mt-1">⚠️ Location is required (retrieving...)</p>
            )}
          </div>

          <div>
            {fileError && <p className="text-xs text-red-600 mb-1">⚠️ {fileError}</p>}
            <label className="block text-sm font-medium mb-2">
              Evidence Media{" "}
              <span className="text-foreground/60">
                (Required: {severity > 5 ? "Video" : "Picture"} · Max {severity > 5 ? "50MB" : "4MB"})
              </span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={severity > 5 ? "video/*" : "image/*"}
              onChange={handleFileChange}
              className="w-full p-2 border border-foreground/10 rounded-md text-sm"
            />
            {evidenceFile && !fileError && (
              <p className="mt-1 text-sm text-green-600">
                ✓ {evidenceFile.name} ({(evidenceFile.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            )}
          </div>


          <div className="flex gap-3 pt-2">
            <DefaultButton
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-foreground/10 rounded-md"
            >
              Cancel
            </DefaultButton>
            <PillButton type="submit" className="flex-1 rounded-md" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Report Incident"}
            </PillButton>
          </div>
        </form>
      </div>

      <dialog
        ref={confirmDialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-2xl p-0 w-[85vw] max-w-sm m-0 z-[9999] backdrop:bg-transparent"
        style={{ border: "none" }}
      >
        <div className="bg-white rounded-lg p-4 shadow-2xl border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Confirm Submission</h3>
          <p className="text-sm text-gray-600 mb-4">
            Is the information provided true and accurate to the best of your knowledge?
          </p>
          <div className="flex gap-3">
            <DefaultButton
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              No
            </DefaultButton>
            <PillButton
              type="button"
              onClick={handleConfirmedSubmit}
              className="flex-1 rounded-md text-sm"
              disabled={isSubmitting}
            >
              Yes
            </PillButton>
          </div>
        </div>
      </dialog>

      <dialog
        ref={mediaReqDialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-2xl p-0 w-[85vw] max-w-sm m-0 z-[9999] backdrop:bg-transparent"
        style={{ border: "none" }}
      >
        <div className="bg-white rounded-lg p-4 shadow-2xl border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Evidence required</h3>
          <p className="text-sm text-gray-600 mb-4">{mediaReqError}</p>
          <DefaultButton
            type="button"
            onClick={() => setMediaReqError(null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            OK
          </DefaultButton>
        </div>
      </dialog>
    </div>
  );
}

