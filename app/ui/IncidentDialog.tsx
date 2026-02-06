"use client";

import React, { useState, useRef, useEffect } from "react";
import { IncidentType, Location } from "../api/types";
import { TextInput } from "./TextInput";
import { PillButton, DefaultButton } from "./button";
import getCurrLocation from "../map/mapUtils"
import { getToken } from "../actions/auth";
import { formatInTimeZone, format } from 'date-fns-tz';
import { MapPin } from "lucide-react";
import { getCachedAddress, setCachedAddress } from "../utils/addressCache";
import { requiredMediaTypeFromSeverity, validateMediaForSeverity } from "../utils/mediaRequirements";

interface IncidentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: {
    incidentType: IncidentType;
    title: string;
    description?: string;
    coordinates: Location;
    severity?: number;
    areaSize?: string;
    evidenceFile?: File;
  }) => void;
  selectedIncidentType: IncidentType;
  providedLocation : Location | null;
}

export function IncidentDialog({
  isOpen,
  onClose,
  onSubmit,
  selectedIncidentType,
  providedLocation,
}: IncidentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const mediaReqDialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [incidentType, setIncidentType] = useState(selectedIncidentType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [severity, setSeverity] = useState<number>(5);
  const [areaSize, setAreaSize] = useState<string>("building");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const [mediaReqError, setMediaReqError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    title: false,
    description: false,
    evidenceFile: false,
    location: false,
  });
  
  // ADDED: State for username
  const [userName, setUserName] = useState<string>("User");
  const [userInitial, setUserInitial] = useState<string>("U");

  // Address input state
  const [addressInput, setAddressInput] = useState<string>("");
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [addressMode, setAddressMode] = useState<"auto" | "manual">("auto");
  const [addressError, setAddressError] = useState<string>("");

  useEffect(() => {
    if (dialogRef.current) {
      if (isOpen) {
        dialogRef.current.showModal();
        if (!providedLocation) {
          getCurrLocation().then(
            (currLocation) => {
              setLocation(currLocation);
              // Fetch address for current location
              fetchAddressFromCoordinates(currLocation.latitude, currLocation.longitude);
            }
          );
        } else {
          setLocation(providedLocation);
          console.log("Provided Location", providedLocation, location);
          // Fetch address for provided location
          fetchAddressFromCoordinates(providedLocation.latitude, providedLocation.longitude);
        }
      } else {
        dialogRef.current.close();
      }
    }
  }, [isOpen, providedLocation]);

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
    if (confirmDialogRef.current) {
      if (showConfirmation) {
        confirmDialogRef.current.showModal();
      } else {
        confirmDialogRef.current.close();
      }
    }
  }, [showConfirmation]);

  useEffect(() => {
    if (!mediaReqDialogRef.current) return;
    if (mediaReqError) mediaReqDialogRef.current.showModal();
    else mediaReqDialogRef.current.close();
  }, [mediaReqError]);

  useEffect(() => {
    if (selectedIncidentType) {
      setIncidentType(selectedIncidentType);
    }
  }, [selectedIncidentType]);

  // ADDED: Fetch username when dialog opens
