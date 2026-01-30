import { useState, useEffect, useMemo } from "react";
import { Incident, Location, IncidentType } from "../api/types";
import { IncidentSearch } from "./IncidentSearch";
import { QuickAdd } from "./QuickAdd";
import { getToken } from "@/app/actions/auth";
import { typeOf, typeColor, getHighlights, getTrends, getRecentAlerts } from "../utils/incidentUtils";
import clsx from "clsx";

type SearchAndAddTab = "home" | "reports" | "alerts";

interface SearchAndAddProps {
  addCustomMarker: (incident: Incident) => void;
  onIncidentChanged: () => void;
  incidentTrigger: number;
  selectedIncidentId?: string | null;
  addRef: any;
  openDialog: () => void;
  setDialogLocation: (location: Location | null) => void;
  userName: string;
  userLocation: string;
  pins: Incident[];
  onOpenDetails: (incidentId: string) => void;
  onCreateReport: () => void;
  activeTab?: SearchAndAddTab;
  onTabChange?: (tab: SearchAndAddTab) => void;
}

export default function SearchAndAdd(
  { 
    addCustomMarker, 
    onIncidentChanged, 
    selectedIncidentId, 
    incidentTrigger, 
    addRef,
    openDialog,
    setDialogLocation,
    userName,
    userLocation,
    pins,
    onOpenDetails,
    onCreateReport,
    activeTab: controlledTab,
    onTabChange,
  }: SearchAndAddProps
) {
  const [uncontrolledTab, setUncontrolledTab] = useState<SearchAndAddTab>("home");
  const activeTab: SearchAndAddTab = controlledTab ?? uncontrolledTab;
  const setActiveTab = (tab: SearchAndAddTab) => {
    if (onTabChange) onTabChange(tab);
    if (controlledTab === undefined) setUncontrolledTab(tab);
  };

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


  const highlights = useMemo(() => getHighlights(pins), [pins]);
  const trends = useMemo(() => getTrends(pins, userLocation), [pins, userLocation]);
  const recentAlerts = useMemo(() => getRecentAlerts(pins), [pins]);

  const buildCard = ({
    title,
    subtitle,
    type,
    onClick,
  }: {
    title: string;
    subtitle: string;
    type: string;
    onClick: () => void;
  }) => {
    const c = typeColor(type);
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-2xl border border-foreground/10 bg-background/50 hover:bg-foreground/5 p-4 flex items-center gap-4 transition-colors"
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${c}22` }}
        >
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-foreground truncate">{title}</div>
          <div className="text-sm text-foreground/60 truncate">{subtitle}</div>
        </div>
        <div className="text-foreground/50">→</div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden border-r border-foreground/10 bg-background shadow-xl">
      {/* Tab Navigation */}
      <div className="flex border-b border-foreground/10 p-2 gap-1">
        {(["home", "reports", "alerts"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "flex-1 py-2 text-sm font-bold rounded-lg transition-all capitalize",
              activeTab === tab
                ? "bg-foreground text-background"
                : "text-foreground/60 hover:bg-foreground/5"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === "home" && (
          <div className="p-6 space-y-8">
            {/* Welcome */}
            <div>
              <div className="text-2xl font-black tracking-tight leading-none">
                Welcome Back,
              </div>
              <div className="text-2xl font-black tracking-tight text-foreground/60">
                {userName}
              </div>
              <div className="mt-2 text-sm text-foreground/40 font-medium">
                Here's your summary for today.
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-4">
              <div className="text-xs font-black uppercase tracking-widest text-foreground/30">
                Trending Alerts
              </div>
              <div className="space-y-3">
                {trends.map((t) =>
                  buildCard({
                    title: t.title,
                    subtitle: t.summary,
                    type: t.type,
                    onClick: () => onOpenDetails(t.primaryIncidentId),
                  })
                )}
              </div>
            </div>

            {/* Recent */}
            <div className="space-y-4">
              <div className="text-xs font-black uppercase tracking-widest text-foreground/30">
                Recent Incidents
              </div>
              <div className="space-y-3">
                {recentAlerts.map((r) => {
                  const t = typeOf(r);
                  return buildCard({
                    title: r.title,
                    subtitle: `${userLocation || "Nearby"} • Recent`,
                    type: t,
                    onClick: () => onOpenDetails(r.id),
                  });
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="h-full flex flex-col p-6">
            <IncidentSearch 
              selectedIncidentId={selectedIncidentId} 
              incidentTrigger={incidentTrigger} 
              onOpenDetails={onOpenDetails}
            />
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="p-6 space-y-4">
            <div className="text-xs font-black uppercase tracking-widest text-foreground/30">
              Live Notifications
            </div>
            {recentAlerts.length === 0 ? (
              <div className="text-sm text-foreground/40 italic">No new alerts.</div>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((r) => {
                  const t = typeOf(r);
                  return (
                    <button
                      key={`alert-${r.id}`}
                      onClick={() => onOpenDetails(r.id)}
                      className="w-full text-left p-4 rounded-2xl bg-foreground/5 border border-foreground/5 hover:border-foreground/10 transition-all flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-foreground/10 text-foreground/60">
                          {t}
                        </span>
                        <span className="text-[10px] text-foreground/30 font-bold">
                          {r.date_time ? new Date(r.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-foreground mt-1">
                        {r.title}
                      </div>
                      <div className="text-xs text-foreground/60 line-clamp-2">
                        {r.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Add at bottom */}
      <div className="p-6 border-t border-foreground/10 bg-background/80 backdrop-blur-md">
        <button
          onClick={onCreateReport}
          className="w-full py-4 rounded-2xl bg-foreground text-background font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-foreground/10"
        >
          + Report Incident
        </button>
      </div>
    </div>
  );
}