import { TextInput } from "../ui/TextInput";
import { PillButton, DefaultButton } from "../ui/button";
import { useState } from "react";
import { getNearbyIncidents } from "../api/server";
import { IncidentType } from "../api/types";
import Incident from "../ui/Incident";
import Image from "next/image";
import { incidentToIcon } from "../map/mapUtils";

export default function HomeComponents() {
    return (
        <div className="flex flex-col gap-10 p-10 h-screen">
            <div className="flex-[0.70]">
                <IncidentSearchComponent />
            </div>
            <div className="flex-[0.30]">
                <QuickAddComponent />
            </div>
        </div>
    )
}

function IncidentSearchComponent() {
    const commonIncidents = IncidentType;
    const nearbyIncidents = getNearbyIncidents(); //Replace with some API call or constant'
    const [selectedIncidentType, setSelectedIncidentType] = useState<IncidentType | null>(null);
    

    return (
        <div className="card">
            <div className="text-3xl font-bold mb-4">
                Search for nearby alerts
            </div>

            <TextInput type={"search"} placeholder={"Search"} title={"Search"} />

            <div className="gap-4 flex flex-wrap mb-8">
                {Object.values(commonIncidents).map((incident) => 
                {
                    return (
                        <DefaultButton 
                            key={incident}
                            className={"rounded-full px-2 outline outline-1 outline-foreground hover:bg-foreground hover:text-background" + (selectedIncidentType === incident ? " bg-foreground text-background" : " bg-background text-foreground")}
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
                    )
                })}
            </div>

                {/* Incident List */}
            <div className="overflow-y-auto max-h-[40vh]">
                {nearbyIncidents.map((incident, index) => {
                    if (selectedIncidentType && incident.incidentType !== selectedIncidentType) {
                        return null;
                    }
                    
                    return (
                        <Incident key={index} {...incident} />
                    )
                })}
            </div>
        </div>
    )
}

function QuickAddComponent() {

    const quickAddTypes = Object.values(IncidentType);

    const onQuickAdd = () => {
        // Logic for quick add
    }

    const itemClicked = (item: string) => {
        console.log("Clicked on ", item);
    }

    return (
        <div className="card mb-5">
            <div className="text-3xl font-bold mb-8">
                Quick Add
            </div>

            <div className="text-xl font-black mb-8 grid grid-rows-2 gap-4 grid-cols-4">
                { quickAddTypes.map((item, index) => {
                    return (
                        <div key={item}>
                            <DefaultButton 
                                className="rounded-full p-4 shadow-lg"
                                onClick={() => itemClicked(item)}
                            >
                                <Image src={incidentToIcon(item)} alt={item} width={40} height={40} />
                            </DefaultButton>
                        </div>
                    )
                })}
            </div>

            <PillButton
                title={"Quick Add"}
                type={"button"}
                onClick={onQuickAdd}
                className={"rounded-full"}
            >
               <div className="font-bold text-l"> +  Add </div>
            </PillButton>
        </div>
    )
}