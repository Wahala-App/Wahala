import Image from "next/image";
import {IconText} from "@/app/ui/IconText";
import { PillButton } from "../ui/button";
import { auth } from "@/lib/firebase";
import { logout, getToken } from "../actions/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Hamburger from "../ui/hamburger";

export const UserOval = (props: { recalibrate: () => void }) => {
  const router = useRouter();
  const [isDetailsOpened, setIsDetailsOpened] = useState(false);
  const [address, setAddress] = useState("");
  const [userName, setUserName] = useState<string>("User");
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

  // NEW: Fetch and store username
  useEffect(() => {
    const fetchAndStoreUserName = async () => {
      // Check if username is already in localStorage
      const storedUserName = localStorage.getItem("userName");
      if (storedUserName) {
        return; // Already fetched
      }

      try {
        const idToken = await getToken();
        if (!idToken) {
          return;
        }
        
        const response = await fetch('/api/user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user_name) {
            localStorage.setItem("userName", data.user_name);
            setUserName(data.user_name)
          }
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };

    fetchAndStoreUserName();
  }, []);

  function handleOpenDetails() {
    setIsDetailsOpened(!isDetailsOpened);
  }

  const handleLogout = async () => {
    // Clear stored username on logout
    localStorage.removeItem("userName");
    await logout();
    router.push("/login");
  }

   //userName = localStorage.getItem("userName")|| "Username";

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