"use client";

import React, {Suspense, useEffect, useRef, useState} from "react";
import HomeComponents from "./HomeComponents";
import Loading from "./loading";
import MapComponent from "../map/map";
import Hamburger from "../ui/hamburger";
import Image from "next/image";
import {Incident} from "@/app/api/types";
import {IconText} from "@/app/ui/IconText";
import { PillButton } from "../ui/button";
import { auth } from "@/lib/firebase";
import { logout } from "../actions/auth";
import { useRouter } from "next/navigation";
import { handleUserState } from "@/src/contexts/AuthContext";

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
  const router = useRouter();
  const [isDetailsOpened, setIsDetailsOpened] = useState(false);
  const [address, setAddress] = useState("");

  useEffect(() => {
    const storedLocation = localStorage.getItem("userLocation");

    if (storedLocation) {
      setAddress(JSON.parse(storedLocation));
    } else {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            fetch(`/api/location?lat=${lat}&lng=${lng}`)
              .then((res) => res.json())
              .then((data) => {
                console.log(data.features[0]);
                const temp_address = data.features[0].properties.address_line1;
                setAddress(temp_address);
                localStorage.setItem("userLocation", JSON.stringify(temp_address));
              });
          },
          (error) => {
            console.error("Error getting user location:", error);
            fetch("/api/location").then(res => res.json()).then(/* handle fallback */);
          }
        );
      } else {
        console.log("Geolocation is not available");
        // Fallback for browsers without support
        fetch("/api/location").then(res => res.json()).then(/* handle fallback */);
      }
    }
  }, []);

  function handleOpenDetails() {
    setIsDetailsOpened(!isDetailsOpened);
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  }

  const userName: string = auth.currentUser?.email || "Username";

  const headerDialog: {[string: string] : string} = {
      "Latest News": "/iconText/news.svg",
      "Discussions": "/iconText/discuss.svg",
      "Help/Support": "/iconText/support.svg",
      "Settings": "/iconText/settings.svg",
  }

    return (
    <div className="flex-col gap-5 max-w-200px">
      <div className="flex flex-row gap-3 items-center bg-background text-foreground px-5 py-2 rounded-full">
        <Hamburger className="w-5 h-5 dark:invert" onClick={handleOpenDetails} />
        <div> {userName}</div>
        <div>|</div>
        <div> Reputation </div>
        <Image src="/starLogo.svg" alt="Star Logo" className={"dark:invert"} width={12} height={12} />
        <Image src="/starLogo.svg" alt="Star Logo" className={"dark:invert"} width={12} height={12} />
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
          U
        </div>
      </div>

      <div
        className={`mt-2 bg-background text-foreground px-2 py-2 rounded-xl overflow-hidden transition-all duration-300 ${isDetailsOpened ? "opacity-100" : "max-h-0 opacity-0"} `}
      >
        <div className="grid grid-cols-2 gap-2 my-5 mx-5">
            {Object.entries(headerDialog).map(([key, value]) => (
                <IconText
                    iconImage={value}
                    onClick={() => {}}
                    className={""}
                >
                    {key}
                </IconText>
            ))}
        </div>

        <div>
          <div className="flex flex-col gap-2 items-center">
            <div className="text-center font-thin">Current Location: {address}</div>{" "}

            <div
              className="text-center underline cursor-pointer"
              onClick={props.recalibrate}
            >
              Recalibrate
            </div>

            <div>
                <PillButton onClick={handleLogout} className="rounded-full py-2 cursor-pointer">
                    Log Out
                </PillButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
