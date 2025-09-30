import Spinner from "../ui/spinner";

export default function Loading() {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/75">
            <div className="flex flex-col items-center space-y-4">

                <Spinner size={50} borderWidth={5} />

                <div className="text-center">
                    <p className="font-medium">Initializing map...</p>
                    <p className="text-sm text-muted-foreground">Grant location access or wait a moment</p>
                </div>
            </div>
        </div>
    )
}