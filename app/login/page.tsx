// app/login/page.tsx
'use client'

import LoginComponent from "@/app/login/login";
import MapImage from "@/app/ui/LoginMap";

export default function LoginPage() {
  return (
    <div className="flex h-screen">
      {/* Left: Form */}
      <div className="flex-1 lg:w-3/5 flex items-center justify-center overflow-y-auto">
        <div className="w-full md:w-4/5 py-8">
          <LoginComponent />
        </div>
      </div>

      {/* Right: Map (desktop only) */}
      <div className="hidden lg:block lg:flex-[0.6]">
        <MapImage />
      </div>
    </div>
  );
}