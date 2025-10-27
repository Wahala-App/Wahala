"use client";

import { TitledTextInput } from "@/app/ui/TextInput";
import { PillButton, DefaultButton, ButtonProps } from "@/app/ui/button";
import Image from "next/image";
import clsx from "clsx";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginComponent() {
  const { login } = useAuth();
  const router = useRouter();

  const handleCreateAccount = () => {
    login();
    router.push("/");
  };

  return (
    <>
      <div className="text-4xl font-bold mb-8">
        {" "}
        {/*Line by Itself*/}
        Sign Up
      </div>

      <div className="text-xl font-black mb-8">
        Welcome to Wahala! Knowledge lights the way to safety
      </div>

      <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4">
        <TitledTextInput
          title={"Email Address"}
          type={"email"}
          placeholder={"Email Address"}
        />
        <TitledTextInput
          title={"Password"}
          type={"password"}
          placeholder={"Password"}
        />
      </div>

      <div className="mb-8">
        <PillButton
          type="submit"
          className={"rounded-3xl"}
          onClick={handleCreateAccount}
        >
          Create Account
        </PillButton>
      </div>

      <div>
        Already have an account? {/*Wrap with link to something*/}Log In
      </div>

      <div className="flex gap-15 mt-6">
        <RoundIconLoginButton>
          <Image
            src={"/socialMedia/google.svg"}
            alt={"Google Logo"}
            width={30}
            height={25}
          />
        </RoundIconLoginButton>
        <RoundIconLoginButton className="dark:invert">
          <Image src={"/socialMedia/apple.svg"} alt={"Apple Logo"} width={30} height={25} />
        </RoundIconLoginButton>
        <RoundIconLoginButton>
          <Image
            src={"/socialMedia/facebook.svg"}
            alt={"Facebook Logo"}
            width={30}
            height={25}
          />
        </RoundIconLoginButton>
      </div>
    </>
  );
}

function RoundIconLoginButton({
  children,
  className,
  ...otherProps
}: ButtonProps) {
  return (
    <DefaultButton
      {...otherProps}
      className={clsx(
        className,
        "w-12 h-12 rounded-full hover:bg-hover flex items-center justify-center text-lg",
      )}
    >
      {children}
    </DefaultButton>
  );
}
