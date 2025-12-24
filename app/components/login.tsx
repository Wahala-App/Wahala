// 'use client';

// import { TitledTextInput } from "@/app/ui/TextInput";
// import { PillButton, RoundIconButton } from "@/app/ui/button";
// import Image from "next/image";
// import { login } from "@/app/actions/auth";
// import { useLoading, handleUserState} from "@/src/contexts/AuthContext";
// import { useRouter } from "next/navigation";
// import { useState } from "react";

// export default function LoginComponent() {
//   const router = useRouter();
//   const { setLoading } = useLoading(); // ← from your context
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [errorMessage, setErrorMessage] = useState("");
//   const {setUserState} = handleUserState();

//   const handleLogin = async () => {
//     setErrorMessage("");
//     setLoading(true);

//     try {
//       // --- Client validation ---
//       if (!email.includes("@") || !email.endsWith(".com")) {
//         setErrorMessage("Please enter a valid email");
//         return;
//       }
//       if (password.length < 6) {
//         setErrorMessage("Password must be at least 6 characters");
//         return;
//       }
//       if (!email.trim() || !password.trim()) {
//         setErrorMessage("Please fill in all fields");
//         return;
//       }

//       // --- Call server action ---
//       await login(email, password);
//       setUserState("Signed In");

//       router.push("/");
//     } catch (err: any) {
//       if (err.type === "verify") {
//         router.push("/verify");
//         return;
//       }
//       setErrorMessage(err.message || "Login failed. Try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="px-5 py-4">
//       <div className="text-4xl font-bold mb-8">Log In</div>
//       <div className="text-xl font-black mb-8">
//         Welcome to Wahala! Knowledge lights the way to safety
//       </div>

//       <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
//         <TitledTextInput
//           title="Email Address"
//           type="email"
//           placeholder="Email Address"
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <TitledTextInput
//           title="Password"
//           type="password"
//           placeholder="Password"
//           onChange={(e) => setPassword(e.target.value)}
//         />
//       </div>

//       {errorMessage && <div className="text-red-400 mb-2">{errorMessage}</div>}

//       <div className="mb-8">
//         <PillButton className="rounded-3xl" onClick={handleLogin}>
//           Login
//         </PillButton>
//       </div>

//       <div>
//         Don't have an account? <a href="/register" className="underline">Create Account.</a>
//       </div>

//       <div className="flex gap-4 mt-6 justify-center">
//         <RoundIconButton>
//           <Image src="/socialMedia/google.svg" alt="Google" width={30} height={30} />
//         </RoundIconButton>
//         <RoundIconButton className="dark:invert">
//           <Image src="/socialMedia/apple.svg" alt="Apple" width={30} height={30} />
//         </RoundIconButton>
//         <RoundIconButton>
//           <Image src="/socialMedia/facebook.svg" alt="Facebook" width={30} height={30} />
//         </RoundIconButton>
//       </div>
//     </div>
//   );
// }