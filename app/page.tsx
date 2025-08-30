import LoginComponent from "@/app/login/login";
import MapImage from "@/app/ui/LoginMap";


export default function Home() {
  return (
      <div className="flex min-h-screen">
          <div className="flex-[0.6] flex items-center justify-center">
              <div className="w-4/5">
                  <LoginComponent/>
              </div>
          </div>
          <div className="flex-[0.4]">
              <MapImage/>
          </div>
      </div>
          );
}
