import { Incident } from "../api/types";
import { typeOf, typeColor } from "../utils/incidentUtils";
import { MapPin, Shield, Eye, Share2, ChevronRight } from "lucide-react";
import clsx from "clsx";

interface IncidentDisplayProps extends Incident {
  onClick?: () => void;
}

export default function IncidentDisplay(props: IncidentDisplayProps) {
  const t = typeOf(props);
  const color = typeColor(t);

  return (
    <button
      onClick={props.onClick}
      className="w-full text-left rounded-3xl border border-foreground/5 bg-foreground/[0.02] hover:bg-foreground/[0.04] p-5 flex flex-col gap-4 transition-all group active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
            style={{ backgroundColor: `${color}15` }}
          >
            <div 
              className="w-6 h-6 rounded-full shadow-lg" 
              style={{ backgroundColor: color }} 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30">
              {t}
            </span>
            <div className="text-base font-black text-foreground leading-tight line-clamp-1">
              {props.title}
            </div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
          <ChevronRight className="w-4 h-4 text-foreground/40" />
        </div>
      </div>

      {props.description && (
        <div className="text-sm text-foreground/60 leading-relaxed line-clamp-2 font-medium">
          {props.description}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-foreground/40">
            <Shield className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Unconfirmed</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground/40">
            <Eye className="w-3.5 h-3.5 live-eye-pulse text-red-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">{props.update_count ?? 0}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-foreground/30">
          <MapPin className="w-3 h-3" />
          <span className="text-[10px] font-bold">Nearby</span>
        </div>
      </div>
    </button>
  );
}
