import { useState, useEffect } from "react";
import { DefaultButton } from "../ui/button";
import IncidentDisplay from "../ui/IncidentDisplay";
import { Incident, IncidentType } from "../api/types";
import { TextInput } from "../ui/TextInput";

export interface IncidentSearchProps {
  selectedIncidentId?: string | null;
  incidentTrigger?: number | null;
}

export function IncidentSearch({ selectedIncidentId, incidentTrigger }: IncidentSearchProps) {
  const [nearbyIncidents, setNearbyIncidents] = useState<Incident[]>([]);
  const [selectedIncidentType, setSelectedIncidentType] = useState<IncidentType | null>(null);

  // Isolate fetching logic here
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch('/api/incidents');
        const data = await response.json();
        setNearbyIncidents(data);
      } catch (e) {
        console.error("Failed to fetch incidents", e);
      }
    };
    fetchIncidents(); 
    // TODO : IMPLEMENT API FOR GETTING NEARBY INCIDENTS
  }, [incidentTrigger]);

  return (
    <div className="card h-full flex flex-col">
      <div className="text-3xl font-bold mb-4">Search for nearby alerts</div>
      <TextInput type="search" placeholder="Search" title="Search" />

      {/* Filter Buttons */}
      <div className="gap-4 flex flex-wrap mb-8">
        {Object.values(IncidentType).map((incident) => (
          <DefaultButton
            key={incident}
            className={`rounded-full px-2 outline outline-1 outline-foreground hover:bg-foreground hover:text-background ${
              selectedIncidentType === incident ? " bg-foreground text-background" : " bg-background text-foreground"
            }`}
            onClick={() => setSelectedIncidentType(prev => prev === incident ? null : incident)}
          >
            {incident}
          </DefaultButton>
        ))}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 no-scrollbar shadow-sm px-4">
        {nearbyIncidents
          .filter(inc => !selectedIncidentId || inc.id === selectedIncidentId)
          .filter(inc => !selectedIncidentType || inc.incidentType === selectedIncidentType)
          .map((incident, index) => (
            <IncidentDisplay key={incident.id || index} {...incident} />
        ))}
      </div>
    </div>
  );
}