// MODIFIED: Read username from localStorage (fetched by UserOval)
useEffect(() => {
  const storedUserName = localStorage.getItem("userName");
  if (storedUserName) {
    setUserName(storedUserName);
    setUserInitial(storedUserName.charAt(0).toUpperCase());
  } else if (isOpen) {
    // Fallback: fetch if not in localStorage
    const fetchUserName = async () => {
      try {
        const idToken = await getToken();
        if (!idToken) {
          return;
        }
        
        const response = await fetch('/api/dataHandler', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user_name) {
            setUserName(data.user_name);
            setUserInitial(data.user_name.charAt(0).toUpperCase());
            localStorage.setItem("userName", data.user_name);
          }
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };

    fetchUserName();
  }
}, [isOpen]);

  const getLocalTimestamp = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-CA');
    const time = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const shortName = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
    })
      .formatToParts(now)
      .find(part => part.type === 'timeZoneName')?.value;

    const offsetTotal = now.getTimezoneOffset();
    const offset = -offsetTotal;
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    const hours = Math.floor(abs / 60).toString().padStart(2, '0');
    const mins = (abs % 60).toString().padStart(2, '0');
    const offsetStr = `GMT${sign}${hours}:${mins}`;

    return `${date} ${time} (${offsetStr}, ${shortName})`;
  }

  const parseLocalTimestampToUTC = (stored: string) => {
    const offsetMatch = stored.match(/GMT([+-]\d{2}:\d{2})/);
    if (!offsetMatch) throw new Error("Cannot find offset in string");

    const offsetStr = offsetMatch[1];
    const sign = offsetStr[0] === '+' ? 1 : -1;
    const [h, m] = offsetStr.slice(1).split(':').map(Number);
    const offsetMinutes = sign * (h * 60 + m);

    const dateTimeStr = stored.split(' (')[0].trim();

    const localDate = new Date(dateTimeStr);
    if (isNaN(localDate.getTime())) {
      throw new Error("Invalid date format");
    }

    const utcDate = new Date(localDate.getTime() - offsetMinutes * 60000);
    return utcDate;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");
    setValidationErrors(prev => ({ ...prev, evidenceFile: false }));
    
    if (file) {
      const required = requiredMediaTypeFromSeverity(severity);
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

      // If required is video, allow only video selection (accept also enforced in UI)
      if (required === "video" && !file.type.startsWith("video/")) {
        setFileError("Severity is above 5. Please upload a video.");
        setEvidenceFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setEvidenceFile(file);
    }
  };

  const getSeverityColor = (value: number) => {
    if (value <= 3) return { color: 'bg-green-500', label: 'Low' };
    if (value <= 6) return { color: 'bg-yellow-500', label: 'Medium' };
    if (value <= 8) return { color: 'bg-orange-500', label: 'High' };
    return { color: 'bg-red-500', label: 'Critical' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = {
      title: !title.trim(),
      description: !description.trim(),
      // Evidence is optional for now
      evidenceFile: false,
      location: !location,
    };

    setValidationErrors(errors);

    if (Object.values(errors).some(error => error)) {
      return;
    }

    setShowConfirmation(true);
  };

 const handleConfirmedSubmit = async () => {
  if (isSubmitting) return;

  // Enforce severity-based evidence requirement
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
  onSubmit({
    incidentType,
    title: title.trim(),
    description: description.trim(),
    coordinates: location!,
    severity,
    areaSize,
    evidenceFile: evidenceFile ?? undefined,
  });

  try {
    const idToken = await getToken();
    let dateTime = getLocalTimestamp();
    console.log("dateatland", dateTime)
    let fileUrl: string | null = null;

    // Step 1: Upload file to S3 if provided
    if (evidenceFile) {
      try {
        // Get presigned URL from your API
        const urlResponse = await fetch('/api/uploadFile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: evidenceFile.name,
            fileType: evidenceFile.type,
          }),
        });

        if (!urlResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, fileUrl: s3FileUrl } = await urlResponse.json();

        // Upload file directly to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': evidenceFile.type,
          },
          body: evidenceFile,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file to S3');
        }

        fileUrl = s3FileUrl;
        console.log('File uploaded successfully to S3:', fileUrl);
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        setIsSubmitting(false);
        return;
      }
    }

    // Step 2: Submit incident data with file URL
    const bodyData = {
      incidentType: incidentType,
      title: title.trim(),
      description: description.trim(),
      coordinates: location!,
      dateTime: dateTime,
      severity: severity.toString(),
      areaSize: areaSize,
      evidenceUrl: fileUrl, // Send the S3 URL, not the file
    };

    console.log("datersky", dateTime)

    console.log("Submitting incident data");

    const response = await fetch(`/api/dataHandler`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        setMediaReqError(data.error ?? "Rate limit exceeded. Please wait before posting again.");
        setShowConfirmation(false);
        return;
      }
      const errorText = await response.text();
      console.error('Request failed:', response.status, errorText);
      return;
    }

    console.log("Successfully stored pin data");
    setShowConfirmation(false);
    handleClose();
  } catch (err) {
    console.log("Handling Pin Addition Error: ", err);
  } finally {
    setIsSubmitting(false);
  }
};

  const handleConfirmationNo = () => {
    setShowConfirmation(false);
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setIncidentType(IncidentType.OTHER);
    setLocation(null);
    setSeverity(5);
    setAreaSize("building");
    setEvidenceFile(null);
    setFileError("");
    setAddressInput("");
    setCurrentAddress(null);
    setAddressError("");
    setAddressMode("auto");
    setIsLoadingAddress(false);
    setIsSubmitting(false);
    setValidationErrors({
      title: false,
      description: false,
      evidenceFile: false,
      location: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    providedLocation = null;
    onClose();
  };

  const severityInfo = getSeverityColor(severity);

  return (
    <>
      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-xl p-0 backdrop:bg-transparent w-[90vw] max-w-md m-0"
      >
        <div className="bg-white rounded-lg max-h-[85vh] overflow-y-auto">
          {/* Header with user info */}
          <div className="flex items-center justify-between p-1 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {userInitial}
              </div>
              <div>
              
                <p className="text-lg text-gray-800">{userName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              type="button"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Report Incident</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incident Type <span className="text-red-500">*</span>
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  setValidationErrors(prev => ({ ...prev, title: false }));
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity: <span className="font-semibold">{severity}</span> - <span className={`font-semibold ${severityInfo.color.replace('bg-', 'text-')}`}>{severityInfo.label}</span> <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">1</span>
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
                      #ef4444 80%, #ef4444 100%)`
                  }}
                />
                <span className="text-xs text-gray-500">10</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low (1-3)</span>
                <span>Medium (4-6)</span>
                <span>High (7-8)</span>
                <span>Critical (9-10)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area Size <span className="text-red-500">*</span>
              </label>
              <select
                value={areaSize}
                onChange={(e) => setAreaSize(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setValidationErrors(prev => ({ ...prev, description: false }));
                }}
                placeholder="Additional details about the incident..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* Location/Address Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-gray-50 border-gray-300 text-gray-700"
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
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-gray-50 border-gray-300 text-gray-700"
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
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md text-sm text-gray-700">
                      <MapPin className="h-4 w-4" />
                      <span>{currentAddress}</span>
                    </div>
                  )}
                  {location && !currentAddress && !isLoadingAddress && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md text-sm text-gray-500">
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
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md text-sm text-green-700">
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
              {fileError && (
                <p className="text-xs text-red-600 mb-1">⚠️ {fileError}</p>
              )}
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence Media{" "}
                <span className="text-gray-500">
                  (Severity ≤ 5: Picture (max 4MB) · Severity &gt; 5: Video (max 50MB))
                </span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept={severity > 5 ? "video/*" : "image/*"}
                onChange={handleFileChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {evidenceFile && !fileError && (
                <p className="mt-1 text-sm text-green-600">
                  ✓ {evidenceFile.name} ({(evidenceFile.size / 1024 / 1024).toFixed(2)}MB)
                </p>
              )}
            </div>


            <div className="flex gap-3 pt-4">
              <DefaultButton
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </DefaultButton>
              <PillButton
                type="submit"
                className="flex-1 rounded-md"
              >
                Report Incident
              </PillButton>
            </div>
          </form>
        </div>
      </dialog>

      <dialog
        ref={confirmDialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-2xl p-0 w-[85vw] max-w-sm m-0 z-[9999] backdrop:bg-transparent"
        style={{ border: 'none' }}
      >
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-2xl border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Confirm Submission
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Is the information provided true and accurate to the best of your knowledge?
          </p>
          <div className="flex gap-3">
            <DefaultButton
              type="button"
              onClick={handleConfirmationNo}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm sm:text-base"
            >
              No
            </DefaultButton>
            <PillButton
              type="button"
              onClick={handleConfirmedSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-md text-sm sm:text-base"
            >
              {isSubmitting ? "Submitting..." : "Yes"}
            </PillButton>
          </div>
        </div>
      </dialog>

      <dialog
        ref={mediaReqDialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-2xl p-0 w-[85vw] max-w-sm m-0 z-[9999] backdrop:bg-transparent"
        style={{ border: "none" }}
      >
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-2xl border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Evidence required
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            {mediaReqError}
          </p>
          <DefaultButton
            type="button"
            onClick={() => setMediaReqError(null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm sm:text-base"
          >
            OK
          </DefaultButton>
        </div>
      </dialog>
    </>
  );
}