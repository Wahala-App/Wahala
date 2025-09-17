import TextInput from "./TextInput";
import { Button } from "./button";
import { useState } from "react";

export default function HomeComponents() {
    return (
        <div className="flex flex-col gap-10 mt-10 mb-10">
            <IncidentSearchComponent />
            <QuickAddComponent />
        </div>
    )
}

function IncidentSearchComponent() {
    return (
        <div className="card">
            <div className="text-3xl font-bold mb-8">
                Search for nearby alerts
            </div>

            <TextInput title={"Search"} type={"search"} placeholder={"Search"} />
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
        <div className="card">
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