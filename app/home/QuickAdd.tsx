import { forwardRef, useImperativeHandle } from "react";
import { PillButton } from "../ui/button";
import { Incident, Location } from "../api/types";

export interface QuickAddProps {
  addCustomMarker: (incident: Incident) => void;
  onIncidentChanged?: () => void;
  openDialog: () => void; // ADD THIS
  setDialogLocation: (location: Location | null) => void; // ADD THIS
}

interface QuickAddRef {
  openDialog: (currentLocation: Location) => void;
}

export const QuickAdd = forwardRef<QuickAddRef, QuickAddProps>(
  ({ openDialog, setDialogLocation }, ref) => {

  useImperativeHandle(ref, () => ({
    openDialog: (clickedLocation: Location) => {
      setDialogLocation(clickedLocation);
      openDialog();
    }
  }));

  const handleButtonClick = () => {
    setDialogLocation(null); // null = use current location
    openDialog();
  };

  return (
    <div className="card mb-5">
      <div className="text-3xl font-bold mb-8">Quick Add</div>

      <PillButton
        title="Quick Add"
        onClick={handleButtonClick}
        className="rounded-full"
      >
        <div className="font-bold text-l"> + Report Incident at Current Location </div>
      </PillButton>
    </div>
  );
});

QuickAdd.displayName = 'QuickAdd';