"use client";

import maplibregl, { AttributionControl, Map, Marker } from "maplibre-gl";
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import getCurrLocation, {FALLBACK_LOCATION, incidentIcon,} from "./mapUtils";
import {Incident} from "../api/types";
import { DefaultButton } from "../ui/button";
import Image from "next/image";
import Loading from "./loading";
import { getToken } from "@/app/actions/auth";


interface MapRef {
    recalibrateLocation: () => void;
    addCustomMarker: (incident: Incident) => void;
    refreshMarkers: () => void;
}

interface MapProps {
    onMarkerPrimaryClick?: (incidentId: string) => void;
    onMarkerSecondaryClick?: (incidentId: string) => void;
    onPositionClick?: (lat: number, lon: number) => void;
}

// key = your custom ID, value = Marker instance
const MapComponent = forwardRef<MapRef, MapProps> (({ onMarkerPrimaryClick, onMarkerSecondaryClick, onPositionClick }, ref) => {
  const markersRef = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
// Add this state at the top with other states
const userLocationMarkerRef = useRef<Marker | null>(null);

  const mapRef = useRef<Map | null>(null);
  const [currLocation, setCurrLocation] = useState<{
    latitude: number;
    longitude: number;
  }>(FALLBACK_LOCATION);
  const [isInitializing, setIsInitializing] = useState(true);

  const recalibrateLocation = async () => {
    try {
      console.log("🔄 Recalibrating location...");
      // Re-fetch current location to ensure we have the latest
      const location = await getCurrLocation();
      console.log("📍 Location fetched:", location);
      
      // Check if we got the fallback location
      if (location.latitude === 32.4173824 && location.longitude === -81.7856512) {
        console.warn("⚠️ Using fallback location - geolocation may have failed. Check browser permissions.");
      }
      
      setCurrLocation(location);
      
      if (mapRef.current) {
        console.log("🗺️ Flying map to:", [location.longitude, location.latitude]);
        mapRef.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 15,
        });
     addUserLocationMarker(location);
        console.log("✅ Map should now be centered on your location");
      } else {
        console.error("❌ Map reference is null - map may not be initialized");
      }
    } catch (error) {
      console.error("❌ Error in recalibrateLocation:", error);
    }
  };


  const addUserLocationMarker = (location: { latitude: number; longitude: number }) => {
  if (userLocationMarkerRef.current) {
    userLocationMarkerRef.current.remove();
  }

  if (!mapRef.current) return;

  const container = document.createElement("div");
  container.className = "user-location-container";
  container.style.position = "relative";
  container.style.width = "70px";
  container.style.height = "70px";

  // Create pulsing ring
  // Create pulsing ring with 1000m radius using MapLibre's projection
  const center = new maplibregl.LngLat(location.longitude, location.latitude);

  // Calculate a point 1000m north (bearing 0°)
  const metersPerDegree = 111320; // approximate meters per degree of latitude
  const latOffset = 1000 / metersPerDegree;
  const northPoint = new maplibregl.LngLat(location.longitude, location.latitude + latOffset);

  const centerPoint = mapRef.current.project(center);
  const radiusPixelPoint = mapRef.current.project(northPoint);
  const radiusInPixels = Math.abs(centerPoint.y - radiusPixelPoint.y);

  const pulseRing = document.createElement("div");
  pulseRing.className = "pulse-ring";
  pulseRing.style.position = "absolute";
  pulseRing.style.top = "50%";
  pulseRing.style.left = "50%";
  pulseRing.style.width = `${radiusInPixels * 2}px`;
  pulseRing.style.height = `${radiusInPixels * 2}px`;
  pulseRing.style.borderRadius = "100%";
  pulseRing.style.border = "4px solid #fb0000";
  pulseRing.style.transform = "translate(-50%, -50%)";
  pulseRing.style.animation = "pulse-ring 2s ease-out infinite";
  pulseRing.style.pointerEvents = "none";
  container.appendChild(pulseRing);

  // Update ring size on zoom
  mapRef.current.on('zoom', () => {
    const newCenterPoint = mapRef.current!.project(center);
    const newRadiusPixelPoint = mapRef.current!.project(northPoint);
    const newRadiusInPixels = Math.abs(newCenterPoint.y - newRadiusPixelPoint.y);
    
    pulseRing.style.width = `${newRadiusInPixels * 2}px`;
    pulseRing.style.height = `${newRadiusInPixels * 2}px`;
  });

  // Create stick figure container (BIGGER)
  const stickFigure = document.createElement("div");
  stickFigure.style.position = "absolute";
  stickFigure.style.top = "50%";
  stickFigure.style.left = "50%";
  stickFigure.style.width = "28px";
  stickFigure.style.height = "36px";
  stickFigure.style.transform = "translate(-50%, -50%)";
  stickFigure.style.zIndex = "10";

  // Head (bigger)
  const head = document.createElement("div");
  head.style.width = "10px";
  head.style.height = "10px";
  head.style.borderRadius = "50%";
  head.style.backgroundColor = "#4285F4";
  head.style.border = "2px solid white";
  head.style.position = "absolute";
  head.style.top = "0";
  head.style.left = "50%";
  head.style.transform = "translateX(-50%)";
  head.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
  stickFigure.appendChild(head);

  // Body (longer)
  const body = document.createElement("div");
  body.style.width = "3px";
  body.style.height = "12px";
  body.style.backgroundColor = "#4285F4";
  body.style.position = "absolute";
  body.style.top = "10px";
  body.style.left = "50%";
  body.style.transform = "translateX(-50%)";
  body.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2)";
  stickFigure.appendChild(body);

  // Left arm
  const leftArm = document.createElement("div");
  leftArm.style.width = "8px";
  leftArm.style.height = "2px";
  leftArm.style.backgroundColor = "#4285F4";
  leftArm.style.position = "absolute";
  leftArm.style.top = "13px";
  leftArm.style.left = "6px";
  leftArm.style.transform = "rotate(-35deg)";
  leftArm.style.transformOrigin = "right center";
  leftArm.style.boxShadow = "0 1px 2px rgba(0,0,0,0.2)";
  stickFigure.appendChild(leftArm);

  // Right arm
  const rightArm = document.createElement("div");
  rightArm.style.width = "8px";
  rightArm.style.height = "2px";
  rightArm.style.backgroundColor = "#4285F4";
  rightArm.style.position = "absolute";
  rightArm.style.top = "13px";
  rightArm.style.right = "6px";
  rightArm.style.transform = "rotate(35deg)";
  rightArm.style.transformOrigin = "left center";
  rightArm.style.boxShadow = "0 1px 2px rgba(0,0,0,0.2)";
  stickFigure.appendChild(rightArm);

  // Left leg - angled outward like / 
  const leftLeg = document.createElement("div");
  leftLeg.style.width = "2px";
  leftLeg.style.height = "12px";
  leftLeg.style.backgroundColor = "#4285F4";
  leftLeg.style.position = "absolute";
  leftLeg.style.top = "22px";
  leftLeg.style.left = "50%";
  leftLeg.style.transform = "translateX(-50%) rotate(-25deg)";
  leftLeg.style.transformOrigin = "top center";
  leftLeg.style.boxShadow = "0 1px 2px rgba(0,0,0,0.2)";
  stickFigure.appendChild(leftLeg);

  // Right leg - angled outward like \
  const rightLeg = document.createElement("div");
  rightLeg.style.width = "2px";
  rightLeg.style.height = "12px";
  rightLeg.style.backgroundColor = "#4285F4";
  rightLeg.style.position = "absolute";
  rightLeg.style.top = "22px";
  rightLeg.style.left = "50%";
  rightLeg.style.transform = "translateX(-50%) rotate(25deg)";
  rightLeg.style.transformOrigin = "top center";
  rightLeg.style.boxShadow = "0 1px 2px rgba(0,0,0,0.2)";
  stickFigure.appendChild(rightLeg);

  container.appendChild(stickFigure);

  const marker = new Marker({
    element: container,
    draggable: false,
    anchor: "center",
  })
    .setLngLat([location.longitude, location.latitude])
    .addTo(mapRef.current);

  userLocationMarkerRef.current = marker;
};
  // Add this function after your other functions

  const addCustomMarker = (incident: Incident) => {

    if (!mapRef.current || !incident.id) return;

      // ❗ Prevent duplicate markers
    if (markersRef.current.has(incident.id)) return;

    const lat = incident.coordinates.latitude;
    const lng = incident.coordinates.longitude;
    console.log("Adding custom marker at:", lat, lng);
    let el;
    if (incident.incidentType !== undefined) { 
        el = incidentIcon(incident.incidentType);
    } else{
         el = incidentIcon(incident.incident_type); //Handles SQL type
    }

    if (incident.id) {
        if (onMarkerPrimaryClick) {
            el.addEventListener("click", () => onMarkerPrimaryClick(incident.id));
        }

        if (onMarkerSecondaryClick) {
            el.addEventListener("contextmenu", () => onMarkerSecondaryClick(incident.id));
        }
    }

    const marker = new Marker({
      element: el,
      draggable: false,
    })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

      // Store it with your custom ID
    markersRef.current.set(incident.id, marker) //Tracks each marker with assigned incident id
  };
  
    const removeMarker = async (incidentId: any) => {
      const marker = markersRef.current.get(incidentId);
      console.log(marker)
      if (marker) {
        marker.remove();        // removes it from the map
        markersRef.current.delete(incidentId); // clean up our map
        console.log(`Removed marker ${incidentId}`);
      } else {
        console.warn(`Marker with id ${incidentId} not found`);
      }

    }

    const refreshMarkers = async () => {
        document.querySelectorAll('.maplibregl-marker').forEach(marker => marker.remove());
  
        const token = await getToken();
        if (!token) {
            return; // No user logged in, so no markers to refresh
        }

        // Refetch and add markers
        const response = await fetch('/api/dataHandler', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const incidents: Incident[] = await response.json();
        incidents.forEach(incident => addCustomMarker(incident));
    }

    const syncMarkers = (incidentToDeleteId: string) => { //Sync markers for deletion
        console.log("Syncing markers for deletion:", incidentToDeleteId);
        const marker = markersRef.current.get(incidentToDeleteId);

        console.log("Found marker to delete:", marker);
        if (!marker) return;

        marker.remove();

        markersRef.current.delete(incidentToDeleteId);
        console.log("Marker removed and internal state updated.");
    };

    

  useImperativeHandle(ref, () => ({
    recalibrateLocation,
    addCustomMarker,
    refreshMarkers,
    removeMarker,
    syncMarkers
  }));

  const initializeMap = async () => {
    try {
        const location = await getCurrLocation();
        setCurrLocation(location);

        if (!mapRef.current) {
            mapRef.current = new Map({
            attributionControl: false,
            container: "map",
            style: {
                version: 8,
                sources: {
                osm: {
                    type: "raster",
                    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                    tileSize: 256,
                    attribution: "© OpenStreetMap contributors",
                },
                },
                layers: [
                {
                    id: "osm",
                    type: "raster",
                    source: "osm",
                },
                ],
            },
            center: [location.longitude, location.latitude],
            maplibreLogo: false,
            zoom: 15,
            }).addControl(
                new AttributionControl({
                    compact: true,
                }),
            );

            mapRef.current.on('click', (e) => {
                const target = e.originalEvent.target as Element;
                if (!target || target.closest('.maplibregl-marker')) return;

                const coordinates = e.lngLat.wrap();
                if (onPositionClick) {
                    onPositionClick(coordinates.lat, coordinates.lng);
                }
            })

        // Wait for the map to finish its initial render
            mapRef.current.once &&
            mapRef.current.once("load", () => {
                setIsInitializing(false);
            });
            addUserLocationMarker(location);
        } else {
            setIsInitializing(false);
        }
            return mapRef.current;
        } catch (error) {
            console.error("Error initializing map:", error);
            setIsInitializing(false);
        }
    };

    useEffect(() => {
        initializeMap();
        

        return () => {
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current.clear();

            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);



    return (
        <div className="h-full flex flex-col">
        <div id="map" className="w-full h-full overflow-hidden relative">
            {isInitializing && <Loading />}

            <div className="z-1 absolute bottom-10 right-10">
            <DefaultButton
                className="rounded-full px-3 py-3 bg-white dark:invert cursor-pointer"
                onClick={() => recalibrateLocation()}
            >
                <Image
                src={"/starLogo.svg"}
                alt={"Location Logo"}
                width={40}
                height={40}
                />
            </DefaultButton>
            </div>
        </div>
        </div>
    );
});

export default MapComponent;
