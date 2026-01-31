import VerifyEmailComponent from "@/app/verify/verify";
import MapImage from "@/app/ui/LoginMap";

export default function VerifyEmailPage() {
    return (
        <div className="flex h-screen">
            <div className="flex-1 lg:w-3/5 flex items-center justify-center overflow-y-auto">
                <div className="w-full py-8">
                    <VerifyEmailComponent />
                </div>
            </div>
            <div className="hidden lg:block lg:flex-[0.6]">
                <MapImage />
            </div>
        </div>
    );
}