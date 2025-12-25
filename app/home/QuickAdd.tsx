import { useState, forwardRef, useImperativeHandle } from "react";
import Image from "next/image";
import { PillButton, DefaultButton } from "../ui/button";
import { IncidentDialog } from "../ui/IncidentDialog";
import { Incident, IncidentType, Location} from "../api/types";
import { incidentToIcon } from "../map/mapUtils";

export interface QuickAddProps {
  addCustomMarker: (incident: Incident) => void;
  onIncidentAdded?: () => void;
}

interface QuickAddRef {
  openDialog: (currentLocation: Location) => void;
}

export const QuickAdd = forwardRef<QuickAddRef, QuickAddProps>(({ addCustomMarker, onIncidentAdded }, ref) => {
  const [selectedIncident, setSelectedIncident] = useState<IncidentType | null>(null);
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
      if (onIncidentAdded) {
        onIncidentAdded();
      }
    } catch (error) {
      console.error('Error creating incident:', error);
    } finally {
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedIncident(null);
    setLocation(null);
    setIsDialogOpen(false);
  }

  return (
    <div className="card mb-5">
      <div className="text-3xl font-bold mb-8">Quick Add</div>
      
      {/* Grid of Types */}
      <div className="text-xl font-black mb-8 grid grid-rows-2 gap-4 grid-cols-4">
        {Object.values(IncidentType).map((item) => (
          <div key={item}>
            <DefaultButton
              className={`rounded-full p-4 shadow-lg outline outline-1 outline-foreground hover:bg-foreground hover:text-background ${
                selectedIncident === item ? "bg-foreground text-background" : "bg-background text-foreground"
              }`}
              onClick={() => setSelectedIncident(prev => prev === item ? null : item)}
            >
              <Image 
                src={incidentToIcon(item)} 
                alt={item} 
                width={40} height={40} 
                className={selectedIncident === item ? "filter invert dark:invert-0" : "dark:invert"} 
              />
            </DefaultButton>
          </div>
        ))}
      </div>

      <PillButton
        title="Quick Add"
        onClick={() => setIsDialogOpen(true)}
        className="rounded-full"
        disabled={!selectedIncident}
      >
        <div className="font-bold text-l"> + Add </div>
      </PillButton>

      <IncidentDialog
        isOpen={isDialogOpen}
        onClose={handleClose}
        onSubmit={handleDialogSubmit}
        selectedIncidentType={selectedIncident || undefined}
        providedLocation={location}
      />
    </div>
  );
});

QuickAdd.displayName = 'QuickAdd';