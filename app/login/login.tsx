import TextInput from "@/app/ui/TextInput";
import {Button, SocialButton} from "@/app/ui/button";
import Image from "next/image";

export default function LoginComponent() {
    return (
        <>
            <div className="text-4xl font-bold mb-8"> {/*Line by Itself*/}
                Sign Up
            </div>

            <div className="text-xl font-black mb-8">
                Welcome to Wahala! Knowledge lights the way to safety
            </div>

            <div className="grid grid-cols-2 gap-4">
                <TextInput title={"Email Address"} type={"email"} placeholder={"Email Address"} />
                <TextInput title={"Password"} type={"password"} placeholder={"Password"} />
            </div>

            <div className="mb-8">
                <Button type="submit" className={"rounded-3xl"}>Create Account</Button>
            </div>

            <div>
                Already have an account? {/*Wrap with link to something*/}Log In
            </div>

            <div className="flex gap-15 mt-6">
                <SocialButton>
                    <Image src={"/google.svg"} alt={"Google Logo"} width={30} height={25} />
                </SocialButton>
                <SocialButton>
                    <Image src={"/apple.svg"} alt={"Apple Logo"}  width={30} height={25}/>
                </SocialButton>
                <SocialButton>
                    <Image src={"/facebook.svg"} alt={"Facebook Logo"} width={30} height={25}/>
                </SocialButton>
            </div>
        </>
    );
}