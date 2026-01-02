import { useState, forwardRef, useImperativeHandle } from "react";
import Image from "next/image";
import { PillButton, DefaultButton } from "../ui/button";
import { IncidentDialog } from "../ui/IncidentDialog";
import { Incident, IncidentType, Location} from "../api/types";
import { incidentToIcon } from "../map/mapUtils";
import { useEffect } from "react";
import { getToken } from "@/app/actions/auth";

export interface QuickAddProps {
  addCustomMarker: (incident: Incident) => void;
  onIncidentChanged?: () => void;
}

interface QuickAddRef {
  openDialog: (currentLocation: Location) => void;
}

export const QuickAdd = forwardRef<QuickAddRef, QuickAddProps>(({ addCustomMarker, onIncidentChanged }, ref) => {
  const [selectedIncident, setSelectedIncident] = useState<IncidentType>(IncidentType.NONE);
  const [location, setLocation] = useState<Location | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    openDialog: (clickedLocation: Location) => {
        setIsDialogOpen(true);
        setLocation(clickedLocation);
        //console.log("Location is here", clickedLocation)
    }
  }));

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
      
      // The dataHandler API doesn't return the full incident,
      // so we use the local incidentData to update the UI.
      addCustomMarker(incidentData); // Update Map
      if (onIncidentChanged) {
        onIncidentChanged();
      }
    } catch (error) {
      console.error('Error creating incident:', error);
    } finally {
      handleClose();
    }
  };

  const handleClose = () => {
    setLocation(null);
    setIsDialogOpen(false);
  }

  return (
    <div className="card mb-5">
      <div className="text-3xl font-bold mb-8">Quick Add</div>

      <PillButton
        title="Quick Add"
        onClick={() => setIsDialogOpen(true)}
        className="rounded-full"
      >
        <div className="font-bold text-l"> + Report Incident at Current Location </div>
      </PillButton>

      <IncidentDialog
        isOpen={isDialogOpen}
        onClose={handleClose}
        onSubmit={handleDialogSubmit}
        selectedIncidentType={selectedIncident}
        providedLocation={location}
      />
    </div>
  );
});

QuickAdd.displayName = 'QuickAdd';