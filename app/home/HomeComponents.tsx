import { TextInput } from "../ui/TextInput";
import { PillButton, DefaultButton } from "../ui/button";
import { useState, useEffect } from "react";
import { IncidentType, Incident as IncidentType_Interface } from "../api/types";
import Incident from "../ui/Incident";
import Image from "next/image";
import { incidentToIcon } from "../map/mapUtils";
import { IncidentDialog } from "../ui/IncidentDialog";

export default function HomeComponents({
  addCustomMarker,
  selectedIncidentId,
}: {
  addCustomMarker: (
    iconPath: string,
    lat: number,
    lng: number,
    incidentId?: string,
  ) => void;
  selectedIncidentId?: string | null;
}) {
  useEffect(() => {
    // Wait for map to load, then add existing incidents
    const timer = setTimeout(async () => {
      const response = await fetch('/api/incidents');
      const incidents: IncidentType_Interface[] = await response.json();
      incidents.forEach((incident) => {
        const iconPath = incidentToIcon(incident.incidentType);
        addCustomMarker(
          iconPath,
          incident.location.latitude,
          incident.location.longitude,
          incident.id,
        );
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-10 p-10 h-screen">
      <div className="flex-[0.70]">
        <IncidentSearchComponent selectedIncidentId={selectedIncidentId} />
      </div>
      <div className="flex-[0.30]">
        <QuickAddComponent addCustomMarker={addCustomMarker} />
      </div>
    </div>
  );
}

function IncidentSearchComponent({
  selectedIncidentId,
}: {
  selectedIncidentId?: string | null;
}) {
  const commonIncidents = IncidentType;
  const [nearbyIncidents, setNearbyIncidents] = useState<IncidentType_Interface[]>([]);
  const [selectedIncidentType, setSelectedIncidentType] =
    useState<IncidentType | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      const response = await fetch('/api/incidents');
      const incidents = await response.json();
      setNearbyIncidents(incidents);
    };
    fetchIncidents();
  }, []);

  return (
    <div className="card">
      <div className="text-3xl font-bold mb-4">Search for nearby alerts</div>

      <TextInput type={"search"} placeholder={"Search"} title={"Search"} />

      <div className="gap-4 flex flex-wrap mb-8">
        {Object.values(commonIncidents).map((incident) => {
          return (
            <DefaultButton
              key={incident}
              className={
                "rounded-full px-2 outline outline-1 outline-foreground hover:bg-foreground hover:text-background" +
                (selectedIncidentType === incident
                  ? " bg-foreground text-background"
                  : " bg-background text-foreground")
              }
              onClick={() => {
                if (selectedIncidentType === incident) {
                  setSelectedIncidentType(null);
                } else {
                  setSelectedIncidentType(incident);
                }
              }}
            >
              {incident}
            </DefaultButton>
          );
        })}
      </div>

      {/* Incident List */}
      <div className="overflow-y-auto max-h-[40vh] no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shadow-sm px-4">
        {nearbyIncidents.map((incident, index) => {
          if (selectedIncidentId && incident.id !== selectedIncidentId) {
            return null;
          }

          if (
            selectedIncidentType &&
            incident.incidentType !== selectedIncidentType
          ) {
            return null;
          }

          return <Incident key={index} {...incident} />;
        })}
      </div>
    </div>
  );
}

function QuickAddComponent({
  addCustomMarker,
}: {
  addCustomMarker: (iconPath: string, lat: number, lng: number) => void;
}) {
  const quickAddTypes = Object.values(IncidentType);
  const [selectedIncident, setSelectedIncident] = useState<IncidentType | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const onQuickAdd = () => {
    if (selectedIncident) {
      setIsDialogOpen(true);
    }
  };

  const handleDialogSubmit = async (incidentData: {
    incidentType: IncidentType;
    title: string;
    description?: string;
    location: { latitude: number; longitude: number };
  }) => {
    // Create the incident using the API
    const response = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidentData)
    });
    
    const newIncident = await response.json();

    // Add marker to map
    const iconPath = incidentToIcon(incidentData.incidentType);
    addCustomMarker(
      iconPath,
      incidentData.location.latitude,
      incidentData.location.longitude,
    );

    // Reset selection
    setSelectedIncident(null);
    setIsDialogOpen(false);
  };

  const itemClicked = (item: IncidentType) => {
    setSelectedIncident(item);
  };

  return (
    <div className="card mb-5">
      <div className="text-3xl font-bold mb-8">Quick Add</div>

      <div className="text-xl font-black mb-8 grid grid-rows-2 gap-4 grid-cols-4">
        {quickAddTypes.map((item, index) => {
          return (
            <div key={item}>
              <DefaultButton
                className={`rounded-full p-4 shadow-lg outline outline-1 outline-foreground hover:bg-foreground hover:text-background ${selectedIncident === item ? "bg-foreground text-background" : "bg-background text-foreground"}`}
                onClick={() => itemClicked(item)}
              >
                <Image
                  src={incidentToIcon(item)}
                  alt={item}
                  width={40}
                  height={40}
                  className={
                    selectedIncident === item
                      ? "filter invert dark:invert-0"
                      : "dark:invert"
                  }
                />
              </DefaultButton>
            </div>
          );
        })}
      </div>

      <PillButton
        title={"Quick Add"}
        type={"button"}
        onClick={onQuickAdd}
        className={"rounded-full"}
        disabled={!selectedIncident}
      >
        <div className="font-bold text-l"> + Add </div>
      </PillButton>

      <IncidentDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedIncident(null);
        }}
        onSubmit={handleDialogSubmit}
        selectedIncidentType={selectedIncident || undefined}
      />
    </div>
  );
}
