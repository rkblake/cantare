'use client';
// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "../context/PlayerContext";
import Player from "../components/Player";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });
//
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "Music Player",
//   description: "Remote Music Streaming Player",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply basic dark mode styles to the body */}
      <body className="bg-gray-900 text-gray-100 font-sans antialiased">
        {/* Wrap the entire application with the Player Provider */}
        <PlayerProvider>
          <div className="flex min-h-screen">
            {/* Sidebar - Fixed width, takes full height */}
            {/* The padding-bottom here matches the assumed player height to prevent content overlap */}
            <aside className="w-64 bg-gray-800 text-gray-200 flex flex-col p-4 min-h-screen pb-24">
            </aside>

            {/* Main Content Area - Takes remaining width, scrollable */}
            <main className="flex-grow p-6 pb-24 overflow-y-auto">
              {children} {/* This is where the specific page content will be rendered */}
            </main>
          </div>

          {/* Player Bar - Fixed at the bottom */}
          <div className="fixed bottom-0 left-0 right-0 h-24"> {/* Give it a fixed height for layout */}
            <Player />
          </div>

        </PlayerProvider>
      </body>
    </html>
  );
}
