import { useEffect, useRef, useCallback } from "react"

export function useNetworkTapDetector(onSecretPanelOpen: () => void, tapThreshold: number = 5) {
  const tapCountRef = useRef(0)
  const lastTapTimeRef = useRef(0)
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTapCounter = useCallback(() => {
    tapCountRef.current = 0
  }, [])

  const handleNetworkIndicatorTap = useCallback(() => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapTimeRef.current

    // Reset if more than 2 seconds have passed
    if (timeSinceLastTap > 2000) {
      tapCountRef.current = 0
    }

    tapCountRef.current++
    lastTapTimeRef.current = now

    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current)
    }

    // If 5 taps detected, open secret panel
    if (tapCountRef.current >= tapThreshold) {
      onSecretPanelOpen()
      resetTapCounter()

      // Haptic feedback if available
      if ("vibrate" in navigator) {
        navigator.vibrate([10, 50, 10])
      }
    } else {
      // Reset counter after 2 seconds of inactivity
      tapTimeoutRef.current = setTimeout(resetTapCounter, 2000)
    }
  }, [onSecretPanelOpen, tapThreshold, resetTapCounter])

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current)
      }
    }
  }, [])

  return {
    handleNetworkIndicatorTap,
    tapCount: tapCountRef.current,
  }
}
