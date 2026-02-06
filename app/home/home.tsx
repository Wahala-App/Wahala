"use client";

import React, {Suspense, useEffect, useRef, useCallback, useState, useMemo} from "react";
import clsx from "clsx";
import Image from "next/image";
import SearchAndAdd from "./SearchAndAdd";
import Loading from "./Loading";
import MapComponent from "../map/map";
import { Incident, Location, IncidentType, SOSEvent } from "@/app/api/types";
import { getToken, logout } from "../actions/auth";
import { UserOval } from "./UserOval";
import {supabase} from "../../lib/server/supabase";
import { IncidentDialog } from "../ui/IncidentDialog";
import BottomNav, { BottomNavTab } from "../ui/BottomNav";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import IncidentDetailsPopover from "@/app/ui/IncidentDetailsPopover";
import { typeOf, typeColor, getHighlights, getRecentAlerts, getTrends } from "../utils/incidentUtils";
import getCurrLocation from "../map/mapUtils";
import { getCachedAddress, setCachedAddress } from "../utils/addressCache";
import { useTheme } from "@/src/contexts/ThemeContext";
import { loadCachedPins, removePinFromCache, savePins, upsertPinInCache } from "../utils/pinsCache";
import { SOSButton } from "../ui/SOSButton";
import { SOSRecipientsSection } from "../ui/SOSRecipientsSection";
import maplibregl from "maplibre-gl";

