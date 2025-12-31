"use client";

import React, {Suspense, useEffect, useRef, useCallback, useState} from "react";
import SearchAndAdd from "./SearchAndAdd";
import Loading from "./Loading";
import MapComponent from "../map/map";
import Hamburger from "../ui/hamburger";
import Image from "next/image";
import {Incident, Location} from "@/app/api/types";
import {IconText} from "@/app/ui/IconText";
import { PillButton } from "../ui/button";
import { auth } from "@/lib/firebase";
import { logout } from "../actions/auth";
import { useRouter } from "next/navigation";
import { retrieveLocationPins, } from "../actions/dataHandler";
import { formatInTimeZone, format } from 'date-fns-tz';
import { getToken } from "../actions/auth";
export default function HomeComponent() {
  
  const mapRef = useRef<{
    recalibrateLocation: () => void;
    addCustomMarker: (incident: Incident) => void;
    refreshMarkers: () => void;
    syncMarkers: (incidentId: any) => void;
  }>(null);

  const addRef = useRef<{
    openDialog: (location: Location) => void;
  }>(null);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const triggerRefresh = () => setRefreshCount((prev) => prev + 1);

   const fetchLocationPins = useCallback ( async () => {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log(timeZone); // e.g., "America/New_York"

        const now = new Date();
        const  today= formatInTimeZone(now, timeZone, 'yyyy-MM-dd');
  
        try {

          //Resets list of locally stored pin ids and cache
          await fetch('/api/incidents', { method: 'PUT' }); //Important

          const idToken = await getToken();
          
          const response = await fetch('/api/dataHandler', {
                method: 'GET',
                 headers: {
                  'Authorization': `Bearer ${idToken}`,
                },
             });
          
          let pins;
          if (response.ok) {
            pins = await response.json(); 
  
          for (const pin of pins)
          {
               if (mapRef.current) {
                const response = await fetch('/api/incidents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(pin)
                 });
  
                 if (response.ok) {

                  if (response.status === 201)
                  {
                  const incident = await response.json(); 
                  console.log("Here is your new incident:", incident);
                  mapRef.current.addCustomMarker(incident);
                  }
                }
                else
                {
                  console.log("Response is not ok!: ")
                } 
              }

              else
              {
                 console.log("Map methods not available") 
              }
            }
        }
  
        } catch (err) {
          console.log(err);
        }
      }, []); // This will now work perfectly alongside your map effect
  
    // Run on mount AND whenever refreshKey changes
  useEffect(() => {
    fetchLocationPins();
  }, [refreshCount, fetchLocationPins]);


  const handleRecalibrate = () => {
    mapRef.current?.recalibrateLocation();
  };

  const handlePinAddition = (lat: number, lon: number) => {
    addRef.current?.openDialog({ latitude: lat, longitude: lon });
  }

  const handleMarkerPrimaryClick = (incidentId: string) => {
    //console.log("Marker clicked:", incidentId);
    setSelectedIncidentId((prev) => prev === null ? incidentId : null);
  };

  const handleMarkerSecondaryClick = async (incidentId: string) => {
    console.log("Marker right clicked:", incidentId);
    try {
         const idToken = await getToken();

        const response = await fetch(`/api/incidents?id=${incidentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      
      //No need to refresh simply delete the marker with specific id
      if (response.ok) {

      const incidentToDelete = await response.json(); 
     // triggerRefresh()
      mapRef.current?.syncMarkers(incidentToDelete);
      
      }
      else  { //Response not ok
        const errorText = await response.text();
        console.error('Delete failed:', response.status, errorText);
        return;        return;
      }
      
    } catch (error) {
        console.error('Error creating incident:', error);
    } finally {
        if (incidentId == selectedIncidentId) { setSelectedIncidentId(null) }
    }
  }

  return (
    <div className="h-screen">
      <div className="flex h-full">
        <div className="flex-[0.4] flex flex-col items-center justify-center w-9/10">
          <SearchAndAdd
            addRef = {addRef}
            addCustomMarker={ (incident: Incident) => {mapRef.current?.addCustomMarker(incident)}}
            onIncidentChanged={triggerRefresh}
            incidentTrigger={refreshCount}
            selectedIncidentId={selectedIncidentId}
          />
        </div>
        <div className="flex-[0.6]">
          <Suspense fallback={<Loading />}>
            <MapComponent ref={mapRef} onMarkerPrimaryClick={handleMarkerPrimaryClick} onMarkerSecondaryClick={handleMarkerSecondaryClick} onPositionClick={(lat: number, lon: number) => handlePinAddition(lat, lon)}/>
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

                if (data?.features && Array.isArray(data.features) && data.features.length > 0)
                {
                  console.log(data.features[0]);
                  const temp_address = data.features[0].properties.address_line1;
                  setAddress(temp_address);
                  localStorage.setItem("userLocation", JSON.stringify(temp_address));
                }
               
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
          UF
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
