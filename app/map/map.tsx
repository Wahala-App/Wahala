"use client";

import { AttributionControl, Map } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import getCurrLocation, { FALLBACK_LOCATION } from "./mapUtils";
import { DefaultButton } from "../ui/button";
import Image from "next/image";

export default function MapComponent() {
    const mapRef = useRef<Map | null>(null);
    const [currLocation, setCurrLocation] = useState<{latitude: number, longitude: number}>(FALLBACK_LOCATION);

    const handleStarLogoClick = () => {
        mapRef.current?.flyTo({
            center: [currLocation.longitude, currLocation.latitude],
            zoom: 15
        });
    }

    const initializeMap = async() => {
        try {
            const location = await getCurrLocation()
            setCurrLocation(location);

            if (!mapRef.current) {
                mapRef.current = new Map({
                    attributionControl: false,
                    container: "map",
                    style: {
                        version: 8,
                        sources: {
                            'osm': {
                                type: 'raster',
                                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                                tileSize: 256,
                                attribution: '© OpenStreetMap contributors'
                            }
                        },
                        layers: [
                            {
                                id: 'osm',
                                type: 'raster',
                                source: 'osm'
                            }
                        ]
                    },
                    center: [currLocation.longitude, currLocation.latitude],
                    maplibreLogo: false,    
                    zoom: 15,
                }).addControl(new AttributionControl({
                    compact: true
                }));
            }
        } catch (error) {
            console.error('Error initializing map:', error);
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
            <div id="map" className="w-full h-full overflow-hidden">
                <div className="z-1 absolute bottom-10 right-10">
                    <DefaultButton 
                        className="rounded-full px-3 py-3 bg-white hover:bg-hover-light"
                        onClick={handleStarLogoClick}
                    >
                        <Image src={"/starLogo.svg"} alt={"Location Logo"} width={40} height={40} />
                    </DefaultButton>
                </div>
            </div>
        </div>
    )
}