import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import RemoteSystemProvider from "@/components/remote-system-provider"
import { StorageInitializer } from "@/components/storage-initializer"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#004A9F" },
    { media: "(prefers-color-scheme: dark)", color: "#002D5F" },
  ],
}

export const metadata: Metadata = {
  title: "Ecobank Onmi Lite Express",
  description: "Ecobank Express Mobile - Seamless Pan-African Banking Experience",
  generator: "Next.js",
  manifest: "/manifest.json",
  applicationName: "Ecobank Onmi Lite Express",
  keywords: ["banking", "mobile banking", "ecobank", "africa", "finance", "money transfer"],
  authors: [{ name: "Ecobank" }],
  creator: "Ecobank",
  publisher: "Ecobank",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Express Lite",
    startupImage: [
      {
        url: "/icon-512.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon-192.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#004A9F",
    "msapplication-tap-highlight": "no",
  },
}

// PWA Service Worker Registration and Fullscreen Mode Script
const PWAScript = `
  (function() {
    // Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", function() {
        navigator.serviceWorker
          .register("/sw.js")
          .then(function(registration) {
            console.log("[Ecobank Express] Service Worker registered successfully:", registration.scope);
            
            // Check for updates
            registration.addEventListener("updatefound", function() {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", function() {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("[Ecobank Express] New version available!");
                  }
                });
              }
            });
          })
          .catch(function(error) {
            console.log("[Ecobank Express] Service Worker registration failed:", error?.message);
          });
      });
    }

    // Automatic Fullscreen Mode
    function requestFullscreen() {
      var elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(function(err) {
          console.log("[Ecobank Express] Fullscreen request failed:", err.message);
        });
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      }
    }

    // Check if running as installed PWA
    function isStandalone() {
      return window.matchMedia("(display-mode: standalone)").matches ||
             window.matchMedia("(display-mode: fullscreen)").matches ||
             window.navigator.standalone === true ||
             document.referrer.includes("android-app://");
    }

    // Auto fullscreen on first user interaction (required by browsers)
    function setupAutoFullscreen() {
      if (isStandalone()) {
        // Already in standalone/fullscreen mode from PWA
        console.log("[Ecobank Express] Running in standalone mode");
        return;
      }

      var fullscreenTriggered = sessionStorage.getItem("fullscreenTriggered");
      
      if (!fullscreenTriggered) {
        var triggerFullscreen = function() {
          requestFullscreen();
          sessionStorage.setItem("fullscreenTriggered", "true");
          document.removeEventListener("click", triggerFullscreen);
          document.removeEventListener("touchstart", triggerFullscreen);
        };

        // Trigger fullscreen on first user interaction
        document.addEventListener("click", triggerFullscreen, { once: true });
        document.addEventListener("touchstart", triggerFullscreen, { once: true });
      }
    }

    // Handle fullscreen change events
    function handleFullscreenChange() {
      var isFullscreen = document.fullscreenElement || 
                         document.webkitFullscreenElement || 
                         document.mozFullScreenElement || 
                         document.msFullscreenElement;
      
      if (isFullscreen) {
        document.body.classList.add("fullscreen-mode");
        console.log("[Ecobank Express] Entered fullscreen mode");
      } else {
        document.body.classList.remove("fullscreen-mode");
        console.log("[Ecobank Express] Exited fullscreen mode");
      }
    }

    // Lock screen orientation to portrait
    function lockOrientation() {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("portrait-primary").catch(function(err) {
          console.log("[Ecobank Express] Orientation lock not supported:", err.message);
        });
      }
    }

    // Initialize on DOM ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function() {
        setupAutoFullscreen();
        lockOrientation();
      });
    } else {
      setupAutoFullscreen();
      lockOrientation();
    }

    // Listen for fullscreen changes
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // Handle display mode changes
    window.matchMedia("(display-mode: standalone)").addEventListener("change", function(e) {
      if (e.matches) {
        console.log("[Ecobank Express] App is now running in standalone mode");
      }
    });

    // Prevent pull-to-refresh on mobile
    if (document.body) {
      document.body.style.overscrollBehavior = "none";
    }
  })();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="icon" type="image/svg+xml" sizes="192x192" href="/icon-192.svg" />
        <link rel="icon" type="image/svg+xml" sizes="512x512" href="/icon-512.svg" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Express Lite" />
        <meta name="application-name" content="Ecobank Onmi Lite Express" />
        <meta name="screen-orientation" content="portrait" />
        <meta name="full-screen" content="yes" />
        <meta name="browsermode" content="application" />
        <meta name="nightmode" content="enable" />
        <meta name="layoutmode" content="fitscreen" />
        <meta name="imagemode" content="force" />

        <script dangerouslySetInnerHTML={{ __html: PWAScript }} />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <RemoteSystemProvider>
          <StorageInitializer />
          {children}
        </RemoteSystemProvider>
      </body>
    </html>
  )
}
