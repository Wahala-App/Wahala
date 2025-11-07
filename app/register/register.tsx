"use client"

import {TitledTextInput} from "@/app/ui/TextInput";
import {PillButton, RoundIconButton} from "@/app/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {useState} from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import {login, signup } from "@/app/actions/auth";
import { appendSegmentCacheKeyPart } from "next/dist/shared/lib/segment-cache/segment-value-encoding";
export default function SignUpComponent() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const router = useRouter();

    
    const handleRegister = async () => {
        setErrorMessage("");
        
        if (password.length < 6) {
            setErrorMessage("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }
       
        console.log(firstName)
        console.log(lastName)
        console.log(email)
        console.log(password)
       await signup(firstName, lastName, email, password);
        
       

        console.log("Successfully registered!");
        router.push("/login");
    }

    return (
        <div className={"px-5 py-4"}>
            <div className="text-4xl font-bold mb-8">
                {" "}
                Sign Up
            </div>

            <div className="text-xl font-black mb-8">
                Welcome to Wahala! Knowledge lights the way to safety
            </div>

            <div className="grid sm:grid-cols-1 mb-4">
                <TitledTextInput
                    className={"mb-4"}
                    title={"First Name"}
                    type={"text"}
                    placeholder={"First Name"}
                    onChange={(e) => setFirstName(e.target.value)}
                />
                <TitledTextInput
                    className={"mb-4"}
                    title={"Last Name"}
                    type={"text"}
                    placeholder={"Last Name"}
                    onChange={(e) => setLastName(e.target.value)}
                />
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
                <TitledTextInput
                    className={"mb-4"}
                    title={"Confirm Password"}
                    type={"password"}
                    placeholder={"Confirm Password"}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    onClick={handleRegister}
                >
                    Create Account
                </PillButton>
            </div>

            <div>
                Already have an account? <u><a href={"/login"}> Login.</a></u>
            </div>
22
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
