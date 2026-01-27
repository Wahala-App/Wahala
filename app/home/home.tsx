"use client";

import React, {Suspense, useEffect, useRef, useCallback, useState} from "react";
import SearchAndAdd from "./SearchAndAdd";
import Loading from "./Loading";
import MapComponent from "../map/map";
import {Incident, Location, IncidentType} from "@/app/api/types";
import { getToken } from "../actions/auth";
import { UserOval } from "./UserOval";
import {supabase} from "../../lib/server/supabase";
import { IncidentDialog } from "../ui/IncidentDialog";

export default function HomeComponent() {
  
  const mapRef = useRef<{
    recalibrateLocation: () => void;
    addCustomMarker: (incident: Incident) => void;
    refreshMarkers: () => void;
    syncMarkers: (incidentId: any) => void;
  }>(null);

  const addRef = useRef<{
    openDialog: (location: Location) => void;
  }>(null);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // ADD: Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogLocation, setDialogLocation] = useState<Location | null>(null);
  const [selectedIncidentType] = useState<IncidentType>(IncidentType.NONE);

  const triggerRefresh = () => setRefreshCount((prev) => prev + 1);

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
  
  const [pins, setPins] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

   useEffect(() => {
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
            mapRef.current?.addCustomMarker(payload.new as Incident);

          } else if (payload.eventType === 'UPDATE') {
            setPins((prev) =>
              prev.map((pin) =>
                pin.id === payload.new.id ? (payload.new as Incident) : pin
              )
            );
          } else if (payload.eventType === 'DELETE') {
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshCount, fetchLocationPins]);


  const handleRecalibrate = () => {
    mapRef.current?.recalibrateLocation();
  };

  const handlePinAddition = (lat: number, lon: number) => {
    // Open dialog with clicked location
    setDialogLocation({ latitude: lat, longitude: lon });
    setIsDialogOpen(true);
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

  const handleMarkerPrimaryClick = (incidentId: string) => {
    setSelectedIncidentId((prev) => prev === null ? incidentId : null);
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

  return (
    <div className="h-screen">
      <div className="flex h-full">
        {/* Hide SearchAndAdd on mobile */}
        <div className="hidden md:flex flex-[0.2] flex-col items-center justify-center w-9/10">
          <SearchAndAdd
            addRef = {addRef}
            addCustomMarker={ (incident: Incident) => {mapRef.current?.addCustomMarker(incident)}}
            onIncidentChanged={triggerRefresh}
            incidentTrigger={refreshCount}
            selectedIncidentId={selectedIncidentId}
            // Pass dialog handlers to QuickAdd
            openDialog={() => setIsDialogOpen(true)}
            setDialogLocation={setDialogLocation}
          />
        </div>
        {/* Full width on mobile */}
        <div className="flex-1 md:flex-[0.8]">
          <Suspense fallback={<Loading />}>
            <MapComponent 
              ref={mapRef} 
              onMarkerPrimaryClick={handleMarkerPrimaryClick} 
              onMarkerSecondaryClick={handleMarkerSecondaryClick} 
              onPositionClick={(lat: number, lon: number) => handlePinAddition(lat, lon)}
            />
            <div className="absolute top-4 right-4 z-10 text-black">
              <UserOval recalibrate={handleRecalibrate} />
            </div>
          </Suspense>
        </div>
      </div>

      {/* ADD: Dialog at root level - works on mobile and desktop */}
      <IncidentDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        selectedIncidentType={selectedIncidentType}
        providedLocation={dialogLocation}
      />
    </div>
  );
}