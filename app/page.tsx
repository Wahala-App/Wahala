"use client";

// import { useAuth } from "./contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import HomeComponent from "./home/home";
import Loading from "./loading";
import {login, signup } from "@/app/actions/auth";
import { useLoading, handleUserState } from "@/src/contexts/AuthContext";

export default function Home() {
   const router = useRouter();
   
  const { isLoading, setLoading } = useLoading();
  const { userState } = handleUserState();
  console.log(userState);

  useEffect(() => {
    if (!isLoading && userState !== "Signed In") {
      router.push("/login");
    }
  }, [isLoading, userState, router]);

  if (isLoading) {
    return <Loading />;
  }

  if (userState === "Signed In") {
    return <HomeComponent />;
  }

  return <Loading />;
}
