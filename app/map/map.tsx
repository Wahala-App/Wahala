"use client";

import { AttributionControl, Map, Marker } from "maplibre-gl";
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import getCurrLocation, { FALLBACK_LOCATION } from "./mapUtils";
import { DefaultButton } from "../ui/button";
import Image from "next/image";
import Loading from "./loading";

const MapComponent = forwardRef<
  {
    recalibrateLocation: () => void;
    addCustomMarker: (
      iconPath: string,
      lat: number,
      lng: number,
      incidentId?: string,
    ) => void;
  },
  { onMarkerClick?: (incidentId: string) => void }
>(function MapComponent({ onMarkerClick }, ref) {
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
    iconPath: string,
    lat: number,
    lng: number,
    incidentId?: string,
  ) => {
    if (!mapRef.current) return;

    console.log("Adding custom marker at:", lat, lng);

    const el = document.createElement("div");
    el.className = "custom-marker";
    el.style.backgroundImage = `url(${iconPath})`;
    el.style.width = "40px";
    el.style.height = "40px";
    el.style.backgroundSize = "contain";
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundPosition = "center";
    el.style.cursor = "pointer";

    if (incidentId && onMarkerClick) {
      el.addEventListener("click", () => onMarkerClick(incidentId));
    }

    new Marker({
      element: el,
      draggable: false,
    })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);
  };

  useImperativeHandle(ref, () => ({
    recalibrateLocation,
    addCustomMarker,
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

    // Cleanup function to remove map when component unmounts
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
            className="rounded-full px-3 py-3 bg-white hover:bg-hover-light"
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