export default function HomeComponent() {
  const router = useRouter();
  const { themeChoice, setThemeChoice } = useTheme();
  
  const mapRef = useRef<{
    recalibrateLocation: () => void;
    addCustomMarker: (incident: Incident) => void;
    addSOSMarker: (sosEvent: SOSEvent) => void;
    removeSOSMarker: (sosEventId: string) => void;
    refreshMarkers: () => void;
    syncMarkers: (incidentId: string) => void;
  }>(null);

  const addRef = useRef<{
    openDialog: (location: Location) => void;
  }>(null);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Mobile bottom-nav state
  const [activeTab, setActiveTab] = useState<BottomNavTab>("home");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [desktopSidebarTab, setDesktopSidebarTab] = useState<"home" | "reports" | "alerts">("home");
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0);
  
  // ADD: Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogLocation, setDialogLocation] = useState<Location | null>(null);
  const [selectedIncidentType] = useState<IncidentType>(IncidentType.NONE);

  const [pins, setPins] = useState<Incident[]>([]);
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const triggerRefresh = () => setRefreshCount((prev) => prev + 1);

  const ALERTS_LAST_SEEN_AT_KEY = "alerts.lastSeenAt";
  const ALERTS_LAST_SEEN_UPDATE_COUNTS_KEY = "alerts.lastSeenUpdateCounts";

  const computeUnreadAlerts = useCallback((allPins: Incident[]) => {
    try {
      const lastSeenAtRaw = localStorage.getItem(ALERTS_LAST_SEEN_AT_KEY);
      const lastSeenAt = lastSeenAtRaw ? parseInt(lastSeenAtRaw, 10) : 0;
      const lastSeenCountsRaw = localStorage.getItem(ALERTS_LAST_SEEN_UPDATE_COUNTS_KEY);
      const lastSeenCounts: Record<string, number> = lastSeenCountsRaw ? JSON.parse(lastSeenCountsRaw) : {};

      let newIncidents = 0;
      let updateDeltas = 0;

      for (const p of allPins) {
        const createdTs =
          (p as any).added_on ? Date.parse((p as any).added_on) :
          (p as any).date_time ? Date.parse((p as any).date_time) :
          NaN;
        if (!Number.isNaN(createdTs) && createdTs > lastSeenAt) newIncidents += 1;

        const currentCount = typeof p.update_count === "number" ? p.update_count : 0;
        const prevCount = typeof lastSeenCounts[p.id] === "number" ? lastSeenCounts[p.id] : 0;
        if (currentCount > prevCount) updateDeltas += (currentCount - prevCount);
      }

      return newIncidents + updateDeltas;
    } catch {
      return 0;
    }
  }, []);

  const markAlertsSeen = useCallback((allPins: Incident[]) => {
    try {
      const now = Date.now();
      localStorage.setItem(ALERTS_LAST_SEEN_AT_KEY, String(now));
      const counts: Record<string, number> = {};
      for (const p of allPins) {
        counts[p.id] = typeof p.update_count === "number" ? p.update_count : 0;
      }
      localStorage.setItem(ALERTS_LAST_SEEN_UPDATE_COUNTS_KEY, JSON.stringify(counts));
    } catch {
      // ignore
    }
    setUnreadAlertsCount(0);
  }, []);

  const handleOpenAlerts = useCallback(() => {
    // Desktop: switch sidebar; Mobile: switch overlay
    setDesktopSidebarTab("alerts");
    setActiveTab("alerts");
    markAlertsSeen(pins);
  }, [markAlertsSeen, pins]);

   const fetchLocationPins = useCallback ( async () => {
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
            const pins = await response.json(); 
            setPins(Array.isArray(pins) ? pins : []);
            savePins(Array.isArray(pins) ? pins : []);
            
            for (const pin of pins) {
               if (mapRef.current) {
                  mapRef.current.addCustomMarker(pin);
               } else {
                 console.log("Map methods not available") 
              }
            }
          }
        } catch (err) {
          console.log(err);
        }
      }, []);

      const getUserInfo = useCallback ( async () => {
        try {
          const idToken = await getToken();
          if (!idToken) {
            return;
          }
          
          const response = await fetch('/api/user', {
                method: 'GET',
                 headers: {
                  'Authorization': `Bearer ${idToken}`,
                },
             });
          
          if (response.ok) {
            const userInfo = await response.json(); 
            localStorage.setItem("userName", userInfo.user_name);
            setHomeUserName(userInfo.user_name);
           
          
          }
        } catch (err) {
          console.log(err);
        }
      }, []);
  
  const selectedIncident = useMemo(
    () => pins.find((pin) => pin.id === selectedIncidentId) ?? null,
    [pins, selectedIncidentId]
  );

  const [selectedSOSEvent, setSelectedSOSEvent] = useState<SOSEvent | null>(null);

  const fetchSOSEvents = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch("/api/sos/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const events: SOSEvent[] = await response.json();
        setSosEvents(Array.isArray(events) ? events : []);
      }
    } catch (err) {
      console.error("Failed to fetch SOS events:", err);
    }
  }, []);

  useEffect(() => {
    fetchSOSEvents();
  }, [fetchSOSEvents]);

  useEffect(() => {
    for (const event of sosEvents) {
      mapRef.current?.addSOSMarker?.(event);
    }
  }, [sosEvents]);

   useEffect(() => {
    // Cache-first pins: show cached pins immediately, then refresh from API
    const cachedPins = loadCachedPins();
    if (cachedPins && cachedPins.length > 0) {
      setPins(cachedPins);
      try {
        for (const pin of cachedPins) {
          mapRef.current?.addCustomMarker(pin);
        }
      } catch {
        // ignore
      }
    }

    getUserInfo();
    fetchLocationPins();

    const channel = supabase
      .channel('location_pins_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'location_pins',
        },
        (payload) => {
          console.log('Real-time update received:', payload);

          if (payload.eventType === 'INSERT') {
            setPins((prev) => [payload.new as Incident, ...prev]);
            try { upsertPinInCache(payload.new as Incident); } catch {}
            mapRef.current?.addCustomMarker(payload.new as Incident);

          } else if (payload.eventType === 'UPDATE') {
            setPins((prev) =>
              prev.map((pin) =>
                pin.id === payload.new.id ? (payload.new as Incident) : pin
              )
            );
            try { upsertPinInCache(payload.new as Incident); } catch {}
          } else if (payload.eventType === 'DELETE') {
            setPins((prev) => prev.filter((pin) => pin.id !== payload.old.id));
            try { removePinFromCache(payload.old.id as string); } catch {}
            mapRef.current?.syncMarkers(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'CLOSED') {
          setError('Connection closed');
        }
      });

    const sosChannel = supabase
      .channel("sos_events_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sos_events" },
        () => {
          fetchSOSEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(sosChannel);
    };
  }, [refreshCount, fetchLocationPins, fetchSOSEvents]);

  // Recompute unread alerts whenever pins change
  useEffect(() => {
    setUnreadAlertsCount(computeUnreadAlerts(pins));
  }, [pins, computeUnreadAlerts]);


  // Fetch and update user location with address
  const fetchAndUpdateLocation = useCallback(async () => {
    try {
      // Get current location coordinates
      const location = await getCurrLocation();
      
      // Check cache first
      let address: string | null = getCachedAddress(location.latitude, location.longitude);
      
      if (!address) {
        // Fetch address from reverse geocoding API
        const geoRes = await fetch(`/api/location?lat=${location.latitude}&lng=${location.longitude}`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (
            geoData?.features &&
            Array.isArray(geoData.features) &&
            geoData.features.length > 0
          ) {
            address = geoData.features[0].properties.address_line1 || 
                     `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
          } else {
            address = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
          }
        } else {
          address = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
        }
        
        // Cache the address (address is guaranteed to be a string here after the if block)
        setCachedAddress(location.latitude, location.longitude, address as string);
      }
      
      // Ensure address is a string
      const finalAddress = address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
      
      // Store in localStorage
      localStorage.setItem("userLocation", JSON.stringify(finalAddress));
      setHomeLocation(finalAddress);
      
      // Update map location
      if (mapRef.current) {
        mapRef.current.recalibrateLocation();
      }
      
      return finalAddress;
    } catch (error) {
      console.error("Error fetching location:", error);
      // Return fallback address on error
      const fallback = "Location unavailable";
      setHomeLocation(fallback);
      return fallback;
    }
  }, []);

  const handleRecalibrate = async () => {
    await fetchAndUpdateLocation();
  };

    // Open dialog with clicked location
  const handlePinAddition = async (lat: number, lon: number) => {
    console.log("Pin add");
    //First check distance from current location to prevent misinformation/spamming
    let userCoords 
    userCoords = await getCurrLocation()
    // .then(
    //         (currLocation) => {  
    //             userCoords = currLocation;
    //         }
    //       );

    if (userCoords === undefined || userCoords === null) {
      console.log("User coordinates are undefined or null");
      return;
    }
    const currLocation =  new maplibregl.LngLat(userCoords.longitude, userCoords.latitude);
    const incidentLocation = new maplibregl.LngLat(lon, lat);
    
    const distanceThreshold = 1000; //Meters
    const distanceToIncident = currLocation.distanceTo(incidentLocation); //Meters
    
    if ( distanceToIncident <= distanceThreshold) { //Meter

        setDialogLocation({ latitude: lat, longitude: lon });
        setIsDialogOpen(true);
    }

    console.log("Distance to incident (m): ", distanceToIncident);

    //else ignore and do not open dialog

  }

  // ADD: Dialog submit handler
  const handleDialogSubmit = async (incidentData: any) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No authentication token found.');
        return;
      }

      const response = await fetch('/api/dataHandler', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(incidentData)
      });
      
      if (!response.ok) throw new Error('Failed to create incident');
      
      mapRef.current?.addCustomMarker(incidentData);
      triggerRefresh();
    } catch (error) {
      console.error('Error creating incident:', error);
    } finally {
      setIsDialogOpen(false);
      setDialogLocation(null);
    }
  };

  // ADD: Dialog close handler
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setDialogLocation(null);
  };

  const handleOpenReportTab = () => {
    setIsUserMenuOpen(false);
    setActiveTab("report");
  };

  const handleCreateReport = () => {
    // Dedicated report page on mobile; modal stays for map-click
    router.push("/report/create");
  };

  const handleTabPress = (tab: BottomNavTab) => {
    if (tab === "report") {
      handleOpenReportTab();
      return;
    }
    setIsUserMenuOpen(false);
    setActiveTab(tab);
  };

  // Mark as read when user views alerts (mobile)
  useEffect(() => {
    if (activeTab === "alerts") {
      markAlertsSeen(pins);
    }
  }, [activeTab, markAlertsSeen, pins]);

  // Mark as read when user views alerts (desktop sidebar)
  useEffect(() => {
    if (desktopSidebarTab === "alerts") {
      markAlertsSeen(pins);
    }
  }, [desktopSidebarTab, markAlertsSeen, pins]);

  const handleMarkerPrimaryClick = (incidentId: string) => {
    setSelectedIncidentId((prev) => (prev === incidentId ? null : incidentId));
  };

  const handleMarkerSecondaryClick = async (incidentId: string) => {
    try {
        const idToken = await getToken();

        const response = await fetch(`/api/dataHandler?id=${incidentId}`, {
            method: 'DELETE',
            headers: {
            'Authorization': `Bearer ${idToken}`,
            },
        });
      
        if (response.ok) {
            const incidentToDeleteId= await response.json(); 
            console.log("Yur=>", incidentToDeleteId)
            mapRef.current?.syncMarkers(incidentToDeleteId);
            try { removePinFromCache(incidentToDeleteId); } catch {}
        } else {
            const errorText = await response.text();
            console.error('Delete failed:', response.status, errorText);
            return;
        }
    } catch (error) {
        console.error('Error creating incident:', error);
    } finally {
        if (incidentId == selectedIncidentId) { setSelectedIncidentId(null) }
    }
  }

  const incidentTypeCounts = pins.reduce<Record<string, number>>((acc, inc) => {
    const t = (inc.incidentType || inc.incident_type || "Other") as string;
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  const [homeUserName, setHomeUserName] = useState("User");
  const [homeLocation, setHomeLocation] = useState("");
  const [homeEmail, setHomeEmail] = useState("");
  const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number } | null>(null);
  
  // Load user info from localStorage on mount
  useEffect(() => {
    try {
      // getUserInfo();
      // const n = localStorage.getItem("userName");
      // if (n) setHomeUserName(n);
      const l = localStorage.getItem("userLocation");
      if (l) {
        try {
          setHomeLocation(JSON.parse(l));
        } catch {
          setHomeLocation(l);
        }
      }
      const e = auth.currentUser?.email;
      if (e) setHomeEmail(e);
    } catch {
      // ignore
    }
  }, []);

  // Fetch and set user location on mount if not already stored
  useEffect(() => {
    const storedLocation = localStorage.getItem("userLocation");
    if (!storedLocation) {
      // Only fetch if we don't have a stored location
      fetchAndUpdateLocation();
    }
  }, [fetchAndUpdateLocation]);

  useEffect(() => {
    const loadStorage = async () => {
      try {
        // Supported in most modern browsers; safe to ignore if unavailable
        const est = await navigator.storage?.estimate?.();
        if (!est) return;
        setStorageUsage({
          used: est.usage ?? 0,
          quota: est.quota ?? 0,
        });
      } catch {
        // ignore
      }
    };
    loadStorage();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("userName");
      await logout();
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="h-screen md:pb-0 pb-16">
      <div className="flex h-full">
        <div className="hidden md:flex flex-[0.25] flex-col min-w-[350px] lg:min-w-[400px]">
          <SearchAndAdd
            addRef = {addRef}
            addCustomMarker={ (incident: Incident) => {mapRef.current?.addCustomMarker(incident)}}
            onIncidentChanged={triggerRefresh}
            incidentTrigger={refreshCount}
            selectedIncidentId={selectedIncidentId}
            // Pass dialog handlers to QuickAdd
            openDialog={() => setIsDialogOpen(true)}
            setDialogLocation={setDialogLocation}
            userName={homeUserName}
            userLocation={homeLocation}
            pins={pins}
            onOpenDetails={setSelectedIncidentId}
            onCreateReport={handleCreateReport}
            activeTab={desktopSidebarTab}
            onTabChange={setDesktopSidebarTab}
          />
        </div>
        {/* Map area */}
        <div className="flex-1 md:flex-[0.8] relative">
          <Suspense fallback={<Loading />}>
            <MapComponent
              ref={mapRef}
              onMarkerPrimaryClick={handleMarkerPrimaryClick}
              onMarkerSecondaryClick={handleMarkerSecondaryClick}
              onPositionClick={(lat: number, lon: number) => handlePinAddition(lat, lon)}
              onSOSMarkerClick={(event) => setSelectedSOSEvent((prev) => (prev?.id === event.id ? null : event))}
            />
            <div className="absolute top-4 right-4 z-10 text-black">
              <UserOval
                recalibrate={handleRecalibrate}
                userName={homeUserName}
                email={homeEmail}
                alertCount={unreadAlertsCount}
                userLocation={homeLocation}
                onOpenAlerts={handleOpenAlerts}
              />
            </div>
          </Suspense>
        </div>
      </div>

      {/* Mobile "Home" dashboard overlay */}
      {activeTab === "home" && (
        <div className="md:hidden fixed inset-0 z-40 bg-background">
          <HomeOverlayFlutter
            userName={homeUserName}
            userLocation={homeLocation}
            pins={pins}
            onOpenProfile={() => setActiveTab("profile")}
            onCreateReport={handleCreateReport}
            onOpenReports={handleOpenReportTab}
            onOpenAlerts={handleOpenAlerts}
            onOpenMap={() => setActiveTab("map")}
            onOpenDetails={(incidentId) => {
              setSelectedIncidentId(incidentId);
              setActiveTab("map");
            }}
          />
        </div>
      )}

      {/* Mobile "Alerts" overlay (Flutter-style) */}
      {activeTab === "alerts" && (
        <div className="md:hidden fixed inset-0 z-40 bg-background">
          <AlertsOverlay
            pins={pins}
            onOpenProfile={() => setActiveTab("profile")}
            onOpenReport={handleCreateReport}
            onOpenDetails={(incidentId) => {
              setSelectedIncidentId(incidentId);
              setActiveTab("map");
            }}
          />
        </div>
      )}

      {/* Mobile "Report" overlay (Flutter-style Reports list) */}
      {activeTab === "report" && (
        <div className="md:hidden fixed inset-0 z-40 bg-background">
          <ReportOverlay
            pins={pins}
            onCreateReport={handleCreateReport}
            onOpenDetails={(incidentId) => {
              router.push(`/report/${incidentId}`);
            }}
          />
        </div>
      )}

      {/* Mobile "Profile" overlay */}
      {activeTab === "profile" && (
        <div className="md:hidden fixed inset-0 z-40 bg-background">
          <div className="h-full overflow-y-auto pb-24">
            <ProfileOverlay
              name={homeUserName}
              email={homeEmail}
              onDone={() => setActiveTab("home")}
              onLogout={handleLogout}
              onRecalibrate={handleRecalibrate}
              offlineMapsCount={0}
              storageUsedLabel={
                storageUsage ? formatBytes(storageUsage.used) : "—"
              }
            />
          </div>
        </div>
      )}

      {/* SOS popover when user clicks SOS pin */}
      {selectedSOSEvent && (
        <>
          <div className="hidden md:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[320px] max-w-[90vw]">
            <div className="bg-background border border-foreground/10 rounded-2xl shadow-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white">
                  <span className="text-xl">SOS</span>
                </div>
                <div>
                  <div className="font-bold text-foreground">SOS Alert</div>
                  {selectedSOSEvent.sender_username && (
                    <div className="text-sm text-foreground/60">{selectedSOSEvent.sender_username}</div>
                  )}
                </div>
              </div>
              <p className="text-sm text-foreground/80 mb-2">{selectedSOSEvent.description}</p>
              <p className="text-xs text-foreground/50">
                Location: {selectedSOSEvent.latitude.toFixed(5)}, {selectedSOSEvent.longitude.toFixed(5)}
              </p>
              <button
                type="button"
                onClick={() => setSelectedSOSEvent(null)}
                className="mt-4 w-full py-2 rounded-xl bg-foreground/10 text-foreground font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
          <div className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm flex items-end pb-14">
            <div className="w-full px-4 pb-6 pt-4 bg-background rounded-t-3xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white">
                  <span className="text-xl">SOS</span>
                </div>
                <div>
                  <div className="font-bold text-foreground">SOS Alert</div>
                  {selectedSOSEvent.sender_username && (
                    <div className="text-sm text-foreground/60">{selectedSOSEvent.sender_username}</div>
                  )}
                </div>
              </div>
              <p className="text-sm text-foreground/80 mb-2">{selectedSOSEvent.description}</p>
              <p className="text-xs text-foreground/50">
                Location: {selectedSOSEvent.latitude.toFixed(5)}, {selectedSOSEvent.longitude.toFixed(5)}
              </p>
              <button
                type="button"
                onClick={() => setSelectedSOSEvent(null)}
                className="mt-4 w-full py-3 rounded-xl bg-foreground/10 text-foreground font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Incident details popover/sheet from map pins */}
      {selectedIncident && (
        <>
          {/* Desktop / tablet popover */}
          <div className="hidden md:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[420px] max-w-[90vw]">
            <IncidentDetailsPopover
              incident={selectedIncident}
              onClose={() => setSelectedIncidentId(null)}
              onViewFullReport={(id: string) => router.push(`/incident/${id}`)}
            />
          </div>

          {/* Mobile full-screen bottom sheet (nearly flush with bottom nav) */}
          <div className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm flex items-end pb-14">
            <div className="w-full px-4 pb-6 pt-4 bg-background rounded-t-3xl">
              <IncidentDetailsPopover
                incident={selectedIncident}
                onClose={() => setSelectedIncidentId(null)}
                onViewFullReport={(id: string) => router.push(`/incident/${id}`)}
              />
            </div>
          </div>
        </>
      )}

      {/* ADD: Dialog at root level - works on mobile and desktop */}
      <IncidentDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        selectedIncidentType={selectedIncidentType}
        providedLocation={dialogLocation}
      />

      <BottomNav
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onReport={handleOpenReportTab}
      />
    </div>
  );
}

function ReportOverlay({
  pins,
  onCreateReport,
  onOpenDetails,
}: {
  pins: Incident[];
  onCreateReport: () => void;
  onOpenDetails: (incidentId: string) => void;
}) {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  // Flutter uses subset chips; we map to existing web IncidentType values
  const chipTypes: string[] = [
    IncidentType.ROBBERY,
    IncidentType.ASSAULT,
    IncidentType.THEFT,
    IncidentType.VANDALISM,
    IncidentType.DRUG_OFFENSE,
    IncidentType.PUBLIC_INTOXICATION,
    IncidentType.OTHER,
  ];

  const filtered = pins
    .filter((p) => {
      if (selectedTypes.size === 0) return true;
      const t = (p.incidentType || p.incident_type || "Other") as string;
      return selectedTypes.has(t);
    })
    .slice()
    .sort((a, b) => (b.id ?? "").localeCompare(a.id ?? ""));

  const toggleType = (t: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* AppBar + chips */}
      <div className="pt-3 border-b border-foreground/10 bg-background">
        <div className="px-5 h-12 flex items-center justify-center relative">
          <div className="text-lg font-bold">Reports</div>
          <button
            type="button"
            className="absolute right-5 h-9 px-3 rounded-full bg-foreground/10 text-sm font-semibold"
            onClick={onCreateReport}
          >
            + Create
          </button>
        </div>

        <div className="pb-3 overflow-x-auto no-scrollbar">
          <div className="px-5 flex gap-2 w-max">
            <button
              type="button"
              onClick={() => setSelectedTypes(new Set())}
              className={clsx(
                "h-9 px-4 rounded-full text-sm font-semibold border",
                selectedTypes.size === 0
                  ? "bg-foreground text-background border-transparent"
                  : "bg-background border-foreground/10 text-foreground/80"
              )}
            >
              All
            </button>
            {chipTypes.map((t) => {
              const active = selectedTypes.has(t);
              return (
                <button
                  key={`rep-chip-${t}`}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={clsx(
                    "h-9 px-4 rounded-full text-sm font-semibold border whitespace-nowrap",
                    active
                      ? "bg-foreground text-background border-transparent"
                      : "bg-background border-foreground/10 text-foreground/80"
                  )}
                >
                  {t === IncidentType.PUBLIC_INTOXICATION ? "Public Intox." : t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-sm text-foreground/60 text-center mt-10">
            No reports match the selected filters.
          </div>
        ) : (
          filtered.map((inc) => {
            const t = (inc.incidentType || inc.incident_type || "Other") as string;
            return (
              <button
                key={`rep-${inc.id}`}
                type="button"
                onClick={() => onOpenDetails(inc.id)}
                className="w-full text-left rounded-xl border border-foreground/10 p-4 bg-background flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                  <span className="text-sm font-bold">{t[0] ?? "R"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold truncate">{inc.title}</div>
                  <div className="text-sm text-foreground/60 truncate">{t}</div>
                </div>
                <div className="text-foreground/50">{">"}</div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function HomeOverlayFlutter({
  userName,
  userLocation,
  pins,
  onOpenProfile,
  onCreateReport,
  onOpenReports,
  onOpenAlerts,
  onOpenMap,
  onOpenDetails,
}: {
  userName: string;
  userLocation: string;
  pins: Incident[];
  onOpenProfile: () => void;
  onCreateReport: () => void;
  onOpenReports: () => void;
  onOpenAlerts: () => void;
  onOpenMap: () => void;
  onOpenDetails: (incidentId: string) => void;
}) {
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const buildCard = ({
    title,
    subtitle,
    type,
    onClick,
  }: {
    title: string;
    subtitle: string;
    type: string;
    onClick: () => void;
  }) => {
    const c = typeColor(type);
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-2xl border border-foreground/10 bg-background p-4 flex items-center gap-4"
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${c}22` }}
        >
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-foreground truncate">{title}</div>
          <div className="text-sm text-foreground/60 truncate">{subtitle}</div>
        </div>
        <div className="text-foreground/50">{">"}</div>
      </button>
    );
  };

  const searchResults =
    searchQuery.trim().length === 0
      ? []
      : pins
          .filter((r) => {
            const q = searchQuery.toLowerCase();
            return (
              r.title.toLowerCase().includes(q) ||
              (r.description ?? "").toLowerCase().includes(q) ||
              typeOf(r).toLowerCase().includes(q) ||
              (userLocation || "").toLowerCase().includes(q)
            );
          })
          .slice(0, 20);

  const highlights = getHighlights(pins);
  const trends = getTrends(pins, userLocation);
  const recentAlerts = getRecentAlerts(pins);

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xl font-bold tracking-tight text-foreground">{children}</div>
  );

  const Header = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Image
          src="/logo/wahala%20logo5.png"
          alt="Wahala logo"
          width={64}
          height={64}
          priority
          className="h-16 w-auto object-contain translate-y-[3px]"
        />
        <div className="text-2xl font-black tracking-tighter leading-none text-foreground">WAHALA</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center"
          onClick={() => setShowSearchBar(true)}
          aria-label="Search"
        >
          <span className="text-lg">⌕</span>
        </button>
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center"
          onClick={onOpenProfile}
          aria-label="Profile"
        >
          <span className="text-lg">👤</span>
        </button>
      </div>
    </div>
  );

  const SearchHeader = () => (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-10 rounded-full border border-foreground/10 bg-foreground/5 px-4 flex items-center">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent outline-none text-sm"
          placeholder="Search home alerts..."
          autoFocus
        />
      </div>
      <button
        type="button"
        className="text-sm font-semibold text-foreground"
        onClick={() => {
          setSearchQuery("");
          setShowSearchBar(false);
        }}
      >
        Cancel
      </button>
    </div>
  );

  return (
    <div className="relative h-full overflow-y-auto pb-24 pt-5">
      {/* Floating SOS button - bottom-right for easy thumb reach on mobile */}
      <div className="fixed bottom-24 right-5 z-50 md:hidden">
        <SOSButton className="shadow-xl" />
      </div>
      <div className="px-5">
        {showSearchBar ? <SearchHeader /> : <Header />}

        <div className="h-8" />

        {searchQuery.trim().length === 0 ? (
          <>
            {/* Welcome */}
            <div className="text-3xl font-bold tracking-tight">
              Welcome Back, {userName}
            </div>
            <div className="mt-2 text-base text-foreground/60">
              Here's your summary for today.
            </div>

            <div className="h-8" />

            {/* Quick actions */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onCreateReport}
                className="flex-1 rounded-3xl border border-foreground/10 bg-background p-6"
              >
                <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold">+</span>
                </div>
                <div className="mt-4 text-center text-base font-semibold">
                  Create Report
                </div>
              </button>
              <button
                type="button"
                onClick={onOpenReports}
                className="flex-1 rounded-3xl border border-foreground/10 bg-background p-6"
              >
                <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold">≡</span>
                </div>
                <div className="mt-4 text-center text-base font-semibold">
                  Reports List
                </div>
              </button>
            </div>

            <div className="h-8" />

            {/* Recent Verified Alerts */}
            <SectionTitle>Recent Verified Alerts</SectionTitle>
            <div className="h-4" />
            {trends.length === 0 ? (
              <div className="text-sm text-foreground/60">
                No recent verified alerts.
              </div>
            ) : (
              <div className="space-y-3">
                {trends.map((t) =>
                  buildCard({
                    title: t.title,
                    subtitle: t.summary,
                    type: t.type,
                    onClick: () => onOpenDetails(t.primaryIncidentId),
                  })
                )}
              </div>
            )}

            <div className="h-8" />

            {/* Latest Alerts */}
            <SectionTitle>Latest Alerts</SectionTitle>
            <div className="h-4" />
            {recentAlerts.length === 0 ? (
              <div className="text-sm text-foreground/60">No recent alerts.</div>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((r) => {
                  const t = typeOf(r);
                  return buildCard({
                    title: r.title,
                    subtitle: `${userLocation || "Nearby"} • Recent`,
                    type: t,
                    onClick: () => onOpenDetails(r.id),
                  });
                })}
              </div>
            )}

            <div className="h-8" />

            {/* Nearby Incidents (map preview) */}
            <SectionTitle>Nearby Incidents</SectionTitle>
            <div className="h-4" />
            <div className="h-[220px] w-full rounded-3xl overflow-hidden relative bg-foreground/5">
              <img
                src="https://tile.openstreetmap.org/2/2/1.png"
                alt="Map preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  type="button"
                  onClick={onOpenMap}
                  className="h-10 px-5 rounded-full bg-background/90 border border-foreground/10 text-sm font-semibold"
                >
                  Open Map View
                </button>
              </div>
            </div>

            <div className="h-8" />

            {/* Highlights */}
            <SectionTitle>Highlights For You</SectionTitle>
            <div className="h-4" />
            {highlights.length === 0 ? (
              <div className="text-sm text-foreground/60">
                No highlights in the last 24 hours.
              </div>
            ) : (
              <div className="space-y-3">
                {highlights.map((h) => {
                  const t = typeOf(h);
                  const c = typeColor(t);
                  return (
                    <button
                      key={`highlight-${h.id}`}
                      type="button"
                      onClick={() => onOpenDetails(h.id)}
                      className="w-full text-left rounded-3xl border border-foreground/10 bg-background p-5"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: `${c}22` }}
                        >
                          <div
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: c }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-bold truncate">{h.title}</div>
                          <div className="text-sm text-foreground/60 truncate">
                            {userLocation || "Nearby"} • Recent
                          </div>
                        </div>
                      </div>
                      {h.description && (
                        <div className="mt-3 text-sm text-foreground/70 line-clamp-2">
                          {h.description}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="h-6" />
            <button
              type="button"
              onClick={onOpenAlerts}
              className="w-full h-12 rounded-2xl bg-foreground/10 text-foreground font-semibold"
            >
              View all alerts
            </button>
          </>
        ) : (
          <>
            <SectionTitle>Search Results</SectionTitle>
            <div className="h-4" />
            {searchResults.length === 0 ? (
              <div className="text-sm text-foreground/60">
                No matching alerts or highlights.
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((r) => {
                  const t = typeOf(r);
                  return buildCard({
                    title: r.title,
                    subtitle: `${userLocation || "Nearby"} • Recent`,
                    type: t,
                    onClick: () => onOpenDetails(r.id),
                  });
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AlertsOverlay({
  pins,
  onOpenProfile,
  onOpenReport,
  onOpenDetails,
}: {
  pins: Incident[];
  onOpenProfile: () => void;
  onOpenReport: () => void;
  onOpenDetails: (incidentId: string) => void;
}) {
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  const types = Object.values(IncidentType).filter((t) => t !== IncidentType.NONE);

  const filtered = pins
    .filter((p) => {
      if (selectedTypes.size === 0) return true;
      const t = (p.incidentType || p.incident_type || "Other") as string;
      return selectedTypes.has(t);
    })
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });

  const toggleType = (t: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sticky header */}
      <div className="pt-4 pb-3 border-b border-foreground/10 bg-background">
        <div className="px-5">
          {showSearchBar ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-10 rounded-full border border-foreground/10 bg-foreground/5 px-4 flex items-center">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="Search alerts..."
                  autoFocus
                />
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-foreground"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchBar(false);
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center"
                onClick={() => setShowSearchBar(true)}
                aria-label="Search"
              >
                <span className="text-lg">⌕</span>
              </button>
              <div className="flex items-center gap-2">
                <Image
                  src="/logo/wahala%20logo5.png"
                  alt="Wahala logo"
                  width={48}
                  height={48}
                  priority
                  className="h-12 w-auto object-contain"
                />
                <div className="text-xl font-black tracking-tighter text-foreground">WAHALA</div>
              </div>
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center"
                onClick={onOpenProfile}
                aria-label="Profile"
              >
                <span className="text-lg">👤</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter chips */}
        <div className="mt-4 overflow-x-auto no-scrollbar">
          <div className="px-5 flex gap-2 w-max">
            <button
              type="button"
              onClick={() => setSelectedTypes(new Set())}
              className={clsx(
                "h-9 px-4 rounded-full text-sm font-semibold border",
                selectedTypes.size === 0
                  ? "bg-foreground text-background border-transparent"
                  : "bg-background border-foreground/10 text-foreground/80"
              )}
            >
              All
            </button>
            {types.map((t) => {
              const active = selectedTypes.has(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={clsx(
                    "h-9 px-4 rounded-full text-sm font-semibold border whitespace-nowrap",
                    active
                      ? "bg-foreground text-background border-transparent"
                      : "bg-background border-foreground/10 text-foreground/80"
                  )}
                >
                  {t}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onOpenReport}
              className="h-9 px-4 rounded-full text-sm font-semibold border bg-background border-foreground/10 text-foreground/80 whitespace-nowrap"
            >
              + Report
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-sm text-foreground/60 text-center mt-10">
            No alerts found.
          </div>
        ) : (
          filtered.map((inc) => {
            const t = (inc.incidentType || inc.incident_type || "Other") as string;
            const color = typeColor(t);
            return (
              <div
                key={`alert-${inc.id}`}
                className="rounded-2xl border border-foreground/10 p-4 bg-background"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground/70">
                      {t}
                    </div>
                    <div className="text-base font-bold mt-1">{inc.title}</div>
                    {inc.description && (
                      <div className="text-sm text-foreground/70 mt-2 line-clamp-2">
                        {inc.description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-foreground/60">
                    Nearby • Unconfirmed
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDetails(inc.id)}
                    className="h-9 px-4 rounded-full border border-foreground/10 text-sm font-semibold"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ProfileOverlay({
  name,
  email,
  onDone,
  onLogout,
  onRecalibrate,
  offlineMapsCount,
  storageUsedLabel,
}: {
  name: string;
  email: string;
  onDone: () => void;
  onLogout: () => void;
  onRecalibrate: () => void;
  offlineMapsCount: number;
  storageUsedLabel: string;
}) {
  const { themeChoice, setThemeChoice } = useTheme();
  const initial = (name?.trim()?.[0] ?? "U").toUpperCase();

  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="px-5 mt-7 mb-2 text-xs font-bold tracking-wide text-foreground/60">
      {children}
    </div>
  );

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="mx-5 rounded-2xl border border-foreground/10 bg-background overflow-hidden">
      {children}
    </div>
  );

  const Item = ({
    label,
    onClick,
    destructive,
    right,
  }: {
    label: string;
    onClick: () => void;
    destructive?: boolean;
    right?: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full px-4 py-4 flex items-center justify-between text-left",
        destructive ? "text-red-600" : "text-foreground"
      )}
    >
      <div className="text-base font-medium">{label}</div>
      {right ?? (
        !destructive && <div className="text-foreground/50">{">"}</div>
      )}
    </button>
  );

  const Divider = () => <div className="h-px bg-foreground/10" />;

  return (
    <div className="pb-24">
      {/* AppBar */}
      <div className="sticky top-0 bg-background z-10 border-b border-foreground/10">
        <div className="h-14 flex items-center justify-center relative px-5">
          <div className="text-lg font-bold">Profile</div>
          <button
            type="button"
            className="absolute right-5 text-base font-bold text-foreground"
            onClick={onDone}
          >
            Done
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="px-5 pt-6 flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-foreground/10 flex items-center justify-center text-3xl font-bold text-foreground">
            {initial}
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center border-4 border-background">
            ✎
          </div>
        </div>
        <div className="mt-4 text-2xl font-bold text-center">{name}</div>
        {!!email && <div className="mt-1 text-base text-foreground/60">{email}</div>}
      </div>

      {/* Upgrade */}
      <div className="px-5 mt-7">
        <button
          type="button"
          className="w-full h-14 rounded-2xl bg-foreground text-background font-bold shadow-sm"
        >
          Upgrade to Premium
        </button>
      </div>

      {/* SOS Recipients */}
      <SectionHeader>SOS CONTACTS</SectionHeader>
      <Card>
        <div className="p-4">
          <SOSRecipientsSection />
        </div>
      </Card>

      {/* Account */}
      <SectionHeader>ACCOUNT</SectionHeader>
      <Card>
        <Item label="Personal Information" onClick={() => {}} />
        <Divider />
        <Item label="Notifications" onClick={() => {}} />
      </Card>

      {/* Appearance */}
      <SectionHeader>APPEARANCE</SectionHeader>
      <Card>
        <div className="px-4 py-4">
          <div className="text-base font-medium text-foreground mb-3">Theme</div>
          <div className="grid grid-cols-3 gap-2">
            {(["light", "dark", "system"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setThemeChoice(opt)}
                className={clsx(
                  "h-11 rounded-xl border text-sm font-semibold transition-colors",
                  themeChoice === opt
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-foreground/10 hover:bg-foreground/5"
                )}
              >
                {opt === "light" ? "Light" : opt === "dark" ? "Dark" : "System"}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-foreground/60">
            System follows your device appearance.
          </div>
        </div>
      </Card>

    
      {/* Support & Logout */}
      <div className="mt-7" />
      <Card>
        <Item label="About Wahala" onClick={() => {}} />
        <Divider />
        <Item label="Log Out" onClick={onLogout} destructive />
      </Card>

      <div className="mt-10 text-center text-xs font-bold text-foreground/40">
        WAHALA v1.0.0
      </div>
      <div className="h-10" />
    </div>
  );
}