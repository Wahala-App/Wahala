"use client";

import clsx from "clsx";

export type BottomNavTab = "home" | "map" | "report" | "alerts" | "profile";

type BottomNavItem = {
  id: BottomNavTab;
  label: string;
};

const items: BottomNavItem[] = [
  { id: "home", label: "Home" },
  { id: "map", label: "Map" },
  { id: "report", label: "Report" },
  { id: "alerts", label: "Alerts" },
  { id: "profile", label: "Profile" },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={clsx(active ? "opacity-100" : "opacity-80")}
    >
      <path
        d="M3 11.5L12 4l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={clsx(active ? "opacity-100" : "opacity-80")}
    >
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 10.25a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function AlertsIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={clsx(active ? "opacity-100" : "opacity-80")}
    >
      <path
        d="M12 22a2.25 2.25 0 0 0 2.2-1.7H9.8A2.25 2.25 0 0 0 12 22Z"
        fill="currentColor"
        opacity={active ? 0.9 : 0.6}
      />
      <path
        d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReportIcon({ active }: { active: boolean }) {
  // Match Flutter: larger add-circle icon in the middle tab item (not a floating circle button)
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={clsx(active ? "opacity-100" : "opacity-90")}
    >
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={clsx(active ? "opacity-100" : "opacity-80")}
    >
      <path
        d="M20 21a8 8 0 1 0-16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BottomNav({
  activeTab,
  onTabPress,
  onReport,
  className,
}: {
  activeTab: BottomNavTab;
  onTabPress: (tab: BottomNavTab) => void;
  onReport: () => void;
  className?: string;
}) {
  return (
    <nav
      className={clsx(
        "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-foreground/10",
        className
      )}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto max-w-screen-sm px-2">
        <div className="h-16 grid grid-cols-5">
          {items.map((item) => {
            const isActive = activeTab === item.id;
            const onClick =
              item.id === "report" ? () => onReport() : () => onTabPress(item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={onClick}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 text-[11px] select-none",
                  isActive ? "text-foreground" : "text-foreground/60"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="w-10 h-9 rounded-xl flex items-center justify-center">
                  {item.id === "home" && <HomeIcon active={isActive} />}
                  {item.id === "map" && <MapIcon active={isActive} />}
                  {item.id === "report" && <ReportIcon active={isActive} />}
                  {item.id === "alerts" && <AlertsIcon active={isActive} />}
                  {item.id === "profile" && <UserIcon active={isActive} />}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

