import { TextInputWithoutTitle } from "../ui/TextInput";
import { Button, DefaultButton } from "../ui/button";
import { useState } from "react";
import { getNearbyIncidents } from "../api/server";
import { IncidentType } from "../api/types";
import Incident from "../ui/Incident";

export default function HomeComponents() {
    return (
        <div className="flex flex-col gap-10 mt-2">
            <IncidentSearchComponent />
            <QuickAddComponent />
        </div>
    )
}

function IncidentSearchComponent() {
    const commonIncidents = IncidentType;
    const nearbyIncidents = getNearbyIncidents(); //Replace with some API call or constant'
    

    return (
        <div className="card">
            <div className="text-3xl font-bold mb-4">
                Search for nearby alerts
            </div>

            <TextInputWithoutTitle type={"search"} placeholder={"Search"} title={"Search"} />

            <div className="gap-4 flex flex-wrap mb-8">
                {Object.values(commonIncidents).map((incident) => 
                {
                    return (
                        <DefaultButton 
                            key={incident}
                            className={"rounded-full px-2 outline outline-1 outline-foreground"}
                        >
                            {incident}
                        </DefaultButton>
                    )
                })}
            </div>

            <div className="details-container">
                {nearbyIncidents.map((incident, index) => {
                    return (
                        <Incident key={index} {...incident} />
                    )
                })}
            </div>
        </div>
    )
}

function QuickAddComponent() {

    const [quickAddTypes, setQuickAddTypes] = useState<string[]>([]);

    const onQuickAdd = () => {
        if (quickAddTypes.length < 8) {
            setQuickAddTypes([...quickAddTypes, "Crime"]);
        }
    }

    return (
        <div className="card mb-5">
            <div className="text-3xl font-bold mb-8">
                Quick Add
            </div>

            <div className="text-xl font-black mb-8 grid grid-rows-2 gap-4 grid-cols-4">
                { quickAddTypes.map((item, index) => {
                    return (
                        <div key={index}>{item}</div>
                    )
                })}
            </div>

            <Button
                title={"Quick Add"}
                type={"button"}
                onClick={onQuickAdd}
                className={"rounded-full"}
            >
               <div className="font-bold text-l"> +  Add </div>
            </Button>
        </div>
    )
}