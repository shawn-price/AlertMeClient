"use client"

import { useEffect, useState } from "react"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      onComplete()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  useEffect(() => {
    // Install PWA prompt handling
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.log("[v0] Service Worker registration failed:", error)
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-[#0072C6] to-[#00B2A9] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-gentle"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-gentle"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center animate-fade-in">
        {/* Logo/Icon area */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-2xl">
            <div className="text-white text-4xl font-bold">E</div>
          </div>
        </div>

        {/* Main text */}
        <h1 className="text-white text-5xl font-bold mb-3 tracking-tight text-balance">Ecobank</h1>
        <p className="text-white/90 text-xl font-light mb-12">The Pan African Bank</p>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce-subtle"></div>
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce-subtle"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce-subtle"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        )}
      </div>
    </div>
  )
}
