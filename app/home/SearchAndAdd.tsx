import { useState, useEffect } from "react";
import { Incident, Location } from "../api/types";
import { IncidentSearch, IncidentSearchProps } from "./IncidentSearch";
import { QuickAdd, QuickAddProps } from "./QuickAdd";
import { getToken } from "@/app/actions/auth";

interface SearchAndAddProps extends IncidentSearchProps, QuickAddProps {
  addCustomMarker: (incident: Incident) => void;
  onIncidentChanged: () => void;
  incidentTrigger: number;
  selectedIncidentId?: string | null;
}

export default function SearchAndAdd(
  { 
    addCustomMarker, 
    onIncidentChanged, 
    selectedIncidentId, 
    incidentTrigger, 
    addRef,
    openDialog,
    setDialogLocation 
  }: SearchAndAddProps & { 
    addRef: any;
    openDialog: () => void;
    setDialogLocation: (location: Location | null) => void;
  }
) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const token = await getToken();
        if (!token) {
            return;
        }
        const response = await fetch('/api/dataHandler', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
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
      <div className="flex-[0.80] min-h-0">
        <IncidentSearch 
          selectedIncidentId={selectedIncidentId} 
          incidentTrigger={incidentTrigger} 
        />
      </div>

      <div className="flex-[0.20]">
        <QuickAdd
          ref={addRef}
          addCustomMarker={addCustomMarker} 
          onIncidentChanged={onIncidentChanged}
          openDialog={openDialog}
          setDialogLocation={setDialogLocation}
        />
      </div>
    </div>
  );
}