"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../src/contexts/AuthContext";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ 
  children,
  modal,
}: { 
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  // Register service worker for Firebase Cloud Messaging
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });
    }
  }, []);

  return (
    <html>
      <head>
        {/* Apply saved theme before React renders to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='themeChoice';var v=localStorage.getItem(k);var r=document.documentElement;if(v==='light'||v==='dark'){r.setAttribute('data-theme',v);}else{r.removeAttribute('data-theme');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            {modal}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}