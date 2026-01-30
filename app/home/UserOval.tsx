import Image from "next/image";
import { PillButton } from "../ui/button";
import { logout } from "../actions/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Shield, ChevronDown, LogOut, MapPin, User as UserIcon } from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/src/contexts/ThemeContext";

interface UserOvalProps {
  recalibrate: () => void;
  userName: string;
  email: string;
  alertCount?: number;
  userLocation?: string;
}

export const UserOval = ({
  recalibrate,
  userName,
  email,
  alertCount = 0,
  userLocation,
}: UserOvalProps) => {
  const router = useRouter();
  const { themeChoice, setThemeChoice } = useTheme();
  const [isDetailsOpened, setIsDetailsOpened] = useState(false);
  const [address, setAddress] = useState("");
  
  const userInitial = (userName?.trim()?.[0] ?? "U").toUpperCase();

  // Update address from prop or localStorage
  useEffect(() => {
    if (userLocation) {
      setAddress(userLocation);
    } else {
      const storedLocation = localStorage.getItem("userLocation");
      if (storedLocation) {
        try {
          setAddress(JSON.parse(storedLocation));
        } catch {
          setAddress(storedLocation);
        }
      }
    }
  }, [userLocation]);

  const handleLogout = async () => {
    localStorage.removeItem("userName");
    await logout();
    router.push("/login");
  };

  return (
    <div className="relative flex flex-col items-end gap-2">
      {/* Premium Top Bar */}
      <div className="flex items-center gap-2">
        {/* Alerts Badge */}
        <button 
          className="relative w-10 h-10 rounded-full bg-background border border-foreground/10 flex items-center justify-center hover:bg-foreground/5 transition-all shadow-lg text-foreground"
          aria-label="Alerts"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-background">
              {alertCount}
            </span>
          )}
        </button>

        {/* Profile Pill */}
        <button
          onClick={() => setIsDetailsOpened(!isDetailsOpened)}
          className={clsx(
            "flex items-center gap-3 bg-background border border-foreground/10 pl-2 pr-4 py-1.5 rounded-full hover:border-foreground/20 transition-all shadow-lg group",
            isDetailsOpened && "border-foreground/30 ring-4 ring-foreground/5"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-black text-sm">
            {userInitial}
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80 mb-0.5">
              Citizen
            </span>
            <div className="flex items-center gap-1.5 text-foreground">
              <span className="text-sm font-bold truncate max-w-[100px]">{userName}</span>
              <Shield className="w-3 h-3 text-emerald-500" />
              <ChevronDown className={clsx("w-3 h-3 transition-transform text-foreground/80", isDetailsOpened && "rotate-180")} />
            </div>
          </div>
        </button>
      </div>

      {/* Enhanced Dropdown Menu */}
      {isDetailsOpened && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDetailsOpened(false)} 
          />
          <div className="absolute top-14 right-0 z-50 w-72 bg-background border border-foreground/10 rounded-3xl shadow-2xl p-2 animate-in fade-in zoom-in duration-200">
            {/* Header / Info */}
            <div className="p-4 flex items-center gap-4 border-b border-foreground/5 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-foreground/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-black truncate text-foreground">{userName}</div>
                <div className="text-xs text-foreground/80 font-medium truncate">{email}</div>
              </div>
            </div>

            {/* Reputation Section */}
            <div className="mx-2 p-4 bg-foreground/5 rounded-2xl mb-2 flex items-center justify-between border border-foreground/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
                  Reputation
                </span>
                <span className="text-lg font-black mt-0.5 text-foreground">Legendary</span>
              </div>
              <div className="flex -space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Shield key={i} className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                ))}
              </div>
            </div>

            {/* Location Section */}
            <div className="px-2 mb-2">
              <div className="p-4 flex flex-col gap-2 bg-foreground/5 rounded-2xl border border-foreground/5">
                <div className="flex items-center gap-2 text-foreground/80">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Current Location</span>
                </div>
                <div className="text-xs font-bold line-clamp-2 text-foreground">
                  {address || "Locating..."}
                </div>
                <button
                  onClick={() => {
                    recalibrate();
                    setIsDetailsOpened(false);
                  }}
                  className="mt-1 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 w-fit underline decoration-2 underline-offset-2"
                >
                  Recalibrate
                </button>
              </div>
            </div>

            {/* Theme Section */}
            <div className="px-2 mb-2">
              <div className="p-4 bg-foreground/5 rounded-2xl border border-foreground/5">
                <div className="text-[10px] font-black uppercase tracking-widest text-foreground/80 mb-2">
                  Theme
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["light", "dark", "system"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setThemeChoice(opt)}
                      className={clsx(
                        "h-9 rounded-xl border text-[11px] font-bold transition-colors",
                        themeChoice === opt
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-foreground/10 hover:bg-foreground/5"
                      )}
                    >
                      {opt === "light" ? "Light" : opt === "dark" ? "Dark" : "System"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-red-500/10 text-red-500 transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};