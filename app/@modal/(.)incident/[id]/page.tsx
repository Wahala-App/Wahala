"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import IncidentFeedContent from "@/app/incident/[id]/IncidentFeedContent";

export default function IncidentModal() {
  const router = useRouter();

  const handleClose = () => {
    router.back(); // This won't refresh the map!
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={handleClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 pointer-events-none">
        <div 
          className="w-full max-w-md h-full md:h-[90vh] bg-background md:rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-0"
          onClick={(e) => e.stopPropagation()}
        >
          <IncidentFeedContent 
            onClose={handleClose}
            isModal={true}
          />
        </div>
      </div>
    </>
  );
}