// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/context/PlayerContext";
import Player from "@/components/Player";
// import { ResolvingMetadata } from "next";
import Link from "next/link";
import PlaylistSidebar from "@/components/PlaylistSidebar";
import { HomeIcon, MagnifyingGlassIcon, CircleStackIcon, UserGroupIcon } from "@heroicons/react/24/outline";

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
//


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head><title>Cantare</title></head>
      {/* Apply basic dark mode styles to the body */}
      <body className="bg-gray-900 text-gray-100 font-sans antialiased">
        {/* Wrap the entire application with the Player Provider */}
        <PlayerProvider>
          <div className="flex min-h-screen">
            {/* Sidebar - Fixed width, takes full height */}
            {/* The padding-bottom here matches the assumed player height to prevent content overlap */}
            <aside className="w-64 bg-gray-900 text-gray-200 min-w-1/5">
              <div className="sticky top-0 flex flex-col p-4 min-h-screen pb-24 space-y-4">
                <div className="space-y-4 bg-gray-800 rounded-md p-4">
                  <h2 className="text-lg font-bold text-white">Browse</h2>
                  <nav className="space-y-2">
                    <Link href="/" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                      <HomeIcon className="h-6 w-6" />
                      <span>Home</span>
                    </Link>
                    <Link href="/search" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                      <MagnifyingGlassIcon className="h-6 w-6" />
                      <span>Search</span>
                    </Link>
                  </nav>
                </div>

                <div className="space-y-4 bg-gray-800 rounded-md p-4">
                  <h2 className="text-lg font-bold text-white">Your Library</h2>
                  <nav className="space-y-2">
                    <Link href="/library/albums" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                      <CircleStackIcon className="h-6 w-6" />
                      <span>Albums</span>
                    </Link>
                    <Link href="/library/artists" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                      <UserGroupIcon className="h-6 w-6" />
                      <span>Artists</span>
                    </Link>
                  </nav>
                </div>

                <PlaylistSidebar />

                <div className="h-16" />
              </div>


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
