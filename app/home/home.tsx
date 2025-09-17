"use client";

import MapComponent from "../map/map";
import HomeComponents from "../ui/HomeComponents";

export default function HomeComponent() {


    return (
        <div className="h-screen">
            <div className="flex h-full">
                <div className="flex-[0.4] flex items-center justify-center">
                    <div className="w-4/5">
                        <HomeComponents />
                    </div>
                </div>
                <div className="flex-[0.6]">
                    <MapComponent/>
                </div>
            </div>
        </div>
    )
}