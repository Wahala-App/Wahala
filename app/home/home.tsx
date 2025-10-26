"use client";

import React, { Suspense, useRef, useState } from "react";
import HomeComponents from "./HomeComponents";
import Loading from "./loading";
import MapComponent from "../map/map";
import Hamburger from "../ui/hamburger";
import Image from "next/image";
import {Incident} from "@/app/api/types";

export default function HomeComponent() {
  const mapRef = useRef<{
    recalibrateLocation: () => void;
    addCustomMarker: (
        incident: Incident,
    ) => void;
  }>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null,
  );

  const handleRecalibrate = () => {
    mapRef.current?.recalibrateLocation();
  };

  const handleMarkerClick = (incidentId: string) => {
    console.log("Marker clicked:", incidentId);
    setSelectedIncidentId(incidentId);
  };

  return (
    <div className="h-screen">
      <div className="flex h-full">
        <div className="flex-[0.4] flex flex-col items-center justify-center w-9/10">
          <HomeComponents
            addCustomMarker={(
                incident: Incident
            ) =>
              mapRef.current?.addCustomMarker(incident)
            }
            selectedIncidentId={selectedIncidentId}
          />
        </div>
        <div className="flex-[0.6]">
          <Suspense fallback={<Loading />}>
            <MapComponent ref={mapRef} onMarkerClick={handleMarkerClick} />
            <div className="absolute top-4 right-4 z-10 text-black">
              <UserOval recalibrate={handleRecalibrate} />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function UserOval(props: { recalibrate: () => void }) {
  const [isDetailsOpened, setIsDetailsOpened] = useState(false);

  function handleOpenDetails() {
    setIsDetailsOpened(!isDetailsOpened);
  }

  return (
    <div className="flex-col gap-5 max-w-200px">
      <div className="flex flex-row gap-3 items-center bg-white px-5 py-2 rounded-full">
        <Hamburger className="w-5 h-5" onClick={handleOpenDetails} />
        <div> Username</div>
        <div>|</div>
        <div> Reputation </div>
        <Image src="/starLogo.svg" alt="Star Logo" width={12} height={12} />
        <Image src="/starLogo.svg" alt="Star Logo" width={12} height={12} />
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
          U
        </div>
      </div>

      <div
        className={`mt-2 bg-white px-5 py-2 rounded-xl overflow-hidden transition-all duration-300 ${isDetailsOpened ? "max-h-48 opacity-100" : "max-h-0 opacity-0"} `}
      >
        <div className="grid grid-cols-2 gap-2 my-5 mx-5">
          <div className="">Latest News</div>
          <div className="">Discussion</div>

          <div className="">Help/Support</div>
          <div className="">Settings</div>
        </div>

        <div>
          <div className="flex-col gap-5 items-center">
            <div className="text-center">Current Location</div>{" "}
            {/** Get approximate address */}
            <div
              className="text-center underline cursor-pointer"
              onClick={props.recalibrate}
            >
              Recalibrate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
