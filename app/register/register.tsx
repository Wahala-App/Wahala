"use client"

import {TitledTextInput} from "@/app/ui/TextInput";
import {PillButton, RoundIconButton} from "@/app/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {useState} from "react";
import { signup } from "@/app/actions/auth";

export default function SignUpComponent() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [userName, setUserName] = useState("");
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
       
        await signup(email, password);
        localStorage.setItem('pendingVerification', JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        userName: userName
        }));
        console.log("Successfully registered on firebase!");
        router.push("/verify");
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
                    className={"mb-2"}
                    title={"First Name"}
                    type={"text"}
                    placeholder={"First Name"}
                    onChange={(e) => setFirstName(e.target.value)}
                />
                <TitledTextInput
                    className={"mb-2"}
                    title={"Last Name"}
                    type={"text"}
                    placeholder={"Last Name"}
                    onChange={(e) => setLastName(e.target.value)}
                />
                <TitledTextInput
                    className={"mb-4"}
                    title={"User Name"}
                    type={"text"}
                    placeholder={"User Name"}
                    onChange={(e) => setUserName(e.target.value)}
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

          
        </div>
    );
}
