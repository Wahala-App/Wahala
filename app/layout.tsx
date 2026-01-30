"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../src/contexts/AuthContext";
import { ThemeProvider } from "../src/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({ children }: { children: React.ReactNode }) {
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
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

