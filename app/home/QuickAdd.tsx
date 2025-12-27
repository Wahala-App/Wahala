import { useState, forwardRef, useImperativeHandle } from "react";
import { PillButton, DefaultButton } from "../ui/button";
import { IncidentDialog } from "../ui/IncidentDialog";
import { Incident, IncidentType, Location} from "../api/types";

export interface QuickAddProps {
  addCustomMarker: (incident: Incident) => void;
  onIncidentChanged?: () => void;
}

interface QuickAddRef {
  openDialog: (currentLocation: Location) => void;
}

export const QuickAdd = forwardRef<QuickAddRef, QuickAddProps>(({ addCustomMarker, onIncidentChanged }, ref) => {
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
    //TODO: IMPLEMENT API FOR SAVING INCIDENT TO DATABASE
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData)
      });
      
      if (!response.ok) throw new Error('Failed to create incident');
      
      const newIncident = await response.json();
      addCustomMarker(newIncident); // Update Map
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
        <div className="font-bold text-l"> Report Incident at Current Location </div>
      </PillButton>

      <IncidentDialog
        isOpen={isDialogOpen}
        onClose={handleClose}
        onSubmit={handleDialogSubmit}
        selectedIncidentType={IncidentType.NONE}
        providedLocation={location}
      />
    </div>
  );
});

QuickAdd.displayName = 'QuickAdd';