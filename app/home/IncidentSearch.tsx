import { useState, useEffect, useMemo } from "react";
import { DefaultButton } from "../ui/button";
import IncidentDisplay from "../ui/IncidentDisplay";
import { Incident, IncidentType } from "../api/types";
import { getToken } from "@/app/actions/auth";
import { typeOf } from "../utils/incidentUtils";
import clsx from "clsx";

export interface IncidentSearchProps {
  selectedIncidentId?: string | null;
  incidentTrigger?: number | null;
  onOpenDetails: (id: string) => void;
}

export function IncidentSearch({ selectedIncidentId, incidentTrigger, onOpenDetails }: IncidentSearchProps) {
  const [nearbyIncidents, setNearbyIncidents] = useState<Incident[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<IncidentType>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const chipTypes = [
    IncidentType.ROBBERY,
    IncidentType.ASSAULT,
    IncidentType.THEFT,
    IncidentType.VANDALISM,
    IncidentType.DRUG_OFFENSE,
    IncidentType.PUBLIC_INTOXICATION,
    IncidentType.ELECTION_MALPRACTICE,
    IncidentType.OTHER,
  ];

  const toggleType = (t: IncidentType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  // Isolate fetching logic here
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setNearbyIncidents([]); // No user, no incidents
          return;
        }
        
        const response = await fetch('/api/dataHandler', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setNearbyIncidents(data);
      } catch (e) {
        console.error("Failed to fetch incidents", e);
      }
    };
    fetchIncidents(); 
  }, [incidentTrigger]);

  const filtered = useMemo(() => {
    return nearbyIncidents.filter((inc) => {
      const t = (inc.incidentType || inc.incident_type) as IncidentType;
      const typeMatch = selectedTypes.size === 0 || selectedTypes.has(t);
      
      const q = searchQuery.toLowerCase();
      const searchMatch = !q || 
        inc.title.toLowerCase().includes(q) || 
        (inc.description ?? "").toLowerCase().includes(q) ||
        typeOf(inc).toLowerCase().includes(q);

      const idMatch = !selectedIncidentId || inc.id === selectedIncidentId;

      return typeMatch && searchMatch && idMatch;
    });
  }, [nearbyIncidents, selectedTypes, searchQuery, selectedIncidentId]);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="space-y-4">
        <h2 className="text-xl font-black tracking-tight">Reports List</h2>
        
        {/* Search */}
        <div className="h-12 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 flex items-center group focus-within:border-foreground/20 transition-all">
          <span className="text-foreground/30 mr-3">⌕</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm font-medium placeholder:text-foreground/20"
            placeholder="Search reports..."
          />
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedTypes(new Set())}
            className={clsx(
              "h-8 px-4 rounded-full text-xs font-black uppercase tracking-widest border transition-all",
              selectedTypes.size === 0
                ? "bg-foreground text-background border-transparent"
                : "bg-background border-foreground/10 text-foreground/40 hover:border-foreground/20"
            )}
          >
            All
          </button>
          {chipTypes.map((t) => {
            const active = selectedTypes.has(t);
            return (
              <button
                key={`chip-${t}`}
                type="button"
                onClick={() => toggleType(t)}
                className={clsx(
                  "h-8 px-4 rounded-full text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                  active
                    ? "bg-foreground text-background border-transparent shadow-lg shadow-foreground/10 scale-105"
                    : "bg-background border-foreground/10 text-foreground/40 hover:border-foreground/20"
                )}
              >
                {t === IncidentType.PUBLIC_INTOXICATION ? "Public Intox." : t}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-4">
        {filtered.length === 0 ? (
          <div className="text-sm text-foreground/30 italic text-center py-10">
            No reports found.
          </div>
        ) : (
          filtered.map((incident, index) => (
            <IncidentDisplay 
              key={incident.id || index} 
              {...incident} 
              onClick={() => onOpenDetails(incident.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}