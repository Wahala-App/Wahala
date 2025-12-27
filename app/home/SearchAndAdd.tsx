import { useState, useEffect } from "react";
import { Incident } from "../api/types";
import { IncidentSearch, IncidentSearchProps } from "./IncidentSearch";
import { QuickAdd, QuickAddProps } from "./QuickAdd";

interface SearchAndAddProps extends IncidentSearchProps, QuickAddProps {
  addCustomMarker: (incident: Incident) => void;
  onIncidentChanged: () => void;
  incidentTrigger: number;
  selectedIncidentId?: string | null;
}

export default function SearchAndAdd(
     { addCustomMarker, onIncidentChanged, selectedIncidentId, incidentTrigger, addRef }: SearchAndAddProps & { addRef: any }
) {
  // Logic: Coordinate data refresh between siblings

  useEffect(() => {
    // Note: This timeout is a bit fragile (race condition risk with map load).
    // Consider checking if mapRef.current is ready instead of time.
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/incidents');
        const incidents: Incident[] = await response.json();
        incidents.forEach(addCustomMarker);
      } catch (e) {
        console.error(e);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [addCustomMarker]);


  return (
    <div className="flex flex-col gap-10 p-10 h-screen overflow-hidden">
      {/* Top Section: Search & List */}
      <div className="flex-[0.80] min-h-0">
        <IncidentSearch 
          selectedIncidentId={selectedIncidentId} 
          incidentTrigger={incidentTrigger} 
        />
      </div>

      {/* Bottom Section: Actions */}
      <div className="flex-[0.20]">
        <QuickAdd
          ref = {addRef}
          addCustomMarker={addCustomMarker} 
          onIncidentChanged={onIncidentChanged} 
        />
      </div>
    </div>
  );
}