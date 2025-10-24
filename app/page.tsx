"use client";

import { useAuth } from "./contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import HomeComponent from "./home/home";
import Loading from "./loading";

export default function Home() {
  const { isAuthenticated, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoaded, isAuthenticated, router]);

  if (!isLoaded) {
    return <Loading />;
  }

  if (isAuthenticated) {
    return <HomeComponent />;
  }

  return <Loading />;
}
