"use client";

import React, { Suspense } from "react";
import HomeComponents from "./HomeComponents";
import Loading from "./loading";
import MapComponent from "../map/map";

//const MapComponent = React.lazy(() => import("../map/map"));

export default function HomeComponent() {
    return (
        <div className="h-screen">
            <div className="flex h-full">
                <div className="flex-[0.4] flex items-center justify-center">
                    <div className="w-9/10">
                        <HomeComponents />
                    </div>
                </div>
                <div className="flex-[0.6]">
                    <Suspense fallback={<Loading />}>
                        <MapComponent />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}