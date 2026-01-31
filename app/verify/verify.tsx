"use client"

import { PillButton } from "@/app/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkEmailVerification } from "@/app/actions/auth";

export default function VerifyEmailComponent() {
    const [isVerifying, setIsVerifying] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter();
    
    const handleVerification = async () => {
        setIsVerifying(true);
        setErrorMessage("");
        
        try {
            console.log("Attempting email verification...");
             const pendingVerification = localStorage.getItem('pendingVerification');
             if (pendingVerification) {
                const userData = JSON.parse(pendingVerification);

                await checkEmailVerification(userData.firstName, userData.lastName, userData.userName);
                router.push("/login");
            }
            else {
                throw new Error("No pending verification data found.");
            }
        } catch (error) {
            console.log("Verification failed:", error);
            setIsVerifying(false);
            setErrorMessage("Email not verified yet. Please check your inbox.");
        }
    }

    return (
        <div className="px-5 py-4">
            {/* Icon */}
            <div className="flex justify-center mb-8">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all hover:bg-white hover:border-2 group border-2 border-transparent" style={{ backgroundColor: '#fed500', borderColor: 'transparent' }}>
                    <svg 
                        className="w-10 h-10 text-white group-hover:text-[#fed500] transition-colors" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        style={{ borderColor: '#fed500' }}
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M5 13l4 4L19 7" 
                        />
                    </svg>
                </div>
            </div>

            {/* Title */}
            <div className="text-4xl font-bold mb-8 text-center" style={{ color: '#fed500' }}>
                Verify Your Email
            </div>

            {/* Subtitle */}
            <div className="text-xl font-black mb-8 text-center">
                We've sent a verification link to your inbox
            </div>

            {/* Description */}
            <div className="mb-8 text-center">
                Please check your inbox and click the link to verify your email address.
            </div>

            {/* Instructions Card */}
            <div className="mb-8 text-center">
                After verifying, return to this page and click the button below.
            </div>

            {/* Error Message */}
            {errorMessage !== "" && (
                <div className="text-red-400 mb-4 text-center">
                    {errorMessage}
                    <br />
                    If not please try registering again.
                </div>
            )}

            {/* Verification Button */}
            <div className="mb-8 flex justify-center">
                <PillButton
                    onClick={handleVerification}
                    disabled={isVerifying}
                    className="rounded-3xl hover:!bg-white hover:!text-[#fed500] transition-colors border-2 hover:!border-[#fed500]"
                    style={{ backgroundColor: '#fed500', color: 'white', borderColor: '#fed500' }}
                >
                    {isVerifying ? "Verifying..." : "I've Verified"}
                </PillButton>
            </div>

            {/* Back to Login Link */}
            <div className="text-center">
                <a 
                    href="/register" 
                    className="text-black hover:text-white transition-all border-2 border-black hover:bg-black px-4 py-2 rounded-3xl inline-block"
                >
                    ← Back to Create Account
                </a>
            </div>
        </div>
    );
}