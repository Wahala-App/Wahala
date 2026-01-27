"use client";

import React, {Suspense, useEffect, useRef, useCallback, useState} from "react";
import SearchAndAdd from "./SearchAndAdd";
import Loading from "./Loading";
import MapComponent from "../map/map";
import {Incident, Location} from "@/app/api/types";
import { getToken } from "../actions/auth";
import { UserOval } from "./UserOval";
import {supabase} from "../../lib/server/supabase";

export default function HomeComponent() {
  
  const mapRef = useRef<{
    recalibrateLocation: () => void;
    addCustomMarker: (incident: Incident) => void;
    refreshMarkers: () => void;
    syncMarkers: (incidentId: any) => void; //sync for deletion
  }>(null);

  const addRef = useRef<{
    openDialog: (location: Location) => void;
  }>(null);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const triggerRefresh = () => setRefreshCount((prev) => prev + 1);

   const fetchLocationPins = useCallback ( async () => {
        try {
          const idToken = await getToken();
          if (!idToken) {
            // If no user is logged in, we might want to clear existing markers
            // or simply not fetch any. For now, we'll just return.
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
            
            // Directly add the pins fetched from the database to the map
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
      }, []); // This will now work perfectly alongside your map effect
  
  const [pins, setPins] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

   useEffect(() => {
    // Fetch initial data
    fetchLocationPins();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('location_pins_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'location_pins',
        },
        (payload) => {
          console.log('Real-time update received:', payload);

          if (payload.eventType === 'INSERT') {
            // New pin added - add to top of list
            setPins((prev) => [payload.new as Incident, ...prev]);
            mapRef.current?.addCustomMarker(payload.new as Incident);

          } else if (payload.eventType === 'UPDATE') {
            // Pin updated - replace it
            setPins((prev) =>
              prev.map((pin) =>
                pin.id === payload.new.id ? (payload.new as Incident) : pin
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Pin deleted - remove it
            setPins((prev) => prev.filter((pin) => pin.id !== payload.old.id));
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

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshCount, fetchLocationPins]);


  const handleRecalibrate = () => {
    mapRef.current?.recalibrateLocation();
  };

  const handlePinAddition = (lat: number, lon: number) => {
    addRef.current?.openDialog({ latitude: lat, longitude: lon });
  }

  const handleMarkerPrimaryClick = (incidentId: string) => {
    //console.log("Marker clicked:", incidentId);
    setSelectedIncidentId((prev) => prev === null ? incidentId : null);
  };

  const handleMarkerSecondaryClick = async (incidentId: string) => {
    //console.log("Marker right clicked:", incidentId);
    try {
        const idToken = await getToken();

        const response = await fetch(`/api/dataHandler?id=${incidentId}`, {
            method: 'DELETE',
            headers: {
            'Authorization': `Bearer ${idToken}`,
            },
        });
      
        //No need to refresh simply delete the marker with specific id
        if (response.ok) {

            const incidentToDeleteId= await response.json(); 
            console.log("Yur=>", incidentToDeleteId)
            mapRef.current?.syncMarkers(incidentToDeleteId);

        } else { //Response not ok
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


  return (
    <div className="h-screen">
      <div className="flex h-full">
        {/* CHANGED: Hide SearchAndAdd on mobile (screens smaller than md) */}
        <div className="hidden md:flex flex-[0.2] flex-col items-center justify-center w-9/10">
          <SearchAndAdd
            addRef = {addRef}
            addCustomMarker={ (incident: Incident) => {mapRef.current?.addCustomMarker(incident)}}
            onIncidentChanged={triggerRefresh}
            incidentTrigger={refreshCount}
            selectedIncidentId={selectedIncidentId}
          />
        </div>
        {/* CHANGED: Full width on mobile, flex-[0.6] on desktop */}
        <div className="flex-1 md:flex-[0.8]">
          <Suspense fallback={<Loading />}>
            <MapComponent ref={mapRef} onMarkerPrimaryClick={handleMarkerPrimaryClick} onMarkerSecondaryClick={handleMarkerSecondaryClick} onPositionClick={(lat: number, lon: number) => handlePinAddition(lat, lon)}/>
            <div className="absolute top-4 right-4 z-10 text-black">
              <UserOval recalibrate={handleRecalibrate} />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
