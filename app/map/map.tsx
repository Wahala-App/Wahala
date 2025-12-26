"use client";

import { AttributionControl, Map, Marker } from "maplibre-gl";
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

const MapComponent = forwardRef<MapRef, MapProps> (({ onMarkerPrimaryClick, onMarkerSecondaryClick, onPositionClick }, ref) => {
  const mapRef = useRef<Map | null>(null);
  const [currLocation, setCurrLocation] = useState<{
    latitude: number;
    longitude: number;
  }>(FALLBACK_LOCATION);
  const [isInitializing, setIsInitializing] = useState(true);

  const recalibrateLocation = () => {
    mapRef.current?.flyTo({
      center: [currLocation.longitude, currLocation.latitude],
      zoom: 15,
    });
  };

  const addCustomMarker = (
    incident: Incident
  ) => {
    if (!mapRef.current) return;

    const lat = incident.location.latitude;
    const lng = incident.location.longitude;
    //console.log("Adding custom marker at:", lat, lng);

    const el = incidentIcon(incident.incidentType)

    if (incident.id) {
        if (onMarkerPrimaryClick) {
            el.addEventListener("click", () => onMarkerPrimaryClick(incident.id));
        }

        if (onMarkerSecondaryClick) {
            el.addEventListener("contextmenu", () => onMarkerSecondaryClick(incident.id));
        }
    }

    new Marker({
      element: el,
      draggable: false,
    })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);
  };

  const refreshMarkers = async () => {
      document.querySelectorAll('.maplibregl-marker').forEach(marker => marker.remove());
  
        // Refetch and add markers
        const response = await fetch('/api/incidents');
        const incidents: Incident[] = await response.json();
        incidents.forEach(incident => addCustomMarker(incident));
    }

  useImperativeHandle(ref, () => ({
    recalibrateLocation,
    addCustomMarker,
    refreshMarkers,
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
      } else {
        setIsInitializing(false);
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div id="map" className="w-full h-full overflow-hidden relative">
        {isInitializing && <Loading />}

        <div className="z-1 absolute bottom-10 right-10">
          <DefaultButton
            className="rounded-full px-3 py-3 bg-white dark:invert cursor-pointer"
            onClick={recalibrateLocation}
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
