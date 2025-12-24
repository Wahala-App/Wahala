"use client";

import { TitledTextInput } from "@/app/ui/TextInput";
import { PillButton, RoundIconButton } from "@/app/ui/button";
import Image from "next/image";
import { login } from "@/app/actions/auth";
import { useLoading, handleUserState } from "@/src/contexts/AuthContext";

import { useRouter } from "next/navigation";
import {useState} from "react";

export default function LoginComponent() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const { isLoading, setLoading } = useLoading();
  const { userState, setUserState } = handleUserState();
  
    const handleLogin = async () => {
        if (!isLoading) {
            setLoading(true);
            try{
                if (!email.endsWith(".com")) {
                    setErrorMessage("Please enter a valid email");
                    return;
                }

                if (password.length < 6) {
                    setErrorMessage("Password must be at least 6 characters");
                    return;
                }

                if (email.trim() === "" || password.trim() === "") {
                    throw {type:"fill", message: "Please fill in all required fields."}
                }

                await login(email, password);
                
                setUserState("Signed In")
                router.push("/");
            } catch (err: any) {
                if (err.type =="verify") {
                    router.push("/verify");
                    return;
                }
            
                console.log("Handle Login Err", err);
            } finally {
                setLoading(false);
            }
        }
    };

  return (
    <div className={"px-5 py-4"}>
      <div className="text-4xl font-bold mb-8">
        {" "}
        Log In
      </div>

      <div className="text-xl font-black mb-8">
        Welcome to Wahala! Knowledge lights the way to safety
      </div>

      <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <TitledTextInput
          className={"mb-4"}
          title={"Email Address"}
          type={"email"}
          placeholder={"Email Address"}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TitledTextInput
          className={"mb-4"}
          title={"Password"}
          type={"password"}
          placeholder={"Password"}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {
          errorMessage !== "" &&
          <div className={"text-red-400 mb-2"}>{errorMessage}</div>
      }

      <div className="mb-8">
        <PillButton
          type="submit"
          className={"rounded-3xl"}
          onClick={handleLogin}
          disabled={isLoading}
        >
          Login
        </PillButton>
      </div>

      <div>
          Don't have an account? <u><a href={"/register"}> Create Account.</a></u>
      </div>

      <div className="flex gap-15 mt-6">
        <RoundIconButton>
          <Image
            src={"/socialMedia/google.svg"}
            alt={"Google Logo"}
            width={30}
            height={30}
          />
        </RoundIconButton>
        <RoundIconButton className="dark:invert">
          <Image
              src={"/socialMedia/apple.svg"}
              alt={"Apple Logo"}
              width={30}
              height={30}
          />
        </RoundIconButton>
        <RoundIconButton>
          <Image
            src={"/socialMedia/facebook.svg"}
            alt={"Facebook Logo"}
            width={30}
            height={30}
          />
        </RoundIconButton>
      </div>
    </div>
  );
}
