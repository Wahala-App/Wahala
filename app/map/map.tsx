"use client";

import { AttributionControl, Map } from "maplibre-gl";
import { useEffect, useRef } from "react";

export default function MapComponent() {
    const mapRef = useRef<Map | null>(null);

    useEffect(() => {
        // Only create map if it doesn't exist
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
                center: [-81.7856512, 32.4173824],
                maplibreLogo: false,    
                zoom: 15,
            }).addControl(new AttributionControl({
                compact: true
            }));
        }

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
            <div id="map" className="w-full h-full overflow-hidden"></div>
        </div>
    )
}