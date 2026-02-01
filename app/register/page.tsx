import SignUpComponent from "@/app/register/register";
import MapImage from "@/app/ui/LoginMap";

export default function RegisterPage() {
    return (
        <div className="flex h-screen">
            <div className="flex-1 lg:w-3/5 flex justify-center overflow-y-auto">
                <div className="w-full md:w-4/5 py-12"> {/* Changed from py-8 to py-12 */}
                    <SignUpComponent />
                </div>
            </div>
            <div className="hidden lg:block lg:flex-[0.6]">
                <MapImage />
            </div>
        </div>
    );
}